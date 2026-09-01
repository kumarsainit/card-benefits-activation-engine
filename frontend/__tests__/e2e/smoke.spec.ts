import { test, expect } from '@playwright/test';

test.describe('Frontend Foundation Smoke Test', () => {
  test('renders foundation showcase page with design system primitives and pillars', async ({ page }) => {
    await page.goto('/');

    // Check page title and header
    await expect(page.locator('h1')).toContainText('Card Benefit Activation Engine');
    await expect(page.getByText('Design System & Architecture Foundation')).toBeVisible();

    // Check three core benefit pillars
    await expect(page.getByText('Purchase Protection')).toBeVisible();
    await expect(page.getByText('Return Protection')).toBeVisible();
    await expect(page.getByText('Travel Delay Insurance')).toBeVisible();

    // Check design system tabs
    await expect(page.getByRole('tab', { name: 'Buttons & Badges' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Form Inputs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Progress & Spinners' })).toBeVisible();
  });
});
