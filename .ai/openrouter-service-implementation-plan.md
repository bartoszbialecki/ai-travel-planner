# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is a concrete AI class implementation that extends `BaseAIService` and provides communication with the OpenRouter.ai API for generating detailed travel plans. The service uses advanced language models to create personalized itineraries based on user input data.

### Main Features:

- Communication with OpenRouter API through REST endpoints
- Travel plan generation using various LLM models
- Structured JSON responses with schema validation
- Error handling and retry mechanisms
- Configurable model parameters and cost limits

## 2. Constructor Description

```typescript
constructor(
  apiKey: string,
  options?: {
    model?: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    temperature?: number;
    maxTokens?: number;
  }
)
```

### Constructor Parameters:

- `apiKey`: OpenRouter API key (required)
- `model`: Model name to use (default: "gpt-4o-mini")
- `baseUrl`: OpenRouter endpoint URL (default: "https://openrouter.ai/api/v1")
- `timeout`: Request timeout in ms (default: 30000)
- `maxRetries`: Maximum number of retry attempts (default: 3)
- `temperature`: Model creativity parameter (default: 0.7)
- `maxTokens`: Maximum number of tokens in response (default: 4000)

### Initialization:

- API key validation
- HTTP headers configuration
- Setting default model parameters
- Initialization of retry and error handling mechanisms

## 3. Public Methods and Fields

### `generateTravelPlan(request: AIGenerationRequest): Promise<AIGenerationResult>`

Main method for generating travel plans.

**Implementation:**

1. Input data validation
2. Building system and user messages
3. Response format configuration with JSON schema
4. API call with retry logic
5. Response parsing and validation
6. Returning formatted result

### `setModel(model: string): void`

Change the model used for generation.

### `setParameters(params: Partial<ModelParameters>): void`

Update model parameters.

### `getUsageStats(): UsageStats`

Get API usage statistics.

## 4. Private Methods and Fields

### `private sendChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>`

Communication with OpenRouter API.

**Implementation:**

```typescript
private async sendChatCompletion(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const payload = {
    model: options?.model || this.model,
    messages,
    temperature: options?.temperature || this.temperature,
    max_tokens: options?.maxTokens || this.maxTokens,
    response_format: options?.responseFormat || this.buildResponseFormat(),
    stream: false
  };

  return this.retryWithBackoff(async () => {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new OpenRouterError(response.status, await response.text());
    }

    return response.json();
  });
}
```

### `private buildMessages(request: AIGenerationRequest): ChatMessage[]`

Building system and user messages.

**System Message:**

```typescript
const systemMessage: ChatMessage = {
  role: "system",
  content: `You are a travel planning expert. You generate detailed travel plans in JSON format.
  
Requirements:
- Each day must have a number and list of activities
- Each activity must contain: name, description, address, opening hours, cost, order
- Consider opening hours and optimize sightseeing order
- Provide costs in the user's selected currency (default: PLN)
- Consider family preferences if there are children

The response must be in JSON format according to the provided schema.`,
};
```

**User Message:**

```typescript
const userMessage: ChatMessage = {
  role: "user",
  content: generateTravelPlanPrompt(request),
};
```

### `private buildResponseFormat(): ResponseFormat`

Configuration of JSON response structure.

```typescript
private buildResponseFormat(): ResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name: "TravelPlanResponse",
      strict: true,
      schema: {
        type: "object",
        properties: {
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day_number: { type: "integer", minimum: 1 },
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", minLength: 1 },
                      description: { type: "string", minLength: 10 },
                      address: { type: "string", minLength: 1 },
                      opening_hours: { type: "string", pattern: "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$" },
                      cost: { type: "number", minimum: 0 },
                      activity_order: { type: "integer", minimum: 1 }
                    },
                    required: ["name", "description", "address", "opening_hours", "cost", "activity_order"]
                  }
                }
              },
              required: ["day_number", "activities"]
            }
          }
        },
        required: ["days"]
      }
    }
  };
}
```

### `private retryWithBackoff<T>(fn: () => Promise<T>): Promise<T>`

Retry mechanism with exponential backoff.

### `private validateAPIKey(apiKey: string): boolean`

API key format validation.

### `private handleAPIResponse(response: ChatResponse): AITravelPlanResponse`

Parsowanie i walidacja odpowiedzi z API.

## 5. Error Handling

### Error Classes:

```typescript
class OpenRouterError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
```

### Error Scenarios and Handling:

1. **401 Unauthorized** - Invalid API key
   - Check key format
   - Security error logging
   - Return validation error

2. **429 Too Many Requests** - Rate limit exceeded
   - Implement exponential backoff
   - Request queue
   - Graceful degradation

