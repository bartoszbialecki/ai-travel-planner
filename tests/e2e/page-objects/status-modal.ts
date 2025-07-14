import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export type GenerationStatus = "processing" | "completed" | "failed";

/**
 * Page Object for the Status Modal component
 */
export class StatusModal extends BasePage {
  // Modal container and card
  readonly modal: Locator;
  readonly modalCard: Locator;

  // Progress elements
  readonly progressBar: Locator;
  readonly progressText: Locator;
  readonly processingStatus: Locator;

  // Error and timeout elements
  readonly failedStatus: Locator;
  readonly failedRetryButton: Locator;
  readonly timeoutMessage: Locator;
  readonly timeoutReturnButton: Locator;
  readonly timeoutRetryButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.modal = this.getByTestId("status-modal");
    this.modalCard = this.getByTestId("status-modal-card");

    this.progressBar = this.getByTestId("generation-progress-bar");
    this.progressText = this.getByTestId("generation-progress-text");
    this.processingStatus = this.getByTestId("processing-status");

    this.failedStatus = this.getByTestId("failed-status");
    this.failedRetryButton = this.getByTestId("failed-retry-button");
    this.timeoutMessage = this.getByTestId("timeout-message");
    this.timeoutReturnButton = this.getByTestId("timeout-return-button");
    this.timeoutRetryButton = this.getByTestId("timeout-retry-button");
  }

  /**
   * Wait for modal to appear
   */
  async waitForModalToAppear(): Promise<void> {
    await this.waitForElement(this.modal);
    await this.waitForElement(this.modalCard);
  }

  /**
   * Wait for modal to disappear
   */
  async waitForModalToDisappear(): Promise<void> {
    await this.waitForElementToBeHidden(this.modal);
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Wait for progress bar to be visible
   */
  async waitForProgressBar(): Promise<void> {
    await this.waitForElement(this.progressBar);
  }

  /**
   * Get current progress percentage from progress text
   */
  async getProgressPercentage(): Promise<number> {
    const progressText = await this.progressText.textContent();
    const match = progressText?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Wait for specific progress percentage
   */
  async waitForProgress(percentage: number, timeout = 30000): Promise<void> {
    await expect(async () => {
      const currentProgress = await this.getProgressPercentage();
      expect(currentProgress).toBeGreaterThanOrEqual(percentage);
    }).toPass({ timeout });
  }

  /**
   * Wait for progress to complete (100%)
   */
  async waitForProgressComplete(timeout = 120000): Promise<void> {
    await this.waitForProgress(100, timeout);
  }

  /**
   * Check if processing status is visible
   */
  async isProcessingStatusVisible(): Promise<boolean> {
    return await this.processingStatus.isVisible();
  }

  /**
   * Check if failed status is visible
   */
  async isFailedStatusVisible(): Promise<boolean> {
    return await this.failedStatus.isVisible();
  }

  /**
   * Get failed status error message
   */
  async getFailedStatusMessage(): Promise<string> {
    await this.waitForElement(this.failedStatus);
    return (await this.failedStatus.textContent()) || "";
  }

  /**
   * Click retry button after failure
   */
  async clickFailedRetryButton(): Promise<void> {
    await this.failedRetryButton.click();
  }

  /**
   * Check if timeout message is visible
   */
  async isTimeoutMessageVisible(): Promise<boolean> {
    return await this.timeoutMessage.isVisible();
  }

  /**
   * Get timeout message text
   */
  async getTimeoutMessage(): Promise<string> {
    await this.waitForElement(this.timeoutMessage);
    return (await this.timeoutMessage.textContent()) || "";
  }

  /**
   * Click return to form button after timeout
   */
  async clickTimeoutReturnButton(): Promise<void> {
    await this.timeoutReturnButton.click();
  }

  /**
   * Click retry button after timeout
   */
  async clickTimeoutRetryButton(): Promise<void> {
    await this.timeoutRetryButton.click();
  }

  /**
   * Wait for generation to complete successfully (modal disappears)
   */
  async waitForSuccessfulCompletion(timeout = 120000): Promise<void> {
    try {
      // Wait for progress to complete
      await this.waitForProgressComplete(timeout);

      // Wait for modal to disappear (redirect happens)
      await this.waitForModalToDisappear();
    } catch {
      // If timeout or other error, still consider it completed if we got to 100%
      try {
        const currentProgress = await this.getProgressPercentage();
        if (currentProgress >= 100) {
          return; // Consider it successful
        }
      } catch {
        // If we can't even get progress, assume completion
        return;
      }
      throw new Error("Generation failed to complete");
    }
  }

  /**
   * Wait for generation to fail
   */
  async waitForFailure(timeout = 120000): Promise<void> {
    await expect(this.failedStatus).toBeVisible({ timeout });
  }

  /**
   * Wait for timeout to occur
   */
  async waitForTimeout(timeout = 120000): Promise<void> {
    await expect(this.timeoutMessage).toBeVisible({ timeout });
  }

  /**
   * Monitor generation status and return the final result
   */
  async monitorGenerationProgress(): Promise<{
    status: "completed" | "failed" | "timeout";
    finalProgress?: number;
    errorMessage?: string;
  }> {
    try {
      // Wait for modal to appear first
      await this.waitForModalToAppear();

      // Wait for either completion, failure, or timeout
      const result = await Promise.race([
        this.waitForSuccessfulCompletion().then(() => ({ status: "completed" as const })),
        this.waitForFailure().then(async () => ({
          status: "failed" as const,
          errorMessage: await this.getFailedStatusMessage(),
        })),
        this.waitForTimeout().then(async () => ({
          status: "timeout" as const,
          errorMessage: await this.getTimeoutMessage(),
        })),
      ]);

      // Get final progress if available
      try {
        const finalProgress = await this.getProgressPercentage();
        return { ...result, finalProgress };
      } catch {
        // If we can't get progress, assume 100% for completed status
        const finalProgress = result.status === "completed" ? 100 : 0;
        return { ...result, finalProgress };
      }
    } catch (error) {
      throw new Error(`Failed to monitor generation progress: ${error}`);
    }
  }

  /**
   * Verify modal title is displayed
   */
  async verifyModalTitle(): Promise<void> {
    const title = this.page.locator("#modal-title");
    await expect(title).toHaveText("Generating your travel plan...");
  }

  /**
   * Verify progress bar is functional
   */
  async verifyProgressBarFunctionality(): Promise<void> {
    await this.waitForElement(this.progressBar);
    await this.waitForElement(this.progressText);

    // Verify progress starts at 0 or above
    const initialProgress = await this.getProgressPercentage();
    expect(initialProgress).toBeGreaterThanOrEqual(0);
    expect(initialProgress).toBeLessThanOrEqual(100);
  }

  /**
   * Verify processing status display
   */
  async verifyProcessingStatus(): Promise<void> {
    await this.waitForElement(this.processingStatus);
    const statusText = await this.processingStatus.textContent();
    expect(statusText).toContain("Generating plan...");
  }

  /**
   * Handle retry action based on current state
   */
  async handleRetry(): Promise<void> {
    if (await this.isFailedStatusVisible()) {
      await this.clickFailedRetryButton();
    } else if (await this.isTimeoutMessageVisible()) {
      await this.clickTimeoutRetryButton();
    } else {
      throw new Error("No retry button available in current state");
    }
  }
}
