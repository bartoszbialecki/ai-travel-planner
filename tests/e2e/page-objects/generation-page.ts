import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { GenerationForm, type PlanFormData } from "./generation-form";
import { StatusModal } from "./status-modal";

/**
 * Main Page Object for the Generation Page that combines form and modal functionality
 */
export class GenerationPage extends BasePage {
  readonly pageContainer: Locator;
  readonly generationForm: GenerationForm;
  readonly statusModal: StatusModal;

  constructor(page: Page) {
    super(page);

    this.pageContainer = this.getByTestId("generation-page");
    this.generationForm = new GenerationForm(page);
    this.statusModal = new StatusModal(page);
  }

  /**
   * Navigate to the generation page
   */
  async navigate(): Promise<void> {
    await this.goto("/generate");
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(): Promise<void> {
    await this.waitForElement(this.pageContainer);
    await this.generationForm.waitForFormReady();
  }

  /**
   * Complete the full generation scenario: fill form, submit, and monitor progress
   */
  async generatePlan(formData: PlanFormData): Promise<{
    status: "completed" | "failed" | "timeout";
    finalProgress?: number;
    errorMessage?: string;
    redirectUrl?: string;
  }> {
    // Fill and submit the form
    await this.generationForm.fillAndSubmitForm(formData);

    // Wait for submission to start
    await this.generationForm.waitForSubmissionStart();

    // Monitor the generation progress
    const result = await this.statusModal.monitorGenerationProgress();

    // If completed successfully, capture redirect URL
    if (result.status === "completed") {
      try {
        // Wait a bit for redirect to happen
        await this.page.waitForTimeout(1000);
        const redirectUrl = this.page.url();
        return { ...result, redirectUrl };
      } catch {
        // If page is closed or error occurs, still return success with current URL
        return { ...result, redirectUrl: this.page.url() };
      }
    }

    return result;
  }

  /**
   * Fill form and submit (without monitoring progress)
   */
  async fillAndSubmitForm(formData: PlanFormData): Promise<void> {
    await this.generationForm.fillAndSubmitForm(formData);
  }

  /**
   * Verify the complete generation flow
   */
  async verifyGenerationFlow(formData: PlanFormData): Promise<void> {
    // Verify page is ready
    await this.waitForPageReady();

    // Fill and submit form
    await this.generationForm.fillForm(formData);
    await this.generationForm.submitForm();

    // Verify form submission started
    await this.generationForm.waitForSubmissionStart();

    // Verify modal appears
    await this.statusModal.waitForModalToAppear();
    await this.statusModal.verifyModalTitle();

    // Verify progress tracking works
    await this.statusModal.verifyProgressBarFunctionality();
    await this.statusModal.verifyProcessingStatus();
  }

  /**
   * Test form validation by submitting empty form
   */
  async testFormValidation(): Promise<boolean> {
    // Try to submit empty form
    await this.generationForm.submitForm();

    // Check if form stayed on page (validation prevented submission)
    await this.page.waitForTimeout(500);
    return !(await this.statusModal.isModalVisible());
  }

  /**
   * Test retry functionality after failure
   */
  async testRetryFunctionality(formData: PlanFormData): Promise<void> {
    // Fill and submit form
    await this.fillAndSubmitForm(formData);

    // Wait for failure (this might need to be mocked in tests)
    await this.statusModal.waitForFailure();

    // Test retry
    await this.statusModal.handleRetry();

    // Verify we're back to form or modal reappears
    const isModalVisible = await this.statusModal.isModalVisible();
    const isFormVisible = await this.generationForm.form.isVisible();

    expect(isModalVisible || isFormVisible).toBe(true);
  }

  /**
   * Test timeout handling
   */
  async testTimeoutHandling(formData: PlanFormData): Promise<void> {
    // Fill and submit form
    await this.fillAndSubmitForm(formData);

    // Wait for timeout (this might need special setup in tests)
    await this.statusModal.waitForTimeout();

    // Verify timeout message
    expect(await this.statusModal.isTimeoutMessageVisible()).toBe(true);

    // Test return to form
    await this.statusModal.clickTimeoutReturnButton();

    // Verify we're back to form
    await this.generationForm.waitForFormReady();
  }

  /**
   * Verify successful completion and redirect
   */
  async verifySuccessfulCompletion(formData: PlanFormData): Promise<string> {
    // Complete the generation
    const result = await this.generatePlan(formData);

    // Verify completion
    expect(result.status).toBe("completed");
    expect(result.redirectUrl).toMatch(/\/plans\/[a-zA-Z0-9-]+/);

    if (!result.redirectUrl) {
      throw new Error("Redirect URL not available after successful completion");
    }

    return result.redirectUrl;
  }

  /**
   * Create sample form data for testing
   */
  static createSampleFormData(overrides: Partial<PlanFormData> = {}): PlanFormData {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      name: "Test Travel Plan",
      destination: "Paris, France",
      startDate: tomorrow.toISOString().split("T")[0],
      endDate: nextWeek.toISOString().split("T")[0],
      adultsCount: 2,
      childrenCount: 0,
      budgetTotal: 1500,
      budgetCurrency: "EUR",
      travelStyle: "flexible",
      ...overrides,
    };
  }

  /**
   * Create minimal valid form data
   */
  static createMinimalFormData(overrides: Partial<PlanFormData> = {}): PlanFormData {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    return {
      name: "Quick Test",
      destination: "London",
      startDate: tomorrow.toISOString().split("T")[0],
      endDate: dayAfter.toISOString().split("T")[0],
      adultsCount: 1,
      ...overrides,
    };
  }

  /**
   * Verify form data persistence (draft functionality)
   */
  async verifyFormDataPersistence(formData: Partial<PlanFormData>): Promise<void> {
    // Fill partial form data
    if (formData.name) await this.generationForm.fillPlanName(formData.name);
    if (formData.destination) await this.generationForm.fillDestination(formData.destination);
    if (formData.startDate) await this.generationForm.fillStartDate(formData.startDate);

    // Refresh page
    await this.page.reload();
    await this.waitForPageReady();

    // Verify data is still there
    await this.generationForm.verifyFormData(formData);
  }

  /**
   * Test form error handling
   */
  async testFormErrorHandling(): Promise<void> {
    // Try to submit form with missing required fields (empty name and destination)
    await this.generationForm.fillPlanName("");
    await this.generationForm.fillDestination("");
    await this.generationForm.submitForm();

    // Verify form shows validation errors instead of submitting
    await this.page.waitForTimeout(500);
    expect(await this.statusModal.isModalVisible()).toBe(false);
  }

  /**
   * Complete end-to-end test scenario
   */
  async completeE2EScenario(formData?: PlanFormData): Promise<{
    planUrl: string;
    generationTime: number;
  }> {
    const testData = formData || GenerationPage.createSampleFormData();
    const startTime = Date.now();

    // Navigate to page
    await this.navigate();
    await this.waitForPageReady();

    // Complete generation
    const result = await this.generatePlan(testData);

    if (result.status !== "completed") {
      throw new Error(`Generation failed with status: ${result.status}, error: ${result.errorMessage}`);
    }

    const generationTime = Date.now() - startTime;

    if (!result.redirectUrl) {
      throw new Error("Plan generation completed but redirect URL not available");
    }

    return {
      planUrl: result.redirectUrl,
      generationTime,
    };
  }
}
