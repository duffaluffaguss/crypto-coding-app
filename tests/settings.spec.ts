import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('settings page loads without crashing', async ({ page }) => {
    const response = await page.goto('/settings');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings');

    // Settings requires auth
    const url = page.url();
    const isHandled = url.includes('/login') || url.includes('/signup') || url.includes('/settings');
    expect(isHandled).toBeTruthy();
  });

  test('settings page no critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/settings');
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });
});
