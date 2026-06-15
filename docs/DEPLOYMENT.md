# Deployment Guide — xaynha-chiphi

## Production Environment (Vercel)

### Vercel Dashboard — Environment Variables
Set these in **Project Settings → Environment Variables** (Production + Preview + Development):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:5432/xaynha` | PostgreSQL on Vercel Postgres / Neon / Supabase |
| `NEXTAUTH_URL` | `https://xaynha.go7s.net` | Production domain |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | Min 32 chars |
| `OPENWEATHER_API_KEY` | From [openweathermap.org](https://openweathermap.org/api) | For AI weather |

### Database Setup (Vercel Postgres / Neon / Supabase)

```bash
# 1. Push schema to production DB
npx prisma db push --accept-data-loss

# 2. Seed production data (use --env production if needed)
npx prisma db seed

# 3. Or run migrations (if using Prisma Migrate)
npx prisma migrate deploy
```

### Deploy

```bash
# Push to main → Vercel auto-deploys
git push origin main

# Verify on Vercel dashboard: https://vercel.com/dashboard
```

### Health Check
```bash
# After deploy
curl -I https://xaynha.go7s.net/login
# Expected: 200 OK
```

---

## Local Development

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env.local  # then fill NEXTAUTH_SECRET + DATABASE_URL

# 3. Setup DB (SQLite for local)
npx prisma db push --accept-data-loss
npm run db:seed             # or: npm run prisma:seed

# 4. Run dev server
npm run dev
# → http://localhost:3000

# 5. Login: admin@local.com / Vkn@1234561
```

### Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@local.com` | `Vkn@1234561` |
| User | `user@local.com` | `user123` |

---

## Build & Test

```bash
# Build (production)
npm run build

# Playwright E2E (30 tests — run with dev server active)
npx playwright test

# Seed
npm run prisma:seed
```

### Test Results (as of 2026-06-15)
- **30/30** Playwright E2E ✅
- **0** TypeScript errors
- **46** routes compiled

---

## Database Schema

```bash
# Re-generate Prisma client after schema change
npx prisma generate

# View DB in browser (dev only)
npx prisma studio
# → http://localhost:5555
```

### Key Tables
`User`, `Project`, `Budget`, `ConstructionStage`, `ConstructionTask`, `DailyLog`, `Expense`, `ExpenseCategory`, `Material`, `MaterialCategory`, `Supplier`, `Worker`, `WorkerAttendance`, `Account`, `Transaction`, `Debt`, `Payment`, `PurchaseOrder`, `PurchaseOrderItem`, `Checklist`, `ChecklistItem`, `Photo`, `Document`, `Notification`, `Setting`, `AuditLog`

---

## Cron Jobs (Vercel)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/weather-poll",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Weather data refreshes every 15 minutes. Cron logs go to Vercel dashboard.

---

## Backup

```bash
# Local (SQLite)
cp prisma/data.db backups/data_$(date +%Y%m%d_%H%M%S).db

# Production (PostgreSQL)
# Use Vercel Postgres snapshots or pg_dump:
pg_dump -h HOST -U USER -d xaynha > backups/xaynha_$(date +%Y%m%d).sql
```

## Environment Variables Reference

| Variable | Description | Local Default |
|---|---|---|
| `DATABASE_URL` | DB connection | `file:./data.db` (SQLite) |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT signing secret | Required |
| `OPENWEATHER_API_KEY` | Weather API | Optional |