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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-2/3 mb-1" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-1/3 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <a
          key={plan.id}
          href={onPlanClick(plan.id)}
          className="block focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Details of plan ${plan.name}`}
        >
          <Card className="cursor-pointer hover:shadow-lg">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-sm text-muted-foreground">{plan.destination}</div>
            </CardHeader>
            <CardContent>
              <div className="text-xs mb-1">
                {plan.start_date} - {plan.end_date}
              </div>
              <div className="text-xs mb-1">
                {plan.adults_count} adults, {plan.children_count} children
              </div>
              <div className="text-xs mb-1">Style: {plan.travel_style || "-"}</div>
              <div className="text-xs text-right text-muted-foreground">Created: {plan.created_at?.slice(0, 10)}</div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
};

export default React.memo(PlansGrid);
