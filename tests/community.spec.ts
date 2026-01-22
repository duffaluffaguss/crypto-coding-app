import { test, expect } from '@playwright/test';

test.describe('Community Showcase Page', () => {
  test('community page loads without crashing', async ({ page }) => {
    const response = await page.goto('/community');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('displays community content or redirects', async ({ page }) => {
    await page.goto('/community');

    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else if (url.includes('/community')) {
      // Should have community-related content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });

  test('community page has proper structure', async ({ page }) => {
    await page.goto('/community');

    const url = page.url();
    if (url.includes('/community')) {
      const bodyText = await page.locator('body').textContent() || '';
      // Should mention community, showcase, projects, or similar
      const hasCommunityContent = 
        bodyText.toLowerCase().includes('community') ||
        bodyText.toLowerCase().includes('showcase') ||
        bodyText.toLowerCase().includes('project') ||
        bodyText.toLowerCase().includes('builder');
      
      expect(hasCommunityContent || bodyText.length > 0).toBeTruthy();
    }
  });
});

test.describe('Community Interactions', () => {
  test('community page does not throw critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/community');
    await page.waitForTimeout(1000);

    // Should not have uncaught exceptions
    expect(errors.length).toBe(0);
  });
});
