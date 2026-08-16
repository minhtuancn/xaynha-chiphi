# Feature Completeness & Test Coverage Audit — Xây Nhà Chi Phí (Next.js 16)

Repo: /home/dev/xaynha-chiphi · TypeScript · Prisma/PostgreSQL · NextAuth v5 (beta.25) · Next 16.2.7 · Vitest 4.1.9 + Playwright 1.60

**Method**: read-only audit. Read prisma/schema.prisma (38 models), all 20 files in src/actions/, all 15 unit-test files, both E2E specs, all dashboard pages/client components (glob + import-resolution check), auth stack, and PWA files. Ran `npx tsc --noEmit` and `npm test` (101 unit tests, 15 files — all pass). App source compiles with **zero** TS errors; all 29 tsc errors are confined to test files (mock typing).

---

## 1. Feature Coverage Matrix: Model → Actions → Page → Tests

Legend: ✓ full CRUD · ◐ partial (missing piece listed) · ✗ none · T = covered by unit test · E = covered by E2E

| # | Model | List/Get | Create | Update | Delete | Page(s) | Tests |
|---|-------|----------|--------|--------|--------|---------|-------|
| 1 | **User** | getUsers ✓ | createUser ✓ | updateUser, updateUserPermissions, toggleUserActive ✓ | ✗ no delete action | /settings/users | T (auth-config, auth-permissions) |
| 2 | **Session** | — (NextAuth-managed) | — | — | — | — | T (auth-config) |
| 3 | **AuthAccount** | — (NextAuth-managed) | — | — | — | — | — |
| 4 | **Project** | getProjects, getProject ✓ | createProject ✓ | updateProject ✓ | deleteProject (soft, dep-guarded) ✓ | /projects, /projects/[id], new, edit | E ✓ (create+delete) |
| 5 | **Setting** | getSettings ✓ | (via updateSetting upsert) | updateSetting ✓ | ✗ n/a (key-value) | /settings | — |
| 6 | **UserSetting** | getUserSetting ✓ | upsertUserSetting ✓ | setSelectedProject ✓; **applyUserTheme = STUB** | — | /settings, project-selector | — |
| 7 | **ConstructionStage** | getStages, getStage ✓ | createStage ✓ | updateStage ✓ | deleteStage (soft) ✓ | /stages, /stages/[id] | E ✓ (page loads) |
| 8 | **ConstructionTask** | ◐ no getTask/getTasks action (embedded in getStage) | createTask ✓ | updateTask ✓ | deleteTask (soft) ✓ | /stages/[id] | — |
| 9 | **Checklist** | getChecklists, getChecklist ✓ | createChecklist ✓ | updateChecklist ✓ | deleteChecklist ✓ | /checklists, [id] | — |
| 10 | **ChecklistItem** | ◐ embedded in checklist | addChecklistItem ✓ | toggleChecklistItem ✓; **no rename item** | deleteChecklistItem ✓ | /checklists/[id] | — |
| 11 | **DailyLog** | getDailyLogs, getDailyLog ✓ | createDailyLog ✓ (+photos) | updateDailyLog ✓ (+photos) | deleteDailyLog (soft) ✓ | /daily-logs, new, [id], [id]/edit | E ✓ (create flow) |
| 12 | **DailyLogPhoto** | ◐ embedded only | (inline in log create) | ✗ | ✗ no delete-photo action | /daily-logs/[id] | — |
| 13 | **WeatherRecord** | getWeatherForDate ✓ (lib/weather.ts) | create via fetch/cache ✓ | saveManualWeather ✓ | ✗ no delete | (dashboard widget) | — |
| 14 | **MaterialCategory** | getMaterialCategories ✓ | createMaterialCategory ✓ | updateMaterialCategory ✓ | deleteMaterialCategory ✓ (guard: in-use) | /materials (CategoryManager) | — |
| 15 | **Material** | getMaterials (paginated), getMaterial ✓ | createMaterial ✓ | updateMaterial ✓ | deleteMaterial (soft) ✓ | /materials, new, [id]/edit | T (pagination only) · E ✓ (page + search) |
| 16 | **MaterialPrice** | ◐ no list action | addManualPrice ✓ + PO auto-create | ✗ | ✗ | /materials/[id] | — |
| 17 | **InventoryTransaction** | getInventoryTransactions, getInventoryByMaterial ✓ | createTransaction ✓ (IN/OUT/USAGE/RETURN/ADJUSTMENT + stock math) | ✗ **no update** | ✗ **no delete** | /inventory | — |
| 18 | **MaterialUsage** | getMaterialUsages ✓ | createMaterialUsage ✓ (+photos) | ✗ **no update** | deleteMaterialUsage ✓ | /material-usage | — |
| 19 | **MaterialUsagePhoto** | embedded | inline ✓ | ✗ | ✗ | /material-usage | — |
| 20 | **Supplier** | getSuppliers, getSupplier ✓ | createSupplier ✓ | updateSupplier ✓ | deleteSupplier (soft) ✓ | /suppliers, new, [id]/edit | T (bank fields) |
| 21 | **PurchaseOrder** | getPurchaseOrders (paginated), getPurchaseOrder ✓ | createPurchaseOrder ✓ | updatePurchaseOrder ✓, updatePurchaseOrderStatus ✓ (RECEIVED→auto expense + price capture) | deletePurchaseOrder ✓ (cascades expense soft-delete) | /purchase-orders, new, [id] | T (status/delete linkage) |
| 22 | **PurchaseOrderItem** | ◐ no standalone actions (managed inside PO create/update via deleteMany+create) | — | — | — | embedded | — |
| 23 | **Worker** | getWorkers, getWorker ✓ | createWorker ✓ | updateWorker ✓ | deleteWorker (soft) ✓ | /workers, new, [id], [id]/edit | T (bank fields) |
| 24 | **WorkerAttendance** | getAttendanceByDate ✓ | bulkAttendance ✓ (upsert per worker/day) | bulkAttendance (upsert) ✓ | ✗ no per-record delete | /attendance | — |
| 25 | **Account** | getAccounts, getAccountDetail ✓ | createAccount ✓ | updateAccount ✓ | deleteAccount (soft) ✓ | /accounts, [id] | T (getAccountDetail) |
| 26 | **Transaction** | getTransactions (paginated) ✓ | createTransaction ✓ (auto balance incr/decr) | ✗ **no update** | ✗ **no delete/void** | /accounts | — |
| 27 | **Expense** | getExpenses, getExpenseCategories ✓ | createExpense ✓ | ◐ updateExpenseStatus only (**no edit of amount/category**) | deleteExpense (soft) ✓ | /expenses | E ✓ (page loads only) |
| 28 | **ExpenseCategory** | getExpenseCategories ✓ | ✗ **no create** | ✗ **no update** | ✗ **no delete** (seed-only) | /expenses (form select) | — |
| 29 | **Budget** | ◐ no standalone action (created/updated inside project actions) | (via createProject) | (via updateProject) | (via deleteProject) | project detail | — |
| 30 | **StageBudget** | ◐ read-only via project detail page (prisma direct) | ✗ | ✗ | ✗ | /projects/[id] | — |
| 31 | **Estimate** | getEstimatesByProject, getEstimateWithItems ✓ | createEstimate ✓ (auto version++, copy active items) | updateEstimate ✓, activateEstimate, archiveEstimate ✓ | deleteEstimate ✓ (DRAFT-only guard) | /projects/[id]/estimate | T (actions) · E ✓ (estimate.spec) |
| 32 | **EstimateItem** | embedded in estimate ✓ | createEstimateItem, bulkUpsertEstimateItems ✓ | updateEstimateItem ✓ (recalc) | deleteEstimateItem ✓ (recalc) | estimate page | T (schema + recalc) |
| 33 | **Debt** | getDebts, getPayments ✓ | createDebt ✓ | ✗ **no updateDebt** (amount/dueDate fixed) | deleteDebt (soft) ✓ | /debts | T (payment linkage) |
| 34 | **Payment** | getPayments ✓ | addPayment ✓ (debt status auto: UNPAID/PARTIAL/PAID, account debit) | ✗ | ✗ **no delete/undo** | /debts (dialog) | T (account linkage) |
| 35 | **Photo** | getPhotos ✓ | createPhoto ✓ | ✗ **no update (caption/tags)** | deletePhoto ✓ (+MinIO delete) | /photos | — |
| 36 | **Document** | getDocuments, getDocument ✓ | createDocument ✓ | ✗ **no update** | deleteDocument (soft) ✓ | /documents, upload, [id] | — |
| 37 | **AuditLog** | ✗ **no read/list action anywhere** | (logAudit write-only, lib/audit.ts) | — | — | — (no page) | T (logAudit write) |
| 38 | **Notification** | getNotifications, getNotificationDetail, getUnreadCount ✓ | createNotification, createNotificationForCurrentUser, notifyAdmins ✓ | markAsRead/Unread/markAllAsRead ✓ | deleteNotification ✓ | /notifications, header dropdown | T (3 actions) |

