Frontend - Astro with React for interactive components:

- Astro 5 allows creating fast, efficient websites and applications with minimal JavaScript
- React 19 will provide interactivity where needed
- TypeScript 5 for static code typing and better IDE support
- Tailwind 4 allows convenient application styling
- Shadcn/ui provides a library of accessible React components on which we'll base our UI

Backend - Supabase as a comprehensive backend solution:

- Provides PostgreSQL database
- Provides SDKs in multiple languages that will serve as Backend-as-a-Service
- It's an open source solution that can be hosted locally or on your own server
- Has built-in user authentication

AI - Communication with models through Openrouter.ai service:

- Access to a wide range of models (OpenAI, Anthropic, Google and many others) that will allow us to find a solution providing high efficiency and low costs
- Allows setting financial limits on API keys

CI/CD and Hosting:

- Github Actions for creating CI/CD pipelines
- DigitalOcean for hosting the application via docker image

Testing:

- Vitest for unit and integration tests with React Testing Library for component testing
- jsdom for DOM environment simulation in tests
- @testing-library/jest-dom for DOM element matchers (Vitest compatible)
- Playwright for end-to-end testing across multiple browsers
- MSW (Mock Service Worker) for API call mocking during tests
- Lighthouse for performance and accessibility auditing
- k6 for load testing of API endpoints
