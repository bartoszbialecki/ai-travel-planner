# OpenRouter API Usage Examples

## Overview

This document provides practical examples of how to use the OpenRouter AI Service in the AI Travel Planner application. It covers common use cases, error handling, and best practices.

## Basic Usage Examples

### 1. Simple Travel Plan Generation

```typescript
import { createAIService } from "@/lib/services/ai";

const aiService = createAIService();

const request = {
  destination: "Paris, France",
  start_date: "2024-06-01",
  end_date: "2024-06-05",
  adults_count: 2,
  children_count: 0,
  budget_total: 2000,
  budget_currency: "EUR",
  travel_style: "flexible",
};

const result = await aiService.generateTravelPlan(request);

if (result.success) {
  console.log("Generated plan:", result.data);
  console.log("Processing time:", result.processing_time_ms);
} else {
  console.error("Generation failed:", result.error);
}
```

### 2. Family Trip Planning

```typescript
const familyRequest = {
  destination: "Disney World, Orlando",
  start_date: "2024-07-15",
  end_date: "2024-07-20",
  adults_count: 2,
  children_count: 3,
  budget_total: 5000,
  budget_currency: "USD",
  travel_style: "active",
};

const familyResult = await aiService.generateTravelPlan(familyRequest);

if (familyResult.success) {
  const plan = familyResult.data;

  // Process each day
  plan.days.forEach((day) => {
    console.log(`Day ${day.day_number}:`);
    day.activities.forEach((activity) => {
      console.log(`  - ${activity.name} (${activity.opening_hours})`);
    });
  });
}
```

### 3. Budget-Conscious Travel

```typescript
const budgetRequest = {
  destination: "Barcelona, Spain",
  start_date: "2024-09-10",
  end_date: "2024-09-14",
  adults_count: 1,
  children_count: 0,
  budget_total: 800,
  budget_currency: "EUR",
  travel_style: "flexible",
};

const budgetResult = await aiService.generateTravelPlan(budgetRequest);

if (budgetResult.success) {
  const totalCost = budgetResult.data.days.reduce((total, day) => {
    return (
      total +
      day.activities.reduce((dayTotal, activity) => {
        return dayTotal + activity.cost;
      }, 0)
    );
  }, 0);

  console.log(`Total estimated cost: ${totalCost} EUR`);
}
```

## Advanced Usage Examples

### 1. Direct Service Usage with Custom Parameters

```typescript
import { OpenRouterAIService } from "@/lib/services/ai";

const service = new OpenRouterAIService("your_api_key", {
  model: "gpt-4o",
  temperature: 0.8,
  maxTokens: 6000,
  timeout: 45000,
  maxRetries: 5,
});

// Change model for different types of requests
service.setModel("claude-3-sonnet");

// Update parameters dynamically
service.setParameters({
  temperature: 0.5,
  maxTokens: 4000,
});

const result = await service.generateTravelPlan(request);
```

### 2. Error Handling and Retry Logic

```typescript
async function generatePlanWithRetry(request: AIGenerationRequest, maxRetries = 3) {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await aiService.generateTravelPlan(request);

      if (result.success) {
        return result;
      }

      // Handle specific error types
      if (result.error?.includes("rate limit")) {
        console.log(`Rate limited, attempt ${attempt}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      if (result.error?.includes("timeout")) {
        console.log(`Timeout, attempt ${attempt}/${maxRetries}`);
        continue;
      }

      // Non-retryable error
      throw new Error(result.error);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

// Usage
try {
  const result = await generatePlanWithRetry(request);
  console.log("Plan generated successfully:", result.data);
} catch (error) {
  console.error("All retry attempts failed:", error);
}
```

### 3. Monitoring and Health Checks

```typescript
import { openRouterMonitoring } from "@/lib/services/ai/openrouter-monitoring";

// Get service health status
const health = openRouterMonitoring.getHealthStatus();
console.log("Service health:", health);

// Get detailed metrics
const metrics = openRouterMonitoring.getMetrics();
console.log("Service metrics:", metrics);

// Get recent errors
const recentErrors = openRouterMonitoring.getRecentErrors();
if (recentErrors.length > 0) {
  console.log("Recent errors:", recentErrors);
}

// Check if service is healthy
if (!openRouterMonitoring.isHealthy()) {
  console.warn("Service is not healthy, consider fallback");
}
```

### 4. Cache Management

```typescript
import { openRouterCache } from "@/lib/services/ai/openrouter-cache";

// Get cache statistics
const cacheStats = openRouterCache.getStats();
console.log("Cache stats:", cacheStats);

// Clear cache if needed
openRouterCache.clear();

// Manual cache cleanup
const cleanedCount = openRouterCache.cleanup();
console.log(`Cleaned ${cleanedCount} expired entries`);
```

### 5. Circuit Breaker Management

```typescript
import { openRouterCircuitBreaker } from "@/lib/services/ai/openrouter-circuit-breaker";

// Get circuit breaker status
const circuitStats = openRouterCircuitBreaker.getStats();
console.log("Circuit breaker:", circuitStats);

