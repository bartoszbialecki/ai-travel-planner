import type { APIRoute } from "astro";
import { planListParamsSchema } from "../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import { createApiHandler, createSuccessResponse, createErrorResponse, HTTP_STATUS } from "../../../lib/api-utils";

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
export const GET: APIRoute = createApiHandler({
  requireAuthentication: true,
  endpoint: "GET /api/plans",
  logError: (userId: string, message: string) => logGenerationErrorWithoutJobId(userId, message),
  handler: async (context, _, __, user) => {
    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const parseResult = planListParamsSchema.safeParse(queryParams);
    if (!parseResult.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        parseResult.error.flatten(),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const { page, limit, sort, order } = parseResult.data;

    // Retrieve plans using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.listPlans({
      user_id: user.id,
      page,
      limit,
      sort,
      order,
    });

    return createSuccessResponse(result);
  },
});
