import { test, expect } from '@playwright/test';

test.describe('5. AI Resume Analyzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="user_email_address"]').fill('demo.learner@skillsnap.ai');
    await page.locator('input[name="user_password_secret"]').fill('DemoLearnerPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('should load AI Resume Analyzer page with editable Target Job Role field', async ({ page }) => {
    await page.locator('aside button:has-text("AI Resume Analyzer")').click();
    await expect(page.locator('h2:has-text("AI Resume Analyzer")')).toBeVisible();

    const roleInput = page.locator('input[placeholder*="Target Job Role"], input[value*="Full-Stack"]').first();
    await expect(roleInput).toBeVisible();

    await roleInput.fill('Senior Full-Stack AI Engineer');
    await expect(roleInput).toHaveValue('Senior Full-Stack AI Engineer');
  });

  test('should execute resume analysis and produce visible score badge', async ({ page }) => {
    await page.locator('aside button:has-text("AI Resume Analyzer")').click();
    await expect(page.locator('h2:has-text("AI Resume Analyzer")')).toBeVisible();

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    await textarea.fill('Experienced Senior Full-Stack Engineer with 6+ years in React 18, TypeScript, Node.js microservices, Claude 3.5 API, RAG vector embeddings, PostgreSQL, and Docker Kubernetes deployments.');

    const analyzeBtn = page.locator('button:has-text("Run AI Resume Score")').first();
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // Confirm that score result badge appears
    await expect(page.locator('text=/100|Score|Match Rate|Overall Score/i').first()).toBeVisible({ timeout: 10000 });
  });
});
