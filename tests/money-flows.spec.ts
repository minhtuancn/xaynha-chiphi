import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3050';

// Money-critical flows that were previously uncovered: project edit,
// expense create + approve, full purchase-order lifecycle (auto expense),
// and logout. Tests are authenticated via the setup project storageState.
// Unique names per run keep the suite idempotent after failed runs.

const PO_SUPPLIER = 'Vật Liệu Xây Dựng Minh Tuấn';

test.describe('Project edit flow', () => {
  test('rename project and update budget', async ({ page }) => {
    const stamp = Date.now();
    const original = `Dự án E2E ${stamp}`;
    const renamed = `Dự án E2E sửa ${stamp}`;

    // Clean up leftovers from previous failed runs (idempotent)
    await page.goto(`${BASE_URL}/projects`);
    let leftover = page.getByRole('row').filter({ hasText: 'Dự án E2E' }).first();
    while (await leftover.count()) {
      await leftover.getByRole('button').last().click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
      await expect(leftover).toHaveCount(0, { timeout: 15000 });
      leftover = page.getByRole('row').filter({ hasText: 'Dự án E2E' }).first();
    }

    // Create a throwaway project
    await page.goto(`${BASE_URL}/projects/new`);
    await page.getByLabel('Tên dự án').fill(original);
    await page.getByLabel('Địa chỉ').fill('Địa chỉ E2E');
    await page.getByLabel('Ngân sách (₫)').fill('900000000');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await page.waitForURL('**/projects');
    await expect(page.getByRole('link', { name: original })).toBeVisible({ timeout: 15000 });

    // Open the project and switch to the edit tab
    await page.getByRole('link', { name: original }).click();
    await page.waitForURL('**/edit?tab=view');
    await page.getByRole('tab', { name: 'Chỉnh sửa' }).click();

    // Rename + new budget, then save
    await page.getByLabel('Tên dự án').fill(renamed);
    await page.getByLabel('Ngân sách (₫)').fill('950000000');
    await page.getByRole('button', { name: 'Cập nhật' }).click();
    await page.waitForURL('**/projects');
    await expect(page.getByRole('link', { name: renamed })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: original })).toHaveCount(0);

    // Verify the budget persisted on the detail view
    await page.getByRole('link', { name: renamed }).click();
    await expect(page.getByText('950.000.000 ₫').first()).toBeVisible({ timeout: 15000 });

    // Cleanup: delete the throwaway project
    await page.goto(`${BASE_URL}/projects`);
    const row = page.getByRole('row').filter({ hasText: renamed }).first();
    await row.getByRole('button').last().click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('link', { name: renamed })).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('Expense create + approve flow', () => {
  test('create a pending expense then approve it', async ({ page }) => {
    const desc = `Chi phí E2E ${Date.now()}`;
    await page.goto(`${BASE_URL}/expenses`);

    // Fill the expense form (seeded DB has an active project scope)
    await page.getByLabel('Danh mục chi phí').click();
    await page.getByRole('option', { name: 'Vật liệu xây dựng' }).click();
    await page.getByLabel('Số tiền').fill('500000');
    await page.getByLabel('Mô tả (tùy chọn)').fill(desc);
    await page.getByRole('button', { name: 'Tạo chi phí' }).click();

    // Row appears with PENDING status (list auto-refreshes after create)
    const row = page.getByRole('row').filter({ hasText: desc }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText('Chờ duyệt')).toBeVisible();
    await expect(row.getByText('500.000 ₫')).toBeVisible();

    // Approve it
    await row.getByTitle('Duyệt').click();
    await expect(row.getByText('Đã duyệt')).toBeVisible({ timeout: 15000 });

    // Cleanup: delete the expense row
    await row.getByTitle('Xóa').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('row').filter({ hasText: desc })).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('Purchase order lifecycle', () => {
  test('create PO, receive it, auto-expense appears, delete reverses', async ({ page }) => {
    // 0. Clean up leftover POs from previous runs so row scoping is stable
    await page.goto(`${BASE_URL}/purchase-orders`);
    let leftoverPo = page.getByRole('row').filter({ hasText: PO_SUPPLIER }).first();
    while (await leftoverPo.count()) {
      await leftoverPo.getByRole('link', { name: 'Chi tiết' }).click();
      await page.waitForURL('**/purchase-orders/*');
      await page.locator('button.bg-destructive').click();
      await page.getByRole('button', { name: 'Xóa' }).click();
      await page.waitForURL('**/purchase-orders');
      leftoverPo = page.getByRole('row').filter({ hasText: PO_SUPPLIER }).first();
    }

    // 1. Create a PO with one material line
    await page.goto(`${BASE_URL}/purchase-orders/new`);
    await page.getByLabel('Nhà cung cấp').click();
    await page.getByRole('option', { name: PO_SUPPLIER }).click();
    await page.getByLabel('Dự án').click();
    await page.getByRole('option', { name: /Tuấn Mơ/ }).click();

    // First item row exists by default: pick material, qty, price
    const itemRow = page.locator('div.rounded-lg.border.p-4').first();
    await itemRow.getByLabel('Tên vật liệu').click();
    await page.getByRole('option', { name: 'Xi măng PCB40 (bao 50kg)' }).click();
    await itemRow.getByLabel('Số lượng').fill('10');
    await itemRow.getByLabel('Đơn giá').fill('100000');
    await page.getByRole('button', { name: 'Tạo đơn hàng' }).click();
    await page.waitForURL('**/purchase-orders');

    // 2. List shows the PO as DRAFT with correct total
    const poRow = page.getByRole('row').filter({ hasText: PO_SUPPLIER }).first();
    await expect(poRow.getByText('Nháp')).toBeVisible({ timeout: 15000 });
    await expect(poRow.getByText('1.000.000 ₫')).toBeVisible();

    // 3. Open detail, advance SENT -> RECEIVED
    const detailHref = await poRow.getByRole('link', { name: PO_SUPPLIER }).getAttribute('href');
    await page.goto(`${BASE_URL}${detailHref}`, { timeout: 60000 });
    // Note: Radix Select triggers carry an internal aria-labelledby that
    // overrides their accessible name, so scope by tabpanel instead of name.
    const statusSelect = page.getByRole('tabpanel', { name: 'Chi tiết' }).locator('[role=combobox]');
    await expect(statusSelect).toBeVisible({ timeout: 60000 });

    await statusSelect.click();
    await page.getByRole('option', { name: 'Đã gửi' }).click();
    // The next select's options come from the SERVER-rendered status, so the
    // 'Đã nhận' option only exists after the action commits + router.refresh.

    await statusSelect.click();
    await page.getByRole('option', { name: 'Đã nhận' }).click();
    // RECEIVED is terminal: the status select is removed once the action commits.
    await expect(statusSelect).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText('Đã nhận').first()).toBeVisible({ timeout: 15000 });

    // 4. Receiving auto-creates an approved expense
    await page.goto(`${BASE_URL}/expenses`);
    const autoExpense = page.getByRole('row').filter({ hasText: 'Chi phí tự động từ đơn hàng' }).first();
    await expect(autoExpense).toBeVisible({ timeout: 15000 });
    await expect(autoExpense.getByText('Đã duyệt')).toBeVisible();
    await expect(autoExpense.getByText('1.000.000 ₫')).toBeVisible();

    // 5. Deleting the received PO reverses the expense
    await page.goto(`${BASE_URL}/purchase-orders`);
    const poRow2 = page.getByRole('row').filter({ hasText: PO_SUPPLIER }).first();
    const detailHref2 = await poRow2.getByRole('link', { name: 'Chi tiết' }).getAttribute('href');
    await page.goto(`${BASE_URL}${detailHref2}`, { timeout: 60000 });
    await expect(page.locator('button.bg-destructive')).toBeVisible({ timeout: 60000 });
    await page.locator('button.bg-destructive').click();
    await page.getByRole('button', { name: 'Xóa' }).click();
    await page.waitForURL('**/purchase-orders');
    await expect(page.getByRole('row').filter({ hasText: PO_SUPPLIER })).toHaveCount(0, { timeout: 15000 });

    await page.goto(`${BASE_URL}/expenses`);
    await expect(page.getByRole('row').filter({ hasText: 'Chi phí tự động từ đơn hàng' })).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('Auth edge cases', () => {
  test('logout redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.getByRole('button', { name: 'Q' }).click();
    await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });
});