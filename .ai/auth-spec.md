# Authentication Module Architecture Specification - AI Travel Planner

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page and Layout Structure

#### 1.1.1 New Astro Pages

**`src/pages/auth/login.astro`**

- Login page with React form
- Layout: `AuthLayout.astro` (special layout for authentication pages)
- React component: `LoginForm.tsx`
- Routing: `/auth/login`
- Behavior: redirect to dashboard after login

**`src/pages/auth/register.astro`**

- Registration page with React form
- Layout: `AuthLayout.astro`
- React component: `RegisterForm.tsx`
- Routing: `/auth/register`
- Behavior: redirect to dashboard after registration

**`src/pages/auth/forgot-password.astro`**

- Password recovery page
- Layout: `AuthLayout.astro`
- React component: `ForgotPasswordForm.tsx`
- Routing: `/auth/forgot-password`

**`src/pages/auth/reset-password.astro`**

- Password reset page (after clicking email link)
- Layout: `AuthLayout.astro`
- React component: `ResetPasswordForm.tsx`
- Routing: `/auth/reset-password?token=...`

#### 1.1.2 New Layouts

**`src/layouts/AuthLayout.astro`**

- Special layout for authentication pages
- Minimalist design with application logo
- No main navigation
- Links to switch between login/register
- Responsive design focused on forms

**`src/layouts/ProtectedLayout.astro`**

- Layout for pages requiring authentication
- Extends `BaseLayout.astro`
- Adds header with user information
- Logout button
- Redirect to login if user is not authenticated

#### 1.1.3 Modifications to Existing Pages

**`src/pages/index.astro`**

- Add authentication check in middleware
- Redirect to `/auth/login` if user is not logged in
- Preserve current `PlansDashboardPage` for logged-in users

**`src/pages/generate.astro`**

- Add authentication check
- Redirect to login if user is not logged in

**`src/pages/plans/[id].astro`**

- Add authentication check
- Verify that plan belongs to logged-in user

### 1.2 React Components

#### 1.2.1 Authentication Forms

**`src/components/auth/LoginForm.tsx`**

- Login form with validation
- Fields: email, password
- API error handling
- Links to registration and password recovery
- Hook: `useAuth` for state management

**`src/components/auth/RegisterForm.tsx`**

- Registration form with validation
- Fields: email, password, confirmPassword
- Password strength validation
- API error handling
- Link to login
- Hook: `useAuth`

**`src/components/auth/ForgotPasswordForm.tsx`**

- Password recovery form
- Field: email
- Email sent confirmation
- Link to login

**`src/components/auth/ResetPasswordForm.tsx`**

- Password reset form
- Fields: password, confirmPassword
- Token validation from URL
- Error handling

#### 1.2.2 UI Components

**`src/components/auth/AuthHeader.tsx`**

- Header with application logo
- Page title (Login/Register/Forgot Password)

**`src/components/auth/AuthFooter.tsx`**

- Links to switch between forms
- Privacy policy information

**`src/components/layout/UserHeader.tsx`**

- User header in application
- User email
- Logout button
- Avatar (optional)

#### 1.2.3 Hooks

**`src/components/hooks/useAuth.ts`**

- Authentication state management
- Methods: login, register, logout, resetPassword
- Error handling
- Session persistence
- TypeScript typing

**`src/components/hooks/useAuthRedirect.ts`**

- Hook for authentication redirects
- Check if user is logged in
- Redirect to dashboard after login
- Redirect to login after logout

### 1.3 Validation and Error Messages

#### 1.3.1 Frontend Validation

**Email:**

- Email format (regex)
- Required field
- Maximum length: 254 characters

**Password:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

**Confirm Password:**

- Must be identical to password

#### 1.3.2 Error Messages

**Validation:**

- "Email is required"
- "Invalid email format"
- "Password must be at least 8 characters"
- "Password must contain uppercase letter, lowercase letter, digit and special character"
- "Passwords do not match"

**API Errors:**

- "Invalid email or password"
- "User with this email already exists"
- "Password reset token is invalid or expired"
- "An error occurred during login. Please try again."

### 1.4 User Scenarios

#### 1.4.1 Registration

1. User visits `/auth/register`
2. Fills form with real-time validation
3. After successful validation submits form
4. System creates account in Supabase
5. User is automatically logged in
6. Redirect to `/` (dashboard)

#### 1.4.2 Login

1. User visits `/auth/login`
2. Fills form
3. After successful validation submits form
4. System verifies credentials in Supabase
5. Creates session
6. Redirect to `/` (dashboard)

#### 1.4.3 Password Recovery

1. User visits `/auth/forgot-password`
2. Enters email
3. System sends email with reset link
4. User clicks link in email
5. Redirect to `/auth/reset-password?token=...`
6. User enters new password
7. System resets password and logs in user

