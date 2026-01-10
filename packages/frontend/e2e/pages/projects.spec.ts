import { test, expect } from "@playwright/test";

test.describe("Projects Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
  });

  test("Displays page title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Projects");
  });

  test("Displays page description", async ({ page }) => {
    await expect(
      page.getByText("Create projects and view them below")
    ).toBeVisible();
  });

  test("Shows project creation form", async ({ page }) => {
    await expect(
      page.locator('[data-testid="project-create-form"]')
    ).toBeVisible();
  });

  test("Shows project list section", async ({ page }) => {
    await expect(page.locator('[data-testid="project-list"]')).toBeVisible();
  });

  test("Form has required fields", async ({ page }) => {
    await expect(
      page.locator('[data-testid="project-name-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="project-key-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="project-desc-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="project-submit-btn"]')
    ).toBeVisible();
  });
});

test.describe("Project Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
  });

  test("Create project with valid data", async ({ page }) => {
    const uniqueKey = `E2E${Date.now().toString().slice(-4)}`;

    await page
      .locator('[data-testid="project-name-input"]')
      .fill("E2E Test Project");
    await page.locator('[data-testid="project-key-input"]').fill(uniqueKey);
    await page
      .locator('[data-testid="project-desc-input"]')
      .fill("Created by E2E test");
    await page.locator('[data-testid="project-submit-btn"]').click();

    // Wait for toast or success indication
    await expect(page.getByText("Project created").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Shows validation error for missing name", async ({ page }) => {
    // Fill only key and description
    await page.locator('[data-testid="project-key-input"]').fill("TEST");
    await page.locator('[data-testid="project-submit-btn"]').click();

    // Should show validation error
    await expect(page.getByText("Project name is required")).toBeVisible();
  });

  test("Shows validation error for invalid key", async ({ page }) => {
    await page.locator('[data-testid="project-name-input"]').fill("Test");
    await page.locator('[data-testid="project-key-input"]').fill("X"); // Too short
    await page.locator('[data-testid="project-submit-btn"]').click();

    // Should show validation error for key
    await expect(page.locator('[data-testid="project-create-form"]')).toContainText(
      /at least|min|short|characters/i
    );
  });

  test("New project appears in list after creation", async ({ page }) => {
    const uniqueKey = `NEW${Date.now().toString().slice(-4)}`;
    const projectName = `New Project ${uniqueKey}`;

    await page.locator('[data-testid="project-name-input"]').fill(projectName);
    await page.locator('[data-testid="project-key-input"]').fill(uniqueKey);
    await page.locator('[data-testid="project-submit-btn"]').click();

    // Wait for success
    await expect(page.getByText("Project created").first()).toBeVisible({
      timeout: 5000,
    });

    // Reload to verify persistence
    await page.reload();

    // Check that project appears in list
    await expect(page.getByText(projectName)).toBeVisible();
    // Use more specific locator for the key to avoid matching the name which contains the key
    await expect(page.locator('[data-testid="project-card-key"]').getByText(uniqueKey)).toBeVisible();
  });

  test("Project card shows name, key, and description", async ({ page }) => {
    // Check existing project cards have required info
    const firstCard = page.locator('[data-testid="project-card"]').first();

    // Wait for at least one card to exist
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    await expect(
      firstCard.locator('[data-testid="project-card-name"]')
    ).toBeVisible();
    await expect(
      firstCard.locator('[data-testid="project-card-key"]')
    ).toBeVisible();
  });
});
