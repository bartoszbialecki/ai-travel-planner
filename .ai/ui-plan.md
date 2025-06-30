# UI Architecture for AI Travel Planner

## 1. UI Structure Overview

AI Travel Planner is a web application with a simple, intuitive navigation based on a topbar. The main structure consists of five key views: login, dashboard with plans list, plan generation form, plan details, and user profile. The application uses responsive design with Tailwind CSS, shadcn/ui components for accessibility, and JWT authentication via Supabase. The interface focuses on simplicity and efficiency, eliminating unnecessary features in the MVP.

## 2. List of Views

### 2.1 Login/Registration Page

- **View Name:** Authentication
- **View Path:** `/login`
- **Main Purpose:** User authentication and session creation
- **Key Information to Display:**
  - Login form (email, password)
  - Registration form (email, password, password confirmation)
  - Link to switch between login and registration
  - Validation error messages
- **Key View Components:**
  - AuthForm (switching between login/register)
  - Input (email, password)
  - Button (submit)
  - ErrorMessage (validation)
- **UX, Accessibility, and Security:**
  - Inline validation with immediate feedback
  - Password security requirements displayed during registration
  - Authentication error handling (invalid data, account does not exist)
  - Automatic redirect after successful authentication
  - Keyboard and screen reader support

### 2.2 Dashboard (Plans List)

- **View Name:** Plans Dashboard
- **View Path:** `/`
- **Main Purpose:** Overview of saved travel plans and navigation to plan generation
- **Key Information to Display:**
  - List of plans (name, destination, dates, number of people, travel style)
  - "No plans" message with CTA to generate (when list is empty)
  - "Generate new plan" button
  - Pagination (if more than 10 plans)
  - Sorting by creation date (newest first)
- **Key View Components:**
  - PlanCard (single plan card)
  - EmptyState (no plans message)
  - Button (generate new plan)
  - Pagination (if needed)
- **UX, Accessibility, and Security:**
  - Responsive grid layout (1 column on mobile, 2-3 on desktop)
  - Hover effects on plan cards
  - Loading state while loading the list
  - Error handling for data fetching
  - Automatic refresh after adding a new plan

### 2.3 Plan Generation Form

- **View Name:** Plan Generation Form
- **View Path:** `/generate`
- **Main Purpose:** Enter travel data and start the AI plan generation process
- **Key Information to Display:**
  - Form fields: plan name, destination, dates, number of people, budget, travel style
  - Inline validation for all fields
  - Information about the 2 plans per day limit
  - "Generate plan" button
  - Progress indicator during generation
- **Key View Components:**
  - GenerationForm (main form)
  - DateRangePicker (travel dates)
  - NumberInput (number of people, budget)
  - Select (travel style)
  - Button (submit)
  - ValidationMessage (validation errors)
- **UX, Accessibility, and Security:**
  - Real-time validation
  - Automatic draft saving in localStorage
  - Generation limit check before submission
  - Clear error messages for each field
  - Responsive single-column layout on mobile

### 2.4 Plan Details

- **View Name:** Plan Details
- **View Path:** `/plans/{id}`
- **Main Purpose:** Overview, moderation, and editing of travel plan details
- **Key Information to Display:**
  - Plan header (name, destination, dates, budget, number of people)
  - List of days with activities (scrollable view)
  - Each activity: name, description, address, opening hours, cost
  - Accept/reject buttons for each activity
  - Inline editing of activity description
  - Summary (estimated cost)
- **Key View Components:**
  - PlanHeader (plan information)
  - DaySection (section for each day)
  - ActivityCard (activity card with actions)
  - InlineEditor (description editing)
  - PlanSummary (summary)
- **UX, Accessibility, and Security:**
  - Smooth scrolling between days
  - Visual feedback for accepting/rejecting activities
  - Auto-save during editing
  - Responsive layout with collapsible sections on mobile
  - Keyboard navigation between activities

### 2.5 Plan Generation Status

- **View Name:** Generation Status
- **View Path:** `/generate/status/{jobId}` (can be modal/overlay)
- **Main Purpose:** Display plan generation progress and redirect after completion
- **Key Information to Display:**
  - Animated spinner
  - Estimated time to completion
  - Progress bar (if available)
  - Status message ("Generating plan...")
- **Key View Components:**
  - StatusSpinner (animated spinner)
  - ProgressBar (progress bar)
  - StatusMessage (status message)
- **UX, Accessibility, and Security:**
  - Status polling every 2-3 seconds
  - Automatic redirect after completion
  - Fallback timeout (5 minutes)
  - Generation error handling

### 2.6 User Profile

