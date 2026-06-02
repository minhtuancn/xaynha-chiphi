# House Construction Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete local-first House Construction Management System with Next.js, Prisma, SQLite, and MinIO for a Vietnamese homeowner managing a 2-floor house construction project.

**Architecture:** Next.js App Router with Server Actions for all CRUD operations, Prisma ORM with SQLite, MinIO S3-compatible storage for files, NextAuth.js for authentication with RBAC per-module permissions.

**Tech Stack:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui, TanStack Table, React Hook Form, Zod, Recharts, Lucide React, Prisma, SQLite, NextAuth.js, MinIO, Docker

---

## Phase 1: Foundation (Tasks 1-8)
Project setup, database schema, auth, layout, seed data. Produces a runnable app with login.

## Phase 2: Core Modules (Tasks 9-18)
Dashboard, Construction Stages, Daily Logs, Materials, Financial, Photos. Deep polish.

## Phase 3: Supporting Modules (Tasks 19-24)
Purchase Orders, Suppliers, Workers, Documents, Reports, Settings. Working CRUD.

## Phase 4: DevOps & Polish (Tasks 25-27)
Docker setup, testing, documentation, final polish.

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.local`, `.env.example`, `.gitignore`, `eslint.config.mjs`, `prettier.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "xaynha-chiphi",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.5.0",
    "next-auth": "^4.24.11",
    "bcryptjs": "^3.0.0",
    "zod": "^3.24.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^4.1.0",
    "@tanstack/react-table": "^8.21.0",
    "recharts": "^2.15.0",
    "lucide-react": "^0.475.0",
    "date-fns": "^4.1.0",
    "minio": "^8.0.4",
    "next-themes": "^0.4.4"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.13.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.20.0",
    "eslint-config-next": "^15.2.0",
    "prettier": "^3.5.0",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "prisma": "^6.5.0",
    "tsx": "^4.19.0",
    "@tailwindcss/forms": "^0.5.10",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.0"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 2: Create config files**

Create `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json` with standard Next.js + Tailwind + shadcn configuration. Use paths `@/*` -> `./src/*`.

- [ ] **Step 3: Create src/app/globals.css**

Use shadcn CSS variables with slate base color, dark mode support via `.dark` class.

- [ ] **Step 4: Create src/app/layout.tsx**

Root layout with Inter font (latin + vietnamese subsets), lang="vi", metadata title "Xay Nha - Quan ly xay dung".

- [ ] **Step 5: Create src/app/page.tsx**

Redirect to `/login`.

- [ ] **Step 6: Create .env.local, .env.example, .gitignore**

Standard env vars for DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, MINIO_*, OPENWEATHER_API_KEY.

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "init: project setup"
```

---

### Task 2: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Create complete schema**

All tables from design spec: User, Session, Project, Setting, ConstructionStage, ConstructionTask, Checklist, ChecklistItem, DailyLog, WeatherRecord, MaterialCategory, Material, InventoryTransaction, MaterialUsage, Supplier, PurchaseOrder, PurchaseOrderItem, Worker, WorkerAttendance, Account, Transaction, Expense, ExpenseCategory, Budget, StageBudget, Debt, Payment, Photo, Document, AuditLog, Notification.

Key patterns:
- All IDs: `String @id @default(uuid())`
- Soft delete: `deletedAt DateTime?` on most tables
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Decimal for money: `Decimal @default(0)`
- JSON stored as String: permissions, weather, tags
- Relations: use `onDelete: Cascade` for parent-child, `SetNull` for optional, `Restrict` for references

- [ ] **Step 2: Generate and migrate**

```bash
npx prisma generate && npx prisma migrate dev --name init
```

- [ ] **Step 3: Commit**

---

### Task 3: Core Libraries

**Files:**
- Create: `src/lib/prisma.ts`, `src/lib/utils.ts`, `src/lib/minio.ts`, `src/lib/weather.ts`, `src/lib/auth.ts`

- [ ] **Step 1: prisma.ts** - Singleton PrismaClient with globalThis hot-reload prevention.

- [ ] **Step 2: utils.ts** - Vietnamese formatters: `formatCurrency` (1.000.000 đ), `formatNumber` (1.234.567,89), `formatDate` (dd/mm/yyyy), `formatDateTime`, `formatDateInput` (yyyy-mm-dd), `formatUnit`, `formatPercent`, `formatFileSize`. Status label maps (STAGE_STATUS_LABELS, TASK_STATUS_LABELS, etc.). Permission types and `hasPermission()` function.

- [ ] **Step 3: minio.ts** - MinIO client singleton, `ensureBucket()`, `uploadFile()`, `deleteFile()`, `getPublicUrl()`.

- [ ] **Step 4: weather.ts** - `fetchWeatherFromAPI(lat, lon)` using OpenWeatherMap, `getWeatherForDate(projectId, date)` with cache check, `saveManualWeather()`.

- [ ] **Step 5: auth.ts** - `getCurrentUser()`, `requireUser()`, `requireAdmin()`, `checkPermission()`, `requirePermission()`.

- [ ] **Step 6: Commit**

---

### Task 4: shadcn/ui Components

- [ ] **Step 1: Install all shadcn components**

```bash
npx shadcn@latest add button input label card badge dialog dropdown-menu select textarea checkbox table tabs avatar separator skeleton toast form calendar popover progress alert-dialog
```

- [ ] **Step 2: Commit**

---

### Task 5: Authentication

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/layout.tsx`, `src/schemas/auth.ts`

