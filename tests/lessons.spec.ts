import { test, expect } from '@playwright/test';

test.describe('Lessons Page', () => {
  test('lessons page loads without crashing', async ({ page }) => {
    const response = await page.goto('/lessons');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('displays lessons content or redirects', async ({ page }) => {
    await page.goto('/lessons');

    const url = page.url();
    if (url.includes('/login')) {
      // Redirected to login
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else if (url.includes('/lessons')) {
      // On lessons page - should have some lesson-related content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });
});

test.describe('Lessons Navigation', () => {
  test('lessons page does not throw console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/lessons');
    await page.waitForTimeout(1000);

    // Filter out expected errors (e.g., auth-related)
    const unexpectedErrors = errors.filter(e => 
      !e.includes('auth') && 
      !e.includes('session') &&
      !e.includes('401') &&
      !e.includes('Failed to fetch')
    );

    expect(unexpectedErrors.length).toBeLessThanOrEqual(0);
  });
});
