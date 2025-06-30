# API Endpoint Implementation Plan: Update Activity Details

## 1. Endpoint Overview

This endpoint allows authenticated users to update specific details of an activity within their travel plan. Users can modify the custom description, opening hours, and cost of an activity. The endpoint ensures proper authorization by verifying that the user owns the plan containing the activity.

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/plans/{id}/activities/{activityId}`
- **Parameters**:
  - **Required**:
    - `id` (path parameter): Plan UUID
    - `activityId` (path parameter): Activity UUID
  - **Optional**: None
- **Request Body**: JSON object with optional fields
  ```json
  {
    "custom_desc": "string | null",
    "opening_hours": "string | null",
    "cost": "number | null"
  }
  ```
- **Headers**:
  - `Authorization: Bearer {token}` (required)
  - `Content-Type: application/json`

## 3. Utilized Types

### DTOs:

- `UpdateActivityRequest` - Request body validation
- `UpdateActivityResponse` - Response structure
- `ErrorResponse` - Standard error format

### Command Models:

- `UpdateActivityCommand` - Service layer command with plan_id, activity_id, and update fields

### Database Types:

- `Tables<"plans">` - Plan ownership verification
- `Tables<"plan_activity">` - Activity data update
- `Tables<"attractions">` - Attraction data for response

## 4. Response Details

### Success Response (200 OK):

```json
{
  "id": "uuid",
  "custom_desc": "Updated description",
  "opening_hours": "10:00-18:00",
  "cost": 30,
  "message": "Activity updated"
}
```

### Error Responses:

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't own the plan
- **404 Not Found**: Plan or activity not found
- **400 Bad Request**: Invalid request body or validation errors
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow

1. **Authentication**: Verify Bearer token and extract user_id
2. **Input Validation**: Validate request body using Zod schema
3. **Authorization**: Verify plan ownership (user_id matches authenticated user)
4. **Resource Verification**: Ensure plan and activity exist
5. **Data Update**: Update plan_activity record in database
6. **Response Generation**: Return updated activity data
7. **Error Handling**: Log errors using error-logging service

## 6. Security Considerations

- **Authentication**: Bearer token validation required for all requests
- **Authorization**: Users can only update activities in plans they own
- **Input Validation**: Strict validation of all input fields using Zod schemas
- **SQL Injection Prevention**: Use Supabase client with parameterized queries
- **Data Sanitization**: Sanitize string inputs (custom_desc, opening_hours)
- **Rate Limiting**: Consider implementing rate limiting for abuse prevention

## 7. Error Handling

### Validation Errors (400):

- Invalid JSON in request body
- Invalid data types for fields
- Field length violations (custom_desc > 1000 chars, opening_hours > 255 chars)
- Invalid cost value (negative numbers)

### Authorization Errors (401/403):

- Missing Authorization header
- Invalid or expired token
- User doesn't own the specified plan

### Resource Errors (404):

- Plan with specified ID doesn't exist
- Activity with specified ID doesn't exist
- Activity doesn't belong to the specified plan

### Server Errors (500):

- Database connection failures
- Unexpected database errors
- Service layer exceptions

### Error Logging:

- Use `error-logging.service.ts` to log all errors to database
- Include request context (user_id, plan_id, activity_id)
- Log stack traces for debugging

## 8. Performance Considerations

- **Database Queries**: Use efficient joins to fetch plan and activity data in single query
- **Indexing**: Ensure proper indexes on plans(user_id, id) and plan_activity(plan_id, id)
- **Caching**: Consider caching plan ownership verification for frequently accessed plans
- **Connection Pooling**: Leverage Supabase connection pooling
- **Response Size**: Keep response payload minimal and focused

## 9. Implementation Steps

### Step 1: Create Zod Schema

Create validation schema in `src/lib/schemas/plan-management.schema.ts`:

```typescript
export const updateActivitySchema = z.object({
  custom_desc: z.string().max(1000).nullable().optional(),
  opening_hours: z.string().max(255).nullable().optional(),
  cost: z.number().min(0).nullable().optional(),
});
```

### Step 2: Extend Service Layer

Add method to `src/lib/services/plan-management.service.ts`:

```typescript
async updateActivity(command: UpdateActivityCommand): Promise<UpdateActivityResponse>
```

### Step 3: Create API Route

Create `src/pages/api/plans/[id]/activities/[activityId]/index.ts`:

- Implement PUT handler
- Add authentication middleware
- Add input validation
- Add error handling
- Add proper response formatting

### Step 4: Add Error Logging

Integrate error logging service for comprehensive error tracking

### Step 5: Testing

- Unit tests for service layer
- Integration tests for API endpoint
- Error scenario testing
- Authorization testing

### Step 6: Documentation

- Update API documentation
- Add example requests/responses
- Document error codes and messages

### Step 7: Security Review

- Review authentication flow
- Verify authorization checks
- Test input validation
- Check for potential vulnerabilities

### Step 8: Performance Testing

- Load testing with realistic data
- Database query optimization
- Response time benchmarking
