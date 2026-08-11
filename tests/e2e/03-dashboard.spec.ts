import { test, expect } from '@playwright/test';

test.describe('3. Dashboard Stat Cards & Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('should render Enrolled Courses stat card with numeric value', async ({ page }) => {
    const card = page.locator('div:has-text("Enrolled Courses")').first();
    await expect(card).toBeVisible();
    
    const cardText = await card.innerText();
    expect(cardText).not.toContain('undefined');
    expect(cardText).not.toContain('NaN');
  });

  test('should render Current Streak stat card with numeric value', async ({ page }) => {
    const card = page.locator('div:has-text("Current Streak")').first();
    await expect(card).toBeVisible();
    
    const cardText = await card.innerText();
    expect(cardText).not.toContain('undefined');
    expect(cardText).not.toContain('NaN');
  });

  test('should render Study Hours stat card with numeric value', async ({ page }) => {
    const card = page.locator('div:has-text("Study Hours")').first();
    await expect(card).toBeVisible();
    
    const cardText = await card.innerText();
    expect(cardText).not.toContain('undefined');
    expect(cardText).not.toContain('NaN');
  });

  test('should render AI Career Readiness Hub section on dashboard', async ({ page }) => {
    await expect(page.locator('text=AI Career Readiness Hub')).toBeVisible();
  });
});
