import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'vietkeynet@gmail.com');
  await page.fill('#password', 'Vkn@1234561');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('**/dashboard');

  await page.context().storageState({ path: authFile });
});
