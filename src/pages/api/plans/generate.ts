import type { APIRoute } from "astro";
import { generatePlanRequestSchema } from "../../../lib/schemas/plan-generation.schema";
import { createPlanInDb } from "../../../lib/services/plan-generation.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import { JobQueueService } from "../../../lib/services/job-queue.service";
import { createApiHandler, createSuccessResponse, createErrorResponse, HTTP_STATUS } from "../../../lib/api-utils";
import { logger } from "../../../lib/services/logger";

export const prerender = false;

/**
 * POST /api/plans/generate
 *
 * Initiates the generation of a new travel plan using AI.
 * The operation is asynchronous - returns a job_id and "processing" status.
 *
 * Request Body (JSON):
 * - name: string (required) - Plan name
 * - destination: string (required) - Travel destination
 * - start_date: string (required) - Start date (ISO format)
 * - end_date: string (required) - End date (ISO format)
 * - adults_count: number (required) - Number of adults (min: 1)
 * - children_count: number (required) - Number of children (min: 0)
 * - budget_total?: number (optional) - Total budget
 * - budget_currency?: string (optional) - Currency code (3 letters)
 * - travel_style?: "active" | "relaxation" | "flexible" (optional)
 *
 * Responses:
 * - 202 Accepted: Plan generation initiated successfully
 * - 400 Bad Request: Invalid input data
 * - 500 Internal Server Error: Server errors
 */
export const POST: APIRoute = createApiHandler({
  bodySchema: generatePlanRequestSchema,
  requireAuthentication: true,
  endpoint: "POST /api/plans/generate",
  logError: (userId: string, message: string) => logGenerationErrorWithoutJobId(userId, message),
  customErrorHandler: async (error, _, user) => {
    // Log error to generation_errors table
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(user.id, errorMessage);
    logger.error("Plan generation DB error", error);

    return createErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "Failed to create plan.",
      undefined,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  },
  handler: async (context, _, body, user) => {
    const { job_id, estimated_completion } = await createPlanInDb(context.locals.supabase, {
      ...body,
      user_id: user.id,
    });

    // Add job to background processing queue
    const jobQueue = JobQueueService.getInstance();
    await jobQueue.addJob(job_id);

    return createSuccessResponse({ job_id, status: "processing", estimated_completion }, HTTP_STATUS.ACCEPTED);
  },
});
