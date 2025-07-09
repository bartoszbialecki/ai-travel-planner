import type { APIRoute } from "astro";
import type { GenerationStatusResponse, ErrorResponse } from "../../../../../types";
import { getPlanGenerationStatus } from "../../../../../lib/services/plan-generation.service";
import { createSupabaseServiceRoleClient } from "../../../../../db/supabase.client";

export const prerender = false;

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
 *   "job_id": "123e4567-e89b-12d3-a456-426614174000",
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
 * - 404 Not Found: Plan with specified jobId doesn't exist
 * - 500 Internal Server Error: Database or server errors
 *
 * Usage:
 * - Poll this endpoint every 5-10 seconds to monitor generation progress
 * - Stop polling when status is "completed" or "failed"
 * - Use plan_id from completed response to fetch plan details
 */
export const GET: APIRoute = async (context) => {
  const { jobId } = context.params;

  // Step 1: Request Validation
  // Validate UUID format of jobId using RFC 4122 pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!jobId || !uuidRegex.test(jobId)) {
    const errorResponse: ErrorResponse = {
      error: {
        code: "INVALID_JOB_ID",
        message: "Invalid job ID format. Must be a valid UUID.",
        details: {
          field: "jobId",
          issue: "Invalid UUID format",
          provided: jobId,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Step 2: Business Logic via service
    // Retrieve plan generation status from database
    const supabase = createSupabaseServiceRoleClient();
    const status = await getPlanGenerationStatus(supabase, jobId);

    // Handle case when plan is not found
    if (status.notFound) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "PLAN_NOT_FOUND",
          message: "Plan with specified job ID not found.",
          details: {
            job_id: jobId,
          },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Response
    // Return successful response with generation status
    return new Response(JSON.stringify(status as GenerationStatusResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Step 4: Error Handling
    // Log error (optional, if you want to log here)
    // await logGenerationError(jobId, errorMessage, { endpoint: "GET /api/plans/generate/[jobId]/status" });

    // Return generic error response for unexpected errors
    const errorResponse: ErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error occurred while processing request.",
        details: {
          job_id: jobId,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
