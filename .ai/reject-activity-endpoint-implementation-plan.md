# API Endpoint Implementation Plan: Reject Activity

## 1. Endpoint Overview

Endpoint serves to reject activities in a travel plan. Allows users to mark specific activities as rejected, which may affect plan statistics and potentially future recommendations.

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/plans/{id}/activities/{activityId}/reject`
- **Parameters**:
  - **Required**:
    - `id` (UUID) - plan identifier
    - `activityId` (UUID) - activity identifier
  - **Optional**: none
- **Request Body**: none
- **Headers**:
  - `Authorization: Bearer {token}` - required

## 3. Types Used

- **DTOs**:
  - `ActivityRejectResponse` (existing in types.ts)
- **Command Models**:
  - `ToggleActivityCommand` (existing in types.ts)
- **New Types**:
  - `RejectActivityCommand` - extension of ToggleActivityCommand with accepted: false

## 4. Response Details

- **Status 200 OK**:

```json
{
  "id": "uuid",
  "accepted": false,
  "message": "Activity rejected"
}
```

- **Status 401 Unauthorized**: Missing or invalid authorization token
- **Status 403 Forbidden**: Plan does not belong to the logged-in user
- **Status 404 Not Found**: Plan or activity does not exist
- **Status 400 Bad Request**: Invalid UUID format
- **Status 500 Internal Server Error**: Server errors

## 5. Data Flow

1. **Request Validation**:
   - Check presence and format of authorization token
   - Validate UUID format for plan_id and activity_id
   - Decode token and retrieve user_id

2. **Permission Verification**:
   - Check if plan exists in database
   - Verify if plan belongs to the logged-in user
   - Check if activity exists in the plan

3. **Database Update**:
   - Set `accepted = false` for activity in `plan_activity` table
   - Return updated data

4. **Response**:
   - Return confirmation of activity rejection

## 6. Security Considerations

- **Authorization**: Bearer token required in Authorization header
- **Resource Authorization**: Check if plan belongs to the logged-in user
- **Input Validation**:
  - Validate UUID format for plan_id and activity_id
  - Check existence of plan and activity
- **Logging**: Log unauthorized access attempts
- **Rate Limiting**: Consider implementing request frequency limits

## 7. Error Handling

- **401 Unauthorized**:
  - Missing authorization token
  - Invalid token format
  - Expired token
- **403 Forbidden**:
  - Plan does not belong to the logged-in user
- **404 Not Found**:
  - Plan with given ID does not exist
  - Activity with given ID does not exist in the plan
- **400 Bad Request**:
  - Invalid UUID format for plan_id or activity_id
- **500 Internal Server Error**:
  - Database errors
  - Authorization server errors
  - Unexpected application errors

## 8. Performance Considerations

- **Database Indexes**:
  - Index on `plans.user_id` for fast ownership verification
  - Index on `plan_activity.plan_id` and `plan_activity.id` for fast lookup
- **Caching**: Consider caching plans for frequently used ones
- **Connection Pooling**: Utilize Supabase connection pooling
- **Query Optimization**: Use single query with JOIN for verification

## 9. Implementation Stages

### Stage 1: File Structure Preparation

1. Create file `src/pages/api/plans/[id]/activities/[activityId]/reject.ts`
2. Add export `export const prerender = false`

### Stage 2: Validation Implementation

1. Import necessary dependencies (zod, types, services)
2. Define validation schema for URL parameters
3. Implement authorization token validation

### Stage 3: Business Logic Implementation

1. Extend `plan-management.service.ts` with `rejectActivity()` method
2. Implement user permission verification
3. Implement activity status update

### Stage 4: Error Handling Implementation

1. Add try-catch blocks
2. Implement appropriate HTTP status codes
3. Integrate with `error-logging.service.ts`

### Stage 5: Testing

1. Unit tests for service
2. Integration tests for endpoint
3. Error scenario tests
4. Performance tests

### Stage 6: Documentation

1. Update API documentation
2. Add usage examples
3. Document error codes

### Stage 7: Deployment

1. Code review
2. Staging environment tests
3. Production deployment
4. Monitoring and alerts

## 10. Files to Create/Modify

### New Files:

- `src/pages/api/plans/[id]/activities/[activityId]/reject.ts`

### Modified Files:

- `src/lib/services/plan-management.service.ts` - add rejectActivity() method
- `src/types.ts` - add RejectActivityCommand (optional)

### Configuration Files:

- No changes required

## 11. Dependencies

- Use existing types from `src/types.ts`
- Use existing services from `src/lib/services/`
- Use Supabase client from `src/db/supabase.client.ts`
- Use validation schemas from `src/lib/schemas/`
