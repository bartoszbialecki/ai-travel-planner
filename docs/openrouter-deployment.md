# OpenRouter Service Deployment Guide

## Overview

This guide covers the deployment and configuration of the OpenRouter AI Service in the AI Travel Planner application. The service is designed to be production-ready with comprehensive error handling, caching, and monitoring.

## Prerequisites

- Node.js 18+ and npm/pnpm
- OpenRouter API account and API key
- Environment variables configured
- Database (Supabase) properly set up

## Environment Configuration

### Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional Configuration (with defaults)
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT=30000
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000

# Database Configuration (if not already set)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Environment Variable Details

| Variable                 | Required | Default                        | Description             |
| ------------------------ | -------- | ------------------------------ | ----------------------- |
| `OPENROUTER_API_KEY`     | ✅       | -                              | Your OpenRouter API key |
| `OPENROUTER_MODEL`       | ❌       | `gpt-4o-mini`                  | AI model to use         |
| `OPENROUTER_BASE_URL`    | ❌       | `https://openrouter.ai/api/v1` | API endpoint            |
| `OPENROUTER_TIMEOUT`     | ❌       | `30000`                        | Request timeout (ms)    |
| `OPENROUTER_MAX_RETRIES` | ❌       | `3`                            | Max retry attempts      |
| `OPENROUTER_TEMPERATURE` | ❌       | `0.7`                          | Model creativity (0-1)  |
| `OPENROUTER_MAX_TOKENS`  | ❌       | `4000`                         | Max response tokens     |

## Installation Steps

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up OpenRouter Account

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Create an account and verify your email
3. Generate an API key from the dashboard
4. Add the API key to your `.env` file

### 3. Verify Configuration

Test the configuration by running:

```bash
npm run dev
```

Check the console for any configuration errors or warnings.

## Production Deployment

### 1. Environment Setup

For production deployment, ensure all environment variables are properly set:

```bash
# Production environment variables
NODE_ENV=production
OPENROUTER_API_KEY=your_production_api_key
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_TIMEOUT=30000
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

### 2. Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### 3. Health Checks

Implement health check endpoints to monitor service status:

```typescript
// Example health check endpoint
app.get("/api/health/openrouter", (req, res) => {
  const aiService = createAIService();
  if (aiService instanceof OpenRouterAIService) {
    const health = aiService.getHealthStatus();
    res.json(health);
  } else {
    res.json({ status: "mock-service" });
  }
});
```

## Monitoring and Observability

### 1. Logging

The service includes comprehensive logging:

- **Success logs**: Include processing time and token usage
- **Error logs**: Include error details and status codes
- **Performance logs**: Track response times and throughput
- **Cache logs**: Monitor cache hits and misses

### 2. Metrics

Key metrics to monitor:

- Request success rate
- Average processing time
- Token usage and costs
- Cache hit rate
- Circuit breaker state
- Error rates by type

### 3. Alerts

Set up alerts for:

- Success rate below 80%
- Average response time above 30 seconds
- Circuit breaker opening
- High error rates
- API quota approaching limits

## Performance Optimization

### 1. Caching Strategy

The service includes intelligent caching:

- **Cacheable requests**: Standard travel plans (2+ days, reasonable group sizes)
- **Cache TTL**: 12 hours by default
- **Cache size**: 200 entries maximum
- **LRU eviction**: Automatic cleanup of old entries

### 2. Circuit Breaker

Protection against cascading failures:

- **Failure threshold**: 5 consecutive failures
- **Recovery timeout**: 30 seconds
- **Expected response time**: 25 seconds
- **Automatic recovery**: Half-open state testing

### 3. Model Selection

Optimize costs and performance:

```typescript
// Dynamic model selection based on request complexity
function selectModel(request: AIGenerationRequest): string {
  const duration = calculateTripDuration(request.start_date, request.end_date);
  const groupSize = request.adults_count + request.children_count;

  if (duration <= 3 && groupSize <= 2) {
    return "gpt-4o-mini"; // Fast and cheap for simple requests
  } else if (duration <= 7 && groupSize <= 4) {
    return "gpt-4o"; // Balanced for medium complexity
  } else {
    return "gpt-4o"; // Best quality for complex requests
  }
}
```

## Security Considerations

### 1. API Key Management

- Store API keys in environment variables only
- Use different keys for development and production
- Rotate keys regularly
- Monitor key usage for anomalies

### 2. Request Validation

- Validate all input parameters
- Sanitize user inputs
- Implement rate limiting
- Log security events

### 3. Data Protection

- Don't log sensitive information
- Use HTTPS for all API calls
- Implement proper error handling
- Follow GDPR compliance

## Troubleshooting

### Common Issues

#### 1. API Key Invalid

```bash
Error: 401 Unauthorized
```

**Solution**: Verify API key is correct and active in OpenRouter dashboard.

#### 2. Rate Limiting

```bash
Error: 429 Too Many Requests
```

**Solution**: Implement request queuing or use multiple API keys.

#### 3. Model Unavailable

```bash
Error: 503 Service Unavailable
```

**Solution**: Fall back to alternative models or wait for service recovery.

#### 4. Circuit Breaker Open

```bash
Error: Circuit breaker is OPEN
```

**Solution**: Wait for automatic recovery or manually reset if needed.

### Debug Mode

Enable debug logging:

```bash
DEBUG=openrouter:*
```

### Manual Circuit Breaker Reset

```typescript
import { openRouterCircuitBreaker } from "./lib/services/ai/openrouter-circuit-breaker";

// Reset circuit breaker manually
openRouterCircuitBreaker.reset();
```

## Cost Optimization

### 1. Token Usage Monitoring

```typescript
const stats = aiService.getUsageStats();
const costPerToken = 0.00001; // Example rate
const totalCost = stats.totalTokens * costPerToken;
```

### 2. Optimization Strategies

- Use shorter prompts where possible
- Implement response caching
- Choose cost-effective models
- Monitor and alert on usage spikes
- Batch similar requests

### 3. Budget Alerts

Set up alerts for:

- Daily token usage limits
- Monthly cost thresholds
- Unusual usage patterns
- High-cost requests

## Backup and Recovery

### 1. Fallback Strategy

The service automatically falls back to MockAIService when:

- API key is not configured
- Circuit breaker is open
- Service is unavailable

### 2. Data Backup

- Regular database backups
- Cache persistence (if using Redis)
- Configuration backups
- Log retention policies

### 3. Disaster Recovery

- Multiple API key rotation
- Geographic redundancy
- Service monitoring
- Automated failover

## Maintenance

### 1. Regular Tasks

- Monitor API usage and costs
- Review error logs
- Update dependencies
- Rotate API keys
- Clean up old cache entries

### 2. Performance Tuning

- Adjust cache TTL based on usage patterns
- Optimize prompt templates
- Fine-tune model parameters
- Monitor and optimize costs

### 3. Updates

- Keep dependencies updated
- Monitor OpenRouter API changes
- Update prompt templates
- Review and update security measures

## Support

For issues and support:

1. Check the troubleshooting section
2. Review OpenRouter documentation
3. Monitor service health endpoints
4. Contact development team
5. Check OpenRouter status page

## Conclusion

The OpenRouter service is designed to be production-ready with comprehensive error handling, monitoring, and optimization features. Follow this guide for successful deployment and maintenance.
