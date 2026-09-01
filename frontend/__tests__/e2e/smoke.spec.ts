import { test, expect } from '@playwright/test';

test.describe('Public & Auth Navigation Smoke Test', () => {
  test('renders landing page with headline, CTAs, and protection pillars', async ({ page }) => {
    await page.goto('/');

    // Hero title check
    await expect(page.locator('h1')).toContainText('Your card may already');
    await expect(page.getByText('protect more than you think.')).toBeVisible();

    // CTAs check
    await expect(page.getByRole('button', { name: 'See How It Works' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In to Engine' })).toBeVisible();

    // 3 Built-in Protections check
    await expect(page.getByRole('heading', { name: 'Purchase Protection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Return Protection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Travel Delay Insurance' })).toBeVisible();
  });

  test('navigates to Login page and displays credentials form with demo helpers', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByText('Quick Demo Accounts')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cardholder' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Operations Admin' })).toBeVisible();
  });

  test('navigates to Register page and displays legal name and password indicators', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('Alex Carter')).toBeVisible();
    await expect(page.getByText('At least 8 characters')).toBeVisible();
  });
});

test.describe('Protected Customer Routes Smoke Test', () => {
  test('unauthenticated visitor to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated visitor to /claims redirects to /login', async ({ page }) => {
    await page.goto('/claims');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated visitor to /notifications redirects to /login', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated visitor to /demo redirects to /login', async ({ page }) => {
    await page.goto('/demo');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Protected Admin Routes Smoke Test', () => {
  test('unauthenticated visitor to /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated visitor to /admin/claims redirects to /login', async ({ page }) => {
    await page.goto('/admin/claims');
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated visitor to /admin/analytics redirects to /login', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/.*login/);
  });
});
