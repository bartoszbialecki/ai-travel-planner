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
    <form className="space-y-4 px-2 sm:px-0 max-w-lg w-full" onSubmit={handleSubmit} aria-labelledby="form-title">
      <h2 id="form-title" className="text-xl font-bold mb-2">
        Generate travel plan
      </h2>
      {apiError && (
        <Alert variant="destructive" className="mb-2" aria-live="assertive">
          {apiError}
        </Alert>
      )}
      <div>
        <label className="block font-medium mb-1" htmlFor="name">
          Plan name *
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          disabled={loading || limitReached}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "error-name" : undefined}
          ref={errors.name ? firstErrorRef : undefined}
        />
        {errors.name && (
          <Alert variant="destructive" id="error-name" className="mt-1">
            {errors.name}
          </Alert>
        )}
      </div>
      <div>
        <label className="block font-medium mb-1" htmlFor="destination">
          Destination *
        </label>
        <Input
          id="destination"
          name="destination"
          type="text"
          value={values.destination}
          onChange={handleChange}
          disabled={loading || limitReached}
          aria-required="true"
          aria-invalid={!!errors.destination}
          aria-describedby={errors.destination ? "error-destination" : undefined}
          ref={errors.destination && !errors.name ? firstErrorRef : undefined}
        />
        {errors.destination && (
          <Alert variant="destructive" id="error-destination" className="mt-1">
            {errors.destination}
          </Alert>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="startDate">
            Start date *
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
          />
          {errors.startDate && (
            <Alert variant="destructive" id="error-startDate" className="mt-1">
              {errors.startDate}
            </Alert>
          )}
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="endDate">
            End date *
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
          />
          {errors.endDate && (
            <Alert variant="destructive" id="error-endDate" className="mt-1">
              {errors.endDate}
            </Alert>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="adultsCount">
            Adults *
          </label>
          <Input
            id="adultsCount"
            name="adultsCount"
            type="number"
            min={1}
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
          />
          {errors.adultsCount && (
            <Alert variant="destructive" id="error-adultsCount" className="mt-1">
              {errors.adultsCount}
            </Alert>
          )}
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="childrenCount">
            Children
          </label>
          <Input
            id="childrenCount"
            name="childrenCount"
            type="number"
            min={0}
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
          />
          {errors.childrenCount && (
            <Alert variant="destructive" id="error-childrenCount" className="mt-1">
              {errors.childrenCount}
            </Alert>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="budgetTotal">
            Budget
          </label>
          <Input
            id="budgetTotal"
            name="budgetTotal"
            type="number"
            min={0}
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
          />
          {errors.budgetTotal && (
            <Alert variant="destructive" id="error-budgetTotal" className="mt-1">
              {errors.budgetTotal}
            </Alert>
          )}
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1" htmlFor="budgetCurrency">
            Currency
          </label>
          <Input
            id="budgetCurrency"
            name="budgetCurrency"
            type="text"
            maxLength={3}
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
          />
          {errors.budgetCurrency && (
            <Alert variant="destructive" id="error-budgetCurrency" className="mt-1">
              {errors.budgetCurrency}
            </Alert>
          )}
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1" htmlFor="travelStyle">
          Travel style
        </label>
        <Select value={values.travelStyle ?? ""} onValueChange={handleSelectChange} disabled={loading || limitReached}>
          <SelectTrigger
            id="travelStyle"
            aria-invalid={!!errors.travelStyle}
            aria-describedby={errors.travelStyle ? "error-travelStyle" : undefined}
          >
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="relaxation">Relaxation</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
        {errors.travelStyle && (
          <Alert variant="destructive" id="error-travelStyle" className="mt-1">
            {errors.travelStyle}
          </Alert>
        )}
      </div>
      <Button
        type="submit"
        className="w-full py-3 text-base"
        disabled={loading || limitReached}
        aria-disabled={loading || limitReached}
      >
        {loading ? "Generating..." : limitReached ? "Daily limit reached" : "Generate plan"}
      </Button>
    </form>
  );
};

export default GenerationForm;
