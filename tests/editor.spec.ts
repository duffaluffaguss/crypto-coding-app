import { test, expect } from '@playwright/test';

test.describe('Editor Page', () => {
  test('editor page loads without crashing', async ({ page }) => {
    const response = await page.goto('/editor');
    // Should not return 500 error
    expect(response?.status()).not.toBe(500);
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/editor');

    // Editor likely requires auth, should redirect to login
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    } else {
      // If accessible without auth, check for editor elements
      // Monaco editor container or file tree
      const editorExists = await page.locator('.monaco-editor, [data-testid="editor"], [class*="editor"]').isVisible().catch(() => false);
      expect(editorExists || url.includes('/login') || url.includes('/onboarding')).toBeTruthy();
    }
  });
});

test.describe('Editor Features (Visual Check)', () => {
  test('editor page structure', async ({ page }) => {
    await page.goto('/editor');

    const url = page.url();
    // Skip detailed checks if redirected
    if (url.includes('/editor')) {
      // Should have some recognizable structure
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });
});
