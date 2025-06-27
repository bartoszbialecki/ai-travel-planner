import { z } from "zod";

export const generatePlanRequestSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    destination: z.string().min(1, "Destination is required"),
    start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start_date format" }),
    end_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end_date format" }),
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
