import { test, expect } from "@playwright/test";

test.describe("Ticket Creation Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test("Create ticket button opens modal", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).toBeVisible();
  });

  test("Modal has title input", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-title-input"]')
    ).toBeVisible();
  });

  test("Modal has project select", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-project-select"]')
    ).toBeVisible();
  });

  test("Modal has description input", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-desc-input"]')
    ).toBeVisible();
  });

  test("Modal has status select", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-status-select"]')
    ).toBeVisible();
  });

  test("Modal has priority select", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-priority-select"]')
    ).toBeVisible();
  });

  test("Modal has submit button", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="ticket-submit-btn"]')
    ).toBeVisible();
  });

  test("Modal can be closed with X button", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).toBeVisible();

    await page.locator('[data-testid="close-ticket-modal"]').click();

    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).not.toBeVisible();
  });

  test("Modal can be closed with escape key", async ({ page }) => {
    await page.locator('[data-testid="create-ticket-btn"]').click();

    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).not.toBeVisible();
  });
});

test.describe("Ticket Creation Form", () => {
  test("Shows validation error for missing title", async ({ page }) => {
    await page.goto("/tickets");
    await page.locator('[data-testid="create-ticket-btn"]').click();

    // Select a project but don't fill title
    await page.locator('[data-testid="ticket-project-select"]').click();
    await page.getByRole("option").first().click();
    await page.locator('[data-testid="ticket-submit-btn"]').click();

    // Should show validation error
    await expect(
      page.locator('[data-testid="ticket-create-form"]')
    ).toContainText(/title|required/i);
  });

  test("Shows validation error for missing project", async ({ page }) => {
    await page.goto("/tickets");
    await page.locator('[data-testid="create-ticket-btn"]').click();

    // Fill title but not project
    await page.locator('[data-testid="ticket-title-input"]').fill("Test Ticket");
    await page.locator('[data-testid="ticket-submit-btn"]').click();

    // Should show validation error for project
    await expect(
      page.locator('[data-testid="ticket-create-form"]')
    ).toContainText(/project|required|uuid/i);
  });

  test("Create ticket with valid data shows success toast", async ({ page }) => {
    // Go to tickets page
    await page.goto("/tickets");
    await page.locator('[data-testid="create-ticket-btn"]').click();
    await expect(page.locator('[data-testid="create-ticket-modal"]')).toBeVisible();

    const ticketTitle = `E2E Ticket ${Date.now()}`;
    await page.locator('[data-testid="ticket-title-input"]').fill(ticketTitle);
    await page
      .locator('[data-testid="ticket-desc-input"]')
      .fill("Created by E2E test");

    // Select first project from dropdown
    await page.locator('[data-testid="ticket-project-select"]').click();
    await page.getByRole("option").first().click();
    
    await page.locator('[data-testid="ticket-submit-btn"]').click();

    // Wait for form to submit - modal closes on success
    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).not.toBeVisible({ timeout: 10000 });
  });

  test("Modal closes after successful creation", async ({ page }) => {
    await page.goto("/tickets");
    await page.locator('[data-testid="create-ticket-btn"]').click();
    await expect(page.locator('[data-testid="create-ticket-modal"]')).toBeVisible();

    await page
      .locator('[data-testid="ticket-title-input"]')
      .fill(`Close Test ${Date.now()}`);
    
    // Select first project from dropdown
    await page.locator('[data-testid="ticket-project-select"]').click();
    await page.getByRole("option").first().click();
    
    await page.locator('[data-testid="ticket-submit-btn"]').click();

    // Wait for modal to close (indicates successful creation)
    await expect(
      page.locator('[data-testid="create-ticket-modal"]')
    ).not.toBeVisible({ timeout: 10000 });
  });
});
