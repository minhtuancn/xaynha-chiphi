# Feature Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade 6 feature groups: Project delete, Stages per-project with weather, Daily logs with morning/afternoon + photos, Materials with price history + pagination, Inventory with export types, Material usage with photos.

**Architecture:** Sequential implementation A→F. Each group modifies schema + pages + actions. Shared components: PhotoUpload, WeatherWidget, PaginationTable. SQLite via Prisma, Next.js 16 App Router, Tailwind CSS, shadcn/ui.

**Tech Stack:** Next.js 16.2.7, Prisma 6.19, SQLite, React 19, Tailwind CSS, shadcn/ui, Open-Meteo API (free weather)

---

## Group A: Projects — Delete with Dependency Check

### Task A1: Add deleteProject server action

**Files:**
- Modify: `src/actions/projects.ts`

- [ ] **Step 1: Add deleteProject action**

Read `src/actions/projects.ts` to understand existing pattern, then add:

```typescript
export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const [stages, dailyLogs, materialUsages, expenses, purchaseOrders, photos, documents, budgets] = await Promise.all([
    prisma.constructionStage.count({ where: { projectId: id, deletedAt: null } }),
    prisma.dailyLog.count({ where: { projectId: id, deletedAt: null } }),
    prisma.materialUsage.count({ where: { projectId: id, deletedAt: null } }),
    prisma.expense.count({ where: { projectId: id, deletedAt: null } }),
    prisma.purchaseOrder.count({ where: { projectId: id, deletedAt: null } }),
    prisma.photo.count({ where: { projectId: id, deletedAt: null } }),
    prisma.document.count({ where: { projectId: id, deletedAt: null } }),
    prisma.budget.count({ where: { projectId: id } }),
  ]);

  const total = stages + dailyLogs + materialUsages + expenses + purchaseOrders + photos + documents + budgets;
  if (total > 0) {
    const parts: string[] = [];
    if (stages) parts.push(`${stages} giai đoạn`);
    if (dailyLogs) parts.push(`${dailyLogs} nhật ký`);
    if (materialUsages) parts.push(`${materialUsages} vật tư sử dụng`);
    if (expenses) parts.push(`${expenses} chi phí`);
    if (purchaseOrders) parts.push(`${purchaseOrders} đơn hàng`);
    if (photos) parts.push(`${photos} ảnh`);
    if (documents) parts.push(`${documents} tài liệu`);
    if (budgets) parts.push(`${budgets} ngân sách`);
    return { success: false, error: `Dự án có ${parts.join(", ")}. Không thể xóa.` };
  }

  await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/projects");
  return { success: true };
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/actions/projects.ts
git commit -m "feat: add deleteProject with dependency check"
```

### Task A2: Add delete button to projects DataTable

**Files:**
- Modify: `src/app/(dashboard)/projects/columns.tsx`

- [ ] **Step 1: Read existing columns file**

Read `src/app/(dashboard)/projects/columns.tsx` to understand the pattern.

- [ ] **Step 2: Add delete action to columns**

Add a delete button to the actions column. Import `deleteProject` from actions, use `useRouter` and `useTransition` for client-side handling. Show AlertDialog confirmation before delete.

