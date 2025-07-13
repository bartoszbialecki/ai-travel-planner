import { useCallback, useEffect, useState } from "react";
import type { GeneratePlanFormValues } from "../../types";

const DRAFT_KEY = "plan-generation-draft";

const defaultValues: GeneratePlanFormValues = {
  name: "",
  destination: "",
  startDate: "",
  endDate: "",
  adultsCount: 1,
  childrenCount: 0,
  budgetTotal: undefined,
  budgetCurrency: undefined,
  travelStyle: undefined,
};

/**
 * Custom hook for autosaving and loading the plan generation form draft from localStorage
 */
export function useFormDraft() {
  const [values, setValues] = useState<GeneratePlanFormValues>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return defaultValues;

      const parsed = JSON.parse(saved);
      // Filter out only valid properties to avoid extra properties
      const filteredDraft: Partial<GeneratePlanFormValues> = {};
      const validKeys = Object.keys(defaultValues) as (keyof GeneratePlanFormValues)[];

      validKeys.forEach((key) => {
        if (parsed[key] !== undefined) {
          filteredDraft[key] = parsed[key];
        }
      });

      return { ...defaultValues, ...filteredDraft };
    } catch {
      // Ignore JSON parse/localStorage errors
      return defaultValues;
    }
  });

  // Autosave draft to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      // Ignore localStorage errors
    }
  }, [values]);

  // Reset draft (e.g. after successful submission)
  const resetDraft = useCallback(() => {
    setValues(defaultValues);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return { values, setValues, resetDraft };
}
