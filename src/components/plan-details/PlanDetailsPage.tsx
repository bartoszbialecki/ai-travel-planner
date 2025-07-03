import React from "react";
import { usePlanDetails } from "../hooks/usePlanDetails";
import PlanHeader from "./PlanHeader";
import DaysList from "./DaysList";
import DaySection from "./DaySection";
import PlanSummary from "./PlanSummary";

interface PlanDetailsPageProps {
  planId: string;
}

const PlanDetailsPage: React.FC<PlanDetailsPageProps> = ({ planId }) => {
  // Integrate with usePlanDetails hook
  const {
    plan,
    loading,
    error,
    currentDay,
    setCurrentDay,
    onDelete,
    onActivityEdit,
    onActivityAccept,
    onActivityReject,
  } = usePlanDetails(planId);

  // Loading state
  if (loading) {
    return <div className="text-center py-10 text-gray-500">Ładowanie planu...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center py-10 text-red-600">Błąd: {error}</div>;
  }

  // No plan found
  if (!plan) {
    return <div className="text-center py-10 text-gray-500">Nie znaleziono planu.</div>;
  }

  // Get activities for the current day
  const activitiesForDay = plan.activities[currentDay] || [];

  return (
    <div className="container mx-auto py-4 px-2 md:px-0">
      <PlanHeader plan={plan} onDelete={onDelete} />
      <PlanSummary summary={plan.summary} />
      <DaysList activities={plan.activities} currentDay={currentDay} onDaySelect={setCurrentDay} />
      <DaySection
        dayNumber={currentDay}
        activities={activitiesForDay}
        onActivityEdit={onActivityEdit}
        onActivityAccept={onActivityAccept}
        onActivityReject={onActivityReject}
      />
    </div>
  );
};

export default PlanDetailsPage;
