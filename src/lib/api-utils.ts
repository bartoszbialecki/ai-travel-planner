import type { APIContext } from "astro";
import type { z } from "zod";
import type { ErrorResponse } from "../types";

/**
 * Standard HTTP status codes used in API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Standard error codes used in API responses
 */
export const ERROR_CODES = {
  INVALID_PLAN_ID: "INVALID_PLAN_ID",
  INVALID_ACTIVITY_ID: "INVALID_ACTIVITY_ID",
  INVALID_JOB_ID: "INVALID_JOB_ID",
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  PLAN_NOT_FOUND: "PLAN_NOT_FOUND",
  ACTIVITY_NOT_FOUND: "ACTIVITY_NOT_FOUND",
  ACTIVITY_NOT_IN_PLAN: "ACTIVITY_NOT_IN_PLAN",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  UPDATE_FAILED: "UPDATE_FAILED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: unknown,
  status: number = HTTP_STATUS.BAD_REQUEST
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: ERROR_CODES[code],
      message,
      ...(details ? { details: details as Record<string, unknown> } : {}),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data: unknown, status: number = HTTP_STATUS.OK): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Validates a parameter using a Zod schema and returns the parsed value or an error response
 */
export function validateParam<T>(
  context: APIContext,
  paramName: string,
  paramValue: string | undefined,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: Response } {
  if (!paramValue) {
    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_ERROR",
        `Missing required parameter: ${paramName}`,
        undefined,
        HTTP_STATUS.BAD_REQUEST
      ),
    };
  }

  const parseResult = schema.safeParse(paramValue);
  if (!parseResult.success) {
    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_ERROR" as keyof typeof ERROR_CODES,
        `Invalid ${paramName} format`,
        parseResult.error.flatten(),
        HTTP_STATUS.BAD_REQUEST
      ),
    };
  }

  return { success: true, data: parseResult.data };
}

/**
 * Validates multiple parameters at once
 */
export function validateParams<T extends Record<string, unknown>>(
  context: APIContext,
  validations: {
    name: string;
    value: string | undefined;
    schema: z.ZodSchema<unknown>;
  }[]
): { success: true; data: T } | { success: false; response: Response } {
  const result: Record<string, unknown> = {};

  for (const validation of validations) {
    const validationResult = validateParam(context, validation.name, validation.value, validation.schema);

    if (!validationResult.success) {
      return validationResult;
    }

    result[validation.name] = validationResult.data;
  }

  return { success: true, data: result as T };
}

/**
 * Checks if the user is authenticated and returns the user or an error response
 */
export function requireAuth(
  context: APIContext
): { success: true; user: NonNullable<typeof context.locals.user> } | { success: false; response: Response } {
  const user = context.locals.user;

  if (!user || !user.id) {
    return {
      success: false,
      response: createErrorResponse("UNAUTHORIZED", "User not authenticated", undefined, HTTP_STATUS.UNAUTHORIZED),
    };
  }

  return { success: true, user };
}

/**
 * Parses and validates request body using a Zod schema
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return {
      success: false,
      response: createErrorResponse("INVALID_JSON", "Invalid JSON in request body", undefined, HTTP_STATUS.BAD_REQUEST),
    };
  }

  const validation = schema.safeParse(requestBody);
  if (!validation.success) {
    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        validation.error.flatten(),
        HTTP_STATUS.BAD_REQUEST
      ),
    };
  }

  return { success: true, data: validation.data };
}

/**
 * Handles common error patterns and returns appropriate HTTP responses
 */
