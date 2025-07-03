import React from "react";
import type { PlanSummary as PlanSummaryType } from "@/types";
import { Card, CardContent } from "../ui/card";

interface PlanSummaryProps {
  summary: PlanSummaryType;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({ summary }) => {
  return (
    <Card className="my-4">
      <CardContent className="flex flex-col gap-2">
        <div>
          Liczba dni: <span className="font-semibold">{summary.total_days}</span>
        </div>
        <div>
          Liczba aktywności: <span className="font-semibold">{summary.total_activities}</span>
        </div>
        <div>
          Zaakceptowane aktywności: <span className="font-semibold">{summary.accepted_activities}</span>
        </div>
        <div>
          Szacowany koszt: <span className="font-semibold">{summary.estimated_total_cost} zł</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanSummary;
