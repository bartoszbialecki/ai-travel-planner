# AI Travel Planner

[![Node.js Version](https://img.shields.io/badge/node-22.16.0-green.svg)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.10.1-purple.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.10-38B2AC.svg)](https://tailwindcss.com/)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Travel Planner is a web application that automatically generates detailed, personalized travel plans based on simple input data. The application solves the time-consuming and complex problem of travel planning by using LLMs to create optimal itineraries that consider user preferences, budget, number of people, and destination location.

### Problem Solved

Planning a detailed, personalized trip requires hours of research - searching for attractions, restaurants, transportation, and estimating time and costs. This process is time-consuming, frustrating, and often leads to less satisfying trips.

### Key Features

- **AI-Powered Generation**: Creates detailed travel plans using LLM
- **Interactive Editing**: Accept/reject individual activities and edit descriptions
- **User Management**: Secure authentication and account management
- **Plan Storage**: Save and manage multiple travel itineraries
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 AA compliant interface

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

### Infrastructure

- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipelines
- **[DigitalOcean](https://www.digitalocean.com/)** - Application hosting via Docker

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
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:4321` to view the application.

## Available Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the development server         |
| `npm run build`    | Build the application for production |
| `npm run preview`  | Preview the production build locally |
| `npm run lint`     | Run ESLint to check code quality     |
| `npm run lint:fix` | Fix ESLint errors automatically      |
| `npm run format`   | Format code using Prettier           |

## Project Scope

### MVP Features ✅

- Generating one detailed travel plan per trip
- Basic editing of activity descriptions
- Simple user account management
- Saving and viewing itineraries
- Responsive web interface
- AI-powered plan generation (≤5 minutes)
- Interactive activity moderation

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

This project is in early development. The MVP is being built according to the Product Requirements Document (PRD) with focus on core AI-powered travel planning functionality.

### Development Progress

- ✅ Project setup and configuration
- ✅ Basic Astro + React + TypeScript setup
- ✅ ESLint and Prettier configuration
- 🔄 Core application development
- ⏳ AI integration
- ⏳ User authentication
- ⏳ Database setup
- ⏳ UI/UX implementation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

For detailed product requirements and technical specifications, see the [Product Requirements Document](.ai/prd.md) and [Tech Stack Documentation](.ai/tech-stack.md).
