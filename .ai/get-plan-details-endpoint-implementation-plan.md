# API Endpoint Implementation Plan: GET /api/plans/{id}

## 1. Endpoint Overview

The endpoint serves to retrieve detailed information about a travel plan along with activities grouped by days. The endpoint requires authorization and returns complete plan data along with summary statistics.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/plans/{id}`
- **Parameters**:
  - **Required**:
    - `id` (path parameter) - UUID of the plan to retrieve
  - **Optional**: None
- **Headers**:
  - `Authorization: Bearer {token}` - required JWT token
- **Request Body**: None

## 3. Used Types

### DTOs:

- `PlanDetailResponse` - main response type containing plan and activities
- `ActivityResponse` - activity representation with attraction data
- `AttractionResponse` - attraction data
- `PlanSummary` - plan statistics summary

### Command Models:

- `GetPlanCommand` - command for retrieving plan (to be implemented)

### Database Types:

- `Tables<"plans">` - plans table
- `Tables<"plan_activity">` - plan activities table
- `Tables<"attractions">` - attractions table

## 4. Response Details

### Success (200 OK):

```json
{
  "id": "uuid",
  "name": "Paris Adventure",
  "destination": "Paris, France",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "adults_count": 2,
  "children_count": 1,
  "budget_total": 3000,
  "budget_currency": "EUR",
  "travel_style": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "activities": {
    "1": [
      {
        "id": "uuid",
        "attraction": {
          "id": "uuid",
          "name": "Eiffel Tower",
          "address": "Champ de Mars, 5 Avenue Anatole France",
          "description": "Iconic iron lattice tower"
        },
        "day_number": 1,
        "activity_order": 1,
        "accepted": true,
        "custom_desc": "Visit the iconic Eiffel Tower",
        "opening_hours": "09:00-23:45",
        "cost": 26
      }
    ]
  },
  "summary": {
    "total_days": 5,
    "total_activities": 15,
    "accepted_activities": 12,
    "estimated_total_cost": 450
  }
}
```

### Error Codes:

- **401 Unauthorized**: Missing or invalid authorization token
- **403 Forbidden**: Plan does not belong to the logged-in user
- **404 Not Found**: Plan with the given ID does not exist
- **500 Internal Server Error**: Server or database error

## 5. Data Flow

1. **Request Validation**:
   - Check presence and format of authorization token
   - Validate plan UUID in URL path
   - Decode JWT token and retrieve user_id

2. **Data Retrieval**:
   - Query database for plan with user_id filtering
   - Retrieve plan activities with attraction data
   - Group activities by day_number

3. **Data Processing**:
   - Calculate plan summary statistics
   - Format response according to DTO

4. **Response Return**:
   - Serialize data to JSON
   - Set appropriate HTTP headers

## 6. Security Considerations

### Authorization:

- Required JWT token in Authorization header
- Check if plan belongs to the logged-in user
- Use RLS (Row Level Security) in Supabase

### Data Validation:

- Validate plan UUID before database query
- Sanitize input data
- Check user permissions before returning data

### Database Security:

- Use query parameters (Supabase automatically)
- Filter by user_id in queries
- Utilize RLS policies

## 7. Error Handling

### Validation Errors (400):

- Invalid UUID format for plan
- Missing required parameters

### Authorization Errors (401):

- Missing authorization token
- Invalid token format
- Expired token

### Permission Errors (403):

- Plan does not belong to the logged-in user
- User does not have access to the plan

### Resource Errors (404):

- Plan with the given ID does not exist
- Plan has been deleted

### Server Errors (500):

- Database connection error
- Data processing error
- Unexpected application errors

### Error Logging:

- Use `error-logging.service.ts` for all errors
- Log error details in error_logs table
- Maintain user data confidentiality in logs

## 8. Performance Considerations

### Query Optimization:

- Use JOIN to retrieve plan with activities in one query
- Index user_id, plan_id, day_number columns
- Limit number of activities per plan (max 30 days × 10 activities)

### Caching:

- Consider caching frequently retrieved plans
- Cache for attraction data (rarely changing)

### Pagination:

- Not required for this endpoint (single plan)
- Consider pagination for activities in very large plans

## 9. Implementation Stages

### Stage 1: Structure Preparation

1. Create file `src/pages/api/plans/[id].ts`
2. Add `GetPlanCommand` type to `src/types.ts`
3. Extend `plan-management.service.ts` with `getPlanById()` method

### Stage 2: Validation Implementation

1. Implement plan UUID validation
2. Implement authorization token validation
3. Add authorization middleware (if not exists)

### Stage 3: Business Logic Implementation

1. Implement `getPlanById()` method in service
2. Database query with JOIN
3. Group activities by days
4. Calculate summary statistics

### Stage 4: Error Handling Implementation

1. Add handling for all error scenarios
2. Integrate with `error-logging.service.ts`
3. Implement appropriate HTTP status codes

### Stage 5: Testing

1. Unit tests for service
2. Integration tests for endpoint
3. Error case tests
4. Performance tests

### Stage 6: Documentation and Deployment

1. Update API documentation
2. Add usage examples
3. Code review and merge
4. Deploy to test environment

## 10. Files to Create/Modify

### New Files:

- `src/pages/api/plans/[id].ts` - main endpoint

### Modified Files:

- `src/types.ts` - add `GetPlanCommand`
- `src/lib/services/plan-management.service.ts` - add `getPlanById()` method

### Configuration Files:

- Check authorization middleware in `src/middleware/index.ts`
- Update API documentation in `docs/api-examples.md`
