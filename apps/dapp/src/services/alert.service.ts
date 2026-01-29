/**
 * Alert Service
 * 
 * Sends email alerts for critical platform events.
 */

import nodemailer from 'nodemailer';

interface PayoutFailureAlert {
    campaignName: string;
    tokenSymbol: string;
    amountRequired: number;
    vaultBalance: number;
    payoutId: string;
    recipientAddress: string;
}

// Create transporter (configure in production with real SMTP)
function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

/**
 * Send alert when payout fails due to insufficient funds
 */
export async function sendInsufficientFundsAlert(data: PayoutFailureAlert): Promise<boolean> {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;

    if (!adminEmail) {
        console.warn('ADMIN_ALERT_EMAIL not configured, skipping alert');
        return false;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured, skipping email alert');
        // Log to console as fallback
        console.error('🚨 PAYOUT FAILED - INSUFFICIENT FUNDS:', data);
        return false;
    }

    const subject = `⚠️ Payout Failed: Insufficient ${data.tokenSymbol} Funds`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">⚠️ Payout Failed</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Insufficient Funds in Settlement Wallet</p>
            </div>
            
            <div style="padding: 20px; background: #f5f5f5;">
                <h2 style="color: #333; margin-top: 0;">Campaign: ${data.campaignName}</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Amount Required</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #ff4444;">
                            ${data.amountRequired.toLocaleString()} ${data.tokenSymbol}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Vault Balance</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                            ${data.vaultBalance.toLocaleString()} ${data.tokenSymbol}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Shortfall</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #ff4444;">
                            ${(data.amountRequired - data.vaultBalance).toLocaleString()} ${data.tokenSymbol}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Payout ID</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-family: monospace;">
                            ${data.payoutId}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Recipient</strong></td>
                        <td style="padding: 10px; font-family: monospace; font-size: 12px;">
                            ${data.recipientAddress}
                        </td>
                    </tr>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px;">
                    <strong>⚠️ Action Required:</strong><br>
                    Add funds to the settlement wallet and resume payouts from the admin portal.
                </div>
            </div>
            
            <div style="padding: 15px; background: #333; color: #999; text-align: center; font-size: 12px;">
                Trenches Platform Alert System
            </div>
        </div>
    `;

    try {
        const transporter = getTransporter();

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: adminEmail,
            subject,
            html,
        });

        console.log(`Alert email sent to ${adminEmail}: ${subject}`);
        return true;
    } catch (error) {
        console.error('Failed to send alert email:', error);
        return false;
    }
}

/**
 * Log alert to database (for audit trail)
 */
export async function logAlert(type: string, data: Record<string, unknown>): Promise<void> {
    console.log(`[ALERT] ${type}:`, JSON.stringify(data, null, 2));
    // In production, could also write to a database alerts table
}

// ============================================================
// Address Book Email Notifications
// ============================================================

/**
 * Send confirmation email for new payout address
 */
export async function sendAddressConfirmationEmail(
    userEmail: string,
    address: string,
    token: string
): Promise<boolean> {
    if (!userEmail) {
        console.warn('No email for user, skipping address confirmation');
        return false;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP not configured, skipping address confirmation email');
        console.log(`Confirmation link: ${process.env.NEXT_PUBLIC_APP_URL}/api/user/addresses/confirm/${token}`);
        return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://playtrenches.xyz';
    const confirmLink = `${baseUrl}/api/user/addresses/confirm/${token}`;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    const subject = '🔐 Confirm your new Trenches payout address';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #00FF66, #00CC55); color: black; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Confirm Your Payout Address</h1>
            </div>
            
            <div style="padding: 20px; background: #1a1a1a; color: #fff;">
                <p>You're adding a new payout address to your Trenches account:</p>
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; font-family: monospace; margin: 15px 0;">
                    ${shortAddress}
                </div>
                
                <p>Click below to confirm this address:</p>
                
                <a href="${confirmLink}" style="display: block; background: #00FF66; color: black; text-decoration: none; padding: 15px 30px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0;">
                    Confirm Address
                </a>
                
                <div style="background: #333; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <strong>⏳ Security Notice:</strong><br>
                    After confirmation, there's a <strong>24-hour security hold</strong> before this address can receive payouts. This protects against unauthorized changes.
                </div>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    If you didn't request this, please ignore this email. The link expires in 7 days.
                </p>
            </div>
            
            <div style="padding: 15px; background: #333; color: #999; text-align: center; font-size: 12px;">
                Trenches Platform
            </div>
        </div>
    `;

    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: userEmail,
            subject,
            html,
        });
        console.log(`Address confirmation email sent to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Failed to send address confirmation email:', error);
        return false;
    }
}

// ============================================================
// Telegram Alerting for Reorg Events
// ============================================================

import { config } from '@/lib/config';

// Rate limiting: cache of key -> lastAlertTimestamp
const telegramAlertCache = new Map<string, number>();

/**
 * Send a Telegram message
 */
async function sendTelegramMessage(message: string): Promise<boolean> {
    const { telegramBotToken, telegramChatId } = config.alerts;

    if (!telegramBotToken || !telegramChatId) {
        console.warn('Telegram alerting not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID)');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Telegram API error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send Telegram alert:', error);
        return false;
    }
}

/**
 * Check if we should send an alert (rate limiting)
 */
function shouldSendTelegramAlert(key: string): boolean {
    const now = Date.now();
    const lastAlert = telegramAlertCache.get(key);

    if (lastAlert && (now - lastAlert) < config.alerts.alertCooldownMs) {
        return false;
    }

    telegramAlertCache.set(key, now);
    return true;
}

/**
 * Send alert when a deposit is reorged
 */
export async function sendReorgDetectedAlert(params: {
    depositId: string;
    txHash: string;
    amount: number;
    chain: string;
    userId: string;
}): Promise<void> {
    const key = `reorg:${params.depositId}`;
    if (!shouldSendTelegramAlert(key)) return;

    const message = `
🚨 <b>REORG DETECTED</b>

<b>Deposit ID:</b> <code>${params.depositId}</code>
<b>Amount:</b> $${params.amount.toFixed(2)}
<b>Chain:</b> ${params.chain}
<b>TX:</b> <code>${params.txHash.slice(0, 20)}...</code>
<b>User:</b> <code>${params.userId}</code>

Action required: Check admin dashboard for details.
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when manual review is required
 */
export async function sendReorgReviewAlert(params: {
    depositId: string;
    amount: number;
    chain: string;
    userId: string;
    reason: string;
}): Promise<void> {
    const key = `review:${params.depositId}`;
    if (!shouldSendTelegramAlert(key)) return;

    const message = `
⚠️ <b>REORG INCIDENT - REVIEW REQUIRED</b>

<b>Deposit ID:</b> <code>${params.depositId}</code>
<b>Amount:</b> $${params.amount.toFixed(2)}
<b>Chain:</b> ${params.chain}
<b>User:</b> <code>${params.userId}</code>
<b>Reason:</b> ${params.reason}

Manual resolution required via admin API.
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when reorg check fails (RPC issues)
 */
export async function sendReorgCheckFailureAlert(params: {
    chain: string;
    error: string;
    depositsAffected: number;
}): Promise<void> {
    const key = `failure:${params.chain}`;
    if (!shouldSendTelegramAlert(key)) return;

    const message = `
⚠️ <b>REORG CHECK FAILURE</b>

<b>Chain:</b> ${params.chain}
<b>Error:</b> ${params.error}
<b>Deposits affected:</b> ${params.depositsAffected}

RPC may be down or rate limited.
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send daily summary of reorg activity
 */
export async function sendReorgDailySummary(stats: {
    totalChecked: number;
    reorgsDetected: number;
    incidentsNeedingReview: number;
}): Promise<void> {
    if (stats.reorgsDetected === 0 && stats.incidentsNeedingReview === 0) {
        return; // No news is good news
    }

    const message = `
📊 <b>Daily Reorg Summary</b>

<b>Deposits Checked:</b> ${stats.totalChecked}
<b>Reorgs Detected:</b> ${stats.reorgsDetected}
<b>Pending Reviews:</b> ${stats.incidentsNeedingReview}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Test the Telegram connection
 */
export async function testTelegramConnection(): Promise<boolean> {
    return await sendTelegramMessage('🔔 Trenches Alert System: Connection test successful');
}

// ============================================================
// Payout Cron Alerting
// ============================================================

import { payoutConfig } from '@/lib/payout-config';

/**
 * Send alert when a single payout fails
 */
export async function sendPayoutFailedAlert(params: {
    payoutId: string;
    userId: string;
    userHandle?: string;
    amount: number;
    tokenSymbol: string;
    toAddress: string;
    error: string;
}): Promise<void> {
    const key = `payout_failed:${params.payoutId}`;
    if (!shouldSendTelegramAlert(key)) return;

    const shortAddress = `${params.toAddress.slice(0, 6)}...${params.toAddress.slice(-4)}`;
    const shortId = params.payoutId.slice(0, 8);

    const message = `
🚨 <b>PAYOUT FAILED</b>

<b>ID:</b> <code>${shortId}</code>
<b>User:</b> ${params.userHandle ? `@${params.userHandle}` : `<code>${params.userId.slice(0, 8)}</code>`}
<b>Amount:</b> ${params.amount.toLocaleString()} ${params.tokenSymbol}
<b>Wallet:</b> <code>${shortAddress}</code>

❌ <b>Error:</b> ${params.error}
🔧 <b>Action:</b> Check admin dashboard

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send batch summary after cron run (only if failures occurred)
 */
export async function sendBatchSummaryAlert(params: {
    processed: number;
    failed: number;
    durationMs: number;
    errors?: string[];
}): Promise<void> {
    // Only send if there were failures or if explicitly enabled
    if (params.failed === 0 && !payoutConfig.alertOnSuccess) return;

    const emoji = params.failed > 0 ? '⚠️' : '✅';
    const status = params.failed > 0 ? 'WITH FAILURES' : 'SUCCESS';

    const message = `
${emoji} <b>BATCH ${status}</b>

<b>Processed:</b> ${params.processed}
<b>Failed:</b> ${params.failed}
<b>Duration:</b> ${(params.durationMs / 1000).toFixed(1)}s
${params.errors && params.errors.length > 0 ? `\n<b>Errors:</b>\n${params.errors.slice(0, 3).map(e => `• ${e.slice(0, 50)}`).join('\n')}` : ''}

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when payout queue is backing up
 */
export async function sendQueueBackupAlert(params: {
    queueSize: number;
    threshold: number;
}): Promise<void> {
    const key = 'queue_backup';
    if (!shouldSendTelegramAlert(key)) return;

    const message = `
⚠️ <b>QUEUE BACKUP</b>

<b>${params.queueSize}</b> payouts pending
(Threshold: ${params.threshold})

Consider increasing cron frequency or batch size.

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when hot wallet balance is low
 */
export async function sendLowBalanceAlert(params: {
    walletAddress: string;
    balance: number;
    tokenSymbol: string;
    threshold: number;
}): Promise<void> {
    const key = 'low_balance';
    if (!shouldSendTelegramAlert(key)) return;

    const shortAddress = `${params.walletAddress.slice(0, 6)}...${params.walletAddress.slice(-4)}`;

    const message = `
🔴 <b>LOW BALANCE</b>

<b>Wallet:</b> <code>${shortAddress}</code>
<b>Balance:</b> ${params.balance.toLocaleString()} ${params.tokenSymbol}
<b>Threshold:</b> ${params.threshold.toLocaleString()} ${params.tokenSymbol}

Refill needed to continue payouts.

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when cron job appears to be down
 */
export async function sendCronMissedAlert(params: {
    lastRunAt: Date | null;
    thresholdMinutes: number;
}): Promise<void> {
    const key = 'cron_missed';
    if (!shouldSendTelegramAlert(key)) return;

    const lastRun = params.lastRunAt
        ? params.lastRunAt.toISOString()
        : 'Never';

    const message = `
🔴 <b>CRON DOWN</b>

<b>Last run:</b> ${lastRun}
<b>Threshold:</b> ${params.thresholdMinutes} minutes

Check Cron-Job.org dashboard.

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

/**
 * Send alert when cron request is unauthorized
 */
export async function sendUnauthorizedCronAlert(params: {
    ip: string;
    userAgent?: string;
}): Promise<void> {
    const key = `unauthorized_cron:${params.ip}`;
    if (!shouldSendTelegramAlert(key)) return;

    const message = `
🚫 <b>UNAUTHORIZED CRON ATTEMPT</b>

<b>IP:</b> <code>${params.ip}</code>
<b>User-Agent:</b> ${params.userAgent?.slice(0, 50) || 'Unknown'}

Potential attack or misconfiguration.

⏰ ${new Date().toISOString()}
`.trim();

    await sendTelegramMessage(message);
}

