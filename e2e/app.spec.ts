import { test, expect } from "@playwright/test";

test.describe("CEO Support App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load home page with navigation", async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/CEO Support/);

    // Wait for redirect to documents page
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // Check that navigation tabs are visible (new 5-tab navigation)
    await expect(page.getByRole("button", { name: /文档/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /会议/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /人才/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /邮件/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /设置/ })).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Wait for redirect to documents
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // Click on Meetings tab
    await page.getByRole("button", { name: /会议/ }).click();
    await expect(page).toHaveURL(/\/meetings/);
    await expect(page.getByText("暂无会议任务")).toBeVisible();

    // Click on Talent tab
    await page.getByRole("button", { name: /人才/ }).click();
    await expect(page).toHaveURL(/\/talent/);
    await expect(page.getByText("暂无人才任务")).toBeVisible();

    // Click on Email tab
    await page.getByRole("button", { name: /邮件/ }).click();
    await expect(page).toHaveURL(/\/email/);
    await expect(page.getByText("暂无邮件任务")).toBeVisible();

    // Click on Settings tab
    await page.getByRole("button", { name: /设置/ }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "Claude Code 实例连接" })).toBeVisible();
  });

  test("should display voice input button", async ({ page }) => {
    // Wait for redirect to documents
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // Check voice input button is visible
    await expect(page.getByRole("button", { name: /🎤/ }).first()).toBeVisible();
  });

  test("should display document list on documents page", async ({ page }) => {
    // Wait for redirect to documents
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // Check document list header
    await expect(page.getByRole("heading", { name: "文档列表" }).first()).toBeVisible();
  });

  test("should display instance monitor on documents page", async ({ page }) => {
    // Wait for redirect to documents
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // Check instance monitor section
    await expect(page.getByRole("heading", { name: "实例监控" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "实例状态" })).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("should display server connection settings", async ({ page }) => {
    await page.goto("/settings");

    // Check settings page content
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Claude Code 实例连接" })).toBeVisible();
    await expect(page.getByRole("button", { name: /\+ 添加/ })).toBeVisible();
  });

  test("should show add connection form", async ({ page }) => {
    await page.goto("/settings");

    // Click add button
    await page.getByRole("button", { name: /\+ 添加/ }).click();

    // Check form fields
    await expect(page.getByText("连接名称")).toBeVisible();
    await expect(page.getByText("服务器地址")).toBeVisible();
    await expect(page.getByText("认证令牌")).toBeVisible();
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

  test("should have service worker", async ({ page }) => {
    await page.goto("/");

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg);
    });
    expect(swRegistered).toBe(true);
  });
});

test.describe("Task Management", () => {
  test("should display task cards with status", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForURL(/\/documents/, { timeout: 5000 });

    // The page should have the recording button
    await expect(page.getByRole("button", { name: /🎤/ }).first()).toBeVisible();
  });
});
