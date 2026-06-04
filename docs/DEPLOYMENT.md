# Deployment Guide

## Production Setup

1. Set environment variables:
   - NEXTAUTH_SECRET: `openssl rand -base64 32`
   - NEXTAUTH_URL: your production URL
   - MINIO_*: MinIO credentials

2. Build and run:
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```

3. Run migrations:
   ```bash
   docker compose exec app npx prisma migrate deploy
   docker compose exec app npm run db:seed
   ```

## Local Development

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

App runs on http://localhost:3050

## Backup/Restore

```bash
# Backup
./scripts/backup.sh

# Restore
./scripts/restore.sh backups/data_20260602_120000.db
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | SQLite file path | file:./data.db |
| NEXTAUTH_SECRET | Session secret | - |
| NEXTAUTH_URL | App URL | http://localhost:3050 |
| MINIO_ENDPOINT | MinIO host | localhost |
| MINIO_PORT | MinIO port | 9000 |
| MINIO_ACCESS_KEY | MinIO access key | minioadmin |
| MINIO_SECRET_KEY | MinIO secret key | minioadmin |
| MINIO_BUCKET | Bucket name | xaynha-chiphi |
| MINIO_USE_SSL | Use SSL | false |
| OPENWEATHER_API_KEY | Weather API key | - |
