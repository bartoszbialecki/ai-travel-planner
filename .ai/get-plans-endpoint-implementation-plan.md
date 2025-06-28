# API Endpoint Implementation Plan: GET /api/plans

## 1. Endpoint Overview

The endpoint serves to retrieve a list of travel plans for the logged-in user with pagination and sorting support. It provides secure access to user data through Bearer token authorization and Row Level Security in the database.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/plans`
- **Parameters**:
  - **Required**: None (except authorization)
  - **Optional**:
    - `page` (integer, default: 1) - page number
    - `limit` (integer, default: 10, max: 50) - number of items per page
    - `sort` (string, default: "created_at", options: "created_at", "name", "destination") - sort column
    - `order` (string, default: "desc", options: "asc", "desc") - sort direction
- **Headers**:
  - `Authorization: Bearer {token}` - required authorization token
- **Request Body**: None

## 3. Used Types

### DTOs:

- `PlanListResponse` - response structure with plan list and pagination
- `PlanListParams` - query parameters (extends PaginationParams)
- `PaginationParams` - base pagination parameters

### Command Models:

- `ListPlansCommand` - command model for retrieving plan list

## 4. Response Details

### Success (200 OK):

```json
{
  "plans": [
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
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

### Status Codes:

- **200**: Successfully retrieved plan list
- **400**: Invalid query parameters
- **401**: Missing authorization or invalid token
- **500**: Server error

## 5. Data Flow

1. **Authorization Validation**: Check Bearer token in Authorization header
2. **Parameter Parsing**: Extract and validate query parameters
3. **Query Construction**: Prepare SQL query with user_id filtering
4. **Query Execution**: Retrieve data from plans table with pagination
5. **Response Formatting**: Structure data according to DTO
6. **Response Return**: Send response with appropriate status code

## 6. Security Considerations

- **Authorization**: Required Bearer token in Authorization header
- **Row Level Security**: Filter plans by user_id in database
- **Parameter Validation**: Check correctness of pagination and sorting parameters
- **SQL Injection Protection**: Use parameters in Supabase queries
- **Rate Limiting**: Consider implementing query frequency limits

## 7. Error Handling

### Potential Errors and Handling:

- **401 Unauthorized**: Missing token or invalid token
  - Logging: `ErrorLoggingService.logError()`
  - Response: `{ "error": { "code": "UNAUTHORIZED", "message": "Invalid or missing authorization token" } }`

- **400 Bad Request**: Invalid parameters
  - Logging: `ErrorLoggingService.logError()`
  - Response: `{ "error": { "code": "INVALID_PARAMETERS", "message": "Invalid query parameters", "details": { "field": "error_description" } } }`

- **500 Internal Server Error**: Database or server errors
  - Logging: `ErrorLoggingService.logError()`
  - Response: `{ "error": { "code": "INTERNAL_ERROR", "message": "An internal server error occurred" } }`

## 8. Performance Considerations

- **Database Indexes**: Ensure indexes exist on user_id, created_at, name, destination columns
- **Pagination**: Implement efficient pagination with LIMIT and OFFSET
- **Caching**: Consider caching frequently retrieved plans
- **Query Optimization**: Minimize number of database queries

## 9. Implementation Stages

### Stage 1: Type and Validation Preparation

1. Create `ListPlansCommand` in `src/types.ts`
2. Implement parameter validation in `src/lib/schemas/plan-management.schema.ts`
3. Extend `PlanListParams` with additional validations

### Stage 2: Service Implementation

1. Create `src/lib/services/plan-management.service.ts`
2. Implement `listPlans()` method with pagination and sorting support
3. Integrate with `ErrorLoggingService` for error logging

### Stage 3: Endpoint Implementation

1. Create `src/pages/api/plans/index.ts`
2. Implement GET handler with authorization validation
3. Integrate with `PlanManagementService`
4. Implement error handling and status codes

### Stage 4: Testing and Validation

1. Unit tests for service
2. Integration tests for endpoint
3. Performance tests with various parameters
4. Security and authorization validation

### Stage 5: Documentation and Deployment

1. Update API documentation
2. Add usage examples
3. Deploy to test environment
4. Error monitoring and logging

## 10. File Structure

```
src/
├── pages/api/plans/
│   └── index.ts                    # Endpoint implementation
├── lib/
│   ├── services/
│   │   └── plan-management.service.ts  # Business logic
│   └── schemas/
│       └── plan-management.schema.ts   # Validation schemas
└── types.ts                        # Updated with ListPlansCommand
```

## 11. Usage Examples

### Basic Query:

```bash
GET /api/plans
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query with Parameters:

```bash
GET /api/plans?page=2&limit=20&sort=name&order=asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 12. Monitoring and Metrics

- Queries per second
- Endpoint response time
- Number of 401, 400, 500 errors
- Most popular sorting parameters
- Distribution of plans per user
