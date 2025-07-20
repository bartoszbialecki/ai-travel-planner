import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { loginSchema } from "../../../lib/schemas/auth.schema";
import { createApiHandler, createSuccessResponse, createErrorResponse, HTTP_STATUS } from "../../../lib/api-utils";

export const prerender = false;

export const POST: APIRoute = createApiHandler({
  bodySchema: loginSchema,
  requireAuthentication: false,
  endpoint: "POST /api/auth/login",
  handler: async (context, _, body) => {
    const { email, password } = body;
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return createErrorResponse("UNAUTHORIZED", "Invalid email or password", undefined, HTTP_STATUS.UNAUTHORIZED);
    }

    // Return user and tokens without sensitive data
    return createSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    });
  },
});