The columns file is a `"use client"` component. Add:
- Import `Button`, `AlertDialog` components
- Import `deleteProject` action
- Add delete button with confirmation dialog in the actions cell
- On confirm: call `deleteProject(id)`, show toast with result, refresh page

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/projects/columns.tsx
git commit -m "feat: add delete button to projects DataTable"
```

### Task A3: Test project deletion

- [ ] **Step 1: Start dev server and test manually**

Run: `npm run start -- -p 3050 &`
Navigate to `/projects`, verify delete button appears.
Click delete on a project with data → should show error dialog.
Click delete on the newly created "Test Project E2E" (no data) → should succeed.

- [ ] **Step 2: Add E2E test**

Add to `tests/e2e.spec.ts` in the CRUD Operations describe block:

```typescript
test('delete project without data succeeds', async ({ page }) => {
  // First create a project
  await page.goto(`${BASE_URL}/projects/new`);
  await page.getByLabel('Tên dự án').fill('To Be Deleted');
  await page.getByLabel('Địa chỉ').fill('Delete Test');
  await page.getByLabel('Ngân sách (₫)').fill('100000000');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await page.waitForURL('**/projects', { timeout: 15000 });
  
  // Find and click delete
  const row = page.getByText('To Be Deleted').first();
  await row.waitFor({ state: 'visible', timeout: 10000 });
  // Click delete button in the same row
  const deleteBtn = row.locator('..').locator('..').getByRole('button').last();
  await deleteBtn.click();
  // Confirm dialog
  await page.getByRole('button', { name: /Xóa|Delete/ }).last().click();
  await expect(page.getByText('To Be Deleted')).not.toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test --grep "delete project"`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for project deletion"
```

---

## Group B: Stages — Per-Project + Project Details

### Task B1: Schema change — add coordinates to Project

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add latitude/longitude to Project model**

In `prisma/schema.prisma`, find the `Project` model and add:

```prisma
model Project {
  // ... after existing fields
  latitude    Float?
  longitude   Float?
}
```

- [ ] **Step 2: Push schema to database**

Run: `npx prisma db push`
Expected: "Your database is now in sync with the Prisma schema"

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/data.db
git commit -m "feat: add latitude/longitude to Project model"
```

### Task B2: Update project form with coordinates + geolocation

**Files:**
- Modify: `src/components/forms/project-form.tsx`

- [ ] **Step 1: Read existing project form**

Read `src/components/forms/project-form.tsx` to understand the pattern.

- [ ] **Step 2: Add latitude/longitude fields + geolocation button**

Add two number inputs for latitude/longitude (optional, step=any).
Add a button "Lấy vị trí từ trình duyệt" that calls:
```typescript
navigator.geolocation.getCurrentPosition(
  (pos) => {
    form.setValue("latitude", pos.coords.latitude);
    form.setValue("longitude", pos.coords.longitude);
  },
  (err) => alert("Không thể lấy vị trí: " + err.message)
);
```

Update the form schema (in `src/schemas/project.ts`) to include:
```typescript
latitude: z.number().min(-90).max(90).optional().nullable(),
longitude: z.number().min(-180).max(180).optional().nullable(),
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/project-form.tsx src/schemas/project.ts
git commit -m "feat: add coordinates fields + geolocation to project form"
```

### Task B3: Create WeatherWidget component

**Files:**
- Create: `src/components/weather-widget.tsx`
- Create: `src/app/api/weather/route.ts`

- [ ] **Step 1: Create weather API proxy**

Create `src/app/api/weather/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m`
    );
    const data = await res.json();
    return NextResponse.json({
      temperature: data.current_weather?.temperature,
      weathercode: data.current_weather?.weathercode,
      windspeed: data.current_weather?.windspeed,
      humidity: data.hourly?.relativehumidity_2m?.[0],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create WeatherWidget component**

Create `src/components/weather-widget.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
  humidity: number;
}

const WEATHER_CODES: Record<number, string> = {
  0: "Trời quang", 1: "Hầu hết quang", 2: "Có mây", 3: "U ám",
  45: "Sương mù", 48: "Sương mù băng", 51: "Mưa phùn nhẹ", 53: "Mưa phùn",
  55: "Mưa phùn dày", 61: "Mưa nhẹ", 63: "Mưa vừa", 65: "Mưa to",
  71: "Tuyết nhẹ", 73: "Tuyết vừa", 75: "Tuyết to", 80: "Mưa rào nhẹ",
  81: "Mưa rào", 82: "Mưa rào to", 95: "Giông", 96: "Giông + mưa đá",
};

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/weather?lat=${latitude}&lng=${longitude}`)
      .then((res) => res.json())
      .then((data) => { setWeather(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [latitude, longitude]);

  if (loading) return <Card><CardContent className="py-4 text-center text-muted-foreground">Đang tải thời tiết...</CardContent></Card>;
  if (!weather) return <Card><CardContent className="py-4 text-center text-muted-foreground">Không thể tải thời tiết</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Thời tiết hiện tại</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Thermometer className="h-5 w-5 text-orange-500" />
          <span className="text-2xl font-bold">{weather.temperature}°C</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{WEATHER_CODES[weather.weathercode] || "Không xác định"}</p>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{weather.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{weather.windspeed} km/h</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/weather-widget.tsx src/app/api/weather/route.ts
git commit -m "feat: add WeatherWidget component and weather API proxy"
```

### Task B4: Redesign stages page with project tabs

**Files:**
- Modify: `src/app/(dashboard)/stages/page.tsx`

- [ ] **Step 1: Read existing stages page and actions**

Read `src/app/(dashboard)/stages/page.tsx` and `src/actions/stages.ts`.

- [ ] **Step 2: Redesign stages page with project tabs**

Replace the flat card grid with:
1. Fetch all projects (via `getProjects()`)
2. Render tabs at top (one per project)
3. Default to first project
4. When tab clicked, filter stages by that project's ID
5. Show project summary (address, coordinates, weather) above stages
6. Add "Thêm giai đoạn" button that opens inline form

Use React state `selectedProjectId` to track active tab. Use `"use client"` for the page or extract to a client component.

The stages should be fetched server-side per project. Use a client component wrapper that receives all projects and all stages, then filters client-side.

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/stages/page.tsx
git commit -m "feat: redesign stages page with project tabs"
```

### Task B5: E2E test for stages

- [ ] **Step 1: Add E2E test**

Add to `tests/e2e.spec.ts`:

```typescript
test('stages page shows project tabs', async ({ page }) => {
  await page.goto(`${BASE_URL}/stages`);
  await expect(page).toHaveURL(/.*stages/, { timeout: 10000 });
  // Should show at least one project tab
  await expect(page.getByText('Nhà ở 2 tầng').first()).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test --grep "stages page"`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for stages with project tabs"
```

---

## Group C: Daily Logs — Morning/Afternoon + Weather + Photos

### Task C1: Schema change — add TimeOfDay, WeatherCondition, DailyLogPhoto

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add enums and models**

Add to `prisma/schema.prisma`:

```prisma
enum TimeOfDay {
  MORNING
  AFTERNOON
}

enum WeatherCondition {
  SUN
  RAIN
  CLOUDY
  STORM
  OVERCAST
}

model DailyLogPhoto {
  id          String   @id @default(uuid())
  dailyLogId  String
  dailyLog    DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)
  url         String
  caption     String?
  takenAt     DateTime @default(now())
  deletedAt   DateTime?

  @@index([dailyLogId])
}
```

Add fields to existing `DailyLog` model:
```prisma
model DailyLog {
  // ... existing fields
  timeOfDay        TimeOfDay?
  weatherCondition WeatherCondition?
  weatherSource    String?
  photos           DailyLogPhoto[]
}
```

- [ ] **Step 2: Push schema**

Run: `npx prisma db push`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/data.db
git commit -m "feat: add TimeOfDay, WeatherCondition enums and DailyLogPhoto model"
```

### Task C2: Create PhotoUpload shared component

**Files:**
- Create: `src/components/photo-upload.tsx`

- [ ] **Step 1: Create PhotoUpload component**

Create `src/components/photo-upload.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X } from "lucide-react";

interface PhotoFile {
  file: File;
  preview: string;
}

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  allowCamera?: boolean;
  allowUpload?: boolean;
}

export function PhotoUpload({
  onPhotosChange,
  maxPhotos = 10,
  allowCamera = true,
  allowUpload = true,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const updatePhotos = (newPhotos: PhotoFile[]) => {
    setPhotos(newPhotos);
    onPhotosChange(newPhotos.map((p) => p.file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - photos.length;
    const newFiles = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    updatePhotos([...photos, ...newFiles]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    updatePhotos(newPhotos);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert("Không thể truy cập camera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        updatePhotos([...photos, { file, preview: URL.createObjectURL(file) }]);
      }
    }, "image/jpeg", 0.8);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {allowUpload && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />Tải ảnh lên
          </Button>
        )}
        {allowCamera && !cameraActive && (
          <Button type="button" variant="outline" size="sm" onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />Chụp ảnh
          </Button>
        )}
        {cameraActive && (
          <>
            <Button type="button" size="sm" onClick={capturePhoto}>Chụp</Button>
            <Button type="button" variant="outline" size="sm" onClick={stopCamera}>Đóng camera</Button>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      {cameraActive && (
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded border" />
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <img src={photo.preview} alt="" className="w-full h-24 object-cover rounded border" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/photo-upload.tsx
git commit -m "feat: create reusable PhotoUpload component"
```

### Task C3: Update daily log form with project selector, time of day, weather, photos

**Files:**
- Modify: `src/schemas/daily-log.ts`
- Modify: `src/app/(dashboard)/daily-logs/new/page.tsx`
- Create: `src/components/forms/daily-log-form.tsx`

- [ ] **Step 1: Update daily log schema**

Update `src/schemas/daily-log.ts`:

```typescript
import { z } from "zod";

export const dailyLogSchema = z.object({
  projectId: z.string().min(1, "Chọn dự án"),
  date: z.date(),
  timeOfDay: z.enum(["MORNING", "AFTERNOON"]),
  weatherCondition: z.enum(["SUN", "RAIN", "CLOUDY", "STORM", "OVERCAST"]).optional(),
  temperature: z.number().min(-10).max(60).optional().nullable(),
  weatherSource: z.string().optional(),
  workerCount: z.number().min(0).optional(),
  notes: z.string().optional(),
  issues: z.string().optional(),
});

export type DailyLogFormData = z.infer<typeof dailyLogSchema>;
```

- [ ] **Step 2: Create daily-log-form component**

Create `src/components/forms/daily-log-form.tsx` with:
- Project selector (fetches projects from server)
- Date picker (default today)
- Time of day radio (MORNING/AFTERNOON)
- Weather section: auto-fetch from API when project selected + temperature, condition radios
- Worker count, Notes, Issues fields
- PhotoUpload component for photos

- [ ] **Step 3: Update daily-logs/new page to use new form**

Replace the current form in `src/app/(daily-logs/new/page.tsx)` with the new `DailyLogForm`.

- [ ] **Step 4: Update server action to handle new fields + photos**

Update `src/actions/daily-logs.ts` `createDailyLog` to accept:
- `timeOfDay`, `weatherCondition`, `weatherSource`
- `photos`: array of File objects → save to `public/uploads/daily-logs/` and create `DailyLogPhoto` records

- [ ] **Step 5: Create uploads directory**

Run: `mkdir -p public/uploads/daily-logs`

- [ ] **Step 6: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/schemas/daily-log.ts src/components/forms/daily-log-form.tsx src/app/\(dashboard\)/daily-logs/new/page.tsx src/actions/daily-logs.ts
git commit -m "feat: redesign daily log form with project, weather, photos"
```

### Task C4: E2E test for daily logs

- [ ] **Step 1: Add E2E test**

```typescript
test('create daily log with morning entry', async ({ page }) => {
  await page.goto(`${BASE_URL}/daily-logs/new`);
  // Select project
  await page.getByLabel('Dự án').click();
  await page.getByText('Nhà ở 2 tầng').first().click();
  // Select morning
  await page.getByLabel('Buổi sáng').check();
  // Fill worker count
  await page.getByLabel('Số công nhân').fill('8');
  // Fill notes
  await page.getByLabel('Ghi chú').fill('Test daily log');
  // Submit
  await page.getByRole('button', { name: 'Tạo nhật ký' }).click();
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test --grep "daily log"`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for daily log creation"
```

---

## Group D: Materials — Price History + STT + Pagination

### Task D1: Schema change — add MaterialPrice model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add MaterialPrice model and PriceSource enum**

```prisma
enum PriceSource {
  PO
  MANUAL
}

model MaterialPrice {
  id              String   @id @default(uuid())
  materialId      String
  material        Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  price           Decimal
  source          PriceSource
  purchaseOrderId String?
  purchaseOrder   PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id], onDelete: SetNull)
  recordedAt      DateTime @default(now())
  notes           String?

  @@index([materialId])
  @@index([recordedAt])
}
```

Add relation to Material:
```prisma
model Material {
  // ... existing fields
  prices          MaterialPrice[]
}
```

- [ ] **Step 2: Push schema**

Run: `npx prisma db push`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/data.db
git commit -m "feat: add MaterialPrice model for price history tracking"
```

### Task D2: Add price recording to purchase order receive flow

**Files:**
- Modify: `src/actions/purchase-orders.ts`

- [ ] **Step 1: Read existing purchase orders action**

Read `src/actions/purchase-orders.ts` to find the status update function.

- [ ] **Step 2: Add price recording on RECEIVED status**

When `updatePurchaseOrderStatus` sets status to `RECEIVED`, for each item:
```typescript
if (newStatus === "RECEIVED") {
  for (const item of order.items) {
    await prisma.materialPrice.create({
      data: {
        materialId: item.materialId,
        price: item.unitPrice,
        source: "PO",
        purchaseOrderId: order.id,
      },
    });
    await prisma.material.update({
      where: { id: item.materialId },
      data: { unitCost: item.unitPrice },
    });
  }
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/actions/purchase-orders.ts
git commit -m "feat: auto-record material prices when PO received"
```

### Task D3: Add manual price entry to material edit page

**Files:**
- Create: `src/components/material-price-history.tsx`
- Modify: `src/app/(dashboard)/materials/[id]/edit/page.tsx`
- Modify: `src/actions/materials.ts`

- [ ] **Step 1: Create MaterialPriceHistory component**

Create `src/components/material-price-history.tsx`:
- Table showing all MaterialPrice records for a material
- Columns: STT, Ngày, Giá (₫), Nguồn (PO/Thủ công badge), Ghi chú
- Inline form to add manual price: price input, notes textarea, submit button
- Sort by recordedAt desc

- [ ] **Step 2: Add addManualPrice server action**

Add to `src/actions/materials.ts`:
```typescript
export async function addManualPrice(materialId: string, price: number, notes?: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  await prisma.materialPrice.create({
    data: { materialId, price, source: "MANUAL", notes },
  });
  await prisma.material.update({
    where: { id: materialId },
    data: { unitCost: price },
  });
  revalidatePath("/materials");
}
```

- [ ] **Step 3: Add MaterialPriceHistory to material edit page**

In `src/app/(dashboard)/materials/[id]/edit/page.tsx`, add the component below the form.

- [ ] **Step 4: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/material-price-history.tsx src/app/\(dashboard\)/materials/\[id\]/edit/page.tsx src/actions/materials.ts
git commit -m "feat: add price history display and manual price entry to materials"
```

### Task D4: Add STT, pagination, and category management to materials list

**Files:**
- Modify: `src/app/(dashboard)/materials/page.tsx`
- Modify: `src/app/(dashboard)/materials/columns.tsx`
- Create: `src/components/category-manager.tsx`

- [ ] **Step 1: Add STT column to materials columns**

In `src/app/(dashboard)/materials/columns.tsx`, add a STT column as the first column:
```typescript
{
  id: "stt",
  header: "STT",
  cell: ({ row }) => row.index + 1,
},
```

- [ ] **Step 2: Add pagination to materials page**

Use DataTable's built-in pagination. Set `pageSize: 20`.

- [ ] **Step 3: Create CategoryManager component**

Create `src/components/category-manager.tsx`:
- Button "Quản lý nhóm" that opens a Dialog
- List of categories with edit/delete
- Inline form to add new category
- Uses `createCategory`, `updateCategory`, `deleteCategory` from materials actions

- [ ] **Step 4: Add category manager to materials page**

Add button and dialog to `src/app/(dashboard)/materials/page.tsx`.

- [ ] **Step 5: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/materials/page.tsx src/app/\(dashboard\)/materials/columns.tsx src/components/category-manager.tsx
git commit -m "feat: add STT, pagination, and category management to materials"
```

### Task D5: E2E test for materials

- [ ] **Step 1: Add E2E test**

```typescript
test('materials page shows STT and pagination', async ({ page }) => {
  await page.goto(`${BASE_URL}/materials`);
  await expect(page).toHaveURL(/.*materials/, { timeout: 10000 });
  // Should show STT column
  await expect(page.getByText('STT').first()).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test --grep "materials"`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for materials with STT"
```

---

## Group E: Inventory — Pagination + Export Types

### Task E1: Schema change — update InventoryTransactionType + add foreign keys

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update enum and add relations**

```prisma
enum InventoryTransactionType {
  IN
  OUT
  USAGE
  RETURN
  ADJUSTMENT
}

model InventoryTransaction {
  // ... existing fields
  type              InventoryTransactionType
  purchaseOrderId   String?
  purchaseOrder     PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id], onDelete: SetNull)
  projectId         String?
  project           Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Push schema**

Run: `npx prisma db push`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/data.db
git commit -m "feat: add USAGE/RETURN types and project/PO relations to InventoryTransaction"
```

### Task E2: Redesign inventory page with tabs and DataTable

**Files:**
- Modify: `src/app/(dashboard)/inventory/page.tsx`
- Create: `src/app/(dashboard)/inventory/columns.tsx`
- Create: `src/components/inventory-usage-form.tsx`
- Create: `src/components/inventory-return-form.tsx`

- [ ] **Step 1: Create inventory columns**

Create `src/app/(dashboard)/inventory/columns.tsx` with columns: STT, Tên vật liệu, Đơn vị, Tồn kho, Tồn tối thiểu, Trạng thái (OK/LOW/OUT badge).

- [ ] **Step 2: Create inventory usage form**

Create `src/components/inventory-usage-form.tsx`:
- Select project → Select stage (filtered) → Select material → Quantity → Notes
- On submit: create InventoryTransaction (type: USAGE) + MaterialUsage + decrease stock

- [ ] **Step 3: Create inventory return form**

Create `src/components/inventory-return-form.tsx`:
- Select purchase order (received POs) → Select material (from PO items) → Quantity → Notes
- On submit: create InventoryTransaction (type: RETURN) + decrease stock

- [ ] **Step 4: Redesign inventory page**

Replace current page with:
1. Filter bar: All / Low stock / Out of stock
2. Material stock DataTable with STT and pagination
3. Two tabs: "Xuất kho sử dụng" and "Xuất kho trả NCC"
4. Transaction history table below

- [ ] **Step 5: Update inventory server actions**

Update `src/actions/inventory.ts` to handle USAGE and RETURN types.

- [ ] **Step 6: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/app/\(dashboard\)/inventory/ src/components/inventory-usage-form.tsx src/components/inventory-return-form.tsx src/actions/inventory.ts
git commit -m "feat: redesign inventory with tabs, pagination, export types"
```

### Task E3: E2E test for inventory

- [ ] **Step 1: Add E2E test**

```typescript
test('inventory page shows stock table with STT', async ({ page }) => {
  await page.goto(`${BASE_URL}/inventory`);
  await expect(page).toHaveURL(/.*inventory/, { timeout: 10000 });
  await expect(page.getByText('STT').first()).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test --grep "inventory"`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for inventory page"
```

---

## Group F: Material Usage — Photos + Stage Selection

### Task F1: Schema change — add MaterialUsagePhoto

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add MaterialUsagePhoto model**

```prisma
model MaterialUsagePhoto {
  id              String       @id @default(uuid())
  materialUsageId String
  materialUsage   MaterialUsage @relation(fields: [materialUsageId], references: [id], onDelete: Cascade)
  url             String
  caption         String?
  takenAt         DateTime     @default(now())
  deletedAt       DateTime?

  @@index([materialUsageId])
}
```

Add relation to MaterialUsage:
```prisma
model MaterialUsage {
  // ... existing fields
  photos          MaterialUsagePhoto[]
}
```

- [ ] **Step 2: Push schema**

Run: `npx prisma db push`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/data.db
git commit -m "feat: add MaterialUsagePhoto model"
```

### Task F2: Update material usage form with stage selector and photos

**Files:**
- Modify: `src/app/(dashboard)/material-usage/page.tsx`
- Modify: `src/actions/material-usage.ts`

- [ ] **Step 1: Add stage selector to material usage form**

After project selector, add a stage selector that filters by the selected project's stages. Pass `projectId` to fetch stages.

- [ ] **Step 2: Add PhotoUpload to material usage form**

Add the PhotoUpload component at the bottom of the form. On submit, upload photos to `public/uploads/material-usage/` and create MaterialUsagePhoto records.

- [ ] **Step 3: Update server action for photos**

Update `createMaterialUsage` in `src/actions/material-usage.ts` to accept photos array and save them.

- [ ] **Step 4: Create uploads directory**

Run: `mkdir -p public/uploads/material-usage`

- [ ] **Step 5: Add thumbnail column to usage list**

In the usage list table, add a column showing small photo thumbnails (if any). Click to expand in modal.

- [ ] **Step 6: Verify build compiles**

Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 7: Commit**

```bash
git add src/app/\(dashboard\)/material-usage/page.tsx src/actions/material-usage.ts
git commit -m "feat: add stage selector and photo upload to material usage"
```

### Task F3: E2E test for material usage

- [ ] **Step 1: Add E2E test**

```typescript
test('material usage page shows stage selector', async ({ page }) => {
  await page.goto(`${BASE_URL}/material-usage`);
  await expect(page).toHaveURL(/.*material-usage/, { timeout: 10000 });
  // Should show project and stage selectors
  await expect(page.getByText('Dự án').first()).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test --grep "material usage"`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e.spec.ts
git commit -m "test: add E2E test for material usage with stage selector"
```

---

## Final Verification

### Task F4: Full build + E2E test suite

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: Build succeeds with warnings only

- [ ] **Step 2: Reset DB with fresh seed**

Run: `rm -f prisma/data.db && npx prisma db push && npm run db:seed`

- [ ] **Step 3: Start production server**

Run: `ss -tlnp | grep 3050 | grep -oP 'pid=\\K[0-9]+' | xargs -r kill -9; sleep 2; npm run start -- -p 3050 &`

- [ ] **Step 4: Run full E2E test suite**

Run: `npx playwright test`
Expected: All tests pass (existing 27 + new tests)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete feature upgrades — all 6 groups implemented"
```
