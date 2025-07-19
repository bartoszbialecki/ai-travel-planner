import React, { useState, useRef, useEffect } from "react";
import type { GeneratePlanFormValues } from "../types";
import { validateGeneratePlanForm } from "../lib/utils";
import { useFormDraft } from "./hooks/useFormDraft";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

interface GenerationFormProps {
  onSubmit: (jobId: string) => void;
}

const GenerationForm: React.FC<GenerationFormProps> = ({ onSubmit }) => {
  const { values, setValues, resetDraft } = useFormDraft();
  const [errors, setErrors] = useState<Partial<Record<keyof GeneratePlanFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement | null>(null);

  // Focus first error on submit
  useEffect(() => {
    if (Object.keys(errors).length > 0 && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [errors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setValues((prev) => ({
      ...prev,
      travelStyle: value ? (value as "active" | "relaxation" | "flexible") : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const validation = validateGeneratePlanForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          destination: values.destination,
          start_date: values.startDate,
          end_date: values.endDate,
          adults_count: values.adultsCount,
          children_count: values.childrenCount,
          budget_total: values.budgetTotal,
          budget_currency: values.budgetCurrency,
          travel_style: values.travelStyle,
        }),
      });
      if (res.status === 429) {
        setLimitReached(true);
        setApiError("You have reached the daily limit of 2 plans. Please try again tomorrow.");
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setApiError(data?.error?.message || "An error occurred while generating the plan.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      resetDraft();
      onSubmit(data.job_id);
    } catch {
      setApiError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-labelledby="form-title" data-test-id="generation-form">
      <div className="text-center mb-8">
        <h2 id="form-title" className="text-2xl font-bold text-gray-900 mb-2">
          Plan Details
        </h2>
        <p className="text-gray-600">Fill in the details below to generate your personalized travel itinerary</p>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-6" aria-live="assertive" data-test-id="form-error-alert">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {apiError}
        </Alert>
      )}

      {/* Plan Name */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="name">
          Plan Name *
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g., Summer Vacation in Paris"
          value={values.name}
          onChange={handleChange}
          disabled={loading || limitReached}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "error-name" : undefined}
          ref={errors.name ? firstErrorRef : undefined}
          data-test-id="form-input-name"
          className="h-12 text-base"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1" id="error-name" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="destination">
          Destination *
        </label>
        <Input
          id="destination"
          name="destination"
          type="text"
          placeholder="e.g., Paris, France"
          value={values.destination}
          onChange={handleChange}
          disabled={loading || limitReached}
          aria-required="true"
          aria-invalid={!!errors.destination}
          aria-describedby={errors.destination ? "error-destination" : undefined}
          ref={errors.destination && !errors.name ? firstErrorRef : undefined}
          data-test-id="form-input-destination"
          className="h-12 text-base"
        />
        {errors.destination && (
          <p className="text-red-500 text-sm mt-1" id="error-destination" role="alert">
            {errors.destination}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="startDate">
            Start Date *
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-required="true"
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? "error-startDate" : undefined}
            ref={errors.startDate && !errors.name && !errors.destination ? firstErrorRef : undefined}
            data-test-id="form-input-start-date"
            className="h-12 text-base"
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1" id="error-startDate" role="alert">
              {errors.startDate}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="endDate">
            End Date *
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-required="true"
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? "error-endDate" : undefined}
            ref={errors.endDate && !errors.name && !errors.destination && !errors.startDate ? firstErrorRef : undefined}
            data-test-id="form-input-end-date"
            className="h-12 text-base"
          />
          {errors.endDate && (
            <p className="text-red-500 text-sm mt-1" id="error-endDate" role="alert">
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      {/* Travelers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="adultsCount">
            Adults *
          </label>
          <Input
            id="adultsCount"
            name="adultsCount"
            type="number"
            min={1}
            placeholder="1"
            value={values.adultsCount}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-required="true"
            aria-invalid={!!errors.adultsCount}
            aria-describedby={errors.adultsCount ? "error-adultsCount" : undefined}
            ref={
              errors.adultsCount && !errors.name && !errors.destination && !errors.startDate && !errors.endDate
                ? firstErrorRef
                : undefined
            }
            data-test-id="form-input-adults-count"
            className="h-12 text-base"
          />
          {errors.adultsCount && (
            <p className="text-red-500 text-sm mt-1" id="error-adultsCount" role="alert">
              {errors.adultsCount}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="childrenCount">
            Children
          </label>
          <Input
            id="childrenCount"
            name="childrenCount"
            type="number"
            min={0}
            placeholder="0"
            value={values.childrenCount}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-invalid={!!errors.childrenCount}
            aria-describedby={errors.childrenCount ? "error-childrenCount" : undefined}
            ref={
              errors.childrenCount &&
              !errors.name &&
              !errors.destination &&
              !errors.startDate &&
              !errors.endDate &&
              !errors.adultsCount
                ? firstErrorRef
                : undefined
            }
            data-test-id="form-input-children-count"
            className="h-12 text-base"
          />
          {errors.childrenCount && (
            <p className="text-red-500 text-sm mt-1" id="error-childrenCount" role="alert">
              {errors.childrenCount}
            </p>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="budgetTotal">
            Budget
          </label>
          <Input
            id="budgetTotal"
            name="budgetTotal"
            type="number"
            min={0}
            placeholder="5000"
            value={values.budgetTotal ?? ""}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-invalid={!!errors.budgetTotal}
            aria-describedby={errors.budgetTotal ? "error-budgetTotal" : undefined}
            ref={
              errors.budgetTotal &&
              !errors.name &&
              !errors.destination &&
              !errors.startDate &&
              !errors.endDate &&
              !errors.adultsCount &&
              !errors.childrenCount
                ? firstErrorRef
                : undefined
            }
            data-test-id="form-input-budget-total"
            className="h-12 text-base"
          />
          {errors.budgetTotal && (
            <p className="text-red-500 text-sm mt-1" id="error-budgetTotal" role="alert">
              {errors.budgetTotal}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="budgetCurrency">
            Currency
          </label>
          <Input
            id="budgetCurrency"
            name="budgetCurrency"
            type="text"
            maxLength={3}
            placeholder="USD"
            value={values.budgetCurrency ?? ""}
            onChange={handleChange}
            disabled={loading || limitReached}
            aria-invalid={!!errors.budgetCurrency}
            aria-describedby={errors.budgetCurrency ? "error-budgetCurrency" : undefined}
            ref={
              errors.budgetCurrency &&
              !errors.name &&
              !errors.destination &&
              !errors.startDate &&
              !errors.endDate &&
              !errors.adultsCount &&
              !errors.childrenCount &&
              !errors.budgetTotal
                ? firstErrorRef
                : undefined
            }
            data-test-id="form-input-budget-currency"
            className="h-12 text-base"
          />
          {errors.budgetCurrency && (
            <p className="text-red-500 text-sm mt-1" id="error-budgetCurrency" role="alert">
              {errors.budgetCurrency}
            </p>
          )}
        </div>
      </div>

      {/* Travel Style */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700" htmlFor="travelStyle">
          Travel Style
        </label>
        <Select value={values.travelStyle ?? ""} onValueChange={handleSelectChange} disabled={loading || limitReached}>
          <SelectTrigger
            id="travelStyle"
            aria-invalid={!!errors.travelStyle}
            aria-describedby={errors.travelStyle ? "error-travelStyle" : undefined}
            data-test-id="form-select-travel-style"
            className="h-12 text-base"
          >
            <SelectValue placeholder="Choose your travel style..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active" data-test-id="travel-style-option-active">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Active - Adventure & Exploration
              </div>
            </SelectItem>
            <SelectItem value="relaxation" data-test-id="travel-style-option-relaxation">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Relaxation - Peaceful & Calm
              </div>
            </SelectItem>
            <SelectItem value="flexible" data-test-id="travel-style-option-flexible">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Flexible - Mix of Both
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.travelStyle && (
          <p className="text-red-500 text-sm mt-1" id="error-travelStyle" role="alert">
            {errors.travelStyle}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          type="submit"
          className="w-full h-14 text-lg font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-medium"
          disabled={loading || limitReached}
          aria-disabled={loading || limitReached}
          data-test-id="form-submit-button"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Your Plan...
            </div>
          ) : limitReached ? (
            "Daily Limit Reached"
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Generate Travel Plan
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default GenerationForm;
