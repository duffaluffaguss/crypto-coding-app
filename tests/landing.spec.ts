import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section with correct content', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.getByRole('heading', { name: /Build Your First Web3 Project/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /In Under 2 Months/i })).toBeVisible();

    // Check tagline
    await expect(page.getByText(/Forget boring tutorials/i)).toBeVisible();

    // Check brand name
    await expect(page.getByText('Zero to Crypto Dev').first()).toBeVisible();
  });

  test('has working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check login link
    const loginLink = page.getByRole('link', { name: /Log in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');

    // Check signup/get started buttons
    const getStartedLinks = page.getByRole('link', { name: /Get Started|Start Your Journey/i });
    await expect(getStartedLinks.first()).toBeVisible();
  });

  test('displays feature cards', async ({ page }) => {
    await page.goto('/');

    // Check the three feature cards
    await expect(page.getByText(/Build First, Learn Second/i)).toBeVisible();
    await expect(page.getByText(/AI-Powered Mentor/i)).toBeVisible();
    await expect(page.getByText(/Real Monetization/i)).toBeVisible();
  });

  test('displays how it works section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /How It Works/i })).toBeVisible();
    await expect(page.getByText(/Tell Us Your Interests/i)).toBeVisible();
    await expect(page.getByText(/Fill in the Blanks/i)).toBeVisible();
    await expect(page.getByText(/Deploy & Share/i)).toBeVisible();
  });

  test('navigates to signup when clicking Get Started', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Get Started/i }).first().click();
    await expect(page).toHaveURL('/signup');
  });

  test('navigates to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Log in/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
