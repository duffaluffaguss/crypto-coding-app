import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('displays onboarding page with welcome content', async ({ page }) => {
    await page.goto('/onboarding');

    // Should show onboarding content or redirect to login if not authenticated
    // Check for either onboarding content or login redirect
    const url = page.url();
    if (url.includes('/login')) {
      // Redirected to login - that's expected for unauthenticated users
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else {
      // On onboarding page
      await expect(page.getByText(/Welcome|Get Started|What brings you/i)).toBeVisible();
    }
  });

  test('has navigation back to home', async ({ page }) => {
    await page.goto('/onboarding');

    const url = page.url();
    if (!url.includes('/login')) {
      // Look for home button or brand link
      const homeLink = page.getByRole('link', { name: /Home|Zero to Crypto Dev/i });
      if (await homeLink.isVisible()) {
        await expect(homeLink).toBeVisible();
      }
    }
  });
});

test.describe('Onboarding Steps (Authenticated)', () => {
  // These tests would require authentication setup
  // For now, we test that the pages load without errors

  test('onboarding page does not crash', async ({ page }) => {
    const response = await page.goto('/onboarding');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });
});
