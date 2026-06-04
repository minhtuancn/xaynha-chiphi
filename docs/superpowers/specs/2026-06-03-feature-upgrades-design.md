# Feature Upgrades Design — 2026-06-03

## Overview

6 groups of features to upgrade the Vietnamese house construction management system. Sequential implementation: A → F.

---

## Group A: Projects — Delete with Dependency Check

### Schema
No schema changes. Uses existing `deletedAt` soft delete.

### Behavior
- Add **Delete** button (trash icon) to projects DataTable Actions column
- On click → server action `deleteProject(id)` checks dependencies:
  - `ConstructionStage` (projectId)
  - `DailyLog` (projectId)
  - `MaterialUsage` (projectId)
  - `Expense` (projectId)
  - `PurchaseOrder` (projectId)
  - `Photo` (projectId)
  - `Document` (projectId)
  - `Budget` (projectId)
- If any count > 0 → return error with counts, show dialog:
  > "Dự án có X giai đoạn, Y nhật ký, Z vật tư sử dụng... Không thể xóa"
- If all zero → soft delete: `deletedAt = new Date()`

### Files to modify
- `src/app/(dashboard)/projects/columns.tsx` — add Delete action
- `src/actions/projects.ts` — add `deleteProject()` with dependency check
- `src/components/ui/alert-dialog.tsx` — confirmation dialog (already exists)

---

## Group B: Stages — Per-Project + Project Details

### Schema changes (Project model)
```prisma
model Project {
  // ... existing fields
  latitude    Float?
  longitude   Float?
}
```

### Stages page redesign
- **Current**: Flat card grid of all stages
- **New**: Project tabs at top → click project → show stages for that project
- Add **"Thêm giai đoạn"** button directly on stages page (currently only creatable from project page)
- Each project tab shows: stages list + project summary (address, coordinates, weather)

### Project detail enhancements
- **Geolocation button**: "Lấy vị trí từ trình duyệt" → navigator.geolocation → fill lat/lng
- **Weather widget**: Call Open-Meteo API (free, no key needed) with lat/lng → show current temperature, conditions, humidity
- **Project info card**: Address, coordinates (copyable), weather snapshot