### Gaps at model level (evidence)
- **No update**: InventoryTransaction, MaterialUsage, Expense (content), Transaction, Debt, Photo, Document, MaterialPrice, ChecklistItem (rename), WorkerAttendance (single record).
- **No delete**: Transaction (no void/undo), Payment (no undo), User (no delete — only toggle isActive), InventoryTransaction, ExpenseCategory.
- **No create/update/delete**: ExpenseCategory (seed-only), StageBudget (no actions at all), Budget (only via project), MaterialPrice (create-only), DailyLogPhoto/MaterialUsagePhoto (inline only).
- **No list/read**: ConstructionTask (no standalone list), AuditLog (write-only, no UI to view audit trail), StageBudget, DailyLogPhoto.
- **Stubs**: `applyUserTheme()` in `src/actions/user-settings.ts` (lines 55–56) — only calls `requireUser()` and does nothing; `src/lib/ai-insights.ts` — `getFinancialInsights` returns a hardcoded string with comment `// AI Logic placeholder` (line 6) and is **not imported anywhere** in src; `src/lib/pdf-generator.tsx` — minimal `FinancialReportPDF` rendering only a title+total (lines 6–13), **not imported by any page** (the current reports page uses jsPDF+html2canvas directly; only `reports/page.tsx.backup` referenced it).

