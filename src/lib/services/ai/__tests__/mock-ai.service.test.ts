import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockAIService } from "../mock-ai.service";
import type { AIGenerationRequest } from "../types";

describe("MockAIService", () => {
  let service: MockAIService;

  beforeEach(() => {
    service = new MockAIService();
    vi.clearAllMocks();
  });

  describe("generateTravelPlan", () => {
    it("should generate mock plan for valid request", async () => {
      const validRequest: AIGenerationRequest = {
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-03",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.days).toBeDefined();
      expect(result.data?.days.length).toBeGreaterThan(0);
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it("should return error for invalid request", async () => {
      const invalidRequest: AIGenerationRequest = {
        destination: "",
        start_date: "2024-06-01",
        end_date: "2024-06-03",
        adults_count: 0,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid request parameters");
      expect(result.data).toBeUndefined();
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
    });

    it("should generate correct number of days", async () => {
      const request: AIGenerationRequest = {
        destination: "London",
        start_date: "2024-06-01",
        end_date: "2024-06-05", // 4 days
        adults_count: 2,
        children_count: 1,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toHaveLength(4);

      // Check day numbers are sequential
      result.data?.days.forEach((day, index) => {
        expect(day.day_number).toBe(index + 1);
      });
    });

    it("should generate activities for each day", async () => {
      const request: AIGenerationRequest = {
        destination: "Rome",
        start_date: "2024-06-01",
        end_date: "2024-06-03",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      result.data?.days.forEach((day) => {
        expect(day.activities).toBeDefined();
        expect(day.activities.length).toBeGreaterThan(0);
        expect(day.activities.length).toBeLessThanOrEqual(6);

        // Check activity structure
        day.activities.forEach((activity, index) => {
          expect(activity.name).toBeDefined();
          expect(activity.description).toBeDefined();
          expect(activity.address).toBeDefined();
          expect(activity.opening_hours).toBeDefined();
          expect(activity.cost).toBeGreaterThanOrEqual(0);
          expect(activity.activity_order).toBe(index + 1);
        });
      });
    });

    it("should include destination in activity names", async () => {
      const request: AIGenerationRequest = {
        destination: "Tokyo",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 1,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];

      // At least some activities should mention the destination
      const hasDestinationReference = allActivities.some(
        (activity) =>
          activity.name.includes("Tokyo") ||
          activity.description.includes("Tokyo") ||
          activity.address.includes("Tokyo")
      );

      expect(hasDestinationReference).toBe(true);
    });

    it("should generate family-friendly activities when children are present", async () => {
      const requestWithChildren: AIGenerationRequest = {
        destination: "Orlando",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 2,
      };

      const result = await service.generateTravelPlan(requestWithChildren);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];

      // Should have some family-friendly activities
      const hasFamilyActivities = allActivities.some(
        (activity) =>
          activity.name.toLowerCase().includes("park") ||
          activity.name.toLowerCase().includes("zoo") ||
          activity.name.toLowerCase().includes("museum") ||
          activity.name.toLowerCase().includes("family") ||
          activity.description.toLowerCase().includes("family") ||
          activity.description.toLowerCase().includes("children")
      );

      expect(hasFamilyActivities).toBe(true);
    });

    it("should simulate processing delay", async () => {
      const request: AIGenerationRequest = {
        destination: "Berlin",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const startTime = Date.now();
      const result = await service.generateTravelPlan(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(100); // Should simulate at least 100ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("should handle different travel styles", async () => {
      const activeRequest: AIGenerationRequest = {
        destination: "Barcelona",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
        travel_style: "active",
      };

      const relaxationRequest: AIGenerationRequest = {
        destination: "Barcelona",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
        travel_style: "relaxation",
      };

      const activeResult = await service.generateTravelPlan(activeRequest);
      const relaxationResult = await service.generateTravelPlan(relaxationRequest);

      expect(activeResult.success).toBe(true);
      expect(relaxationResult.success).toBe(true);

      // Both should generate valid plans
      expect(activeResult.data?.days).toBeDefined();
      expect(relaxationResult.data?.days).toBeDefined();
    });

    it("should handle budget considerations", async () => {
      const budgetRequest: AIGenerationRequest = {
        destination: "Prague",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
        budget_total: 500,
        budget_currency: "EUR",
      };

      const result = await service.generateTravelPlan(budgetRequest);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];

      // Activities should have reasonable costs
      allActivities.forEach((activity) => {
        expect(activity.cost).toBeGreaterThanOrEqual(0);
        expect(activity.cost).toBeLessThan(200); // Reasonable upper bound
      });
    });

    it("should generate realistic opening hours", async () => {
      const request: AIGenerationRequest = {
        destination: "Amsterdam",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];

      allActivities.forEach((activity) => {
        expect(activity.opening_hours).toBeDefined();
        expect(activity.opening_hours.length).toBeGreaterThan(0);
        // Should follow some time format pattern
        expect(activity.opening_hours).toMatch(/\d+:\d+/);
      });
    });

    it("should generate valid addresses", async () => {
      const request: AIGenerationRequest = {
        destination: "Vienna",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];

      allActivities.forEach((activity) => {
        expect(activity.address).toBeDefined();
        expect(activity.address.length).toBeGreaterThan(0);
        // Should contain some address-like information
        expect(activity.address).toMatch(/\w+/);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle single day trips", async () => {
      const request: AIGenerationRequest = {
        destination: "Brussels",
        start_date: "2024-06-01",
        end_date: "2024-06-01", // Same day
        adults_count: 1,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toHaveLength(1);
      expect(result.data?.days[0].day_number).toBe(1);
      expect(result.data?.days[0].activities.length).toBeGreaterThan(0);
    });

    it("should handle long trips", async () => {
      const request: AIGenerationRequest = {
        destination: "Thailand",
        start_date: "2024-06-01",
        end_date: "2024-06-14", // 13 days
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toHaveLength(13);

      // Each day should have activities
      result.data?.days.forEach((day, index) => {
        expect(day.day_number).toBe(index + 1);
        expect(day.activities.length).toBeGreaterThan(0);
      });
    });

    it("should handle large groups", async () => {
      const request: AIGenerationRequest = {
        destination: "Munich",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 10,
        children_count: 5,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toBeDefined();
      expect(result.data?.days.length).toBeGreaterThan(0);
    });

    it("should handle special characters in destination", async () => {
      const request: AIGenerationRequest = {
        destination: "São Paulo, Brazil 🇧🇷",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toBeDefined();
    });

    it("should handle null optional values", async () => {
      const request: AIGenerationRequest = {
        destination: "Stockholm",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
        budget_total: null,
        budget_currency: null,
        travel_style: null,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      expect(result.data?.days).toBeDefined();
    });
  });

  describe("Mock data consistency", () => {
    it("should generate consistent activity order within days", async () => {
      const request: AIGenerationRequest = {
        destination: "Copenhagen",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      result.data?.days.forEach((day) => {
        day.activities.forEach((activity, index) => {
          expect(activity.activity_order).toBe(index + 1);
        });
      });
    });

    it("should generate unique activity names within a day", async () => {
      const request: AIGenerationRequest = {
        destination: "Helsinki",
        start_date: "2024-06-01",
        end_date: "2024-06-02",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      result.data?.days.forEach((day) => {
        const activityNames = day.activities.map((a) => a.name);
        const uniqueNames = new Set(activityNames);
        expect(uniqueNames.size).toBe(activityNames.length);
      });
    });

    it("should generate reasonable cost distribution", async () => {
      const request: AIGenerationRequest = {
        destination: "Zurich",
        start_date: "2024-06-01",
        end_date: "2024-06-03",
        adults_count: 2,
        children_count: 0,
      };

      const result = await service.generateTravelPlan(request);

      expect(result.success).toBe(true);
      const allActivities = result.data?.days.flatMap((day) => day.activities) || [];
      const costs = allActivities.map((a) => a.cost);

      // Should have a mix of free and paid activities
      const freeCosts = costs.filter((cost) => cost === 0);
      const paidCosts = costs.filter((cost) => cost > 0);

      expect(freeCosts.length + paidCosts.length).toBe(costs.length);
      expect(costs.length).toBeGreaterThan(0);
    });
  });
});
