import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { logger } from "../../../lib/services/logger";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parseResult.error.flatten() }), {
        status: 400,
      });
    }
    const { email, password } = parseResult.data;
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      // Handle Supabase error codes for user exists, weak password, etc.
      const message = error.message || "Registration failed";
      const code = error.status || 400;
      return new Response(JSON.stringify({ error: message }), { status: code });
    }
    // Inform user about email confirmation
    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email to confirm your account before logging in.",
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
      }),
      { status: 200 }
    );
  } catch (err) {
    logger.error("Register error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
