# Audit Report: xaynha-chiphi (Vietnamese Construction Cost Management)

Audited: all 21 files in `src/actions/`, all 15 files in `src/schemas/`, plus `src/lib/auth.ts`, `src/lib/audit.ts`, `src/lib/serialize.ts`, `src/lib/rate-limit.ts`, `src/lib/ai-safety.ts`, `src/actions/notifications.ts`, `prisma/schema.prisma`, `src/proxy.ts`, and the NextAuth config. No files were modified.

## Severity Summary

| Severity | Count | Key areas |
|---|---|---|
| CRITICAL | 2 | password hash exposure; broken server-action serialization of Decimal |
| HIGH | 9 | missing authorization on estimate module; PO RECEIVED without stock IN; budget spent/remaining never maintained; login rate limit never fires; dual usage paths diverge stock; payments don't create transactions; budget/spent dashboard bug |
| MEDIUM | 16 | validation gaps, non-transactional multi-writes, scope leaks, overpayment/overdraft, stale debtBalance |
| LOW | 15 | minor validation, revalidate, cleanup, dead code |

---

## Fix Status (updated)

All findings below have been addressed in code except where marked otherwise. Verified by 118 unit tests, `tsc --noEmit` (app sources clean), `npm run lint` (clean), `npm run build` (success) and 48 Playwright tests (all passing, mobile + desktop). See the workflow rounds below for the fixes they uncovered.

| ID | Status | Notes |
|---|---|---|
| C1 | ✅ Fixed | `safeUser` strips `passwordHash` on create/update user returns |
| C2 | ✅ Fixed | `serialize()` converts Decimal on all estimate returns |
| H1 | ✅ Fixed | `getCurrentUser(action)` = `requirePermission('estimates', action)` at all 17 call sites |
| H2 | ✅ Fixed | PO RECEIVED creates expense + stock IN + prices + inventory txs atomically |
| H3 | ✅ Fixed | `updateProject` recomputes `remaining = budget - spent`; dashboard uses computed expenses |
| H4 | ✅ Fixed | Dashboard `spentValue` computed from expenses |
| H5 | ✅ Fixed | `isLoginBlocked`/`resetLoginFailures` in Credentials authorize; proxy limiter for /login POST |
| H6 | ✅ Fixed | `createMaterialUsage`/`deleteMaterialUsage` transactional with stock restore |
| H7 | ✅ Fixed | Payments create `PAYMENT-<id>` Transactions |
| H8 | ✅ Fixed | Estimate status only via activate/archive transitions |
| H9 | ✅ Fixed | Inventory stock-sufficiency check inside the transaction |
| M1 | ✅ Fixed | `accountSchema` on account mutations |
| M2 | ✅ Fixed | `createExpense` sets `createdBy`/`projectId` and maintains budget |
| M3 | ✅ Fixed | Expense approval/rejection gated by `requireAdmin` |
| M4 | ✅ Fixed | `createTransaction` overdraft guard + `userId` attribution + Decimal balance math |
| M5 | ✅ Fixed | `deleteDebt` blocks when payments exist, reverses `supplier.debtBalance` |
| M6 | ✅ Fixed | `deleteAccount` blocks nonzero balance or referenced transactions; audit added |
| M7 | ✅ Fixed | `createDebt` increments `supplier.debtBalance` in same tx |
| M8 | ✅ Fixed | `createDebt` rejects both supplier+worker; existence checks in tx |
| M9 | ✅ Fixed | `createProject` atomic (project+budget); `deleteProject` one tx with child cleanup (estimates, material usages, inventory txs, stage budgets, checklists) |
| M10 | ✅ Fixed | Same fix as H3 (`remaining` recomputed from budget − spent) |
| M11 | ✅ Fixed | CANCELLED terminal; RECEIVED cannot be cancelled; revert reverses expense/stock/prices/txs; delete reverses stock; Decimal totals |
| M12 | ✅ Fixed | `createMaterialUsage` stock check + photos in same tx |
| M13 | ✅ Fixed | `bulkAttendance` Zod-validated (500-record cap, checkIn ≤ checkOut) |
| M14 | ⚠️ Open (documented) | Scope-filter uniformity not forced — could break legitimate cross-project flows; kept per-module scoping |
| M15 | ✅ Fixed | Item/status mutations enforce DRAFT-only (`assertEstimateDraft`); UI already read-only for non-DRAFT |
| M16 | 🟡 Partial | Audit added to `deleteAccount`; full coverage expansion deferred (existing `logAudit` at most mutation sites) |
| L1 | ✅ Fixed | `materialCategorySchema` (name 1–100, description ≤500) |
| L2 | ✅ Fixed | `manualPriceSchema` (price > 0, notes ≤500) |
| L3 | ✅ Fixed | `updateMaterial` no longer writes `currentStock`; form field read-only on edit |
| L4 | ✅ Fixed | `page`/`limit` clamped (1…200) and wired into `skip`/`take` in financial/inventory/materials/purchase-orders |
| L5 | ✅ Fixed | `DailyLog @@unique([projectId, date, timeOfDay])` |
| L6 | ✅ Fixed | `updateDailyLog` filters `deletedAt: null` |
| L7 | ✅ Fixed | `createStage` clamps `order`; `deleteStage` soft-deletes tasks/checklists + removes stage budget in one tx |
| L8 | ✅ Fixed | `updateChecklist`/`addChecklistItem`/`toggleChecklistItem` validated |
| L9 | ✅ Fixed | `notifyAdmins` gated by `requirePermission('notifications','create')` |
| L10 | ✅ Fixed | `userSettingSchema` (currencyDec 0–2, theme enum); dead `applyUserTheme` removed; `setSelectedProject` validated |
| L11 | ✅ Fixed | User create/update Zod; `toggleUserActive` blocks self and last-admin deactivation |
| L12 | ✅ Fixed | `updateSetting` allowlist (siteName/companyName/…/projectLat/projectLon/weatherApiKey/defaultTheme) |
| L13 | ✅ Fixed | `createPhoto` Zod; `deleteDocument` removes the stored file (MinIO) |
| L14 | ✅ Fixed | `escapeCSV` + formula neutralization in CSV export (pre-existing) |
| L15 | ✅ Fixed | Decimal totals; `createEstimate` version race retried in tx; `activateEstimate` archive+activate atomic; `syncProgressFromLogs` task-linked counting only (inventory-path usages still not counted — documented) |

