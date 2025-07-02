import { useEffect, useState } from "react";
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
      return saved ? { ...defaultValues, ...JSON.parse(saved) } : defaultValues;
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
  const resetDraft = () => {
    setValues(defaultValues);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore localStorage errors
    }
  };

  return { values, setValues, resetDraft };
}
