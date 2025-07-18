# AI Travel Planner

[![Node.js Version](https://img.shields.io/badge/node-22.16.0-green.svg)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.10.1-purple.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.10-38B2AC.svg)](https://tailwindcss.com/)

## Table of Contents

- [AI Travel Planner](#ai-travel-planner)
  - [Table of Contents](#table-of-contents)
  - [Project Description](#project-description)
    - [Problem Solved](#problem-solved)
    - [Key Features](#key-features)
    - [Target Audience](#target-audience)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [AI Integration](#ai-integration)
    - [Testing](#testing)
    - [Infrastructure](#infrastructure)
  - [API Documentation](#api-documentation)
    - [Authentication Endpoints](#authentication-endpoints)
      - [POST /api/auth/register](#post-apiauthregister)
      - [POST /api/auth/login](#post-apiauthlogin)
      - [POST /api/auth/logout](#post-apiauthlogout)
    - [Plan Management Endpoints](#plan-management-endpoints)
      - [GET /api/plans](#get-apiplans)
      - [POST /api/plans/generate](#post-apiplansgenerate)
      - [GET /api/plans/generate/{jobId}/status](#get-apiplansgeneratejobidstatus)
      - [GET /api/plans/{id}](#get-apiplansid)
      - [DELETE /api/plans/{id}](#delete-apiplansid)
    - [Activity Management Endpoints](#activity-management-endpoints)
      - [PUT /api/plans/{id}/activities/{activityId}](#put-apiplansidactivitiesactivityid)
      - [PUT /api/plans/{id}/activities/{activityId}/accept](#put-apiplansidactivitiesactivityidaccept)
      - [PUT /api/plans/{id}/activities/{activityId}/reject](#put-apiplansidactivitiesactivityidreject)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [Getting Started Locally](#getting-started-locally)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [MVP Features ✅](#mvp-features-)
    - [Success Metrics](#success-metrics)
    - [Future Features (Post-MVP)](#future-features-post-mvp)
  - [Project Status](#project-status)
    - [Development Progress](#development-progress)
  - [License](#license)

## Project Description

AI Travel Planner is a web application that automatically generates detailed, personalized travel plans based on simple input data. The application solves the time-consuming and complex problem of travel planning by using artificial intelligence to create optimal itineraries that consider user preferences, budget, number of people, and destination location.

### Problem Solved

Planning a detailed, personalized trip requires hours of research - searching for attractions, restaurants, transportation, and estimating time and costs. This process is time-consuming, frustrating, and often leads to less satisfying trips.

### Key Features

- **AI-Powered Generation**: Creates detailed travel plans using LLM through OpenRouter.ai
- **Interactive Editing**: Accept/reject individual activities and edit descriptions inline
- **User Management**: Secure authentication and account management with Supabase Auth
- **Plan Storage**: Save and manage multiple travel itineraries with full CRUD operations
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant interface with proper semantic markup
- **Real-time Status**: Live plan generation progress with polling and status updates

### Target Audience

- Individual and family travelers planning vacations
- People seeking optimized sightseeing routes
- Users who value time and prefer ready-made solutions

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, efficient website framework with minimal JavaScript
- **[React 19](https://reactjs.org/)** - Interactive components and dynamic functionality
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing and enhanced IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with PostgreSQL database
  - Built-in user authentication
  - Row Level Security (RLS)
  - Multiple language SDKs
  - Open source solution

### AI Integration

- **[Openrouter.ai](https://openrouter.ai/)** - AI model communication service
  - Access to multiple AI models (OpenAI, Anthropic, Google)
  - Financial limits on API keys
  - Cost-effective AI solutions
  - Circuit breaker pattern for reliability
  - Monitoring and caching capabilities

### Testing

- **[Vitest](https://vitest.dev/)** - Unit and integration test framework for Astro/React
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** - React component testing utilities
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Custom DOM element matchers (compatible with Vitest)
- **[jsdom](https://github.com/jsdom/jsdom)** - DOM environment simulation for testing
- **[MSW (Mock Service Worker)](https://mswjs.io/)** - API call mocking for testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing across multiple browsers

### Infrastructure

- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipelines
- **[DigitalOcean](https://www.digitalocean.com/)** - Application hosting via Docker

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "message": "Registration successful. Please check your email to confirm your account before logging in.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /api/auth/login

Authenticate user and create session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### POST /api/auth/logout

End user session.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):** Empty response

### Plan Management Endpoints

#### GET /api/plans

Retrieves a paginated list of travel plans for the logged-in user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

- `page` (optional, default: 1) - Page number (minimum: 1)
- `limit` (optional, default: 10, max: 50) - Number of items per page
- `sort` (optional, default: "created_at") - Sort column: "created_at", "name", "destination"
- `order` (optional, default: "desc") - Sort direction: "asc", "desc"

**Response (200 OK):**

```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Paris Adventure",
      "destination": "Paris, France",
      "start_date": "2024-06-01",
      "end_date": "2024-06-05",
      "adults_count": 2,
      "children_count": 1,
      "budget_total": 3000,
      "budget_currency": "EUR",
      "travel_style": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "job_id": "job-uuid",
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

#### POST /api/plans/generate

Initiates the generation of a new travel plan using AI.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "name": "Paris Adventure",
  "destination": "Paris, France",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "adults_count": 2,
  "children_count": 1,
  "budget_total": 3000,
  "budget_currency": "EUR",
  "travel_style": "active"
}
```

**Response (202 Accepted):**

```json
{
  "job_id": "job-uuid",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:05:00Z"
}
```

#### GET /api/plans/generate/{jobId}/status

Checks the status of a travel plan generation job.

**Path Parameters:**

- `jobId` (required) - UUID of the generation job

**Response Examples:**

Processing:

```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 50,
  "plan_id": null,
  "error_message": null
}
```

Completed:

```json
{
  "job_id": "uuid",
  "status": "completed",
  "progress": 100,
  "plan_id": "plan-uuid",
  "error_message": null
}
```

#### GET /api/plans/{id}

Retrieves detailed information about a travel plan with activities.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**

- `id` (required) - UUID of the plan

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Paris Adventure",
  "destination": "Paris, France",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "adults_count": 2,
  "children_count": 1,
  "budget_total": 3000,
  "budget_currency": "EUR",
  "travel_style": "active",
  "activities": {
    "1": [
      {
        "id": "activity-uuid",
        "name": "Eiffel Tower Visit",
        "description": "Visit the iconic Eiffel Tower",
        "address": "Champ de Mars, Paris",
        "opening_hours": "9:00-23:00",
        "cost": 25,
        "accepted": true,
        "custom_desc": null,
        "day_number": 1,
        "activity_order": 1
      }
    ]
  },
  "summary": {
    "total_days": 5,
    "total_activities": 15,
    "accepted_activities": 12,
    "total_cost": 2500
  }
}
```

#### DELETE /api/plans/{id}

Deletes a travel plan and all related data.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**

- `id` (required) - UUID of the plan to delete

**Response (200 OK):**

```json
{
  "message": "Plan deleted successfully"
}
```

### Activity Management Endpoints

#### PUT /api/plans/{id}/activities/{activityId}

Updates specific details of an activity within a travel plan.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**

- `id` (required) - UUID of the plan
- `activityId` (required) - UUID of the activity

**Request Body:**

```json
{
  "custom_desc": "Updated description",
  "opening_hours": "10:00-18:00",
  "cost": 30
}
```

#### PUT /api/plans/{id}/activities/{activityId}/accept

Accepts an activity in a travel plan.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**

```json
{
  "id": "activity-uuid",
  "accepted": true,
  "message": "Activity accepted"
}
```

#### PUT /api/plans/{id}/activities/{activityId}/reject

Rejects an activity in a travel plan.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**

```json
{
  "id": "activity-uuid",
  "accepted": false,
  "message": "Activity rejected"
}
```

## Project Structure

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

## Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT=300000
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000

# Testing (optional)
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
E2E_USERNAME_ID=test-user-uuid
```

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.16.0 (see `.nvmrc`)
- **Package Manager**: npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-travel-planner
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up Supabase database**

   ```bash
   # If using Supabase CLI
   supabase db reset
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000` to view the application.

## Available Scripts

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start the development server         |
| `npm run build`         | Build the application for production |
| `npm run preview`       | Preview the production build locally |
| `npm run lint`          | Run ESLint to check code quality     |
| `npm run lint:fix`      | Fix ESLint errors automatically      |
| `npm run format`        | Format code using Prettier           |
| `npm run test`          | Run unit and integration tests       |
| `npm run test:ui`       | Run tests with UI interface          |
| `npm run test:e2e`      | Run end-to-end tests                 |
| `npm run test:coverage` | Run tests with coverage report       |
| `npm run test:all`      | Run all tests (unit + e2e)           |

## Project Scope

### MVP Features ✅

- ✅ **AI-powered travel plan generation** - Complete with OpenRouter integration
- ✅ **User authentication system** - Registration, login, logout with Supabase Auth
- ✅ **Plan management** - Create, view, edit, delete travel plans
- ✅ **Interactive activity moderation** - Accept/reject individual activities
- ✅ **Inline editing** - Edit activity descriptions, hours, and costs
- ✅ **Plans dashboard** - List, sort, and paginate saved plans
- ✅ **Real-time generation status** - Progress tracking with polling
- ✅ **Responsive design** - Mobile-first design with Tailwind CSS
- ✅ **Accessibility support** - WCAG compliant with proper semantic markup
- ✅ **Error handling** - Comprehensive error logging and user feedback

### Success Metrics

- **AI Usefulness**: 70% of AI-generated days accepted without editing
- **AI Adoption**: 60% of users generate plans through AI
- **User Retention**: 40% of new users save plans within 7 days
- **Satisfaction**: Average rating ≥4.0/5.0
- **Performance**: 95% of plans generated in ≤5 minutes

### Future Features (Post-MVP)

- Map integrations and interactive routes
- Multiple alternative plan versions
- Plan sharing and collaboration
- Email/SMS notifications
- Mobile applications
- Plan export functions
- Multi-language support

## Project Status

**Current Version**: 0.0.1

**Status**: 🎯 **MVP Completed** - All core features implemented and tested

### Development Progress

- ✅ Project setup and configuration
- ✅ Astro + React + TypeScript setup with Tailwind CSS
- ✅ ESLint and Prettier configuration
- ✅ **Core application development** - All MVP features implemented
- ✅ **AI integration** - OpenRouter service with circuit breaker and monitoring
- ✅ **User authentication** - Complete auth system with Supabase
- ✅ **Database setup** - Schema, migrations, and RLS policies
- ✅ **UI/UX implementation** - Responsive design with accessibility
- ✅ **API endpoints** - All CRUD operations for plans and activities
- ✅ **Testing infrastructure** - Unit, integration, and E2E tests
- ✅ **Error handling** - Comprehensive logging and user feedback
- ✅ **Job queue system** - Background plan generation
- 🔄 **Production deployment** - Ready for deployment
- 📋 **Documentation** - API docs and technical specifications

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

For detailed product requirements and technical specifications, see the [Product Requirements Document](.ai/prd.md) and [Tech Stack Documentation](.ai/tech-stack.md).
