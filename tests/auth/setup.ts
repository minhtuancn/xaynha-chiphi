import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'admin@local.com');
  await page.fill('#password', 'admin123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('**/dashboard');

  await page.context().storageState({ path: authFile });
});
