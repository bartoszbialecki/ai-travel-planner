import { z } from "zod";

export const generatePlanRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    destination: z.string().trim().min(1, "Destination is required"),
    start_date: z.string().refine(
      (val) => {
        // Check for basic ISO date format (YYYY-MM-DD) or datetime format with timezone
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
        if (!isoDateRegex.test(val)) return false;

        const date = new Date(val);
        // Additional validation to catch dates like 2024-13-01 that pass regex but are invalid
        if (isNaN(date.getTime()) || date.getTime() <= 0) return false;

        // For datetime strings with timezone info, we can't do exact date part matching
        // because timezone conversion affects the final date. Just validate that it's a valid date.
        if (val.includes("T")) {
          return true; // Already validated by regex and Date constructor
        }

        // For simple date strings (YYYY-MM-DD), check if the parsed date matches the input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const expectedDatePart = `${year}-${month}-${day}`;

        return val.startsWith(expectedDatePart);
      },
      { message: "Invalid start_date format" }
    ),
    end_date: z.string().refine(
      (val) => {
        // Check for basic ISO date format (YYYY-MM-DD) or datetime format with timezone
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
        if (!isoDateRegex.test(val)) return false;

        const date = new Date(val);
        // Additional validation to catch dates like 2024-13-01 that pass regex but are invalid
        if (isNaN(date.getTime()) || date.getTime() <= 0) return false;

        // For datetime strings with timezone info, we can't do exact date part matching
        // because timezone conversion affects the final date. Just validate that it's a valid date.
        if (val.includes("T")) {
          return true; // Already validated by regex and Date constructor
        }

        // For simple date strings (YYYY-MM-DD), check if the parsed date matches the input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const expectedDatePart = `${year}-${month}-${day}`;

        return val.startsWith(expectedDatePart);
      },
      { message: "Invalid end_date format" }
    ),
    adults_count: z.number().int().min(1, "At least one adult is required"),
    children_count: z.number().int().min(0, "Children count cannot be negative"),
    budget_total: z.number().positive("Budget must be positive").nullable().optional(),
    budget_currency: z.string().length(3, "Currency must be a 3-letter code").nullable().optional(),
    travel_style: z.enum(["active", "relaxation", "flexible"]).nullable().optional(),
  })
  .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
    message: "start_date must be before end_date",
    path: ["start_date", "end_date"],
  });
