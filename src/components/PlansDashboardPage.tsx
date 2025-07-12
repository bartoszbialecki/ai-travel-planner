import React from "react";
import { usePlansList } from "@/components/hooks/usePlansList";
import PlansGrid from "@/components/PlansGrid";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import SortSelect from "@/components/SortSelect";

/**
 * PlansDashboardPage
 * Main dashboard view for user travel plans.
 * Handles fetching, sorting, pagination, and presentation of plans list.
 * Integrates with API via usePlansList hook.
 */
const PlansDashboardPage: React.FC = () => {
  const { plans, loading, error, page, totalPages, sort, order, setPage, setSort } = usePlansList({});

  // Handles sort change
  const handleSortChange = (newSort: typeof sort, newOrder: typeof order) => {
    setSort(newSort, newOrder);
  };

  // Returns href for plan details
  const handlePlanClick = (id: string) => `/plans/${id}`;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your travel plans</h1>
        <a href="/generate" tabIndex={0} className="shadcn-btn shadcn-btn-primary">
          + New plan
        </a>
      </div>
      <SortSelect sort={sort} order={order} onSortChange={handleSortChange} />
      {loading ? (
        <PlansGrid plans={[]} onPlanClick={handlePlanClick} loading />
      ) : error ? (
        <div className="py-12 text-center text-destructive">{error}</div>
      ) : plans.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <PlansGrid plans={plans} onPlanClick={handlePlanClick} />
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default PlansDashboardPage;