- [ ] **Step 1: NextAuth route** - Credentials provider, bcrypt compare, database sessions, 30 day maxAge.

- [ ] **Step 2: Login page** - React Hook Form + Zod validation, signIn() call, redirect to /dashboard on success, show demo accounts.

- [ ] **Step 3: Auth layout** - Centered gradient background.

- [ ] **Step 4: Commit**

---

### Task 6: Dashboard Layout

**Files:**
- Create: `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`, `src/components/layout/theme-toggle.tsx`, `src/components/layout/theme-provider.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/loading.tsx`

- [ ] **Step 1: Sidebar** - Fixed left, 64px width, logo + 17 nav items with Lucide icons, active state highlighting.

- [ ] **Step 2: Header** - Sticky top, theme toggle, user avatar dropdown with sign out.

- [ ] **Step 3: Theme toggle** - next-themes, Sun/Moon icons with rotation animation.

- [ ] **Step 4: Dashboard layout** - Server component, session check, user lookup, wrap with ThemeProvider, Sidebar + Header + main content.

- [ ] **Step 5: Loading** - Skeleton placeholders matching dashboard layout.

- [ ] **Step 6: Commit**

---

### Task 7: Seed Data

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create seed script**

Create: admin@local.com/admin123, user@local.com/user123. Project "Nha Tho To" with 3.5B budget. 10 construction stages with progress. Tasks for first 4 stages. 7 material categories, 9 materials. 3 suppliers. 5 workers. 2 accounts. 5 expense categories. 7 daily logs. 3 sample expenses. Settings for default coordinates.

- [ ] **Step 2: Run seed**

```bash
npm run db:seed
```

- [ ] **Step 3: Commit**

---

### Task 8: Reusable Components

**Files:**
- Create: `src/components/ui/stat-card.tsx`, `src/components/ui/status-badge.tsx`, `src/components/ui/data-table.tsx`, `src/components/forms/date-picker.tsx`, `src/components/forms/file-upload.tsx`

- [ ] **Step 1: StatCard** - Title, value, subtitle, icon, optional trend indicator.

- [ ] **Step 2: StatusBadge** - Semantic colors per status, Vietnamese labels.

- [ ] **Step 3: DataTable** - TanStack Table with sorting, filtering, pagination, Vietnamese labels ("Truoc", "Sau", "Khong co du lieu").

- [ ] **Step 4: DatePicker** - shadcn Calendar + Popover, Vietnamese locale (date-fns vi).

- [ ] **Step 5: FileUpload** - Drag & drop + click, file list preview, remove button.

- [ ] **Step 6: Commit**

---

### Task 9: Dashboard Page

