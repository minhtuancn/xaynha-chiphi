import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3050';

// Workflow test for the construction-site daily routine, step by step:
// stage progress update -> daily log -> attendance -> expense (mobile card)
// -> inventory adjustment. Each test restores/cleans up the data it touches
// so the suite stays idempotent and leaves the seeded DB intact.

test.describe('Workflow thi công (xây nhà)', () => {
  test('bước 1: cập nhật tiến độ giai đoạn', async ({ page }) => {
    await page.goto(`${BASE_URL}/stages`);
    // switch to the active project tab (robust even if other projects exist)
    await page.getByRole('tab', { name: /Nhà anh chị Tuấn Mơ/ }).click();
    const detailLink = page.locator('a[href^="/stages/"]').first();
    await detailLink.waitFor({ state: 'attached', timeout: 30000 });
    const href = (await detailLink.getAttribute('href'))!;
    await page.goto(`${BASE_URL}${href}`);

    await page.getByRole('tab', { name: 'Chỉnh sửa' }).click();
    const progressInput = page.getByLabel('Tiến độ (%)');
    await progressInput.waitFor({ timeout: 15000 });
    const oldValue = await progressInput.inputValue();
    const newValue = oldValue === '40' ? '45' : '40';

    await progressInput.fill(newValue);
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('tab', { name: 'Chi tiết' }).click();
    await expect(page.getByText(`${newValue}%`).first()).toBeVisible({ timeout: 15000 });

    // restore original progress
    await page.getByRole('tab', { name: 'Chỉnh sửa' }).click();
    await page.getByLabel('Tiến độ (%)').fill(oldValue);
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('tab', { name: 'Chi tiết' }).click();
    await expect(page.getByText(`${oldValue}%`).first()).toBeVisible({ timeout: 15000 });
  });

  test('bước 2: tạo nhật ký thi công rồi xóa', async ({ page }) => {
    const note = `Nhật ký E2E ${Date.now()}`;
    await page.goto(`${BASE_URL}/daily-logs/new`);

    // Project is required (not defaulted) — select the seeded project
    await page.getByLabel('Dự án *').click();
    await page.getByRole('option', { name: /Nhà anh chị Tuấn Mơ/ }).click();
    await page.getByLabel('Số công nhân').fill('5');
    await page.getByPlaceholder('Ghi chú về tiến độ thi công trong ngày').fill(note);
    await page.getByRole('button', { name: 'Tạo nhật ký' }).click();
    await page.waitForTimeout(1500);

    // Verify on the list page
    await page.goto(`${BASE_URL}/daily-logs`);
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 20000 });

    // Cleanup: delete the log
    const row = page.getByRole('row').filter({ hasText: note }).first();
    await row.getByLabel('Xóa nhật ký này?').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('row').filter({ hasText: note })).toHaveCount(0, { timeout: 15000 });
  });

  test('bước 3: chấm công công nhân', async ({ page }) => {
    await page.goto(`${BASE_URL}/attendance`);
    const firstRow = page.locator('tbody tr').first();
    await firstRow.waitFor({ timeout: 15000 });

    const presentBtn = firstRow.getByRole('button', { name: 'Có mặt' });
    const absentBtn = firstRow.getByRole('button', { name: 'Vắng mặt' });
    const lateBtn = firstRow.getByRole('button', { name: 'Đi trễ' });

    // capture original state
    const wasPresent = (await presentBtn.getAttribute('aria-pressed')) === 'true';
    const wasAbsent = (await absentBtn.getAttribute('aria-pressed')) === 'true';
    const wasLate = (await lateBtn.getAttribute('aria-pressed')) === 'true';
    const checkInInput = firstRow.locator('input[type=time]').first();
    const originalCheckIn = await checkInInput.inputValue();

    // mark PRESENT with a check-in time
    await presentBtn.click();
    await checkInInput.fill('07:30');
    await page.getByRole('button', { name: 'Lưu chấm công' }).click();
    await expect(page.getByText('Đã lưu chấm công thành công!')).toBeVisible({ timeout: 60000 });

    // persisted after reload
    await page.reload();
    const rowAfter = page.locator('tbody tr').first();
    await expect(rowAfter.getByRole('button', { name: 'Có mặt' })).toHaveAttribute('aria-pressed', 'true', { timeout: 15000 });

    // restore original status + check-in time
    const restoreRow = page.locator('tbody tr').first();
    if (wasAbsent) await restoreRow.getByRole('button', { name: 'Vắng mặt' }).click();
    else if (wasLate) await restoreRow.getByRole('button', { name: 'Đi trễ' }).click();
    if (originalCheckIn) {
      await restoreRow.locator('input[type=time]').first().fill(originalCheckIn);
    }
    await page.getByRole('button', { name: 'Lưu chấm công' }).click();
    await expect(page.getByText('Đã lưu chấm công thành công!')).toBeVisible({ timeout: 60000 });
  });

  test('bước 4: nhập chi phí hiển thị dạng card trên mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const desc = `Chi phí mobile E2E ${Date.now()}`;
    await page.goto(`${BASE_URL}/expenses`);

    await page.getByLabel('Danh mục chi phí').click();
    await page.getByRole('option', { name: 'Vật liệu xây dựng' }).click();
    await page.getByLabel('Số tiền').fill('250000');
    await page.getByLabel('Mô tả (tùy chọn)').fill(desc);
    await page.getByRole('button', { name: 'Tạo chi phí' }).click();

    // Mobile card list shows the new expense
    const card = page.locator('.rounded-lg.border.bg-card').filter({ hasText: desc }).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(card).toContainText('250.000 ₫');
    await expect(card).toContainText('Chờ duyệt');

    // Cleanup: delete from the card
    await card.getByTitle('Xóa').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click();
    await expect(card).toHaveCount(0, { timeout: 15000 });
  });

  test('bước 5: điều chỉnh tồn kho vật liệu', async ({ page }) => {
    const ref = `E2E-${Date.now()}`;
    await page.goto(`${BASE_URL}/inventory`);

    await page.getByLabel('Vật liệu').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('Số lượng').fill('1');
    await page.getByLabel('Mã tham chiếu (tùy chọn)').fill(ref);
    await page.getByRole('button', { name: 'Tạo giao dịch' }).click();

    // Success toast confirms the server action completed.
    // exact: true — the radix screen-reader announcer also contains this text.
    await expect(page.getByText('Đã lưu giao dịch kho', { exact: true })).toBeVisible({ timeout: 30000 });

    // Transaction appears in history
    const row = page.getByRole('row').filter({ hasText: ref }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText('1');
  });
});
