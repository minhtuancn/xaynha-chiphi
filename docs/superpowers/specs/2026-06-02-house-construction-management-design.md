# House Construction Management System - Design Spec

**Date:** 2026-06-02
**Project:** xaynha-chiphi
**Status:** Approved

---

## 1. Overview

Local-first House Construction Management System for homeowner building a 2-floor house. Runs on Windows, Linux, Docker. SQLite primary database. Vietnamese number/date/currency formatting.

### Key Decisions
- **Approach:** Full breadth (all 11 modules) with deep polish on 6 core modules (Dashboard, Construction Progress, Daily Logs, Materials, Financial, Photos). Other modules have working CRUD with simpler UI.
- **Architecture:** Next.js App Router + Server Actions + Prisma + SQLite + MinIO S3
- **Language:** Vietnamese primary, keep technical terms in English (Dashboard, Daily Log, etc.)
- **Auth:** Full RBAC with per-module permissions, admin + user roles, audit logging

---

## 2. Architecture

### Stack
- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, TanStack Table, React Hook Form, Zod, Recharts, Lucide React
- **Backend:** Next.js Server Actions, Next.js Route Handlers
- **Database:** SQLite + Prisma ORM
- **Storage:** MinIO S3-compatible (local), fallback to local filesystem
- **Weather:** OpenWeatherMap API with caching + manual override
- **Deployment:** Docker + Docker Compose

