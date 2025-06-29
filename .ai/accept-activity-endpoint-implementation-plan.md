# API Endpoint Implementation Plan: Accept Activity in Plan

## 1. Endpoint Overview

The endpoint serves to accept an activity in a travel plan. Users can accept a specific activity, which means it becomes part of the approved plan. The operation requires authorization and verifies user permissions to modify the plan.

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/plans/{id}/activities/{activityId}/accept`
- **Parameters**:
  - **Required**:
    - `id` (UUID) - plan identifier
    - `activityId` (UUID) - activity identifier
  - **Optional**: none
- **Request Body**: none
- **Headers**:
  - `Authorization: Bearer {token}` - required

## 3. Used Types

### DTOs:

- `ToggleActivityCommand` - command for toggling activity status
- `ActivityAcceptResponse` - response confirming acceptance

### Database types:

- `Tables<"plans">` - plans table
- `Tables<"plan_activity">` - plan activities table
- `Tables<"users">` - users table

## 4. Response Details

### Success (200 OK):

```json
{
  "id": "uuid",
  "accepted": true,
  "message": "Activity accepted"
}
```

### Error codes:

- **400 Bad Request**: Invalid UUID or input data
- **401 Unauthorized**: Missing or invalid authorization token
- **403 Forbidden**: User doesn't have access to the plan
- **404 Not Found**: Plan or activity doesn't exist
- **500 Internal Server Error**: Server or database error

## 5. Data Flow

1. **Request validation**: Check HTTP method, URL parameters, and headers
2. **Authorization**: Verify JWT token and retrieve user_id
3. **Data validation**: Check UUID validity for plan_id and activity_id
4. **Permission check**: Verify if the plan belongs to the user
5. **Activity verification**: Check if activity exists and belongs to the plan
6. **Database update**: Set accepted = true for the activity
7. **Logging**: Record operation in logs (optional)
8. **Response**: Return acceptance confirmation

## 6. Security Considerations

### Authorization and authentication:

- Bearer token required in Authorization header
- Token verification through Supabase Auth
- Check if user has access to the plan (user_id match)

### Data validation:

- UUID validation for plan_id and activity_id
- Check if plan and activity exist
- Verify relationship between plan and activity

### Database security:

- Use query parameters (prepared statements)
- Utilize RLS (Row Level Security) in Supabase
- Check permissions at application level

## 7. Error Handling

### Validation errors (400):

- Invalid UUID format
- Missing required parameters

### Authorization errors (401):

- Missing Authorization token
- Invalid token format
- Expired token

### Permission errors (403):

- User is not the plan owner
- Plan doesn't exist

### Resource errors (404):

- Plan with given ID doesn't exist
- Activity with given ID doesn't exist
- Activity doesn't belong to the plan

### Server errors (500):

- Database connection error
- Token verification error
- Unexpected application errors

### Error logging:

- All errors logged through `error-logging.service.ts`
- Detailed error information saved in `error_logs` table

## 8. Performance Considerations

### Database optimizations:

- Use indexes on `id`, `user_id`, `plan_id` columns
- Single query for activity update
- Utilize transactions for data consistency

### Caching:

- No caching for modifying operations
- Possible plan caching after modification (invalidation)

### Rate limiting:

- Implement rate limiting at endpoint level
- Protection against activity acceptance spam

## 9. Implementation Stages

### Stage 1: Endpoint Structure Preparation

1. Create file `src/pages/api/plans/[id]/activities/[activityId]/accept.ts`
2. Implement basic endpoint structure with PUT method
3. Add `export const prerender = false`

### Stage 2: Validation and Authorization Implementation

1. Import necessary types and schemas
2. Implement UUID parameter validation
3. Add Supabase authorization middleware
4. Check user permissions for the plan

### Stage 3: Service Layer Extension

1. Add `acceptActivity` method to `plan-management.service.ts`
2. Implement activity verification logic
3. Add transaction for database update
4. Implement error handling in service

### Stage 4: Business Logic Implementation

1. Verify plan and activity existence
2. Check relationship between plan and activity
3. Update `accepted` field in `plan_activity` table
4. Return response in `ActivityAcceptResponse` format

### Stage 5: Error Handling and Logging

1. Implement detailed error handling
2. Add error logging through `error-logging.service.ts`
3. Return appropriate HTTP status codes
4. Add edge case validation

### Stage 6: Testing and Documentation

1. Create unit tests for service
2. Integration tests for endpoint
3. Update API documentation
4. Performance and security testing

### Stage 7: Deployment and Monitoring

1. Code review and merge to main branch
2. Deploy to test environment
3. Monitor errors and performance
4. Documentation for development team
