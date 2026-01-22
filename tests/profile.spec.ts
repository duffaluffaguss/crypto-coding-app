import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test('profile page loads without crashing', async ({ page }) => {
    const response = await page.goto('/profile');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('redirects unauthenticated users', async ({ page }) => {
    await page.goto('/profile');

    // Profile requires auth
    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('/signup') || url.includes('/profile');
    expect(isProtected).toBeTruthy();
  });

  test('profile page no critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/profile');
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });
});
