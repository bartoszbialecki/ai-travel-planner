# API Utilities Guide

This guide explains how to use the new API utilities to reduce code duplication and improve maintainability across your API endpoints.

## Overview

The API utilities module (`src/lib/api-utils.ts`) provides reusable functions and patterns for common API operations:

- **Parameter validation** - UUID and schema validation with standardized error responses
- **Authentication checks** - User authentication verification
- **Error handling** - Centralized error handling with consistent response formats
- **Request body parsing** - JSON parsing with validation
- **Response creation** - Standardized success and error responses

## Key Benefits

1. **Reduced Code Duplication** - Common patterns are extracted into reusable utilities
2. **Consistent Error Handling** - All endpoints use the same error response format
3. **Type Safety** - Full TypeScript support with proper type inference
4. **Maintainability** - Changes to error handling or validation logic only need to be made in one place
5. **Developer Experience** - Simplified API endpoint creation with less boilerplate
6. **Security** - Centralized authentication and authorization handling

## Core Utilities

### HTTP Status Codes and Error Codes

```typescript
import { HTTP_STATUS, ERROR_CODES } from "../../../lib/api-utils";

// Use predefined constants instead of magic numbers
return new Response(JSON.stringify(data), {
  status: HTTP_STATUS.OK,
  headers: { "Content-Type": "application/json" },
});
```

### Response Creation

```typescript
import { createSuccessResponse, createErrorResponse } from "../../../lib/api-utils";

// Success responses
return createSuccessResponse(data);
return createSuccessResponse(data, HTTP_STATUS.CREATED);

// Error responses
return createErrorResponse("PLAN_NOT_FOUND", "Plan not found", undefined, HTTP_STATUS.NOT_FOUND);
```

### Parameter Validation

```typescript
import { validateParam } from "../../../lib/api-utils";

const planIdResult = validateParam(context, "id", context.params.id, planIdSchema);
if (!planIdResult.success) {
  return planIdResult.response;
}
const planId = planIdResult.data;
```

### Authentication Checks

```typescript
import { requireAuth } from "../../../lib/api-utils";

const authResult = requireAuth(context);
if (!authResult.success) {
  return authResult.response;
}
const user = authResult.user;
```

### Request Body Parsing

```typescript
import { parseRequestBody } from "../../../lib/api-utils";

const bodyResult = await parseRequestBody(context.request, updateActivitySchema);
if (!bodyResult.success) {
  return bodyResult.response;
}
const body = bodyResult.data;
```

## Advanced Usage

### The `createApiHandler` Function

The `createApiHandler` function is the most powerful utility that combines all the above patterns into a single, declarative API:

```typescript
import { createApiHandler } from "../../../lib/api-utils";

export const PUT: APIRoute = createApiHandler({
  // Parameter validations
  paramValidations: [
    { name: "id", schema: planIdSchema },
    { name: "activityId", schema: activityIdSchema },
  ],

  // Request body validation
  bodySchema: updateActivitySchema,

  // Authentication requirement
  requireAuthentication: true,

  // Endpoint name for logging
  endpoint: "PUT /api/plans/[id]/activities/[activityId]",

  // Error logging function
  logError: (userId: string, message: string) => logApiErrorWithContext({ error_message: message }),

  // The actual handler logic
  handler: async (context, params, body, user) => {
    const { id: planId, activityId } = params as { id: string; activityId: string };
    const { custom_desc, opening_hours, cost } = body;

    const command: UpdateActivityCommand = {
      plan_id: planId,
      activity_id: activityId,
      custom_desc,
      opening_hours,
      cost,
      user_id: user.id,
    };

    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.updateActivity(command);

    return createSuccessResponse(result);
  },
});
```

### Error Handling with `withErrorHandling`

For more complex scenarios, you can use the `withErrorHandling` wrapper:

```typescript
import { withErrorHandling } from "../../../lib/api-utils";

export const GET: APIRoute = withErrorHandling(
  async (context) => {
    // Your handler logic here
    return createSuccessResponse(data);
  },
  {
    planId: (context) => context.params.id,
    endpoint: "GET /api/plans/[id]",
    logError: (userId: string, message: string) => logApiErrorWithContext({ error_message: message }),
  }
);
```

