# Spec: Dự toán (Estimate/BOQ) cho dự án xây dựng

**Ngày**: 2026-06-17
**Trạng thái**: Draft - Chờ review

---

## 1. Mục tiêu

Xây dựng module **Dự toán (Estimate/Bảng lượng)** cho phép:
- Tạo, quản lý nhiều phiên bản dự toán cho 1 dự án (versioning)
- Bảng lượng chi tiết: mã CP, hạng mục, đơn vị, số lượng, đơn giá, thành tiền
- Phân bổ dự toán theo giai đoạn thi công (ConstructionStage)
- Phân loại chi phí: Vật tư (VT), Nhân công (NC), Thiết bị (TT), Nhà thầu phụ, Khác
- Liên kết chặt chẽ với tiến độ thực tế: nhập % tay + pull từ nhật ký thi công
- So sánh các phiên bản dự toán, so sánh dự toán vs thực tế

---

## 2. Yêu cầu chức năng

### 2.1 Quản lý phiên bản (Versioning)
- Mỗi dự án có nhiều `Estimate` (v1, v2, v3...)
- Chỉ 1 bản `ACTIVE` tại một thời điểm
- Các bản khác: `DRAFT` (đang soạn) hoặc `ARCHIVED` (đã thay thế)
- Tạo bản mới: copy từ bản ACTIVE, tăng version

### 2.2 Bảng lượng (EstimateItem)
Mỗi dòng bao gồm:
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `code` | String | Mã công trình/CP: MT.01, NC.02... |
| `name` | String | Tên hạng mục |
| `unit` | String | Đơn vị: m2, m3, kg, cái, bộ... |
| `quantity` | Decimal | Khối lượng dự toán |
| `unitPrice` | Decimal | Đơn giá |
| `amount` | Decimal | Thành tiền = quantity × unitPrice (tự tính) |
| `costType` | Enum | MATERIAL / LABOR / EQUIPMENT / SUBCONTRACT / OTHER |
| `contractor` | String? | Nhà thầu phụ trách |
| `stageId` | String? | Giai đoạn thi công (FK → ConstructionStage) |
| `progressPct` | Int | % hoàn thành (0-100), nhập tay |
| `actualQuantity` | Decimal | Khối lượng thực tế (pull từ nhật ký hoặc nhập tay) |
| `sortOrder` | Int | Thứ tự hiển thị trong giai đoạn |

### 2.3 Import/Export
- **Import Excel/CSV**: File mẫu với các cột trên. Backend validate `stageId`, tính `amount`, upsert.
- **Export**: PDF/Excel báo cáo:
  - Bảng lượng chi tiết (group by Stage)
  - Tổng hợp theo giai đoạn
  - Tổng hợp theo loại chi phí (VT/NC/TT...)
  - So sánh dự toán vs thực tế

### 2.4 Liên kết tiến độ thực tế
- **Nhập tay**: User sửa `progressPct`, `actualQuantity` trực tiếp trên bảng
- **Pull từ nhật ký**: Nút "Cập nhật từ nhật ký"
  - Query `MaterialUsage` + `DailyLog` gắn `stageId` (qua task hoặc dailyLog.stageId nếu có)
  - Cộng dồn `actualQuantity` theo `materialId`/`code`
  - Tự tính lại `progressPct` = actualQuantity / quantity × 100 (cap 100%)

### 2.5 Rollup tiến độ
- `EstimateItem.progressPct` (weighted by `amount`) → `Stage` progress
- `ConstructionStage.progress` có thể sync 2 chiều hoặc ưu tiên Estimate
- `Project.progress` rollup từ Stage (weighted by `estimatedBudget`)

### 2.6 So sánh phiên bản
- UI chọn 2 version (v1 vs v2, hoặc ACTIVE vs DRAFT)
- Hiển thị diff từng dòng: Δquantity, ΔunitPrice, Δamount, ΔcostType
- Highlight màu: tăng (xanh), giảm (đỏ), mới (vàng), xóa (xám)

---

## 3. Kiến trúc Database (Prisma)

### Models mới

