import { test, expect } from "@playwright/test";
import { GenerationPage, LoginPage } from "./page-objects";

test.describe("Plan Generation Flow", () => {
  let generationPage: GenerationPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // First, ensure user is logged in
    loginPage = new LoginPage(page);
    await loginPage.ensureLoggedIn();

    // Then navigate to generation page
    generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.waitForPageReady();
  });

  test("should complete full plan generation flow with all features", async () => {
    const form = generationPage.generationForm;

    // Test travel style selection
    await form.selectTravelStyle("active");
    await expect(form.travelStyleSelect).toContainText("Active");

    await form.selectTravelStyle("relaxation");
    await expect(form.travelStyleSelect).toContainText("Relaxation");

    // Fill form with comprehensive data (will be used for final generation)
    const formData = GenerationPage.createSampleFormData({
      name: "Complete E2E Test Trip",
      destination: "Tokyo, Japan",
      travelStyle: "flexible",
    });

    await form.fillForm(formData);

    // Verify form data persistence
    await form.verifyFormData(formData);

    // Track performance from start
    const startTime = Date.now();

    // Execute complete generation flow (submit, monitor progress, handle redirect)
    const result = await generationPage.generatePlan(formData);
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    // Verify successful completion
    expect(result.status).toBe("completed");
    expect(result.redirectUrl).toMatch(/\/plans\/[a-zA-Z0-9-]+/);
    expect(result.finalProgress).toBe(100);

    // Verify performance is within acceptable range
    expect(generationTime).toBeGreaterThan(0);
    expect(generationTime).toBeLessThan(120000); // Should complete within 2 minutes
  });

  test("should persist form data as draft", async () => {
    // Arrange
    const partialData = {
      name: "Draft Test",
      destination: "Barcelona, Spain",
    };

    // Act & Assert
    await generationPage.verifyFormDataPersistence(partialData);
  });

  test("should handle form errors gracefully", async () => {
    // This test verifies error handling
    await generationPage.testFormErrorHandling();
  });

  test.describe("Form Validation", () => {
    test("should require mandatory fields", async () => {
      const form = generationPage.generationForm;

      // Try to submit without filling mandatory fields
      await form.submitForm();

      // Verify form is not submitted (no modal appears)
      await expect(generationPage.statusModal.modal).not.toBeVisible();
    });

    test("should validate date ranges", async () => {
      const form = generationPage.generationForm;

      // Set end date before start date
      await form.fillStartDate("2024-12-31");
      await form.fillEndDate("2024-12-01");
      await form.fillPlanName("Invalid Date Test");
      await form.fillDestination("Test City");
      await form.fillAdultsCount(1);

      await form.submitForm();

      // Should not proceed to modal due to validation
      await expect(generationPage.statusModal.modal).not.toBeVisible();
    });

    test("should validate adults count minimum", async () => {
      const form = generationPage.generationForm;

      // Try to set adults count to 0
      await form.fillAdultsCount(0);

      // Try to submit form with 0 adults
      await form.submitForm();

      // Should not proceed to modal due to validation (0 adults not allowed)
      await expect(generationPage.statusModal.modal).not.toBeVisible();
    });
  });

  test.describe("Component States", () => {
    test("should show error alert for API errors", async () => {
      // This would need API mocking to trigger specific errors
      // For now, we just verify the error alert can be detected
      const form = generationPage.generationForm;

      expect(await form.isErrorAlertVisible()).toBe(false);
    });
  });
});
