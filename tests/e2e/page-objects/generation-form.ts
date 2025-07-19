import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export interface PlanFormData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  adultsCount: number;
  childrenCount?: number;
  budgetTotal?: number;
  budgetCurrency?: string;
  travelStyle?: "active" | "relaxation" | "flexible";
}

/**
 * Page Object for the Generation Form component
 */
export class GenerationForm extends BasePage {
  // Form container
  readonly form: Locator;

  // Form fields
  readonly nameInput: Locator;
  readonly destinationInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly adultsCountInput: Locator;
  readonly childrenCountInput: Locator;
  readonly budgetTotalInput: Locator;
  readonly budgetCurrencyInput: Locator;
  readonly travelStyleSelect: Locator;

  // Travel style options
  readonly travelStyleActive: Locator;
  readonly travelStyleRelaxation: Locator;
  readonly travelStyleFlexible: Locator;

  // Buttons and alerts
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.form = this.getByTestId("generation-form");
    this.nameInput = this.getByTestId("form-input-name");
    this.destinationInput = this.getByTestId("form-input-destination");
    this.startDateInput = this.getByTestId("form-input-start-date");
    this.endDateInput = this.getByTestId("form-input-end-date");
    this.adultsCountInput = this.getByTestId("form-input-adults-count");
    this.childrenCountInput = this.getByTestId("form-input-children-count");
    this.budgetTotalInput = this.getByTestId("form-input-budget-total");
    this.budgetCurrencyInput = this.getByTestId("form-input-budget-currency");
    this.travelStyleSelect = this.getByTestId("form-select-travel-style");

    this.travelStyleActive = this.getByTestId("travel-style-option-active");
    this.travelStyleRelaxation = this.getByTestId("travel-style-option-relaxation");
    this.travelStyleFlexible = this.getByTestId("travel-style-option-flexible");

    this.submitButton = this.getByTestId("form-submit-button");
    this.errorAlert = this.getByTestId("form-error-alert");
  }

  /**
   * Wait for form to be visible and ready
   */
  async waitForFormReady(): Promise<void> {
    await this.waitForElement(this.form);
    await this.waitForElement(this.submitButton);
  }

  /**
   * Fill the plan name field
   */
  async fillPlanName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /**
   * Fill the destination field
   */
  async fillDestination(destination: string): Promise<void> {
    await this.destinationInput.fill(destination);
  }

  /**
   * Fill the start date field
   */
  async fillStartDate(date: string): Promise<void> {
    await this.startDateInput.fill(date);
  }

  /**
   * Fill the end date field
   */
  async fillEndDate(date: string): Promise<void> {
    await this.endDateInput.fill(date);
  }

  /**
   * Fill the adults count field
   */
  async fillAdultsCount(count: number): Promise<void> {
    await this.adultsCountInput.fill(count.toString());
  }

  /**
   * Fill the children count field
   */
  async fillChildrenCount(count: number): Promise<void> {
    await this.childrenCountInput.fill(count.toString());
  }

  /**
   * Fill the budget total field
   */
  async fillBudgetTotal(amount: number): Promise<void> {
    await this.budgetTotalInput.fill(amount.toString());
  }

  /**
   * Fill the budget currency field
   */
  async fillBudgetCurrency(currency: string): Promise<void> {
    await this.budgetCurrencyInput.fill(currency);
  }

  /**
   * Select travel style from dropdown
   */
  async selectTravelStyle(style: "active" | "relaxation" | "flexible"): Promise<void> {
    await this.travelStyleSelect.click();

    switch (style) {
      case "active":
        await this.travelStyleActive.click();
        break;
      case "relaxation":
        await this.travelStyleRelaxation.click();
        break;
      case "flexible":
        await this.travelStyleFlexible.click();
        break;
    }
  }

  /**
   * Fill entire form with provided data
   */
  async fillForm(data: PlanFormData): Promise<void> {
    await this.fillPlanName(data.name);
    await this.fillDestination(data.destination);
    await this.fillStartDate(data.startDate);
    await this.fillEndDate(data.endDate);
    await this.fillAdultsCount(data.adultsCount);

    if (data.childrenCount !== undefined) {
      await this.fillChildrenCount(data.childrenCount);
    }

    if (data.budgetTotal !== undefined) {
      await this.fillBudgetTotal(data.budgetTotal);
    }

    if (data.budgetCurrency) {
      await this.fillBudgetCurrency(data.budgetCurrency);
    }

    if (data.travelStyle) {
      await this.selectTravelStyle(data.travelStyle);
    }
  }

  /**
   * Submit the form
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill form and submit
   */
  async fillAndSubmitForm(data: PlanFormData): Promise<void> {
    await this.fillForm(data);
    await this.submitForm();
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /**
   * Check if submit button shows loading state
   */
  async isSubmitButtonLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("Generating Your Plan...") || false;
  }

  /**
   * Check if submit button shows limit reached state
   */
  async isSubmitButtonLimitReached(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("Daily Limit Reached") || false;
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
   * Wait for form submission to start (submit button becomes disabled/loading)
   */
  async waitForSubmissionStart(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Verify form is filled with expected values
   */
  async verifyFormData(data: Partial<PlanFormData>): Promise<void> {
    if (data.name) {
      await expect(this.nameInput).toHaveValue(data.name);
    }
    if (data.destination) {
      await expect(this.destinationInput).toHaveValue(data.destination);
    }
    if (data.startDate) {
      await expect(this.startDateInput).toHaveValue(data.startDate);
    }
    if (data.endDate) {
      await expect(this.endDateInput).toHaveValue(data.endDate);
    }
    if (data.adultsCount !== undefined) {
      await expect(this.adultsCountInput).toHaveValue(data.adultsCount.toString());
    }
    if (data.childrenCount !== undefined) {
      await expect(this.childrenCountInput).toHaveValue(data.childrenCount.toString());
    }
    if (data.budgetTotal !== undefined) {
      await expect(this.budgetTotalInput).toHaveValue(data.budgetTotal.toString());
    }
    if (data.budgetCurrency) {
      await expect(this.budgetCurrencyInput).toHaveValue(data.budgetCurrency);
    }
  }
}