**Files:**
- Create: `src/actions/dashboard.ts`, `src/components/dashboard/weather-widget.tsx`, `src/components/dashboard/progress-chart.tsx`, `src/components/dashboard/recent-photos.tsx`, `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Dashboard action** - Get active project, stats (stages, tasks, budget, expenses), stages with progress, recent photos (6), weather for today, upcoming tasks (5), recent expenses (5).

- [ ] **Step 2: WeatherWidget** - Icon based on condition, temperature, humidity, wind speed.

- [ ] **Step 3: ProgressChart** - Recharts BarChart, stages on X, progress on Y, color by status.

- [ ] **Step 4: RecentPhotos** - 3-column grid of thumbnails.

- [ ] **Step 5: Dashboard page** - Progress bar, 4 stat cards, weather + chart row, stages list + upcoming tasks + recent expenses sidebar, recent photos.

- [ ] **Step 6: Commit**

---

### Task 10: Projects CRUD

**Files:**
- Create: `src/schemas/project.ts`, `src/actions/projects.ts`, `src/app/(dashboard)/projects/page.tsx`, `src/app/(dashboard)/projects/new/page.tsx`, `src/app/(dashboard)/projects/[id]/edit/page.tsx`

- [ ] **Step 1: Schema** - name, address, budget, startDate, endDate, status, progress, description.

- [ ] **Step 2: Actions** - getProjects, getProject, createProject (also creates Budget), updateProject, deleteProject (soft delete).

- [ ] **Step 3: List page** - DataTable with columns: name, address, budget (formatted), progress, status badge, startDate, edit link.

- [ ] **Step 4: New/Edit form** - React Hook Form + Zod, all fields, DatePicker for dates, Select for status.

- [ ] **Step 5: Commit**

---

### Task 11: Construction Stages CRUD

**Files:**
- Create: `src/schemas/stage.ts`, `src/actions/stages.ts`, `src/app/(dashboard)/stages/page.tsx`, `src/app/(dashboard)/stages/[id]/page.tsx`

- [ ] **Step 1: Schemas** - stageSchema (name, status, dates, progress, estimatedBudget, notes), taskSchema (name, description, status, assignee, dates, progress, notes).

- [ ] **Step 2: Actions** - getStages, getStage (with tasks), createStage, updateStage, deleteStage, createTask, updateTask, deleteTask. Auto-recalculate stage progress from tasks.

- [ ] **Step 3: Stages list** - Kanban or list view showing all stages with progress bars, status badges, task count. Link to detail page.

- [ ] **Step 4: Stage detail** - Stage info header, task list with inline edit, add task form, checklist section, progress bar.

- [ ] **Step 5: Commit**

---

### Task 12: Daily Logs CRUD

**Files:**
- Create: `src/schemas/daily-log.ts`, `src/actions/daily-logs.ts`, `src/app/(dashboard)/daily-logs/page.tsx`, `src/app/(dashboard)/daily-logs/new/page.tsx`

- [ ] **Step 1: Schema** - date, weather (JSON), temperature, notes, issues, workerCount.

- [ ] **Step 2: Actions** - getDailyLogs, getDailyLog, createDailyLog (auto-fetch weather), updateDailyLog, deleteDailyLog.

- [ ] **Step 3: List page** - Calendar view or list sorted by date, showing weather icon, temperature, notes preview, worker count.

- [ ] **Step 4: New form** - Date picker, weather auto-fill with manual override, notes textarea, issues textarea, worker count input.

- [ ] **Step 5: Commit**

---

### Task 13: Materials CRUD

**Files:**
- Create: `src/schemas/material.ts`, `src/actions/materials.ts`, `src/app/(dashboard)/materials/page.tsx`, `src/app/(dashboard)/materials/new/page.tsx`

- [ ] **Step 1: Schema** - name, categoryId, unit, currentStock, minStock, unitCost, supplierId.

- [ ] **Step 2: Actions** - getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial, getMaterialCategories.

- [ ] **Step 3: List page** - DataTable with columns: name, category, stock (formatted with unit), min stock warning, unit cost, supplier. Low stock highlighting.

- [ ] **Step 4: New/Edit form** - Select category, unit dropdown (Vietnamese units), stock inputs, cost input.

- [ ] **Step 5: Commit**

---

### Task 14: Inventory Management

**Files:**
- Create: `src/schemas/inventory.ts`, `src/actions/inventory.ts`, `src/app/(dashboard)/inventory/page.tsx`

- [ ] **Step 1: Schema** - materialId, type (IN/OUT/ADJUSTMENT), quantity, date, reference, notes.

- [ ] **Step 2: Actions** - getInventoryTransactions, createTransaction (updates material stock), getInventoryByMaterial.

- [ ] **Step 3: Page** - Transaction history table, add transaction form (auto-updates stock), stock summary by material.

- [ ] **Step 4: Commit**

---

### Task 15: Financial Management

**Files:**
- Create: `src/schemas/financial.ts`, `src/actions/financial.ts`, `src/app/(dashboard)/expenses/page.tsx`, `src/app/(dashboard)/accounts/page.tsx`, `src/app/(dashboard)/debts/page.tsx`

- [ ] **Step 1: Schemas** - expenseSchema, accountSchema, transactionSchema, debtSchema, paymentSchema.

- [ ] **Step 2: Actions** - CRUD for expenses, accounts, transactions, debts, payments. Auto-update account balances on transactions. Auto-update debt status on payments.

- [ ] **Step 3: Expenses page** - DataTable with category filter, status badges, total by category.

- [ ] **Step 4: Accounts page** - Account cards showing balance, transaction history, add transaction form.

- [ ] **Step 5: Debts page** - Debt list with supplier/worker, amount/paid/remaining, status badges, add payment form.

- [ ] **Step 6: Commit**

---

### Task 16: Photo Management

**Files:**
- Create: `src/actions/photos.ts`, `src/app/(dashboard)/photos/page.tsx`, `src/app/api/upload/route.ts`

- [ ] **Step 1: Upload API route** - Multipart form handler, validate file type (image/*, max 10MB), upload to MinIO, return URL.

- [ ] **Step 2: Photo actions** - getPhotos, createPhoto, deletePhoto (also delete from MinIO).

- [ ] **Step 3: Photos page** - Grid gallery view, upload button with FileUpload component, filter by date/project, lightbox for viewing.

- [ ] **Step 4: Commit**

---

### Task 17: Suppliers CRUD

**Files:**
- Create: `src/schemas/supplier.ts`, `src/actions/suppliers.ts`, `src/app/(dashboard)/suppliers/page.tsx`

- [ ] **Step 1: Schema** - name, contact, phone, email, address, taxCode, notes.

- [ ] **Step 2: Actions** - full CRUD, getSupplierWithOrders, getSupplierDebt.

- [ ] **Step 3: Page** - DataTable with contact info, debt balance, order count. Link to supplier detail with order history.

- [ ] **Step 4: Commit**

---

### Task 18: Workers & Attendance

**Files:**
- Create: `src/schemas/worker.ts`, `src/actions/workers.ts`, `src/app/(dashboard)/workers/page.tsx`, `src/app/(dashboard)/attendance/page.tsx`

- [ ] **Step 1: Schemas** - workerSchema, attendanceSchema.

- [ ] **Step 2: Actions** - CRUD workers, bulk attendance entry for a date, getAttendanceReport.

- [ ] **Step 3: Workers page** - List with name, skill, daily wage, status.

- [ ] **Step 4: Attendance page** - Date picker, table of workers with checkboxes for present/absent/late, bulk save.

- [ ] **Step 5: Commit**

---

### Task 19: Purchase Orders

**Files:**
- Create: `src/schemas/po.ts`, `src/actions/purchase-orders.ts`, `src/app/(dashboard)/purchase-orders/page.tsx`

- [ ] **Step 1: Schema** - poSchema (supplierId, projectId, orderDate, deliveryDate, status, notes), poItemSchema (materialId, quantity, unitPrice).

- [ ] **Step 2: Actions** - CRUD POs with items, update status workflow (DRAFT -> SENT -> RECEIVED), auto-create inventory transactions on RECEIVED.

- [ ] **Step 3: Page** - PO list with status, total amount, supplier. Detail view with items table.

- [ ] **Step 4: Commit**

---

### Task 20: Documents

**Files:**
- Create: `src/actions/documents.ts`, `src/app/(dashboard)/documents/page.tsx`, `src/app/api/upload/document/route.ts`

- [ ] **Step 1: Document upload route** - Similar to photo upload but for all file types, max 50MB.

- [ ] **Step 2: Document actions** - CRUD with file upload, search by name/tags.

- [ ] **Step 3: Page** - Document library with category filter, file type icons, search, download links.

- [ ] **Step 4: Commit**

---

### Task 21: Reports

**Files:**
- Create: `src/actions/reports.ts`, `src/app/(dashboard)/reports/page.tsx`

- [ ] **Step 1: Report actions** - getProgressReport, getFinancialReport, getMaterialUsageReport, getSupplierReport, getWorkerReport, getDebtReport.

- [ ] **Step 2: Reports page** - Tabbed interface with different report types, charts (Recharts), export to CSV button.

- [ ] **Step 3: CSV export utility** - Convert data arrays to CSV with Vietnamese encoding.

- [ ] **Step 4: Commit**

---

### Task 22: Settings & User Management

**Files:**
- Create: `src/actions/settings.ts`, `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/settings/users/page.tsx`

- [ ] **Step 1: Settings actions** - getSettings, updateSetting, getUsers, createUser, updateUser, deleteUser, updateUserPermissions.

- [ ] **Step 2: Settings page** - General settings (project coordinates, weather API key), appearance (theme default).

- [ ] **Step 3: User management** - Admin only. User list, create/edit user, permission matrix (checkboxes per module per action).

- [ ] **Step 4: Commit**

---

### Task 23: Audit Logging Middleware

**Files:**
- Create: `src/lib/audit.ts`

- [ ] **Step 1: Create audit helper**

```typescript
// src/lib/audit.ts
import { prisma } from "./prisma";

