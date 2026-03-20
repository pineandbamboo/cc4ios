import { test, expect } from "@playwright/test";

test.describe("CEO Support App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load home page with navigation", async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/CEO Support/);

    // Check that navigation tabs are visible
    await expect(page.locator("text=首页")).toBeVisible();
    await expect(page.locator("text=消息")).toBeVisible();
    await expect(page.locator("text=CEO支持")).toBeVisible();
    await expect(page.locator("text=工具")).toBeVisible();
    await expect(page.locator("text=我的")).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Click on different tabs and verify content changes
    await page.click("text=首页");
    await expect(page.locator("text=欢迎使用")).toBeVisible();

    await page.click("text=消息");
    await expect(page.locator("text=暂无新消息")).toBeVisible();

    await page.click("text=工具");
    await expect(page.locator("text=AI 编辑工具")).toBeVisible();

    await page.click("text=我的");
    await expect(page.locator("text=个人设置")).toBeVisible();
  });

  test("should display voice input component", async ({ page }) => {
    // Navigate to CEO Support tab
    await page.click("text=CEO支持");

    // Check voice input button is visible
    await expect(page.locator("text=点���开始录音")).toBeVisible();
  });

  test("should display document list", async ({ page }) => {
    // Navigate to CEO Support tab
    await page.click("text=CEO支持");

    // Check document list header
    await expect(page.locator("text=文档列表")).toBeVisible();

    // Check for new document button
    await expect(page.locator("text=+ 新建")).toBeVisible();
  });
});

test.describe("Voice Input", () => {
  test("should show unsupported message when Web Speech API not available", async ({
    page,
  }) => {
    // Mock Web Speech API as unavailable
    await page.addInitScript(() => {
      // @ts-expect-error - mocking
      window.SpeechRecognition = undefined;
      // @ts-expect-error - mocking
      window.webkitSpeechRecognition = undefined;
    });

    await page.goto("/");
    await page.click("text=CEO支持");

    // Click voice button
    await page.click("text=点击开始录音");

    // Should show unsupported message
    await expect(page.locator("text=/不支持语音识别/")).toBeVisible();
  });
});

test.describe("PWA", () => {
  test("should have PWA manifest", async ({ page }) => {
    await page.goto("/");

    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");
  });

  test("should have viewport meta tags", async ({ page }) => {
    await page.goto("/");

    // Check for viewport meta
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute(
      "content",
      /width=device-width/
    );
  });
});
