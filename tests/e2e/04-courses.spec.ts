import { test, expect } from '@playwright/test';

test.describe('4. My Courses & Course Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('should render My Courses page with course grid or empty state', async ({ page }) => {
    await page.locator('aside button:has-text("My Courses")').click();
    await expect(page.locator('h2:has-text("My Enrolled Courses")')).toBeVisible();
    
    // Verify content region is loaded
    const pageContent = page.locator('main');
    await expect(pageContent).toBeVisible();
  });

  test('should render Course Catalog page with available courses', async ({ page }) => {
    await page.locator('aside button:has-text("Course Catalog")').click();
    await expect(page.locator('h2:has-text("Course Catalog")')).toBeVisible();
    
    // Verify catalog courses are visible
    await expect(page.locator('text=Full-Stack Modern React & TypeScript').first()).toBeVisible();
    await expect(page.locator('text=Generative AI & LLM Application Engineering').first()).toBeVisible();
  });

  test('should filter catalog courses by search query', async ({ page }) => {
    await page.locator('aside button:has-text("Course Catalog")').click();
    await expect(page.locator('h2:has-text("Course Catalog")')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('DevOps');

    await expect(page.locator('text=Cloud-Native DevOps').first()).toBeVisible();
  });
});
