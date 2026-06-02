# Xây Nhà - House Construction Management System

Hệ thống quản lý xây dựng nhà ở cá nhân, local-first với SQLite.

## Features

- Dashboard với tiến độ, ngân sách, thời tiết
- Quản lý giai đoạn thi công và tasks
- Nhật ký thi công hàng ngày
- Quản lý vật liệu và kho
- Quản lý tài chính (chi phí, tài khoản, công nợ)
- Quản lý nhà cung cấp, công nhân, chấm công
- Đơn đặt hàng, ảnh, tài liệu
- Báo cáo và xuất CSV
- Dark mode, PWA support

## Quick Start

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Demo Accounts
- Admin: admin@local.com / admin123
- User: user@local.com / user123

## Docker

```bash
docker compose up -d
```

## Tech Stack

- Next.js 15, TypeScript, TailwindCSS, shadcn/ui
- Prisma ORM, SQLite
- NextAuth.js v5, MinIO S3
- Recharts, TanStack Table, React Hook Form, Zod