## Migration Guide

### Before (Original Code)

```typescript
export const PUT: APIRoute = async (context) => {
  let planId: string | undefined;

  try {
    const { id, activityId } = context.params;

    // Validate plan ID format
    const planIdParseResult = planIdSchema.safeParse(id);
    if (!planIdParseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_PLAN_ID",
          message: "Invalid plan ID format",
          details: planIdParseResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate activity ID format
    const activityIdParseResult = activityIdSchema.safeParse(activityId);
    if (!activityIdParseResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_ACTIVITY_ID",
          message: "Invalid activity ID format",
          details: activityIdParseResult.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    planId = planIdParseResult.data;
    const activityIdValid = activityIdParseResult.data;

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body using Zod schema
    const bodyValidation = updateActivitySchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: bodyValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { custom_desc, opening_hours, cost } = bodyValidation.data;

    // Use authenticated user id from locals
    const user = context.locals.user;
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "User not authenticated" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ... rest of the handler logic and error handling
  } catch (error) {
    // ... extensive error handling code
  }
};
```

### After (Refactored Code)

```typescript
export const PUT: APIRoute = createApiHandler({
  paramValidations: [
    { name: "id", schema: planIdSchema },
    { name: "activityId", schema: activityIdSchema },
  ],
  bodySchema: updateActivitySchema,
  requireAuthentication: true,
  endpoint: "PUT /api/plans/[id]/activities/[activityId]",
  logError: (userId: string, message: string) => logApiErrorWithContext({ error_message: message }),
  handler: async (context, params, body, user) => {
    const { id: planId, activityId } = params as { id: string; activityId: string };
    const { custom_desc, opening_hours, cost } = body;

    const command: UpdateActivityCommand = {
      plan_id: planId,
      activity_id: activityId,
      custom_desc,
      opening_hours,
      cost,
      user_id: user.id,
    };

    const planManagementService = new PlanManagementService(context.locals.supabase);
    const result = await planManagementService.updateActivity(command);

    return createSuccessResponse(result);
  },
});
```

## Code Reduction Statistics

The refactored code shows significant improvements:

- **Original**: ~276 lines
- **Refactored**: ~50 lines
- **Reduction**: ~82% less code
- **Maintainability**: All validation and error handling logic centralized
- **Consistency**: Standardized error responses across all endpoints

## Best Practices

1. **Use `createApiHandler` for new endpoints** - It provides the most comprehensive validation and error handling
2. **Define custom error codes** - Add new error codes to the `ERROR_CODES` constant when needed
3. **Use type-safe parameter extraction** - Leverage TypeScript for better type safety
4. **Centralize error logging** - Use consistent error logging patterns across all endpoints
5. **Test error scenarios** - Ensure all error paths are properly tested
6. **Set authentication requirements appropriately** - Most endpoints should require authentication for security
7. **Respect Row Level Security** - Use `context.locals.supabase` instead of service role clients for user data

## Security Considerations

### Authentication Requirements

Most API endpoints should require authentication (`requireAuthentication: true`) to ensure:

- **Data Privacy**: Users can only access their own data
- **Row Level Security**: Database RLS policies are respected
- **Authorization**: Proper user context is available for business logic

### When to Use `requireAuthentication: false`

Only use `requireAuthentication: false` for:

- **Public endpoints**: Login, registration, public data
- **Health checks**: System monitoring endpoints
- **Webhooks**: External service callbacks

### Database Security

- **Use `context.locals.supabase`**: Respects RLS policies and user context
- **Avoid service role clients**: Bypass security for user data access
- **Validate ownership**: Always verify users can access requested resources

## Examples

See the following current examples:

- `src/pages/api/plans/[id]/activities/[activityId]/index.ts` - Complex endpoint with authentication and validation
- `src/pages/api/auth/login.ts` - Authentication endpoint (no auth required)
- `src/pages/api/plans/generate/[jobId]/status.ts` - Status endpoint with authentication

These examples demonstrate how the utilities can be used in different scenarios and show the dramatic reduction in boilerplate code.
