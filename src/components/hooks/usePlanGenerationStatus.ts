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
export function usePlanGenerationStatus(jobId: string | null): UsePlanGenerationStatusResult {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [progress, setProgress] = useState<number>(0);
  const [planId, setPlanId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let isMounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/plans/generate/${jobId}/status`);
        if (!res.ok) {
          throw new Error("Failed to fetch plan generation status");
        }
        const data: GenerationStatusResponse = await res.json();
        if (!isMounted) return;
        setStatus(data.status);
        setProgress(data.progress);
        setPlanId(data.plan_id);
        setError(data.error_message);
      } catch {
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
