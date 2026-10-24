import { test, expect } from "@playwright/test";

test.describe("SyncSpace End-to-End User Journeys", () => {
  test("landing page renders successfully with navigation and theme switcher", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SyncSpace/);
    await expect(page.locator("h1")).toContainText("Where Engineering & Product Teams");
    await expect(page.locator("text=Try Interactive Demo")).toBeVisible();
    await expect(page.locator("text=Features")).toBeVisible();
    await expect(page.locator("text=Pricing")).toBeVisible();
  });

  test("pricing page renders transparent plan tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1")).toContainText("Simple, Transparent Pricing");
    await expect(page.locator("text=Community / Starter")).toBeVisible();
    await expect(page.locator("text=Pro Team")).toBeVisible();
    await expect(page.locator("text=Enterprise")).toBeVisible();
  });

  test("unauthenticated user is redirected to sign-in from protected workspace routes", async ({ page }) => {
    await page.goto("/workspace");
    await page.waitForURL("/sign-in");
    await expect(page.locator("h1")).toContainText("Welcome back");
  });

  test("sign-in with demo credentials and navigate to dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    // Click one-click demo credentials for Alice
    await page.click("text=Alice (Lead)");
    await page.click("button:has-text('Sign In')");

    // Should redirect to workspace dashboard
    await page.waitForURL(/\/workspace\/[a-zA-Z0-9-]+/);
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Acme Engineering")).toBeVisible();
  });
});
