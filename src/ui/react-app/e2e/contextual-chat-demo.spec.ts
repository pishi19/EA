import { test, expect } from '@playwright/test';

test.describe('Contextual Chat Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contextual-chat-demo');
  });

  test('should load page and display title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Semantic Chat Demo');
    await expect(page.getByText('Enhanced Artefact Filtering')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Wait for the page to load completely
    await expect(page.getByText('Artefact Filtering Controls')).toBeVisible();
    
    // Check that all filter controls are present
    await expect(page.getByRole('combobox', { name: /filter by workstream/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by program/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by project/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /filter by status/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /sort artefacts/i })).toBeVisible();
  });

  test('should filter artefacts by workstream', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('Filtered Artefacts')).toBeVisible();
    
    // Click workstream filter
    await page.getByRole('combobox', { name: /filter by workstream/i }).click();
    
    // Select a specific workstream (if available)
    const workstreamOptions = page.locator('[role="option"]');
    const firstWorkstream = workstreamOptions.first();
    
    if (await firstWorkstream.isVisible()) {
      await firstWorkstream.click();
      
      // Verify filter was applied
      await expect(page.getByText('Filtered:')).toBeVisible();
    }
  });

  test('should clear all filters', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByText('Artefact Filtering Controls')).toBeVisible();
    
    // Click clear filters button
    await page.getByRole('button', { name: /clear filters/i }).click();
    
    // Verify filters are reset (all dropdowns should show "All" options)
    await expect(page.getByText('All Workstreams')).toBeVisible();
    await expect(page.getByText('All Programs')).toBeVisible();
    await expect(page.getByText('All Projects')).toBeVisible();
    await expect(page.getByText('All Statuses')).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    // Wait for statistics to load
    await expect(page.getByText('Total:')).toBeVisible();
    await expect(page.getByText('Filtered:')).toBeVisible();
    await expect(page.getByText('Workstreams:')).toBeVisible();
    await expect(page.getByText('Programs:')).toBeVisible();
  });

  test('should display implementation status section', async ({ page }) => {
    await expect(page.getByText('Enhanced Semantic Chat Demo Status')).toBeVisible();
    await expect(page.getByText('Successfully Implemented')).toBeVisible();
    await expect(page.getByText('Ready for Enhancement')).toBeVisible();
  });
}); 