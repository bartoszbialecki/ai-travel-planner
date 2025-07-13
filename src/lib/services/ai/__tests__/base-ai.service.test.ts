import { describe, it, expect, beforeEach } from "vitest";
import { BaseAIService } from "../base-ai.service";
import type { AIGenerationRequest, AIGenerationResult } from "../types";

// Create a concrete implementation for testing
class TestAIService extends BaseAIService {
  async generateTravelPlan(request: AIGenerationRequest): Promise<AIGenerationResult> {
    const startTime = Date.now();

    if (!this.validateRequest(request)) {
      return {
        success: false,
        error: "Invalid request parameters",
        processing_time_ms: this.calculateProcessingTime(startTime),
      };
    }

    // Simulate successful generation
    return {
      success: true,
      data: {
        days: [
          {
            day_number: 1,
            activities: [
              {
                name: "Test Activity",
                description: "Test Description",
                address: "Test Address",
                opening_hours: "9:00 - 17:00",
                cost: 25,
                activity_order: 1,
              },
            ],
          },
        ],
      },
      processing_time_ms: this.calculateProcessingTime(startTime),
    };
  }
}

describe("BaseAIService", () => {
  let service: TestAIService;

  beforeEach(() => {
    service = new TestAIService();
  });

  describe("validateRequest", () => {
    it("should return true for valid request", () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = service["validateRequest"](validRequest);
      expect(result).toBe(true);
    });

    it("should return false for missing destination", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return false for missing start_date", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return false for missing end_date", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "",
        adults_count: 2,
        children_count: 0,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return false for zero adults", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 0,
        children_count: 0,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return false for negative adults", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: -1,
        children_count: 0,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return false for negative children", () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: -1,
      };

      const result = service["validateRequest"](invalidRequest);
      expect(result).toBe(false);
    });

    it("should return true for zero children", () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = service["validateRequest"](validRequest);
      expect(result).toBe(true);
    });

    it("should return true with optional fields", () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 1,
        budget_total: 1000,
        budget_currency: "EUR",
        travel_style: "active",
      };

      const result = service["validateRequest"](validRequest);
      expect(result).toBe(true);
    });

    it("should return true with null optional fields", () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
        budget_total: null,
        budget_currency: null,
        travel_style: null,
      };

      const result = service["validateRequest"](validRequest);
      expect(result).toBe(true);
    });
  });

  describe("calculateProcessingTime", () => {
    it("should calculate processing time correctly", () => {
      const startTime = Date.now() - 1000; // 1 second ago
      const processingTime = service["calculateProcessingTime"](startTime);

      expect(processingTime).toBeGreaterThanOrEqual(1000);
      expect(processingTime).toBeLessThan(1100); // Allow for small timing variations
    });

    it("should return 0 for same time", () => {
      const startTime = Date.now();
      const processingTime = service["calculateProcessingTime"](startTime);

      expect(processingTime).toBeGreaterThanOrEqual(0);
      expect(processingTime).toBeLessThan(10); // Should be very small
    });

    it("should handle future start time gracefully", () => {
      const futureTime = Date.now() + 1000; // 1 second in the future
      const processingTime = service["calculateProcessingTime"](futureTime);

      // Should return negative value or handle gracefully
      expect(typeof processingTime).toBe("number");
    });
  });

  describe("generateTravelPlan", () => {
    it("should generate plan for valid request", async () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.days).toHaveLength(1);
      expect(result.data?.days[0].day_number).toBe(1);
      expect(result.data?.days[0].activities).toHaveLength(1);
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it("should return error for invalid request", async () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 0,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid request parameters");
      expect(result.data).toBeUndefined();
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
    });

    it("should include processing time in response", async () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const startTime = Date.now();
      const result = await service.generateTravelPlan(validRequest);
      const endTime = Date.now();

      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.processing_time_ms).toBeLessThanOrEqual(endTime - startTime + 10);
    });
  });

  describe("Edge cases", () => {
    it("should handle large group sizes", async () => {
      const largeGroupRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 50,
        children_count: 20,
      };

      const result = await service.generateTravelPlan(largeGroupRequest);
      expect(result.success).toBe(true);
    });

    it("should handle very long destination names", async () => {
      const longDestinationRequest: AIGenerationRequest = {
        destination: "A".repeat(1000),
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(longDestinationRequest);
      expect(result.success).toBe(true);
    });

    it("should handle special characters in destination", async () => {
      const specialCharRequest: AIGenerationRequest = {
        destination: "São Paulo, Brazil 🇧🇷",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(specialCharRequest);
      expect(result.success).toBe(true);
    });

    it("should handle undefined optional fields", async () => {
      const requestWithUndefined: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
        budget_total: undefined,
        budget_currency: undefined,
        travel_style: undefined,
      };

      const result = await service.generateTravelPlan(requestWithUndefined);
      expect(result.success).toBe(true);
    });
  });
});
