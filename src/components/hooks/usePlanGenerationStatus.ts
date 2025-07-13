import { useEffect, useRef, useState } from "react";
import type { GenerationStatusResponse } from "../../types";

interface UsePlanGenerationStatusResult {
  status: "processing" | "completed" | "failed";
  progress: number;
  planId?: string;
  error?: string;
}

/**
 * Custom hook for polling the plan generation status API
 */
export function usePlanGenerationStatus(jobId: string | null | undefined): UsePlanGenerationStatusResult {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [progress, setProgress] = useState<number>(0);
  const [planId, setPlanId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const requestCounterRef = useRef<number>(0);

  useEffect(() => {
    if (!jobId) return;
    let isMounted = true;

    // Reset all state when jobId changes
    requestCounterRef.current = 0;
    setStatus("processing");
    setProgress(0);
    setPlanId(undefined);
    setError(undefined);

    async function fetchStatus() {
      // Increment request counter for this specific request
      const requestId = ++requestCounterRef.current;

      try {
        const res = await fetch(`/api/plans/generate/${jobId}/status`);
        if (!res.ok) {
          throw new Error("Failed to fetch plan generation status");
        }
        const data: GenerationStatusResponse = await res.json();

        // Only update state if this is the most recent request and component is still mounted
        if (!isMounted || requestId !== requestCounterRef.current) return;

        // Validate response data has required properties
        if (!data || typeof data.status !== "string" || typeof data.progress !== "number") {
          throw new Error("Invalid response data");
        }

        setStatus(data.status);
        setProgress(data.progress);
        setPlanId(data.plan_id);
        setError(data.error_message);

        // Stop polling if status is completed or failed
        if (data.status === "completed" || data.status === "failed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Only update error if this is the most recent request and component is still mounted
        if (!isMounted || requestId !== requestCounterRef.current) return;
        setError("Could not fetch plan generation status");
      }
    }

    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 2000);

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId]);

  return { status, progress, planId, error };
}
