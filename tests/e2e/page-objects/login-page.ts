import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Page Object for the Login Page
 */
export class LoginPage extends BasePage {
  // Form and fields
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.loginForm = this.getByTestId("login-form");
    this.emailInput = this.getByTestId("login-input-email");
    this.passwordInput = this.getByTestId("login-input-password");
    this.submitButton = this.getByTestId("login-submit-button");
    this.errorAlert = this.getByTestId("login-error-alert");
  }

  /**
   * Navigate to the login page
   */
  async navigate(): Promise<void> {
    await this.goto("/auth/login");
    await this.waitForPageLoad();
  }

  /**
   * Wait for login form to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.waitForElement(this.loginForm);
    await this.waitForElement(this.emailInput);
    await this.waitForElement(this.passwordInput);
    await this.waitForElement(this.submitButton);
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill credentials and submit form
   */
  async fillAndSubmitLogin(credentials: LoginCredentials): Promise<void> {
    await this.fillEmail(credentials.email);
    await this.fillPassword(credentials.password);
    await this.submitForm();
  }

  /**
   * Check if error alert is visible
   */
  async isErrorAlertVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Get error alert text
   */
  async getErrorAlertText(): Promise<string> {
    return (await this.errorAlert.textContent()) || "";
  }

  /**
   * Check if submit button is loading
   */
  async isSubmitButtonLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("Logging in...") || false;
  }

  /**
   * Wait for login submission to start
   */
  async waitForSubmissionStart(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Wait for successful login (redirect away from login page)
   */
  async waitForSuccessfulLogin(): Promise<void> {
    // Wait for redirect to happen (URL should change from /auth/login)
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 10000 });
  }

  /**
   * Complete login process and wait for success
   */
  async login(credentials: LoginCredentials): Promise<void> {
    await this.fillAndSubmitLogin(credentials);
    await this.waitForSubmissionStart();
    await this.waitForSuccessfulLogin();
  }

  /**
   * Login using environment variables
   */
  async loginWithEnvCredentials(): Promise<void> {
    const credentials = this.getCredentialsFromEnv();
    await this.login(credentials);
  }

  /**
   * Get credentials from environment variables
   */
  getCredentialsFromEnv(): LoginCredentials {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    return { email, password };
  }

  /**
   * Verify login form is displayed correctly
   */
  async verifyLoginForm(): Promise<void> {
    await this.waitForFormReady();

    // Verify form elements are visible
    await expect(this.loginForm).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();

    // Verify submit button is enabled initially
    await expect(this.submitButton).toBeEnabled();

    // Verify button text
    await expect(this.submitButton).toHaveText("Log in");
  }

  /**
   * Test login with invalid credentials
   */
  async testInvalidLogin(): Promise<void> {
    const invalidCredentials = {
      email: "invalid@example.com",
      password: "wrongpassword",
    };

    await this.fillAndSubmitLogin(invalidCredentials);

    // Wait for error to appear
    await expect(this.errorAlert).toBeVisible();

    // Verify error message
    const errorText = await this.getErrorAlertText();
    expect(errorText).toBeTruthy();
  }

  /**
   * Verify form validation (empty fields)
   */
  async testFormValidation(): Promise<void> {
    // Try to submit empty form
    await this.submitForm();

    // Form should prevent submission (no redirect should happen)
    await this.page.waitForTimeout(500);
    expect(this.page.url()).toContain("/auth/login");
  }

  /**
   * Check if user is already logged in (redirect from login page)
   */
  async isAlreadyLoggedIn(): Promise<boolean> {
    try {
      await this.navigate();
      await this.page.waitForTimeout(1000);
      return !this.page.url().includes("/auth/login");
    } catch {
      return false;
    }
  }

  /**
   * Ensure user is logged in (login if not already)
   */
  async ensureLoggedIn(): Promise<void> {
    if (await this.isAlreadyLoggedIn()) {
      return; // Already logged in
    }

    await this.navigate();
    await this.waitForFormReady();
    await this.loginWithEnvCredentials();
  }
}
