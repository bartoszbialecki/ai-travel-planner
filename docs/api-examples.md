# API Usage Examples

This document provides practical examples of how to use the AI Travel Planner API.

## GET /api/plans Examples

### Basic Request

```bash
curl -X GET "http://localhost:3000/api/plans" \
  -H "Authorization: Bearer your_token_here"
```

### With Pagination

```bash
curl -X GET "http://localhost:3000/api/plans?page=2&limit=20" \
  -H "Authorization: Bearer your_token_here"
```

### With Sorting

```bash
# Sort by name in ascending order
curl -X GET "http://localhost:3000/api/plans?sort=name&order=asc" \
  -H "Authorization: Bearer your_token_here"

# Sort by destination in descending order
curl -X GET "http://localhost:3000/api/plans?sort=destination&order=desc" \
  -H "Authorization: Bearer your_token_here"
```

### Complete Example with All Parameters

```bash
curl -X GET "http://localhost:3000/api/plans?page=1&limit=15&sort=created_at&order=desc" \
  -H "Authorization: Bearer your_token_here"
```

## JavaScript/TypeScript Examples

### Using fetch() for GET /api/plans

```javascript
// Basic request
const response = await fetch("/api/plans", {
  headers: {
    Authorization: "Bearer your_token_here",
  },
});

const data = await response.json();
console.log(data.plans); // Array of plans
console.log(data.pagination); // Pagination info
```

### With Query Parameters

```javascript
// Build query parameters
const params = new URLSearchParams({
  page: "2",
  limit: "20",
  sort: "name",
  order: "asc",
});

const response = await fetch(`/api/plans?${params}`, {
  headers: {
    Authorization: "Bearer your_token_here",
  },
});

const data = await response.json();
```

### Error Handling for GET /api/plans

```javascript
try {
  const response = await fetch("/api/plans?page=invalid", {
    headers: {
      Authorization: "Bearer your_token_here",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("API Error:", error.error);

    switch (response.status) {
      case 400:
        console.error("Invalid parameters:", error.error.details);
        break;
      case 401:
        console.error("Unauthorized - check your token");
        break;
      case 500:
        console.error("Server error:", error.error.message);
        break;
    }
  } else {
    const data = await response.json();
    // Handle success
  }
} catch (error) {
  console.error("Network error:", error);
}
```

## GET /api/plans/{id} Examples

### Basic Request

```bash
curl -X GET "http://localhost:3000/api/plans/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer your_token_here"
```

### Response Structure