```prisma
enum EstimateStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum CostType {
  MATERIAL    // Vật tư (VT)
  LABOR       // Nhân công (NC)
  EQUIPMENT   // Thiết bị (TT)
  SUBCONTRACT // Nhà thầu phụ
  OTHER       // Khác
}

model Estimate {
  id          String        @id @default(uuid())
  projectId   String
  project     Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version     Int           @default(1)
  name        String        // "Dự toán ban đầu", "Điều chỉnh lần 1"
  status      EstimateStatus @default(DRAFT)
  totalAmount Decimal       @default(0)
  notes       String?
  createdBy   String
  creator     User          @relation(fields: [createdBy], references: [id], onDelete: Restrict)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  items EstimateItem[]

  @@unique([projectId, version])
  @@index([projectId])
  @@index([status])
}

model EstimateItem {
  id             String      @id @default(uuid())
  estimateId     String
  estimate       Estimate    @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  stageId        String?
  stage          ConstructionStage? @relation(fields: [stageId], references: [id], onDelete: SetNull)
  code           String      // Mã CP
  name           String      // Tên hạng mục
  unit           String      // Đơn vị
  quantity       Decimal     // Khối lượng dự toán
  unitPrice      Decimal     // Đơn giá
  amount         Decimal     // Thành tiền
  costType       CostType    // VT/NC/TT/SUBCONTRACT/OTHER
  contractor     String?     // Nhà thầu
  progressPct    Int         @default(0)
  actualQuantity Decimal     @default(0)
  notes          String?
  sortOrder      Int         @default(0)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([estimateId])
  @@index([stageId])
  @@index([costType])
}
```

### Quan hệ với model hiện có
- `Estimate` → `Project` (1-n, cascade)
- `EstimateItem` → `Estimate` (n-1, cascade)
- `EstimateItem` → `ConstructionStage` (n-1, set null) — **phân bổ theo giai đoạn**
- `Budget` / `StageBudget` / `Expense` giữ nguyên vai trò **thực tế/kiểm soát**

---

## 4. API & Server Actions

| Action | Mô tả |
|--------|-------|
| `createEstimate(projectId, name)` | Tạo bản DRAFT mới (copy từ ACTIVE nếu có) |
| `activateEstimate(estimateId)` | Set ACTIVE, archive bản cũ |
| `archiveEstimate(estimateId)` | Chuyển sang ARCHIVED |
| `updateEstimateItem(itemId, data)` | Cập nhật 1 dòng (inline edit) |
| `bulkUpsertEstimateItems(estimateId, items[])` | Import Excel |
| `recalcEstimateTotals(estimateId)` | Tính lại totalAmount từ items |
| `syncProgressFromLogs(estimateId)` | Pull actualQuantity từ nhật ký |
| `compareEstimates(v1Id, v2Id)` | Trả về diff để UI hiển thị |

---

## 5. UI/UX

### Trang `/projects/[id]/estimate`
- **Header**: Dropdown chọn version, nút "Tạo bản mới", "So sánh", "Import", "Export"
- **Tabs**: 
  - **Bảng lượng**: Table group by Stage, inline edit, inline tính toán
  - **Tổng hợp giai đoạn**: Stage | Dự toán | Thực tế | Chênh lệch | %
  - **Tổng hợp loại CP**: Loại | Dự toán | Thực tế | %
  - **So sánh**: Chọn 2 version → diff table

### Table Bảng lượng (columns)
| Mã CP | Hạng mục | ĐVT | SL dự toán | Đơn giá | Thành tiền | Loại | Nhà thầu | % HT | SL thực tế | Chênh lệch | Ghi chú |
|-------|----------|-----|------------|---------|------------|------|----------|------|------------|------------|---------|

-|--------|
| MT.01 | Xi măng PCB40 | Tấn | 500 | 1,800,000 | 900,000,000 | VT | CTCP Xây Dựng | 60% | 300 | -200 | |
| NC.01 | Đào móng tay | m3 | 200 | 150,000 | 30,000,000 | NC | Team A | 100% | 200 | 0 | |

- Row click → expand chi tiết / edit inline
- Footer: Tổng cộng mỗi Stage, Tổng cả dự án

---

## 6. Migration Plan

1. **Prisma migration**: Thêm 2 model + 2 enum
2. **Seed data**: Tạo Estimate v1 cho project Tuấn Mơ từ StageBudget hiện có
3. **Backend**: Server actions + Zod schemas
4. **Frontend**: Page + Components (EstimateTable, VersionSelector, CompareModal, ImportDialog)
5. **Integration**: Hook "Cập nhật từ nhật ký" → MaterialUsage/DailyLog query
6. **Test**: Unit + E2E

---

## 7. Câu hỏi mở / Cần quyết định sau

1. **Sync Stage.progress**: Có tự động ghi đè `ConstructionStage.progress` từ EstimateItem không? Hay để user tự sync?
2. **MaterialUsage linking**: Nhật ký hiện có chưa gắn `stageId` trực tiếp. Cần thêm `stageId` vào `DailyLog`/`MaterialUsage` để pull chính xác?
3. **Expense ↔ EstimateItem**: Khi tạo Expense từ PO, có gán `estimateItemId` để trace không?
4. **Permission**: Ai được tạo/sửa Estimate? Chỉ ADMIN + Project Manager?

---

*Spec này sẽ được review trước khi implement.*