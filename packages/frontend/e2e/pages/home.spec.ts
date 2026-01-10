import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Displays welcome heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Task Assistant");
  });

  test("Shows welcome description", async ({ page }) => {
    await expect(
      page.getByText("Welcome back. Use the navigation")
    ).toBeVisible();
  });

  test("Shows Projects card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    await expect(
      page.getByText("Create and manage your projects")
    ).toBeVisible();
  });

  test("Shows Tickets card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });

  test("Projects card navigates to /projects", async ({ page }) => {
    await page.getByRole("link", { name: "Go to Projects →" }).click();
    await expect(page).toHaveURL("/projects");
  });
});
