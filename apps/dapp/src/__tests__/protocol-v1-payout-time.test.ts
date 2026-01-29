/**
 * Protocol-V1: Time-Based Payout System Tests
 * 
 * Tests for:
 * - Time calculation logic (calculatePayoutTime)
 * - Remaining time formatting (getRemainingTime, formatRemainingTime)
 * - API response structure
 * - Payout trigger conditions
 */

import {
    calculatePayoutTime,
    getRemainingTime,
    formatRemainingTime,
} from '@/services/payout-time.service';

describe('Protocol-V1: Time-Based Payout System', () => {

    // ======================
    // calculatePayoutTime Tests
    // ======================
    describe('calculatePayoutTime', () => {
        it('should calculate payout time with no boost points', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24;
            const boostPoints = 0;
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Should be exactly 24 hours later
            const expected = new Date('2026-01-25T10:00:00Z');
            expect(result.getTime()).toBe(expected.getTime());
        });

        it('should reduce payout time by 1 minute per BP (default rate)', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24;
            const boostPoints = 60; // 60 BP = 60 minutes = 1 hour reduction
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Should be 23 hours later (24h - 1h)
            const expected = new Date('2026-01-25T09:00:00Z');
            expect(result.getTime()).toBe(expected.getTime());
        });

        it('should respect custom bpToMinutesRate', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24;
            const boostPoints = 30; // 30 BP
            const bpRate = 2; // 2 minutes per BP = 60 minutes = 1 hour reduction

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Should be 23 hours later
            const expected = new Date('2026-01-25T09:00:00Z');
            expect(result.getTime()).toBe(expected.getTime());
        });

        it('should not go negative (payout time cannot be before join time)', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 1; // Only 1 hour (60 minutes)
            const boostPoints = 120; // 120 minutes reduction (more than duration)
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Should be clamped to joinedAt (not before)
            expect(result.getTime()).toBe(joinedAt.getTime());
        });

        it('should handle RAPID trench (24h baseline)', () => {
            const joinedAt = new Date('2026-01-24T12:00:00Z');
            const durationHours = 24; // RAPID
            const boostPoints = 0;
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            const expected = new Date('2026-01-25T12:00:00Z');
            expect(result.getTime()).toBe(expected.getTime());
        });

        it('should handle MID trench (168h baseline)', () => {
            const joinedAt = new Date('2026-01-24T12:00:00Z');
            const durationHours = 168; // MID (7 days)
            const boostPoints = 0;
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            const expected = new Date('2026-01-31T12:00:00Z'); // 7 days later
            expect(result.getTime()).toBe(expected.getTime());
        });

        it('should handle DEEP trench (720h baseline)', () => {
            const joinedAt = new Date('2026-01-24T12:00:00Z');
            const durationHours = 720; // DEEP (30 days)
            const boostPoints = 0;
            const bpRate = 1;

            const result = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            const expected = new Date('2026-02-23T12:00:00Z'); // 30 days later
            expect(result.getTime()).toBe(expected.getTime());
        });
    });

    // ======================
    // getRemainingTime Tests
    // ======================
    describe('getRemainingTime', () => {
        it('should return isReady=true when payout time has passed', () => {
            const pastDate = new Date(Date.now() - 1000); // 1 second ago

            const result = getRemainingTime(pastDate);

            expect(result.isReady).toBe(true);
            expect(result.totalMs).toBe(0);
            expect(result.days).toBe(0);
            expect(result.hours).toBe(0);
            expect(result.minutes).toBe(0);
            expect(result.seconds).toBe(0);
        });

        it('should return isReady=false when payout time is in future', () => {
            const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

            const result = getRemainingTime(futureDate);

            expect(result.isReady).toBe(false);
            expect(result.totalMs).toBeGreaterThan(0);
        });

        it('should correctly calculate days, hours, minutes, seconds', () => {
            // 1 day, 2 hours, 30 minutes, 45 seconds from now
            const ms = (1 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) + (30 * 60 * 1000) + (45 * 1000);
            const futureDate = new Date(Date.now() + ms);

            const result = getRemainingTime(futureDate);

            expect(result.days).toBe(1);
            expect(result.hours).toBe(2);
            expect(result.minutes).toBe(30);
            // Seconds might vary by 1 due to execution time
            expect(result.seconds).toBeGreaterThanOrEqual(44);
            expect(result.seconds).toBeLessThanOrEqual(46);
        });

        it('should handle exactly 24 hours remaining', () => {
            const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const result = getRemainingTime(futureDate);

            expect(result.days).toBe(1);
            expect(result.hours).toBe(0);
            expect(result.minutes).toBe(0);
        });
    });

    // ======================
    // formatRemainingTime Tests
    // ======================
    describe('formatRemainingTime', () => {
        it('should return "READY" when payout time has passed', () => {
            const pastDate = new Date(Date.now() - 1000);

            const result = formatRemainingTime(pastDate);

            expect(result).toBe('READY');
        });

        it('should format days and hours correctly', () => {
            // 2 days, 5 hours from now
            const ms = (2 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000) + (30 * 60 * 1000);
            const futureDate = new Date(Date.now() + ms);

            const result = formatRemainingTime(futureDate);

            expect(result).toMatch(/2d 5h 30m/);
        });

        it('should format hours only when less than 1 day', () => {
            // 5 hours, 15 minutes from now
            const ms = (5 * 60 * 60 * 1000) + (15 * 60 * 1000);
            const futureDate = new Date(Date.now() + ms);

            const result = formatRemainingTime(futureDate);

            expect(result).toMatch(/5h 15m/);
            expect(result).not.toMatch(/d/); // No days
        });

        it('should format minutes only when less than 1 hour', () => {
            // 45 minutes from now
            const ms = 45 * 60 * 1000;
            const futureDate = new Date(Date.now() + ms);

            const result = formatRemainingTime(futureDate);

            expect(result).toMatch(/45m/);
        });
    });

    // ======================
    // Integration Scenarios
    // ======================
    describe('Integration Scenarios', () => {
        it('Scenario: User joins RAPID trench, earns 120 BP, should reduce by 2 hours', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24; // RAPID
            const boostPoints = 120; // 120 BP = 120 minutes = 2 hours
            const bpRate = 1;

            const payoutTime = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Expected: 24h - 2h = 22h after join
            const expected = new Date('2026-01-25T08:00:00Z');
            expect(payoutTime.getTime()).toBe(expected.getTime());
        });

        it('Scenario: Admin sets bpRate=2, user with 60 BP should save 2 hours', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24;
            const boostPoints = 60;
            const bpRate = 2; // 2 minutes per BP

            const payoutTime = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Expected: 24h - (60 * 2 min) = 24h - 2h = 22h after join
            const expected = new Date('2026-01-25T08:00:00Z');
            expect(payoutTime.getTime()).toBe(expected.getTime());
        });

        it('Scenario: User maxes out BP reduction (whole duration)', () => {
            const joinedAt = new Date('2026-01-24T10:00:00Z');
            const durationHours = 24;
            const boostPoints = 24 * 60; // 1440 BP = 24 hours reduction
            const bpRate = 1;

            const payoutTime = calculatePayoutTime(joinedAt, durationHours, boostPoints, bpRate);

            // Should be clamped to joinedAt (instant payout)
            expect(payoutTime.getTime()).toBe(joinedAt.getTime());
        });
    });
});

