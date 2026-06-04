# Detail Views & System Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Chi tiết" tabs to all entity edit/view pages, and add per-user formatting settings (language/currency/date/number/VND decimals=0).

**Architecture:** Insert `Tabs` wrapper around existing content in `[id]/edit/` and `[id]/` pages. New `UserSetting` model stores per-user preferences. React Context `UserSettingsProvider` supplies formatting functions app-wide.

**Tech Stack:** Prisma/Next.js/React/Tabs shadcn/ui/Zod

---

## Files Map

### New files
| File | Responsibility |
|------|---------------|
| `src/components/detail-view-tabs.tsx` | Shared tab layout wrapper (Chi tiết / Sửa) with URL sync |
| `src/actions/user-settings.ts` | Server Actions for `UserSetting` CRUD |
| `src/hooks/use-user-settings.ts` | React Context + hook for formatting functions |
| `prisma/migrations/*_add_user_setting/` | DB migration |
| `src/components/detail-views/worker-detail.tsx` | Worker read-only detail component |
| `src/components/detail-views/account-detail.tsx` | Account detail component |
| `src/components/detail-views/material-detail.tsx` | Material detail component |
| `src/components/detail-views/supplier-detail.tsx` | Supplier detail component |
| `src/components/detail-views/project-detail.tsx` | Project detail component |
| `src/app/(dashboard)/accounts/[id]/page.tsx` | Account detail/edit page |

### Modified files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `UserSetting` model |
| `src/lib/utils.ts` | Update `formatCurrency`/`formatDate`/`formatNumber` to accept options override |
| `src/app/(dashboard)/layout.tsx` | Wrap with `UserSettingsProvider` |
| `src/app/(dashboard)/settings/page.tsx` | Add "Cá nhân hóa" section with format settings form |
| `src/app/(dashboard)/workers/[id]/edit/page.tsx` | Wrap with `DetailViewTabs` |
| `src/app/(dashboard)/purchase-orders/[id]/page.tsx` | Add "Sửa" tab |
| `src/app/(dashboard)/purchase-orders/[id]/page-client.tsx` | Tabs wrapper |
| `src/app/(dashboard)/materials/[id]/edit/page.tsx` | Add "Chi tiết" tab |
| `src/app/(dashboard)/suppliers/[id]/edit/page.tsx` | Add "Chi tiết" tab |
| `src/app/(dashboard)/projects/[id]/edit/page.tsx` | Add "Chi tiết" tab |
| `src/app/(dashboard)/stages/[id]/page.tsx` | Add "Sửa" tab |
| `src/app/(dashboard)/stages/[id]/page-client.tsx` | Tabs wrapper |
| `src/actions/workers.ts` | Add `getWorkerDetail` with full relations |
| `src/app/(dashboard)/workers/columns.tsx` | Update link to `?tab=view` |
| `src/app/(dashboard)/purchase-orders/columns.tsx` | Update link to `?tab=view` |
| `src/app/(dashboard)/materials/columns.tsx` | Update link to `?tab=view` |
| `src/app/(dashboard)/suppliers/columns.tsx` | Update link to `?tab=view` |
| `src/app/(dashboard)/projects/columns.tsx` | Update link to `?tab=view` |

---
## Task 1: UserSetting Prisma Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*_add_user_setting/`

- [ ] **Step 1: Add model to schema**

Add after the existing `Setting` model block in `prisma/schema.prisma`:

```prisma
model UserSetting {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  language     String   @default("vi")
  theme        String   @default("light")
  dateFormat   String   @default("dd/MM/yyyy")
  timezone     String   @default("Asia/Ho_Chi_Minh")
  currency     String   @default("VND")
  currencyDec  Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_user_setting
```

