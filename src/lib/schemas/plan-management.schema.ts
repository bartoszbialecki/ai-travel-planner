import { z } from "zod";

/**
 * Schema for validating plan list query parameters
 */
export const planListParamsSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => {
        const num = parseInt(val || "1", 10);
        return Math.max(1, num); // Ensure minimum page is 1
      })
      .pipe(z.number().int().min(1, "Page must be a positive integer")),
    limit: z
      .string()
      .optional()
      .transform((val) => {
        const num = parseInt(val || "10", 10);
        return Math.min(50, Math.max(1, num)); // Ensure limit is between 1 and 50
      })
      .pipe(z.number().int().min(1, "Limit must be at least 1").max(50, "Limit cannot exceed 50")),
    sort: z.enum(["created_at", "name", "destination"]).optional().default("created_at"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict();

/**
 * Schema for validating plan ID parameter
 */
export const planIdSchema = z.string().uuid("Invalid plan ID format");

/**
 * Schema for validating activity ID parameter
 */
export const activityIdSchema = z.string().uuid("Invalid activity ID format");

/**
 * Schema for validating activity update requests
 */
export const updateActivitySchema = z
  .object({
    custom_desc: z.string().max(1000, "Custom description cannot exceed 1000 characters").optional(),
    opening_hours: z.string().max(255, "Opening hours cannot exceed 255 characters").optional(),
    cost: z.number().min(0, "Cost must be non-negative").optional(),
  })
  .strict();

/**
 * Schema for validating plan deletion command
 */
export const deletePlanCommandSchema = z
  .object({
    plan_id: z.string().uuid("Invalid plan ID format"),
    user_id: z.string().min(1, "User ID is required"),
  })
  .strict();

/**
 * Schema for validating activity toggle command
 */
export const toggleActivityCommandSchema = z
  .object({
    plan_id: z.string().uuid("Invalid plan ID format"),
    activity_id: z.string().uuid("Invalid activity ID format"),
    accepted: z.boolean(),
  })
  .strict();