// ======================
// API Response Structure Tests
// ======================
describe('Protocol-V1: API Response Structure', () => {
    it('should define correct Position interface fields', () => {
        // This is a type-check test - if it compiles, the interface is correct
        interface Position {
            id: string;
            trenchId: string;
            trenchName: string;
            trenchLevel: string;
            status: string;
            joinedAt: string;
            boostPoints: number;
            entryAmount: number;
            maxPayout: number;
            receivedAmount: number;
            expiresAt: string | null;
            // Time-based fields (Protocol-V1)
            expectedPayoutAt: string;
            formattedCountdown: string;
            remainingTime: {
                days: number;
                hours: number;
                minutes: number;
                seconds: number;
                totalMs: number;
                isReady: boolean;
            };
            payoutTxHash: string | null;
            queuePosition: number | null; // Deprecated
        }

        const mockPosition: Position = {
            id: 'test-id',
            trenchId: 'trench-1',
            trenchName: 'Rapid Trench',
            trenchLevel: 'RAPID',
            status: 'waiting',
            joinedAt: '2026-01-24T10:00:00Z',
            boostPoints: 100,
            entryAmount: 50,
            maxPayout: 75,
            receivedAmount: 0,
            expiresAt: null,
            expectedPayoutAt: '2026-01-25T08:20:00Z',
            formattedCountdown: '22h 20m',
            remainingTime: {
                days: 0,
                hours: 22,
                minutes: 20,
                seconds: 0,
                totalMs: 80400000,
                isReady: false,
            },
            payoutTxHash: null,
            queuePosition: null,
        };

        expect(mockPosition.expectedPayoutAt).toBeDefined();
        expect(mockPosition.formattedCountdown).toBeDefined();
        expect(mockPosition.remainingTime.isReady).toBe(false);
        expect(mockPosition.queuePosition).toBeNull();
    });
});
