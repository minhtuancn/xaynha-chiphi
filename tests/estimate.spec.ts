import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://localhost:3050';
// Fixed id: seeded deterministically in prisma/seed.ts
const PROJECT_ID = 'c5a4398e-cf7f-4d09-a2f8-f0cb25795cf3';

test.describe('Estimate Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'vietkeynet@gmail.com');
    await page.fill('#password', 'Vkn@1234561');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE_URL}/projects/${PROJECT_ID}/estimate`);
    await page.waitForLoadState('networkidle');
    // Wait for the version selector to appear (page fully loaded)
    await expect(page.getByText(/v1/)).toBeVisible({ timeout: 10000 });
  });

  test('estimate page loads version selector', async ({ page }) => {
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toContain('Đã xảy ra lỗi');
    expect(text).toContain('v1');
    expect(text).toContain('Đang áp dụng');
  });

  test('CSV export button visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Xuất CSV/ })).toBeVisible({ timeout: 5000 });
  });

  test('import dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /Import CSV/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

  test('create new version shows draft badge', async ({ page }) => {
    await page.getByRole('button', { name: /Tạo bản mới/ }).click();
    await expect(page.getByText('Nháp').first()).toBeVisible({ timeout: 15000 });
  });

  test('expand stage group shows estimate codes', async ({ page }) => {
    await page.getByRole('tab', { name: 'Bảng lượng' }).click();
    // Click the stage row to expand it
    const stageRow = page.getByRole('row').filter({ hasText: /Móng và nền/ }).first();
    await stageRow.click();
    // Check for any estimate code pattern (CB.01, MN.01, etc.)
    const codePattern = /[A-Z]{2}\.\d{2}/;
    await expect(page.getByText(codePattern).first()).toBeVisible({ timeout: 5000 });
  });

  test('summary tab shows cost type breakdown', async ({ page }) => {
    await page.getByRole('tab', { name: 'Tổng hợp' }).click();
    // Click "Tổng hợp theo loại CP" sub-tab
    await page.getByRole('tab', { name: /loại CP/ }).click();
    // Check for cost type full names
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toMatch(/Vật tư|Nhân công|Thiết bị/);
  });

  test('table has all column headers', async ({ page }) => {
    const headers = ['Mã CP', 'Hạng mục', 'ĐVT', 'SL dự toán', 'Đơn giá', 'Thành tiền', 'Loại'];
    for (const h of headers) {
      await expect(page.getByRole('columnheader', { name: h }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('total amount in VND', async ({ page }) => {
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toContain('Tổng cộng');
    expect(text).toContain('₫');
  });
});