### Suspected runtime bug (noted, not fixed)
- `src/app/(dashboard)/purchase-orders/page.tsx` (lines 10–20): calls `getPurchaseOrders()` which returns `serialize({ data, total })` (a paginated object) but casts it `as unknown as PurchaseOrderRow[]` and passes the **object** to `DataTable data={...}`. `DataTable` (`src/components/ui/data-table.tsx`) feeds it straight into `useReactTable({ data })`, which expects an array — the PO list will render no rows or crash. Compare `src/app/(dashboard)/inventory/page.tsx` lines 12–13 which correctly unwraps `(txResult as { data }).data ?? []`. No E2E test covers the PO list page, so this is untested.
- Stray files: `reports/page.tsx.backup` (leftover in route dir), root-level `test-tabs.tsx`, `fix-stage-edit.js`, duplicate `next.config.js` + `next.config.ts`.

---

## 2. Existing E2E Tests

### tests/e2e.spec.ts (11 KB, ~19 tests, 6 suites)
1. **Authentication** — login page loads; valid admin login → /dashboard; "valid user" login (uses the **same admin credentials** as the admin test — not a real role distinction); invalid credentials stay off dashboard; empty fields show "Email không hợp lệ".
2. **Dashboard** — project name "Tuấn Mơ" visible; progress text; "Ngân sách" label; sidebar nav to /projects; stages page header; materials page (URL, title, STT column, search box); daily-logs page URL; expenses page URL; reports page URL; theme toggle (light→dark); full **create daily log** flow (select project → Buổi sáng → worker count → note → submit → 303 redirect).
3. **CRUD Operations** — create project (form fill → lands on /projects → name visible); search in materials table ("Xi măng"); delete project (create → trash → alertdialog → Xóa → gone). **No update/edit E2E anywhere.**
4. **Security** — unauthenticated → redirected to /login; `/api/upload` rejects unauthenticated (404/405); no `passwordHash`/`DATABASE_URL` in HTML; "CSP headers present" (only checks 200, does not assert CSP header value); XSS string in search stays un-rendered.
5. **Vietnamese Formatting** — currency with ₫; dd/mm/yyyy dates.
6. **Mobile Responsive** — login page, dashboard, tablet at 375×667 / 768×1024 (load-only assertions).

