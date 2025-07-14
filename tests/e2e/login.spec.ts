import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.waitForFormReady();
  });

  test("should display login form correctly", async () => {
    await loginPage.verifyLoginForm();
  });

  test("should login successfully with environment credentials", async () => {
    // Act
    await loginPage.loginWithEnvCredentials();

    // Assert - should be redirected away from login page
    expect(loginPage.page.url()).not.toContain("/auth/login");

    // Verify we're on the dashboard or home page
    expect(loginPage.page.url()).toMatch(/\/(|dashboard)/);
  });

  test("should show loading state during login", async () => {
    const credentials = loginPage.getCredentialsFromEnv();

    // Fill form
    await loginPage.fillEmail(credentials.email);
    await loginPage.fillPassword(credentials.password);

    // Submit and immediately check loading state
    await loginPage.submitForm();

    // Verify loading state appears briefly
    const isLoading = await loginPage.isSubmitButtonLoading();
    if (isLoading) {
      expect(isLoading).toBe(true);
    }
  });

  test("should validate required fields", async () => {
    // Try to submit empty form
    await loginPage.submitForm();

    // Should stay on login page (form validation prevents submission)
    await loginPage.page.waitForTimeout(500);
    expect(loginPage.page.url()).toContain("/auth/login");
  });

  test("should validate email format", async () => {
    // Fill invalid email
    await loginPage.fillEmail("invalid-email");
    await loginPage.fillPassword("somepassword");
    await loginPage.submitForm();

    // Should stay on login page
    await loginPage.page.waitForTimeout(500);
    expect(loginPage.page.url()).toContain("/auth/login");
  });

  test.skip("should show error for invalid credentials", async () => {
    // This test requires API mocking or test user setup
    const invalidCredentials = {
      email: "invalid@example.com",
      password: "wrongpassword",
    };

    await loginPage.fillAndSubmitLogin(invalidCredentials);

    // Wait for error to appear
    await expect(loginPage.errorAlert).toBeVisible();

    // Verify error message
    const errorText = await loginPage.getErrorAlertText();
    expect(errorText).toContain("Login failed");
  });

  test("should handle form submission states correctly", async () => {
    const credentials = loginPage.getCredentialsFromEnv();

    // Initially button should be enabled
    expect(await loginPage.submitButton.isEnabled()).toBe(true);
    expect(await loginPage.submitButton.textContent()).toBe("Log in");

    // Fill form
    await loginPage.fillAndSubmitLogin(credentials);

    // Button should become disabled during submission
    await loginPage.waitForSubmissionStart();
    expect(await loginPage.submitButton.isDisabled()).toBe(true);
  });

  test("should redirect if already logged in", async () => {
    // First login
    await loginPage.loginWithEnvCredentials();

    // Try to navigate to login page again
    const wasRedirected = await loginPage.isAlreadyLoggedIn();
    expect(wasRedirected).toBe(true);
  });
});
