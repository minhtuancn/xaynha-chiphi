# Xây Nhà - House Construction Management System

Hệ thống quản lý xây dựng nhà ở cá nhân, local-first với SQLite.

## Features

### Core
- Dashboard tổng quan với tiến độ, ngân sách, thời tiết
- Quản lý dự án (CRUD, ngân sách, tiến độ)
- Quản lý giai đoạn thi công và tasks
- Nhật ký thi công hàng ngày (weather, temperature, notes)

### Materials & Inventory
- Quản lý vật liệu và kho
- Theo dõi vật tư sử dụng (MaterialUsage)
- Đơn đặt hàng (Purchase Orders) - CRUD với trạng thái workflow

### Financial
- Quản lý chi phí (expenses)
- Quản lý tài khoản (accounts, transactions)
- Quản lý công nợ (debts, payments)

### People
- Quản lý nhà cung cấp (suppliers)
- Quản lý công nhân (workers)
- Chấm công (attendance)

### Documents & Media
- Quản lý tài liệu (Documents) - upload, filter, tags
- Thư viện ảnh (Photos)

### Checklists
- Checklist per giai đoạn thi công
- Item management (add, toggle, delete)

### Notifications
- Hệ thống thông báo per-user
- Bell icon với unread count badge
- Mark as read / delete

### Reports & Settings
- Báo cáo và xuất CSV
- Quản lý người dùng và quyền hạn (RBAC)

### UI/UX
- Dark mode support
- PWA support
- Mobile responsive
- Vietnamese localization

## Quick Start

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3050

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

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login page
│   ├── (dashboard)/      # All app pages
│   │   ├── dashboard/    # Overview
│   │   ├── projects/     # Project management
│   │   ├── stages/       # Construction stages
│   │   ├── checklists/   # Per-stage checklists
│   │   ├── daily-logs/   # Daily work logs
│   │   ├── materials/    # Material management
│   │   ├── inventory/    # Stock tracking
│   │   ├── material-usage/ # Material consumption
│   │   ├── purchase-orders/ # Order management
│   │   ├── suppliers/    # Supplier management
│   │   ├── workers/      # Worker management
│   │   ├── attendance/   # Attendance tracking
│   │   ├── expenses/     # Expense management
│   │   ├── accounts/     # Account management
│   │   ├── debts/        # Debt tracking
│   │   ├── photos/       # Photo library
│   │   ├── documents/    # Document management
│   │   ├── notifications/ # Notification center
│   │   ├── reports/      # Reports & analytics
│   │   └── settings/     # App settings & user management
│   └── api/              # API routes (auth, upload)
├── actions/              # Server actions per module
├── components/
│   ├── layout/           # Sidebar, Header, ThemeToggle
│   ├── ui/               # shadcn components
│   └── forms/            # Form components
├── lib/                  # Utilities, auth, prisma, minio
└── schemas/              # Zod validation schemas
```
