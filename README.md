# CashFlow AI

AI-powered financial automation for solopreneurs and small agencies.

## Features

- **AI Invoice Generator** - Create professional invoices in seconds
- **Financial Dashboard** - Real-time revenue, expenses, and profit tracking
- **Expense Tracking** - Categorize and track all business expenses
- **Client Management** - Keep all client information organized
- **Recurring Subscriptions** - Automate recurring billing
- **Automated Reminders** - Never miss a payment

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:3000
```

## Deployment

### Render (Recommended)

1. Push to GitHub
2. Connect to Render.com
3. Use `render.yaml` or configure manually:
   - Build Command: `npm install`
   - Start Command: `npm start`

### Other Platforms

- **Railway**: `npm install` → `npm start`
- **Heroku**: Use buildpack `heroku/nodejs`
- **Fly.io**: Uses Dockerfile

## Automation Scripts

```bash
# Send invoice reminders
npm run reminders

# Generate weekly report
npm run report

# Process subscription billing
npm run billing
```

Set up cron jobs to run these automatically.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| JWT_SECRET | Auth secret | auto-generated |

## Tech Stack

- Node.js + Express
- JSON file storage (easily swappable to SQLite/PostgreSQL)
- JWT authentication
- Vanilla JS frontend

## Roadmap

- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] API access
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] PDF invoice generation

## License

MIT
