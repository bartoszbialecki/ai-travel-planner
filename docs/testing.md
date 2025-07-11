# Testing Guide

This document provides comprehensive guidance for testing the AI Travel Planner application using Vitest for unit tests and Playwright for end-to-end tests.

## Overview

The project uses a modern testing stack:

- **Vitest** - Fast unit and integration testing with React Testing Library
- **Playwright** - End-to-end testing with Chromium browser
- **jsdom** - DOM environment simulation for component tests
- **MSW** - API mocking for isolated testing

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with UI
npm run test:ui

# Run unit tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in headed mode
npm run test:e2e:headed

# Run all tests (unit + e2e)
npm run test:all
```

## Unit Testing with Vitest

### Configuration

The Vitest configuration is in `vitest.config.ts`:

- **Environment**: jsdom for DOM simulation
- **Coverage**: V8 provider with 70% thresholds
- **Setup**: `src/test/setup.ts` for global mocks and configuration
- **Aliases**: `@` maps to `src/` directory

### Writing Component Tests

Use React Testing Library for component testing:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "../GenerationForm";

describe("GenerationForm", () => {
  it("renders form fields", () => {
    render(<GenerationForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<GenerationForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/destination/i), "Paris");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
```

### Testing Hooks

Test custom hooks using `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useFormDraft } from "../hooks/useFormDraft";

describe("useFormDraft", () => {
  it("initializes with empty form data", () => {
    const { result } = renderHook(() => useFormDraft());

    expect(result.current.values).toEqual({
      name: "",
      destination: "",
      // ... other fields
    });
  });

  it("updates form data", () => {
    const { result } = renderHook(() => useFormDraft());

    act(() => {
      result.current.setValues((prev) => ({
        ...prev,
        destination: "Paris",
      }));
    });

    expect(result.current.values.destination).toBe("Paris");
  });
});
```

### Testing Services

Test service functions with mocked dependencies:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPlanInDb } from "../plan-generation.service";

// Mock dependencies
vi.mock("../../db/supabase.client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "test-id" } })),
        })),
      })),
    })),
  },
}));

describe("Plan Generation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates plan successfully", async () => {
    const mockSupabase = {
      /* mock implementation */
    };
    const input = {
      /* test data */
    };

    const result = await createPlanInDb(mockSupabase as any, input);

    expect(result.job_id).toBeDefined();
  });
});
```

### Testing Utilities

Use the test utilities in `src/test/test-utils.tsx`:

```typescript
import { render, setupUser, mockPlanData, createMockSupabase } from "../test/test-utils";

// Use custom render with providers
render(<MyComponent />);

// Use pre-configured user event
const user = setupUser();

// Use mock data
expect(data).toEqual(mockPlanData);

// Use mock Supabase client
const mockSupabase = createMockSupabase();
```

## End-to-End Testing with Playwright

### Configuration

Playwright configuration is in `playwright.config.ts`:

- **Browser**: Chromium only (as per guidelines)
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `tests/e2e/`
- **Web Server**: Automatically starts dev server

### Writing E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test.describe("AI Travel Planner E2E", () => {
  test("should generate a travel plan", async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Fill out the form
    await page.fill('[name="destination"]', "Paris");
    await page.fill('[name="startDate"]', "2024-06-01");
    await page.fill('[name="endDate"]', "2024-06-07");
    await page.fill('[name="budget"]', "5000");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for generation to complete
    await expect(page.locator(".progress-bar")).toBeVisible();
    await expect(page.locator(".plan-details")).toBeVisible();
  });

  test("should handle authentication", async ({ page }) => {
    await page.goto("/plans");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Login
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Should be redirected back to plans
    await expect(page).toHaveURL(/.*plans/);
  });
});
```

### Page Object Model

Create page objects for maintainable tests:

```typescript
// tests/e2e/pages/GenerationPage.ts
export class GenerationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/generate");
  }

  async fillDestination(destination: string) {
    await this.page.fill('[name="destination"]', destination);
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
  }

  async waitForGeneration() {
    await this.page.waitForSelector(".plan-details");
  }
}

// tests/e2e/generation.spec.ts
import { GenerationPage } from "./pages/GenerationPage";

test("should generate plan", async ({ page }) => {
  const generationPage = new GenerationPage(page);

  await generationPage.goto();
  await generationPage.fillDestination("Paris");
  await generationPage.submitForm();
  await generationPage.waitForGeneration();
});
```

### API Testing

Test API endpoints directly:

```typescript
test("should create plan via API", async ({ request }) => {
  const response = await request.post("/api/plans/generate", {
    data: {
      destination: "Paris",
      startDate: "2024-06-01",
      endDate: "2024-06-07",
      budget: 5000,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.job_id).toBeDefined();
});
```

## Best Practices

### Unit Tests

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Descriptive Test Names**: Make test names clear about what they're testing
3. **Follow AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Don't test third-party libraries
5. **Test Edge Cases**: Include error states and boundary conditions

### E2E Tests

1. **Use Page Objects**: Keep tests maintainable with page object model
2. **Test Critical Paths**: Focus on user journeys that matter
3. **Use Reliable Selectors**: Prefer data-testid over CSS classes
4. **Handle Async Operations**: Use proper waits for dynamic content
5. **Keep Tests Independent**: Each test should be able to run in isolation

### Coverage

- **Target**: 70% coverage for critical code paths
- **Focus**: Business logic and user-facing features
- **Exclude**: Configuration files, test files, and generated code

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm run test GenerationForm.test.tsx

# Run tests matching pattern
npm run test -- -t "should submit form"

# Debug with console.log
npm run test -- --reporter=verbose
```

### E2E Tests

```bash
# Run in headed mode to see browser
npm run test:e2e:headed

# Run with debug mode
npm run test:e2e:debug

# Use Playwright UI
npm run test:e2e:ui

# Record new test
npm run test:e2e:codegen
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

### Pre-commit Hooks

The project includes Husky pre-commit hooks that run tests automatically:

```bash
# Install husky
npm run prepare

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:run"
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed
2. **jsdom environment issues**: Check `src/test/setup.ts` for proper mocks
3. **Playwright browser issues**: Run `npx playwright install chromium`
4. **Coverage not working**: Check `vitest.config.ts` coverage settings

### Getting Help

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
