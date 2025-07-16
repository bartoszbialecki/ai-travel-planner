# CI/CD Setup for AI Travel Planner

## Overview

The project uses GitHub Actions to automate the CI/CD process with the following components:

### Workflows

1. **Pull Request Checks** (`.github/workflows/pull-request.yml`)
   - Lint and format check
   - Unit and integration tests with coverage (parallel)
   - E2E tests with Playwright (parallel)
   - Status comments to PR
   - Runs only on pull requests

2. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Lint and format check
   - Unit and integration tests with coverage (parallel)
   - E2E tests with Playwright (parallel)
   - Production build
   - Security audit
   - Performance tests with Lighthouse
   - Runs only on push to main

3. **Deploy** (`.github/workflows/deploy.yml`)
   - Deployment to DigitalOcean App Platform
   - Docker image build and push
   - Automatic deployment after successful CI/CD pipeline

### Node.js Configuration

The project uses Node.js 22.16.0 (defined in `.nvmrc`), which is automatically detected by the `actions/setup-node@v4` action.

## Configuration

### Required GitHub Secrets

```bash
# Environment: integration (for E2E tests)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
E2E_USERNAME=your_test_user_email
E2E_PASSWORD=your_test_user_password
E2E_USERNAME_ID=your_test_user_uuid

# DigitalOcean Access Token
DIGITALOCEAN_ACCESS_TOKEN=your_do_token_here
```

### Environment Configuration

The project uses GitHub Environments for secure secret management:

1. **Create Environment**: Go to Settings → Environments → Create environment
2. **Environment Name**: `integration`
3. **Add Secrets**: All secrets listed above
4. **Protection Rules**: Configure as needed for your security requirements

The workflows automatically use the `integration` environment for E2E tests, providing secure access to secrets without exposing them in logs.

## Execution

### Automatic Triggers

- **Pull Request to main** - Pull Request Checks workflow (tests + comments)
- **Push to main** - CI/CD Pipeline workflow (tests + build + security + performance)
- **After CI/CD success** - Deploy workflow (deployment to production)
- **Manual trigger** - ability to run any workflow manually

### Manual Execution

1. Go to the "Actions" tab in GitHub
2. Select the "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Select branch and confirm

## Pipeline Stages

### 1. Lint and Format

- ESLint check
- Prettier format check
- Execution time: ~2-3 min

### 2. Unit Tests (Parallel)

- Vitest with coverage
- Threshold: 70% for branches, functions, lines, statements
- Upload coverage to Codecov (v5)
- Upload coverage artifacts
- Execution time: ~3-5 min

### 3. E2E Tests (Parallel)

- Playwright tests in Chromium
- Automatic browser installation
- Environment: integration (with secrets)
- Upload Playwright reports and test results
- Execution time: ~5-8 min

**Note**: Unit and E2E tests run in parallel after lint completion, reducing total execution time.

### 4. Production Build

- Astro build with Node.js adapter
- Upload artifacts (dist/)
- Runs only on main
- Execution time: ~2-3 min

### 5. Security Audit

- npm audit with moderate level
- Execution time: ~1-2 min

### 6. Lighthouse Performance

- Performance, accessibility, SEO tests
- Lighthouse CI v12.6.1 with `.lighthouserc.json` configuration
- Core Web Vitals monitoring (FCP, LCP, CLS)
- 3 test runs for reliability
- Uses build artifacts (no duplicate build)
- Runs only on main
- Execution time: ~3-5 min

## Used GitHub Actions

### Latest Versions:

- **actions/checkout@v4** - Repository checkout with fetch-depth: 0
- **actions/setup-node@v4** - Node.js setup with .nvmrc and npm cache
- **actions/upload-artifact@v4** - Artifact upload
- **actions/download-artifact@v4** - Artifact download
- **codecov/codecov-action@v5** - Coverage reporting
- **treosh/lighthouse-ci-action@v12.6.1** - Performance testing
- **actions/github-script@v7** - PR status comments

## Deployment

### DigitalOcean App Platform

1. **Docker Image Build**
   - Multi-stage build
   - Alpine Linux base
   - Non-root user
   - Health checks

2. **Container Registry**
   - Automatic push to DigitalOcean Container Registry
   - Tagging: `latest` + `{commit-sha}`

3. **App Platform Deployment**
   - Automatic deployment after successful build
   - Rolling updates
   - Health check monitoring

## Monitoring and Debugging

### Artifacts

- **Unit test coverage** - available for 30 days
- **Playwright reports** - available for 30 days
- **Test results** - available for 30 days
- **Build artifacts** - available for 7 days
- **Lighthouse reports** - temporary public storage

### Logs

All logs are available in GitHub Actions UI with the ability to:

- Download logs as files
- Filter by job/step
- Debug failed builds

## Troubleshooting

### Common Issues

1. **E2E Tests Fail**
   - Check if the application starts correctly
   - Verify environment variables
   - Check Playwright logs

2. **Build Fails**
   - Check TypeScript errors
   - Verify dependencies
   - Check Astro config

3. **Deployment Fails**
   - Check DigitalOcean token
   - Verify App Platform config
   - Check Docker build logs

### Local Debugging

```bash
# Run tests locally
npm run test:all

# Check build locally
npm run build

# Start preview server
npm run preview

# E2E tests locally
npm run test:e2e
```

## Costs

### GitHub Actions

- 2000 minutes/month for public repos (free)
- **Pull Request**: ~10-15 minutes per PR
- **CI/CD Pipeline**: ~20-30 minutes per push to main
- **Total**: ~60-120 minutes/month with regular commits

### DigitalOcean

- Container Registry: $5/month
- App Platform: from $5/month (depending on plan)

## Lighthouse Configuration

### Performance Thresholds

The project uses `.lighthouserc.json` for performance monitoring:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }],
        "categories:seo": ["warn", { "minScore": 0.8 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["warn", { "maxNumericValue": 4000 }],
        "cumulative-layout-shift": ["warn", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

### Core Web Vitals

- **First Contentful Paint (FCP)**: ≤ 2000ms
- **Largest Contentful Paint (LCP)**: ≤ 4000ms
- **Cumulative Layout Shift (CLS)**: ≤ 0.1

## Extensions

### Possible Improvements

1. **Cache Optimization**
   - Docker layer caching
   - Node modules caching
   - Build cache

2. **Parallel Execution**
   - ✅ Already implemented: Unit and E2E tests run in parallel
   - Split test suites for even faster execution

3. **Advanced Monitoring**
   - ✅ Already implemented: PR status comments
   - Slack/Discord notifications
   - Performance regression alerts
   - Error tracking integration

4. **Security Scanning**
   - Snyk integration
   - Container vulnerability scanning
   - Dependency scanning
