# API Endpoint Implementation Plan: POST /api/plans/generate

## 1. Endpoint Overview

The endpoint serves to initiate the generation of a new travel plan using AI. The operation is asynchronous - the endpoint returns a job_id and "processing" status, while the actual plan generation occurs in the background. The plan is created based on user preferences, budget, travel style, and other parameters.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/plans/generate`
- **Headers**:
  - `Authorization: Bearer {token}` (required)
  - `Content-Type: application/json`
- **Parameters**:
  - **Required**: name, destination, start_date, end_date, adults_count, children_count
  - **Optional**: budget_total, budget_currency, travel_style
- **Request Body**: JSON conforming to the `GeneratePlanRequest` interface

## 3. Utilized Types

- **DTOs**: `GeneratePlanRequest`, `GeneratePlanResponse`, `ErrorResponse`
- **Command Models**: `CreatePlanCommand`
- **Validation**: Zod schema for `GeneratePlanRequest`
- **Database**: `Tables<'plans'>`, `Tables<'generation_errors'>`

## 4. Response Details

- **Status 202 Accepted**: Successful generation initiation
  ```json
  {
    "job_id": "uuid",
    "status": "processing",
    "estimated_completion": "2024-01-01T00:05:00Z"
  }
  ```
- **Status 400 Bad Request**: Invalid input data
- **Status 401 Unauthorized**: Missing or invalid authorization token
- **Status 429 Too Many Requests**: Rate limit exceeded
- **Status 500 Internal Server Error**: Server errors

## 5. Data Flow

1. **Token Validation**: Verification of user authorization
2. **Data Validation**: Verification of request body using Zod schema
3. **Plan Creation**: Saving basic plan data in the `plans` table
4. **Generation Initiation**: Creating job_id and returning 202 response
5. **Asynchronous Processing**: Plan generation in the background (outside the endpoint)
6. **Error Handling**: Logging errors in the `generation_errors` table

## 6. Security Considerations

- **Authorization**: Required Bearer token from Supabase Auth
- **Data Validation**: Comprehensive validation using Zod schemas
- **Rate Limiting**: Implementation of request limits per user
- **SQL Injection Protection**: Using Supabase client with parameters
- **Input Sanitization**: Validation of data types and formats
- **Error Handling**: Safe error responses without revealing sensitive information

## 7. Error Handling

- **400 Bad Request**:
  - Invalid date format
  - start_date >= end_date
  - adults_count < 1
  - children_count < 0
  - Invalid travel_style
  - Missing required fields
- **401 Unauthorized**:
  - Missing authorization token
  - Invalid token
  - Expired token
- **429 Too Many Requests**:
  - Exceeded plan generation limit
- **500 Internal Server Error**:
  - Database errors
  - Plan generation errors
  - Unexpected server errors

## 8. Performance Considerations

- **Asynchronous Processing**: Plan generation in background, doesn't block the endpoint
- **Database Optimization**: Using indexes on user_id and created_at
- **Connection Pooling**: Utilizing Supabase connection pool
- **Caching**: Consider caching for frequently used data
- **Rate Limiting**: Preventing system overload
- **Timeout Handling**: Setting appropriate timeouts for AI operations

## 9. Implementation Stages

### Stage 1: Structure Preparation

1. Create file `src/pages/api/plans/generate.ts`
2. Create service `src/lib/services/plan-generation.service.ts`
3. Create Zod schema for validation in `src/lib/schemas/plan-generation.schema.ts`

### Stage 2: Validation Implementation

1. Implement Zod schema for `GeneratePlanRequest`
2. Validate dates (start_date < end_date)
3. Validate person count (adults_count >= 1, children_count >= 0)
4. Validate travel_style enum
5. Validate currency format

### Stage 3: Authorization Implementation

1. Integrate with Supabase Auth
2. Verify Bearer token
3. Extract user_id from token
4. Handle authorization errors

### Stage 4: Business Logic Implementation

1. Create plan in `plans` table
2. Generate job_id (UUID)
3. Calculate estimated_completion
4. Prepare 202 response

### Stage 5: Error Handling Implementation

1. Middleware for error handling
2. Log errors in `generation_errors` table
3. Error logging
4. Safe error message responses

### Stage 6: Rate Limiting Implementation

1. Middleware for rate limiting
2. Configure limits per user
3. Handle 429 responses

### Stage 7: Testing and Documentation

1. Unit tests for service
2. Integration tests for endpoint
3. Data validation tests
4. Error handling tests
5. API documentation update

### Stage 8: Optimization and Monitoring

1. Add logging for monitoring
2. Optimize database queries
3. Configure error alerts
4. Performance testing
