import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates the travel plan generation form values
 * @param values - form field values
 * @returns error object for each field
 */
export function validateGeneratePlanForm(
  values: import("../types").GeneratePlanFormValues
): Partial<Record<keyof import("../types").GeneratePlanFormValues, string>> {
  const errors: Partial<Record<keyof import("../types").GeneratePlanFormValues, string>> = {};
  if (!values.name || values.name.trim().length < 3) {
    errors.name = "Plan name is required (min. 3 characters)";
  }
  if (!values.destination || values.destination.trim().length < 2) {
    errors.destination = "Destination is required (min. 2 characters)";
  }
  if (!values.startDate) {
    errors.startDate = "Start date is required";
  }
  if (!values.endDate) {
    errors.endDate = "End date is required";
  }
  if (values.startDate && values.endDate && values.startDate >= values.endDate) {
    errors.endDate = "End date must be after start date";
  }
  if (!values.adultsCount || values.adultsCount < 1) {
    errors.adultsCount = "At least 1 adult is required";
  }
  if (values.childrenCount == null || values.childrenCount < 0) {
    errors.childrenCount = "Number of children cannot be negative";
  }
  if (values.budgetTotal != null && (isNaN(values.budgetTotal) || values.budgetTotal < 0)) {
    errors.budgetTotal = "Budget must be a non-negative number";
  }
  if (values.budgetCurrency && !/^[A-Za-z]{3}$/.test(values.budgetCurrency)) {
    errors.budgetCurrency = "Currency must be 3 letters (e.g. PLN, EUR)";
  }
  if (values.travelStyle && !["active", "relaxation", "flexible"].includes(values.travelStyle)) {
    errors.travelStyle = "Invalid travel style";
  }
  return errors;
}
