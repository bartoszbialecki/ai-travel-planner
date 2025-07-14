import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Base Page Object class with common functionality
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get element by test id
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-test-id="${testId}"]`);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementToBeHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Fill input field by test id
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Click element by test id
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Get text content by test id
   */
  async getTextByTestId(testId: string): Promise<string> {
    return (await this.getByTestId(testId).textContent()) || "";
  }

  /**
   * Check if element is visible by test id
   */
  async isVisibleByTestId(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isVisible();
  }

  /**
   * Check if element is enabled by test id
   */
  async isEnabledByTestId(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isEnabled();
  }
}