export async function logAudit(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entity: string,
  entityId: string,
  changes: { oldValues?: Record<string, any>; newValues?: Record<string, any> }
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes: JSON.stringify(changes),
    },
  });
}
```

- [ ] **Step 2: Integrate into Server Actions** - Call logAudit in create/update/delete actions where user context is available.

- [ ] **Step 3: Commit**

---

### Task 24: Error Handling & Loading States

**Files:**
- Create: `src/components/ui/error-boundary.tsx`, `src/app/(dashboard)/error.tsx`, `src/app/(dashboard)/not-found.tsx`

- [ ] **Step 1: Error boundary** - Client component with fallback UI, retry button.

- [ ] **Step 2: Error page** - Server error page with Vietnamese message.

- [ ] **Step 3: Not found page** - 404 page with link back to dashboard.

- [ ] **Step 4: Add loading states** to all pages with appropriate skeletons.

- [ ] **Step 5: Commit**

---

### Task 25: Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `scripts/backup.sh`, `scripts/restore.sh`

- [ ] **Step 1: Dockerfile** - Multi-stage: node:20-alpine base, install deps, build Next.js, production run.

- [ ] **Step 2: docker-compose.yml** - Services: app (Next.js), minio (S3 storage), minio-createbucket (init). Volumes for SQLite data and MinIO data.

- [ ] **Step 3: .dockerignore** - node_modules, .next, .git, .env.local, etc.

- [ ] **Step 4: Backup script** - SQLite .backup command, copy to timestamped file.

- [ ] **Step 5: Restore script** - Replace SQLite db from backup file.

- [ ] **Step 6: Commit**

---

### Task 26: PWA Setup

**Files:**
- Create: `public/manifest.json`, `public/sw.js`, `src/app/manifest.ts`

- [ ] **Step 1: manifest.ts** - App metadata, icons, theme color, display standalone.

- [ ] **Step 2: Service worker** - Cache static assets, offline fallback.

- [ ] **Step 3: Commit**

---

### Task 27: Final Polish & Documentation

**Files:**
- Create: `README.md`, `docs/DEPLOYMENT.md`

- [ ] **Step 1: README.md** - Project overview, setup instructions (npm install, prisma migrate, npm run dev), Docker instructions, demo credentials.

- [ ] **Step 2: DEPLOYMENT.md** - Docker compose up, environment variables, backup/restore, production considerations.

- [ ] **Step 3: Run full test** - npm install -> prisma migrate -> db:seed -> npm run dev -> verify all pages load.

- [ ] **Step 4: Final commit**

---

## File Map Summary

| File | Responsibility |
|------|---------------|
| `prisma/schema.prisma` | Complete database schema |
| `prisma/seed.ts` | Demo data |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/utils.ts` | Vietnamese formatters, status labels, permissions |
| `src/lib/minio.ts` | MinIO S3 client |
| `src/lib/weather.ts` | OpenWeatherMap integration |
| `src/lib/auth.ts` | Auth helpers, permission checks |
| `src/lib/audit.ts` | Audit logging |
| `src/actions/*.ts` | Server Actions per module |
| `src/schemas/*.ts` | Zod validation schemas |
| `src/components/ui/*` | shadcn components + custom (StatCard, StatusBadge, DataTable) |
| `src/components/layout/*` | Sidebar, Header, ThemeToggle |
| `src/components/dashboard/*` | WeatherWidget, ProgressChart, RecentPhotos |
| `src/components/forms/*` | DatePicker, FileUpload |
| `src/app/(auth)/*` | Login page |
| `src/app/(dashboard)/*` | All app pages |
| `src/app/api/*` | Upload routes, NextAuth |
| `Dockerfile` | Production Docker image |
| `docker-compose.yml` | Local dev + production compose |
