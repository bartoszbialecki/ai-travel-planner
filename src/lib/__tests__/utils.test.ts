import { describe, it, expect } from "vitest";
import { validateGeneratePlanForm } from "../utils";
import type { GeneratePlanFormValues } from "../../types";

describe("validateGeneratePlanForm", () => {
  it("returns no errors for valid data", () => {
    const validData: GeneratePlanFormValues = {
      name: "Paris Trip",
      destination: "Paris",
      startDate: "2024-06-01",
      endDate: "2024-06-07",
      adultsCount: 2,
      childrenCount: 0,
      budgetTotal: 5000,
      budgetCurrency: "EUR",
      travelStyle: "active",
    };

    const errors = validateGeneratePlanForm(validData);
    expect(errors).toEqual({});
  });

  it("returns errors for invalid data", () => {
    const invalidData: GeneratePlanFormValues = {
      name: "ab", // Too short
      destination: "a", // Too short
      startDate: "",
      endDate: "",
      adultsCount: 0,
      childrenCount: 0,
      budgetTotal: undefined,
      budgetCurrency: undefined,
      travelStyle: undefined,
    };

    const errors = validateGeneratePlanForm(invalidData);
    expect(errors).toEqual({
      name: "Plan name is required (min. 3 characters)",
      destination: "Destination is required (min. 2 characters)",
      startDate: "Start date is required",
      endDate: "End date is required",
      adultsCount: "At least 1 adult is required",
    });
  });

  it("validates date range correctly", () => {
    const invalidDateData: GeneratePlanFormValues = {
      name: "Paris Trip",
      destination: "Paris",
      startDate: "2024-06-07",
      endDate: "2024-06-01", // End before start
      adultsCount: 2,
      childrenCount: 0,
      budgetTotal: 5000,
      budgetCurrency: "EUR",
      travelStyle: "active",
    };

    const errors = validateGeneratePlanForm(invalidDateData);
    expect(errors).toEqual({
      endDate: "End date must be after start date",
    });
  });

  it("validates budget fields correctly", () => {
    const invalidBudgetData: GeneratePlanFormValues = {
      name: "Paris Trip",
      destination: "Paris",
      startDate: "2024-06-01",
      endDate: "2024-06-07",
      adultsCount: 2,
      childrenCount: 0,
      budgetTotal: -100, // Negative budget
      budgetCurrency: "INVALID", // Invalid currency
      travelStyle: "active",
    };

    const errors = validateGeneratePlanForm(invalidBudgetData);
    expect(errors).toEqual({
      budgetTotal: "Budget must be a non-negative number",
      budgetCurrency: "Currency must be 3 letters (e.g. PLN, EUR)",
    });
  });
});
