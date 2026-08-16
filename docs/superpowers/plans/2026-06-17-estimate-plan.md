# Plan: Dự toán (Estimate/BOQ) Module Implementation

**Spec**: [2026-06-17-estimate-design.md](../specs/2026-06-17-estimate-design.md)
**Ngày**: 2026-06-17
**Trạng thái**: Ready to implement

---

## Phân chia công việc (TDD - Test Driven Development)

Mỗi task nhỏ, có thể test độc lập, commit riêng.

---

## Phase 1: Database & Prisma (Foundation)

### Task 1.1: Add Estimate & EstimateItem models + enums to schema
- **File**: `prisma/schema.prisma`
- **Actions**:
  - Add `EstimateStatus` enum (DRAFT, ACTIVE, ARCHIVED)
  - Add `CostType` enum (MATERIAL, LABOR, EQUIPMENT, SUBCONTRACT, OTHER)
  - Add `Estimate` model
  - Add `EstimateItem` model
  - Add relations to `Project`, `ConstructionStage`, `User`
- **Test**: `npx prisma validate && npx prisma generate`

### Task 1.2: Create and run migration
- **Command**: `npx prisma migrate dev --name add_estimate_models`
- **Test**: Verify tables created in DB, run `npx prisma db seed`

### Task 1.3: Seed Estimate v1 for project "Nhà anh chị Tuấn Mơ"
- **File**: `prisma/seed.ts`
- **Actions**: Create Estimate v1 from existing StageBudget data
- **Test**: `npx prisma db seed` → verify in Prisma Studio

---

## Phase 2: Zod Schemas & Types

### Task 2.1: Create Zod schemas for Estimate
- **File**: `src/schemas/estimate.ts` (new)
- **Schemas**:
  - `createEstimateSchema`
  - `updateEstimateSchema`
  - `estimateItemSchema`
  - `bulkUpsertEstimateItemsSchema`
  - `compareEstimatesSchema`
  - `importEstimateSchema` (CSV row validation)
- **Test**: Unit tests in `src/__tests__/schemas/estimate.test.ts`

### Task 2.2: Export TypeScript types from schemas
- **File**: `src/schemas/estimate.ts`
- **Types**: `Estimate`, `EstimateItem`, `EstimateStatus`, `CostType`, `EstimateDiff`

---

## Phase 3: Server Actions (Backend)

### Task 3.1: CRUD Estimate actions
- **File**: `src/actions/estimate.ts` (new)
- **Actions**:
  - `createEstimate(projectId, name)` — tạo DRAFT, copy từ ACTIVE nếu có
  - `getEstimatesByProject(projectId)` — list versions
 所有 versions
  - `getEstimateWithItems(estimateId)` — full tree
  - `activateEstimate(estimateId)` — set ACTIVE, archive bản cũ
  - `archiveEstimate(estimateId)` — soft archive
  - `deleteEstimate(estimateId)` — chỉ DRAFT
- **Test**: Unit tests for each action

### Task 3.2: EstimateItem CRUD actions
- **File**: `src/actions/estimate.ts`
- **Actions**:
  - `createEstimateItem(estimateId, data)`
  - `updateEstimateItem(itemId, data)` — inline edit
  - `deleteEstimateItem(itemId)`
  - `bulkUpsertEstimateItems(estimateId, items[])` — import
  - `recalcEstimateTotals(estimateId)` — tính totalAmount
- **Test**: Unit tests

### Task 3.3: Progress sync & comparison actions
- **File**: `src/actions/estimate.ts`
- **Actions**:
  - `syncProgressFromLogs(estimateId)` — pull actualQuantity từ MaterialUsage/DailyLog
  - `compareEstimates(v1Id, v2Id)` — trả về diff array
- **Test**: Unit tests with mocked DailyLog/MaterialUsage

### Task 3.4: Import/Export actions
- **File**: `src/actions/estimate.ts`
- **Actions**:
  - `importEstimateFromCSV(estimateId, csvText)` — parse, validate, bulk upsert
  - `exportEstimateToCSV(estimateId)` — generate CSV string
  - `exportEstimateToPDF(estimateId)` — generate PDF buffer (use pdfkit or similar)
- **Test**: Unit tests with sample CSV

---

## Phase 4: UI Components

### Task 4.1: VersionSelector component
- **File**: `src/components/estimate/VersionSelector.tsx` (new)
- **Features**: Dropdown chọn version, badge status (ACTIVE/DRAFT/ARCHIVED), nút "Tạo bản mới", "So sánh", "Import", "Export"
- **Test**: Storybook / visual test

### Task 4.2: EstimateTable component (core)
- **File**: `src/components/estimate/EstimateTable.tsx` (new)
- **Features**:
  - Group by Stage (collapsible sections)
  - Columns: Mã CP | Hạng mục | ĐVT | SL dự toán | Đơn giá | Thành tiền | Loại | Nhà thầu | % HT | SL thực tế | Chênh lệch | Ghi chú
  - Inline edit (quantity, unitPrice, progressPct, actualQuantity, notes)
  - Auto-calc amount = quantity × unitPrice
  - Footer: Tổng cộng mỗi Stage, Tổng cả dự án
  - Color coding: costType badges
- **Test**: Unit test with React Testing Library

### Task 4.3: EstimateSummaryTabs component
- **File**: `src/components/estimate/EstimateSummaryTabs.tsx` (new)
- **Tabs**:
  - Tổng hợp giai đoạn (Stage | Dự toán | Thực tế | Chênh lệch | %)
  - Tổng hợp loại CP (Loại | Dự toán | Thực tế | %)
