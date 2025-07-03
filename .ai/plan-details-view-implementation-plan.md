# Plan for implementing the Plan Details view

## 1. Overview

The "Plan Details" view allows the user to review, moderate, and edit the details of a generated travel plan. The user can accept/reject activities, edit their descriptions, browse the details of each day, and delete the entire plan. The view ensures full responsiveness, accessibility (WCAG), smooth navigation, and visual feedback.

## 2. View Routing

- Path: `/plans/{id}`
- The view is available after logging in and requires authorization.

## 3. Component Structure

```
PlanDetailsPage
 ├─ PlanHeader
 ├─ DaysList
 │    ├─ DaySection (for each day)
 │         ├─ ActivityCard (for each activity)
 │              └─ InlineEditor (if editing)
 └─ PlanSummary
```

## 4. Component Details

### PlanHeader

- Description: Displays basic information about the plan (name, location, dates, budget, number of people). Contains a delete plan button.
- Main elements: header, data section, "Delete plan" button.
- Supported interactions: clicking "Delete plan" (confirmation, API call), optionally editing the name.
- Supported validation: none (or name validation when editing).
- Types: PlanDetailResponse, PlanHeaderProps.
- Props: { plan: PlanDetailResponse, onDelete: () => void }

### DaysList

- Description: List of day sections, enables smooth scrolling and navigation.
- Main elements: list of DaySection, day navigation.
- Supported interactions: clicking a day (scroll), keyboard support.
- Supported validation: none.
- Types: PlanDetailResponse, DaysListProps.
- Props: { activities: Record<number, ActivityResponse[]>, currentDay: number, onDaySelect: (day: number) => void }

### DaySection

- Description: Section for a specific day, contains a list of activities.
- Main elements: day header, list of ActivityCard.
- Supported interactions: collapse/expand on mobile, scrolling.
- Supported validation: none.
- Types: ActivityResponse, DaySectionProps.
- Props: { dayNumber: number, activities: ActivityResponse[], onActivityEdit, onActivityAccept, onActivityReject }

### ActivityCard

- Description: Card for a single activity with data and actions.
- Main elements: name, description, address, hours, cost, accept/reject buttons, edit button.
- Supported interactions: accept/reject, open InlineEditor, keyboard support.
- Supported validation: validation of edit fields.
- Types: ActivityResponse, ActivityViewModel, ActivityCardProps.
- Props: { activity: ActivityViewModel, onEdit, onAccept, onReject }

### InlineEditor

- Description: Editing activity description with auto-save and the ability to cancel.
- Main elements: text field, cancel button, saving indicator.
- Supported interactions: editing, auto-save (debounce), cancel.
- Supported validation: description (string/null), length, special characters.
- Types: ActivityViewModel, InlineEditorProps.
- Props: { value: string, onChange, onCancel, loading, error }

### PlanSummary

- Description: Summary of costs, number of activities, accepted activities.
- Main elements: total cost, number of activities, number of accepted activities.
- Supported interactions: none.
- Supported validation: none.
- Types: PlanSummary, PlanSummaryProps.
- Props: { summary: PlanSummary }

## 5. Types

- **PlanDetailResponse**: from backend, full plan data.
- **ActivityResponse**: from backend, activity data.
- **AttractionResponse**: from backend, attraction data.
- **PlanSummary**: from backend, plan summary.
- **PlanDetailsViewModel**: extends PlanDetailResponse with loading, error.
- **ActivityViewModel**: extends ActivityResponse with dirty, loading, error.
- **PlanHeaderProps**: { plan: PlanDetailResponse, onDelete: () => void }
- **DaysListProps**: { activities: Record<number, ActivityResponse[]>, currentDay: number, onDaySelect: (day: number) => void }
- **DaySectionProps**: { dayNumber: number, activities: ActivityResponse[], onActivityEdit, onActivityAccept, onActivityReject }
- **ActivityCardProps**: { activity: ActivityViewModel, onEdit, onAccept, onReject }
- **InlineEditorProps**: { value: string, onChange, onCancel, loading, error }
- **PlanSummaryProps**: { summary: PlanSummary }

## 6. State Management

- **planDetails**: PlanDetailsViewModel (plan data, loading, error)
- **editingActivityId**: string | null (which activity is being edited)
- **activityStates**: Map<activityId, {dirty, loading, error, value}>
- **isDeletingPlan**: boolean
- **error**: string | null (global errors)
- Custom hooks:
  - usePlanDetails(planId): fetching and updating the plan
  - useActivityEdit(activityId): editing activity

## 7. API Integration

- **GET /api/plans/{id}** – fetch plan details (PlanDetailResponse)
- **PUT /api/plans/{id}/activities/{activityId}** – edit activity (UpdateActivityRequest/Response)
- **PUT /api/plans/{id}/activities/{activityId}/accept** – accept activity (ActivityAcceptResponse)
- **PUT /api/plans/{id}/activities/{activityId}/reject** – reject activity (ActivityRejectResponse)
- **DELETE /api/plans/{id}** – delete plan (DeletePlanResponse)
- Authorization via Bearer token.

## 8. User Interactions

- Scrolling and navigation between days.
- Accepting/rejecting activities with visual feedback.
- Editing activity description with auto-save and the ability to cancel.
- Deleting the plan with confirmation.
- Keyboard and accessibility support.

## 9. Conditions and Validation

- Validation of plan and activity UUIDs before API calls.
- Validation of activity edit fields (description: string/null, hours: string/null, cost: number/null, cost >= 0).
- Handling errors 404, 403, 400, 500 – displaying a message.
- Validation of empty descriptions, invalid hours, costs < 0.

## 10. Error Handling

- Global and inline error messages.
- Retry for edit/accept/reject operations.
- Rollback optimistic UI on error.
- Handling no activities on a day.
- Handling lack of permissions (redirect/message).

## 11. Implementation Steps

1. Create Astro routing for the Plan Details page (`/plans/[id].astro`).
2. Create ViewModel types and component props.
3. Implement the custom hook usePlanDetails for fetching and updating the plan.
4. Create the PlanDetailsPage skeleton with routing and data fetching.
5. Implement PlanHeader with plan deletion support.
6. Implement DaysList and DaySection with navigation and responsiveness.
7. Implement ActivityCard with accept/reject and description editing support.
8. Implement InlineEditor with auto-save and validation.
9. Implement PlanSummary with cost and activity summary.
10. Add error and loading handling at the component level.
11. Accessibility and responsiveness tests.
12. Integration tests for user interactions.
