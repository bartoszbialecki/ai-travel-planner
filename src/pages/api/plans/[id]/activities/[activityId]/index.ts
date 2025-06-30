import type { APIRoute } from "astro";
import {
  planIdSchema,
  activityIdSchema,
  updateActivitySchema,
} from "../../../../../../lib/schemas/plan-management.schema";
import { planManagementService } from "../../../../../../lib/services/plan-management.service";
import { logApiErrorWithContext } from "../../../../../../lib/services/error-logging.service";
import type { ErrorResponse, UpdateActivityCommand } from "../../../../../../types";

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
 * - Authorization: Bearer {token} - required JWT token (TODO: implement when auth is ready)
 * - Content-Type: application/json
 *
 * Responses:
 * - 200 OK: Activity successfully updated
 * - 400 Bad Request: Invalid UUID format, request body, or validation errors
 * - 401 Unauthorized: Missing or invalid authorization token (TODO: implement)
 * - 403 Forbidden: User doesn't own the plan (TODO: implement)
 * - 404 Not Found: Plan or activity doesn't exist
 * - 500 Internal Server Error: Server or database error
 */
export const PUT: APIRoute = async (context) => {
  let planId: string | undefined;

  try {
    const { id, activityId } = context.params;

    // Validate plan ID format
    const planIdParseResult = planIdSchema.safeParse(id);
    if (!planIdParseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_PLAN_ID",
          message: "Invalid plan ID format",
          details: planIdParseResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate activity ID format
    const activityIdParseResult = activityIdSchema.safeParse(activityId);
    if (!activityIdParseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_ACTIVITY_ID",
          message: "Invalid activity ID format",
          details: activityIdParseResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    planId = planIdParseResult.data;
    const activityIdValid = activityIdParseResult.data;

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body using Zod schema
    const bodyValidation = updateActivitySchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: bodyValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { custom_desc, opening_hours, cost } = bodyValidation.data;

    // TODO: Extract user_id from authorization token when auth is implemented
    // For now, use DEFAULT_USER_ID
    // const authHeader = context.request.headers.get("Authorization");
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return new Response(
    //     JSON.stringify({
    //       error: {
    //         code: "UNAUTHORIZED",
    //         message: "Missing or invalid authorization token",
    //       },
    //     }),
    //     { status: 401, headers: { "Content-Type": "application/json" } }
    //   );
    // }

    // Prepare command for service layer
    const command: UpdateActivityCommand = {
      plan_id: planId,
      activity_id: activityIdValid,
      custom_desc,
      opening_hours,
      cost,
    };

    // Update the activity using the service
    const result = await planManagementService.updateActivity(command);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error cases with appropriate HTTP status codes
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Plan not found (404)
      if (errorMessage === "Plan not found") {
        return new Response(
          JSON.stringify({
            error: {
              code: "PLAN_NOT_FOUND",
              message: "Plan with the given ID does not exist",
            },
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Activity not found (404)
      if (errorMessage === "Activity not found") {
        return new Response(
          JSON.stringify({
            error: {
              code: "ACTIVITY_NOT_FOUND",
              message: "Activity with the given ID does not exist",
            },
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Activity doesn't belong to plan (404)
      if (errorMessage === "Activity does not belong to the plan") {
        return new Response(
          JSON.stringify({
            error: {
              code: "ACTIVITY_NOT_IN_PLAN",
              message: "Activity does not belong to the specified plan",
            },
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Validation errors (400)
      if (errorMessage.includes("required") || errorMessage.includes("invalid")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: errorMessage,
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Database errors (500)
      if (errorMessage.includes("Database error")) {
        // Log database errors for debugging
        await logApiErrorWithContext({
          plan_id: planId,
          error_message: `PUT /api/plans/[id]/activities/[activityId] database error: ${errorMessage}`,
        });

        return new Response(
          JSON.stringify({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred",
            },
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Failed to update activity (500)
      if (errorMessage === "Failed to update activity") {
        await logApiErrorWithContext({
          plan_id: planId,
          error_message: `PUT /api/plans/[id]/activities/[activityId] update failed: ${errorMessage}`,
        });

        return new Response(
          JSON.stringify({
            error: {
              code: "UPDATE_FAILED",
              message: "Failed to update activity",
            },
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Log unexpected errors for debugging
      await logApiErrorWithContext({
        plan_id: planId,
        error_message: `PUT /api/plans/[id]/activities/[activityId] unexpected error: ${errorMessage}`,
      });

      // Return generic error for unexpected cases
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle non-Error objects
    await logApiErrorWithContext({
      plan_id: planId,
      error_message: `PUT /api/plans/[id]/activities/[activityId] unknown error: ${String(error)}`,
    });

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