- **Test**: Unit test

### Task 4.4: CompareModal component
- **File**: `src/components/estimate/CompareModal.tsx` (new)
- **Features**: Chọn 2 version → diff table, highlight màu (tăng xanh, giảm đỏ, mới vàng, xóa xám)
- **Test**: Unit test

### Task 4.5: ImportDialog component
- **File**: `src/components/estimate/ImportDialog.tsx` (new)
- **Features**: Upload CSV/Excel, preview rows, validate, confirm import
- **Test**: Unit test

---

## Phase 5: Page Routing & Integration

### Task 5.1: Create Estimate page
- **File**: `src/app/(dashboard)/projects/[id]/estimate/page.tsx` (new)
- **Layout**: Header (VersionSelector) + Tabs (Bảng lượng, Tổng hợp, So sánh)
- **Server Component**: Fetch estimate data, pass to client components
- **Test**: E2E test navigation

### Task 5.2: Add Estimate link to Project sidebar/nav
- **File**: `src/components/layout/ProjectSidebar.tsx` (or similar)
- **Action**: Add "Dự toán" menu item
- **Test**: E2E test

### Task 5.3: Loading & Error states
- **Files**: `loading.tsx`, `error.tsx` in estimate folder
- **Test**: Visual check

---

## Phase 6: Progress Sync Integration (DailyLog ↔ Estimate)

### Task 6.1: Add stageId to DailyLog & MaterialUsage (if needed)
- **File**: `prisma/schema.prisma` (migration)
- **Decision**: Based on spec open question #2
- **Action**: Add optional `stageId` to `DailyLog` and `MaterialUsage`
- **Migration**: `npx prisma migrate dev --name add_stageid_to_logs`

### Task 6.2: Implement syncProgressFromLogs logic
- **File**: `src/actions/estimate.ts` (already in Task 3.3)
- **Logic**: Query MaterialUsage + DailyLog where stageId matches, group by code/materialId, sum actualQuantity
- **Test**: Integration test with seeded data

---

## Phase 7: Tests

### Task 7.1: Unit tests for schemas
- **File**: `src/__tests__/schemas/estimate.test.ts`

### Task 7.2: Unit tests for server actions
- **File**: `src/__tests__/actions/estimate.test.ts`

### Task 7.3: Component tests (React Testing Library)
- **Files**: `src/__tests__/components/estimate/*.test.tsx`

### Task 7.4: E2E tests (Playwright)
- **File**: `tests/estimate.spec.ts`
- **Scenarios**:
  - Create estimate version
  - Edit items inline
  - Activate/archive version
  - Import CSV
  - Export CSV/PDF
  - Compare versions
  - Sync progress from logs

---

## Phase 8: Polish & Documentation

### Task 8.1: Vietnamese localization check
- All UI text in Vietnamese
- Currency formatting (VND)
- Number formatting

### Task 8.2: Mobile responsive check
- Table horizontal scroll on mobile
- Modal sizing

### Task 8.3: Update README / docs
- Document Estimate module usage

---

## Execution Order (Dependencies)

```
1.1 → 1.2 → 1.3
    ↓
2.1 → 2.2
    ↓
3.1 → 3.2 → 3.3 → 3.4
    ↓
4.1 → 4.2 → 4.3 → 4.4 → 4.5
    ↓
5.1 → 5.2 → 5.3
    ↓
6.1 → 6.2 (parallel with 4-5)
    ↓
7.1 → 7.2 → 7.3 → 7.4
    ↓
8.1 → 8.2 → 8.3
```

---

## Estimated Effort

| Phase | Tasks | Est. Hours |
|-------|-------|------------|
| 1. Database | 3 | 2-3 |
| 2. Schemas | 2 | 1-2 |
| 3. Server Actions | 4 | 4-6 |
| 4. UI Components | 5 | 6-8 |
| 5. Pages | 3 | 2-3 |
| 6. Integration | 2 | 2-3 |
| 7. Tests | 4 | 3-4 |
| 8. Polish | 3 | 1-2 |
| **Total** | **26** | **21-31** |

---

## Acceptance Criteria (Definition of Done)

- [ ] All 26 tasks completed
- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npx playwright test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual verification on staging/production:
  - Create estimate v1, v2, v3
  - Edit items, see auto-calc
  - Activate v2, v1 auto-archived
  - Import CSV with 50+ rows
  - Export PDF/CSV
  - Compare v1 vs v2 → diff correct
  - Click "Cập nhật từ nhật ký" → progress updates
  - Stage progress rolls up to Project
- [ ] No console errors in browser
- [ ] Mobile responsive works

---

## Notes / Decisions Needed

1. **Stage.progress sync**: Spec open question #1 — propose: EstimateItem.progressPct weighted by amount → Stage progress (read-only display), user can manually sync to ConstructionStage if needed
2. **MaterialUsage stageId**: Spec open question #2 — propose: add optional `stageId` to DailyLog only, MaterialUsage links via DailyLog
3. **Expense ↔ EstimateItem**: Spec open question #3 — propose: add optional `estimateItemId` to Expense for traceability
4. **Permissions**: Spec open question #4 — propose: ADMIN + PROJECT_MANAGER can create/edit, VIEWER read-only

---

*Plan này sẽ được cập nhật khi implement. Mỗi task commit riêng với message: `feat(estimate): <task description>`*