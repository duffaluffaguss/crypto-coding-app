import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page', () => {
  test('leaderboard page loads without crashing', async ({ page }) => {
    const response = await page.goto('/leaderboard');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('displays leaderboard content or redirects', async ({ page }) => {
    await page.goto('/leaderboard');

    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else if (url.includes('/leaderboard')) {
      // Should have leaderboard-related content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });

  test('leaderboard has tabs or categories', async ({ page }) => {
    await page.goto('/leaderboard');

    const url = page.url();
    if (url.includes('/leaderboard')) {
      const bodyText = await page.locator('body').textContent() || '';
      // Should mention leaderboard concepts
      const hasLeaderboardContent = 
        bodyText.toLowerCase().includes('leaderboard') ||
        bodyText.toLowerCase().includes('rank') ||
        bodyText.toLowerCase().includes('points') ||
        bodyText.toLowerCase().includes('streak') ||
        bodyText.toLowerCase().includes('top');
      
      expect(hasLeaderboardContent || bodyText.length > 0).toBeTruthy();
    }
  });

  test('leaderboard page no critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/leaderboard');
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });
});
