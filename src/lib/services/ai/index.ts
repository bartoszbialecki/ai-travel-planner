import { logger } from "../logger";
import { BaseAIService } from "./base-ai.service";
import { MockAIService } from "./mock-ai.service";
import { OpenRouterAIService } from "./openrouter-ai.service";

/**
 * Creates and configures the appropriate AI service based on environment variables.
 * Falls back to MockAIService if OpenRouter API key is not available.
 */
export function createAIService(): BaseAIService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    logger.warn("OpenRouter API key not found, using mock service");
    return new MockAIService();
  }

  return new OpenRouterAIService(apiKey, {
    model: import.meta.env.OPENROUTER_MODEL || "gpt-4o-mini",
    baseUrl: import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    timeout: parseInt(import.meta.env.OPENROUTER_TIMEOUT || "300000"), // 5 minutes
    maxRetries: parseInt(import.meta.env.OPENROUTER_MAX_RETRIES || "3"),
    temperature: parseFloat(import.meta.env.OPENROUTER_TEMPERATURE || "0.7"),
    maxTokens: parseInt(import.meta.env.OPENROUTER_MAX_TOKENS || "4000"),
  });
}

// Export all AI services for direct use if needed
export { BaseAIService } from "./base-ai.service";
export { MockAIService } from "./mock-ai.service";
export { OpenRouterAIService } from "./openrouter-ai.service";
export type { AIGenerationRequest, AIGenerationResult, AITravelPlanResponse } from "./types";
