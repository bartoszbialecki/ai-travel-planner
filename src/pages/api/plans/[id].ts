import type { APIRoute } from "astro";
import { planIdSchema, deletePlanCommandSchema } from "../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import type { DeletePlanResponse } from "../../../types";
import { createApiHandler, createSuccessResponse, createErrorResponse } from "../../../lib/api-utils";
import { HTTP_STATUS } from "../../../lib/api-utils";

export const prerender = false;

/**
 * GET /api/plans/{id}
 *
 * Retrieves detailed information about a travel plan along with activities grouped by days.
 * Requires authorization and returns complete plan data along with summary statistics.
 *
 * Path Parameters:
 * - id (required) - UUID of the plan to retrieve
 *
 * Headers:
 * - Authorization: Bearer {token} - required JWT token
 *
 * Responses:
 * - 200 OK: Successfully retrieved plan details
 * - 400 Bad Request: Invalid plan ID format
 * - 401 Unauthorized: Missing or invalid authorization token
 * - 403 Forbidden: Plan does not belong to the logged-in user
 * - 404 Not Found: Plan with the given ID does not exist
 * - 500 Internal Server Error: Server errors
 */
export const GET: APIRoute = createApiHandler({
  paramValidations: [{ name: "id", schema: planIdSchema }],
  requireAuthentication: true,
  endpoint: "GET /api/plans/[id]",
  logError: (userId: string, message: string) => logGenerationErrorWithoutJobId(userId, message),
  handler: async (context, params, _, user) => {
    const { id: planId } = params as { id: string };

    // Retrieve plan details using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.getPlanDetails({
      plan_id: planId,
      user_id: user.id,
    });

    return createSuccessResponse(result);
  },
});

/**
 * DELETE /api/plans/{id}
 *
 * Deletes a travel plan and all related data (activities, attractions) from the system.
 * Requires authorization and verifies that the plan belongs to the logged-in user.
 * The operation is irreversible due to cascading deletion in the database.
 *
 * Security Features:
 * - UUID validation prevents SQL injection attempts
 * - User ownership verification ensures users can only delete their own plans
 * - Row Level Security (RLS) provides additional database-level protection
 * - Cascading deletion automatically removes related records (plan_activity, generation_errors)
 *
 * Path Parameters:
 * - id (required) - UUID of the plan to delete
 *
 * Headers:
 * - Authorization: Bearer {token} - required JWT token
 *
 * Responses:
 * - 200 OK: Plan successfully deleted
 * - 400 Bad Request: Invalid plan ID format or command parameters
 * - 401 Unauthorized: Missing or invalid authorization token
 * - 403 Forbidden: Plan does not belong to the logged-in user
 * - 404 Not Found: Plan with the given ID does not exist
 * - 500 Internal Server Error: Server errors
 */
export const DELETE: APIRoute = createApiHandler({
  paramValidations: [{ name: "id", schema: planIdSchema }],
  requireAuthentication: true,
  endpoint: "DELETE /api/plans/[id]",
  logError: (userId: string, message: string) => logGenerationErrorWithoutJobId(userId, message),
  handler: async (context, params, _, user) => {
    const { id: planId } = params as { id: string };

    // Validate the delete command structure
    const commandValidation = deletePlanCommandSchema.safeParse({
      plan_id: planId,
      user_id: user.id,
    });

    if (!commandValidation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid command parameters",
        commandValidation.error.flatten(),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Delete plan using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    await planManagementService.deletePlan({
      plan_id: planId,
      user_id: user.id,
    });

    const response: DeletePlanResponse = {
      message: "Plan deleted successfully",
    };

    return createSuccessResponse(response);
  },
});
