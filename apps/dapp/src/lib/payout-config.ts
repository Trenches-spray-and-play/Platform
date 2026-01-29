/**
 * Payout Configuration
 * 
 * Centralized configuration for the automated payout system.
 * Reads from environment variables with sensible defaults.
 */

export const payoutConfig = {
    // Batch size: max payouts per cron run (hard cap at 8 to fit 10s Vercel limit)
    batchSize: Math.min(parseInt(process.env.PAYOUT_BATCH_SIZE || '8'), 8),

    // Interval between payouts in seconds (min 0.5s to prevent RPC rate limits)
    intervalSeconds: Math.max(parseFloat(process.env.PAYOUT_INTERVAL_SECONDS || '1'), 0.5),

    // Whether to send Telegram alerts on successful batches
    alertOnSuccess: process.env.ALERT_ON_SUCCESS === 'true',

    // CRON_SECRET for authenticating cron requests (min 32 chars recommended)
    cronSecret: process.env.CRON_SECRET || '',

    // Telegram chat ID for payout alerts (separate from reorg alerts)
    alertChatId: process.env.TELEGRAM_ALERT_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '',

    // Optional IP allowlist for cron requests (comma-separated)
    // Cron-Job.org IPs: 52.207.207.143, 52.57.47.176, etc.
    allowedIps: process.env.CRON_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || [],

    // Retry configuration
    maxRetries: parseInt(process.env.PAYOUT_MAX_RETRIES || '2'),

    // Alert thresholds
    queueBackupThreshold: parseInt(process.env.QUEUE_BACKUP_THRESHOLD || '100'),
    lowBalanceThresholdUsd: parseFloat(process.env.LOW_BALANCE_THRESHOLD_USD || '1000'),
    cronMissedThresholdMinutes: parseInt(process.env.CRON_MISSED_THRESHOLD_MINUTES || '10'),

    // Rate limiting: minimum seconds between cron requests
    minCronIntervalSeconds: parseInt(process.env.MIN_CRON_INTERVAL_SECONDS || '30'),
} as const;

/**
 * Validate payout configuration at startup
 */
export function validatePayoutConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payoutConfig.cronSecret) {
        errors.push('CRON_SECRET is required');
    } else if (payoutConfig.cronSecret.length < 32) {
        errors.push('CRON_SECRET should be at least 32 characters');
    }

    if (!payoutConfig.alertChatId) {
        errors.push('TELEGRAM_ALERT_CHAT_ID is recommended for production');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get a human-readable summary of the payout config
 */
export function getPayoutConfigSummary(): Record<string, string | number | boolean> {
    return {
        batchSize: payoutConfig.batchSize,
        intervalSeconds: payoutConfig.intervalSeconds,
        maxRetries: payoutConfig.maxRetries,
        queueBackupThreshold: payoutConfig.queueBackupThreshold,
        lowBalanceThresholdUsd: payoutConfig.lowBalanceThresholdUsd,
        cronMissedThresholdMinutes: payoutConfig.cronMissedThresholdMinutes,
        alertOnSuccess: payoutConfig.alertOnSuccess,
        hasAllowedIps: payoutConfig.allowedIps.length > 0,
        hasCronSecret: !!payoutConfig.cronSecret,
    };
}