---
## CRITICAL

### C1. Password hashes returned to the client
**File:** `src/actions/settings.ts:74` and `src/actions/settings.ts:93`
`createUser` and `updateUser` end with `return user;` where `user` is the full Prisma `User` record **including `passwordHash`**. Server-action return values are serialized into the client JS payload, so every admin who creates/edits a user receives the bcrypt hash of that user's password over the wire (visible in devtools/network regardless of the UI ignoring it). `getUsers` (lines 35-48) correctly excludes `passwordHash` — the create/update paths forgot.
**Fix:** Return a sanitized projection: `return { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive };` (or `const { passwordHash, ...safe } = user; return safe;`).

### C2. Estimate actions return raw Prisma Decimal objects
**File:** `src/actions/estimate.ts` (returns of `createEstimate` :87, `getEstimatesByProject` :99, `getEstimateWithItems` :117, `updateEstimate` :134, `activateEstimate` :160, `archiveEstimate` :172, `createEstimateItem` :224, `updateEstimateItem` :251, `bulkUpsertEstimateItems` :334, `recalcEstimateTotals` :352)
Every estimate action returns raw Prisma records whose `totalAmount` (Estimate) and `quantity/unitPrice/amount/actualQuantity` (EstimateItem) are Prisma `Decimal` instances (schema.prisma:748, 771-778). Next.js server actions cannot round-trip Prisma `Decimal` class instances — the flight serializer either rejects non-plain objects or mangles them — and the rest of the codebase consistently wraps returns in `serialize()` (`src/lib/serialize.ts`). The estimate UI (`EstimateClientPage.tsx`, `EstimateTable.tsx`) compensates with `Number(item.amount)` but the Decimal object arrives as garbage/NaN or the call throws. This file does not even import `serialize`.
**Fix:** Wrap every return in `serialize(...)`, mirroring the other action modules.

---

## HIGH

