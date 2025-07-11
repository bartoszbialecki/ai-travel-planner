import { test, expect } from "@playwright/test";

test.describe("AI Travel Planner E2E Tests", () => {
  test("should show login form when accessing protected routes", async ({ page }) => {
    await page.goto("/plans");

    // Should redirect to login or show login form
    await expect(page).toHaveURL(/.*auth/);
  });
});
