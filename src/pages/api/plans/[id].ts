import type { APIRoute } from "astro";
import { planIdSchema, deletePlanCommandSchema } from "../../../lib/schemas/plan-management.schema";
import { PlanManagementService } from "../../../lib/services/plan-management.service";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";
import type { DeletePlanResponse, ErrorResponse } from "../../../types";
import { logger } from "../../../lib/services/logger";

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
export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  try {
    const { id } = context.params;

    // Validate plan ID format
    const parseResult = planIdSchema.safeParse(id);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PLAN_ID",
            message: "Invalid plan ID format",
            details: parseResult.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const planId = parseResult.data;

    // Use authenticated user id from locals
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user_id = user.id;

    // Retrieve plan details using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.getPlanDetails({
      plan_id: planId,
      user_id,
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
        await logGenerationErrorWithoutJobId(user?.id || "", `GET /api/plans/[id] database error: ${errorMessage}`);

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
    }

    // Log unexpected errors for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(user?.id || "", `GET /api/plans/[id] unexpected error: ${errorMessage}`);

    logger.error("GET /api/plans/[id] error:", error);

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
export const DELETE: APIRoute = async (context) => {
  const user = context.locals.user;
  try {
    const { id } = context.params;

    // Validate plan ID format
    const parseResult = planIdSchema.safeParse(id);
    if (!parseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_PLAN_ID",
          message: "Invalid plan ID format",
          details: parseResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const planId = parseResult.data;

    // Use authenticated user id from locals
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user_id = user.id;

    // Validate the delete command structure
    const commandValidation = deletePlanCommandSchema.safeParse({
      plan_id: planId,
      user_id,
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

    // Delete plan using the service
    const planManagementService = new PlanManagementService(context.locals.supabase);
    await planManagementService.deletePlan({
      plan_id: planId,
      user_id,
    });

    const response: DeletePlanResponse = {
      message: "Plan deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error cases with appropriate HTTP status codes
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Plan not found (404)
      if (errorMessage === "Plan not found") {
        const errorResponse: ErrorResponse = {
          error: {
            code: "PLAN_NOT_FOUND",
            message: "Plan with the given ID does not exist",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validation errors (400)
      if (errorMessage.includes("required") || errorMessage.includes("invalid")) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: errorMessage,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Permission errors (403) - when plan exists but doesn't belong to user
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("access") ||
        errorMessage.includes("forbidden")
      ) {
        const errorResponse: ErrorResponse = {
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this plan",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Database errors (500)
      if (errorMessage.includes("Database error")) {
        // Log database errors for debugging
        await logGenerationErrorWithoutJobId(user?.id || "", `DELETE /api/plans/[id] database error: ${errorMessage}`);

        const errorResponse: ErrorResponse = {
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log unexpected errors for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    await logGenerationErrorWithoutJobId(user?.id || "", `DELETE /api/plans/[id] unexpected error: ${errorMessage}`);

    logger.error("DELETE /api/plans/[id] error:", error);

    const errorResponse: ErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
