import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlanGenerationStatus } from "../usePlanGenerationStatus";
import type { GenerationStatusResponse } from "../../../types";

// Mock fetch globally
global.fetch = vi.fn();

describe("usePlanGenerationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should return initial state", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 0,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      expect(result.current.status).toBe("processing");
      expect(result.current.progress).toBe(0);
      expect(result.current.planId).toBeUndefined();
      expect(result.current.error).toBeUndefined();

      // Wait for async operations to complete
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
    });

    it("should not fetch when jobId is null", async () => {
      const { unmount } = renderHook(() => usePlanGenerationStatus(null));

      expect(fetch).not.toHaveBeenCalled();

      // Wait for any potential async operations
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      unmount();
    });

    it("should not fetch when jobId is undefined", async () => {
      const { unmount } = renderHook(() => usePlanGenerationStatus(undefined));

      expect(fetch).not.toHaveBeenCalled();

      // Wait for any potential async operations
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      unmount();
    });

    it("should not fetch when jobId is empty string", async () => {
      const { unmount } = renderHook(() => usePlanGenerationStatus(""));

      expect(fetch).not.toHaveBeenCalled();

      // Wait for any potential async operations
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      unmount();
    });
  });

  describe("Polling behavior", () => {
    it("should fetch status immediately on mount", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Wait for the initial fetch to complete
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(fetch).toHaveBeenCalledWith("/api/plans/generate/test-job-123/status");
    });

    it("should poll every 2 seconds", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 25,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Let initial calls complete
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      const callsAfterInit = vi.mocked(fetch).mock.calls.length;

      // Advance time and verify polling continues
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await vi.runOnlyPendingTimersAsync();
      });

      const callsAfterFirstInterval = vi.mocked(fetch).mock.calls.length;
      expect(callsAfterFirstInterval).toBeGreaterThan(callsAfterInit);

      // Advance time again
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await vi.runOnlyPendingTimersAsync();
      });

      const callsAfterSecondInterval = vi.mocked(fetch).mock.calls.length;
      expect(callsAfterSecondInterval).toBeGreaterThan(callsAfterFirstInterval);
    });

    it("should stop polling when component unmounts", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 25,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { unmount } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Wait for initial call
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      const initialCallCount = vi.mocked(fetch).mock.calls.length;
      expect(initialCallCount).toBeGreaterThan(0);

      unmount();

      // After unmount, no more calls should be made
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(initialCallCount);
    });

    it("should restart polling when jobId changes", async () => {
      const mockResponse1: GenerationStatusResponse = {
        job_id: "job-1",
        status: "processing",
        progress: 25,
        plan_id: undefined,
        error_message: undefined,
      };

      const mockResponse2: GenerationStatusResponse = {
        job_id: "job-2",
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => mockResponse2,
        } as Response);

      const { rerender } = renderHook(({ jobId }) => usePlanGenerationStatus(jobId), {
        initialProps: { jobId: "job-1" },
      });

      // Wait for initial fetch for job-1
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledWith("/api/plans/generate/job-1/status");

      // Change jobId
      act(() => {
        rerender({ jobId: "job-2" });
      });

      // Wait for fetch for job-2
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledWith("/api/plans/generate/job-2/status");
    });

    it("should stop polling when status becomes completed", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "completed",
        progress: 100,
        plan_id: "plan-456",
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Wait for initial call
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(1);

      // After 2 seconds, should not poll again since status is completed
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should stop polling when status becomes failed", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "failed",
        progress: 0,
        plan_id: undefined,
        error_message: "AI service error",
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Wait for initial call
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(1);

      // After 2 seconds, should not poll again since status is failed
      await act(async () => {
        vi.advanceTimersByTime(2000);
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Status updates", () => {
    it("should update status from API response", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 75,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.status).toBe("processing");
      expect(result.current.progress).toBe(75);
      expect(result.current.planId).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it("should handle completed status with plan ID", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "completed",
        progress: 100,
        plan_id: "plan-456",
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.status).toBe("completed");
      expect(result.current.progress).toBe(100);
      expect(result.current.planId).toBe("plan-456");
      expect(result.current.error).toBeUndefined();
    });

    it("should handle failed status with error message", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "failed",
        progress: 0,
        plan_id: undefined,
        error_message: "AI service timeout",
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.status).toBe("failed");
      expect(result.current.progress).toBe(0);
      expect(result.current.planId).toBeUndefined();
      expect(result.current.error).toBe("AI service timeout");
    });

    it("should handle progressive status updates", async () => {
      const responses = [
        {
          job_id: "test-job-123",
          status: "processing" as const,
          progress: 25,
          plan_id: undefined,
          error_message: undefined,
        },
        {
          job_id: "test-job-123",
          status: "processing" as const,
          progress: 50,
          plan_id: undefined,
          error_message: undefined,
        },
        {
          job_id: "test-job-123",
          status: "processing" as const,
          progress: 75,
          plan_id: undefined,
          error_message: undefined,
        },
        {
          job_id: "test-job-123",
          status: "completed" as const,
          progress: 100,
          plan_id: "plan-456",
          error_message: undefined,
        },
      ];

      let callCount = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        const responseIndex = Math.min(callCount, responses.length - 1);
        const response = responses[responseIndex];
        callCount++;
        return {
          ok: true,
          json: async () => response,
        } as Response;
      });

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Let the hook make several calls and verify progression
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Continue advancing time until we reach completed status
      let attempts = 0;
      while (result.current.status !== "completed" && attempts < 10) {
        await act(async () => {
          vi.advanceTimersByTime(2000);
          await vi.runOnlyPendingTimersAsync();
        });
        attempts++;
      }

      // Should eventually reach completed status
      expect(result.current.status).toBe("completed");
      expect(result.current.progress).toBe(100);
      expect(result.current.planId).toBe("plan-456");
    });

    it("should reset state when jobId changes", async () => {
      const mockResponse1: GenerationStatusResponse = {
        job_id: "job-1",
        status: "completed",
        progress: 100,
        plan_id: "plan-1",
        error_message: undefined,
      };

      const mockResponse2: GenerationStatusResponse = {
        job_id: "job-2",
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => mockResponse2,
        } as Response);

      const { result, rerender } = renderHook(({ jobId }) => usePlanGenerationStatus(jobId), {
        initialProps: { jobId: "job-1" },
      });

      // Wait for first job to complete
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(result.current.status).toBe("completed");
      expect(result.current.planId).toBe("plan-1");

      // Change jobId - should reset state
      act(() => {
        rerender({ jobId: "job-2" });
      });

      // Should immediately reset to initial state
      expect(result.current.status).toBe("processing");
      expect(result.current.progress).toBe(0);
      expect(result.current.planId).toBeUndefined();
      expect(result.current.error).toBeUndefined();

      // Wait for new job data
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      expect(result.current.progress).toBe(50);
    });
  });

  describe("Error handling", () => {
    it("should handle fetch network errors", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.error).toBe("Could not fetch plan generation status");
    });

    it("should handle HTTP error responses", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.error).toBe("Could not fetch plan generation status");
    });

    it("should handle invalid JSON responses", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.error).toBe("Could not fetch plan generation status");
    });

    it("should continue polling after errors", async () => {
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(async () => {
        if (callCount === 0) {
          callCount++;
          throw new Error("Network error");
        }
        return {
          ok: true,
          json: async () => ({
            job_id: "test-job-123",
            status: "processing",
            progress: 50,
            plan_id: undefined,
            error_message: undefined,
          }),
        } as Response;
      });

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Let the hook make calls and handle the error
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Continue advancing time until we get either an error or success
      let attempts = 0;
      while (!result.current.error && result.current.progress === 0 && attempts < 10) {
        await act(async () => {
          vi.advanceTimersByTime(2000);
          await vi.runOnlyPendingTimersAsync();
        });
        attempts++;
      }

      // Should eventually get an error or success
      const hasError = result.current.error === "Could not fetch plan generation status";
      const hasSuccess = result.current.progress === 50;

      // If we got an error, continue polling until success
      if (hasError) {
        let successAttempts = 0;
        while (result.current.error && successAttempts < 10) {
          await act(async () => {
            vi.advanceTimersByTime(2000);
            await vi.runOnlyPendingTimersAsync();
          });
          successAttempts++;
        }

        // Should eventually recover
        expect(result.current.error).toBeUndefined();
        expect(result.current.progress).toBe(50);
      } else {
        // If we got success directly, that's also valid
        expect(hasSuccess).toBe(true);
      }
    });

    it("should not update state if component is unmounted during fetch", async () => {
      let resolvePromise!: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(fetch).mockReturnValue(fetchPromise);

      const { result, unmount } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Start with initial state
      expect(result.current.status).toBe("processing");
      expect(result.current.progress).toBe(0);

      // Unmount before fetch resolves
      unmount();

      // Resolve the fetch
      resolvePromise({
        ok: true,
        json: async () => ({
          job_id: "test-job-123",
          status: "completed",
          progress: 100,
          plan_id: "plan-456",
          error_message: undefined,
        }),
      } as Response);

      // State should not have changed after unmount
      expect(result.current.status).toBe("processing");
      expect(result.current.progress).toBe(0);
    });
  });

  describe("Race condition handling", () => {
    it("should handle overlapping fetch requests", async () => {
      let resolveFirst!: (value: Response) => void;
      let resolveSecond!: (value: Response) => void;

      const firstPromise = new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      });

      const secondPromise = new Promise<Response>((resolve) => {
        resolveSecond = resolve;
      });

      vi.mocked(fetch).mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      // Trigger second request while first is pending
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Resolve second request first (more recent data)
      await act(async () => {
        resolveSecond({
          ok: true,
          json: async () => ({
            job_id: "test-job-123",
            status: "completed",
            progress: 100,
            plan_id: "plan-456",
            error_message: undefined,
          }),
        } as Response);
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.status).toBe("completed");

      // Resolve first request (older data) - should not override newer data
      await act(async () => {
        resolveFirst({
          ok: true,
          json: async () => ({
            job_id: "test-job-123",
            status: "processing",
            progress: 50,
            plan_id: undefined,
            error_message: undefined,
          }),
        } as Response);
        await vi.runOnlyPendingTimersAsync();
      });

      // Should still show completed status (newer data)
      expect(result.current.status).toBe("completed");
      expect(result.current.progress).toBe(100);
    });
  });

  describe("Edge cases", () => {
    it("should handle null response data", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => null,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.error).toBe("Could not fetch plan generation status");
    });

    it("should handle malformed response data", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: "data" }),
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus("test-job-123"));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Should handle gracefully - malformed data should trigger error handling
      expect(result.current.error).toBe("Could not fetch plan generation status");
    });

    it("should handle very long jobId", async () => {
      const longJobId = "a".repeat(1000);
      const mockResponse: GenerationStatusResponse = {
        job_id: longJobId,
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => usePlanGenerationStatus(longJobId));

      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      expect(fetch).toHaveBeenCalledWith(`/api/plans/generate/${longJobId}/status`);
      expect(result.current.status).toBe("processing");
    });

    it("should handle rapid jobId changes", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "job-5",
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { rerender } = renderHook(({ jobId }) => usePlanGenerationStatus(jobId), {
        initialProps: { jobId: "job-1" },
      });

      // Rapidly change jobId multiple times
      act(() => {
        rerender({ jobId: "job-2" });
        rerender({ jobId: "job-3" });
        rerender({ jobId: "job-4" });
        rerender({ jobId: "job-5" });
      });

      // Wait for fetch to complete
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });

      // Should only fetch for the final jobId
      expect(fetch).toHaveBeenLastCalledWith("/api/plans/generate/job-5/status");
    });

    it("should handle jobId changing to null", async () => {
      const mockResponse: GenerationStatusResponse = {
        job_id: "test-job-123",
        status: "processing",
        progress: 50,
        plan_id: undefined,
        error_message: undefined,
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { rerender } = renderHook(
        ({ jobId }: { jobId: string | null | undefined }) => usePlanGenerationStatus(jobId),
        {
          initialProps: { jobId: "test-job-123" as string | null | undefined },
        }
      );

      // Wait for initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync();
      });
      const initialCallCount = vi.mocked(fetch).mock.calls.length;
      expect(initialCallCount).toBeGreaterThan(0);

      // Change to null
      act(() => {
        rerender({ jobId: null });
      });

      // Should stop polling
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await vi.runOnlyPendingTimersAsync();
      });
      expect(fetch).toHaveBeenCalledTimes(initialCallCount);
    });
  });
});
