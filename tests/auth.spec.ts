import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test.describe('Login Page', () => {
    test('displays login form with all elements', async ({ page }) => {
      await page.goto('/login');

      // Check page title
      await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

      // Check form elements
      await expect(page.getByLabel(/Email/i)).toBeVisible();
      await expect(page.getByLabel(/Password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();

      // Check signup link
      await expect(page.getByText(/Don't have an account/i)).toBeVisible();
      await expect(page.getByRole('link', { name: /Sign up/i })).toBeVisible();
    });

    test('has link back to homepage', async ({ page }) => {
      await page.goto('/login');

      const brandLink = page.getByRole('link', { name: /Zero to Crypto Dev/i });
      await expect(brandLink).toBeVisible();
      await expect(brandLink).toHaveAttribute('href', '/');
    });

    test('navigates to signup page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /Sign up/i }).click();
      await expect(page).toHaveURL('/signup');
    });

    test('shows validation for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form - browser validation should prevent it
      const emailInput = page.getByLabel(/Email/i);
      const submitButton = page.getByRole('button', { name: /Sign in/i });

      await submitButton.click();

      // Email should be required (browser validation)
      await expect(emailInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Signup Page', () => {
    test('displays signup form with all elements', async ({ page }) => {
      await page.goto('/signup');

      // Check page title
      await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();

      // Check form elements
      await expect(page.getByLabel(/Display Name/i)).toBeVisible();
      await expect(page.getByLabel(/Email/i)).toBeVisible();
      await expect(page.getByLabel(/Password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Create account/i })).toBeVisible();

      // Check login link
      await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
    });

    test('has link back to homepage', async ({ page }) => {
      await page.goto('/signup');

      const brandLink = page.getByRole('link', { name: /Zero to Crypto Dev/i });
      await expect(brandLink).toBeVisible();
      await expect(brandLink).toHaveAttribute('href', '/');
    });

    test('navigates to login page', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('link', { name: /Sign in/i }).click();
      await expect(page).toHaveURL('/login');
    });

    test('display name is optional, email and password are required', async ({ page }) => {
      await page.goto('/signup');

      const displayNameInput = page.getByLabel(/Display Name/i);
      const emailInput = page.getByLabel(/Email/i);
      const passwordInput = page.getByLabel(/Password/i);

      // Display name should NOT be required
      await expect(displayNameInput).not.toHaveAttribute('required', '');

      // Email and password should be required
      await expect(emailInput).toHaveAttribute('required', '');
      await expect(passwordInput).toHaveAttribute('required', '');
    });
  });
});