### Folder Structure
```
xaynha-chiphi/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── stages/page.tsx
│   │   │   ├── daily-logs/page.tsx
│   │   │   ├── materials/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── purchase-orders/page.tsx
│   │   │   ├── suppliers/page.tsx
│   │   │   ├── workers/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   ├── accounts/page.tsx
│   │   │   ├── debts/page.tsx
│   │   │   ├── photos/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/upload/route.ts
│   │   ├── api/weather/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── dashboard/       # StatCard, ProgressChart, WeatherWidget
│   │   ├── forms/           # FormField, DatePicker, FileUpload
│   │   └── tables/          # DataTable, ColumnHeader
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── minio.ts
│   │   ├── weather.ts
│   │   ├── auth.ts
│   │   └── utils.ts         # Vietnamese formatters
│   ├── actions/             # Server Actions per module
│   ├── schemas/             # Zod validation schemas
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 3. Database Schema

### Core Tables

**User**
- id (UUID, PK), email (unique), passwordHash, name, role (admin/user), permissions (JSON), isActive, lastLoginAt, createdAt, updatedAt, deletedAt
- permissions format: `{ "stages": ["view","create","edit","delete"], "financial": ["view","edit"], ... }`
- Admin role implies all permissions regardless of JSON value

**Project**
- id (UUID, PK), name, address, budget (Decimal), startDate, endDate, status (planning/active/paused/completed), progress (0-100), description, createdAt, updatedAt, deletedAt

**Settings**
- id (UUID, PK), key (unique), value (JSON), userId (FK), createdAt, updatedAt

**Session** (NextAuth)
- id (UUID, PK), sessionToken (unique), userId (FK), expires

### Construction Progress

**ConstructionStage**
- id (UUID, PK), projectId (FK), name, order, status (not_started/in_progress/completed/on_hold), startDate, endDate, progress (0-100), estimatedBudget (Decimal), actualCost (Decimal), notes, createdAt, updatedAt, deletedAt

**ConstructionTask**
- id (UUID, PK), stageId (FK), name, description, status (pending/in_progress/completed/cancelled), assignee, startDate, endDate, progress (0-100), notes, createdAt, updatedAt, deletedAt

**Checklist**
- id (UUID, PK), stageId (FK), name, order, createdAt, updatedAt, deletedAt

**ChecklistItem**
- id (UUID, PK), checklistId (FK), name, completed, completedAt, order, createdAt, updatedAt, deletedAt

### Daily Logs

**DailyLog**
- id (UUID, PK), projectId (FK), date, weather (JSON), temperature, notes, issues, workerCount, createdAt, updatedAt, deletedAt

**WeatherRecord**
- id (UUID, PK), projectId (FK), date, condition, temperature, humidity, windSpeed, source (auto/manual), createdAt, updatedAt

### Materials & Inventory

**MaterialCategory**
- id (UUID, PK), name, description, createdAt, updatedAt, deletedAt

**Material**
- id (UUID, PK), categoryId (FK), name, unit, currentStock (Decimal), minStock (Decimal), unitCost (Decimal), supplierId (FK, nullable), createdAt, updatedAt, deletedAt

**InventoryTransaction**
- id (UUID, PK), materialId (FK), type (in/out/adjustment), quantity (Decimal), date, reference (type + id), notes, createdAt, updatedAt

### Suppliers & Purchase Orders

**Supplier**
- id (UUID, PK), name, contact, phone, email, address, taxCode, debtBalance (Decimal), notes, createdAt, updatedAt, deletedAt

**PurchaseOrder**
- id (UUID, PK), supplierId (FK), projectId (FK), orderDate, deliveryDate, status (draft/sent/received/cancelled), totalAmount (Decimal), notes, createdAt, updatedAt, deletedAt

**PurchaseOrderItem**
- id (UUID, PK), orderId (FK), materialId (FK), quantity (Decimal), unitPrice (Decimal), total (Decimal), createdAt, updatedAt

### Workers & Attendance

**Worker**
- id (UUID, PK), name, phone, idCard, skill, dailyWage (Decimal), status (active/inactive), notes, createdAt, updatedAt, deletedAt

**WorkerAttendance**
- id (UUID, PK), workerId (FK), date, checkIn, checkOut, status (present/absent/late), notes, createdAt, updatedAt

### Financial

**Account**
- id (UUID, PK), name, type (cash/bank), balance (Decimal), currency (VND), createdAt, updatedAt, deletedAt

**Transaction**
- id (UUID, PK), accountId (FK), type (income/expense), amount (Decimal), date, category, description, reference, createdAt, updatedAt

**Expense**
- id (UUID, PK), projectId (FK), categoryId (FK), amount (Decimal), date, description, receipt (URL), status (pending/approved/rejected), createdAt, updatedAt, deletedAt

**ExpenseCategory**
- id (UUID, PK), name, budget (Decimal), createdAt, updatedAt, deletedAt

**Debt**
- id (UUID, PK), supplierId (FK, nullable), workerId (FK, nullable), type (payable/receivable), amount (Decimal), paidAmount (Decimal), dueDate, status (unpaid/partial/paid/overdue), notes, createdAt, updatedAt, deletedAt
- Note: Either supplierId OR workerId is set, not both

**Payment**
- id (UUID, PK), debtId (FK), amount (Decimal), date, method (cash/bank/transfer), notes, createdAt, updatedAt

### Photos & Documents

**Photo**
- id (UUID, PK), projectId (FK), dailyLogId (FK, nullable), url, thumbnail (URL), caption, tags (JSON array), takenAt, createdAt, updatedAt, deletedAt

**Document**
- id (UUID, PK), projectId (FK), name, type (contract/drawing/invoice/permit/other), category, url, size (bytes), uploadedAt, tags (JSON array), createdAt, updatedAt, deletedAt

### Reports & Audit

**AuditLog**
- id (UUID, PK), userId (FK), action (create/update/delete), entity (table name), entityId (UUID), changes (JSON), timestamp

**Notification**
- id (UUID, PK), userId (FK), type, message, read, createdAt

### Additional Tables

**Budget**
- id (UUID, PK), projectId (FK), totalBudget (Decimal), allocated (Decimal), spent (Decimal), remaining (Decimal), createdAt, updatedAt

**StageBudget**
- id (UUID, PK), stageId (FK), estimatedCost (Decimal), actualCost (Decimal), createdAt, updatedAt

**MaterialUsage**
- id (UUID, PK), materialId (FK), dailyLogId (FK), taskId (FK, nullable), quantity (Decimal), date, notes, createdAt

---

## 4. UI/UX Design System

### Colors
- **Neutral:** Slate 900 (#0f172a), Slate 800 (#1e293b), Gray 50-200 for backgrounds
- **Primary:** Blue 500 (#3b82f6)
- **Success:** Emerald 500 (#10b981)
- **Warning:** Amber 500 (#f59e0b)
- **Danger:** Red 500 (#ef4444)

### Typography
- Font: System font stack (Inter, -apple-system, sans-serif)
- H1: 28px Bold, H2: 22px Semibold, H3: 18px Semibold
- Body: 14px, Label: 14px Medium, Caption: 12px

### Components
- Cards: border-radius 10px, subtle shadow, 1px border
- Buttons: Primary (blue), Secondary (gray outline), Danger (red outline)
- Badges: Rounded pills with semantic colors
- Tables: Clean rows, hover states, sortable headers

### Responsive
- Desktop: Sidebar navigation, multi-column grids
- Tablet: Collapsible sidebar, 2-column grids
- Mobile: Bottom navigation, single column, hamburger menu

### Vietnamese Formatting
- Currency: `1.000.000 ₫` (dot thousands, no decimals)
- Numbers: `1.234.567,89` (dot thousands, comma decimal)
- Dates: `dd/mm/yyyy`
- Units: m², m³, kg, tấn, cây, viên, bao, etc.

---

## 5. Security & Permissions

### Authentication
- NextAuth.js with Credentials Provider
- bcrypt password hashing
- Database sessions (SQLite)
- JWT for API routes

### Authorization
- RBAC with per-module permissions
- Roles: admin (full access + user management), user (configurable)
- Permissions: view, create, edit, delete per module
- Middleware check in Server Actions and Route Handlers

### Security Measures
- CSRF protection (Next.js built-in)
- Rate limiting for login
- Zod validation on all Server Actions
- File upload validation (type, size)
- Prisma prevents SQL injection
- React escapes XSS
- CORS config for API routes

### Audit Logging
- All create/update/delete recorded
- Fields: userId, action, entity, entityId, oldValues, newValues, timestamp
- Immutable (cannot delete audit logs)

---

## 6. Default Construction Stages

1. **Preparation** - Estimated: 2 weeks
2. **Foundation** - Estimated: 4 weeks
3. **Ground Floor** - Estimated: 6 weeks
4. **Second Floor** - Estimated: 6 weeks
5. **Roof** - Estimated: 3 weeks
6. **Electrical** - Estimated: 3 weeks
7. **Water System** - Estimated: 2 weeks
8. **Interior** - Estimated: 8 weeks
9. **Painting** - Estimated: 2 weeks
10. **Final Inspection** - Estimated: 1 week

Each stage includes predefined tasks and checklist items.

---

## 7. Pages

| Page | Route | Polish Level |
|------|-------|--------------|
| Dashboard | `/dashboard` | Deep |
| Projects | `/projects` | Deep |
| Construction Stages | `/stages` | Deep |
| Task Management | `/tasks` | Deep |
| Daily Logs | `/daily-logs` | Deep |
| Material Management | `/materials` | Deep |
| Inventory | `/inventory` | Deep |
| Purchase Orders | `/purchase-orders` | Basic |
| Suppliers | `/suppliers` | Deep |
| Workers | `/workers` | Basic |
| Attendance | `/attendance` | Basic |
| Expenses | `/expenses` | Deep |
| Accounts | `/accounts` | Deep |
| Debt Tracking | `/debts` | Deep |
| Photos | `/photos` | Deep |
| Documents | `/documents` | Basic |
| Reports | `/reports` | Basic |
| Settings | `/settings` | Basic |
| Login | `/login` | Deep |
| User Management | `/settings/users` | Basic |

---

## 8. Docker Setup

### docker-compose.yml
- **app:** Next.js (Node.js 20)
- **minio:** MinIO S3-compatible storage
- **minio-createbucket:** Init bucket script

### Environment Variables
```
DATABASE_URL=file:./data.db
NEXTAUTH_SECRET=changeme
NEXTAUTH_URL=http://localhost:3000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=xaynha-chiphi
OPENWEATHER_API_KEY=optional
```

---

## 9. Seed Data

- Default admin user (admin@local.com / admin123)
- Default user (user@local.com / user123)
- Sample project "Nhà Thờ Tổ"
- 10 construction stages with tasks
- Sample materials, suppliers, workers
- Sample expenses, transactions
- Sample photos and documents

---

## 10. Implementation Phases

### Phase 1: Foundation
- Project setup, Prisma schema, database migrations
- Authentication system
- Layout, navigation, design system
- Seed data

### Phase 2: Core Modules (Deep Polish)
- Dashboard with widgets
- Construction stages + tasks
- Daily logs + weather
- Materials + inventory
- Financial management (expenses, accounts, debts)
- Photo management

### Phase 3: Supporting Modules (Basic CRUD)
- Purchase orders
- Suppliers
- Workers + attendance
- Documents
- Reports (export CSV/PDF)
- Settings + user management

### Phase 4: DevOps & QA
- Docker setup
- Testing
- Performance optimization
- Documentation
