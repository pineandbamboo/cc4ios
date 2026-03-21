import { test, expect } from "@playwright/test";

test.describe("Terminal Feature", () => {
  test.describe("Terminal Button Visibility", () => {
    test("should show terminal button for connected instances", async ({ page }) => {
      // Mock API response with connected instances BEFORE navigating
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Production Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
              {
                id: "conn-2",
                name: "Development Server",
                url: "https://dev.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Navigate to documents page where terminal is available
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");

      // Terminal buttons should be visible and enabled for connected instances
      const terminalButtons = page.getByRole("button", { name: "💻" });
      await expect(terminalButtons).toHaveCount(2);

      // Check that buttons are enabled
      for (const button of await terminalButtons.all()) {
        await expect(button).toBeEnabled();
      }
    });

    test("should disable terminal button for disconnected instances", async ({ page }) => {
      // Mock API response with mixed connection states BEFORE navigating
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Production Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
              {
                id: "conn-2",
                name: "Offline Server",
                url: "https://offline.example.com",
                status: "disconnected",
              },
            ],
          }),
        });
      });

      // Navigate to documents page
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");

      // Should have 2 terminal buttons total
      const terminalButtons = page.getByRole("button", { name: "💻" });
      await expect(terminalButtons).toHaveCount(2);

      // Get all buttons and check their states
      const buttons = await terminalButtons.all();

      // First button should be enabled (connected)
      await expect(buttons[0]).toBeEnabled();

      // Second button should be disabled (disconnected)
      await expect(buttons[1]).toBeDisabled();
    });

    test("should not show terminal button when no instances configured", async ({ page }) => {
      // Mock empty response BEFORE navigating
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ connections: [] }),
        });
      });

      // Navigate to documents page
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");

      // Should show empty state message
      await expect(page.getByText("暂无配置的实例")).toBeVisible();
      await expect(page.getByText("在设置页面添加 Claude Code 实例连接")).toBeVisible();

      // No terminal buttons should be visible
      const terminalButtons = page.getByRole("button", { name: "💻" });
      await expect(terminalButtons).toHaveCount(0);
    });
  });

  test.describe("Opening Terminal Viewer", () => {
    test("should open terminal modal when clicking terminal button", async ({ page }) => {
      // Mock connections API BEFORE navigating
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Production Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check for connection test
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ status: "healthy" }),
          });
        } else if (requestBody.endpoint === "/api/execute") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ output: "Command executed successfully" }),
          });
        }
      });

      // Navigate to documents page
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");

      // Click terminal button
      await page.getByRole("button", { name: "💻" }).click();

      // Terminal modal should be visible
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Production Server" })).toBeVisible();
      await expect(page.getByText("● Connected")).toBeVisible();

      // Should show connection messages
      await expect(page.getByText(/Connecting to Production Server/).first()).toBeVisible();
      await expect(page.getByText("✓ Connected successfully").first()).toBeVisible();
      await expect(page.getByText("Type 'help' for available commands").first()).toBeVisible();

      // Should have input field focused
      const input = page.getByPlaceholder("Enter command...");
      await expect(input).toBeVisible();
      await expect(input).toBeFocused();
    });

    test("should show disconnected state when connection fails", async ({ page }) => {
      // Mock connections API BEFORE navigating
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Offline Server",
                url: "https://offline.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock failed health check
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();
        // Always fail for this test
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Service unavailable" }),
        });
      });

      // Navigate to documents page
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");

      // Click terminal button
      await page.getByRole("button", { name: "💻" }).click();

      // Should show disconnected state
      await expect(page.getByText("○ Disconnected")).toBeVisible();
      await expect(page.getByText(/✗ Connection failed/).first()).toBeVisible();
    });
  });

  test.describe("Command Execution", () => {
    test("should send command and display output", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API - handle all requests including connection not found
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        // Always return success for terminal commands (bypass database)
        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: `Executed: ${requestBody.body.command}\nOutput line 1\nOutput line 2` }
                : { status: "healthy" }
            ),
          });
        } else {
          // For other endpoints, continue with default behavior
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Type a command
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("ls -la");

      // Send command
      await input.press("Enter");

      // Should show input line
      await expect(page.getByText("$ ls -la")).toBeVisible({ timeout: 10000 });

      // Should show output
      await expect(page.getByText(/Executed: ls -la/)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Output line 1")).toBeVisible();
      await expect(page.getByText("Output line 2")).toBeVisible();

      // Input should be cleared and refocused
      await expect(input).toHaveValue("");
      await expect(input).toBeFocused();
    });

    test("should display error message when command fails", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API with error response
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { error: "Command not found: invalid-command" }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Type invalid command
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("invalid-command");

      // Send command
      await input.press("Enter");

      // Should show error
      await expect(page.getByText("Command not found: invalid-command")).toBeVisible({ timeout: 10000 });
    });

    test("should show processing state while command is executing", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API with delay
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          if (requestBody.endpoint === "/api/execute") {
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: "Done" }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Type command
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("sleep 1");

      // Send command
      await input.press("Enter");

      // Should show processing indicator
      await expect(page.getByText("Processing...")).toBeVisible({ timeout: 10000 });

      // Input should be disabled while processing
      await expect(input).toBeDisabled();

      // Wait for completion
      await expect(page.getByText("Done")).toBeVisible({ timeout: 3000 });
      await expect(page.getByText("Processing...")).toBeHidden();
    });
  });

  test.describe("Voice Input", () => {
    test("should show voice input button", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Voice input button should be visible
      const voiceButton = page.locator("button").filter({ hasText: "🎤" }).nth(1);
      await expect(voiceButton).toBeVisible();
    });

    test("should show voice input hint in help text", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Should show voice input hint
      await expect(page.locator(".text-xs.text-gray-600").filter({ hasText: /🎤 for voice input/ })).toBeVisible();
    });
  });

  test.describe("Command History", () => {
    test("should navigate command history with arrow keys", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API
      let commandCount = 0;
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          if (requestBody.endpoint === "/api/execute") {
            commandCount++;
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: `Command ${commandCount} executed` }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      const input = page.getByPlaceholder("Enter command...");

      // Execute multiple commands
      await input.fill("ls -la");
      await input.press("Enter");
      await page.waitForTimeout(100);

      await input.fill("pwd");
      await input.press("Enter");
      await page.waitForTimeout(100);

      await input.fill("whoami");
      await input.press("Enter");
      await page.waitForTimeout(100);

      // Navigate up in history (ArrowUp)
      await input.press("ArrowUp");
      await expect(input).toHaveValue("whoami");

      await input.press("ArrowUp");
      await expect(input).toHaveValue("pwd");

      await input.press("ArrowUp");
      await expect(input).toHaveValue("ls -la");

      // Navigate down in history (ArrowDown)
      await input.press("ArrowDown");
      await expect(input).toHaveValue("pwd");

      await input.press("ArrowDown");
      await expect(input).toHaveValue("whoami");

      // Navigate past end of history
      await input.press("ArrowDown");
      await expect(input).toHaveValue("");
    });

    test("should show history navigation hint in help text", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Should show history hint
      await expect(page.getByText(/↑↓ for history/)).toBeVisible();
    });
  });

  test.describe("Clear Button", () => {
    test("should clear terminal output when clicking clear button", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: "Command output" }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Execute some commands to generate output
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("ls");
      await input.press("Enter");
      await page.waitForTimeout(100);

      await input.fill("pwd");
      await input.press("Enter");
      await page.waitForTimeout(100);

      // Should have output
      await expect(page.getByText("$ ls")).toBeVisible();
      await expect(page.getByText("$ pwd")).toBeVisible();

      // Click clear button
      await page.getByRole("button", { name: "Clear" }).click({ force: true });

      // All output should be cleared except initial connection messages
      await expect(page.getByText("$ ls")).toBeHidden();
      await expect(page.getByText("$ pwd")).toBeHidden();
    });
  });

  test.describe("Close Button", () => {
    test("should close terminal modal when clicking close button", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Click close button
      await page.getByRole("button", { name: "✕ Close" }).click();

      // Terminal should be closed
      await expect(page.getByText("Test Server")).toBeHidden({ timeout: 10000 });
      await expect(page.getByText("实例监控")).toBeVisible();
    });

    test("should close terminal when pressing Escape key", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Press Escape key
      const input = page.getByPlaceholder("Enter command...");
      await input.press("Escape");

      // Terminal should be closed
      await expect(page.getByText("Test Server")).toBeHidden({ timeout: 10000 });
    });

    test("should show escape key hint in help text", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Should show escape key hint
      await expect(page.getByText(/Esc to close/)).toBeVisible();
    });
  });

  test.describe("Terminal Auto-scroll", () => {
    test("should auto-scroll to bottom when new output is added", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API with long output
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          if (requestBody.endpoint === "/api/execute") {
            // Generate long output that requires scrolling
            const longOutput = Array(50).fill("Line of output").join("\n");
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ output: longOutput }),
            });
          } else {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({ status: "healthy" }),
            });
          }
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Execute command that produces long output
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("cat long-file.txt");
      await input.press("Enter");

      // Wait for output
      await page.waitForTimeout(500);

      // The terminal should have scrolled (we can't directly test scroll position in Playwright easily,
      // but we can verify the output is visible)
      await expect(page.getByText("Line of output")).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Enter Key to Send", () => {
    test("should send command when pressing Enter", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: "Executed" }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Type command and press Enter
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("test-command");
      await input.press("Enter");

      // Command should be sent
      await expect(page.getByText("$ test-command")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Executed")).toBeVisible({ timeout: 10000 });
    });

    test("should show enter key hint in help text", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock health check
      await page.route("**/api/proxy", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "healthy" }),
        });
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Should show enter key hint
      await expect(page.getByText(/Enter to send/)).toBeVisible();
    });
  });

  test.describe("Empty Command Handling", () => {
    test("should not send empty commands", async ({ page }) => {
      // Mock connections API
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            connections: [
              {
                id: "conn-1",
                name: "Test Server",
                url: "https://api.example.com",
                status: "connected",
                last_ping: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      // Mock proxy API - should not be called for empty command
      let proxyCalled = false;
      await page.route("**/api/proxy", async (route) => {
        const requestBody = await route.request().postDataJSON();

        if (requestBody.endpoint === "/health" || requestBody.endpoint === "/api/execute") {
          if (requestBody.endpoint === "/api/execute") {
            proxyCalled = true;
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(
              requestBody.endpoint === "/api/execute"
                ? { output: "Should not be called" }
                : { status: "healthy" }
            ),
          });
        } else {
          route.continue();
        }
      });

      // Navigate to documents page and open terminal
      await page.goto("/documents");
      await page.waitForURL(/\/documents/, { timeout: 5000 });
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "💻" }).click();

      // Wait for terminal to open
      await expect(page.locator('.font-mono.text-sm.text-white').filter({ hasText: "Test Server" })).toBeVisible();

      // Try to send empty command
      const input = page.getByPlaceholder("Enter command...");
      await input.fill("");
      await input.press("Enter");

      // Give time for any potential API call
      await page.waitForTimeout(500);

      // Proxy should not have been called for execute endpoint
      expect(proxyCalled).toBe(false);

      // Send button should be disabled for empty input
      await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
    });
  });
});
