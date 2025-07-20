import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { createApiHandler, createSuccessResponse, createErrorResponse } from "../../../lib/api-utils";

export const prerender = false;

export const POST: APIRoute = createApiHandler({
  requireAuthentication: true,
  endpoint: "POST /api/auth/logout",
  handler: async (context) => {
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return createErrorResponse("VALIDATION_ERROR", error.message, undefined, 400);
    }

    return createSuccessResponse(null, 200);
  },
});
