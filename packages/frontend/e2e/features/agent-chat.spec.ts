import { test, expect } from "@playwright/test";

test.describe("AI Agent Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tickets");
  });

  test.describe("Chat Toggle", () => {
    test("floating chat button is visible", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-toggle-btn"]')).toBeVisible();
    });

    test("clicking chat button opens chat interface", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test("close button closes chat interface", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

      await page.locator('[data-testid="chat-close-btn"]').click();
      await expect(
        page.locator('[data-testid="chat-interface"]')
      ).not.toBeVisible();
    });

    test("clicking toggle button again closes chat interface", async ({
      page,
    }) => {
      const toggleBtn = page.locator('[data-testid="chat-toggle-btn"]');

      await toggleBtn.click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

      await toggleBtn.click();
      await expect(
        page.locator('[data-testid="chat-interface"]')
      ).not.toBeVisible();
    });
  });

  test.describe("Chat UI Elements", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
    });

    test("chat interface has input field", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    });

    test("chat interface has send button", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeVisible();
    });

    test("chat interface has clear button", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-clear-btn"]')).toBeVisible();
    });

    test("send button is disabled when input is empty", async ({ page }) => {
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeDisabled();
    });

    test("send button is enabled when input has text", async ({ page }) => {
      await page.locator('[data-testid="chat-input"]').fill("Hello");
      await expect(page.locator('[data-testid="chat-send-btn"]')).toBeEnabled();
    });

    test("welcome message is shown initially", async ({ page }) => {
      await expect(
        page.getByText("Welcome to Task Assistant AI")
      ).toBeVisible();
    });
  });

  test.describe("Chat Messaging", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
    });

    test("user can send a message", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Hello, AI assistant");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // User message should appear
      await expect(
        page.locator('[data-testid="chat-message-user"]')
      ).toBeVisible();
      await expect(page.getByText("Hello, AI assistant")).toBeVisible();
    });

    test("input clears after sending", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Test message");
      await page.locator('[data-testid="chat-send-btn"]').click();

      await expect(input).toHaveValue("");
    });

    test("can send message with Enter key", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Enter key test");
      await input.press("Enter");

      await expect(page.getByText("Enter key test")).toBeVisible();
    });

    test("Shift+Enter adds newline instead of sending", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Line 1");
      await input.press("Shift+Enter");
      await input.type("Line 2");

      await expect(input).toHaveValue("Line 1\nLine 2");
      // Message should NOT have been sent
      await expect(
        page.locator('[data-testid="chat-message-user"]')
      ).not.toBeVisible();
    });

    test("clear button resets conversation", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Message to clear");
      await page.locator('[data-testid="chat-send-btn"]').click();

      await expect(
        page.locator('[data-testid="chat-message-user"]')
      ).toBeVisible();

      await page.locator('[data-testid="chat-clear-btn"]').click();

      await expect(
        page.locator('[data-testid="chat-message-user"]')
      ).not.toBeVisible();
      await expect(
        page.getByText("Welcome to Task Assistant AI")
      ).toBeVisible();
    });

    test("clear button is disabled when no messages", async ({ page }) => {
      await expect(
        page.locator('[data-testid="chat-clear-btn"]')
      ).toBeDisabled();
    });

    test("assistant message placeholder appears after sending", async ({
      page,
    }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("Test message");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Both user and assistant message containers should appear
      await expect(
        page.locator('[data-testid="chat-message-user"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="chat-message-assistant"]')
      ).toBeVisible();
    });
  });

  test.describe("Agent Integration (requires agent service)", () => {
    test.beforeEach(async ({ page }) => {
      // Check if agent is available
      const response = await page.request
        .get("/api/agent/health")
        .catch(() => null);
      test.skip(
        !response?.ok(),
        "Agent service not available - skipping integration tests"
      );

      await page.locator('[data-testid="chat-toggle-btn"]').click();
    });

    test("agent health endpoint returns status", async ({ page }) => {
      const response = await page.request.get("/api/agent/health");
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("agent_ready");
    });

    test("assistant responds to user message", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("What can you do?");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Wait for assistant response (with longer timeout for SSE)
      await expect(
        page.locator('[data-testid="chat-message-assistant"]')
      ).toBeVisible();

      // Wait for response content to appear (not just placeholder)
      await expect(async () => {
        const content = await page
          .locator('[data-testid="chat-message-assistant"] p')
          .textContent();
        expect(content).not.toBe("...");
        expect(content?.length).toBeGreaterThan(10);
      }).toPass({ timeout: 30000 });
    });

    test("tool calls are displayed during execution", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("List all projects");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Tool call should appear during execution
      await expect(page.locator('[data-testid="tool-call"]')).toBeVisible({
        timeout: 30000,
      });
    });
  });

  test.describe("Ticket Creation via Chat (requires agent service)", () => {
    test("creating a ticket via chat shows tool execution", async ({
      page,
    }) => {
      // Check if agent is available
      const response = await page.request
        .get("/api/agent/health")
        .catch(() => null);
      test.skip(
        !response?.ok(),
        "Agent service not available - skipping integration tests"
      );

      await page.goto("/tickets?view=board");
      await page.locator('[data-testid="chat-toggle-btn"]').click();

      const input = page.locator('[data-testid="chat-input"]');
      const uniqueTitle = `E2E Test Ticket ${Date.now()}`;
      await input.fill(
        `Create a TODO ticket titled "${uniqueTitle}" with HIGH priority`
      );
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Wait for tool execution to complete
      await expect(page.locator('[data-testid="tool-call"]')).toBeVisible({
        timeout: 30000,
      });

      // Tool should show create_ticket
      await expect(
        page.locator('[data-testid="tool-call"]').filter({ hasText: "create" })
      ).toBeVisible();
    });

    test("board updates after ticket creation", async ({ page }) => {
      // Check if agent is available
      const response = await page.request
        .get("/api/agent/health")
        .catch(() => null);
      test.skip(
        !response?.ok(),
        "Agent service not available - skipping integration tests"
      );

      await page.goto("/tickets?view=board");

      // Wait for the board to be fully loaded
      const todoColumn = page.locator('[data-testid="column-TODO"]');
      await expect(todoColumn).toBeVisible();

      // Use a unique title with timestamp to guarantee uniqueness
      const uniqueTitle = `E2E Test Ticket ${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Verify the ticket doesn't exist yet
      await expect(page.getByText(uniqueTitle)).not.toBeVisible();

      // Open chat and create ticket - include project name to ensure success
      await page.locator('[data-testid="chat-toggle-btn"]').click();

      const input = page.locator('[data-testid="chat-input"]');
      // Include a project reference to ensure the agent uses it (FRNT is Frontend project from seed)
      await input.fill(`Create a new TODO ticket titled "${uniqueTitle}" in the FRNT project`);
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Wait for the new ticket to appear on the board (the ultimate success indicator)
      // This confirms: 1) agent processed request, 2) ticket created, 3) cache invalidated, 4) UI updated
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 45000 });
    });
  });

  test.describe("Accessibility", () => {
    test("chat toggle button has aria-label", async ({ page }) => {
      const toggleBtn = page.locator('[data-testid="chat-toggle-btn"]');
      await expect(toggleBtn).toHaveAttribute("aria-label", /chat/i);
    });

    test("chat input has accessible placeholder", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();

      const input = page.locator('[data-testid="chat-input"]');
      await expect(input).toHaveAttribute(
        "placeholder",
        "Ask the AI assistant..."
      );
    });

    test("clear and close buttons have accessible titles", async ({ page }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();

      await expect(page.locator('[data-testid="chat-clear-btn"]')).toHaveAttribute(
        "title",
        /clear/i
      );
      await expect(page.locator('[data-testid="chat-close-btn"]')).toHaveAttribute(
        "title",
        /close/i
      );
    });
  });

  test.describe("Chat on Different Pages", () => {
    test("chat works on projects page", async ({ page }) => {
      await page.goto("/projects");
      await expect(
        page.locator('[data-testid="chat-toggle-btn"]')
      ).toBeVisible();

      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

      // Can send a message
      await page.locator('[data-testid="chat-input"]').fill("Hello from projects");
      await page.locator('[data-testid="chat-send-btn"]').click();
      await expect(page.getByText("Hello from projects")).toBeVisible();
    });

    test("chat works on home page", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.locator('[data-testid="chat-toggle-btn"]')
      ).toBeVisible();

      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    });

    test("chat state persists during navigation within page", async ({
      page,
    }) => {
      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await page.locator('[data-testid="chat-input"]').fill("Test message");
      await page.locator('[data-testid="chat-send-btn"]').click();

      await expect(page.getByText("Test message")).toBeVisible();

      // Chat should still be visible after scrolling
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
      await expect(page.getByText("Test message")).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("shows error message when agent unavailable", async ({ page }) => {
      // This test assumes agent might be unavailable
      // If agent IS available, we skip
      const response = await page.request
        .get("/api/agent/health")
        .catch(() => null);
      test.skip(
        response?.ok() === true,
        "Agent is available - skipping error handling test"
      );

      await page.locator('[data-testid="chat-toggle-btn"]').click();
      await page.locator('[data-testid="chat-input"]').fill("Test message");
      await page.locator('[data-testid="chat-send-btn"]').click();

      // Should show error message
      await expect(page.getByText(/error|sorry/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
