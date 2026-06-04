# Design Spec: Detail Views & System Settings

## 1. Overview
The project needs complete "detail views" for all entities (Workers, Users, Purchase Orders, Materials, Suppliers, Projects, Stages) and a per-user "System Settings" module to format numbers, dates, currency, and language consistently across the app. 

## 2. Detail Views Architecture

Instead of separate `/[id]/view` pages, we will integrate a Tabbed layout directly into the existing `/[id]/edit/` or `/[id]/` pages to unify View and Edit modes seamlessly.

### 2.1 Tab Layout Component (`DetailViewTabs`)
A reusable wrapper component using Radix UI `Tabs`.
- Tabs: "Chi tiết" (View) and "Sửa" (Edit).
- Prop `defaultTab` allows deep linking (e.g. `?tab=edit`).
- URL query parameters (`?tab=view|edit`) will sync with the selected tab to support link sharing.

### 2.2 Entity Specific Implementations
For each entity, we will update their main ID page:

1. **Workers** (`/workers/[id]/edit/page.tsx`): 
   - View: Worker info, attendance count/history, total wages paid.
   - Edit: Existing `WorkerForm`.
2. **Users / Accounts** (`/accounts/page.tsx`):
   - Currently no `[id]` page. We will add `/accounts/[id]/page.tsx` with View (Balance, Transactions) and Edit (Update Name/Type) tabs.
3. **Purchase Orders** (`/purchase-orders/[id]/page-client.tsx`):
   - Currently has a separate view and `/edit` page. 
   - Will merge into a single `/[id]/page-client.tsx` using Tabs.
4. **Materials** (`/materials/[id]/edit/page.tsx`):
   - View: Category, Unit, Stock, Price history, Usage logs.
   - Edit: Existing `MaterialForm` + `MaterialPriceSection`.
5. **Suppliers** (`/suppliers/[id]/edit/page.tsx`):
   - View: Contact info, Order history, Debt summary.
   - Edit: Existing `SupplierForm`.
6. **Projects** (`/projects/[id]/edit/page.tsx`):
   - View: Progress, Budget summary, Stages list.
   - Edit: Existing `ProjectForm`.
7. **Stages** (`/stages/[id]/page-client.tsx`):
   - Currently has View + Task list.
   - Add "Sửa" tab to edit the Stage itself.

All tables (`columns.tsx`) will be updated to point their "Sửa" or "Chi tiết" links to the appropriate tab (e.g., `href="/workers/123/edit?tab=view"`).

## 3. System Settings (Per-User)

### 3.1 Database Schema
We will add a new model `UserSetting` for per-user preferences, linked to the `User` model. (The existing `Setting` model handles app-wide globals like Weather API keys).

```prisma
model UserSetting {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  language     String   @default("vi")     // vi, en
  theme        String   @default("light")  // light, dark, system
  numberFormat String   @default("vi-VN")  // Use locales to drive dots/commas
  dateFormat   String   @default("dd/MM/yyyy")
  timezone     String   @default("Asia/Ho_Chi_Minh")
  currency     String   @default("VND")
  currencyDec  Int      @default(0)        // 0 for VND
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 3.2 Settings UI (`/settings/users/page.tsx` or `/settings/page.tsx`)
- Enhance `/settings/page.tsx` by adding a "Cá nhân hóa" (Personalization) tab or section.
- Form fields: Language, Theme, Number format locale, Date format string, Timezone, Currency code, Currency decimal places (default 0).
- Save action creates/updates `UserSetting` for the current user.

### 3.3 Formatting Utilities
Update `src/lib/utils.ts` to accept user settings, or create a React Context `UserSettingsProvider` that wraps the app and provides formatted values.
Since Next.js Server Components cannot easily access React Context, we will fetch `UserSetting` in Server Components and pass formatting functions/settings down, or use a singleton/helper for client-side formatting where possible.
Given the instruction to ensure VND decimals = 0, `formatCurrency` will be updated to respect the `currencyDec` setting.

## 4. Error Handling & Testing
- If a user lacks `UserSetting`, fallback to existing Vietnamese defaults.
- Database migration needed to create `UserSetting`.
- Verify E2E tests for the consolidated Edit/View tab routes.