### Open-Meteo API
- Endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true`
- Free, no API key required
- Returns: temperature, windspeed, weathercode

### Files to modify/create
- `prisma/schema.prisma` — add latitude/longitude to Project
- `src/app/(dashboard)/stages/page.tsx` — redesign with project tabs
- `src/app/(dashboard)/projects/[id]/edit/page.tsx` — add lat/lng fields + geolocation button
- `src/components/project-weather-widget.tsx` — new component
- `src/actions/projects.ts` — update project with coordinates

---

## Group C: Daily Logs — Morning/Afternoon + Weather + Photos

### Schema changes
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

model DailyLog {
  // ... existing fields
  timeOfDay        TimeOfDay?
  weatherCondition WeatherCondition?
  weatherSource    String?  // "auto" | "manual"
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

### Form redesign
1. **Project selector** (currently missing — required field)
2. **Date picker** (existing)
3. **Time of day**: MORNING / AFTERNOON radio buttons
4. **Weather section**:
   - Auto-fill from Open-Meteo API (based on project coordinates)
   - Weather condition: SUN/RAIN/CLOUDY/STORM/OVERCAST radio buttons
   - Temperature: auto-filled, editable
   - Source badge: "Tự động" or "Thủ công"
5. **Worker count** (existing)
6. **Notes** (existing)
7. **Issues** (existing)
8. **Photos section**:
   - Upload from device (multiple files)
   - Capture from camera (navigator.mediaDevices.getUserMedia)
   - Thumbnails with delete button

### Photo storage
- Save to `public/uploads/daily-logs/` directory
- Generate unique filename: `{dailyLogId}-{timestamp}.{ext}`
- Store URL in `DailyLogPhoto` table

### Files to modify/create
- `prisma/schema.prisma` — add TimeOfDay, WeatherCondition enums, DailyLogPhoto model, modify DailyLog
- `src/app/(dashboard)/daily-logs/new/page.tsx` — redesign form
- `src/components/forms/daily-log-form.tsx` — new form component
- `src/components/photo-capture.tsx` — camera/upload component
- `src/actions/daily-logs.ts` — update to handle photos + weather
- `src/app/api/weather/route.ts` — proxy to Open-Meteo API

---

## Group D: Materials — Full Info + Price History + STT + Pagination

### Schema changes
```prisma
enum PriceSource {
  PO       // From purchase order
  MANUAL   // Manual entry
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

model Material {
  // ... existing fields
  prices          MaterialPrice[]
}
```

### Auto price recording
- When `PurchaseOrder` status changes to `RECEIVED` → for each item:
  - Create `MaterialPrice` record with `source: PO`
  - Update `Material.unitPrice` to latest PO price

### Manual price entry
- On Material edit page, add section "Thêm giá thủ công"
- Form: price (number), notes (text), date (auto: now)
- Creates `MaterialPrice` with `source: MANUAL`

### Materials list enhancements
- **STT column**: Sequential numbering (1, 2, 3...) with pagination offset
- **Pagination**: DataTable server-side pagination (20 items/page)
- **Category management**: Add "Quản lý nhóm" button → modal/inline CRUD for MaterialCategory
- **Price column**: Show latest price + last change indicator

### Material edit page
- Existing form fields (7 fields)
- **New section**: "Lịch sử giá" — table showing all MaterialPrice records
  - Columns: STT, Ngày, Giá (₫), Nguồn (PO badge / Thủ công badge), Ghi chú
  - Sorted by recordedAt desc
- **New section**: "Thêm giá thủ công" — inline form

### Files to modify/create
- `prisma/schema.prisma` — add MaterialPrice model, PriceSource enum
- `src/app/(dashboard)/materials/page.tsx` — add STT, pagination, category management button
- `src/app/(dashboard)/materials/columns.tsx` — add STT column, latest price column
- `src/app/(dashboard)/materials/[id]/edit/page.tsx` — add price history section + manual price form
- `src/actions/materials.ts` — add price recording, category CRUD
- `src/components/material-price-history.tsx` — new component
- `src/components/category-manager.tsx` — new component

---

## Group E: Inventory — Pagination + Export Types

### Schema changes
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

### Inventory page redesign
- **Material stock table** (not cards): DataTable with STT, name, unit, current stock, min stock, status (OK/LOW/OUT)
- **Filter bar**: Filter by status (All / Low stock / Out of stock)
- **Pagination**: 20 items per page

### Export menu
Two tabs/buttons on inventory page:

#### 1. Xuất kho sử dụng
- Form: Select project → Select stage (filtered by project) → Select material → Quantity → Notes
- On submit:
  - Create `InventoryTransaction` with `type: USAGE`, `projectId`
  - Create `MaterialUsage` record
  - Decrease `Material.currentStock`

#### 2. Xuất kho trả NCC
- Form: Select purchase order (from received POs) → Select material (filtered by PO items) → Quantity → Notes
- On submit:
  - Create `InventoryTransaction` with `type: RETURN`, `purchaseOrderId`
  - Decrease `Material.currentStock`
  - Optionally: create negative `PurchaseOrderItem` or adjust PO status

### Files to modify/create
- `prisma/schema.prisma` — update InventoryTransactionType enum, add foreign keys
- `src/app/(dashboard)/inventory/page.tsx` — redesign with tabs, DataTable, filters
- `src/components/inventory-usage-form.tsx` — export for usage
- `src/components/inventory-return-form.tsx` — export for returns
- `src/actions/inventory.ts` — update actions for new types
- `src/app/(dashboard)/inventory/columns.tsx` — new columns file

---

## Group F: Material Usage — Photos + Stage Selection

### Schema changes
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

### Material usage form redesign
1. **Project selector** (existing)
2. **Stage selector** (new — filtered by project, shows ConstructionStage list)
3. **Material selector** (existing — filtered by project's stage materials)
4. **Quantity** (existing)
5. **Notes** (existing)
6. **Photos section** (new):
   - Upload ảnh phiếu xuất kho
   - Upload ảnh hiện trường
   - Camera capture
   - Thumbnails with delete

### Material usage list enhancements
- **Thumbnail column**: Show small photo thumbnails (if any)
- **Click to expand**: Show full photos in modal/overlay
- **STT column**: Sequential numbering with pagination

### Files to modify/create
- `prisma/schema.prisma` — add MaterialUsagePhoto model
- `src/app/(dashboard)/material-usage/page.tsx` — add stage selector, photo upload
- `src/components/material-usage-form.tsx` — redesign form
- `src/actions/material-usage.ts` — update to handle photos
- `src/components/photo-upload.tsx` — reusable photo upload component (shared with daily logs)

---

## Shared Components

### PhotoUpload component
- Reusable across Daily Logs, Material Usage
- Props: `onPhotosChange`, `maxPhotos`, `allowCamera`, `allowUpload`
- Handles: file input, camera capture, preview, delete

### WeatherWidget component
- Reusable across Project detail, Daily Log form
- Props: `latitude`, `longitude`, `onWeatherData`
- Calls `/api/weather` proxy → displays temperature, conditions

### PaginationTable component
- Wrapper around DataTable with server-side pagination
- Props: `data`, `columns`, `totalPages`, `currentPage`, `onPageChange`

---

## API Routes

### `GET /api/weather?lat={lat}&lng={lng}`
- Proxies to Open-Meteo API
- Returns: `{ temperature, weathercode, humidity, windspeed }`
- No auth required (public endpoint for weather data)

---

## Implementation Order

1. **Group A** (Projects delete) — ~30 min, no schema change
2. **Group B** (Stages + Project details) — ~2 hours, schema change + new components
3. **Group C** (Daily Logs) — ~3 hours, schema change + form redesign + photos
4. **Group D** (Materials) — ~2 hours, schema change + price history + pagination
5. **Group E** (Inventory) — ~2 hours, schema change + export types + pagination
6. **Group F** (Material Usage) — ~1.5 hours, schema change + photos + stage selector

**Total estimated: ~11 hours**

---

## Testing

- After each group: rebuild + run E2E tests (27 existing)
- Add new E2E tests for each new feature:
  - A: Delete project with/without data
  - B: Create stage from stages page, view weather
  - C: Create daily log with morning/afternoon, upload photo
  - D: View price history, add manual price, pagination
  - E: Export for usage, export for return
  - F: Create material usage with photo
