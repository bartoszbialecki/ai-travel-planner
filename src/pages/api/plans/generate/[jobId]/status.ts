import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerationStatusResponse } from "../../../../../types";
import { getPlanGenerationStatus } from "../../../../../lib/services/plan-generation.service";

import { createApiHandler, createSuccessResponse } from "../../../../../lib/api-utils";

export const prerender = false;

// UUID validation schema
const jobIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Invalid job ID format. Must be a valid UUID."
  );

/**
 * GET /api/plans/generate/{jobId}/status
 *
 * Checks the status of a travel plan generation job.
 * Returns current job status, progress percentage, and plan details if completed.
 * This endpoint is used for polling to monitor the progress of plan generation.
 *
 * URL Parameters:
 * - jobId: string (UUID) - Generation job identifier from plan creation
 *
 * Request Headers:
 * - Authorization: Bearer {token} - required JWT token
 * - Content-Type: application/json (optional, no body required)
 *
 * Response Examples:
 *
 * Success - Processing:
 * {
 *   "job_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "status": "processing",
 *   "progress": 50,
 *   "plan_id": null,
 *   "error_message": null
 * }
 *
 * Success - Completed:
 * {
 *   "job_id": "123e4567-e89b-12d3-a456-426614174001",
 *   "status": "completed",
 *   "progress": 100,
 *   "plan_id": "456e7890-e89b-12d3-a456-426614174001",
 *   "error_message": null
 * }
 *
 * Success - Failed:
 * {
 *   "job_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "status": "failed",
 *   "progress": 0,
 *   "plan_id": null,
 *   "error_message": "AI service temporarily unavailable"
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid jobId format (not a valid UUID)
 * - 401 Unauthorized: Missing or invalid authorization token
 * - 403 Forbidden: Plan with specified jobId doesn't belong to the authenticated user
 * - 404 Not Found: Plan with specified jobId doesn't exist
 * - 500 Internal Server Error: Database or server errors
 *
 * Usage:
 * - Poll this endpoint every 5-10 seconds to monitor generation progress
 * - Stop polling when status is "completed" or "failed"
 * - Use plan_id from completed response to fetch plan details
 */
export const GET: APIRoute = createApiHandler({
  paramValidations: [{ name: "jobId", schema: jobIdSchema }],
  requireAuthentication: true,
  endpoint: "GET /api/plans/generate/[jobId]/status",
  handler: async (context, params) => {
    const { jobId } = params as { jobId: string };

    // Retrieve plan generation status from database using user's context
    const supabase = context.locals.supabase;
    const status = await getPlanGenerationStatus(supabase, jobId);

    // Handle case when plan is not found
    if (!status || status.notFound) {
      return createSuccessResponse(null, 404);
    }

    // Return successful response with generation status
    return createSuccessResponse(status as GenerationStatusResponse);
  },
});
