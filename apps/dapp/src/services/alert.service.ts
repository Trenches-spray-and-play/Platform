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
