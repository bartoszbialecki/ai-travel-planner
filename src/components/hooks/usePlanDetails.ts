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
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || "Błąd pobierania planu");
        }
        return res.json();
      })
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
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Błąd usuwania planu");
      }
      // Redirect or clear plan after deletion
      setPlan(null);
    } catch (err: any) {
      setError(err.message || "Błąd usuwania planu");
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
      setError(null);
      // Optimistic update
      const prevPlan = JSON.parse(JSON.stringify(plan));
      const updatedActivities = { ...plan.activities };
      for (const day in updatedActivities) {
        updatedActivities[day] = updatedActivities[day].map((a) => (a.id === activityId ? { ...a, ...data } : a));
      }
      setPlan({ ...plan, activities: updatedActivities });
      try {
        const res = await fetch(`/api/plans/${planId}/activities/${activityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const resp = await res.json().catch(() => ({}));
          throw new Error(resp?.error?.message || "Błąd edycji aktywności");
        }
      } catch (err: any) {
        setPlan(prevPlan);
        setError(err.message || "Błąd edycji aktywności");
      }
    },
    [plan, planId]
  );

  // Accept activity
  const onActivityAccept = useCallback(
    async (activityId: string) => {
      if (!plan) return;
      setError(null);
      // Optimistic update
      const prevPlan = JSON.parse(JSON.stringify(plan));
      const updatedActivities = { ...plan.activities };
      for (const day in updatedActivities) {
        updatedActivities[day] = updatedActivities[day].map((a) =>
          a.id === activityId ? { ...a, accepted: true } : a
        );
      }
      setPlan({ ...plan, activities: updatedActivities });
      try {
        const res = await fetch(`/api/plans/${planId}/activities/${activityId}/accept`, { method: "PUT" });
        if (!res.ok) {
          const resp = await res.json().catch(() => ({}));
          throw new Error(resp?.error?.message || "Błąd akceptacji aktywności");
        }
      } catch (err: any) {
        setPlan(prevPlan);
        setError(err.message || "Błąd akceptacji aktywności");
      }
    },
    [plan, planId]
  );

  // Reject activity
  const onActivityReject = useCallback(
    async (activityId: string) => {
      if (!plan) return;
      setError(null);
      // Optimistic update
      const prevPlan = JSON.parse(JSON.stringify(plan));
      const updatedActivities = { ...plan.activities };
      for (const day in updatedActivities) {
        updatedActivities[day] = updatedActivities[day].map((a) =>
          a.id === activityId ? { ...a, accepted: false } : a
        );
      }
      setPlan({ ...plan, activities: updatedActivities });
      try {
        const res = await fetch(`/api/plans/${planId}/activities/${activityId}/reject`, { method: "PUT" });
        if (!res.ok) {
          const resp = await res.json().catch(() => ({}));
          throw new Error(resp?.error?.message || "Błąd odrzucenia aktywności");
        }
      } catch (err: any) {
        setPlan(prevPlan);
        setError(err.message || "Błąd odrzucenia aktywności");
      }
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