- **View Name:** User Profile
- **View Path:** `/profile`
- **Main Purpose:** Display account information and change password
- **Key Information to Display:**
  - User email (read-only)
  - Change password form
  - "Change password" button
  - Success/error messages
- **Key View Components:**
  - UserInfo (email)
  - PasswordChangeForm (change password form)
  - Button (save changes)
  - SuccessMessage (confirmation)
- **UX, Accessibility, and Security:**
  - New password validation
  - Current password required
  - Clear success/error messages
  - Responsive layout
  - Secure password requirements display

## 3. User Journey Map

### 3.1 New User

1. **Entry:** User visits the home page
2. **Registration:** Goes to `/login`, selects "Register"
3. **Data Entry:** Fills out the registration form
4. **Verification:** Receives verification email (if required)
5. **Dashboard:** After login, lands on `/` (empty plans list)
6. **Generation:** Clicks "Generate new plan" → `/generate`
7. **Travel Data Entry:** Fills out the generation form
8. **Status:** Goes to generation status
9. **Plan:** After completion, lands on `/plans/{id}`

### 3.2 Returning User

1. **Entry:** User visits the home page
2. **Login:** Goes to `/login`, enters credentials
3. **Dashboard:** Lands on `/` with their plans list
4. **Options:**
   - Clicks a plan → `/plans/{id}` (view/edit)
   - Clicks "Generate new plan" → `/generate` (new plan)

### 3.3 Plan Generation Flow

1. **Form:** User fills out `/generate`
2. **Validation:** System checks data and generation limit
3. **Submission:** POST to `/api/plans/generate`
4. **Status:** Redirect to generation status
5. **Polling:** System checks status every 2-3 seconds
6. **Completion:** Redirect to `/plans/{id}`

### 3.4 Plan Moderation Flow

1. **Review:** User reviews plan at `/plans/{id}`
2. **Moderation:** Accepts/rejects activities
3. **Editing:** Modifies activity descriptions inline
4. **Return:** Can return to `/` or stay on the plan

## 4. Layout and Navigation Structure

### 4.1 Topbar (Main Navigation)

- **Logo:** On the left, link to `/`
- **Navigation:** Center (Dashboard, Generate Plan, Profile)
- **Profile:** On the right (avatar + dropdown)
- **Logout:** In profile dropdown

### 4.2 Navigation Structure

```
/ (Dashboard)
├── /login (Authentication)
├── /generate (Plan Generation)
├── /generate/status/{jobId} (Generation Status)
├── /plans/{id} (Plan Details)
└── /profile (User Profile)
```

### 4.3 Responsive Navigation

- **Desktop:** Full topbar with all links
- **Tablet:** Shortened topbar with hamburger menu
- **Mobile:** Hamburger menu with slide-out navigation

### 4.4 Breadcrumbs

- **Not in MVP:** Simple navigation without breadcrumbs
- **Future:** Possible addition for complex flows

## 5. Key Components

### 5.1 Topbar

- **Purpose:** Main navigation and profile access
- **Features:** Logo, navigation menu, user profile, logout
- **Responsiveness:** Collapsible on mobile

### 5.2 PlanCard

- **Purpose:** Display basic plan information in the list
- **Content:** Name, destination, dates, number of people, travel style
- **Interactions:** Click → plan details, hover effects

### 5.3 ActivityCard

- **Purpose:** Display a single activity in the plan
- **Content:** Name, description, address, hours, cost
- **Interactions:** Accept/reject, inline editing, expand/collapse

### 5.4 GenerationForm

- **Purpose:** Collect data for plan generation
- **Features:** Validation, auto-save, limit checking
- **UX:** Progressive disclosure, clear validation

### 5.5 StatusSpinner

- **Purpose:** Display generation progress
- **Features:** Animation, progress bar, status messages
- **UX:** Reassuring feedback, estimated time

### 5.6 Toast

- **Purpose:** Success operation notifications
- **Features:** Auto-dismiss, manual close, different types
- **UX:** Non-intrusive, clear messaging

### 5.7 ErrorBoundary

- **Purpose:** Application error handling
- **Features:** Fallback UI, error reporting, recovery options
- **UX:** Graceful degradation, helpful error messages

### 5.8 InlineEditor

- **Purpose:** Edit activity descriptions without leaving the view
- **Features:** Auto-save, validation, cancel/confirm
- **UX:** Seamless editing experience

### 5.9 EmptyState

- **Purpose:** Message when no data (e.g., empty plans list)
- **Features:** Clear messaging, call-to-action
- **UX:** Encouraging, helpful guidance

### 5.10 Pagination

- **Purpose:** Navigate through large data lists
- **Features:** Page numbers, prev/next, items per page
- **UX:** Clear current state, accessible navigation
