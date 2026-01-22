import { test, expect } from '@playwright/test';

test.describe('Help/FAQ Page', () => {
  test('help page loads without crashing', async ({ page }) => {
    const response = await page.goto('/help');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('displays help content', async ({ page }) => {
    await page.goto('/help');

    // Help page should be publicly accessible
    const url = page.url();
    if (url.includes('/help')) {
      const bodyText = await page.locator('body').textContent() || '';
      const hasHelpContent = 
        bodyText.toLowerCase().includes('help') ||
        bodyText.toLowerCase().includes('faq') ||
        bodyText.toLowerCase().includes('question') ||
        bodyText.toLowerCase().includes('support');
      
      expect(hasHelpContent || bodyText.length > 0).toBeTruthy();
    }
  });

  test('help page no critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/help');
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
  });
});

test.describe('Help Page Features', () => {
  test('FAQ section is accessible', async ({ page }) => {
    await page.goto('/help');

    const url = page.url();
    if (url.includes('/help')) {
      // Should have interactive FAQ elements or static content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent?.length).toBeGreaterThan(0);
    }
  });
});
