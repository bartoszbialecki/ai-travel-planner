import React from "react";
import { usePlansList } from "@/components/hooks/usePlansList";
import PlansGrid from "@/components/PlansGrid";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import SortSelect from "@/components/SortSelect";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";

/**
 * PlansDashboardPage
 * Main dashboard view for user travel plans.
 * Handles fetching, sorting, pagination, and presentation of plans list.
 * Integrates with API via usePlansList hook.
 */
const PlansDashboardPage: React.FC = () => {
  const { plans, loading, error, page, totalPages, sort, order, setPage, setSort, fetchPlans } = usePlansList({});

  // Handles sort change
  const handleSortChange = (newSort: typeof sort, newOrder: typeof order) => {
    setSort(newSort, newOrder);
  };

  // Returns href for plan details
  const handlePlanClick = (id: string) => `/plans/${id}`;

  // Handles retry button click
  const handleRetry = () => {
    fetchPlans();
  };

  // Calculate plan statistics
  const now = new Date();
  const activePlans = plans.filter((plan) => new Date(plan.end_date) >= now);
  const completedPlans = plans.filter((plan) => new Date(plan.end_date) < now);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto py-12 px-6">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Travel Plans</h1>
              <p className="text-lg text-gray-600">Manage and explore your AI-generated travel itineraries</p>
            </div>
            <Button asChild size="lg" className="gradient-primary hover:opacity-90 transition-opacity shadow-medium">
              <a href="/generate" tabIndex={0}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Plan
              </a>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Total Plans"
              value={plans.length}
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
              bgColor="bg-blue-50"
            />
            <StatsCard
              title="Active Plans"
              value={activePlans.length}
              icon={
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              }
              bgColor="bg-purple-50"
            />
            <StatsCard
              title="Completed Plans"
              value={completedPlans.length}
              icon={
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              bgColor="bg-orange-50"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">All Plans</h2>
            <SortSelect sort={sort} order={order} onSortChange={handleSortChange} />
          </div>

          {loading ? (
            <PlansGrid plans={[]} onPlanClick={handlePlanClick} loading />
          ) : error ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Something went wrong</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <PlansGrid plans={plans} onPlanClick={handlePlanClick} />
              {totalPages > 1 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlansDashboardPage;