#### 1.4.4 Logout

1. User clicks "Logout" in header
2. System destroys session in Supabase
3. Redirect to `/auth/login`

## 2. BACKEND LOGIC

### 2.1 API Endpoints

#### 2.1.1 Authentication

**`src/pages/api/auth/login.ts`**

- POST `/api/auth/login`
- Validation: `LoginRequest`
- Returns: `AuthResponse` or `ErrorResponse`
- Supabase Auth integration

**`src/pages/api/auth/register.ts`**

- POST `/api/auth/register`
- Validation: `RegisterRequest`
- Returns: `AuthResponse` or `ErrorResponse`
- Supabase Auth integration

**`src/pages/api/auth/logout.ts`**

- POST `/api/auth/logout`
- Returns: `LogoutResponse`
- Destroys session in Supabase

**`src/pages/api/auth/forgot-password.ts`**

- POST `/api/auth/forgot-password`
- Validation: `{ email: string }`
- Sends reset email through Supabase
- Returns: `{ message: string }`

**`src/pages/api/auth/reset-password.ts`**

- POST `/api/auth/reset-password`
- Validation: `{ token: string, password: string }`
- Resets password through Supabase
- Returns: `AuthResponse` or `ErrorResponse`

### 2.2 Data Models

#### 2.2.1 Extension of `src/types.ts`

```typescript
// Addition to existing authentication types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthError {
  code: "INVALID_CREDENTIALS" | "USER_EXISTS" | "INVALID_TOKEN" | "WEAK_PASSWORD";
  message: string;
}
```

### 2.3 Backend Validation

#### 2.3.1 Validation Schemas

**`src/lib/schemas/auth.schema.ts`**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
});
```

#### 2.3.2 Validation Functions

**`src/lib/utils/auth-validation.ts`**

```typescript
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain digit");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain special character");
  }

  return errors;
}
```

### 2.4 Exception Handling

#### 2.4.1 Error Types

**`src/lib/errors/auth-errors.ts`**

```typescript
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }
}

export class UserExistsError extends AuthError {
  constructor() {
    super("USER_EXISTS", "User with this email already exists", 409);
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super("INVALID_TOKEN", "Password reset token is invalid or expired", 400);
  }
}
```

#### 2.4.2 Error Handling Middleware

**`src/middleware/error-handler.ts`**

```typescript
export function handleAuthError(error: unknown): ErrorResponse {
  if (error instanceof AuthError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      },
    };
  }

  // Logging unknown errors
  console.error("Unexpected auth error:", error);

  return {
    error: {
      code: "INTERNAL_ERROR",
      message: "An error occurred while processing the request",
      statusCode: 500,
    },
  };
}
```

### 2.5 Server-Side Rendering

#### 2.5.1 Middleware Modification

**`src/middleware/index.ts`**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Authentication check for protected pages
  const protectedRoutes = ["/", "/generate", "/plans"];
  const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];

  const { pathname } = context.url;

  // Get user session
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  context.locals.user = session?.user || null;

  // Redirects for protected pages
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
    return context.redirect("/auth/login");
  }

  // Redirects for logged-in users on auth pages
  if (authRoutes.some((route) => pathname.startsWith(route)) && session) {
    return context.redirect("/");
  }

  return next();
});
```

#### 2.5.2 Locals Types

**`src/env.d.ts`**

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("@supabase/supabase-js").SupabaseClient;
    user: import("@supabase/supabase-js").User | null;
  }
}
```

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

#### 3.1.1 Supabase Configuration

**Extension of `src/db/supabase.client.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Remove DEFAULT_USER_ID - no longer needed
```

#### 3.1.2 Authentication Service

**`src/lib/services/auth.service.ts`**

```typescript
import { supabaseClient } from "../../db/supabase.client";
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../../types";

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { data: authData, error } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: {
        id: authData.user!.id,
        email: authData.user!.email!,
        created_at: authData.user!.created_at,
      },
      session: {
        access_token: authData.session!.access_token,
        refresh_token: authData.session!.refresh_token,
      },
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: {
        id: authData.user!.id,
        email: authData.user!.email!,
        created_at: authData.user!.created_at,
      },
      session: {
        access_token: authData.session!.access_token,
        refresh_token: authData.session!.refresh_token,
      },
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    const { data: authData, error } = await supabaseClient.auth.updateUser({
      password: data.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: {
        id: authData.user!.id,
        email: authData.user!.email!,
        created_at: authData.user!.created_at,
      },
      session: {
        access_token: authData.session!.access_token,
        refresh_token: authData.session!.refresh_token,
      },
    };
  }

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    return user;
  }

  async getSession() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    return session;
  }
}

