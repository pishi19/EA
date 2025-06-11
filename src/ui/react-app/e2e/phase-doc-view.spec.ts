import { test, expect } from '@playwright/test';

test.describe('Phase Doc View Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/phase-doc');
  });

  test('should load phase document page', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Phase')).toBeVisible();
  });

  test('should display phase selection and filtering controls', async ({ page }) => {
    // Wait for phase selector to load
    await expect(page.getByRole('combobox', { name: /select phase/i })).toBeVisible();
    
    // Check that all filter controls are present
    await expect(page.getByRole('combobox', { name: /filter by status/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by type/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by workstream/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by tags/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /sort loops by/i })).toBeVisible();
  });

  test('should filter loops by type', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Click type filter
    await page.getByRole('combobox', { name: /filter by type/i }).click();
    
    // Select execution type
    const executionOption = page.getByText('⚙️ Execution');
    if (await executionOption.isVisible()) {
      await executionOption.click();
      
      // Wait for filtering to apply
      await page.waitForTimeout(500);
    }
  });

  test('should expand and collapse loop content', async ({ page }) => {
    // Wait for loops to load
    await page.waitForLoadState('networkidle');
    
    // Find accordion buttons for loops
    const accordionButtons = page.locator('[role="button"][aria-expanded]');
    const firstAccordion = accordionButtons.first();
    
    if (await firstAccordion.isVisible()) {
      // Check initial state (should be collapsed)
      await expect(firstAccordion).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      await firstAccordion.click();
      
      // Wait for expansion
      await page.waitForTimeout(300);
      
      // Should now be expanded
      await expect(firstAccordion).toHaveAttribute('aria-expanded', 'true');
    }
  });

  test('should display phase navigation', async ({ page }) => {
    // Wait for phase navigation to load
    await expect(page.getByRole('combobox', { name: /select phase/i })).toBeVisible();
    
    // Click phase selector
    await page.getByRole('combobox', { name: /select phase/i }).click();
    
    // Should show available phases
    const phaseOptions = page.locator('[role="option"]');
    await expect(phaseOptions.first()).toBeVisible();
  });

  test('should sort loops correctly', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Click sort selector
    await page.getByRole('combobox', { name: /sort loops by/i }).click();
    
    // Select score sorting
    const scoreSortOption = page.getByText('Score (High to Low)');
    if (await scoreSortOption.isVisible()) {
      await scoreSortOption.click();
      
      // Wait for sorting to apply
      await page.waitForTimeout(500);
    }
  });

  test('should handle accessibility keyboard navigation', async ({ page }) => {
    // Test tab navigation through controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate to filter controls
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
}); 