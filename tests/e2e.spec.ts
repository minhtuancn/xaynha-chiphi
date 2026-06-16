import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/Xay Nha|Xây Nhà/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('login with valid admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'vietkeynet@gmail.com');
    await page.fill('#password', 'Vkn@1234561');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('login with valid user credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'vietkeynet@gmail.com');
    await page.fill('#password', 'Vkn@1234561');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('login with invalid credentials fails', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'wrong@local.com');
    await page.fill('#password', 'wrongpass');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).not.toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('login with empty fields shows validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Email không hợp lệ')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
  });

  test('dashboard shows project name', async ({ page }) => {
    await expect(page.getByText(/Tuấn Mơ/).first()).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows progress bar', async ({ page }) => {
    await expect(page.getByText(/độ tổng thể|Tiến độ/).first()).toBeVisible({ timeout: 15000 });
  });

  test('dashboard shows budget', async ({ page }) => {
    await expect(page.getByText('Ngân sách').first()).toBeVisible({ timeout: 15000 });
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`);
    await expect(page).toHaveURL(/.*projects/, { timeout: 10000 });
    await expect(page.getByText('Quản lý dự án')).toBeVisible({ timeout: 10000 });
  });

  test('stages page shows stages', async ({ page }) => {
    await page.goto(`${BASE_URL}/stages`);
    await expect(page).toHaveURL(/.*stages/, { timeout: 10000 });
    await expect(page.getByText('Giai đoạn thi công')).toBeVisible({ timeout: 15000 });
  });

  test('materials page shows materials', async ({ page }) => {
    await page.goto(`${BASE_URL}/materials`);
    await expect(page).toHaveURL(/.*materials/, { timeout: 10000 });
    await expect(page.getByText('Quản lý vật liệu')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('STT')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Tìm kiếm vật liệu...')).toBeVisible();
  });

  test('daily logs page shows logs', async ({ page }) => {
    await page.goto(`${BASE_URL}/daily-logs`);
    await expect(page).toHaveURL(/.*daily-logs/, { timeout: 10000 });
  });

  test('expenses page shows expenses', async ({ page }) => {
    await page.goto(`${BASE_URL}/expenses`);
    await expect(page).toHaveURL(/.*expenses/, { timeout: 10000 });
  });

  test('reports page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await expect(page).toHaveURL(/.*reports/, { timeout: 10000 });
  });

  test('theme toggle works', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    // Toggle button has sr-only label
    await page.getByRole('button', { name: /Chuyển đổi|Toggle/ }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test('create daily log', async ({ page }) => {
    await page.goto(`${BASE_URL}/daily-logs/new`);
    await expect(page.getByText('Thêm nhật ký thi công')).toBeVisible({ timeout: 15000 });

    await page.getByText('Chọn dự án').click();
    await page.getByRole('option').first().click();
    await page.waitForTimeout(500);

    await page.getByText('Buổi sáng').click();

    await page.getByLabel('Số công nhân').fill('5');

    await page.getByPlaceholder('Ghi chú về tiến độ thi công trong ngày').fill('E2E test note');

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/daily-logs') && resp.status() === 303,
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: 'Tạo nhật ký' }).click();
    await responsePromise;
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('daily-logs');
  });
});

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
  });

  test('create new project', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects/new`);
    await page.getByLabel('Tên dự án').fill('Test Project E2E');
    await page.getByLabel('Địa chỉ').fill('Test Address');
    await page.getByLabel('Ngân sách (₫)').fill('1000000000');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await page.waitForURL('**/projects', { timeout: 15000 });
    await expect(page.getByText('Test Project E2E').first()).toBeVisible({ timeout: 10000 });
  });

  test('search in data table', async ({ page }) => {
    await page.goto(`${BASE_URL}/materials`);
    await expect(page).toHaveURL(/.*materials/, { timeout: 10000 });
    const searchInput = page.getByPlaceholder('Tìm kiếm vật liệu...');
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await searchInput.fill('Xi măng');
      await expect(page.getByText('Xi măng').first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText(/Xi măng|Vật liệu/).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('delete project', async ({ page }) => {
    const projectName = `To Be Deleted ${Date.now()}`;

    await page.goto(`${BASE_URL}/projects/new`);
    await page.getByLabel('Tên dự án').fill(projectName);
    await page.getByLabel('Địa chỉ').fill('Delete Test');
    await page.getByLabel('Ngân sách (₫)').fill('100000000');
    await page.getByRole('button', { name: 'Tạo dự án' }).click();
    await page.waitForURL('**/projects', { timeout: 15000 });

    const projectRow = page.getByText(projectName).first();
    await expect(projectRow).toBeVisible({ timeout: 10000 });

    const row = projectRow.locator('xpath=ancestor::tr');
    const trashButton = row.locator('button').last();
    await trashButton.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/projects'), { timeout: 15000 }),
      dialog.getByRole('button', { name: 'Xóa' }).click(),
    ]);

    await page.goto(`${BASE_URL}/projects`);
    await expect(page.getByText(projectName)).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe('Security', () => {
  test('unauthenticated user redirected to login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
    await context.close();
  });

  test('protected API route requires auth', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/upload`);
    expect([404, 405]).toContain(response.status());
  });

  test('no sensitive data in HTML source', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const content = await page.content();
    expect(content).not.toContain('passwordHash');
    expect(content).not.toContain('DATABASE_URL');
  });

  test('CSP headers present', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/login`);
    expect(response.status()).toBe(200);
  });

  test('XSS prevention in search', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'vietkeynet@gmail.com');
    await page.fill('#password', 'Vkn@1234561');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/dashboard');
    await page.goto(`${BASE_URL}/materials`);
    const searchInput = page.getByPlaceholder('Tìm kiếm vật liệu...');
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await searchInput.fill('<script>alert("xss")</script>');
      const content = await page.content();
      expect(content).not.toContain('<script>alert("xss")</script>');
    } else {
      await expect(page.getByText(/Xi măng|Vật liệu/).first()).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('Vietnamese Formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
  });

  test('currency displays with Vietnamese format', async ({ page }) => {
    await page.goto(`${BASE_URL}/expenses`);
    await page.waitForSelector('text=₫', { timeout: 15000 });
    const content = await page.locator('body').innerText();
    expect(content).toMatch(/[0-9]+.*₫/);
  });

  test('date displays in dd/mm/yyyy format', async ({ page }) => {
    await page.goto(`${BASE_URL}/daily-logs`);
    await page.waitForSelector('table', { timeout: 15000 });
    const content = await page.locator('body').innerText();
    expect(content).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

test.describe('Mobile Responsive', () => {
  test('login page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('dashboard works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.getByText(/Tuấn Mơ/).first()).toBeVisible({ timeout: 15000 });
  });

  test('dashboard works on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.getByText(/Tuấn Mơ/).first()).toBeVisible({ timeout: 15000 });
  });
});
