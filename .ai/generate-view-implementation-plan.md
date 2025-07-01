# Implementation Plan for the Generate Travel Plan View

## 1. Overview

The travel plan generation view allows the user to enter basic trip data (name, destination, dates, number of people, budget, travel style) and initiate the process of generating a detailed plan by AI. The view provides field validation, informs about the generation limit, supports draft autosave, and presents generation progress in a modal with animation and ETA.

## 2. View Routing

- Path: `/generate`
- Generation status modal: `/generate/status/{jobId}` (can be a modal/overlay or a separate view)

## 3. Component Structure

- `GenerationPage`
  - `GenerationForm`
    - `Input` (plan name)
    - `Input` (destination)
    - `DateRangePicker` (trip dates)
    - `NumberInput` (adults)
    - `NumberInput` (children)
    - `NumberInput` (budget)
    - `Select` (currency)
    - `Select` (travel style)
    - `ValidationMessage`
    - `Button` (Generate plan)
  - `StatusModal` (after submission)
    - `StatusSpinner`
    - `ProgressBar`
    - `StatusMessage`

## 4. Component Details

### GenerationForm

- **Description**: Form for entering travel plan data.
- **Elements**: Text fields, selects, pickers, submit button, validation messages.
- **Interactions**: Data entry, onChange/onBlur validation, submit, draft autosave.
- **Validation**:
  - All fields required except budget, currency, and style.
  - Adults count ≥ 1, children ≥ 0.
  - Budget must be a number, currency must be 3 letters.
  - Dates: start < end.
- **Types**: `GeneratePlanFormValues`, `GeneratePlanRequest`, `ErrorResponse`.
- **Props**: None (local state or provided via context).

### StatusModal

- **Description**: Modal/overlay showing the progress of plan generation.
- **Elements**: Spinner, progress bar, ETA, status message.
- **Interactions**: Automatic close/redirect after completion, error handling.
- **Validation**: None (status presentation only).
- **Types**: `GenerationStatusResponse`.
- **Props**: `jobId` (string), `onComplete(planId: string)`.

### Other components (Input, Select, DateRangePicker, NumberInput, ValidationMessage, StatusSpinner, ProgressBar, StatusMessage)

- **Description**: UI components from shadcn/ui or custom, supporting focus, accessibility, validation.
- **Props**: Standard for the given field type.

## 5. Types

- **GeneratePlanFormValues** (ViewModel):
  - name: string
  - destination: string
  - startDate: string
  - endDate: string
  - adultsCount: number
  - childrenCount: number
  - budgetTotal?: number
  - budgetCurrency?: string
  - travelStyle?: "active" | "relaxation" | "flexible"
- **GeneratePlanRequest** (API):
  - name, destination, start_date, end_date, adults_count, children_count, budget_total, budget_currency, travel_style
- **GeneratePlanResponse** (API):
  - job_id: string
  - status: "processing"
  - estimated_completion: string
- **GenerationStatusResponse** (API):
  - job_id: string
  - status: "completed" | "processing" | "failed"
  - progress: number
  - plan_id?: string
  - error_message?: string
- **ErrorResponse** (API):
  - error: { code: string; message: string; details?: any }

## 6. State Management

- **formState**: form field values, validation errors, loading, limitReached
- **statusState**: jobId, status, progress, ETA, error
- **useFormDraft**: custom hook for autosaving/loading draft from localStorage
- **usePlanGenerationStatus**: custom hook for polling generation status

## 7. API Integration

- **POST /api/plans/generate**: form submission, handle response (job_id, ETA)
- **GET /api/plans/generate/{jobId}/status**: status polling, handle progress, redirect after completion
- **Handle errors 400/401/429/500**: messages, button lock, CTA

## 8. User Interactions

- Fill out the form → validation → click "Generate plan" → loading → generation status (modal/overlay) → redirect to plan details after completion.
- In case of error: message, ability to correct data or retry.

## 9. Conditions and Validation

- All fields required (except budget, currency, style).
- Adults count ≥ 1, children ≥ 0.
- Budget must be a number, currency 3 letters.
- Date validation (start < end).
- Limit of 2 plans per day (handle 429).
- Frontend validation and handling API errors.

## 10. Error Handling

- Validation error (400): show message next to the field.
- Plan limit (429): show limit message, lock button.
- Authorization error (401): redirect to login.
- Server error (500): general message, allow retry.
- Generation timeout: message, CTA to return.

## 11. Implementation Steps

1. Create ViewModel types and hooks for draft autosave and status polling.
2. Implement the `GenerationForm` component with validation and error handling.
3. Add draft autosave support for the form.
4. Implement plan generation limit (429) handling and error messages.
5. After submit, show `StatusModal` and start polling generation status.
6. After generation completes, redirect to plan details (`/plans/{id}`).
7. Ensure full responsiveness and accessibility (WCAG, aria-labels, focus management).
8. Test all error and edge-case scenarios.