3. **400 Bad Request** - Invalid parameters
   - Payload validation before sending
   - Detailed error logging
   - Fallback to default parameters

4. **503 Service Unavailable** - Model unavailable
   - Retry with different model
   - Circuit breaker pattern
   - Fallback to mock service

5. **Network Timeout** - Timeout exceeded
   - Configurable timeout
   - Retry with shorter timeout
   - Graceful degradation

6. **JSON Parsing Error** - Invalid response
   - JSON schema validation
   - Fallback parsing
   - Raw response logging

## 6. Security Considerations

### API Key Protection:

- Storage in environment variables
- Key format validation
- Key rotation
- Usage monitoring

### Request Security:

- HTTPS only
- Input validation
- Data sanitization
- Rate limiting

### Logging and Monitoring:

- Secure logging (no keys)
- Usage and cost monitoring
- Anomaly alerts
- Audit trail

## 7. Step-by-Step Deployment Plan

### Step 1: Environment Configuration

```bash
# Add environment variables
echo "OPENROUTER_API_KEY=your_api_key_here" >> .env
echo "OPENROUTER_BASE_URL=https://openrouter.ai/api/v1" >> .env
```

### Step 2: Install Dependencies

```bash
npm install node-fetch@3
```

### Step 3: Create Service File

Create `src/lib/services/ai/openrouter-ai.service.ts`

### Step 4: Implement Basic Structure

```typescript
import { BaseAIService } from "./base-ai.service";
import type { AIGenerationRequest, AIGenerationResult } from "./types";

export class OpenRouterAIService extends BaseAIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(apiKey: string, options?: OpenRouterOptions) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || "https://openrouter.ai/api/v1";
    this.model = options?.model || "gpt-4o-mini";
    this.timeout = options?.timeout || 30000;
    this.maxRetries = options?.maxRetries || 3;
    this.temperature = options?.temperature || 0.7;
    this.maxTokens = options?.maxTokens || 4000;
  }
}
```

### Step 5: Implement Main Method

```typescript
async generateTravelPlan(request: AIGenerationRequest): Promise<AIGenerationResult> {
  const startTime = Date.now();

  try {
    if (!this.validateRequest(request)) {
      return {
        success: false,
        error: "Invalid request parameters",
        processing_time_ms: this.calculateProcessingTime(startTime),
      };
    }

    const messages = this.buildMessages(request);
    const response = await this.sendChatCompletion(messages);
    const travelPlan = this.handleAPIResponse(response);

    return {
      success: true,
      data: travelPlan,
      processing_time_ms: this.calculateProcessingTime(startTime),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      processing_time_ms: this.calculateProcessingTime(startTime),
    };
  }
}
```

### Step 6: Implement API Communication

```typescript
private async sendChatCompletion(messages: ChatMessage[]): Promise<ChatResponse> {
  const headers = {
    "Authorization": `Bearer ${this.apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://ai-travel-planner.com",
    "X-Title": "AI Travel Planner"
  };

  const payload = {
    model: this.model,
    messages,
    temperature: this.temperature,
    max_tokens: this.maxTokens,
    response_format: this.buildResponseFormat(),
    stream: false
  };

  return this.retryWithBackoff(async () => {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new OpenRouterError(response.status, await response.text());
    }

    return response.json();
  });
}
```

### Step 7: Implement Retry Logic

```typescript
private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === this.maxRetries) {
        throw lastError;
      }

      if (error instanceof OpenRouterError && !error.retryable) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### Step 8: Application Configuration

```typescript
// src/lib/services/ai/index.ts
import { OpenRouterAIService } from "./openrouter-ai.service";

export function createAIService(): BaseAIService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("OpenRouter API key not found, using mock service");
    return new MockAIService();
  }

  return new OpenRouterAIService(apiKey, {
    model: "gpt-4o-mini",
    timeout: 30000,
    maxRetries: 3,
    temperature: 0.7,
    maxTokens: 4000,
  });
}
```

### Step 9: Monitoring and Optimization

- Implement usage tracking
- API cost monitoring
- Prompt optimization
- A/B testing of different models

### Step 10: Documentation

- API documentation
- Usage examples
- Troubleshooting guide
- Cost optimization tips

### Step 11: Deployment

- Environment variables setup
- Health checks
- Error monitoring
- Performance monitoring

## Summary

The OpenRouter service implementation requires careful planning and consideration of many technical, security, and performance aspects. Key elements include:

1. **Solid Architecture** - Extending BaseAIService while maintaining consistency
2. **Error Handling** - Comprehensive retry and fallback strategy
3. **Security** - API key protection and data validation
4. **Performance** - Request optimization and caching
5. **Monitoring** - Usage and cost tracking

The deployment plan ensures gradual introduction of functionality with rollback capability in case of issues.
