# API Endpoint Implementation Plan: DELETE /api/plans/{id}

## 1. Endpoint Overview

Endpoint for deleting travel plans from the system. Allows users to delete their travel plans after verifying access permissions. The operation is irreversible and removes the plan along with all related data (activities, attractions) thanks to cascading deletion in the database.

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/plans/{id}`
- **Parameters**:
  - **Required**:
    - `id` (path parameter) - UUID of the plan to delete
    - `Authorization` (header) - Bearer token for authorization
  - **Optional**: none
- **Request Body**: none

## 3. Used Types

- **Command Model**: `DeletePlanCommand` - contains plan_id and user_id
- **Response DTO**: `DeletePlanResponse` - contains message confirming deletion
- **Error Response**: `ErrorResponse` - standard error format

## 4. Response Details

- **200 OK**: Plan successfully deleted
  ```json
  {
    "message": "Plan deleted successfully"
  }
  ```
- **401 Unauthorized**: Missing or invalid authorization token
- **403 Forbidden**: Token exists but user doesn't have permissions for this plan
- **404 Not Found**: Plan with the given ID doesn't exist
- **500 Internal Server Error**: Server or database error

## 5. Data Flow

1. **Request Validation**: Checking UUID format and presence of authorization token
2. **Authorization**: Verifying token and retrieving user_id from context
3. **Permission Verification**: Checking if plan exists and belongs to the user
4. **Plan Deletion**: Calling service to delete plan from database
5. **Logging**: Recording operation in error logs (if errors occur)
6. **Response**: Returning confirmation or appropriate error

## 6. Security Considerations

- **Authorization**: Required Bearer token in Authorization header
- **Resource-level Authorization**: Checking if plan belongs to logged-in user
- **UUID Validation**: Checking UUID format correctness before database query
- **Row Level Security**: Using RLS in Supabase as additional security layer
- **Error Logging**: Recording unauthorized access attempts
- **Rate Limiting**: Consider implementing request frequency limits

## 7. Error Handling

- **401 Unauthorized**:
  - Cause: Missing authorization token or invalid format
  - Handling: Return error with information about required authorization
- **403 Forbidden**:
  - Cause: Plan exists but doesn't belong to the user
  - Handling: Return access error without revealing plan existence
- **404 Not Found**:
  - Cause: Plan with given ID doesn't exist
  - Handling: Return error with information about missing resource
- **500 Internal Server Error**:
  - Cause: Database error, connection issues
  - Handling: Log error and return general error message

## 8. Performance Considerations

- **Database Indexes**: Using existing indexes on plans.id and plans.user_id
- **Cascading Deletion**: Optimization through automatic deletion of related records
- **Caching**: Consider caching authorization results for short periods
- **Connection Pooling**: Using built-in Supabase connection pooling
- **Monitoring**: Tracking response times and error frequency

## 9. Implementation Stages

### Stage 1: Endpoint Structure Preparation

1. Creating file `src/pages/api/plans/[id].ts`
2. Implementing basic endpoint structure with DELETE handling
3. Adding UUID validation for id parameter
4. Implementing basic authorization

### Stage 2: Business Logic Implementation

1. Extending `plan-management.service.ts` with `deletePlan(command: DeletePlanCommand)` method
2. Implementing user permission validation
3. Adding cascading deletion handling in database
4. Implementing appropriate return types

### Stage 3: Error Handling and Validation

1. Implementing detailed error handling for all scenarios
2. Adding error logging through `error-logging.service.ts`
3. Implementing authorization token validation
4. Adding unit tests for different error scenarios

### Stage 4: Testing and Optimization

1. Testing endpoint with various scenarios (successful deletion, authorization errors, non-existent plans)
2. Verifying cascading deletion of related data
3. Testing performance with different data sizes
4. Optimizing database queries if needed

### Stage 5: Documentation and Deployment

1. Updating API documentation
2. Adding usage examples in documentation
3. Verifying compliance with security principles
4. Deploying to test and production environments

## 10. Files to Modify/Create

- **New Files**:
  - `src/pages/api/plans/[id].ts` - main endpoint
- **Modified Files**:
  - `src/lib/services/plan-management.service.ts` - adding deletePlan method
  - `src/types.ts` - verifying existing types (DeletePlanCommand, DeletePlanResponse)
- **Configuration Files**:
  - No configuration changes (using existing structure)
