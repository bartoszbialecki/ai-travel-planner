import type { APIRoute } from "astro";
import { planIdSchema } from "../../../lib/schemas/plan-management.schema";
import { planManagementService } from "../../../lib/services/plan-management.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { logGenerationErrorWithoutJobId } from "../../../lib/services/error-logging.service";

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
 * - Authorization: Bearer {token} - required JWT token (TODO: implement when auth is ready)
 *
 * Responses:
 * - 200 OK: Successfully retrieved plan details
 * - 400 Bad Request: Invalid plan ID format
 * - 401 Unauthorized: Missing or invalid authorization token (TODO: implement)
 * - 403 Forbidden: Plan does not belong to the logged-in user (TODO: implement)
 * - 404 Not Found: Plan with the given ID does not exist
 * - 500 Internal Server Error: Server errors
 */
export const GET: APIRoute = async (context) => {
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

    // TODO: Extract user_id from authorization token when auth is implemented
    // For now, use DEFAULT_USER_ID
    const user_id = DEFAULT_USER_ID;

    // TODO: Validate authorization token and extract user_id
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

    // Retrieve plan details using the service
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
        await logGenerationErrorWithoutJobId(DEFAULT_USER_ID, `GET /api/plans/[id] database error: ${errorMessage}`);

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
    await logGenerationErrorWithoutJobId(DEFAULT_USER_ID, `GET /api/plans/[id] unexpected error: ${errorMessage}`);

    console.error("GET /api/plans/[id] error:", error);

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