### H1. Estimate module has no permission checks (any logged-in user can mutate)
**File:** `src/actions/estimate.ts:23-26` (`getCurrentUser` = `requireUser`) used by every action (:33, :91, :103, :121, :138, :164, :176, :198, :228, :255, :271, :338, :360, :417, :581, :605, :650).
All 17 estimate actions only verify the caller is *logged in* — none call `requirePermission("estimates", ...)` (the module isn't even in the `ModuleName` union in `src/lib/utils.ts:158-178`). A viewer account can create/update/delete/activate estimates, change items, recalc totals, and sync progress on **any project** (no project-scope check either).
**Fix:** Add an `estimates` module to `ModuleName`, guard reads with `requirePermission("estimates","view")` and mutations with `"create"/"edit"/"delete"`; also verify the estimate's `projectId` matches the caller's project scope when a scope is set.

### H2. PO status RECEIVED does not add stock IN (inventory never updates)
**File:** `src/actions/purchase-orders.ts:138-180`
When a purchase order transitions to `RECEIVED`, the action creates an auto-expense (lines 151-164) and `MaterialPrice` records (lines 166-173) but **never increments `material.currentStock` and never creates `InventoryTransaction` rows** for the received quantities. Result: receiving goods does not increase stock, and the `purchaseOrderId` field on `InventoryTransaction` (schema.prisma:407-408) is never populated. Additionally the three writes (expense create, price createMany, status update) are **not wrapped in one `$transaction`** — a failure mid-way leaves partial state.
**Fix:** Inside one `$transaction`: update status, create the expense, create the prices, and for each item do `material.update({ currentStock: { increment: item.quantity } })` plus `inventoryTransaction.create({ type: "IN", purchaseOrderId, materialId, quantity, ... })`.

### H3. Budget spent/remaining fields are never maintained; updateProject corrupts `remaining`
**File:** `src/actions/projects.ts:87-93` and schema `Budget.spent/remaining/allocated` (schema.prisma:697-709)
Grep confirms `budget.update` appears only in `projects.ts`. `spent` is initialized to 0 (projects.ts:57) and **never incremented anywhere** — `createExpense` (`src/actions/financial.ts:68-77`) records expenses without touching `Budget`. Worse, `updateProject` sets `remaining: new Decimal(validated.budget)` (line 91) — remaining is reset to the full budget regardless of how much has been spent, permanently overstating available funds.
**Fix:** In `updateProject` compute `remaining = totalBudget - spent` (Decimal read of current spent); whenever an expense is created/approved/deleted, update `Budget.spent/remaining` atomically in the same transaction as the expense mutation.

### H4. Dashboard shows stale budget.spent (always 0) instead of computed expenses
**File:** `src/actions/dashboard.ts:79-81`
`spent: budget?.spent ?? totalExpenses._sum.amount ?? 0` — since `budget.spent` is a `Decimal(0)` object (truthy, non-null), the `??` fallback to the real expense sum **never fires** whenever a Budget row exists (which is always). The dashboard therefore always reports "Đã chi: 0 ₫". Note `getFinancialReport` (`src/actions/reports.ts:101-111`) computes spent correctly from expenses, so the two views disagree.
**Fix:** Use `spent: totalExpenses._sum.amount ?? budget?.spent ?? 0` (computed sum first), or better, fix H3 so `budget.spent` is actually maintained.

### H5. Login brute-force rate limit never applies to real login attempts
**File:** `src/proxy.ts:14-20` + `src/lib/rate-limit.ts:37-38`
The limiter is wired to `pathname === '/login' && method === 'POST'` (proxy.ts:15), but the login form uses `signIn("credentials", ...)` from `next-auth/react` (`src/app/(auth)/login/page.tsx:38`), which POSTs to **`/api/auth/callback/credentials`**. proxy.ts:20 returns early for `/api/auth` *before* any rate-limit check, so the limiter never runs for actual credential attempts. `loginLimiter` is effectively dead code; brute-force protection is absent.
**Fix:** Apply the limiter inside the `Credentials` provider's `authorize` (or wrap the `/api/auth/callback/credentials` route) using the session/IP.

### H6. Two divergent "material usage" paths — stock only decremented in one
**File:** `src/actions/material-usage.ts:45-55` vs `src/actions/inventory.ts:107-123`
- Inventory page "Xuất kho sử dụng" → `createTransaction({type:"USAGE"})` (inventory.ts) creates an `InventoryTransaction`, decrements `currentStock`, and creates a `MaterialUsage`.
- Material-usage page → `createMaterialUsage` (material-usage.ts:29-74) creates **only** a `MaterialUsage` record — no `InventoryTransaction`, no stock decrement, no stock-sufficiency check.
The same business event (material consumed) has two implementations with opposite inventory effects, and `deleteMaterialUsage` (material-usage.ts:76-84) hard-deletes the usage without touching stock either way.
**Fix:** Make `createMaterialUsage` go through the same transactional path as inventory USAGE (decrement stock + create `InventoryTransaction`), or route the material-usage UI to `createTransaction`; centralize in a shared helper.

### H7. Debt payments decrement account balance but record no Transaction (audit trail broken)
**File:** `src/actions/financial.ts:372-438` (`addPayment`)
The payment flow (create Payment → update Debt.paidAmount/status → decrement Account.balance, lines 402-424) changes the account balance **without creating a `Transaction` row**. The account ledger (`getTransactions`, financial.ts:195-214) then shows balances that cannot be reconciled to transactions. It also fails to update `Supplier.debtBalance` (schema.prisma:459). Additionally there is **no overpayment guard**: `newPaidAmount` may exceed `debt.amount`, and no check that the account has sufficient balance (overdraft).
**Fix:** Inside the existing `$transaction`: validate `amount <= debt.amount - debt.paidAmount` and `account.balance >= amount`; create a `Transaction` (`type: "EXPENSE"`, `reference: payment id`, `userId`) for the balance movement; update `Supplier.debtBalance` for supplier-linked debts.

### H8. `updateEstimate` lets callers set ACTIVE directly — multiple ACTIVE estimates
**File:** `src/actions/estimate.ts:120-135`
`updateEstimateSchema` allows `status` (schema line 19) and `updateEstimate` applies it verbatim. A caller can set a DRAFT/ARCHIVED estimate to `ACTIVE` without the archive-other-first logic that `activateEstimate` (lines 148-157) enforces, producing **two ACTIVE estimates** for a project. UI selectors (`EstimateClientPage.tsx:46`) pick `list.find(e => e.status === 'ACTIVE')`, so behavior becomes arbitrary.
**Fix:** Remove `status` from `updateEstimateSchema`, or reject the `ACTIVE` transition in `updateEstimate` and force callers through `activateEstimate`; wrap archive+activate in a transaction.

### H9. Inventory OUT/USAGE stock-sufficiency check is outside the transaction (TOCTOU)
**File:** `src/actions/inventory.ts:69-78` (check) vs :91-124 (transaction)
The read of `currentStock` and the check happen before the write transaction. Two concurrent OUT transactions can both pass the check and drive stock negative. Also `ADJUSTMENT` (lines 94-98) sets `currentStock` to an absolute value, but the schema forces `quantity >= 0.01` (`src/schemas/inventory.ts:6`), so stock can never be adjusted to 0 via ADJUSTMENT.
**Fix:** Move the read+check inside the `$transaction` (or use `updateMany` with a `currentStock >= quantity` guard and check the affected row count); allow quantity 0 for ADJUSTMENT or express it as a delta.

---

## MEDIUM

### M1. No Zod validation on account mutations + raw Decimal returns
**File:** `src/actions/financial.ts:153-178` — `createAccount`/`updateAccount` accept `data` with zero validation (empty/huge names, negative/NaN balance) and **return the raw Prisma record including the Decimal `balance`** (same hazard as C2). `createAccount` also lacks `revalidatePath`. Fix: add an `accountSchema`, return `serialize(account)`, add `revalidatePath("/accounts")`.

### M2. `createExpense` is not wired into budget, account, or creator
**File:** `src/actions/financial.ts:54-91` — a caller can create an expense already `APPROVED` (approval is a form field; see M3); no `createdBy` is set (schema.prisma:667, so the "Người tạo" column is always "-"); no `accountId`; no `Budget.spent` update (H3); `user` at line 55 is unused. Fix: set `createdBy: user.id`, update `Budget.spent/remaining` in the same transaction, default status to PENDING unless admin approves.

### M3. Expense approval/rejection available to any user with `expenses:edit`
**File:** `src/actions/financial.ts:93-109` — only `requirePermission("expenses","edit")`; a regular user can approve/reject expenses (including auto-created PO expenses); no transition rules. Fix: require `requireAdmin()` (or a dedicated approve permission) for APPROVED/REJECTED transitions; validate the transition.

### M4. `createTransaction` allows overdraft and doesn't attribute the user
**File:** `src/actions/financial.ts:216-266` — no check that `account.balance >= amount` for EXPENSE; `Transaction.userId` (schema.prisma:615) never set; balance update uses the raw JS number (`increment: validated.amount`, line 245). Fix: guard balance inside the transaction, set `userId: user.id`, use the Decimal.

### M5. `deleteDebt` doesn't check payments or reverse balances
**File:** `src/actions/financial.ts:335-346` — a debt with payments can be soft-deleted; `Payment` rows remain and the account balance already decremented by those payments is never reconciled/restored. Fix: block deletion when payments exist, or reverse the paid amounts with compensating transactions.

### M6. `deleteAccount` allows deleting an account with a nonzero balance
**File:** `src/actions/financial.ts:180-189` — money disappears from `getAccounts` while transactions still reference the account. Fix: refuse deletion when `balance != 0` or transactions exist, or record a write-off transaction first.

### M7. `Supplier.debtBalance` is never updated (stale in reports/UI)
**File:** `src/actions/reports.ts:202`, `src/app/(dashboard)/suppliers/columns.tsx:42-45` — neither `createDebt` nor `addPayment` touches `supplier.debtBalance` (schema.prisma:459). The suppliers table always shows 0 while reports compute the real figure (reports.ts:192). Fix: update the field inside the debt/payment transactions or drop the denormalized field.

### M8. `createDebt` allows both supplierId and workerId simultaneously
**File:** `src/actions/financial.ts:287-308` — only the "neither" case is rejected; a debt with both parties is legal. Fix: reject when both are set.

### M9. Project create/delete are not atomic and leave orphans
**File:** `src/actions/projects.ts:34-66` and :99-187 — `createProject` writes Project then Budget in two calls (a Budget failure leaves a project without a budget row); `deleteProject` deletes the Budget (149-151) **outside** the soft-delete transaction (155-184), and the transaction doesn't soft-delete `Estimate`/`MaterialUsage`/`InventoryTransaction`/`StageBudget`/`Checklist` rows (estimates remain ACTIVE). It also returns `{success:false,error}` (142-145) where every other action throws. Fix: one transaction for budget + soft-deletes; extend soft-delete coverage; uniform error contract.

### M10. `updateProject` overwrites `remaining` with the full budget
**File:** `src/actions/projects.ts:87-93` — same fix as H3.

### M11. Purchase order lifecycle inconsistencies
**File:** `src/actions/purchase-orders.ts` — (a) `updatePurchaseOrderStatus` (:127-190): RECEIVED reachable from CANCELLED; reverting RECEIVED→DRAFT doesn't reverse the auto-expense or prices; status not Zod-validated. (b) `updatePurchaseOrder` (:192-239): after RECEIVED, editing items leaves the auto-expense amount and MaterialPrice rows stale. (c) `deletePurchaseOrder` (:241-270): PO and expense soft-deletes are separate writes; `MaterialPrice` rows are orphaned (`onDelete: SetNull`); deleting a RECEIVED PO doesn't reverse stock (once H2 is fixed). (d) `createPurchaseOrder` (:85-125): `totalAmount` computed with JS float arithmetic (90-93) into a Decimal column. Fix: state machine (CANCELLED terminal, RECEIVED only from SENT/DRAFT); recompute linked expense/prices/stock delta on update; one transaction for delete; Decimal totals.

### M12. `createMaterialUsage` lacks stock check and isn't transactional with photos
**File:** `src/actions/material-usage.ts:29-74` — no `currentStock >= quantity` check (once H6 is fixed); usage insert and per-photo saves are separate writes with no transaction; photo failures are silently logged; `deleteMaterialUsage` hard-deletes while the rest of the app soft-deletes. Fix: fold into the H6 shared transaction; soft delete.

### M13. `bulkAttendance` bypasses Zod validation entirely
**File:** `src/actions/workers.ts:158-206` — `records` and `date` are only TypeScript-typed; `attendanceSchema` (`src/schemas/worker.ts:17-24`) is never applied. Malformed payloads (unknown workerId → FK error, checkOut before checkIn, unbounded array) reach Prisma and abort the whole upsert transaction unhandled. Fix: `z.array(attendanceSchema).parse(records)` before the transaction; cap array size; validate checkIn ≤ checkOut.

### M14. Modules with a project scope filter leak data outside the selected project
**File:** `src/actions/project-scope.ts:6-15` — `getDailyLogs`, `getExpenses`, `getPhotos`, `getMaterialUsages`, `getFinancialReport`, `getProgressReport`, `getDashboardData` filter by `selectedProjectId`; but `getStages` (stages.ts:11-30), `getMaterials`, `getInventoryTransactions`, `getPurchaseOrders`, `getSuppliers`, `getWorkers`, `getChecklists`, `getDocuments` apply **no scope filter**, so any user with module-view permission sees every project's data. Fix: apply `getProjectScope()` uniformly or document the behavior.

### M15. Estimate item/status mutations don't enforce DRAFT-only edits
**File:** `src/actions/estimate.ts:197-268` — none verify the parent estimate exists, belongs to the caller's project, or is still `DRAFT`; `updateEstimateItem` accepts `estimateId` via `estimateItemSchema.partial()` (line 229), letting an item move to another estimate **without recalculating the old estimate's total**. Fix: load the estimate, reject non-DRAFT, strip `estimateId` from updates or recalc both estimates.

### M16. Audit coverage is inconsistent and audit writes are outside mutations
**File:** `src/lib/audit.ts:3-23` + call sites — only purchase-orders/suppliers/workers/part of financial call `logAudit`; projects/stages/daily-logs/materials/inventory/material-usage/estimate are un-audited; `logAudit` runs after the mutation as a separate write (a crash loses the trail) and swallows all errors (20-22). Fix: add audit calls to all mutating actions inside the same `$transaction`; log failures loudly.

---

## LOW

- **L1** `src/actions/materials.ts:109-130` — `createMaterialCategory`/`updateMaterialCategory` no Zod validation (empty/duplicate names → unhandled P2002 on the @unique `name`). Fix: validate.
- **L2** `src/actions/materials.ts:152-168` — `addManualPrice` accepts negative `price`; price rows are never synced into `material.unitCost`. Fix: validate price > 0; consider syncing `unitCost`.
- **L3** `src/actions/materials.ts:67-87` — `updateMaterial` lets callers overwrite `currentStock` directly, bypassing the inventory ledger. Fix: reject stock edits here and force `createTransaction({type:"ADJUSTMENT"})`.
- **L4** `src/actions/inventory.ts:10-30`, `materials.ts:11-28`, `purchase-orders.ts:39-64`, `financial.ts:195-214` — `page`/`limit` unvalidated (negative limit → Prisma error). Fix: clamp with Zod.
- **L5** `src/actions/daily-logs.ts:49-110` + schema.prisma:274 — `DailyLog @@unique([projectId, date])` contradicts the `timeOfDay` MORNING/AFTERNOON design: only one log per project per day can exist; second create throws unhandled P2002. Fix: drop `timeOfDay` or change the unique key to `[projectId, date, timeOfDay]`.
- **L6** `src/actions/daily-logs.ts:121` — `updateDailyLog` fetches by `id` without `deletedAt: null` and can mutate soft-deleted logs. Fix: add the filter.
- **L7** `src/actions/stages.ts:50-72, 96-105` — `createStage` takes an unvalidated `order` (duplicates possible); `deleteStage` leaves tasks/checklists visible. Fix: derive order from max+1; soft-delete children.
- **L8** `src/actions/checklists.ts:63-127` — `updateChecklist`/`addChecklistItem`/`toggleChecklistItem` don't Zod-validate inputs. Fix: reuse `checklistSchema`/`checklistItemSchema`.
- **L9** `src/actions/notifications.ts:115-131` — `notifyAdmins` is an exported server action with **no auth check**; unauthenticated callers can POST to spam all admins. Fix: guard with `requirePermission("notifications","create")` and rate-limit, or make it non-exported.
- **L10** `src/actions/user-settings.ts:34-43, 55-57` — `upsertUserSetting` validates nothing (`currencyDec` could be -5); `applyUserTheme` is a **no-op** dead action; `setSelectedProject` doesn't verify the project exists/accessible. Fix: add a Zod schema; remove/implement `applyUserTheme`.
- **L11** `src/actions/settings.ts:51-94` — `createUser`/`updateUser` don't validate email/password/name (short passwords pass; duplicate email → unhandled P2002); `toggleUserActive` (112-128) can deactivate the last admin / yourself (lockout). Fix: user schema (email, password ≥ 6 as in `src/schemas/auth.ts`); block self/last-admin deactivation.
- **L12** `src/actions/settings.ts:20-30` — `updateSetting` permits arbitrary key/value writes. Fix: allowlist keys.
- **L13** `src/actions/photos.ts:22-46` — `createPhoto` has no Zod validation; `documents.ts:58-70` — `deleteDocument` soft-deletes without removing the stored file (storage leak), unlike `deletePhoto` (photos.ts:59-67). Fix: validate; delete the file on document delete.
- **L14** `src/actions/estimate.ts:604-643` — `exportEstimateToCSV` builds CSV with `"${c}"` but never escapes embedded quotes/newlines (broken CSV) and doesn't neutralize `=`/`+`/`-` formula prefixes (CSV injection). Fix: use `escapeCSV` from `src/lib/csv.ts:1-4`.
- **L15** `src/actions/estimate.ts:337-353` — `recalcEstimateTotals` sums Decimals via JS `Number` (float drift); `createEstimate` (:36-54) computes `newVersion` outside the insert (concurrent creates hit `@@unique([projectId, version])` with unhandled P2002); `activateEstimate` (:148-157) archive+activate are two writes outside a transaction; `syncProgressFromLogs` (:381-386) only counts usages linked via `task.stageId` — inventory-path usages (no task) never count toward progress. Fix: Decimal math, version retry/transaction, one tx for archive+activate, count both usage paths.

## Validation gap inventory (actions vs Zod schemas)

| Action | Zod? | Gap |
|---|---|---|
| projects/stages/daily-logs/materials/inventory/material-usage/purchase-orders/suppliers/workers/financial (expense, transaction, debt, payment) | yes | none |
| checklists create | yes | update/addItem/toggle unvalidated (L8) |
| documents | yes | none |
| settings createUser/updateUser/updateSetting | no | L11/L12 |
| financial createAccount/updateAccount | no | M1 |
| workers bulkAttendance/getAttendanceByDate | no | M13 |
| estimate module | yes (schemas) | authz missing (H1), item/status guards missing (M15) |
| photos createPhoto | no | L13 |
| user-settings upsert | no | L10 |
| notifications createNotification | no | type/message unbounded (L9) |

## Data-integrity / transaction audit (writes that should share a transaction)

- NOT atomic: projects.ts:39-60 (project + budget) — M9
- NOT atomic: projects.ts:149-184 (budget delete + soft-deletes) — M9
- NOT atomic: purchase-orders.ts:151-180 (RECEIVED: expense + prices + status) — H2
- NOT atomic: purchase-orders.ts:249-259 (PO + expense delete) — M11
- atomic: purchase-orders.ts:205-227 (item replace) — OK
- NOT atomic: financial.ts:68-90 (expense + budget/creator) — M2
- atomic: financial.ts:221-255 (transaction + balance) — OK, but see M4
- atomic: financial.ts:377-427 (payment + debt + balance) — OK, but see H7
- NOT atomic: estimate.ts:45-84 (estimate + item copy) — L15
- NOT atomic: estimate.ts:148-157 (archive + activate) — L15
- NOT atomic: estimate.ts:332+347 (bulk upsert + recalc) — L15
- NOT atomic: material-usage.ts:45-71 (usage + photos) — M12
- atomic: inventory.ts:91-124 (tx + stock) — OK, but pre-check outside tx — H9

## Positive findings

- Authorization model (`requirePermission` + per-module matrix, `src/lib/auth.ts:44-58`) is solid where applied; admin-only settings are correctly guarded (`requireAdmin`).
- Most actions validate input with Zod before use; Decimal money fields are consistently constructed via `new Decimal(...)` on write.
- `serialize()` is correctly used in all modules except estimate (C2) and account create/update (M1).
- Inventory transaction sign logic (IN/OUT/RETURN positive/negative, ADJUSTMENT absolute-set) is correct inside the transactional write itself.
- Soft-delete is used consistently (except MaterialUsage hard delete); photo storage cleanup exists in `deletePhoto`.

## Suggested fix order

1. C1, C2 (data exposure / broken UI)
2. H1 (estimate authz), H5 (brute force), H2 + H6 + H7 (ledger consistency)
3. H3 + H4 (budget correctness), H8 (estimate status invariant), H9 (stock race)
4. M-items (validation and atomicity), then L-items.
---

## Money-Flow E2E Round (new fixes, this session)

New E2E coverage `tests/money-flows.spec.ts` (project edit, expense create→approve→delete,
full purchase-order lifecycle incl. auto-expense and delete-reversal, logout) uncovered and
fixed two additional production bugs:

| ID | Severity | Finding | Fix |
|---|----------|---------|-----|
| E2E-1 | Critical | `min={0.01}` + `step="1"` on money inputs makes the HTML5 step base `0.01`, so whole-number amounts (e.g. 500.000₫) fail constraint validation (`stepMismatch`) and the form silently refuses to submit — expense, payment and transaction forms were unusable for virtually all real amounts in-browser | Changed `step` to `"0.01"` in `expense-form.tsx`, `payment-form.tsx`, `transaction-form.tsx` |
| E2E-2 | High | React Query lists never refreshed after server-action mutations (no `invalidateQueries`): creating an expense didn't show it, approving/rejecting/deleting left stale rows, deleting a project left the row visible (`router.refresh()` only re-renders RSC, not the client query cache) | Added `invalidateQueries` after mutations in `ExpensesClient` (create), `expense-actions.tsx` (approve/reject/delete), `projects/columns.tsx` (delete), `daily-logs/page.tsx` (delete) |
| E2E-3 | Low | Playwright couldn't match Radix Select triggers by accessible name (`getByRole('combobox', { name })`) because Radix's internal `aria-labelledby="…-trigger-view"` wrapper overrides the name | Money-flows spec scopes the status select via `getByRole('tabpanel', { name: 'Chi tiết' }).locator('[role=combobox]')`; options still matched by name |

## Verification (final round)

- Unit (Vitest): **118/118 passed** across 18 files (single-fork pool config to survive shared-box load)
- E2E (Playwright, 3051): **43/43 passed** — e2e.spec.ts (31) + estimate.spec.ts (8) + money-flows.spec.ts (4)
- `tsc --noEmit`: clean for app sources (only pre-existing `src/__tests__` mock-typing noise)
- `npm run lint`: clean

---

## Mobile-First UI + Construction Workflow Round (this session)

Audited every list screen at a 390px mobile viewport; the widest tables overflowed badly
(expenses 709px, attendance 913px, accounts 894px, debts 785px, stages 751px, suppliers 708px,
daily-logs 676px, projects 607px, materials 572px, workers 549px). All 12 list pages were
reworked to be mobile-first:

| Page | Approach |
|---|---|
| expenses | Full mobile card list (`md:hidden`) with search, category badge, amount, status dot, Approve/Reject/Delete actions + "Xem thêm" pagination; DataTable wrapped in `hidden md:block` |
| materials, workers, suppliers, projects, accounts, debts | `DataTable` `meta.hideOnMobile` → `hidden md:table-cell` on STT/min-stock/phone/address columns etc. |
| stages, daily-logs, attendance, PO, inventory | Hand-rolled tables: `hidden md:table-cell` on secondary columns + compact cells |

Re-measured at 390px: all pages now contained (expenses → cards, attendance 406px, accounts 410px,
debts 368px, stages 358px, daily-logs 377px, projects 447px, materials 388px, suppliers 359px,
workers 369px). No page-level horizontal overflow remains.

## Workflow E2E round (tests/workflow.spec.ts) — found and fixed 3 production bugs

| ID | Severity | Finding | Fix |
|---|----------|---------|-----|
| WF-1 | **Critical** | `attendanceSchema` requires `date` per record but the attendance page's `handleSave` never sent it → every "Lưu chấm công" save failed with Zod `invalid_date` at `[0].date`, the button stuck on "Đang lưu...", nothing was ever persisted (offline queue path broken the same way) | `src/app/(dashboard)/attendance/page.tsx`: add `date` to each record in `handleSave` |
| WF-2 | High | Inventory transaction forms (`InventoryClient` IN/USAGE/RETURN) ran `createTransaction` without `router.refresh()` → the DB updated but the UI stayed stale until manual reload; no success feedback | Added `toast` ("Đã lưu giao dịch kho") + `router.refresh()` in all three `onSubmit` handlers |
| WF-3 | Low | Inventory history table never displayed the transaction reference → POs/invoices couldn't be traced back from stock history | Added a "Tham chiếu" column to the history table |

Workflow tests cover the real construction loop: bước 1 update stage progress, bước 2 daily log
create/delete, bước 3 attendance check-in + persistence, bước 4 mobile expense card entry,
bước 5 inventory adjustment. All 5 pass.

## Verification (final round)

- Unit (Vitest): **118/118 passed** across 18 files
- E2E (Playwright, 3051): **48/48 passed** — e2e.spec.ts (30) + estimate.spec.ts (8) + money-flows.spec.ts (4) + workflow.spec.ts (5) + auth setup (1) — one transient dev-server-cache flake re-verified green in isolation and in the full re-run
- `tsc --noEmit`: clean for app sources
- `npm run lint`: clean on all changed files
- `npm run build`: success
## Production round (standalone + PM2, port 3050) — root causes found and fixed

Deployed the app as a Next.js standalone production build served by PM2 on port 3050
(`ecosystem.config.js` with full env; `next start` cannot be used with `output: standalone`).
The first production E2E run was 46/48: two failures that looked like "toasts never render
in prod" but were actually two separate issues:

| ID | Severity | Finding | Fix |
|---|----------|---------|-----|
| PR-1 | **High** | PO lifecycle test: clicking `Đã nhận` on the Radix Select updates the trigger label *optimistically* on the client, so the test navigated to /expenses **before the server action's transaction committed** — `getExpenses` raced the commit and the auto-expense was not yet visible. A server-side probe log proved the query ran 287 ms after the expense row was created (still uncommitted). Not a data/cache bug: the direct Prisma query always returns the row. | `tests/money-flows.spec.ts`: after choosing `Đã nhận`, wait for the status `<select>` to be **removed** (`toHaveCount(0)`) — RECEIVED is terminal so the select unmounts only after the action commits + `router.refresh()`. The `Đã nhận` badge assertion then runs against the committed state. |
| PR-2 | Medium | Workflow b5 toast assertion `getByText('Đã lưu giao dịch kho')` failed with *strict mode violation: resolved to 2 elements* — the shadcn toast title div AND radix's screen-reader announcer `<span role="status" aria-live="assertive">Notification Đã lưu giao dịch kho…</span>` both contain the text. The toast itself works fine in prod. | `tests/workflow.spec.ts`: use `getByText('Đã lưu giao dịch kho', { exact: true })` so only the toast title matches (the announcer text is never exact). |

Also verified: the radix/sonner toaster **does** mount and render in production (the earlier
"Toaster never mounts" conclusion came from probes using `data-radix-toast-viewport` /
`data-sonner-toaster` selectors — those data attributes are absent from the prod SSR output,
which is why the containers were invisible to the probes, not because they were missing).

## Verification (production round)

- E2E (Playwright vs http://10.20.10.103:3050 standalone prod): **48/48 passed** — e2e.spec.ts (30) + estimate.spec.ts (8) + money-flows.spec.ts (4) + workflow.spec.ts (5) + auth setup (1)
- Unit (Vitest): 118/118 passed (unchanged)
- `tsc --noEmit` clean, `npm run lint` clean, `npm run build` success (standalone output)
- PM2: `xaynha-chiphi` online, 0 unstable restarts, serving the standalone `server.js` on 0.0.0.0:3050
- Deployment recipe (if the server is ever rebuilt): `rm -rf .next && npm run build` → copy `public/*` + `.next/static` into `.next/standalone/xaynha-chiphi/` → `pm2 restart xaynha-chiphi`
