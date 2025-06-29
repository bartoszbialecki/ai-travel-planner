import type { APIRoute } from "astro";
import {
  planIdSchema,
  activityIdSchema,
  toggleActivityCommandSchema,
} from "../../../../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../../../../lib/services/error-logging.service";
import { DEFAULT_USER_ID } from "../../../../../../db/supabase.client";
import type { ActivityRejectResponse, ErrorResponse } from "../../../../../../types";

export const prerender = false;

/**
 * PUT endpoint to reject an activity in a travel plan
 * Sets the activity's accepted status to false
 */
export const PUT: APIRoute = async ({ params, locals }) => {
  try {
    // Stage 1: Request Validation
    const { id: planId, activityId } = params;

    // Validate plan ID format
    const planIdParseResult = planIdSchema.safeParse(planId);
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

    const planIdValid = planIdParseResult.data;
    const activityIdValid = activityIdParseResult.data;

    // Validate the command structure
    const commandValidation = toggleActivityCommandSchema.safeParse({
      plan_id: planIdValid,
      activity_id: activityIdValid,
      accepted: false,
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

    // Stage 2: Business Logic Implementation
    const planManagementService = new PlanManagementService(locals.supabase);

    const result = await planManagementService.rejectActivity(
      {
        plan_id: planIdValid,
        activity_id: activityIdValid,
        accepted: false,
      },
      DEFAULT_USER_ID
    );

    if (!result.success) {
      // Log the error for monitoring
      await logGenerationErrorWithoutJobId(DEFAULT_USER_ID, `Activity rejection failed: ${result.error}`);

      return new Response(
        JSON.stringify({
          error: {
            code: result.errorCode || "REJECTION_FAILED",
            message: result.error,
          },
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stage 3: Success Response
    const response: ActivityRejectResponse = {
      id: activityIdValid,
      accepted: false,
      message: "Activity rejected",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Stage 4: Error Handling Implementation
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Log unexpected errors
    if (locals.supabase) {
      await logGenerationErrorWithoutJobId("unknown", `An unexpected error occurred: ${errorMessage}`);
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while rejecting the activity",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
