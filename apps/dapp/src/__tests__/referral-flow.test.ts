import { prisma } from '../lib/db';
import { logReferralVisit, applyReferral, validateReferralCode } from '../services/referral.service';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

describe('Referral Flow Logic', () => {
    let testReferrerId: string;
    const testCode = 'TESTCODE';

    beforeEach(async () => {
        // Create a test user as referrer
        const referrer = await prisma.user.upsert({
            where: { handle: '@tester_referrer' },
            update: {},
            create: {
                handle: '@tester_referrer',
                email: 'referrer@test.com',
                referralCode: testCode,
            }
        });
        testReferrerId = referrer.id;
    });

    it('should log a referral visit', async () => {
        const visitId = await logReferralVisit({
            code: testCode,
            referrerId: testReferrerId,
            utmSource: 'twitter',
            utmMedium: 'social'
        });

        const visit = await prisma.referralVisit.findUnique({
            where: { id: visitId }
        });

        expect(visit).toBeDefined();
        expect(visit?.code).toBe(testCode);
        expect(visit?.utmSource).toBe('twitter');
        expect(visit?.converted).toBe(false);
    });

    it('should convert the latest visit when referral is applied', async () => {
        // 1. Log a visit
        await logReferralVisit({
            code: testCode,
            referrerId: testReferrerId,
            utmSource: 'google'
        });

        // 2. Create a new user (referee)
        const referee = await prisma.user.create({
            data: {
                handle: '@tester_referee',
                email: 'referee@test.com',
            }
        });

        // 3. Apply referral
        await applyReferral(referee.id, testReferrerId);

        // 4. Verify user is linked
        const updatedReferee = await prisma.user.findUnique({
            where: { id: referee.id }
        });
        expect(updatedReferee?.referredById).toBe(testReferrerId);

        // 5. Verify visit is marked as converted
        const visit = await prisma.referralVisit.findFirst({
            where: { refereeId: referee.id }
        });
        expect(visit?.converted).toBe(true);
        expect(visit?.utmSource).toBe('google');
    });

    it('should validate referral codes correctly', async () => {
        const validResult = await validateReferralCode(testCode);
        expect(validResult.valid).toBe(true);
        expect(validResult.referrer?.id).toBe(testReferrerId);

        const invalidResult = await validateReferralCode('INVALIDX');
        expect(invalidResult.valid).toBe(false);
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.referralVisit.deleteMany({
            where: { code: testCode }
        });
        await prisma.user.deleteMany({
            where: { email: { in: ['referrer@test.com', 'referee@test.com'] } }
        });
    });
});