Expected: new migration created, Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add UserSetting model for per-user preferences"
```

---

## Task 2: UserSetting Server Actions

**Files:**
- Create: `src/actions/user-settings.ts`

- [ ] **Step 1: Create actions file**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type UserSettingData = {
  language: string;
  theme: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  currencyDec: number;
};

export async function getUserSetting(): Promise<UserSettingData | null> {
  const user = await requireUser();
  const setting = await prisma.userSetting.findUnique({
    where: { userId: user.id },
  });
  if (!setting) return null;
  return {
    language: setting.language,
    theme: setting.theme,
    dateFormat: setting.dateFormat,
    timezone: setting.timezone,
    currency: setting.currency,
    currencyDec: setting.currencyDec,
  };
}

export async function upsertUserSetting(data: UserSettingData) {
  const user = await requireUser();
  await prisma.userSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function applyUserTheme(theme: string) {
  await requireUser();
  // Persisted via upsertUserSetting; theme is also applied client-side
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/user-settings.ts
git commit -m "feat: add UserSetting server actions (get/upsert)"
```

---

## Task 3: UserSettings Context & Hook

**Files:**
- Create: `src/hooks/use-user-settings.tsx`

- [ ] **Step 1: Create provider + hook**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserSettingData } from "@/actions/user-settings";

const DEFAULT_SETTINGS: UserSettingData = {
  language: "vi",
  theme: "light",
  dateFormat: "dd/MM/yyyy",
  timezone: "Asia/Ho_Chi_Minh",
  currency: "VND",
  currencyDec: 0,
};

type FormatCurrencyFn = (amount: number | string) => string;
type FormatDateFn = (date: Date | string | null) => string;
type FormatNumberFn = (num: number | string, decimals?: number) => string;

interface UserSettingsContextValue {
  settings: UserSettingData;
  formatCurrency: FormatCurrencyFn;
  formatDate: FormatDateFn;
  formatNumber: FormatNumberFn;
  updateSettings: (data: UserSettingData) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function buildFormatCurrency(settings: UserSettingData): FormatCurrencyFn {
  return (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0 ₫";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: settings.currencyDec,
      maximumFractionDigits: settings.currencyDec,
    }).format(num);
  };
}

function buildFormatDate(settings: UserSettingData): FormatDateFn {
  return (date: Date | string | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };
}

function buildFormatNumber(settings: UserSettingData): FormatNumberFn {
  return (num: number | string, decimals = 2) => {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(value)) return "0";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };
}

