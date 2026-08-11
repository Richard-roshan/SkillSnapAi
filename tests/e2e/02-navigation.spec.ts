import { test, expect } from '@playwright/test';

test.describe('2. Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (exception) => {
      console.error(`Uncaught exception in page: "${exception}"`);
    });

    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to Dashboard', async ({ page }) => {
    await page.locator('aside button:has-text("Dashboard")').click();
    await expect(page.locator('h2:has-text("Welcome back")')).toBeVisible();
  });

  test('should navigate to My Courses', async ({ page }) => {
    await page.locator('aside button:has-text("My Courses")').click();
    await expect(page.locator('h2:has-text("My Enrolled Courses")')).toBeVisible();
  });

  test('should navigate to Course Catalog', async ({ page }) => {
    await page.locator('aside button:has-text("Course Catalog")').click();
    await expect(page.locator('h2:has-text("Course Catalog")')).toBeVisible();
  });

  test('should navigate to AI Course Recs', async ({ page }) => {
    await page.locator('aside button:has-text("AI Course Recs")').click();
    await expect(page.locator('h2:has-text("AI Course Recommendations")')).toBeVisible();
  });

  test('should navigate to AI Learning Roadmap', async ({ page }) => {
    await page.locator('aside button:has-text("AI Learning Roadmap")').click();
    await expect(page.locator('h2:has-text("AI Learning Roadmap")')).toBeVisible();
  });

  test('should navigate to AI Resume Analyzer', async ({ page }) => {
    await page.locator('aside button:has-text("AI Resume Analyzer")').click();
    await expect(page.locator('h2:has-text("AI Resume Analyzer")')).toBeVisible();
  });

  test('should navigate to AI Mock Interview', async ({ page }) => {
    await page.locator('aside button:has-text("AI Mock Interview")').click();
    await expect(page.locator('h2:has-text("AI Technical Mock Interview")')).toBeVisible();
  });

  test('should navigate to Progress Analytics', async ({ page }) => {
    await page.locator('aside button:has-text("Progress Analytics")').click();
    await expect(page.locator('h2:has-text("Progress Analytics & Skills Matrix")')).toBeVisible();
  });

  test('should navigate to Certificates & Profile', async ({ page }) => {
    await page.locator('aside button:has-text("Certificates & Profile")').click();
    await expect(page.locator('h2:has-text("Profile & Verified Credentials")')).toBeVisible();
  });
});
