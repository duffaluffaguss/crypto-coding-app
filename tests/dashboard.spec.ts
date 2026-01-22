import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('dashboard page loads without crashing', async ({ page }) => {
    const response = await page.goto('/dashboard');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Dashboard requires auth, should redirect to login
    await expect(page).toHaveURL(/\/(login|signup|onboarding)/);
  });

  test('dashboard page no critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });
});

test.describe('Dashboard Structure', () => {
  test('dashboard or login page has proper content', async ({ page }) => {
    await page.goto('/dashboard');

    // Either on dashboard or redirected to login
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});
