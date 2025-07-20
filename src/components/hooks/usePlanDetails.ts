import { useState, useEffect, useCallback } from "react";
import type { PlanDetailResponse } from "@/types";

interface UsePlanDetailsResult {
  plan: PlanDetailResponse | null;
  loading: boolean;
  error: string | null;
  currentDay: number;
  setCurrentDay: (day: number) => void;
  onDelete: () => Promise<void>;
  onActivityEdit: (
    activityId: string,
    data: { custom_desc?: string | null; opening_hours?: string | null; cost?: number | null }
  ) => Promise<void>;
  onActivityAccept: (activityId: string) => Promise<void>;
  onActivityReject: (activityId: string) => Promise<void>;
}

// Helper function to handle API responses consistently
async function handleApiResponse<T>(response: Response, defaultErrorMessage: string): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || defaultErrorMessage);
  }
  return response.json();
}

// Helper function to create optimistic updates for activities
function createOptimisticActivityUpdate(
  plan: PlanDetailResponse,
  activityId: string,
  updates: Record<string, unknown>
): PlanDetailResponse {
  const updatedActivities = { ...plan.activities };
  for (const day in updatedActivities) {
    updatedActivities[day] = updatedActivities[day].map((activity) =>
      activity.id === activityId ? { ...activity, ...updates } : activity
    );
  }
  return { ...plan, activities: updatedActivities };
}

// Helper function to perform optimistic updates with rollback
async function performOptimisticUpdate<T>(
  currentPlan: PlanDetailResponse,
  activityId: string,
  updates: Record<string, unknown>,
  apiCall: () => Promise<T>,
  setPlan: (plan: PlanDetailResponse) => void,
  setError: (error: string | null) => void,
  defaultErrorMessage: string
): Promise<T> {
  if (!currentPlan) throw new Error("Plan not available");

  setError(null);

  // Store previous state for rollback
  const previousPlan = JSON.parse(JSON.stringify(currentPlan));

  // Apply optimistic update
  const optimisticPlan = createOptimisticActivityUpdate(currentPlan, activityId, updates);
  setPlan(optimisticPlan);

  try {
    const result = await apiCall();
    return result;
  } catch (err) {
    // Rollback on error
    setPlan(previousPlan);
    const errorMessage = err instanceof Error ? err.message : defaultErrorMessage;
    setError(errorMessage);
    throw err;
  }
}

export function usePlanDetails(planId: string): UsePlanDetailsResult {
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);

  // Fetch plan details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/plans/${planId}`)
      .then((res) => handleApiResponse<PlanDetailResponse>(res, "Failed to fetch plan"))
      .then((data: PlanDetailResponse) => {
        if (isMounted) {
          setPlan(data);
          // Set default day to the first available
          const days = Object.keys(data.activities)
            .map(Number)
            .sort((a, b) => a - b);
          setCurrentDay(days[0] || 1);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [planId]);

  // Delete plan
  const onDelete = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await handleApiResponse(await fetch(`/api/plans/${planId}`, { method: "DELETE" }), "Failed to delete plan");
      setPlan(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete plan";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  // Edit activity (description, hours, cost)
  const onActivityEdit = useCallback(
    async (
      activityId: string,
      data: { custom_desc?: string | null; opening_hours?: string | null; cost?: number | null }
    ) => {
      if (!plan) return;

      await performOptimisticUpdate(
        plan,
        activityId,
        data,
        async () => {
          const res = await fetch(`/api/plans/${planId}/activities/${activityId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          return handleApiResponse(res, "Failed to edit activity");
        },
        setPlan,
        setError,
        "Failed to edit activity"
      );
    },
    [plan, planId]
  );

  // Accept activity
  const onActivityAccept = useCallback(
    async (activityId: string) => {
      if (!plan) return;

      await performOptimisticUpdate(
        plan,
        activityId,
        { accepted: true },
        async () => {
          const res = await fetch(`/api/plans/${planId}/activities/${activityId}/accept`, {
            method: "PUT",
          });
          return handleApiResponse(res, "Failed to accept activity");
        },
        setPlan,
        setError,
        "Failed to accept activity"
      );
    },
    [plan, planId]
  );

  // Reject activity
  const onActivityReject = useCallback(
    async (activityId: string) => {
      if (!plan) return;

      await performOptimisticUpdate(
        plan,
        activityId,
        { accepted: false },
        async () => {
          const res = await fetch(`/api/plans/${planId}/activities/${activityId}/reject`, {
            method: "PUT",
          });
          return handleApiResponse(res, "Failed to reject activity");
        },
        setPlan,
        setError,
        "Failed to reject activity"
      );
    },
    [plan, planId]
  );

  return {
    plan,
    loading,
    error,
    currentDay,
    setCurrentDay,
    onDelete,
    onActivityEdit,
    onActivityAccept,
    onActivityReject,
  };
}
