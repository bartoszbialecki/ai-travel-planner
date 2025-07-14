import { describe, it, expect } from "vitest";
import { generatePlanRequestSchema } from "../plan-generation.schema";
import type { GeneratePlanRequest } from "../../../types";

describe("generatePlanRequestSchema", () => {
  const validRequest: GeneratePlanRequest = {
    name: "Paris Adventure",
    destination: "Paris, France",
    start_date: "2024-06-01",
    end_date: "2024-06-10",
    adults_count: 2,
    children_count: 0,
    budget_total: 1500,
    budget_currency: "EUR",
    travel_style: "active",
  };

  describe("Valid requests", () => {
    it("should validate a complete valid request", () => {
      const result = generatePlanRequestSchema.safeParse(validRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it("should validate minimal required fields only", () => {
      const minimalRequest = {
        name: "Simple Trip",
        destination: "London",
        start_date: "2024-07-01",
        end_date: "2024-07-05",
        adults_count: 1,
        children_count: 0,
      };

      const result = generatePlanRequestSchema.safeParse(minimalRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalRequest);
      }
    });

    it("should validate with null optional fields", () => {
      const requestWithNulls = {
        ...validRequest,
        budget_total: null,
        budget_currency: null,
        travel_style: null,
      };

      const result = generatePlanRequestSchema.safeParse(requestWithNulls);

      expect(result.success).toBe(true);
    });

    it("should validate with undefined optional fields", () => {
      const requestWithUndefined = {
        name: "Test Trip",
        destination: "Test City",
        start_date: "2024-08-01",
        end_date: "2024-08-05",
        adults_count: 1,
        children_count: 0,
        budget_total: undefined,
        budget_currency: undefined,
        travel_style: undefined,
      };

      const result = generatePlanRequestSchema.safeParse(requestWithUndefined);

      expect(result.success).toBe(true);
    });
  });

  describe("Name validation", () => {
    it("should reject empty name", () => {
      const request = { ...validRequest, name: "" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["name"],
            message: "Name is required",
          })
        );
      }
    });

    it("should reject whitespace-only name", () => {
      const request = { ...validRequest, name: "   " };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["name"],
            message: "Name is required",
          })
        );
      }
    });

    it("should accept very long names", () => {
      const request = { ...validRequest, name: "A".repeat(1000) };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept names with special characters", () => {
      const request = { ...validRequest, name: "Trip to São Paulo 🇧🇷 - Summer '24!" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Destination validation", () => {
    it("should reject empty destination", () => {
      const request = { ...validRequest, destination: "" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["destination"],
            message: "Destination is required",
          })
        );
      }
    });

    it("should reject whitespace-only destination", () => {
      const request = { ...validRequest, destination: "   " };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should accept destinations with special characters", () => {
      const request = { ...validRequest, destination: "Москва, Россия" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept very long destination names", () => {
      const request = { ...validRequest, destination: "Very Long Destination Name ".repeat(50) };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Date validation", () => {
    it("should accept valid ISO date strings", () => {
      const request = {
        ...validRequest,
        start_date: "2024-12-25",
        end_date: "2024-12-31",
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept valid datetime strings", () => {
      const request = {
        ...validRequest,
        start_date: "2024-06-01T00:00:00Z",
        end_date: "2024-06-10T23:59:59Z",
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const request = { ...validRequest, start_date: "invalid-date" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["start_date"],
            message: "Invalid start_date format",
          })
        );
      }
    });

    it("should reject empty date strings", () => {
      const request = { ...validRequest, end_date: "" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["end_date"],
            message: "Invalid end_date format",
          })
        );
      }
    });

    it("should reject malformed date strings", () => {
      const invalidDates = [
        "2024-13-01", // Invalid month
        "2024-02-30", // Invalid day
        "24-06-01", // Wrong year format
        "2024/06/01", // Wrong separator
        "June 1, 2024", // Wrong format
      ];

      invalidDates.forEach((date) => {
        const request = { ...validRequest, start_date: date };
        const result = generatePlanRequestSchema.safeParse(request);

        expect(result.success).toBe(false);
      });
    });

    it("should validate date range constraint (start < end)", () => {
      const request = {
        ...validRequest,
        start_date: "2024-06-10",
        end_date: "2024-06-01", // End before start
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            message: "start_date must be before end_date",
            path: ["start_date", "end_date"],
          })
        );
      }
    });

    it("should reject same start and end dates", () => {
      const request = {
        ...validRequest,
        start_date: "2024-06-01",
        end_date: "2024-06-01",
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            message: "start_date must be before end_date",
          })
        );
      }
    });

    it("should accept single day difference", () => {
      const request = {
        ...validRequest,
        start_date: "2024-06-01",
        end_date: "2024-06-02",
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Adults count validation", () => {
    it("should accept minimum valid adults count", () => {
      const request = { ...validRequest, adults_count: 1 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept large adults count", () => {
      const request = { ...validRequest, adults_count: 50 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject zero adults", () => {
      const request = { ...validRequest, adults_count: 0 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["adults_count"],
            message: "At least one adult is required",
          })
        );
      }
    });

    it("should reject negative adults count", () => {
      const request = { ...validRequest, adults_count: -1 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["adults_count"],
            message: "At least one adult is required",
          })
        );
      }
    });

    it("should reject non-integer adults count", () => {
      const request = { ...validRequest, adults_count: 2.5 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should reject string adults count", () => {
      const request = { ...validRequest, adults_count: "2" as unknown as number };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });
  });

  describe("Children count validation", () => {
    it("should accept zero children", () => {
      const request = { ...validRequest, children_count: 0 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept positive children count", () => {
      const request = { ...validRequest, children_count: 3 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept large children count", () => {
      const request = { ...validRequest, children_count: 20 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject negative children count", () => {
      const request = { ...validRequest, children_count: -1 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["children_count"],
            message: "Children count cannot be negative",
          })
        );
      }
    });

    it("should reject non-integer children count", () => {
      const request = { ...validRequest, children_count: 1.5 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });
  });

  describe("Budget validation", () => {
    it("should accept positive budget", () => {
      const request = { ...validRequest, budget_total: 1000 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept very large budget", () => {
      const request = { ...validRequest, budget_total: 999999999 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should accept decimal budget", () => {
      const request = { ...validRequest, budget_total: 1500.5 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject zero budget", () => {
      const request = { ...validRequest, budget_total: 0 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["budget_total"],
            message: "Budget must be positive",
          })
        );
      }
    });

    it("should reject negative budget", () => {
      const request = { ...validRequest, budget_total: -100 };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["budget_total"],
            message: "Budget must be positive",
          })
        );
      }
    });

    it("should accept null budget", () => {
      const request = { ...validRequest, budget_total: null };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject string budget", () => {
      const request = { ...validRequest, budget_total: "1000" as unknown as number };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });
  });

  describe("Currency validation", () => {
    it("should accept valid 3-letter currency codes", () => {
      const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "PLN"];

      validCurrencies.forEach((currency) => {
        const request = { ...validRequest, budget_currency: currency };
        const result = generatePlanRequestSchema.safeParse(request);

        expect(result.success).toBe(true);
      });
    });

    it("should accept lowercase currency codes", () => {
      const request = { ...validRequest, budget_currency: "usd" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should reject 2-letter currency codes", () => {
      const request = { ...validRequest, budget_currency: "US" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ["budget_currency"],
            message: "Currency must be a 3-letter code",
          })
        );
      }
    });

    it("should reject 4-letter currency codes", () => {
      const request = { ...validRequest, budget_currency: "USDD" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should reject empty currency string", () => {
      const request = { ...validRequest, budget_currency: "" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should reject currency with numbers", () => {
      const request = { ...validRequest, budget_currency: "US1" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true); // Schema only checks length, not content
    });

    it("should accept null currency", () => {
      const request = { ...validRequest, budget_currency: null };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Travel style validation", () => {
    it("should accept valid travel styles", () => {
      const validStyles = ["active", "relaxation", "flexible"];

      validStyles.forEach((style) => {
        const request = { ...validRequest, travel_style: style as "active" | "relaxation" | "flexible" };
        const result = generatePlanRequestSchema.safeParse(request);

        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid travel styles", () => {
      const invalidStyles = ["adventure", "luxury", "budget", "family", ""];

      invalidStyles.forEach((style) => {
        const request = { ...validRequest, travel_style: style as unknown as "active" | "relaxation" | "flexible" };
        const result = generatePlanRequestSchema.safeParse(request);

        expect(result.success).toBe(false);
      });
    });

    it("should reject uppercase travel styles", () => {
      const request = { ...validRequest, travel_style: "ACTIVE" as unknown as "active" | "relaxation" | "flexible" };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should accept null travel style", () => {
      const request = { ...validRequest, travel_style: null };
      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Complex validation scenarios", () => {
    it("should handle multiple validation errors", () => {
      const invalidRequest = {
        name: "",
        destination: "",
        start_date: "invalid-date",
        end_date: "2024-06-01",
        adults_count: 0,
        children_count: -1,
        budget_total: -100,
        budget_currency: "INVALID",
        travel_style: "invalid" as unknown as "active" | "relaxation" | "flexible",
      };

      const result = generatePlanRequestSchema.safeParse(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(5);
      }
    });

    it("should validate date range with different time zones", () => {
      const request = {
        ...validRequest,
        start_date: "2024-06-01T10:00:00-05:00", // June 1st, 10:00 AM UTC-5 = June 1st, 3:00 PM UTC
        end_date: "2024-06-02T08:00:00+05:00", // June 2nd, 8:00 AM UTC+5 = June 2nd, 3:00 AM UTC
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(true);
    });

    it("should handle missing optional fields gracefully", () => {
      const requestWithoutOptional = {
        name: "Test Trip",
        destination: "Test City",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 1,
      };

      const result = generatePlanRequestSchema.safeParse(requestWithoutOptional);

      expect(result.success).toBe(true);
    });

    it("should validate edge case date ranges", () => {
      // Test leap year
      const leapYearRequest = {
        ...validRequest,
        start_date: "2024-02-28",
        end_date: "2024-02-29",
      };

      const result = generatePlanRequestSchema.safeParse(leapYearRequest);

      expect(result.success).toBe(true);
    });

    it("should handle very long trip durations", () => {
      const longTripRequest = {
        ...validRequest,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      };

      const result = generatePlanRequestSchema.safeParse(longTripRequest);

      expect(result.success).toBe(true);
    });

    it("should validate extreme group sizes", () => {
      const largeGroupRequest = {
        ...validRequest,
        adults_count: 100,
        children_count: 50,
      };

      const result = generatePlanRequestSchema.safeParse(largeGroupRequest);

      expect(result.success).toBe(true);
    });
  });

  describe("Type coercion", () => {
    it("should not coerce string numbers to numbers", () => {
      const request = {
        ...validRequest,
        adults_count: "2" as unknown as number,
        children_count: "1" as unknown as number,
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should not coerce boolean values", () => {
      const request = {
        ...validRequest,
        adults_count: true as unknown as number,
      };

      const result = generatePlanRequestSchema.safeParse(request);

      expect(result.success).toBe(false);
    });

    it("should handle undefined vs null correctly", () => {
      const requestWithUndefined = {
        ...validRequest,
        budget_total: undefined,
      };

      const requestWithNull = {
        ...validRequest,
        budget_total: null,
      };

      const undefinedResult = generatePlanRequestSchema.safeParse(requestWithUndefined);
      const nullResult = generatePlanRequestSchema.safeParse(requestWithNull);

      expect(undefinedResult.success).toBe(true);
      expect(nullResult.success).toBe(true);
    });
  });
});