**Weaknesses**: hard-coded seed credentials (vietkeynet@gmail.com / Vkn@1234561) and seed data ("Tuấn Mơ", "Xi măng"); duplicate admin/user login tests; theme test depends on page defaulting to light; CSP test asserts nothing about the CSP header; no assertions on form validation errors except empty-email; relies on `waitForTimeout(500)` (flaky-prone).

### tests/estimate.spec.ts (3 KB, 8 tests)
- `beforeEach` logs in and navigates to `/projects/c5a4398e-cf7f-4d09-a2f8-f0cb25795cf3/estimate` — **hard-coded project ID** (breaks if seed changes).
- Covers: page loads version selector (v1 + "Đang áp dụng"); CSV export button visible; import dialog opens; **create new version shows "Nháp" badge**; expanding stage group shows codes (MN.01 pattern); summary tab shows cost-type breakdown (Vật tư/Nhân công/Thiết bị); all column headers present; total in VND.

**Not covered in estimate E2E**: editing an item, adding items, activating a version, comparing versions, downloading the actual CSV/PDF, deleting a DRAFT, progress sync.

---

## 3. Unit Tests (src/__tests__ — 15 files, 101 tests, all pass)

| File | Coverage |
|---|---|
| auth-config.test.ts | NextAuth `authorize`: inactive user → null; bad password → null; valid → session payload + `lastLoginAt` update; rememberMe flag |
| auth-permissions.test.ts | `parsePermissions` (valid/invalid JSON), `hasPermission` (ADMIN bypass, USER module/action checks) |
| audit.test.ts | `logAudit` writes serialized changes |
| account-history.test.ts | `getAccountDetail` include shape + ordering |
| notifications-actions.test.ts | getNotificationDetail (user-scoped), markAsUnread, createNotificationForCurrentUser |
| materials-pagination.test.ts | `getMaterials` pagination: default shape `{data,total}`, skip/take math, total reflects full count |
| offline-queue.test.ts | `enqueue` (localStorage append, UUID/timestamp, existing items), `getPendingCount` (0/3/corrupted JSON) |
| payments-account-link.test.ts | `addPayment`: account balance decrement, debt paidAmount/status PARTIAL, audit log |
| purchase-orders-links.test.ts | `updatePurchaseOrderStatus` RECEIVED → exactly one auto Expense + MaterialPrice capture; `deletePurchaseOrder` → linked expense soft-delete |
| worker-supplier-financial.test.ts | create/update Worker & Supplier persist bank/tax fields + audit |
| utils-format.test.ts / utils.test.ts | formatCurrency/Number/Date/DateTime/DateInput/Unit/Percent/FileSize incl. NaN/null/negative |
| utils-time-csv.test.ts | escapeCSV (commas, quotes, newlines, null), formatTimeInput, parseTime |
| schemas/estimate.test.ts | Zod: createEstimate, estimateItem (neg qty, bad costType, pct>100, defaults), bulkUpsert, import row coercion, compare |
| actions/estimate.test.ts | createEstimate (version+1, DRAFT, unauthorized), getEstimatesByProject ordering, activateEstimate (archive old + activate), deleteEstimate (DRAFT-only guard), exportEstimateToPDF (base64), compareEstimates (ADDED/CHANGED/REMOVED, not-found), syncProgressFromLogs |

