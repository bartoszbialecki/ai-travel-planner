import type { APIRoute } from "astro";
import type { GeneratePlanRequest } from "../../../types";
import { generatePlanRequestSchema } from "../../../lib/schemas/plan-generation.schema";
import { createPlanInDb } from "../../../lib/services/plan-generation.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import { JobQueueService } from "../../../lib/services/job-queue.service";
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
export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  // Parse and validate input
  let body: GeneratePlanRequest;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: { code: "bad_request", message: "Invalid JSON in request body." } }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const parseResult = generatePlanRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: { code: "bad_request", message: "Validation failed.", details: parseResult.error.flatten() },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create plan in database
  try {
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { job_id, estimated_completion } = await createPlanInDb(context.locals.supabase, {
      ...parseResult.data,
      user_id: user.id,
    });

    // Add job to background processing queue
    const jobQueue = JobQueueService.getInstance();
    await jobQueue.addJob(job_id);

    return new Response(JSON.stringify({ job_id, status: "processing", estimated_completion }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Log error to generation_errors table
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(user?.id || "", errorMessage);
    logger.error("Plan generation DB error", err);
    return new Response(JSON.stringify({ error: { code: "internal_error", message: "Failed to create plan." } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
