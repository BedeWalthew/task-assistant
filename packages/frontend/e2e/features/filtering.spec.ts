import { test, expect } from "@playwright/test";

test.describe("Ticket Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test("Search input is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-search"]')).toBeVisible();
  });

  test("Search filters by title", async ({ page }) => {
    await page.locator('[data-testid="filter-search"]').fill("test");

    // URL should update with search param
    await expect(page).toHaveURL(/search=test/);
  });

  test("Status filter is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
  });

  test("Status filter shows only matching tickets", async ({ page }) => {
    await page.locator('[data-testid="filter-status"]').click();
    await page.getByRole("option", { name: "TODO" }).click();

    await expect(page).toHaveURL(/status=TODO/);

    // All visible ticket cards should have TODO status
    const cards = page.locator('[data-testid="ticket-card"]');
    const count = await cards.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(cards.nth(i)).toHaveAttribute("data-ticket-status", "TODO");
      }
    }
  });

  test("Priority filter is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-priority"]')).toBeVisible();
  });

  test("Priority filter shows only matching tickets", async ({ page }) => {
    await page.locator('[data-testid="filter-priority"]').click();
    await page.getByRole("option", { name: "HIGH" }).click();

    await expect(page).toHaveURL(/priority=HIGH/);
  });

  test("Project filter is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-project"]')).toBeVisible();
  });

  test("Sort filter is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-sort"]')).toBeVisible();
  });

  test("Sort by newest first", async ({ page }) => {
    // First select a different sort option to change from default
    await page.locator('[data-testid="filter-sort"]').click();
    await page.getByRole("option", { name: "Oldest" }).click();
    await expect(page).toHaveURL(/sortOrder=asc/);

    // Now select newest
    await page.locator('[data-testid="filter-sort"]').click();
    await page.getByRole("option", { name: "Newest" }).click();

    await expect(page).toHaveURL(/sortBy=createdAt/);
    await expect(page).toHaveURL(/sortOrder=desc/);
  });

  test("Sort by oldest first", async ({ page }) => {
    await page.locator('[data-testid="filter-sort"]').click();
    await page.getByRole("option", { name: "Oldest" }).click();

    await expect(page).toHaveURL(/sortBy=createdAt/);
    await expect(page).toHaveURL(/sortOrder=asc/);
  });

  test("Sort by priority high to low", async ({ page }) => {
    await page.locator('[data-testid="filter-sort"]').click();
    await page.getByRole("option", { name: "Priority (High → Low)" }).click();

    await expect(page).toHaveURL(/sortBy=priority/);
    await expect(page).toHaveURL(/sortOrder=desc/);
  });

  test("Clear filters resets all", async ({ page }) => {
    // Apply some filters first
    await page.locator('[data-testid="filter-search"]').fill("test");
    await page.locator('[data-testid="filter-status"]').click();
    await page.getByRole("option", { name: "TODO" }).click();

    await expect(page).toHaveURL(/search=test/);
    await expect(page).toHaveURL(/status=TODO/);

    // Clear filters
    await page.locator('[data-testid="clear-filters"]').click();

    // URL should be clean
    await expect(page).not.toHaveURL(/search=/);
    await expect(page).not.toHaveURL(/status=/);
  });

  test("Filters persist after page reload", async ({ page }) => {
    await page.locator('[data-testid="filter-status"]').click();
    await page.getByRole("option", { name: "IN PROGRESS" }).click();

    await expect(page).toHaveURL(/status=IN_PROGRESS/);

    await page.reload();

    await expect(page).toHaveURL(/status=IN_PROGRESS/);
  });
});