**Important**: `src/__tests__/components/` exists but contains **zero** test files (empty `estimate/` dir) — no React component tests anywhere.

---

## 4. Routes / Client Components Audit

- Every route under `src/app/(dashboard)/` was globbed and **every import resolved** (both relative and `@/` aliases) — 0 broken imports; `npx tsc --noEmit` shows **0 errors in app source** (only test-file mock typing errors, 29 total).
- Verified client components exist and are wired: AccountsClient, DebtsClient, ExpensesClient, InventoryClient, DashboardClient, photos-client, documents-client, project-detail-client, stages/[id]/page-client, workers/[id]/page-client, purchase-orders/[id]/page-client, EstimateClientPage (+ CompareModal, ImportDialog, EstimateTable, EstimateSummaryTabs, VersionSelector).
- Sidebar (`src/components/layout/sidebar.tsx`) exposes 20 modules. **Notable**: the **estimate (dự toán) module has no sidebar entry** — reachable only via project detail page (`/projects/[id]/estimate` link in project-detail-client.tsx:460). Reports page re-renders data with jsPDF+html2canvas (no server-rendered PDF); the `pdf-generator.tsx` react-pdf component is unused.
- All CRUD list pages are either server components fetching actions directly or client pages with react-query hooks (`use-projects`, `use-workers`, `use-materials`, `use-daily-logs`, `use-expenses`) — consistent patterns.

---

## 5. lib Implementations (complete vs stub)

| File | Verdict |
|---|---|
| src/lib/csv.ts | **Complete** — escapeCSV + exportToCSV (BOM, blob download). Unit-tested. |
| src/lib/offline-queue.ts | **Complete-ish** — enqueue/getPendingCount/drainQueue + registry for createDailyLog & bulkAttendance + auto-drain on `xaynha:online`. Unit-tested (enqueue/count only; **drainQueue and online listener untested**). |
| src/lib/pdf-generator.tsx | **Stub/minimal** — FinancialReportPDF renders only title + total; **unused** by any page. |
| src/lib/ai-insights.ts | **Stub** — hardcoded string, `// AI Logic placeholder`; **unused**. |
| src/lib/weather.ts + weather-service.ts | **Complete** — OpenWeather fetch w/ cache into WeatherRecord, manual upsert; WeatherService fallback chain used by cron route. |
| src/lib/ai-safety.ts | Complete pure function (evaluateWeatherSafety) but not imported by any page (exported standalone). |
| src/lib/auth.ts | Complete — getCurrentUser/requireUser/requireAdmin/requirePermission (ADMIN bypass, per-module perms). |
| src/lib/audit.ts | Complete (write side); **no read side exists**. |
| src/lib/upload.ts / minio.ts | Complete — FS + MinIO upload/delete/ensureBucket with config validation. |

---

## 6. Auth Flow

- **login/page.tsx** (client): react-hook-form + zod (loginSchema), calls `signIn("credentials", { redirect: false })`, on success hard-navigates to /dashboard; shows inline error; rememberMe checkbox passed through.
- **api/auth/[...nextauth]/auth.ts**: Credentials provider (email+password+rememberMe) → `authorize` checks user exists, `deletedAt` null, `isActive`, bcrypt compare, updates `lastLoginAt`; JWT session strategy (30-day maxAge; rememberMe=false overrides token.exp to 24 h); callbacks inject `id`/`role` into session; explicit cookie config (httpOnly, sameSite lax, secure in prod over https); `trustHost: true` (needed behind proxy).
- **Middleware**: Next.js 16 `src/proxy.ts` (middleware renamed in v16) wraps `auth()` — protects everything except /login, /api/auth, /api/health, static assets; **login rate limiter** (5 attempts / 15 min per IP, in-memory) applied to POST /login. Note: in-memory Map limiter resets on server restart and won't scale across instances.
- **Flow is functionally complete** (login → session → protected layout checks auth + user existence → redirect /login). Gap: **no logout E2E, no rememberMe E2E, no rate-limit (429) E2E**, and password change is not implemented anywhere (no action).

