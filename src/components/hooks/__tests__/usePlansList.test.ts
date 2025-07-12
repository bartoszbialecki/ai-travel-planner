import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePlansList } from "../usePlansList";
import type { PlanListResponse } from "@/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location.origin
Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000" },
  writable: true,
});

describe("usePlansList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => usePlansList());

      expect(result.current.plans).toEqual([]);
      expect(result.current.loading).toBe(true); // Loading is true initially due to useEffect
      expect(result.current.error).toBeNull();
      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.sort).toBe("created_at");
      expect(result.current.order).toBe("desc");
    });

    it("should initialize with custom values", () => {
      const { result } = renderHook(() =>
        usePlansList({
          initialPage: 2,
          initialSort: "name",
          initialOrder: "asc",
          limit: 6,
        })
      );

      expect(result.current.page).toBe(2);
      expect(result.current.sort).toBe("name");
      expect(result.current.order).toBe("asc");
    });
  });

  describe("fetchPlans", () => {
    it("should fetch plans successfully", async () => {
      const mockResponse: PlanListResponse = {
        plans: [
          {
            id: "1",
            name: "Test Plan",
            destination: "Paris",
            start_date: "2024-01-01",
            end_date: "2024-01-05",
            adults_count: 2,
            children_count: 0,
            budget_total: 1000,
            budget_currency: "EUR",
            travel_style: "active",
            created_at: "2024-01-01T00:00:00Z",
            job_id: "job-1",
            status: "completed",
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          total_pages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/plans?page=1&limit=12&sort=created_at&order=desc"
      );
      expect(result.current.plans).toEqual(mockResponse.plans);
      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to fetch plans list");
      expect(result.current.plans).toEqual([]);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.plans).toEqual([]);
    });

    it("should handle unknown errors", async () => {
      mockFetch.mockRejectedValueOnce("Unknown error type");

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Unknown error");
      expect(result.current.plans).toEqual([]);
    });

    it("should handle non-array plans response", async () => {
      const mockResponse = {
        plans: null, // Invalid response
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          total_pages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.plans).toEqual([]);
    });

    it("should use custom parameters when provided", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 2, limit: 6, total: 0, total_pages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList({ initialPage: 2, limit: 6 }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/plans?page=2&limit=6&sort=created_at&order=desc"
      );
    });
  });

  describe("setPage", () => {
    it("should change page within valid range", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 24, total_pages: 2 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock response for page 2
      const mockResponse2: PlanListResponse = {
        plans: [],
        pagination: { page: 2, limit: 12, total: 24, total_pages: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2,
      });

      result.current.setPage(2);

      await waitFor(() => {
        expect(result.current.page).toBe(2);
      });
    });

    it("should not change page below 1", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 12, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialPage = result.current.page;
      result.current.setPage(0);

      expect(result.current.page).toBe(initialPage);
    });

    it("should not change page above total pages", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 12, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialPage = result.current.page;
      result.current.setPage(3);

      expect(result.current.page).toBe(initialPage);
    });
  });

  describe("setSort", () => {
    it("should change sort and reset page to 1", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 12, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList({ initialPage: 2 }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock response for sort change
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      result.current.setSort("name", "asc");

      await waitFor(() => {
        expect(result.current.sort).toBe("name");
        expect(result.current.order).toBe("asc");
        expect(result.current.page).toBe(1); // Should reset to 1
      });
    });

    it("should handle all valid sort options", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 12, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Test all sort combinations
      const sortOptions = ["created_at", "name", "destination"] as const;
      const orderOptions = ["asc", "desc"] as const;

      for (const sort of sortOptions) {
        for (const order of orderOptions) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          });

          result.current.setSort(sort, order);

          await waitFor(() => {
            expect(result.current.sort).toBe(sort);
            expect(result.current.order).toBe(order);
          });
        }
      }
    });
  });

  describe("loading states", () => {
    it("should set loading to true during fetch", async () => {
      let resolveFetch: ((value: unknown) => void) | undefined;
      const fetchPromise = new Promise<unknown>((resolve) => {
        resolveFetch = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => usePlansList());

      expect(result.current.loading).toBe(true);

      if (resolveFetch) {
        resolveFetch({
          ok: true,
          json: async () => ({
            plans: [],
            pagination: { page: 1, limit: 12, total: 0, total_pages: 1 },
          }),
        });
      }

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should clear error when starting new fetch", async () => {
      // First, establish a successful state with multiple pages
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            plans: [],
            pagination: { page: 1, limit: 12, total: 24, total_pages: 2 },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            plans: [],
            pagination: { page: 1, limit: 12, total: 24, total_pages: 2 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            plans: [],
            pagination: { page: 2, limit: 12, total: 24, total_pages: 2 },
          }),
        });

      const { result } = renderHook(() => usePlansList());

      // Wait for first successful fetch to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.totalPages).toBe(2);
      });

      // Trigger a sort change that will cause an error
      await act(async () => {
        result.current.setSort("name", "asc");
      });

      // Wait for error fetch to complete
      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch plans list");
        expect(result.current.loading).toBe(false);
        expect(result.current.totalPages).toBe(2); // totalPages preserved from previous successful fetch
      });

      // Trigger a new fetch by changing page, wrapped in act
      await act(async () => {
        result.current.setPage(2);
      });

      // Wait for the fetch to complete and error to be cleared
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.page).toBe(2);
      });
    });
  });

  describe("URL construction", () => {
    it("should construct URL with all parameters correctly", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 0, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      renderHook(() =>
        usePlansList({
          initialPage: 3,
          initialSort: "destination",
          initialOrder: "asc",
          limit: 8,
        })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:3000/api/plans?page=3&limit=8&sort=destination&order=asc"
        );
      });
    });

    it("should use current state when no params provided to fetchPlans", async () => {
      const mockResponse: PlanListResponse = {
        plans: [],
        pagination: { page: 1, limit: 12, total: 0, total_pages: 1 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => usePlansList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock response for manual fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      result.current.fetchPlans();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://localhost:3000/api/plans?page=1&limit=12&sort=created_at&order=desc"
        );
      });
    });
  });
});
