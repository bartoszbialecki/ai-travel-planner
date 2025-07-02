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
    errors.name = "Nazwa planu jest wymagana (min. 3 znaki)";
  }
  if (!values.destination || values.destination.trim().length < 2) {
    errors.destination = "Miejsce docelowe jest wymagane (min. 2 znaki)";
  }
  if (!values.startDate) {
    errors.startDate = "Data rozpoczęcia jest wymagana";
  }
  if (!values.endDate) {
    errors.endDate = "Data zakończenia jest wymagana";
  }
  if (values.startDate && values.endDate && values.startDate >= values.endDate) {
    errors.endDate = "Data zakończenia musi być po dacie rozpoczęcia";
  }
  if (!values.adultsCount || values.adultsCount < 1) {
    errors.adultsCount = "Co najmniej 1 dorosły";
  }
  if (values.childrenCount == null || values.childrenCount < 0) {
    errors.childrenCount = "Liczba dzieci nie może być ujemna";
  }
  if (values.budgetTotal != null && (isNaN(values.budgetTotal) || values.budgetTotal < 0)) {
    errors.budgetTotal = "Budżet musi być liczbą nieujemną";
  }
  if (values.budgetCurrency && !/^[A-Za-z]{3}$/.test(values.budgetCurrency)) {
    errors.budgetCurrency = "Waluta musi mieć 3 litery (np. PLN, EUR)";
  }
  if (values.travelStyle && !["active", "relaxation", "flexible"].includes(values.travelStyle)) {
    errors.travelStyle = "Nieprawidłowy styl podróży";
  }
  return errors;
}