## 7. PWA Support

- `src/app/manifest.ts` generates metadata manifest (name/short_name/start_url /dashboard/standalone/icons **/icon-192.png, /icon-512.png**).
- `public/manifest.json` exists too — but references **/icons/icon-192.svg** and **/icons/icon-512.svg** (SVG files in public/icons/). **Conflict**: two manifest sources; metadata manifest points at PNGs that **do not exist** (public/ has icon-192.svg/icon-512.svg, not .png) → broken icons depending on which manifest wins (Next.js serves /manifest.json static file, which wins for the URL; its SVG icons do exist).
- **Service worker**: `public/sw.js` registered via inline script in root layout (lines 26–30) and in `src/proxy.ts` publicAssets allowlist. It caches `/_next/static` (stale-while-revalidate), font/image assets (cache-first), and falls back to cache for navigation on fetch failure; **excludes /api/ and non-GET** — reasonable. It's a network-first-with-cache-fallback, not a full offline app-shell; no `precache` manifest; cache version "xaynha-v1".
- **Offline UX**: OfflineProvider + OfflineBanner show pending count; daily-log form and attendance page `enqueue()` when offline. **No E2E for offline/mobile flows.**

---

## 8. Test Coverage Gaps (critical flows lacking coverage)

1. **Project update/edit** — no E2E for edit form; no unit tests for updateProject budget sync.
2. **Expense lifecycle** — only page-load E2E. No create-expense, approve/reject, delete E2E; no unit tests for createExpense/updateExpenseStatus/deleteExpense.
3. **Purchase Order flow** — zero E2E (and the list page itself may be broken, see §1). No E2E for create PO, status transitions, auto-expense creation, delete.
4. **Estimate deep flows** — E2E covers view/import-dialog/create-version only; missing item add/edit/delete, activate, compare, actual CSV/PDF download, delete DRAFT, progress sync.
5. **Attendance** — no E2E; bulkAttendance upsert logic untested at unit level.
6. **Inventory** — no E2E; createTransaction stock math (IN/OUT/ADJUSTMENT/insufficient stock) untested.
7. **Material usage** — no E2E; createMaterialUsage + photo attach untested.
8. **Debts/payments** — no E2E; addPayment covered at unit level but createDebt/deleteDebt untested.
9. **Suppliers/workers/accounts CRUD** — no E2E for new/edit forms; only bank-field unit tests.
10. **Notifications** — no E2E (mark-as-read, unread count badge, dropdown).
11. **User management** — no tests for createUser/updateUser/updateUserPermissions/toggleUserActive or role-based UI.
12. **Auth edge cases** — logout, rememberMe session-length, 429 rate-limit, inactive-user login (unit-covered only), callbackUrl redirect.
13. **Mobile flows** — only login+dashboard load; no mobile CRUD, no offline queue E2E (enqueue → banner → drain on reconnect).
14. **Component tests** — zero (empty components/ dir); no tests for DataTable, forms, estimate table, dialogs.
15. **Reports** — no E2E/unit for getFinancialReport/getProgressReport aggregations or PDF/CSV export from reports page.
16. **Audit trail** — AuditLog has no read action and no page; nothing to test.

---

## 9. Recommended New Tests (15 concrete cases)

