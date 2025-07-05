# OpenRouter AI Service

## Overview

The OpenRouter AI Service is a concrete implementation of the `BaseAIService` that communicates with the OpenRouter.ai API to generate detailed, personalized travel plans. It provides advanced language model capabilities with configurable parameters and comprehensive error handling.

## Features

- **API Communication**: Direct integration with OpenRouter.ai REST API
- **Model Flexibility**: Support for various LLM models (GPT-4, Claude, etc.)
- **Structured Output**: JSON schema validation for consistent responses
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **Usage Tracking**: Token usage statistics and cost monitoring
- **Security**: Secure API key management and request validation

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Required
OPENROUTER_API_KEY=your_api_key_here

# Optional (with defaults)
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_TIMEOUT=30000
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

### Configuration Options

| Variable                 | Default                        | Description                        |
| ------------------------ | ------------------------------ | ---------------------------------- |
| `OPENROUTER_API_KEY`     | -                              | Your OpenRouter API key (required) |
| `OPENROUTER_MODEL`       | `gpt-4o-mini`                  | Model to use for generation        |
| `OPENROUTER_BASE_URL`    | `https://openrouter.ai/api/v1` | OpenRouter API endpoint            |
| `OPENROUTER_TIMEOUT`     | `30000`                        | Request timeout in milliseconds    |
| `OPENROUTER_MAX_RETRIES` | `3`                            | Maximum retry attempts             |
| `OPENROUTER_TEMPERATURE` | `0.7`                          | Model creativity parameter (0-1)   |
| `OPENROUTER_MAX_TOKENS`  | `4000`                         | Maximum tokens in response         |

## Usage

### Basic Usage

```typescript
import { createAIService } from "@/lib/services/ai";

const aiService = createAIService();

const request = {
  destination: "Paris, France",
  start_date: "2024-06-01",
  end_date: "2024-06-05",
  adults_count: 2,
  children_count: 1,
  budget_total: 3000,
  budget_currency: "EUR",
  travel_style: "flexible",
};

const result = await aiService.generateTravelPlan(request);

if (result.success) {
  console.log("Generated plan:", result.data);
} else {
  console.error("Error:", result.error);
}
```

### Direct Service Usage

```typescript
import { OpenRouterAIService } from "@/lib/services/ai";

const service = new OpenRouterAIService("your_api_key", {
  model: "gpt-4o",
  temperature: 0.8,
  maxTokens: 6000,
});

// Change model at runtime
service.setModel("claude-3-sonnet");

// Update parameters
service.setParameters({
  temperature: 0.5,
  maxTokens: 3000,
});

// Get usage statistics
const stats = service.getUsageStats();
console.log("Total tokens used:", stats.totalTokens);
```

## Error Handling

The service handles various error scenarios:

### API Errors

- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded (auto-retry)
- **400 Bad Request**: Invalid parameters
- **503 Service Unavailable**: Model unavailable (auto-retry)

### Validation Errors

- Invalid request parameters
- Malformed API responses
- JSON parsing errors

### Example Error Handling

```typescript
try {
  const result = await aiService.generateTravelPlan(request);

  if (!result.success) {
    console.error("Generation failed:", result.error);
    return;
  }

  // Process successful result
  console.log("Processing time:", result.processing_time_ms);
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`API Error ${error.statusCode}:`, error.message);
  } else if (error instanceof ValidationError) {
    console.error("Validation error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Response Format

The service returns travel plans in the following JSON structure:

```json
{
  "days": [
    {
      "day_number": 1,
      "activities": [
        {
          "name": "Eiffel Tower",
          "description": "Iconic iron lattice tower on the Champ de Mars",
          "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
          "opening_hours": "09:00-23:45",
          "cost": 26,
          "activity_order": 1
        }
      ]
    }
  ]
}
```

## Security Considerations

### API Key Protection

- Store API keys in environment variables only
- Never commit API keys to version control
- Use key rotation for production environments
- Monitor API usage for anomalies

### Request Security

- All requests use HTTPS
- Input validation prevents injection attacks
- Rate limiting prevents abuse
- Request headers include application identification

### Logging and Monitoring

- API keys are never logged
- Usage statistics are tracked for cost monitoring
- Error logs include relevant context without sensitive data
- Performance metrics are collected

## Performance Optimization

### Caching

Consider implementing response caching for similar requests:

```typescript
// Example caching implementation
const cacheKey = JSON.stringify(request);
const cached = cache.get(cacheKey);
if (cached) return cached;

const result = await aiService.generateTravelPlan(request);
cache.set(cacheKey, result, 3600000); // 1 hour
```

### Prompt Optimization

- Keep system messages concise
- Use specific, detailed user prompts
- Consider prompt templates for common scenarios
- Monitor token usage for cost optimization

### Model Selection

Different models offer different trade-offs:

- **gpt-4o-mini**: Fast, cost-effective, good quality
- **gpt-4o**: Higher quality, more expensive
- **claude-3-sonnet**: Good balance of quality and cost
- **llama-3.1-8b**: Open source alternative

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify the key is correct and active
   - Check OpenRouter dashboard for key status

2. **Rate Limiting**
   - Implement request queuing
   - Consider using multiple API keys
   - Monitor usage patterns

3. **Model Unavailable**
   - Fall back to alternative models
   - Check OpenRouter status page
   - Implement circuit breaker pattern

4. **Response Parsing Errors**
   - Validate JSON schema compliance
   - Check for malformed responses
   - Implement fallback parsing

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=openrouter:*
```

## Cost Optimization

### Token Usage

Monitor token usage to optimize costs:

```typescript
const stats = service.getUsageStats();
const costPerToken = 0.00001; // Example rate
const totalCost = stats.totalTokens * costPerToken;
```

### Strategies

- Use shorter prompts where possible
- Implement response caching
- Choose cost-effective models for simple tasks
- Batch similar requests
- Monitor and alert on usage spikes

## Migration from Mock Service

When migrating from the mock service:

1. Set up OpenRouter API key
2. Test with small requests first
3. Monitor response quality and performance
4. Implement gradual rollout
5. Keep mock service as fallback

```typescript
// Gradual rollout example
const useOpenRouter = Math.random() < 0.1; // 10% traffic
const service = useOpenRouter ? createAIService() : new MockAIService();
```
