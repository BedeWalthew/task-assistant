import { test, expect } from "@playwright/test";

test.describe("Tickets Page - List View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test("Displays page title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Tickets");
  });

  test("Displays page description", async ({ page }) => {
    await expect(
      page.getByText("Create and browse tickets across projects")
    ).toBeVisible();
  });

  test("Shows filter bar", async ({ page }) => {
    await expect(page.locator('[data-testid="filter-bar"]')).toBeVisible();
  });

  test("Shows create ticket button", async ({ page }) => {
    await expect(
      page.locator('[data-testid="create-ticket-btn"]')
    ).toBeVisible();
  });

  test("Shows ticket list in list view", async ({ page }) => {
    // Default view is list
    await expect(page.locator('[data-testid="ticket-list"]')).toBeVisible();
  });

  test("Ticket cards show title and priority", async ({ page }) => {
    const firstCard = page.locator('[data-testid="ticket-card"]').first();

    // Wait for tickets to load
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    await expect(
      firstCard.locator('[data-testid="ticket-card-title"]')
    ).toBeVisible();
  });

  test("Pagination shows correct info", async ({ page }) => {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      /Page \d+ of \d+/
    );
  });

  test("View toggle switches to board view", async ({ page }) => {
    await page.locator('[data-testid="view-toggle-board"]').click();

    await expect(page).toHaveURL(/view=board/);
    await expect(page.locator('[data-testid="ticket-board"]')).toBeVisible();
  });
});

test.describe("Tickets Page - Board View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets?view=board");
  });

  test("Shows kanban board", async ({ page }) => {
    await expect(page.locator('[data-testid="ticket-board"]')).toBeVisible();
  });

  test("Displays all 4 status columns", async ({ page }) => {
    await expect(page.locator('[data-testid="column-TODO"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="column-IN_PROGRESS"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="column-DONE"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-BLOCKED"]')).toBeVisible();
  });

  test("Columns show ticket counts", async ({ page }) => {
    await expect(
      page.locator('[data-testid="column-count-TODO"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="column-count-IN_PROGRESS"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="column-count-DONE"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="column-count-BLOCKED"]')
    ).toBeVisible();
  });

  test("Column titles are correct", async ({ page }) => {
    await expect(
      page.locator('[data-testid="column-title-TODO"]')
    ).toHaveText("Todo");
    await expect(
      page.locator('[data-testid="column-title-IN_PROGRESS"]')
    ).toHaveText("In Progress");
    await expect(
      page.locator('[data-testid="column-title-DONE"]')
    ).toHaveText("Done");
    await expect(
      page.locator('[data-testid="column-title-BLOCKED"]')
    ).toHaveText("Blocked");
  });

  test("View toggle switches to list view", async ({ page }) => {
    await page.locator('[data-testid="view-toggle-list"]').click();

    await expect(page).toHaveURL(/view=list/);
    await expect(page.locator('[data-testid="ticket-list"]')).toBeVisible();
  });
});