export function UserSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: UserSettingData | null;
}) {
  const [settings, setSettings] = useState<UserSettingData>(initialSettings ?? DEFAULT_SETTINGS);

  const updateSettings = useCallback(async (data: UserSettingData) => {
    const { upsertUserSetting } = await import("@/actions/user-settings");
    await upsertUserSetting(data);
    setSettings(data);
    // Apply theme to DOM
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (data.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(data.theme);
    }
  }, []);

  // Apply theme on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, []);

  const value: UserSettingsContextValue = {
    settings,
    formatCurrency: buildFormatCurrency(settings),
    formatDate: buildFormatDate(settings),
    formatNumber: buildFormatNumber(settings),
    updateSettings,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): UserSettingsContextValue {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error("useUserSettings must be used within UserSettingsProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-user-settings.tsx
git commit -m "feat: add UserSettingsProvider + useUserSettings hook"
```

---

## Task 4: Wrap Dashboard Layout with Provider

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Read layout.tsx to find correct injection point**

```bash
cat src/app/(dashboard)/layout.tsx
```

- [ ] **Step 2: Layout reads user settings server-side, passes to client**

Add in the server component that fetches settings, then pass to a client wrapper. Assuming layout structure:

```tsx
// In server layout: fetch user settings
import { getUserSetting } from "@/actions/user-settings";

// Inside the component
const userSettings = await getUserSetting();

// Pass as prop to a client wrapper
```

Create a client wrapper that wraps children with `<UserSettingsProvider>`:

```tsx
// src/components/dashboard-layout-client.tsx
"use client";

import { UserSettingsProvider } from "@/hooks/use-user-settings";
import type { UserSettingData } from "@/actions/user-settings";
import { ReactNode } from "react";

export function DashboardLayoutClient({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: UserSettingData | null;
}) {
  return (
    <UserSettingsProvider initialSettings={initialSettings}>
      {children}
    </UserSettingsProvider>
  );
}
```

In `layout.tsx`: import `DashboardLayoutClient`, wrap the children (content area only, not sidebar/header).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard-layout-client.tsx src/app/\(dashboard\)/layout.tsx
git commit -m "feat: wrap dashboard in UserSettingsProvider"
```

---

## Task 5: Update Format Utilities

**Files:**
- Modify: `src/lib/utils.ts`

Update `formatCurrency` to accept an options override for `currencyDec` (the Context hook is the primary way, but for Server Components we keep direct import working):

- [ ] **Step 1: Add options overload to formatCurrency**

```ts
export function formatCurrency(
  amount: number | string,
  options?: { currencyDec?: number }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: options?.currencyDec ?? 0,
    maximumFractionDigits: options?.currencyDec ?? 0,
  }).format(num);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add options to formatCurrency for dynamic decimal places"
```

---

## Task 6: Create DetailViewTabs Shared Component

**Files:**
- Create: `src/components/detail-view-tabs.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ReactNode, Suspense, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailViewTabsProps {
  viewTab: ReactNode;
  editTab: ReactNode;
  viewLabel?: string;
  editLabel?: string;
  defaultTab?: "view" | "edit";
}

function DetailViewTabsInner({
  viewTab,
  editTab,
  viewLabel = "Chi tiết",
  editLabel = "Chỉnh sửa",
  defaultTab = "view",
}: DetailViewTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || defaultTab;

  const onTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <Tabs value={currentTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="view">{viewLabel}</TabsTrigger>
        <TabsTrigger value="edit">{editLabel}</TabsTrigger>
      </TabsList>
      <TabsContent value="view" className="mt-6">{viewTab}</TabsContent>
      <TabsContent value="edit" className="mt-6">{editTab}</TabsContent>
    </Tabs>
  );
}

export function DetailViewTabs(props: DetailViewTabsProps) {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <DetailViewTabsInner {...props} />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/detail-view-tabs.tsx
git commit -m "feat: add DetailViewTabs shared component with URL sync"
```

---

## Task 7: Worker Detail View + Tabs

**Files:**
- Create: `src/components/detail-views/worker-detail.tsx`
- Modify: `src/actions/workers.ts`
- Modify: `src/app/(dashboard)/workers/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/workers/columns.tsx`

- [ ] **Step 1: Add detail fetch to worker action**

In `src/actions/workers.ts`, add `getWorkerDetail`:

```ts
export async function getWorkerDetail(id: string) {
  await requirePermission("workers", "view");
  return prisma.worker.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { attendances: true } },
      attendances: { orderBy: { date: "desc" }, take: 10 },
      debts: {
        where: { deletedAt: null },
        select: { id: true, amount: true, paidAmount: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}
```

- [ ] **Step 2: Create worker detail component**

```tsx
// src/components/detail-views/worker-detail.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";

type WorkerDetailProps = {
  worker: {
    id: string;
    name: string;
    phone: string | null;
    idCard: string | null;
    skill: string | null;
    dailyWage: number;
    status: string;
    notes: string | null;
    createdAt: Date | string;
    _count: { attendances: number };
    attendances: { id: string; date: Date | string; status: string }[];
    debts: { id: string; amount: number; paidAmount: number; type: string; status: string; createdAt: Date | string }[];
  };
};

export function WorkerDetail({ worker }: WorkerDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Số điện thoại:</span> <span className="font-medium">{worker.phone || "-"}</span></div>
          <div><span className="text-muted-foreground">CMND/CCCD:</span> <span className="font-medium">{worker.idCard || "-"}</span></div>
          <div><span className="text-muted-foreground">Tay nghề:</span> <span className="font-medium">{worker.skill || "-"}</span></div>
          <div><span className="text-muted-foreground">Lương ngày:</span> <span className="font-medium">{formatCurrency(worker.dailyWage)}</span></div>
          <div><span className="text-muted-foreground">Trạng thái:</span> <Badge variant={worker.status === "ACTIVE" ? "default" : "secondary"}>{worker.status === "ACTIVE" ? "Đang làm" : "Ngưng làm"}</Badge></div>
          <div><span className="text-muted-foreground">Số lần chấm công:</span> <span className="font-medium">{worker._count.attendances}</span></div>
        </CardContent>
      </Card>

      {worker.notes && (
        <Card>
          <CardHeader><CardTitle>Ghi chú</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{worker.notes}</p></CardContent>
        </Card>
      )}

      {worker.debts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Công nợ gần đây</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              {worker.debts.map((d) => (
                <div key={d.id} className="flex justify-between border-b pb-1">
                  <span>{formatDate(d.createdAt)} - {d.type === "PAYABLE" ? "Phải trả" : "Phải thu"}</span>
                  <span className="font-mono">{formatCurrency(d.amount - d.paidAmount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update workers edit page with tabs**

```tsx
// src/app/(dashboard)/workers/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/forms/worker-form";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { WorkerDetail } from "@/components/detail-views/worker-detail";
import { getWorker, getWorkerDetail, updateWorker } from "@/actions/workers";
import { serialize } from "@/lib/serialize";
import type { WorkerFormData } from "@/schemas/worker";

export default async function EditWorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const worker = await getWorker(id);
  if (!worker) notFound();

  const defaultValues: Partial<WorkerFormData> = serialize({
    name: worker.name,
    phone: worker.phone ?? "",
    idCard: worker.idCard ?? "",
    skill: worker.skill ?? "",
    dailyWage: worker.dailyWage,
    notes: worker.notes ?? "",
  });

  const detailWorker = await getWorkerDetail(id);
  if (!detailWorker) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{worker.name}</h1>
      <DetailViewTabs
        viewTab={<WorkerDetail worker={serialize(detailWorker)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <WorkerForm
                defaultValues={defaultValues}
                onSubmit={updateWorker.bind(null, id)}
                submitLabel="Cập nhật"
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Update worker columns link to `?tab=view`**

In `src/app/(dashboard)/workers/columns.tsx`, update the name link and Sửa button:

```tsx
// name column cell:
<Link
  href={`/workers/${row.original.id}/edit?tab=view`}
  className="font-medium hover:underline"
>
  {row.getValue("name")}
</Link>

// actions column:
<Link href={`/workers/${row.original.id}/edit?tab=edit`}>
  <Button variant="outline" size="sm">Sửa</Button>
</Link>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/detail-views/worker-detail.tsx src/actions/workers.ts src/app/\(dashboard\)/workers/\[id\]/edit/page.tsx src/app/\(dashboard\)/workers/columns.tsx
git commit -m "feat: add worker detail view with tabs"
```

---

## Task 8: Material Detail View + Tabs

**Files:**
- Create: `src/components/detail-views/material-detail.tsx`
- Modify: `src/app/(dashboard)/materials/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/materials/columns.tsx`

- [ ] **Step 1: Create material detail component**

```tsx
// src/components/detail-views/material-detail.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserSettings } from "@/hooks/use-user-settings";

type MaterialDetailProps = {
  material: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    unitCost: number;
    category: { name: string } | null;
    supplier: { id: string; name: string } | null;
    createdAt: Date | string;
  };
};

export function MaterialDetail({ material }: MaterialDetailProps) {
  const { formatCurrency, formatNumber, formatDate } = useUserSettings();
  const isLowStock = Number(material.currentStock) < Number(material.minStock);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin vật liệu</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Danh mục:</span> <span className="font-medium">{material.category?.name ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Đơn vị:</span> <span className="font-medium">{material.unit}</span></div>
          <div><span className="text-muted-foreground">Tồn kho:</span> <span className={`font-medium ${isLowStock ? "text-destructive" : ""}`}>{formatNumber(material.currentStock)}</span></div>
          <div><span className="text-muted-foreground">Tồn tối thiểu:</span> <span className="font-medium">{formatNumber(material.minStock)}</span></div>
          <div><span className="text-muted-foreground">Đơn giá:</span> <span className="font-medium">{formatCurrency(material.unitCost)}</span></div>
          <div><span className="text-muted-foreground">Nhà cung cấp:</span> <span className="font-medium">{material.supplier?.name ?? "-"}</span></div>
        </CardContent>
      </Card>

      {isLowStock && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-destructive text-sm">
            ⚠ Tồn kho thấp hơn mức tối thiểu ({formatNumber(material.minStock)})
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update material edit page with tabs**

```tsx
// src/app/(dashboard)/materials/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";
import { MaterialPriceSection } from "@/components/material-price-section";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { MaterialDetail } from "@/components/detail-views/material-detail";
import { getMaterial, updateMaterial, getMaterialCategories } from "@/actions/materials";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import type { MaterialFormData } from "@/schemas/material";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getMaterial(id);
  if (!material) notFound();

  const [categories, suppliers] = await Promise.all([
    getMaterialCategories(),
    prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  const defaultValues: Partial<MaterialFormData> = serialize({
    name: material.name,
    categoryId: material.categoryId,
    unit: material.unit,
    currentStock: material.currentStock,
    minStock: material.minStock,
    unitCost: material.unitCost,
    supplierId: material.supplierId ?? "",
  });

  const prices = serialize(material.prices ?? []);
  const serializedSuppliers = serialize(suppliers);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{material.name}</h1>
      <DetailViewTabs
        viewTab={<MaterialDetail material={serialize(material)} />}
        editTab={
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Thông tin vật liệu</CardTitle></CardHeader>
              <CardContent>
                <MaterialForm
                  defaultValues={defaultValues}
                  onSubmit={updateMaterial.bind(null, id)}
                  submitLabel="Cập nhật"
                  categories={categories}
                  suppliers={serializedSuppliers}
                />
              </CardContent>
            </Card>
            <MaterialPriceSection materialId={id} prices={prices} />
          </div>
        }
      />
    </div>
  );
}
```

- [ ] **Step 3: Update material columns link**

In `src/app/(dashboard)/materials/columns.tsx`:

```tsx
// name link to `?tab=view`
href={`/materials/${row.original.id}/edit?tab=view`}
// Sửa button to `?tab=edit`
href={`/materials/${row.original.id}/edit?tab=edit`}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/detail-views/material-detail.tsx src/app/\(dashboard\)/materials/\[id\]/edit/page.tsx src/app/\(dashboard\)/materials/columns.tsx
git commit -m "feat: add material detail view with tabs"
```

---

## Task 9: Supplier Detail View + Tabs

**Files:**
- Create: `src/components/detail-views/supplier-detail.tsx`
- Modify: `src/app/(dashboard)/suppliers/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/suppliers/columns.tsx`

- [ ] **Step 1: Create supplier detail component**

```tsx
// src/components/detail-views/supplier-detail.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserSettings } from "@/hooks/use-user-settings";

type SupplierDetailProps = {
  supplier: {
    id: string;
    name: string;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxCode: string | null;
    notes: string | null;
    _count: { purchaseOrders: number };
  };
};

export function SupplierDetail({ supplier }: SupplierDetailProps) {
  const { formatDate } = useUserSettings();

  return (
    <Card>
      <CardHeader><CardTitle>Thông tin nhà cung cấp</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Người liên hệ:</span> <span className="font-medium">{supplier.contact || "-"}</span></div>
        <div><span className="text-muted-foreground">Số điện thoại:</span> <span className="font-medium">{supplier.phone || "-"}</span></div>
        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{supplier.email || "-"}</span></div>
        <div><span className="text-muted-foreground">Địa chỉ:</span> <span className="font-medium">{supplier.address || "-"}</span></div>
        <div><span className="text-muted-foreground">Mã số thuế:</span> <span className="font-medium">{supplier.taxCode || "-"}</span></div>
        <div><span className="text-muted-foreground">Số đơn hàng:</span> <span className="font-medium">{supplier._count.purchaseOrders}</span></div>
      </CardContent>
      {supplier.notes && (
        <CardContent className="border-t pt-4">
          <p className="text-xs text-muted-foreground">Ghi chú</p>
          <p className="text-sm">{supplier.notes}</p>
        </CardContent>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Update supplier edit page with tabs** (similar pattern to worker)

- [ ] **Step 3: Update supplier columns link**

- [ ] **Step 4: Add detail fetch to supplier action**

In `src/actions/suppliers.ts`, ensure `getSupplier` includes `_count: { select: { purchaseOrders: true } }`.

- [ ] **Step 5: Commit**

```bash
git add src/components/detail-views/supplier-detail.tsx src/app/\(dashboard\)/suppliers/\[id\]/edit/page.tsx src/app/\(dashboard\)/suppliers/columns.tsx src/actions/suppliers.ts
git commit -m "feat: add supplier detail view with tabs"
```

---

## Task 10: Project Detail View + Tabs

**Files:**
- Create: `src/components/detail-views/project-detail.tsx`
- Modify: `src/app/(dashboard)/projects/[id]/edit/page.tsx`
- Modify: `src/app/(dashboard)/projects/columns.tsx`
- Modify: `src/actions/projects.ts`

- [ ] **Step 1: Create project detail component**

```tsx
// src/components/detail-views/project-detail.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserSettings } from "@/hooks/use-user-settings";

type ProjectDetailProps = {
  project: {
    id: string;
    name: string;
    address: string | null;
    budget: number;
    status: string;
    progress: number;
    startDate: Date | string | null;
    endDate: Date | string | null;
    description: string | null;
    _count: { stages: number };
  };
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();
  const statusLabels: Record<string, string> = { PLANNING: "Lập kế hoạch", ACTIVE: "Đang thi công", PAUSED: "Tạm dừng", COMPLETED: "Hoàn thành" };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin dự án</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ</span> <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Địa chỉ:</span> <span className="font-medium">{project.address || "-"}</span></div>
            <div><span className="text-muted-foreground">Ngân sách:</span> <span className="font-medium">{formatCurrency(project.budget)}</span></div>
            <div><span className="text-muted-foreground">Trạng thái:</span> <Badge>{statusLabels[project.status] || project.status}</Badge></div>
            <div><span className="text-muted-foreground">Số giai đoạn:</span> <span className="font-medium">{project._count.stages}</span></div>
            <div><span className="text-muted-foreground">Bắt đầu:</span> <span className="font-medium">{formatDate(project.startDate)}</span></div>
            <div><span className="text-muted-foreground">Kết thúc:</span> <span className="font-medium">{formatDate(project.endDate)}</span></div>
          </div>
          {project.description && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">Mô tả</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Update projects edit page with tabs**

- [ ] **Step 3: Update project columns link**

- [ ] **Step 4: Add `_count: { select: { stages: true } }` to `getProject` in `src/actions/projects.ts`**

- [ ] **Step 5: Commit**

---

## Task 11: Purchase Order — Merge View & Edit Pages with Tabs

**Files:**
- Modify: `src/app/(dashboard)/purchase-orders/[id]/page.tsx`
- Modify: `src/app/(dashboard)/purchase-orders/[id]/page-client.tsx`
- Modify: `src/app/(dashboard)/purchase-orders/columns.tsx`

Currently `/purchase-orders/[id]` shows detail, and `/purchase-orders/[id]/edit` is a separate page. Merge them into one tabbed page.

- [ ] **Step 1: Restructure PO page with tabs**

`/purchase-orders/[id]/page.tsx` (server):
```tsx
import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/actions/purchase-orders";
import { serialize } from "@/lib/serialize";
import PurchaseOrderDetailPage from "./page-client";

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  return <PurchaseOrderDetailPage order={serialize(order)} />;
}
```

`/purchase-orders/[id]/page-client.tsx` (currently just detail): insert `DetailViewTabs` wrapper. "Chi tiết" keeps existing content, "Sửa" loads `PurchaseOrderForm` (may need to create or reuse from `/edit` page).

- [x] Step 2: Update PO columns to link to `?tab=view` instead of bare ID

- [ ] Step 3: Commit

---

## Task 12: Stage — Add Edit Tab

**Files:**
- Modify: `src/app/(dashboard)/stages/[id]/page.tsx`
- Modify: `src/app/(dashboard)/stages/[id]/page-client.tsx`

- [ ] **Step 1: Add DetailViewTabs to stage page**

Wrap stage content in `DetailViewTabs`. "Sửa" tab shows a `StageForm` for editing name, dates, budget, notes. Reuse the stage update server action.

- [ ] **Step 2: Create StageForm component (if needed)**

Alternatively, inline a simple edit form in the page-client.

- [ ] **Step 3: Commit**

---

## Task 13: Account Detail Page

**Files:**
- Create: `src/app/(dashboard)/accounts/[id]/page.tsx`
- Create: `src/components/detail-views/account-detail.tsx`

Currently accounts has no `[id]` route. Create one.

- [ ] **Step 1: Create Server page**

```tsx
// src/app/(dashboard)/accounts/[id]/page.tsx
import { notFound } from "next/navigation";
import { getAccountDetail, updateAccount } from "@/actions/financial";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { AccountDetail } from "@/components/detail-views/account-detail";
import { serialize } from "@/lib/serialize";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionForm } from "@/components/forms/transaction-form";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{account.name}</h1>
      <DetailViewTabs
        viewTab={<AccountDetail account={serialize(account)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <TransactionForm accounts={[{ id: account.id, name: account.name, type: account.type }]} />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
```

- [ ] **Step 2: Create account detail component**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

export function AccountDetail({ account }: { account: any }) {
  const { formatCurrency, formatDate } = useUserSettings();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{account.name}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(account.balance)}</div>
          <Badge variant="outline" className="mt-2">{account.type === "CASH" ? "Tiền mặt" : "Ngân hàng"}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Giao dịch gần đây ({account.transactions?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {(!account.transactions || account.transactions.length === 0) ? (
            <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
          ) : (
            <div className="text-sm space-y-2">
              {account.transactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between border-b pb-1">
                  <span>{formatDate(tx.date)} - {tx.description || "-"}</span>
                  <span className={cn("font-mono", tx.type === "INCOME" ? "text-green-600" : "text-red-600")}>
                    {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Add `getAccountDetail` to `src/actions/financial.ts`**

```ts
export async function getAccountDetail(id: string) {
  await requirePermission("accounts", "view");
  return prisma.account.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: "desc" }, take: 20 },
    },
  });
}
```

- [ ] **Step 4: Commit**

---

## Task 14: Settings — Add Personalization Section

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Add "Cá nhân hóa" Card to settings page**

Add a new section before the "Thông tin" card:

```tsx
import { useUserSettings } from "@/hooks/use-user-settings";
// Inside component:
const { settings, updateSettings } = useUserSettings();

const [lang, setLang] = useState(settings.language);
const [dateFmt, setDateFmt] = useState(settings.dateFormat);
const [tz, setTz] = useState(settings.timezone);
const [currency, setCurrency] = useState(settings.currency);
const [curDec, setCurDec] = useState(settings.currencyDec);

async function handleSavePersonalization() {
  await updateSettings({
    language: lang,
    theme, // reuse existing theme state
    dateFormat: dateFmt,
    timezone: tz,
    currency,
    currencyDec: curDec,
  });
}
```

Form fields:
- **Ngôn ngữ**: Select `vi` / `en`
- **Định dạng ngày**: Select `dd/MM/yyyy` / `MM/dd/yyyy` / `yyyy-MM-dd`
- **Múi giờ**: Select common ones (`Asia/Ho_Chi_Minh`, `Asia/Bangkok`, `UTC`, etc.)
- **Tiền tệ**: Select `VND` / `USD`
- **Số thập phân tiền tệ**: Input number, mặc định 0

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/settings/page.tsx
git commit -m "feat: add per-user personalization section to settings"
```

---

## Task 15: Build & Verify

**Files:** none

- [ ] **Step 1: Build production**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 2: Check for ESLint issues**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run existing E2E tests**

```bash
npx playwright test tests/e2e.spec.ts
```

Expected: 29 passed.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "build: verify build and tests pass"
```
