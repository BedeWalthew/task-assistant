import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Header displays app title", async ({ page }) => {
    await expect(page.locator('[data-testid="header-brand"]')).toHaveText(
      "Task Assistant"
    );
  });

  test("Header has Projects link", async ({ page }) => {
    await expect(page.locator('[data-testid="nav-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-projects"]')).toHaveText(
      "Projects"
    );
  });

  test("Header has Tickets link", async ({ page }) => {
    await expect(page.locator('[data-testid="nav-tickets"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tickets"]')).toHaveText(
      "Tickets"
    );
  });

  test("Projects link navigates to /projects", async ({ page }) => {
    await page.locator('[data-testid="nav-projects"]').click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("Tickets link navigates to /tickets", async ({ page }) => {
    await page.locator('[data-testid="nav-tickets"]').click();
    await expect(page).toHaveURL(/\/tickets/);
  });

  test("Brand logo navigates to home", async ({ page }) => {
    // First navigate away
    await page.goto("/projects");
    await page.locator('[data-testid="header-brand"]').click();
    await expect(page).toHaveURL("/");
  });
});
