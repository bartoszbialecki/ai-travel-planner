import { useCallback, useEffect, useState } from "react";
import type { PlanListResponse, PlanListParams } from "@/types";

interface UsePlansListOptions {
  initialPage?: number;
  initialSort?: "created_at" | "name" | "destination";
  initialOrder?: "asc" | "desc";
  limit?: number;
}

export function usePlansList({
  initialPage = 1,
  initialSort = "created_at",
  initialOrder = "desc",
  limit = 12,
}: UsePlansListOptions = {}) {
  const [plans, setPlans] = useState<PlanListResponse["plans"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"created_at" | "name" | "destination">(initialSort);
  const [order, setOrder] = useState<"asc" | "desc">(initialOrder);

  const fetchPlans = useCallback(
    async (params?: Partial<PlanListParams>) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/plans", window.location.origin);
        url.searchParams.set("page", String(params?.page ?? page));
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("sort", params?.sort ?? sort);
        url.searchParams.set("order", params?.order ?? order);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch plans list");
        const data: PlanListResponse = await res.json();
        setPlans(Array.isArray(data.plans) ? data.plans : []);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } catch (e: unknown) {
        let message = "Unknown error";
        if (e instanceof Error) message = e.message;
        setError(message);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    },
    [page, sort, order, limit]
  );

  useEffect(() => {
    fetchPlans();
  }, [page, sort, order, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handleSortChange = (newSort: typeof sort, newOrder: typeof order) => {
    setSort(newSort);
    setOrder(newOrder);
    setPage(1); // reset page on sort change
  };

  return {
    plans,
    loading,
    error,
    page,
    totalPages,
    sort,
    order,
    fetchPlans,
    setPage: handlePageChange,
    setSort: handleSortChange,
  };
}
