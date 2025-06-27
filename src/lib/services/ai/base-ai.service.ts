import type { AIGenerationRequest, AIGenerationResult } from "./types";

export abstract class BaseAIService {
  abstract generateTravelPlan(request: AIGenerationRequest): Promise<AIGenerationResult>;

  protected calculateProcessingTime(startTime: number): number {
    return Date.now() - startTime;
  }

  protected validateRequest(request: AIGenerationRequest): boolean {
    return !!(
      request.destination &&
      request.start_date &&
      request.end_date &&
      request.adults_count > 0 &&
      request.children_count >= 0
    );
  }
}
