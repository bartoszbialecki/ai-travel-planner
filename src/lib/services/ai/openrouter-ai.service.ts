import { BaseAIService } from "./base-ai.service";
import { generateTravelPlanPrompt } from "./prompt-generator";
import type { AIGenerationRequest, AIGenerationResult, AITravelPlanResponse } from "./types";
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ModelParameters,
  OpenRouterOptions,
  ResponseFormat,
  UsageStats,
} from "./openrouter.types";
import { OpenRouterError, ValidationError } from "./openrouter.types";
import { openRouterMonitoring } from "./openrouter-monitoring";
import { openRouterCache } from "./openrouter-cache";
import { openRouterCircuitBreaker } from "./openrouter-circuit-breaker";
import { OPENROUTER_TIMEOUT_MS } from "./openrouter-constants";

/**
 * OpenRouter AI Service implementation for travel plan generation.
 *
 * This service communicates with the OpenRouter.ai API to generate detailed,
 * personalized travel plans using advanced language models.
 *
 * Features:
 * - Communication with OpenRouter API through REST endpoints
 * - Travel plan generation using various LLM models
 * - Structured JSON responses with schema validation
 * - Error handling and retry mechanisms
 * - Configurable model parameters and cost limits
 */
export class OpenRouterAIService extends BaseAIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private model: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private temperature: number;
  private maxTokens: number;
  private usageStats: UsageStats = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  /**
   * Creates a new OpenRouter AI Service instance.
   *
   * @param apiKey - OpenRouter API key (required)
   * @param options - Configuration options for the service
   * @throws {ValidationError} When API key is invalid
   */
  constructor(apiKey: string, options?: OpenRouterOptions) {
    super();

    if (!this.validateAPIKey(apiKey)) {
      throw new ValidationError("Invalid API key format");
    }

    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl || "https://openrouter.ai/api/v1";
    this.model = options?.model || "gpt-4o-mini";
    this.timeout = options?.timeout || OPENROUTER_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries || 3;
    this.temperature = options?.temperature || 0.7;
    this.maxTokens = options?.maxTokens || 4000;
  }

  /**
   * Generates a detailed travel plan based on the provided request.
   *
   * This method validates the request, builds appropriate messages for the AI model,
   * communicates with the OpenRouter API, and processes the response to return
   * a structured travel plan.
   *
   * @param request - The travel plan generation request
   * @returns Promise resolving to the generation result
   */
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

      // Check cache first
      const cachedResult = openRouterCache.get(request);
      if (cachedResult) {
        console.log("💾 OpenRouter: Serving from cache");
        return cachedResult;
      }

      // Use circuit breaker for API calls
      const result = await openRouterCircuitBreaker.execute(async () => {
        const messages = this.buildMessages(request);
        const response = await this.sendChatCompletion(messages);
        const travelPlan = this.handleAPIResponse(response);

        return {
          success: true,
          data: travelPlan,
          processing_time_ms: this.calculateProcessingTime(startTime),
        };
      });

      // Cache successful results
      openRouterCache.set(request, result);

      // Log success metrics
      openRouterMonitoring.logSuccess(request, result, this.usageStats, this.model);

      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: this.calculateProcessingTime(startTime),
      };

      // Log error metrics
      const statusCode = error instanceof OpenRouterError ? error.statusCode : undefined;
      openRouterMonitoring.logError(request, error as Error, statusCode);

      return result;
    }
  }

  /**
   * Changes the model used for generation.
   *
   * @param model - The new model name to use
   */
  setModel(model: string): void {
    this.model = model;
  }

  /**
   * Updates model parameters for generation.
   *
   * @param params - Partial parameters to update
   */
  setParameters(params: Partial<ModelParameters>): void {
    if (params.temperature !== undefined) {
      this.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      this.maxTokens = params.maxTokens;
    }
    if (params.model !== undefined) {
      this.model = params.model;
    }
  }

  /**
   * Gets current API usage statistics.
   *
   * @returns Current usage statistics
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * Gets comprehensive service health information.
   *
   * @returns Health status including circuit breaker, cache, and monitoring stats
   */
  getHealthStatus(): {
    circuitBreaker: ReturnType<typeof openRouterCircuitBreaker.getStats>;
    cache: ReturnType<typeof openRouterCache.getStats>;
    monitoring: ReturnType<typeof openRouterMonitoring.getHealthStatus>;
    usage: UsageStats;
  } {
    return {
      circuitBreaker: openRouterCircuitBreaker.getStats(),
      cache: openRouterCache.getStats(),
      monitoring: openRouterMonitoring.getHealthStatus(),
      usage: this.getUsageStats(),
    };
  }

  /**
   * Validates the format of the provided API key.
   *
   * @param apiKey - The API key to validate
   * @returns True if the key format is valid
   */
  private validateAPIKey(apiKey: string): boolean {
    return typeof apiKey === "string" && apiKey.length > 0;
  }

  /**
   * Builds system and user messages for the AI model.
   *
   * Creates a system message with travel planning instructions and a user message
   * with the specific travel request details.
   *
   * @param request - The travel plan generation request
   * @returns Array of chat messages for the API
   */
  private buildMessages(request: AIGenerationRequest): ChatMessage[] {
    const duration = this.calculateTripDurationHelper(request.start_date, request.end_date);

    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are an expert travel planner with deep knowledge of destinations worldwide. You create detailed, personalized travel itineraries that optimize for:

1. **Efficiency**: Group nearby attractions and consider opening hours
2. **Experience Quality**: Balance cultural, entertainment, and dining activities
3. **Accessibility**: Consider family needs, mobility, and local transportation
4. **Realism**: Account for travel times, rest periods, and practical constraints
5. **Local Knowledge**: Include authentic local experiences and hidden gems

CRITICAL REQUIREMENTS:
- You MUST generate activities for ALL ${duration} days of the trip
- Each day must have a unique day_number from 1 to ${duration}
- Do not skip any days or generate fewer days than requested
- Ensure the response includes exactly ${duration} days with activities

Your responses must be in valid JSON format according to the provided schema. Always provide accurate, up-to-date information about attractions, addresses, and costs.`,
    };

    const userMessage: ChatMessage = {
      role: "user",
      content: generateTravelPlanPrompt(request),
    };

    return [systemMessage, userMessage];
  }

  /**
   * Helper method to calculate trip duration
   */
  private calculateTripDurationHelper(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the difference in days, including both start and end dates
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

    return Math.max(1, diffDays); // Ensure at least 1 day
  }

  /**
   * Builds the JSON schema format for API responses.
   *
   * Defines the expected structure of the travel plan response with validation
   * rules for all required fields.
   *
   * @returns Response format configuration
   */
  private buildResponseFormat(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "TravelPlanResponse",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  day_number: { type: "integer", minimum: 1 },
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: { type: "string", minLength: 1 },
                        description: { type: "string", minLength: 10 },
                        address: { type: "string", minLength: 1 },
                        opening_hours: { type: "string", pattern: "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$" },
                        cost: { type: "number", minimum: 0 },
                        activity_order: { type: "integer", minimum: 1 },
                      },
                      required: ["name", "description", "address", "opening_hours", "cost", "activity_order"],
                    },
                  },
                },
                required: ["day_number", "activities"],
              },
            },
          },
          required: ["days"],
        },
      },
    };
  }

  /**
   * Sends a chat completion request to the OpenRouter API.
   *
   * Handles authentication, request formatting, and response processing.
   * Includes retry logic for transient errors and usage statistics tracking.
   *
   * @param messages - Array of chat messages to send
   * @param options - Optional parameters for the request
   * @returns Promise resolving to the API response
   * @throws {OpenRouterError} When API request fails
   */
  private async sendChatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai-travel-planner.com",
      "X-Title": "AI Travel Planner",
    };

    // Try with JSON schema first, fallback to regular JSON if needed
    let payload: Record<string, unknown> = {
      model: options?.model || this.model,
      messages,
      temperature: options?.temperature || this.temperature,
      max_tokens: options?.maxTokens || this.maxTokens,
      response_format: options?.responseFormat || this.buildResponseFormat(),
      stream: false,
    };

    // If the model doesn't support JSON schema, remove it and add instruction to format as JSON
    if (this.model.includes("azure") || this.model.includes("gpt-35")) {
      payload = {
        model: options?.model || this.model,
        messages: [
          ...messages,
          {
            role: "system",
            content:
              "IMPORTANT: Respond ONLY with valid JSON in the exact format specified. Do not include any text before or after the JSON.",
          },
        ],
        temperature: options?.temperature || this.temperature,
        max_tokens: options?.maxTokens || this.maxTokens,
        stream: false,
      };
    }

    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const retryable = response.status === 429 || response.status >= 500;

        // Log detailed error information for debugging
        console.error(`OpenRouter API Error (${response.status}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          retryable,
          url: `${this.baseUrl}/chat/completions`,
          model: options?.model || this.model,
        });

        throw new OpenRouterError(response.status, errorText, retryable);
      }

      const data = await response.json();

      // Update usage stats
      if (data.usage) {
        this.usageStats.promptTokens += data.usage.prompt_tokens || 0;
        this.usageStats.completionTokens += data.usage.completion_tokens || 0;
        this.usageStats.totalTokens += data.usage.total_tokens || 0;
      }

      return data;
    });
  }

  /**
   * Implements retry logic with exponential backoff for transient errors.
   *
   * Retries the provided function with increasing delays between attempts.
   * Stops retrying for non-retryable errors or when max retries are reached.
   *
   * @param fn - Function to retry
   * @returns Promise resolving to the function result
   * @throws {Error} When all retry attempts fail
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error("Unknown error occurred during retry");
  }

  /**
   * Processes and validates the API response.
   *
   * Parses the JSON content from the API response and validates the structure
   * to ensure it matches the expected travel plan format.
   *
   * @param response - The raw API response
   * @returns Parsed and validated travel plan
   * @throws {ValidationError} When response format is invalid
   */
  private handleAPIResponse(response: ChatResponse): AITravelPlanResponse {
    if (!response.choices || response.choices.length === 0) {
      throw new ValidationError("Empty response from API");
    }

    const content = response.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);

      // Basic validation
      if (!parsed.days || !Array.isArray(parsed.days)) {
        throw new ValidationError("Invalid response format: missing or invalid days array");
      }

      // Validate each day structure
      for (const day of parsed.days) {
        if (!day.day_number || !Array.isArray(day.activities)) {
          throw new ValidationError("Invalid day structure in response");
        }

        for (const activity of day.activities) {
          if (
            !activity.name ||
            !activity.description ||
            !activity.address ||
            !activity.opening_hours ||
            typeof activity.cost !== "number" ||
            !activity.activity_order
          ) {
            throw new ValidationError("Invalid activity structure in response");
          }
        }
      }

      // Validate that all expected days are present
      const dayNumbers = parsed.days
        .map((day: { day_number: number }) => day.day_number)
        .sort((a: number, b: number) => a - b);
      const expectedDayNumbers = Array.from({ length: Math.max(...dayNumbers) }, (_, i) => i + 1);

      if (
        dayNumbers.length !== expectedDayNumbers.length ||
        !dayNumbers.every((dayNum: number, index: number) => dayNum === expectedDayNumbers[index])
      ) {
        console.warn("Missing days detected:", {
          expected: expectedDayNumbers,
          received: dayNumbers,
          daysCount: parsed.days.length,
        });

        // Don't throw error, just log warning - some models might skip days
        // but we'll still return what we got
      }

      return parsed as AITravelPlanResponse;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      // Log the raw content for debugging
      console.error("Failed to parse API response:", {
        content: content.substring(0, 500) + (content.length > 500 ? "..." : ""),
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw new ValidationError(
        `Failed to parse API response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
