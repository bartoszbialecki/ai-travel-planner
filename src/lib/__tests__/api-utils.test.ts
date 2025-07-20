/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import type { APIContext } from "astro";
import {
  HTTP_STATUS,
  ERROR_CODES,
  createErrorResponse,
  createSuccessResponse,
  validateParam,
  validateParams,
  requireAuth,
  parseRequestBody,
  handleApiError,
  withErrorHandling,
  createApiHandler,
} from "../api-utils";

// Mock schemas for testing
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();

// Mock APIContext
const createMockContext = (overrides: Partial<APIContext> = {}): APIContext =>
  ({
    params: {},
    request: new Request("http://localhost:3000"),
    cookies: {} as any,
    locals: { user: null, supabase: {} as any },
    redirect: vi.fn(),
    ...overrides,
  }) as APIContext;

describe("HTTP_STATUS", () => {
  it("should have correct status code values", () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe("ERROR_CODES", () => {
  it("should have all expected error codes", () => {
    expect(ERROR_CODES.INVALID_PLAN_ID).toBe("INVALID_PLAN_ID");
    expect(ERROR_CODES.INVALID_ACTIVITY_ID).toBe("INVALID_ACTIVITY_ID");
    expect(ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ERROR_CODES.PLAN_NOT_FOUND).toBe("PLAN_NOT_FOUND");
    expect(ERROR_CODES.DATABASE_ERROR).toBe("DATABASE_ERROR");
  });
});

describe("createErrorResponse", () => {
  it("should create error response with default status", async () => {
    const response = createErrorResponse("INVALID_PLAN_ID", "Invalid plan ID");

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const data = await response.json();
    expect(data).toEqual({
      error: {
        code: "INVALID_PLAN_ID",
        message: "Invalid plan ID",
      },
    });
  });

  it("should create error response with custom status", async () => {
    const response = createErrorResponse("PLAN_NOT_FOUND", "Plan not found", undefined, HTTP_STATUS.NOT_FOUND);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);

    const data = await response.json();
    expect(data).toEqual({
      error: {
        code: "PLAN_NOT_FOUND",
        message: "Plan not found",
      },
    });
  });

  it("should include details when provided", async () => {
    const details = { field: "id", value: "invalid" };
    const response = createErrorResponse("VALIDATION_ERROR", "Validation failed", details);

    const data = await response.json();
    expect(data.error.details).toEqual(details);
  });
});

describe("createSuccessResponse", () => {
  it("should create success response with default status", async () => {
    const data = { id: "123", name: "Test" };
    const response = createSuccessResponse(data);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const responseData = await response.json();
    expect(responseData).toEqual(data);
  });

  it("should create success response with custom status", async () => {
    const data = { id: "123" };
    const response = createSuccessResponse(data, HTTP_STATUS.CREATED);

    expect(response.status).toBe(HTTP_STATUS.CREATED);

    const responseData = await response.json();
    expect(responseData).toEqual(data);
  });
});

describe("validateParam", () => {
  it("should return success for valid parameter", () => {
    const context = createMockContext();
    const result = validateParam(context, "id", "123e4567-e89b-12d3-a456-426614174000", uuidSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("123e4567-e89b-12d3-a456-426614174000");
    }
  });

  it("should return error for missing parameter", () => {
    const context = createMockContext();
    const result = validateParam(context, "id", undefined, uuidSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    }
  });

  it("should return error for invalid parameter", async () => {
    const context = createMockContext();
    const result = validateParam(context, "id", "invalid-uuid", uuidSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const data = await result.response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid id format");
    }
  });
});

describe("validateParams", () => {
  it("should return success for all valid parameters", () => {
    const context = createMockContext();
    const validations = [
      { name: "id", value: "123e4567-e89b-12d3-a456-426614174000", schema: uuidSchema },
      { name: "email", value: "test@example.com", schema: emailSchema },
    ];

    const result = validateParams(context, validations);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("should return error for first invalid parameter", async () => {
    const context = createMockContext();
    const validations = [
      { name: "id", value: "invalid-uuid", schema: uuidSchema },
      { name: "email", value: "test@example.com", schema: emailSchema },
    ];

    const result = validateParams(context, validations);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const data = await result.response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid id format");
    }
  });
});

describe("requireAuth", () => {
  it("should return success for authenticated user", () => {
    const user = { id: "user-123", email: "test@example.com" };
    const context = createMockContext({ locals: { user, supabase: {} as any } });

    const result = requireAuth(context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toEqual(user);
    }
  });

  it("should return error for unauthenticated user", async () => {
    const context = createMockContext({ locals: { user: undefined, supabase: {} as any } });

    const result = requireAuth(context);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.UNAUTHORIZED);

      const data = await result.response.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toBe("User not authenticated");
    }
  });

  it("should return error for user without id", async () => {
    const user = { email: "test@example.com" } as any;
    const context = createMockContext({ locals: { user, supabase: {} as any } });

    const result = requireAuth(context);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    }
  });
});

describe("parseRequestBody", () => {
  it("should return success for valid JSON body", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const body = { name: "John", age: 30 };
    const request = new Request("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseRequestBody(request, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(body);
    }
  });

  it("should return error for invalid JSON", async () => {
    const schema = z.object({ name: z.string() });
    const request = new Request("http://localhost:3000", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseRequestBody(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const data = await result.response.json();
      expect(data.error.code).toBe("INVALID_JSON");
      expect(data.error.message).toBe("Invalid JSON in request body");
    }
  });

  it("should return error for invalid schema", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const body = { name: "John", age: "invalid" };
    const request = new Request("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseRequestBody(request, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(HTTP_STATUS.BAD_REQUEST);

      const data = await result.response.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    }
  });
});

