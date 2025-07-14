# Page Object Model (POM) Classes

Dedicated POM classes for testing the travel plan generation scenario.

## Structure

```
tests/e2e/page-objects/
├── base-page.ts          # Base class with common functionality
├── login-page.ts         # POM for the login page
├── generation-form.ts    # POM for the generation form
├── status-modal.ts       # POM for the generation status modal
├── generation-page.ts    # Main class combining form and modal
├── index.ts             # Exports of all classes
└── README.md            # This documentation
```

## POM Classes

### BasePage

Base class containing common methods:

- `getByTestId(testId)` - locator for elements with data-test-id
- `fillByTestId(testId, value)` - fill field by test-id
- `clickByTestId(testId)` - click element by test-id
- `waitForElement(locator)` - wait for element
- `goto(url)` - navigate to page

### LoginPage

Class for the login page authentication:

```typescript
const loginPage = new LoginPage(page);

// Navigate and login
await loginPage.navigate();
await loginPage.waitForFormReady();

// Login with environment credentials
await loginPage.loginWithEnvCredentials();

// Manual login
await loginPage.fillEmail("user@example.com");
await loginPage.fillPassword("password");
await loginPage.submitForm();

// High-level login
const credentials = { email: "user@example.com", password: "password" };
await loginPage.login(credentials);

// Ensure logged in (login if not already)
await loginPage.ensureLoggedIn();
```

### GenerationForm

Class for the plan generation form:

```typescript
const form = new GenerationForm(page);

// Fill the form
await form.fillPlanName("My trip");
await form.fillDestination("Paris");
await form.fillStartDate("2024-06-01");
await form.fillEndDate("2024-06-07");
await form.fillAdultsCount(2);
await form.selectTravelStyle("flexible");

// Submit the form
await form.submitForm();

// High-level methods
const formData = GenerationPage.createSampleFormData();
await form.fillAndSubmitForm(formData);
```

### StatusModal

Class for the progress tracking modal:

```typescript
const modal = new StatusModal(page);

// Wait for modal to appear
await modal.waitForModalToAppear();

// Track progress
const progress = await modal.getProgressPercentage();
await modal.waitForProgress(50); // Wait for 50%
await modal.waitForProgressComplete(); // Wait for 100%

// Error handling
if (await modal.isFailedStatusVisible()) {
  await modal.clickFailedRetryButton();
}

// Monitor the entire process
const result = await modal.monitorGenerationProgress();
```

### GenerationPage

Main class combining all components:

```typescript
const generationPage = new GenerationPage(page);

// Navigation and preparation
await generationPage.navigate();
await generationPage.waitForPageReady();

// Complete scenario
const formData = GenerationPage.createSampleFormData();
const result = await generationPage.generatePlan(formData);

// Verify the entire flow
await generationPage.verifyGenerationFlow(formData);

// E2E scenario with time measurement
const { planUrl, generationTime } = await generationPage.completeE2EScenario();
```

## Usage Examples

### Basic test with authentication

```typescript
import { test, expect } from "@playwright/test";
import { GenerationPage, LoginPage } from "./page-objects";

test("plan generation with login", async ({ page }) => {
  // First ensure user is logged in
  const loginPage = new LoginPage(page);
  await loginPage.ensureLoggedIn();

  // Then proceed with plan generation
  const generationPage = new GenerationPage(page);
  await generationPage.navigate();
  await generationPage.waitForPageReady();

  const formData = GenerationPage.createSampleFormData();
  const result = await generationPage.generatePlan(formData);

  expect(result.status).toBe("completed");
  expect(result.redirectUrl).toMatch(/\/plans\/[a-zA-Z0-9-]+/);
});
```

### Login test

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects";

test("user login", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.waitForFormReady();
  await loginPage.loginWithEnvCredentials();

  // Should be redirected away from login
  expect(page.url()).not.toContain("/auth/login");
});
```

### Test with form validation

```typescript
test("form validation", async ({ page }) => {
  const generationPage = new GenerationPage(page);
  await generationPage.navigate();

  // Try to submit empty form
  const validationPrevented = await generationPage.testFormValidation();
  expect(validationPrevented).toBe(true);
});
```

### Progress tracking test

```typescript
test("progress tracking", async ({ page }) => {
  const generationPage = new GenerationPage(page);
  await generationPage.navigate();

  const formData = GenerationPage.createMinimalFormData();
  await generationPage.fillAndSubmitForm(formData);

  const modal = generationPage.statusModal;
  await modal.waitForModalToAppear();
  await modal.verifyProgressBarFunctionality();

  const initialProgress = await modal.getProgressPercentage();
  await modal.waitForProgress(50);
  const laterProgress = await modal.getProgressPercentage();

  expect(laterProgress).toBeGreaterThan(initialProgress);
});
```

## Data Test IDs

All key elements have `data-test-id` attributes:

### Login

- `login-form` - main login form
- `login-input-email` - email field
- `login-input-password` - password field
- `login-submit-button` - login button
- `login-error-alert` - login error alert

### Form

- `generation-form` - main form
- `form-input-name` - plan name field
- `form-input-destination` - destination field
- `form-input-start-date` - start date
- `form-input-end-date` - end date
- `form-input-adults-count` - adults count
- `form-input-children-count` - children count
- `form-input-budget-total` - budget
- `form-input-budget-currency` - currency
- `form-select-travel-style` - travel style
- `form-submit-button` - submit button
- `form-error-alert` - error alert

### Status Modal

- `status-modal` - main modal
- `status-modal-card` - modal card
- `generation-progress-bar` - progress bar
- `generation-progress-text` - percentage text
- `processing-status` - "Generating..." status
- `failed-status` - error status
- `failed-retry-button` - retry button after error
- `timeout-message` - timeout message
- `timeout-return-button` - return to form
- `timeout-retry-button` - retry after timeout

### Page

- `generation-page` - main page container

## Helpful Methods

### Creating test data

```typescript
// Complete test data
const sampleData = GenerationPage.createSampleFormData({
  name: "Custom Trip Name",
  destination: "Tokyo, Japan",
});

// Minimal required data
const minimalData = GenerationPage.createMinimalFormData();
```

### Form data verification

```typescript
await form.verifyFormData({
  name: "Expected Name",
  destination: "Expected Destination",
});
```

### Handling different scenarios

```typescript
// Test draft persistence
await generationPage.verifyFormDataPersistence(partialData);

// Test error handling
await generationPage.testFormErrorHandling();

// Test retry after error
await generationPage.testRetryFunctionality(formData);
```

## Playwright Configuration

Tests are configured to run with:

- Chromium/Desktop Chrome
- BaseURL: http://localhost:3000
- Timeout: adjusted for long generation operations
- Traces: enabled on test retries

## Environment Variables

Tests require authentication credentials to be set as environment variables:

```bash
# Required for E2E tests
export E2E_USERNAME=your-test-user@example.com
export E2E_PASSWORD=your-test-password
```

Or create a `.env.test` file:

```
E2E_USERNAME=your-test-user@example.com
E2E_PASSWORD=your-test-password
```

## Running Tests

```bash
# Set environment variables first
export E2E_USERNAME=test@example.com
export E2E_PASSWORD=testpassword

# All E2E tests
npx playwright test

# Only plan generation tests
npx playwright test plan-generation

# Only login tests
npx playwright test login

# With UI mode
npx playwright test --ui

# With reporting
npx playwright test --reporter=html
```
