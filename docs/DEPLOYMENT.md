# Deployment Guide — xaynha-chiphi

## Production Environment (Vercel + PostgreSQL)

### Step 1: Create PostgreSQL Database
1. Go to Vercel Dashboard > Storage > Create Database > Postgres
2. Or use Neon (neon.tech) / Supabase (supabase.com) — free 500MB
3. Copy the Connection String

### Step 2: Set Environment Variables
In Vercel Dashboard > Project Settings > Environment Variables:

| Variable | Value |
|---|---|
| DATABASE_URL | postgresql://user:pass@host:5432/db?sslmode=require |
| NEXTAUTH_SECRET | Generate: openssl rand -base64 32 |
| NEXTAUTH_URL | https://your-domain.com |
| OPENWEATHER_API_KEY | From openweathermap.org (optional) |

### Step 3: Push Schema + Seed
npx prisma db push
npx prisma db seed

### Step 4: Deploy
git push origin main
Vercel auto-deploys

### Step 5: Verify
curl -I https://your-domain.com/login
Expected: 200 OK

## Local Development

npm install
cp .env.example .env.local
npx prisma db push --accept-data-loss
npm run db:seed
npm run dev

Credentials: admin@local.com / Vkn@1234561

## Build and Test

npm run build
npx playwright test
npm run prisma:seed

Test Results (2026-06-15): 30/30 pass, 46 routes
