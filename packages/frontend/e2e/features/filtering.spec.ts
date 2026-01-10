import { test, expect } from "@playwright/test";

test.describe("Ticket Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test.describe("Filter Controls", () => {
    test("Search input is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="filter-search"]')).toBeVisible();
    });

    test("Status filter is visible in list view", async ({ page }) => {
      await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
    });

    test("Status filter is hidden in board view", async ({ page }) => {
      await page.locator('[data-testid="view-toggle-board"]').click();
      await expect(page.locator('[data-testid="filter-status"]')).not.toBeVisible();
    });

    test("Priority filter is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="filter-priority"]')).toBeVisible();
    });

    test("Project filter is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="filter-project"]')).toBeVisible();
    });

    test("Sort filter is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="filter-sort"]')).toBeVisible();
    });
  });

  test.describe("Search Filter", () => {
    test("Search updates URL", async ({ page }) => {
      await page.locator('[data-testid="filter-search"]').fill("test");
      await expect(page).toHaveURL(/search=test/);
    });

    test("Search filters tickets by title", async ({ page }) => {
      // Get initial count
      const initialCards = page.locator('[data-testid="ticket-card"]');
      const initialCount = await initialCards.count();

      // Search for something specific
      await page.locator('[data-testid="filter-search"]').fill("First");
      await page.waitForURL(/search=First/);

      // Should have fewer or equal results
      const filteredCards = page.locator('[data-testid="ticket-card"]');
      const filteredCount = await filteredCards.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });

  test.describe("Status Filter", () => {
    test("Status filter updates URL", async ({ page }) => {
      await page.locator('[data-testid="filter-status"]').click();
      await page.getByRole("option", { name: "TODO" }).click();
      await expect(page).toHaveURL(/status=TODO/);
    });

    test("Status filter shows only matching tickets", async ({ page }) => {
      await page.locator('[data-testid="filter-status"]').click();
      await page.getByRole("option", { name: "TODO" }).click();
      await page.waitForURL(/status=TODO/);

      const cards = page.locator('[data-testid="ticket-card"]');
      const count = await cards.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(cards.nth(i)).toHaveAttribute("data-ticket-status", "TODO");
        }
      }
    });
  });

  test.describe("Priority Filter", () => {
    test("Priority filter updates URL", async ({ page }) => {
      await page.locator('[data-testid="filter-priority"]').click();
      await page.getByRole("option", { name: "HIGH" }).click();
      await expect(page).toHaveURL(/priority=HIGH/);
    });

    test("Priority filter shows only matching tickets", async ({ page }) => {
      await page.locator('[data-testid="filter-priority"]').click();
      await page.getByRole("option", { name: "CRITICAL" }).click();
      await page.waitForURL(/priority=CRITICAL/);

      const cards = page.locator('[data-testid="ticket-card"]');
      const count = await cards.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          await expect(cards.nth(i)).toHaveAttribute("data-ticket-priority", "CRITICAL");
        }
      }
    });
  });

  test.describe("Sort Options", () => {
    test("Sort by newest first", async ({ page }) => {
      await page.locator('[data-testid="filter-sort"]').click();
      await page.getByRole("option", { name: "Oldest" }).click();
      await expect(page).toHaveURL(/sortOrder=asc/);

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
  });

  test.describe("Combined Filters", () => {
    test("Multiple filters can be applied together", async ({ page }) => {
      await page.locator('[data-testid="filter-status"]').click();
      await page.getByRole("option", { name: "TODO" }).click();
      await expect(page).toHaveURL(/status=TODO/);

      await page.locator('[data-testid="filter-priority"]').click();
      await page.getByRole("option", { name: "HIGH" }).click();
      await expect(page).toHaveURL(/priority=HIGH/);

      // Both filters should be in URL
      await expect(page).toHaveURL(/status=TODO/);
      await expect(page).toHaveURL(/priority=HIGH/);
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
});

test.describe("Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test("Pagination controls are visible", async ({ page }) => {
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
  });

  test("Pagination shows page info", async ({ page }) => {
    const info = page.locator('[data-testid="pagination-info"]');
    await expect(info).toBeVisible();
    await expect(info).toContainText(/Page \d+ of \d+/);
    await expect(info).toContainText(/\d+ tickets/);
  });

  test("Previous and Next buttons exist", async ({ page }) => {
    await expect(page.locator('[data-testid="pagination-prev"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-next"]')).toBeVisible();
  });

  test("Next button navigates to next page", async ({ page }) => {
    // First check if there are multiple pages
    const info = page.locator('[data-testid="pagination-info"]');
    const text = await info.textContent();
    const match = text?.match(/Page (\d+) of (\d+)/);

    if (match && parseInt(match[2]) > 1) {
      await page.locator('[data-testid="pagination-next"]').click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test("Filters reset pagination to page 1", async ({ page }) => {
    // Navigate to page 2 if possible
    const info = page.locator('[data-testid="pagination-info"]');
    const text = await info.textContent();
    const match = text?.match(/Page (\d+) of (\d+)/);

    if (match && parseInt(match[2]) > 1) {
      await page.locator('[data-testid="pagination-next"]').click();
      await expect(page).toHaveURL(/page=2/);

      // Apply a filter - should reset to page 1
      await page.locator('[data-testid="filter-status"]').click();
      await page.getByRole("option", { name: "TODO" }).click();

      await expect(page).not.toHaveURL(/page=2/);
    }
  });
});

test.describe("Board View Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets?view=board");
  });

  test("Priority filter works in board view", async ({ page }) => {
    await page.locator('[data-testid="filter-priority"]').click();
    await page.getByRole("option", { name: "HIGH" }).click();
    await expect(page).toHaveURL(/priority=HIGH/);
  });

  test("Project filter works in board view", async ({ page }) => {
    await page.locator('[data-testid="filter-project"]').click();
    
    // Get the first project option (not "Any project")
    const projectOption = page.getByRole("option").filter({ hasNotText: "Any project" }).first();
    const hasProjects = await projectOption.isVisible().catch(() => false);
    
    if (hasProjects) {
      await projectOption.click();
      await expect(page).toHaveURL(/projectId=/);
    }
  });

  test("Search works in board view", async ({ page }) => {
    await page.locator('[data-testid="filter-search"]').fill("test");
    await expect(page).toHaveURL(/search=test/);
  });
});
