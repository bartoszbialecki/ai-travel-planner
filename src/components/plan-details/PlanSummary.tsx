import React from "react";
import type { PlanSummary as PlanSummaryType } from "@/types";
import { Card, CardContent } from "../ui/card";

interface PlanSummaryProps {
  summary: PlanSummaryType;
  currency?: string;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({ summary, currency = "USD" }) => {
  return (
    <Card className="my-4">
      <CardContent className="flex flex-col gap-2">
        <div>
          Number of days: <span className="font-semibold">{summary.total_days}</span>
        </div>
        <div>
          Number of activities: <span className="font-semibold">{summary.total_activities}</span>
        </div>
        <div>
          Accepted activities: <span className="font-semibold">{summary.accepted_activities}</span>
        </div>
        <div>
          Estimated cost:{" "}
          <span className="font-semibold">
            {summary.estimated_total_cost} {currency}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSummary;
