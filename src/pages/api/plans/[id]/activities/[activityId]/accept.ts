import type { APIRoute } from "astro";
import {
  planIdSchema,
  activityIdSchema,
  toggleActivityCommandSchema,
} from "../../../../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../../../../lib/services/error-logging.service";
import type { ErrorResponse } from "../../../../../../types";
import { logger } from "@/lib/services/logger";

export const prerender = false;

/**
 * PUT /api/plans/{id}/activities/{activityId}/accept
 *
 * Accepts an activity in a travel plan. Users can accept a specific activity,
 * which means it becomes part of the approved plan. The operation requires
 * authorization and verifies user permissions to modify the plan.
 *
 * Path Parameters:
 * - id (required) - UUID of the plan
 * - activityId (required) - UUID of the activity to accept
 *
 * Headers:
 * - Authorization: Bearer {token} - required JWT token (TODO: implement when auth is ready)
 *
 * Responses:
 * - 200 OK: Activity successfully accepted
 * - 400 Bad Request: Invalid UUID format or input data
 * - 401 Unauthorized: Missing or invalid authorization token (TODO: implement)
 * - 403 Forbidden: User doesn't have access to the plan (TODO: implement)
 * - 404 Not Found: Plan or activity doesn't exist
 * - 500 Internal Server Error: Server or database error
 */
export const PUT: APIRoute = async (context) => {
  const user = context.locals.user;
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

    const planId = planIdParseResult.data;
    const activityIdValid = activityIdParseResult.data;

    // Validate the command structure
    const commandValidation = toggleActivityCommandSchema.safeParse({
      plan_id: planId,
      activity_id: activityIdValid,
      accepted: true,
    });

    if (!commandValidation.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_COMMAND",
          message: "Invalid command parameters",
          details: commandValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use authenticated user id from locals
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.acceptActivity({
      plan_id: planId,
      activity_id: activityIdValid,
      accepted: true,
    });

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
        await logGenerationErrorWithoutJobId(
          user && user.id ? user.id : "",
          `PUT /api/plans/[id]/activities/[activityId]/accept database error: ${errorMessage}`
        );

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

      // Network or connection errors (503)
      if (errorMessage.includes("network") || errorMessage.includes("connection") || errorMessage.includes("timeout")) {
        await logGenerationErrorWithoutJobId(
          user && user.id ? user.id : "",
          `PUT /api/plans/[id]/activities/[activityId]/accept network error: ${errorMessage}`
        );

        return new Response(
          JSON.stringify({
            error: {
              code: "SERVICE_UNAVAILABLE",
              message: "Service temporarily unavailable",
            },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Log unexpected errors for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(
      user && user.id ? user.id : "",
      `PUT /api/plans/[id]/activities/[activityId]/accept unexpected error: ${errorMessage}`
    );

    logger.error("PUT /api/plans/[id]/activities/[activityId]/accept error:", error);

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