describe("handleApiError", () => {
  const mockLogError = vi.fn();

  beforeEach(() => {
    mockLogError.mockClear();
  });

  it("should handle Plan not found error", async () => {
    const error = new Error("Plan not found");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const data = await response.json();
    expect(data.error.code).toBe("PLAN_NOT_FOUND");
    expect(data.error.message).toBe("Plan with the given ID does not exist");
  });

  it("should handle Activity not found error", async () => {
    const error = new Error("Activity not found");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "PUT /api/plans/[id]/activities/[activityId]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    const data = await response.json();
    expect(data.error.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("should handle Database error with logging", async () => {
    const error = new Error("Database error");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(mockLogError).toHaveBeenCalledWith("user-123", "GET /api/plans/[id] database_error: Database error");
  });

  it("should handle validation errors", async () => {
    const error = new Error("required field missing");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "POST /api/plans",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should handle network errors", async () => {
    const error = new Error("network timeout");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    const data = await response.json();
    expect(data.error.code).toBe("NETWORK_ERROR");
  });

  it("should handle unknown errors", async () => {
    const error = new Error("Unknown error");
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    const data = await response.json();
    expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(mockLogError).toHaveBeenCalledWith("user-123", "GET /api/plans/[id] unexpected error: Unknown error");
  });

  it("should handle non-Error objects", async () => {
    const error = "String error";
    const context = {
      planId: "plan-123",
      userId: "user-123",
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    };

    const response = await handleApiError(error, context);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(mockLogError).toHaveBeenCalledWith("user-123", "GET /api/plans/[id] unknown error: String error");
  });
});

describe("withErrorHandling", () => {
  const mockLogError = vi.fn();

  beforeEach(() => {
    mockLogError.mockClear();
  });

  it("should return handler result when no error occurs", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("success"));
    const wrappedHandler = withErrorHandling(handler, {
      endpoint: "GET /api/test",
      logError: mockLogError,
    });

    const context = createMockContext();
    const result = await wrappedHandler(context);

    expect(handler).toHaveBeenCalledWith(context);
    expect(result).toBeInstanceOf(Response);
    expect(await result.text()).toBe("success");
  });

  it("should handle errors thrown by handler", async () => {
    const error = new Error("Plan not found");
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withErrorHandling(handler, {
      planId: (context) => context.params.id,
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
    });

    const context = createMockContext({ params: { id: "plan-123" } });
    const result = await wrappedHandler(context);

    expect(result.status).toBe(HTTP_STATUS.NOT_FOUND);
    const data = await result.json();
    expect(data.error.code).toBe("PLAN_NOT_FOUND");
  });
});

describe("createApiHandler", () => {
  const mockLogError = vi.fn();

  beforeEach(() => {
    mockLogError.mockClear();
  });

  it("should create handler with parameter validation", async () => {
    const handler = vi.fn().mockResolvedValue(createSuccessResponse({ success: true }));
    const apiHandler = createApiHandler({
      paramValidations: [{ name: "id", schema: uuidSchema }],
      requireAuthentication: true,
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
      handler,
    });

    const user = { id: "user-123", email: "test@example.com" };
    const context = createMockContext({
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      locals: { user, supabase: {} as any },
    });

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.OK);
    expect(handler).toHaveBeenCalledWith(context, { id: "123e4567-e89b-12d3-a456-426614174000" }, {}, user);
  });

  it("should return error for invalid parameters", async () => {
    const handler = vi.fn();
    const apiHandler = createApiHandler({
      paramValidations: [{ name: "id", schema: uuidSchema }],
      requireAuthentication: true,
      endpoint: "GET /api/plans/[id]",
      logError: mockLogError,
      handler,
    });

    const user = { id: "user-123", email: "test@example.com" };
    const context = createMockContext({
      params: { id: "invalid-uuid" },
      locals: { user, supabase: {} as any },
    });

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should return error for unauthenticated user", async () => {
    const handler = vi.fn();
    const apiHandler = createApiHandler({
      requireAuthentication: true,
      endpoint: "GET /api/plans",
      logError: mockLogError,
      handler,
    });

    const context = createMockContext({ locals: { user: undefined, supabase: {} as any } });

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle request body validation", async () => {
    const bodySchema = z.object({ name: z.string() });
    const handler = vi.fn().mockResolvedValue(createSuccessResponse({ success: true }));
    const apiHandler = createApiHandler({
      bodySchema,
      requireAuthentication: false,
      endpoint: "POST /api/plans",
      logError: mockLogError,
      handler,
    });

    const body = { name: "Test Plan" };
    const request = new Request("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const context = createMockContext({ request });

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.OK);
    expect(handler).toHaveBeenCalledWith(context, {}, body, null);
  });

  it("should return error for invalid request body", async () => {
    const bodySchema = z.object({ name: z.string() });
    const handler = vi.fn();
    const apiHandler = createApiHandler({
      bodySchema,
      requireAuthentication: false,
      endpoint: "POST /api/plans",
      logError: mockLogError,
      handler,
    });

    const body = { name: 123 }; // Invalid type
    const request = new Request("http://localhost:3000", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const context = createMockContext({ request });

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should work without authentication requirement", async () => {
    const handler = vi.fn().mockResolvedValue(createSuccessResponse({ success: true }));
    const apiHandler = createApiHandler({
      requireAuthentication: false,
      endpoint: "GET /api/public",
      logError: mockLogError,
      handler,
    });

    const context = createMockContext();

    const result = await apiHandler(context);

    expect(result.status).toBe(HTTP_STATUS.OK);
    expect(handler).toHaveBeenCalledWith(context, {}, {}, null);
  });
});
