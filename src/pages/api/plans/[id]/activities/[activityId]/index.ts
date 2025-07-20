import type { APIRoute } from "astro";
import {
  planIdSchema,
  activityIdSchema,
  updateActivitySchema,
} from "../../../../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../../../../lib/services/plan-management.service";
import { logApiErrorWithContext } from "../../../../../../lib/services/error-logging.service";
import type { UpdateActivityCommand } from "../../../../../../types";
import { createApiHandler, createSuccessResponse } from "../../../../../../lib/api-utils";

export const prerender = false;

/**
 * PUT /api/plans/{id}/activities/{activityId}
 *
 * Updates specific details of an activity within a travel plan. Users can modify
 * the custom description, opening hours, and cost of an activity. The endpoint
 * ensures proper authorization by verifying that the user owns the plan containing
 * the activity.
 *
 * Path Parameters:
 * - id (required) - UUID of the plan
 * - activityId (required) - UUID of the activity to update
 *
 * Request Body:
 * {
 *   "custom_desc": "string | null",
 *   "opening_hours": "string | null",
 *   "cost": "number | null"
 * }
 *
 * Headers:
 * - Authorization: Bearer {token} - required JWT token
 * - Content-Type: application/json
 *
 * Responses:
 * - 200 OK: Activity successfully updated
 * - 400 Bad Request: Invalid UUID format, request body, or validation errors
 * - 401 Unauthorized: Missing or invalid authorization token
 * - 403 Forbidden: User doesn't own the plan
 * - 404 Not Found: Plan or activity doesn't exist
 * - 500 Internal Server Error: Server or database error
 */
export const PUT: APIRoute = createApiHandler({
  paramValidations: [
    { name: "id", schema: planIdSchema },
    { name: "activityId", schema: activityIdSchema },
  ],
  bodySchema: updateActivitySchema,
  requireAuthentication: true,
  endpoint: "PUT /api/plans/[id]/activities/[activityId]",
  logError: (_, message: string) => logApiErrorWithContext({ error_message: message }),
  handler: async (context, params, body, user) => {
    const { id: planId, activityId } = params as { id: string; activityId: string };
    const { custom_desc, opening_hours, cost } = body;

    // Prepare command for service layer
    const command: UpdateActivityCommand = {
      plan_id: planId,
      activity_id: activityId,
      custom_desc,
      opening_hours,
      cost,
      user_id: user.id,
    };

    // Update the activity using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.updateActivity(command);

    return createSuccessResponse(result);
  },
});
