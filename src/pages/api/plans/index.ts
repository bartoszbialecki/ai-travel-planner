import type { APIRoute } from "astro";
import { planListParamsSchema } from "../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import { logger } from "../../../lib/services/logger";

export const prerender = false;

/**
 * GET /api/plans
 *
 * Retrieves a paginated list of travel plans for the logged-in user.
 * Supports pagination and sorting.
 *
 * Query Parameters:
 * - page (optional, default: 1) - page number
 * - limit (optional, default: 10, max: 50) - number of items per page
 * - sort (optional, default: "created_at") - sort column ("created_at", "name", "destination")
 * - order (optional, default: "desc") - sort direction ("asc", "desc")
 *
 * Responses:
 * - 200 OK: Successfully retrieved plan list
 * - 400 Bad Request: Invalid query parameters
 * - 500 Internal Server Error: Server errors
 */
export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  try {
    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const parseResult = planListParamsSchema.safeParse(queryParams);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETERS",
            message: "Invalid query parameters",
            details: parseResult.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit, sort, order } = parseResult.data;

    // Use authenticated user id from locals
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user_id = user.id;

    // Retrieve plans using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.listPlans({
      user_id,
      page,
      limit,
      sort,
      order,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(user?.id || "", `GET /api/plans error: ${errorMessage}`);

    logger.error("GET /api/plans error:", error);

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
