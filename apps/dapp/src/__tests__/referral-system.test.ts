import { generateReferralCode, generateReferralLink, validateReferralCode } from '../services/referral.service';
import { prisma } from '../lib/db';

// Mock Prisma
jest.mock('../lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            $transaction: jest.fn(),
        }
    }
}));

describe('Referral System Integrity Tests', () => {

    describe('Code Generation', () => {
        it('should generate an 8-character uppercase alphanumeric code', () => {
            const code = generateReferralCode();
            expect(code).toHaveLength(8);
            expect(code).toMatch(/^[A-Z2-9]+$/);
        });

        it('should exclude confusing characters (I, O, 0, 1)', () => {
            for (let i = 0; i < 100; i++) {
                const code = generateReferralCode();
                expect(code).not.toMatch(/[IO01]/);
            }
        });
    });

    describe('Link Generation', () => {
        it('should use the clean /ref/ URL format with playtrenches.xyz domain', () => {
            const code = 'ABCDEF12';
            const link = generateReferralLink(code);
            expect(link).toBe('https://playtrenches.xyz/ref/ABCDEF12');
        });
    });

    describe('Validation Logic', () => {
        it('should return invalid for wrong length codes', async () => {
            const result = await validateReferralCode('SHORT');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid referral code format');
        });

        it('should find and return the referrer for a valid code', async () => {
            const mockReferrer = { id: 'ref-123', handle: '@commander' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockReferrer);

            const result = await validateReferralCode('VAL1D234');
            expect(result.valid).toBe(true);
            expect(result.referrer).toEqual(mockReferrer);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { referralCode: 'VAL1D234' },
                select: { id: true, handle: true }
            });
        });

        it('should handle case-insensitivity by uppercasing the input', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            await validateReferralCode('abcdef12');
            expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { referralCode: 'ABCDEF12' }
            }));
        });
    });
});
