# Plans Dashboard View Implementation Plan

## 1. Overview

Plans Dashboard is the main view of the application, presenting the user's list of saved travel plans. It enables quick overview, sorting, pagination, and navigation to plan details or generating a new plan. It provides a responsive, accessible, and user-friendly interface for managing plans.

## 2. View Routing

- Path: `/`
- View available after login (in the future: authorization protection)

## 3. Component Structure

- **PlansDashboardPage** (main view container)
  - **EmptyState** (when there are no plans)
  - **PlansGrid** (when there are plans)
    - **PlanCard** (single plan card, xN)
    - **Pagination** (pagination, if >1 page)
  - **Button** (button to generate a new plan)
  - **SortSelect** (optional, sorting selection)

## 4. Component Details

### PlansDashboardPage

- **Description:** Main view component, fetches data, manages state, renders grid or EmptyState.
- **Elements:** PlansGrid, EmptyState, Button, Pagination, SortSelect
- **Interactions:** page change, sorting, click generate new plan
- **Validation:** page >=1, sort/order correct
- **Types:** PlanListResponse, PlansDashboardState
- **Props:** none (page entrypoint)

### PlansGrid

- **Description:** Grid displaying the list of plans in a responsive layout.
- **Elements:** PlanCard (xN)
- **Interactions:** passes clicks to PlanCard
- **Validation:** plans is an array
- **Types:** Plan[]
- **Props:** plans: Plan[], onPlanClick: (id: string) => void

### PlanCard

- **Description:** Card presenting a single plan (name, destination, dates, number of people, travel style).
- **Elements:** div/card, texts, icons, hover effects
- **Interactions:** click (navigate to details), hover
- **Validation:** plan data correctness
- **Types:** Plan
- **Props:** plan: Plan, onClick: (id: string) => void

### EmptyState

- **Description:** View informing about the lack of plans, with a CTA to generate a new plan.
- **Elements:** text, icon, Button
- **Interactions:** CTA click
- **Validation:** none
- **Types:** none
- **Props:** onGenerate: () => void

### Pagination

- **Description:** Pagination component, allows page change.
- **Elements:** buttons/numbers
- **Interactions:** page change click
- **Validation:** page >=1, page <= totalPages
- **Types:** page, totalPages
- **Props:** page: number, totalPages: number, onPageChange: (page: number) => void

### Button

- **Description:** Button to generate a new plan.
- **Elements:** button
- **Interactions:** click
- **Validation:** none
- **Types:** none
- **Props:** onClick: () => void

### SortSelect (optional)

- **Description:** Sorting selection for the plan list.
- **Elements:** select
- **Interactions:** sorting change
- **Validation:** sort/order correct
- **Types:** sort, order
- **Props:** sort: string, order: string, onSortChange: (sort: string, order: string) => void

## 5. Types

- **Plan**: id, name, destination, start_date, end_date, adults_count, children_count, budget_total, budget_currency, travel_style, created_at
- **PlanListResponse**: plans: Plan[], pagination: { page, limit, total, total_pages }
- **PlansDashboardState**: {
  plans: Plan[],
  loading: boolean,
  error: string | null,
  page: number,
  totalPages: number,
  sort: "created_at" | "name" | "destination",
  order: "asc" | "desc"
  }
- **PlanCardProps**: { plan: Plan, onClick: (id: string) => void }
- **EmptyStateProps**: { onGenerate: () => void }
- **PaginationProps**: { page: number, totalPages: number, onPageChange: (page: number) => void }
- **SortSelectProps**: { sort: string, order: string, onSortChange: (sort: string, order: string) => void }

## 6. State Management

- **Local state in PlansDashboardPage:** plans, loading, error, page, totalPages, sort, order
- **Custom hook:** usePlansList (fetching, pagination, sorting, error/loading)
- **Local state in PlanCard:** hover, focus
- **Auto-refresh:** after adding/removing a plan (e.g. useEffect with dependency on trigger)

## 7. API Integration

- **Endpoint:** GET /api/plans
- **Parameters:** page, limit, sort, order
- **Response type:** PlanListResponse
- **Handling:** fetch in usePlansList, handle loading/error, update plans, page, totalPages state
- **Authorization:** in the future, Authorization header

## 8. User Interactions

- Click PlanCard → navigate to plan details
- Click "Generate new plan" → navigate to generation form
- Change pagination page → fetch new page
- Change sorting → fetch with new parameters
- Hover on PlanCard → visual effect
- No plans → EmptyState with CTA

## 9. Conditions and Validation

- page >= 1
- limit <= 50
- sort: "created_at" | "name" | "destination"
- order: "asc" | "desc"
- plans is an array
- pagination is correct
- API response validation and fallback to default values in case of error

## 10. Error Handling

- Network/API error → display message, allow retry
- No plans → EmptyState
- Invalid parameters (page, sort) → fallback to defaults
- Long loading time → loading spinner/skeleton
- No authorization → redirect to login (in the future)

## 11. Implementation Steps

1. Create types and ViewModel models for plans and pagination
2. Implement custom hook usePlansList for fetching and managing the plans list state
3. Build PlansDashboardPage as an Astro/React page
4. Implement PlansGrid with a responsive layout (Tailwind)
5. Create PlanCard with hover, click, and accessibility support
6. Add EmptyState with CTA to generate a plan
7. Add Pagination and handle page change
8. (Optional) Add SortSelect for sorting change
9. Implement loading and error state (spinner, skeleton, messages)
10. Ensure auto-refresh after adding/removing a plan
11. Test responsiveness, accessibility, and edge-case handling
12. Implement unit and integration tests for components
