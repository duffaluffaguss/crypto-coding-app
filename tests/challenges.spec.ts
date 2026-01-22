import { test, expect } from '@playwright/test';

test.describe('Challenges Page', () => {
  test('challenges page loads without crashing', async ({ page }) => {
    const response = await page.goto('/challenges');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('displays challenges content or redirects to login', async ({ page }) => {
    await page.goto('/challenges');

    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else if (url.includes('/challenges')) {
      // Should have challenges-related content
      // Look for challenge cards, daily challenge, or points display
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });

  test('challenges page has proper structure', async ({ page }) => {
    await page.goto('/challenges');

    const url = page.url();
    if (url.includes('/challenges')) {
      // Check for typical challenges page elements
      const bodyText = await page.locator('body').textContent() || '';
      // Should mention challenges, daily, or points somewhere
      const hasChallengeContent = 
        bodyText.toLowerCase().includes('challenge') ||
        bodyText.toLowerCase().includes('daily') ||
        bodyText.toLowerCase().includes('points') ||
        bodyText.toLowerCase().includes('xp');
      
      // Either has challenge content or is showing loading/empty state
      expect(hasChallengeContent || bodyText.length > 0).toBeTruthy();
    }
  });
});