export const authService = new AuthService();
```

### 3.2 Row Level Security (RLS)

#### 3.2.1 RLS Policies in Supabase

**Modification of `plans` table:**

```sql
-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT - user can only see their own plans
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for INSERT - user can only create their own plans
CREATE POLICY "Users can create own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE - user can only update their own plans
CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for DELETE - user can only delete their own plans
CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);
```

#### 3.2.2 Service Modifications

**`src/lib/services/plan-management.service.ts`**

```typescript
// Remove DEFAULT_USER_ID from all methods
// Use auth.uid() from Supabase

async createPlan(command: CreatePlanCommand): Promise<Tables<"plans">> {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabaseClient
    .from('plans')
    .insert({
      ...command,
      user_id: user.id // Use actual user ID
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
```

### 3.3 Session Management

#### 3.3.1 useAuth Hook

**`src/components/hooks/useAuth.ts`**

```typescript
import { useState, useEffect } from "react";
import { supabaseClient } from "../../db/supabase.client";
import { authService } from "../../lib/services/auth.service";
import type { User, AuthResponse } from "../../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      const session = await authService.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for authentication changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (email: string, password: string): Promise<void> => {
    const response = await authService.register({ email, password });
    setUser(response.user);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    await authService.forgotPassword({ email });
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    const response = await authService.resetPassword({ token, password });
    setUser(response.user);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };
}
```

### 3.4 Security

#### 3.4.1 Token Validation

**`src/lib/utils/token-validation.ts`**

```typescript
import { supabaseClient } from "../../db/supabase.client";

export async function validateAuthToken(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}
```

#### 3.4.2 Rate Limiting

**`src/lib/middleware/rate-limit.ts`**

```typescript
import { defineMiddleware } from "astro:middleware";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return defineMiddleware((context, next) => {
    const ip = context.request.headers.get("x-forwarded-for") || context.request.headers.get("x-real-ip") || "unknown";

    const now = Date.now();
    const windowStart = now - windowMs;

    const userRequests = rateLimitMap.get(ip);

    if (!userRequests || userRequests.resetTime < windowStart) {
      rateLimitMap.set(ip, { count: 1, resetTime: now });
    } else if (userRequests.count >= maxRequests) {
      return new Response("Too Many Requests", { status: 429 });
    } else {
      userRequests.count++;
    }

    return next();
  });
}
```

## 4. MIGRATIONS AND CONFIGURATION

### 4.1 Database Migrations

**`supabase/migrations/20241222000000_enable_auth_rls.sql`**

```sql
-- Enable RLS for all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Policies for plans
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for plan_activity (through plans)
CREATE POLICY "Users can view own plan activities" ON plan_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_activity.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- Similar policies for INSERT, UPDATE, DELETE
```

### 4.2 Environment Variables

**`.env.example`**

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
AUTH_REDIRECT_URL=http://localhost:3000
AUTH_SITE_URL=http://localhost:3000
```

### 4.3 Supabase Configuration

**Settings in Supabase Dashboard:**

1. Enable Email Auth
2. Configure email templates
3. Set redirect URLs
4. Configure RLS policies
5. Set application domain

## 5. TESTING AND VALIDATION

### 5.1 Frontend Tests

**`src/components/__tests__/auth/LoginForm.test.tsx`**

- Form validation tests
- API error handling tests
- Redirect tests

### 5.2 Backend Tests

**`src/pages/api/__tests__/auth/login.test.ts`**

- Input data validation tests
- Supabase integration tests
- Error handling tests

### 5.3 Integration Tests

**`tests/integration/auth-flow.test.ts`**

- Complete registration flow test
- Complete login flow test
- Password recovery test

## 6. DEPLOYMENT AND MONITORING

### 6.1 Deployment

1. Update database migrations
2. Deploy new API endpoints
3. Deploy frontend components
4. Configure Supabase Auth
5. Test in staging environment

### 6.2 Monitoring

**Metrics to track:**

- Daily registrations
- Daily logins
- Conversion rate (registration -> first plan)
- Authentication error count
- Auth endpoint response times

### 6.3 Security

**Security audit:**

- RLS policy verification
- Token validation
- Rate limiting
- Failed login attempt logging
- Sensitive data encryption

## 7. SUMMARY

This specification describes a complete authentication module architecture for AI Travel Planner that:

1. **Ensures security** through RLS, token validation, and rate limiting
2. **Complies with requirements** from PRD (US-001, US-002)
3. **Utilizes tech stack** (Astro 5, React 19, Supabase, TypeScript)
4. **Preserves existing functionality** of the application
5. **Is scalable** and maintainable
6. **Provides good UX** with real-time validation and error handling

The implementation will require gradual deployment, starting with basic authentication and then adding advanced features like password recovery and monitoring.
