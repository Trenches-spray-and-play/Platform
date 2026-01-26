import { prisma } from '@/lib/db';
import { addBoostPoints } from './queue.service';

/**
 * Belief Engine
 * 
 * Manages social contribution system:
 * - Post submissions
 * - Peer validations
 * - Belief score calculation
 * - Boost point awards
 */

const BOOST_PER_VALIDATION = 50;  // Boost awarded to validator
const MIN_BELIEF_REWARD = 5;      // Minimum belief points for endorsed content
const MAX_BELIEF_REWARD = 20;     // Maximum belief points
const MIN_ENDORSEMENTS_FOR_BELIEF = 3; // Minimum endorsements before belief awarded

export interface PostSubmissionParams {
    userId: string;
    platform: string;
    url: string;
    contentType: string;
}

export interface ValidationParams {
    postId: string;
    validatorId: string;
    rating: number;
    proofUrl?: string;
    endorsed: boolean;
}

/**
 * Submit content for review
 */
export async function submitPost(params: PostSubmissionParams) {
    const { userId, platform, url, contentType } = params;

    // Check for duplicate URL
    const existing = await prisma.postSubmission.findFirst({
        where: { url },
    });

    if (existing) {
        throw new Error('Content already submitted');
    }

    const post = await prisma.postSubmission.create({
        data: {
            userId,
            platform,
            url,
            contentType,
            status: 'pending',
        },
        include: {
            user: {
                select: {
                    id: true,
                    handle: true,
                    beliefScore: true,
                },
            },
        },
    });

    return post;
}

/**
 * Get posts available for validation (review pool)
 * Excludes user's own posts
 */
export async function getReviewPool(validatorId: string, limit: number = 10) {
    // Get posts that:
    // 1. Are pending review
    // 2. Not created by the validator
    // 3. Not already validated by this validator
    const posts = await prisma.postSubmission.findMany({
        where: {
            status: 'pending',
            userId: {
                not: validatorId, // Cannot review own content
            },
            validations: {
                none: {
                    validatorId, // Not already validated by this user
                },
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    handle: true,
                    beliefScore: true,
                },
            },
            validations: {
                select: {
                    id: true,
                    endorsed: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc', // Oldest first
        },
        take: limit,
    });

    return posts;
}

/**
 * Submit a validation (review) for a post
 */
export async function validatePost(params: ValidationParams) {
    const { postId, validatorId, rating, proofUrl, endorsed } = params;

    // Validate rating
    if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    // Check if validator exists and get their belief score
    const validator = await prisma.user.findUnique({
        where: { id: validatorId },
    });

    if (!validator) {
        throw new Error('Validator not found');
    }

    // Get the post  
    const post = await prisma.postSubmission.findUnique({
        where: { id: postId },
        include: { user: true },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Cannot validate own content
    if (post.userId === validatorId) {
        throw new Error('Cannot validate your own content');
    }

    // Calculate boost award for validator
    const boostAwarded = BOOST_PER_VALIDATION;

    // Create validation record
    const validation = await prisma.validation.create({
        data: {
            postId,
            validatorId,
            rating,
            proofUrl,
            endorsed,
            boostAwarded,
        },
    });

    // Award boost points to validator
    // Get an active trench participation for this validator
    const activeParticipation = await prisma.participant.findFirst({
        where: {
            userId: validatorId,
            status: 'active',
        },
    });

    if (activeParticipation) {
        await addBoostPoints(validatorId, activeParticipation.trenchId, boostAwarded);
    }

    // If endorsed, update endorsement count
    if (endorsed) {
        const updatedPost = await prisma.postSubmission.update({
            where: { id: postId },
            data: {
                endorsements: {
                    increment: 1,
                },
            },
        });

        // Check if post has enough endorsements for belief reward
        if (updatedPost.endorsements >= MIN_ENDORSEMENTS_FOR_BELIEF) {
            await awardBeliefPoints(post.userId, rating);

            // Update validation with belief awarded
            await prisma.validation.update({
                where: { id: validation.id },
                data: {
                    beliefAwarded: calculateBeliefReward(rating),
                },
            });
        }
    }

    return validation;
}

/**
 * Calculate belief reward based on rating
 */
function calculateBeliefReward(averageRating: number): number {
    // Linear scale from MIN to MAX based on rating
    const normalized = (averageRating - 1) / 4; // 0-1 scale
    return Math.floor(MIN_BELIEF_REWARD + normalized * (MAX_BELIEF_REWARD - MIN_BELIEF_REWARD));
}

/**
 * Award belief points to a user (permanent)
 */
export async function awardBeliefPoints(userId: string, rating: number) {
    const points = calculateBeliefReward(rating);

    await prisma.user.update({
        where: { id: userId },
        data: {
            beliefScore: {
                increment: points,
            },
        },
    });

    console.log(`Awarded ${points} belief points to user ${userId}`);
    return points;
}

/**
 * Get user's belief stats
 */
export async function getUserBeliefStats(userId: string) {
    const [user, postCount, validationCount] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                beliefScore: true,
            },
        }),
        prisma.postSubmission.count({
            where: { userId },
        }),
        prisma.validation.count({
            where: { validatorId: userId },
        }),
    ]);

    return {
        beliefScore: user?.beliefScore ?? 0,
        postsSubmitted: postCount,
        validationsGiven: validationCount,
    };
}

/**
 * Get leaderboard of top belief scores
 */
export async function getBeliefLeaderboard(limit: number = 20) {
    const users = await prisma.user.findMany({
        where: {
            beliefScore: {
                gt: 0,
            },
        },
        select: {
            id: true,
            handle: true,
            beliefScore: true,
        },
        orderBy: {
            beliefScore: 'desc',
        },
        take: limit,
    });

    return users;
}
