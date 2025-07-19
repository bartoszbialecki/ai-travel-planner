import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlanListResponse } from "@/types";

/**
 * PlansGrid
 * Renders a grid of travel plans as cards (shadcn/ui Card), each wrapped in <a> for navigation.
 * Props:
 * - plans: list of plans to display
 * - onPlanClick: function returning href for a given plan id
 * - loading?: show skeletons instead of data
 */
interface PlansGridProps {
  plans: PlanListResponse["plans"];
  onPlanClick: (id: string) => string;
  loading?: boolean;
}

const PlansGrid: React.FC<PlansGridProps> = ({ plans, onPlanClick, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200"></div>
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const startDate = new Date(plan.start_date);
        const endDate = new Date(plan.end_date);
        const isActive = endDate >= new Date();
        const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <a
            key={plan.id}
            href={onPlanClick(plan.id)}
            className="group block focus:outline-none"
            aria-label={`Details of plan ${plan.name}`}
          >
            <Card className="cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-strong hover:-translate-y-1 border-gray-200 hover:border-gray-300">
              {/* Header with gradient */}
              <div className="h-24 gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/80"></div>
                      <span className="text-white/90 text-sm font-medium">{isActive ? "Active" : "Past"}</span>
                    </div>
                    <div className="text-white/80 text-sm">
                      {daysCount} day{daysCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {plan.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{plan.destination}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Dates</span>
                    <span className="font-medium text-gray-900">
                      {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                      {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Travelers</span>
                    <span className="font-medium text-gray-900">
                      {plan.adults_count} adult{plan.adults_count !== 1 ? "s" : ""}
                      {plan.children_count > 0 &&
                        `, ${plan.children_count} child${plan.children_count !== 1 ? "ren" : ""}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Style</span>
                    <span className="font-medium text-gray-900 capitalize">{plan.travel_style || "Flexible"}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Created{" "}
                        {new Date(plan.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Details</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
};

export default React.memo(PlansGrid);
