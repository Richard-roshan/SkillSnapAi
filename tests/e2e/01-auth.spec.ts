import { test, expect } from '@playwright/test';

test.describe('1. Authentication Flow', () => {
  test('should display Auth page when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=SkillSnap')).toBeVisible();
    await expect(page.locator('input[name="user_email_address"]')).toBeVisible();
    await expect(page.locator('input[name="user_password_secret"]')).toBeVisible();
  });

  test('should sign in successfully using demo credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('aside')).toBeVisible();
  });

  test('should display dashboard header and stats after login', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible({ timeout: 15000 });
  });

  test('should sign out successfully and return to Auth page', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
    
    // Click avatar button to open profile menu
    await page.locator('header button img').click();
    // Click Sign Out button
    await page.click('button:has-text("Sign Out")');

    await expect(page.locator('input[name="user_email_address"]')).toBeVisible({ timeout: 15000 });
  });
});
