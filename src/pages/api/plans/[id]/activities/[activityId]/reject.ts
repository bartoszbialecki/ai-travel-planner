import type { APIRoute } from "astro";
import {
  planIdSchema,
  activityIdSchema,
  toggleActivityCommandSchema,
} from "../../../../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../../../../lib/services/error-logging.service";
import {
  createApiHandler,
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
} from "../../../../../../lib/api-utils";

export const prerender = false;

/**
 * PUT /api/plans/{id}/activities/{activityId}/reject
 *
 * Rejects an activity in a travel plan. Users can reject a specific activity,
 * which means it is removed from the approved plan. The operation requires
 * authorization and verifies user permissions to modify the plan.
 *
 * Path Parameters:
 * - id (required) - UUID of the plan
 * - activityId (required) - UUID of the activity to reject
 *
 * Headers:
 * - Authorization: Bearer {token} - required JWT token
 *
 * Responses:
 * - 200 OK: Activity successfully rejected
 * - 400 Bad Request: Invalid UUID format or input data
 * - 401 Unauthorized: Missing or invalid authorization token
 * - 403 Forbidden: User doesn't have access to the plan
 * - 404 Not Found: Plan or activity doesn't exist
 * - 500 Internal Server Error: Server or database error
 */
export const PUT: APIRoute = createApiHandler({
  paramValidations: [
    { name: "id", schema: planIdSchema },
    { name: "activityId", schema: activityIdSchema },
  ],
  requireAuthentication: true,
  endpoint: "PUT /api/plans/[id]/activities/[activityId]/reject",
  logError: (userId: string, message: string) => logGenerationErrorWithoutJobId(userId, message),
  handler: async (context, params, _, user) => {
    const { id: planId, activityId } = params as { id: string; activityId: string };

    // Validate the command structure
    const commandValidation = toggleActivityCommandSchema.safeParse({
      plan_id: planId,
      activity_id: activityId,
      accepted: false,
    });

    if (!commandValidation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid command parameters",
        commandValidation.error.flatten(),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.rejectActivity(
      {
        plan_id: planId,
        activity_id: activityId,
        accepted: false,
        user_id: user.id,
      },
      user.id
    );

    return createSuccessResponse(result);
  },
});