export async function handleApiError(
  error: unknown,
  context: {
    planId?: string;
    userId?: string;
    endpoint: string;
    logError?: (userId: string, message: string) => Promise<void>;
  }
): Promise<Response> {
  if (error instanceof Error) {
    const errorMessage = error.message;

    // Common error patterns
    const errorPatterns = [
      {
        pattern: "Plan not found",
        code: "PLAN_NOT_FOUND" as keyof typeof ERROR_CODES,
        message: "Plan with the given ID does not exist",
        status: HTTP_STATUS.NOT_FOUND,
      },
      {
        pattern: "Activity not found",
        code: "ACTIVITY_NOT_FOUND" as keyof typeof ERROR_CODES,
        message: "Activity with the given ID does not exist",
        status: HTTP_STATUS.NOT_FOUND,
      },
      {
        pattern: "Activity does not belong to the plan",
        code: "ACTIVITY_NOT_IN_PLAN" as keyof typeof ERROR_CODES,
        message: "Activity does not belong to the specified plan",
        status: HTTP_STATUS.NOT_FOUND,
      },
      {
        pattern: "Job not found",
        code: "JOB_NOT_FOUND" as keyof typeof ERROR_CODES,
        message: "Job with the given ID does not exist",
        status: HTTP_STATUS.NOT_FOUND,
      },
      {
        pattern: "Failed to update activity",
        code: "UPDATE_FAILED" as keyof typeof ERROR_CODES,
        message: "Failed to update activity",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        shouldLog: true,
      },
      {
        pattern: "Database error",
        code: "DATABASE_ERROR" as keyof typeof ERROR_CODES,
        message: "Database error occurred",
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        shouldLog: true,
      },
      {
        pattern: /network|connection|timeout/i,
        code: "NETWORK_ERROR" as keyof typeof ERROR_CODES,
        message: "Network error occurred",
        status: HTTP_STATUS.SERVICE_UNAVAILABLE,
        shouldLog: true,
      },
    ];

    // Check for specific error patterns
    for (const pattern of errorPatterns) {
      const isMatch =
        typeof pattern.pattern === "string" ? errorMessage === pattern.pattern : pattern.pattern.test(errorMessage);

      if (isMatch) {
        if (pattern.shouldLog && context.logError && context.userId) {
          await context.logError(context.userId, `${context.endpoint} ${pattern.code.toLowerCase()}: ${errorMessage}`);
        }

        return createErrorResponse(pattern.code, pattern.message, undefined, pattern.status);
      }
    }

    // Validation errors (400)
    if (errorMessage.includes("required") || errorMessage.includes("invalid")) {
      return createErrorResponse("VALIDATION_ERROR", errorMessage, undefined, HTTP_STATUS.BAD_REQUEST);
    }

    // Log unexpected errors
    if (context.logError && context.userId) {
      await context.logError(context.userId, `${context.endpoint} unexpected error: ${errorMessage}`);
    }
  }

  // Handle non-Error objects
  const errorString = String(error);
  if (context.logError && context.userId) {
    await context.logError(context.userId, `${context.endpoint} unknown error: ${errorString}`);
  }

  return createErrorResponse(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
    undefined,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Higher-order function that wraps API handlers with common error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (context: APIContext, ...args: T) => Promise<Response>,
  options: {
    planId?: (context: APIContext) => string | undefined;
    endpoint: string;
    logError?: (userId: string, message: string) => Promise<void>;
  }
) {
  return async (context: APIContext, ...args: T): Promise<Response> => {
    try {
      return await handler(context, ...args);
    } catch (error) {
      const planId = options.planId?.(context);
      const userId = context.locals.user?.id;

      return handleApiError(error, {
        planId,
        userId,
        endpoint: options.endpoint,
        logError: options.logError,
      });
    }
  };
}

/**
 * Utility to create a standardized API handler with common validations
 */
export function createApiHandler<TParams extends Record<string, unknown>, TBody = never>(options: {
  paramValidations?: {
    name: string;
    schema: z.ZodSchema<unknown>;
  }[];
  bodySchema?: z.ZodSchema<TBody>;
  requireAuthentication?: boolean;
  endpoint: string;
  logError?: (userId: string, message: string) => Promise<void>;
  customErrorHandler?: (
    error: unknown,
    context: APIContext,
    user: NonNullable<typeof context.locals.user>
  ) => Promise<Response>;
  handler: (
    context: APIContext,
    params: TParams,
    body: TBody,
    user: NonNullable<typeof context.locals.user>
  ) => Promise<Response>;
}) {
  return withErrorHandling(
    async (context: APIContext) => {
      // Validate parameters if provided
      let params: TParams;
      if (options.paramValidations) {
        const paramValues = options.paramValidations.map((validation) => ({
          name: validation.name,
          value: context.params[validation.name],
          schema: validation.schema,
        }));

        const paramResult = validateParams<TParams>(context, paramValues);
        if (!paramResult.success) {
          return paramResult.response;
        }
        params = paramResult.data;
      } else {
        params = {} as TParams;
      }

      // Parse and validate request body if schema provided
      let body: TBody;
      if (options.bodySchema) {
        const bodyResult = await parseRequestBody(context.request, options.bodySchema);
        if (!bodyResult.success) {
          return bodyResult.response;
        }
        body = bodyResult.data;
      } else {
        body = {} as TBody;
      }

      // Check authentication if required
      if (options.requireAuthentication !== false) {
        const authResult = requireAuth(context);
        if (!authResult.success) {
          return authResult.response;
        }
        // Call the actual handler with authenticated user
        try {
          return await options.handler(context, params, body, authResult.user);
        } catch (error) {
          if (options.customErrorHandler) {
            return await options.customErrorHandler(error, context, authResult.user);
          }
          throw error;
        }
      } else {
        // Call the actual handler with potentially null user
        const user = context.locals.user;
        return await options.handler(context, params, body, user as NonNullable<typeof context.locals.user>);
      }
    },
    {
      planId: (context) => context.params.id,
      endpoint: options.endpoint,
      logError: options.logError,
    }
  );
}