The endpoint returns detailed plan information with activities grouped by days:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
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
  "user_id": "user-uuid",
  "job_id": "job-uuid",
  "status": "completed",
  "activities": {
    "1": [
      {
        "id": "activity-uuid",
        "attraction": {
          "id": "attraction-uuid",
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
    ],
    "2": [
      {
        "id": "activity-uuid-2",
        "attraction": {
          "id": "attraction-uuid-2",
          "name": "Louvre Museum",
          "address": "Rue de Rivoli, 75001 Paris",
          "description": "World's largest art museum"
        },
        "day_number": 2,
        "activity_order": 1,
        "accepted": false,
        "custom_desc": null,
        "opening_hours": "09:00-18:00",
        "cost": 17
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

### Error Handling

```bash
# Invalid plan ID format
curl -X GET "http://localhost:3000/api/plans/invalid-uuid" \
  -H "Authorization: Bearer your_token_here"

# Response: 400 Bad Request
{
  "error": {
    "code": "INVALID_PLAN_ID",
    "message": "Invalid plan ID format",
    "details": {
      "formErrors": [],
      "fieldErrors": {
        "": ["Invalid plan ID format"]
      }
    }
  }
}

# Plan not found
curl -X GET "http://localhost:3000/api/plans/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer your_token_here"

# Response: 404 Not Found
{
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan with the given ID does not exist"
  }
}
```

## JavaScript/TypeScript Examples for GET /api/plans/{id}

### Using fetch()

```javascript
// Basic request
const planId = "123e4567-e89b-12d3-a456-426614174000";
const response = await fetch(`/api/plans/${planId}`, {
  headers: {
    Authorization: "Bearer your_token_here",
  },
});

const data = await response.json();
console.log(data.name); // Plan name
console.log(data.activities); // Activities grouped by day
console.log(data.summary); // Plan summary
```

### Error Handling

```javascript
try {
  const planId = "123e4567-e89b-12d3-a456-426614174000";
  const response = await fetch(`/api/plans/${planId}`, {
    headers: {
      Authorization: "Bearer your_token_here",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("API Error:", error.error);

    switch (response.status) {
      case 400:
        console.error("Invalid plan ID:", error.error.details);
        break;
      case 401:
        console.error("Unauthorized - check your token");
        break;
      case 403:
        console.error("Forbidden - plan does not belong to you");
        break;
      case 404:
        console.error("Plan not found:", error.error.message);
        break;
      case 500:
        console.error("Server error:", error.error.message);
        break;
    }
  } else {
    const data = await response.json();
    // Handle success
    console.log(`Plan: ${data.name}`);
    console.log(`Total activities: ${data.summary.total_activities}`);

    // Iterate through activities by day
    Object.entries(data.activities).forEach(([day, activities]) => {
      console.log(`Day ${day}: ${activities.length} activities`);
      activities.forEach((activity) => {
        console.log(`  - ${activity.attraction.name} (${activity.accepted ? "Accepted" : "Pending"})`);
      });
    });
  }
} catch (error) {
  console.error("Network error:", error);
}
```

### TypeScript Interface

```typescript
interface PlanDetail {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  adults_count: number;
  children_count: number;
  budget_total: number | null;
  budget_currency: string | null;
  travel_style: string | null;
  created_at: string;
  user_id: string;
  job_id: string | null;
  status: string | null;
  activities: Record<number, Activity[]>;
  summary: {
    total_days: number;
    total_activities: number;
    accepted_activities: number;
    estimated_total_cost: number;
  };
}

interface Activity {
  id: string;
  attraction: {
    id: string;
    name: string;
    address: string;
    description: string;
  };
  day_number: number;
  activity_order: number;
  accepted: boolean;
  custom_desc: string | null;
  opening_hours: string | null;
  cost: number | null;
}

// Usage
async function getPlanDetails(planId: string): Promise<PlanDetail> {
  const response = await fetch(`/api/plans/${planId}`, {
    headers: {
      Authorization: "Bearer your_token_here",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch plan: ${response.status}`);
  }

  return response.json();
}
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface PlanListParams {
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'name' | 'destination';
  order?: 'asc' | 'desc';
}

interface UsePlansReturn {
  plans: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePlans(params: PlanListParams = {}): UsePlansReturn {
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.order) searchParams.set('order', params.order);

      const response = await fetch(`/api/plans?${searchParams}`, {
        headers: {
          'Authorization': 'Bearer your_token_here'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      const data = await response.json();
      setPlans(data.plans);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [params.page, params.limit, params.sort, params.order]);

  return {
    plans,
    pagination,
    loading,
    error,
    refetch: fetchPlans
  };
}

// Usage in component
function PlansList() {
  const { plans, pagination, loading, error, refetch } = usePlans({
    page: 1,
    limit: 10,
    sort: 'created_at',
    order: 'desc'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>{plan.destination}</p>
        </div>
      ))}
      <div>
        Page {pagination.page} of {pagination.total_pages}
      </div>
    </div>
  );
}
```

## Response Examples

### Successful Response

```json
{
  "plans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
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
      "job_id": "job-123",
      "status": "completed"
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

### Error Response Examples

#### Invalid Parameters (400)

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid query parameters",
    "details": {
      "fieldErrors": {
        "page": ["Page must be a positive integer"]
      }
    }
  }
}
```

#### Server Error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```
