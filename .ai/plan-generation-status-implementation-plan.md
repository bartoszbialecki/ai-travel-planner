# API Endpoint Implementation Plan: GET /api/plans/generate/{jobId}/status

## 1. Endpoint Overview

The endpoint is used to check the status of a travel plan generation job. It allows clients to monitor the progress of plan generation in real-time through polling. It returns the current job status, percentage progress, the generated plan identifier (if completed), and any error messages.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/plans/generate/{jobId}/status`
- **Parameters**:
  - **Required**:
    - `jobId` (string, UUID) - generation job identifier in URL path
  - **Optional**: none
- **Request Body**: none
- **Headers**:
  - `Authorization: Bearer {token}` - required JWT token

## 3. Types Used

- **DTOs**:
  - `GenerationStatusResponse` - main response type
  - `GenerationStatus` - status enum ("processing" | "completed" | "failed")
- **Command Models**: none (read-only endpoint)
- **Query Parameters**:
  - `jobId` - string (UUID format)

## 4. Response Details

- **Status Code**: 200 OK
- **Response Structure**:

```json
{
  "job_id": "uuid",
  "status": "completed|processing|failed",
  "progress": 75,
  "plan_id": "uuid",
  "error_message": "string"
}
```

- **Response Fields**:
  - `job_id`: UUID of the generation job
  - `status`: current job status
  - `progress`: progress percentage (0-100)
  - `plan_id`: UUID of the generated plan (only when status="completed")
  - `error_message`: error message (only when status="failed")

## 5. Data Flow

1. **Request Validation**:
   - Check for authorization token presence
   - Validate UUID format of jobId
   - Decode and verify JWT token

2. **Data Retrieval**:
   - Query the `plans` table based on `job_id`
   - Check if plan exists
   - Verify user access (RLS)

3. **Response Processing**:
   - Map database data to `GenerationStatusResponse`
   - Calculate progress based on status
   - Prepare JSON response

4. **Logging**:
   - Log errors to `generation_errors` table (if any occur)

## 6. Security Considerations

- **Authorization**: Required JWT token in Authorization header
- **Resource Authorization**: Check if user has access to the plan (RLS)
- **Input Validation**:
  - Validate UUID format of jobId
  - Validate JWT token
- **Rate Limiting**: No additional restrictions (read-only endpoint)
- **CORS**: Configuration consistent with the rest of the application

## 7. Error Handling

- **400 Bad Request**:
  - Invalid UUID format for jobId
  - Missing authorization token
- **401 Unauthorized**:
  - Invalid or expired JWT token
  - Missing token in Authorization header
- **403 Forbidden**:
  - User doesn't have access to the plan (RLS violation)
- **404 Not Found**:
  - Plan with specified jobId doesn't exist
- **500 Internal Server Error**:
  - Database error
  - Server error during processing

**Error Response Format**:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      "field": "jobId",
      "issue": "Invalid UUID format"
    }
  }
}
```

## 8. Performance Considerations

- **Indexing**: The `plans` table should have an index on `job_id` (UNIQUE constraint)
- **Caching**: No caching (data must be current)
- **Queries**: Single SELECT query with JOIN on attractions (if needed)
- **RLS**: Row Level Security provides efficient filtering at database level
- **Polling**: Client can use this endpoint for status polling

## 9. Implementation Steps

### Step 1: Create Endpoint

1. Create file `src/pages/api/plans/generate/[jobId]/status.ts`
2. Implement basic GET endpoint structure
3. Add `export const prerender = false`

### Step 2: Implement Validation

1. Validate UUID format of jobId
2. Check for authorization token presence
3. Decode and verify JWT token
4. Implement early returns for errors

### Step 3: Implement Business Logic

1. Query database for plan based on job_id
2. Check if plan exists
3. Verify user access (RLS)
4. Map data to `GenerationStatusResponse`

### Step 4: Implement Error Handling

1. Add try-catch blocks
2. Implement standard error response format
3. Log errors to `generation_errors` table
4. Test various error scenarios

### Step 5: Testing and Optimization

1. Test with valid data
2. Test error scenarios
3. Check query performance
4. Verify RLS compliance

### Step 6: Documentation and Deployment

1. Update API documentation
2. Add code comments
3. Test in staging environment
4. Deploy to production

## 10. Files to Create/Modify

### New Files:

- `src/pages/api/plans/generate/[jobId]/status.ts`

### Modified Files:

- None (standalone endpoint)

### Services Used:

- `src/lib/services/error-logging.service.ts` - error logging
- `src/db/supabase.client.ts` - database access

## 11. Usage Examples

### Valid Request:

```bash
GET /api/plans/generate/123e4567-e89b-12d3-a456-426614174000/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Valid Response:

```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "plan_id": "456e7890-e89b-12d3-a456-426614174001"
}
```

### Error Example:

```json
{
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan with specified job ID not found",
    "details": {
      "job_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```