// Check if circuit is healthy
if (!openRouterCircuitBreaker.isHealthy()) {
  console.warn("Circuit breaker is not healthy");
}

// Manual reset if needed
if (circuitStats.state === "OPEN") {
  openRouterCircuitBreaker.reset();
  console.log("Circuit breaker manually reset");
}
```

## Integration Examples

### 1. Express.js API Endpoint

```typescript
import express from "express";
import { createAIService } from "@/lib/services/ai";

const app = express();
const aiService = createAIService();

app.post("/api/plans/generate", async (req, res) => {
  try {
    const request = req.body;

    // Validate request
    if (!request.destination || !request.start_date || !request.end_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await aiService.generateTravelPlan(request);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        processing_time_ms: result.processing_time_ms,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
```

### 2. React Hook for Plan Generation

```typescript
import { useState, useEffect } from 'react';
import { createAIService } from "@/lib/services/ai";

export function usePlanGeneration(request: AIGenerationRequest | null) {
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!request) return;

    const generatePlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const aiService = createAIService();
        const result = await aiService.generateTravelPlan(request);

        setResult(result);

        if (!result.success) {
          setError(result.error || "Generation failed");
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    generatePlan();
  }, [request]);

  return { result, loading, error };
}

// Usage in component
function PlanGenerator() {
  const [request, setRequest] = useState<AIGenerationRequest | null>(null);
  const { result, loading, error } = usePlanGeneration(request);

  const handleGenerate = (planRequest: AIGenerationRequest) => {
    setRequest(planRequest);
  };

  return (
    <div>
      {loading && <div>Generating plan...</div>}
      {error && <div>Error: {error}</div>}
      {result?.success && (
        <div>
          <h3>Generated Plan</h3>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 3. Background Job Processing

```typescript
import { JobQueueService } from "@/lib/services/job-queue";

const jobQueue = JobQueueService.getInstance();

// Add job to queue
const jobId = await jobQueue.addJob("unique-job-id");

// Check job status
const status = await jobQueue.getJobStatus(jobId);
console.log("Job status:", status);

// Poll for completion
const pollStatus = async (jobId: string) => {
  const status = await jobQueue.getJobStatus(jobId);

  if (status?.status === "completed") {
    console.log("Job completed:", status.plan_id);
    return status.plan_id;
  } else if (status?.status === "failed") {
    throw new Error(status.error_message || "Job failed");
  }

  // Continue polling
  setTimeout(() => pollStatus(jobId), 2000);
};
```

## Best Practices

### 1. Request Validation

```typescript
function validateRequest(request: any): request is AIGenerationRequest {
  return (
    typeof request.destination === "string" &&
    typeof request.start_date === "string" &&
    typeof request.end_date === "string" &&
    typeof request.adults_count === "number" &&
    typeof request.children_count === "number" &&
    request.adults_count > 0 &&
    request.children_count >= 0
  );
}

// Usage
if (!validateRequest(request)) {
  throw new Error("Invalid request format");
}
```

### 2. Response Processing

```typescript
function processTravelPlan(plan: AITravelPlanResponse) {
  // Validate plan structure
  if (!plan.days || !Array.isArray(plan.days)) {
    throw new Error("Invalid plan structure");
  }

  // Process each day
  const processedDays = plan.days.map((day) => ({
    ...day,
    activities: day.activities
      .sort((a, b) => a.activity_order - b.activity_order)
      .map((activity) => ({
        ...activity,
        cost: Math.round(activity.cost * 100) / 100, // Round to 2 decimal places
      })),
  }));

  return processedDays;
}
```

### 3. Error Recovery

```typescript
async function generatePlanWithFallback(request: AIGenerationRequest) {
  try {
    const result = await aiService.generateTravelPlan(request);

    if (result.success) {
      return result;
    }

    // Try with different model
    if (aiService instanceof OpenRouterAIService) {
      aiService.setModel("gpt-4o-mini");
      const fallbackResult = await aiService.generateTravelPlan(request);

      if (fallbackResult.success) {
        return fallbackResult;
      }
    }

    throw new Error(result.error || "Generation failed");
  } catch (error) {
    console.error("Plan generation failed:", error);

    // Return mock data as last resort
    return {
      success: true,
      data: generateMockPlan(request),
      processing_time_ms: 0,
    };
  }
}
```

## Performance Tips

1. **Use caching** for similar requests
2. **Implement retry logic** for transient failures
3. **Monitor circuit breaker** state
4. **Optimize prompts** for shorter responses
5. **Use appropriate models** for different complexity levels
6. **Batch similar requests** when possible
7. **Monitor token usage** for cost optimization

## Security Considerations

1. **Validate all inputs** before processing
2. **Sanitize user data** in prompts
3. **Monitor for unusual patterns** in requests
4. **Implement rate limiting** to prevent abuse
5. **Log security events** for audit trails
6. **Use HTTPS** for all API communications
7. **Rotate API keys** regularly
