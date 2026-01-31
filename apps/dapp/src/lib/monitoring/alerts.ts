/**
 * Alert System for Trenches Platform
 * 
 * Supports:
 * - Telegram alerts (via bot API)
 * - Email alerts (via Resend/SendGrid)
 * 
 * Environment variables required:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_ALERT_CHAT_ID
 * - RESEND_API_KEY (optional, for email)
 * - ALERT_EMAIL_TO (optional)
 * - ALERT_EMAIL_FROM (optional, defaults to alerts@playtrenches.xyz)
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertPayload {
    title: string;
    message: string;
    severity: AlertSeverity;
    service?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

// Emoji mapping for severity
const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
};

// Severity colors for email
const SEVERITY_COLOR: Record<AlertSeverity, string> = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
};

/**
 * Send an alert to all configured channels
 */
export async function sendAlert(payload: AlertPayload): Promise<void> {
    const errors: Error[] = [];

    // Send to Telegram if configured
    try {
        await sendTelegramAlert(payload);
    } catch (error) {
        errors.push(error as Error);
        console.error('Failed to send Telegram alert:', error);
    }

    // Send to Email if configured
    try {
        await sendEmailAlert(payload);
    } catch (error) {
        errors.push(error as Error);
        console.error('Failed to send Email alert:', error);
    }

    // Log alert regardless
    logAlert(payload);

    // Throw if all channels failed
    if (errors.length === 2) {
        throw new Error(`All alert channels failed: ${errors.map(e => e.message).join(', ')}`);
    }
}

/**
 * Send alert via Telegram Bot
 */
async function sendTelegramAlert(payload: AlertPayload): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

    if (!token || !chatId) {
        console.log('Telegram alerts not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID missing)');
        return;
    }

    const emoji = SEVERITY_EMOJI[payload.severity];
    const serviceTag = payload.service ? ` [${payload.service}]` : '';

    // Build message
    let message = `${emoji} **${payload.severity.toUpperCase()}**${serviceTag}\n`;
    message += `**${payload.title}**\n\n`;
    message += `${payload.message}\n`;

    // Add metadata if present
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
        message += '\n📋 *Details:*\n';
        for (const [key, value] of Object.entries(payload.metadata)) {
            message += `• ${key}: ${JSON.stringify(value)}\n`;
        }
    }

    message += `\n🕐 ${payload.timestamp.toISOString()}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_notification: payload.severity === 'info',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
    }

    console.log('✅ Telegram alert sent:', payload.title);
}

/**
 * Send alert via Email using Resend
 * 
 * Resend offers 100 emails/day free tier
 * Get API key at: https://resend.com
 */
async function sendEmailAlert(payload: AlertPayload): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.ALERT_EMAIL_TO;

    if (!resendApiKey || !toEmail) {
        console.log('Email alerts not configured (RESEND_API_KEY or ALERT_EMAIL_TO missing)');
        return;
    }

    const subject = `[${payload.severity.toUpperCase()}] ${payload.title}`;
    const html = buildEmailHtml(payload);

    await sendViaResend(resendApiKey, toEmail, subject, html, payload);
}

/**
 * Send email via Resend API
 */
async function sendViaResend(
    apiKey: string,
    to: string,
    subject: string,
    html: string,
    payload: AlertPayload
): Promise<void> {
    const fromEmail = process.env.ALERT_EMAIL_FROM || 'alerts@playtrenches.xyz';

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject,
            html,
            text: buildEmailText(payload),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
    }

    console.log('✅ Email alert sent via Resend:', payload.title);
}

/**
 * Build HTML email content
 */
function buildEmailHtml(payload: AlertPayload): string {
    const color = SEVERITY_COLOR[payload.severity];
    const serviceRow = payload.service
        ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${payload.service}</td></tr>`
        : '';

    let metadataRows = '';
    if (payload.metadata) {
        for (const [key, value] of Object.entries(payload.metadata)) {
            metadataRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${key}:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><code>${JSON.stringify(value)}</code></td></tr>`;
        }
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trenches Alert</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: ${color}; padding: 20px; color: white;">
            <h1 style="margin: 0; font-size: 20px;">${SEVERITY_EMOJI[payload.severity]} ${payload.severity.toUpperCase()} Alert</h1>
        </div>
        <div style="padding: 24px;">
            <h2 style="margin-top: 0; color: #111827;">${payload.title}</h2>
            <p style="color: #374151; line-height: 1.6;">${payload.message}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                ${serviceRow}
                ${metadataRows}
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${payload.timestamp.toISOString()}</td>
                </tr>
            </table>
        </div>
        <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            Trenches Platform Monitoring • ${process.env.VERCEL_ENV || 'development'}
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Build plain text email content
 */
function buildEmailText(payload: AlertPayload): string {
    let text = `${SEVERITY_EMOJI[payload.severity]} ${payload.severity.toUpperCase()} ALERT\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `Title: ${payload.title}\n`;
    if (payload.service) {
        text += `Service: ${payload.service}\n`;
    }
    text += `Time: ${payload.timestamp.toISOString()}\n\n`;
    text += `${payload.message}\n\n`;

    if (payload.metadata) {
        text += 'Details:\n';
        for (const [key, value] of Object.entries(payload.metadata)) {
            text += `  ${key}: ${JSON.stringify(value)}\n`;
        }
    }

    return text;
}

/**
 * Log alert to console/system
 */
function logAlert(payload: AlertPayload): void {
    const emoji = SEVERITY_EMOJI[payload.severity];
    const serviceTag = payload.service ? `[${payload.service}] ` : '';

    const logMessage = `${emoji} ALERT: ${serviceTag}${payload.title} - ${payload.message}`;

    switch (payload.severity) {
        case 'critical':
            console.error(logMessage, payload.metadata);
            break;
        case 'warning':
            console.warn(logMessage, payload.metadata);
            break;
        default:
            console.info(logMessage, payload.metadata);
    }
}

/**
 * Helper functions for common alert types
 */

export async function alertHealthCheckFailed(
    component: string,
    error: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await sendAlert({
        title: `Health Check Failed: ${component}`,
        message: `The ${component} health check has failed. Error: ${error}`,
        severity: 'critical',
        service: component,
        metadata,
        timestamp: new Date(),
    });
}

export async function alertHighLatency(
    endpoint: string,
    latencyMs: number,
    thresholdMs: number
): Promise<void> {
    await sendAlert({
        title: `High Latency Detected`,
        message: `Endpoint ${endpoint} is experiencing high latency (${latencyMs}ms, threshold: ${thresholdMs}ms)`,
        severity: 'warning',
        service: 'api',
        metadata: { endpoint, latencyMs, thresholdMs },
        timestamp: new Date(),
    });
}

export async function alertRpcFailure(
    chainName: string,
    chainId: number,
    error: string
): Promise<void> {
    await sendAlert({
        title: `RPC Endpoint Down: ${chainName}`,
        message: `The ${chainName} (chainId: ${chainId}) RPC endpoint is not responding. Error: ${error}`,
        severity: 'critical',
        service: 'blockchain',
        metadata: { chainName, chainId, error },
        timestamp: new Date(),
    });
}

export async function alertDeploymentSuccess(
    app: string,
    version: string,
    url: string
): Promise<void> {
    await sendAlert({
        title: `Deployment Successful: ${app}`,
        message: `${app} version ${version} has been successfully deployed to ${url}`,
        severity: 'info',
        service: app,
        metadata: { version, url },
        timestamp: new Date(),
    });
}
