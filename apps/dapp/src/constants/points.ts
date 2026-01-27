/**
 * Boost Points Constants
 *
 * Default rewards for various activities. Admins can override these
 * by setting custom reward values on individual tasks/raids.
 */
export const POINTS = {
    /** Default BP awarded for completing a task (admin can override via task.reward) */
    TASK_REWARD: 10,

    /** BP awarded when admin approves content submission */
    CONTENT_REWARD: 60,

    /** Default BP awarded for completing a raid (admin can override via raid.reward) */
    RAID_REWARD: 5,

    /** Conversion rate: 1 BP = 1 minute off payout time */
    BP_TO_MINUTES: 1,
} as const;
