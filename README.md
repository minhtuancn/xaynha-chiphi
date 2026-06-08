# Xây Nhà Chi Phí - Documentation

## Overview
Dự án quản lý chi phí xây dựng nhà ở, tập trung vào trải nghiệm người dùng hiện đại, tối ưu hóa hiệu năng, và dễ dàng quản lý chi phí cho các hộ gia đình hoặc nhà thầu nhỏ.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (v2)
- **Database**: Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js (JWT Strategy)
- **Utilities**: TanStack Query, Zod (schema validation), Date-fns, Lucide React
- **Testing**: Vitest, Playwright

## Development Status
- Cấu trúc dự án: Chuẩn hóa theo Next.js App Router.
- UI/UX: Hiện đại hóa với shadcn/ui và thiết kế Soft UI.
- Hiệu năng: Tối ưu với Server Components & Lazy Loading.
- Kiểm thử: Tích hợp Vitest.
- CI/CD: Tự động hóa với GitHub Actions.

## Setup
1. Clone repo: `git clone ...`
2. Cài đặt dependency: `npm install`
3. Cấu hình .env: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`.
4. Khởi động: `npm run dev`

## Known Issues
- HTTP 500 trên đăng nhập: Cần kiểm tra lại cấu hình kết nối database trong môi trường LXC.
