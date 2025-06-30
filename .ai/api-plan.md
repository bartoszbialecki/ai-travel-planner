# REST API Plan - AI Travel Planner

## 1. Resources

### Core Resources

- **users** - User accounts (managed by Supabase Auth)
- **plans** - Travel plans created by users
- **attractions** - Tourist attractions/points of interest
- **plan_activity** - Activities within travel plans
- **generation_errors** - Error logs for plan generation

### Authentication Resource

- **auth** - Authentication and session management

## 2. Endpoints

### Authentication Endpoints

#### POST /api/auth/register

**Description**: Register a new user account
**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (201 Created):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**Error Codes**: 400 (Invalid email/password), 409 (Email already exists)

#### POST /api/auth/login

**Description**: Authenticate user and create session
**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**Error Codes**: 401 (Invalid credentials), 400 (Invalid input)

#### POST /api/auth/logout

**Description**: End user session
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

```json
{
  "message": "Successfully logged out"
}
```

### Plan Generation Endpoints

#### POST /api/plans/generate

**Description**: Generate a new travel plan using AI
**Headers**: Authorization: Bearer {token}
**Request Body**:

```json
{
  "name": "Paris Adventure",
  "destination": "Paris, France",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "adults_count": 2,
  "children_count": 1,
  "budget_total": 3000,
  "budget_currency": "EUR",
  "travel_style": "active"
}
```

**Response** (202 Accepted):

```json
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:05:00Z"
}
```

**Error Codes**: 400 (Invalid input), 429 (Rate limit exceeded), 401 (Unauthorized)

#### GET /api/plans/generate/{jobId}/status

**Description**: Check generation job status
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

```json
{
  "job_id": "uuid",
  "status": "completed|processing|failed",
  "progress": 75,
  "plan_id": "uuid",
  "error_message": "string"
}
```

### Plan Management Endpoints

#### GET /api/plans

**Description**: List user's travel plans
**Headers**: Authorization: Bearer {token}
**Query Parameters**:

- `page` (integer, default: 1)
- `limit` (integer, default: 10, max: 50)
- `sort` (string, default: "created_at", options: "created_at", "name", "destination")
- `order` (string, default: "desc", options: "asc", "desc")
  **Response** (200 OK):

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

#### GET /api/plans/{id}

**Description**: Get detailed travel plan with activities
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

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

**Error Codes**: 404 (Plan not found), 403 (Access denied)

#### DELETE /api/plans/{id}

**Description**: Delete a travel plan
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

```json
{
  "message": "Plan deleted successfully"
}
```

**Error Codes**: 404 (Plan not found), 403 (Access denied)

### Activity Management Endpoints

#### PUT /api/plans/{id}/activities/{activityId}/accept

**Description**: Accept an activity in the plan
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

```json
{
  "id": "uuid",
  "accepted": true,
  "message": "Activity accepted"
}
```

#### PUT /api/plans/{id}/activities/{activityId}/reject

**Description**: Reject an activity in the plan
**Headers**: Authorization: Bearer {token}
**Response** (200 OK):

```json
{
  "id": "uuid",
  "accepted": false,
  "message": "Activity rejected"
}
```

#### PUT /api/plans/{id}/activities/{activityId}

**Description**: Update activity details
**Headers**: Authorization: Bearer {token}
**Request Body**:

```json
{
  "custom_desc": "Updated description",
  "opening_hours": "10:00-18:00",
  "cost": 30
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "custom_desc": "Updated description",
  "opening_hours": "10:00-18:00",
  "cost": 30,
  "message": "Activity updated"
}
```

### Attractions Endpoints

#### GET /api/attractions

**Description**: Search attractions (for potential future use)
**Query Parameters**:

- `q` (string) - Search query
- `destination` (string) - Filter by destination
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
  **Response** (200 OK):

```json
{
  "attractions": [
    {
      "id": "uuid",
      "name": "Eiffel Tower",
      "address": "Champ de Mars, 5 Avenue Anatole France",
      "description": "Iconic iron lattice tower"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

## 3. Authentication and Authorization

### Authentication Mechanism

- **Provider**: Supabase Auth
- **Method**: JWT tokens (access token + refresh token)
- **Token Format**: Bearer token in Authorization header
- **Token Expiry**: Access token (1 hour), Refresh token (7 days)

### Authorization Rules

- All endpoints except `/api/auth/register` and `/api/auth/login` require authentication
- Users can only access their own plans (enforced by RLS)
- Attractions are publicly accessible (no RLS)

### Security Headers

- `Authorization: Bearer {jwt_token}` for protected endpoints
- CORS configuration for web application
- Rate limiting: 2 plan generations per day per user

## 4. Validation and Business Logic

### Input Validation Rules

#### Plans

- `name`: Required, max 255 characters
- `destination`: Required, max 255 characters
- `start_date`: Required, valid date, must be in the future
- `end_date`: Required, valid date, must be after start_date
- `adults_count`: Required, integer >= 1
- `children_count`: Required, integer >= 0
- `budget_total`: Optional, integer > 0
- `budget_currency`: Optional, valid ISO currency code
- `travel_style`: Optional, enum: ["active", "relaxation", "flexible"]

#### Plan Activities

- `day_number`: Required, integer 1-30
- `activity_order`: Required, integer >= 1
- `custom_desc`: Optional, max 1000 characters
- `opening_hours`: Optional, max 255 characters
- `cost`: Optional, integer >= 0

### Business Logic Implementation

#### Plan Generation

- **Rate Limiting**: Maximum 2 plans per day per user
- **Async Processing**: Generation jobs run in background
- **Progress Tracking**: Real-time status updates via polling
- **Error Handling**: Failed generations logged in generation_errors table

#### Plan Moderation

- **Activity Acceptance**: Individual activities can be accepted/rejected
- **Day Acceptance**: Day is accepted if majority of activities are accepted
- **Real-time Updates**: Activity changes update plan summary immediately

#### Plan Management

- **Ownership**: Users can only access their own plans (RLS)
- **Cascade Deletion**: Deleting plan removes all related activities and errors
- **Audit Trail**: All changes tracked with timestamps

### Error Handling

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Access denied (RLS violation)
- **404 Not Found**: Resource doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors

### Response Format

All error responses follow consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "start_date",
      "issue": "Date must be in the future"
    }
  }
}
```