1. **E2E — Edit project** (`/projects/[id]/edit`): change name+budget → submit → list shows new name; assert budget figure updates on project detail. Assert updateProject re-syncs Budget row.
2. **E2E — Expense create + approve flow** (/expenses): open form, fill amount/date/category → save → row visible as "Chờ duyệt"; click approve → "Đã duyệt"; assert total appears in dashboard budget spent.
3. **E2E — Purchase order lifecycle** (fix list page first): create PO with items → DRAFT; advance to SENT → RECEIVED; assert auto-Expense appears in /expenses and material price captured; delete PO → expense disappears. This also regression-tests the `{data,total}` DataTable bug.
4. **E2E — Estimate item CRUD + activate + compare**: add item row → total recalculates; create v2, activate → v1 becomes "Lưu trữ"; open compare modal → ADDED/CHANGED/REMOVED counts; delete DRAFT v2 only.
5. **E2E — Estimate export**: click "Xuất CSV"/"Xuất PDF" → capture download event; assert filename `du-toan-*.csv/pdf` and non-empty content (CSV contains header "Mã CP").
6. **E2E — Attendance save**: pick date, set a worker PRESENT with check-in time → save → reload → values persist (tests bulkAttendance upsert).
7. **Unit — createTransaction stock math** (inventory.ts): IN increments, OUT decrements, OUT > stock throws "vượt quá tồn kho", ADJUSTMENT sets absolute; USAGE also creates MaterialUsage with latest dailyLog linkage (mock prisma $transaction).
8. **Unit — createMaterialUsage + photo persistence**: quantity/material/project fields passed; MaterialUsagePhoto rows created; deleteMaterialUsage removes row.
9. **Unit — createDebt/deleteDebt + addPayment status transitions**: UNPAID→PARTIAL→PAID boundary (paidAmount == amount → PAID), deleteDebt soft-delete.
10. **Unit — Expense actions**: createExpense requires active project scope (throws "Không có dự án đang hoạt động"), updateExpenseStatus guards non-existent, deleteExpense soft-delete + audit call.
11. **Unit — reports aggregation** (reports.ts): getFinancialReport groups by category/month with correct sums and budget remaining; getMaterialUsageReport flags lowStock correctly (Decimal compare).
12. **Unit — offline-queue drainQueue**: mock createDailyLog/bulkAttendance — drainQueue processes items, returns {success, failed}, removes processed items; failure keeps item and increments failed.
13. **Unit — settings user management** (settings.ts): createUser hashes password (bcrypt called), updateUserPermissions JSON round-trip, toggleUserActive flips isActive; requireAdmin blocks non-admin (rejects).
14. **E2E — Auth edge cases**: logout via header → redirected to /login; login page returns 429 after 6 rapid failed attempts (or unit-test loginLimiter directly with mocked request); inactive user login shows error.
15. **Unit — audit/security + first component test**: add tests for `logAudit` failure tolerance (throws → console.error, doesn't break caller) and, if implemented, a listAuditLogs action; plus a component test (e.g., render DataTable with data → rows visible, search filters, CSV export calls escapeCSV) to fill the empty components/ test dir.

---

## Summary of Key Findings

- **Strong**: clean compile of app code, all imports resolve, 101 unit tests green, full CRUD for 15 of 38 models, rich estimate module (versioning, compare, import/export, progress sync), complete auth + rate limiting + PWA scaffold, offline queue wired into daily logs & attendance.
- **Biggest risks**: (a) purchase-orders list page data-shape bug rendering an object into DataTable; (b) no update actions for Transaction, InventoryTransaction, MaterialUsage, Expense, Debt, Photo, Document, Payment (undo); (c) ExpenseCategory/StageBudget/Budget have no management actions; (d) AuditLog is write-only (no compliance view); (e) `applyUserTheme`, `ai-insights.ts`, `pdf-generator.tsx` are stubs/dead code; (f) E2E hard-codes seed credentials + a hard-coded estimate project ID and skips every money-critical flow (expense, PO, debts, inventory); (g) zero component tests; (h) duplicate/conflicting manifest icon paths (PNG vs SVG) and offline app-shell is minimal.