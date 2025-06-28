# Status Endpoint Test Examples

## Test Cases for GET /api/plans/generate/{jobId}/status

### 1. Invalid UUID Format

```bash
curl -X GET "http://localhost:3000/api/plans/generate/invalid-uuid/status" \
  -H "Content-Type: application/json"
```

**Expected Response (400 Bad Request):**

```json
{
  "error": {
    "code": "INVALID_JOB_ID",
    "message": "Invalid job ID format. Must be a valid UUID.",
    "details": {
      "field": "jobId",
      "issue": "Invalid UUID format",
      "provided": "invalid-uuid"
    }
  }
}
```

### 2. Non-existent Plan

```bash
curl -X GET "http://localhost:3000/api/plans/generate/123e4567-e89b-12d3-a456-426614174000/status" \
  -H "Content-Type: application/json"
```

**Expected Response (404 Not Found):**

```json
{
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan with specified job ID not found.",
    "details": {
      "job_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

### 3. Processing Status - Time-based Progress

```bash
# First create a plan
curl -X POST "http://localhost:3000/api/plans/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Plan",
    "destination": "Paris",
    "start_date": "2024-07-01",
    "end_date": "2024-07-05",
    "adults_count": 2,
    "children_count": 0
  }'

# Then check status (use job_id from response above)
curl -X GET "http://localhost:3000/api/plans/generate/{job_id}/status" \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK) - Fresh Plan:**

```json
{
  "job_id": "9f116866-3602-40cd-9691-86f813233e76",
  "status": "processing",
  "progress": 10,
  "plan_id": null,
  "error_message": null
}
```

**Expected Response (200 OK) - Older Plan:**

```json
{
  "job_id": "1a21b584-782a-438d-ba90-f7a8f28c1211",
  "status": "processing",
  "progress": 95,
  "plan_id": null,
  "error_message": null
}
```

### 4. Completed Status

When a plan generation is completed, the response should include the plan_id:

**Expected Response (200 OK):**

```json
{
  "job_id": "1a21b584-782a-438d-ba90-f7a8f28c1211",
  "status": "completed",
  "progress": 100,
  "plan_id": "456e7890-e89b-12d3-a456-426614174001",
  "error_message": null
}
```

### 5. Failed Status

When a plan generation fails, the response should include error details:

**Expected Response (200 OK):**

```json
{
  "job_id": "1a21b584-782a-438d-ba90-f7a8f28c1211",
  "status": "failed",
  "progress": 0,
  "plan_id": null,
  "error_message": "AI service temporarily unavailable"
}
```

## Implementation Notes

- The endpoint correctly validates UUID format using RFC 4122 pattern
- Business logic is properly separated into the `getPlanGenerationStatus` service
- Error handling covers all expected scenarios
- **Progress calculation is now time-based** for more realistic feedback:
  - Fresh plans start at ~10% progress
  - Progress increases over time based on elapsed time vs estimated completion (5 minutes)
  - Progress caps at 95% until actually completed
  - Failed plans show 0% progress
- Error messages are retrieved from the `generation_errors` table when available
- The endpoint is ready for production use with proper polling implementation

## Progress Calculation Details

The progress calculation uses the following logic:

- **Completed**: 100% (actual completion)
- **Failed**: 0% (no progress)
- **Processing**: Time-based calculation:
  - Minimum: 10% (fresh plans)
  - Maximum: 95% (before actual completion)
  - Formula: `(elapsed_time / estimated_duration) * 100`
  - Estimated duration: 5 minutes from plan creation
