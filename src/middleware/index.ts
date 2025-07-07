import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// List of public routes that do not require authentication
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

const AUTH_ONLY_PATHS = ["/auth/login", "/auth/register"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create SSR Supabase instance for the current request and assign to locals
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  locals.supabase = supabase;

  // Always get user session before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and tries to access login/register, redirect to dashboard
  if (user && AUTH_ONLY_PATHS.includes(url.pathname)) {
    return redirect("/");
  }

  // Allow public paths without authentication
  if (PUBLIC_PATHS.includes(url.pathname)) {
    if (user) {
      locals.user = {
        email: user.email ?? "",
        id: user.id ?? "",
      };
    }
    return next();
  }

  if (user) {
    locals.user = {
      email: user.email ?? "",
      id: user.id ?? "",
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/auth/login");
  }

  return next();
});
