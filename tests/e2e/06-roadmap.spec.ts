import { test, expect } from '@playwright/test';

test.describe('6. AI Learning Roadmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('should load AI Learning Roadmap page and display roadmap steps', async ({ page }) => {
    await page.locator('aside button:has-text("AI Learning Roadmap")').click();
    await expect(page.locator('h2:has-text("AI Learning Roadmap")')).toBeVisible();

    // Verify at least one roadmap step card or milestone is visible
    const stepCard = page.locator('text=/Step 1|React 18|TypeScript|Node.js|Generative AI/i').first();
    await expect(stepCard).toBeVisible();
  });

  test('should display target role badge on roadmap page', async ({ page }) => {
    await page.locator('aside button:has-text("AI Learning Roadmap")').click();
    await expect(page.locator('h2:has-text("AI Learning Roadmap")')).toBeVisible();

    const targetRoleBadge = page.locator('text=/Full-Stack|Engineer|Target Role/i').first();
    await expect(targetRoleBadge).toBeVisible();
  });
});
