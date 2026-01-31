# Monitoring & Alerting Setup Guide

Complete guide to setting up monitoring and alerting for the Trenches platform.

## ✅ What's Already Built

| Component | Status | Location |
|-----------|--------|----------|
| Health Check Endpoint | ✅ | `GET /api/health` |
| Performance Monitoring | ✅ | `lib/monitoring/middleware.ts` |
| Alert System (Telegram + Email) | ✅ | `lib/monitoring/alerts.ts` |
| Metrics Endpoint | ✅ | `GET /api/metrics` |

---

## 🔐 Environment Variables

Add these to your Vercel environment variables:

### Required for Telegram Alerts
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_ALERT_CHAT_ID=your_chat_id
```

### Required for Email Alerts (Resend)
```
RESEND_API_KEY=re_xxxxxxxxxx
ALERT_EMAIL_TO=alerts@yourdomain.com
ALERT_EMAIL_FROM=alerts@playtrenches.xyz  # optional
```

### Optional for Metrics API
```
METRICS_API_KEY=your_secret_key_here
```

---

## 📱 Telegram Bot Setup (Free)

1. **Create a Bot**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the **HTTP API token**

2. **Get Chat ID**
   - Message [@userinfobot](https://t.me/userinfobot) to get your user ID
   - OR add the bot to a group and message the group
   - Call: `https://api.telegram.org/bot<token>/getUpdates`
   - Look for `"chat":{"id":123456789` in the response

3. **Test**
   ```bash
   curl -X POST \
     https://api.telegram.org/bot<token>/sendMessage \
     -d chat_id=<chat_id> \
     -d text="Test alert from Trenches"
   ```

---

## 📧 Email Setup (Resend - Free Tier: 100 emails/day)

1. **Sign up at [Resend](https://resend.com)**
   - Free tier: 100 emails/day
   - No credit card required

2. **Get API Key**
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

3. **Verify Domain** (optional but recommended)
   - Add your domain in Resend dashboard
   - Follow DNS verification steps
   - Or use `onboarding@resend.dev` for testing

4. **Test**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer <api_key>" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "alerts@playtrenches.xyz",
       "to": ["your-email@example.com"],
       "subject": "Test Alert",
       "text": "This is a test alert from Trenches"
     }'
   ```

---

## 🌐 External Monitoring (UptimeRobot - Free Tier)

### Why UptimeRobot?
- ✅ Free tier: 50 monitors, 5-minute checks
- ✅ Email, SMS, webhook notifications
- ✅ Status pages

### Setup

1. **Sign up at [UptimeRobot](https://uptimerobot.com)**

2. **Add Monitors**

   | Monitor | Type | URL | Interval |
   |---------|------|-----|----------|
   | DApp Health | HTTP(s) | `https://app.playtrenches.xyz/api/health` | 5 min |
   | Landing Page | HTTP(s) | `https://playtrenches.xyz` | 5 min |
   | API Endpoint | HTTP(s) | `https://app.playtrenches.xyz/api/trenches` | 5 min |

3. **Configure Alert Contacts**
   - Add your email
   - Add Telegram (via webhook or email forwarding)
   - Add phone for SMS (paid feature)

4. **Set Alert Conditions**
   - Alert when down for 2 consecutive checks (10 min)
   - Resend alert every 30 minutes

---

## 📊 Health Check Endpoint

### `GET /api/health`

Returns comprehensive health status:

```json
{
  "timestamp": "2026-01-31T18:30:00.000Z",
  "uptime": 3600,
  "version": "abc1234",
  "environment": "production",
  "overall": "healthy",
  "checks": {
    "database": {
      "status": "connected",
      "latency": 15,
      "stats": {
        "userCount": 150,
        "trenchCount": 12
      }
    },
    "redis": {
      "status": "connected",
      "latency": 45
    },
    "rpc": {
      "status": "healthy",
      "chains": [
        {
          "chainId": 1,
          "name": "Ethereum",
          "configured": true,
          "status": "ok",
          "latency": 120
        }
      ]
    }
  }
}
```

### Status Codes
- `200` - Healthy or degraded
- `503` - Unhealthy (critical systems down)

---

## 📈 Metrics Endpoint

### `GET /api/metrics`

Query params:
- `window` - Time window in minutes (default: 5)
- `raw` - Include raw request data (default: false)
- `limit` - Limit raw data (default: 100)

Returns performance statistics:

```json
{
  "timestamp": "2026-01-31T18:30:00.000Z",
  "window": "5 minutes",
  "stats": {
    "totalRequests": 245,
    "errorRate": 0.41,
    "avgResponseTime": 145,
    "p95ResponseTime": 450,
    "p99ResponseTime": 890,
    "slowestEndpoints": [
      {
        "endpoint": "GET /api/trenches",
        "avgDuration": 320,
        "count": 45
      }
    ],
    "errorEndpoints": [
      {
        "endpoint": "POST /api/deposits",
        "errorCount": 1,
        "totalCount": 20
      }
    ]
  }
}
```

---

## 🚨 Alert Types

### Critical Alerts (Immediate)
- Database connection failure
- Redis connection failure
- All RPC endpoints down
- Health check returns 503

### Warning Alerts (Within 5 min)
- Single RPC endpoint down
- Response time > 2 seconds
- Error rate > 5%

### Info Alerts (No immediate action)
- Successful deployments
- Daily summary

---

## 🔧 Using Monitoring in Code

### Wrap API Routes

```typescript
import { withMonitoring } from '@/lib/monitoring';

export const GET = withMonitoring(async (request) => {
  // Your handler code
  return Response.json({ data: 'success' });
}, { endpoint: '/api/my-endpoint' });
```

### Send Custom Alerts

```typescript
import { sendAlert, alertRpcFailure } from '@/lib/monitoring';

// Custom alert
await sendAlert({
  title: 'Custom Event',
  message: 'Something happened',
  severity: 'warning',
  service: 'my-service',
  metadata: { userId: '123' },
  timestamp: new Date(),
});

// Pre-built alert
await alertRpcFailure('Ethereum', 1, 'Connection timeout');
```

---

## 🧪 Testing Alerts

```bash
# Test health endpoint
curl https://app.playtrenches.xyz/api/health

# Test metrics endpoint (with auth)
curl -H "Authorization: Bearer $METRICS_API_KEY" \
  https://app.playtrenches.xyz/api/metrics?window=10

# Trigger a test alert (via deployment)
# Deployments automatically send success alerts
```

---

## 📋 Monitoring Checklist

- [ ] Telegram bot created and tested
- [ ] Resend account created and verified
- [ ] Environment variables added to Vercel
- [ ] UptimeRobot monitors configured
- [ ] Alert contacts added
- [ ] Health endpoint responding correctly
- [ ] Metrics endpoint accessible (with auth)
- [ ] Test alert sent successfully

---

## 🎯 SLO Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% for 5 min |
| Response Time (p95) | < 500ms | > 2000ms |
| Error Rate | < 0.1% | > 5% |
| Database Latency | < 100ms | > 500ms |
| RPC Latency | < 1000ms | > 3000ms |

---

*Last updated: 2026-01-31*
