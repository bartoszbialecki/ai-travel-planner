import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { createApiHandler, createSuccessResponse, createErrorResponse, HTTP_STATUS } from "../../../lib/api-utils";

export const prerender = false;

export const POST: APIRoute = createApiHandler({
  bodySchema: registerSchema,
  requireAuthentication: false,
  endpoint: "POST /api/auth/register",
  handler: async (context, _, body) => {
    const { email, password } = body;
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      // Handle Supabase error codes for user exists, weak password, etc.
      const message = error.message || "Registration failed";
      const code = error.status || HTTP_STATUS.BAD_REQUEST;
      return createErrorResponse("VALIDATION_ERROR", message, undefined, code);
    }

    // Inform user about email confirmation
    return createSuccessResponse({
      message: "Registration successful. Please check your email to confirm your account before logging in.",
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  },
});
