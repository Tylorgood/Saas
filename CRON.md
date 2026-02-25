# CashFlow AI - Cron Setup Guide

## Daily Tasks (Invoice Reminders & Billing)

### Option 1: Render Cron (Free)
1. Go to Render Dashboard
2. Create a new Web Service (or use existing)
3. Add a cron job:
   - Command: `curl -s https://cashflow-ai-40om.onrender.com/api/cron/reminders`
   - Schedule: Daily at 9am UTC

### Option 2: External Cron Service
Use services like:
- cron-job.org (free)
- EasyCron.com
- CronHub.io

## API Endpoints for Automation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/reminders` | GET | Send invoice reminders |
| `/api/cron/billing` | GET | Process subscription billing |

## Setup Reminders Script

```bash
# Run locally to test
npm run reminders
npm run billing
npm run stats
```

## Production Automation

1. **Invoice Reminders** - Run daily at 9am
2. **Subscription Billing** - Run daily at midnight  
3. **Weekly Reports** - Run every Monday at 8am

## Email Integration (Future)

When ready, integrate with:
- SendGrid
- Mailgun  
- AWS SES

Then update `scripts/reminders.js` to send actual emails.
