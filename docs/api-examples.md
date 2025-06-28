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

### Using fetch()

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

### Error Handling

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
