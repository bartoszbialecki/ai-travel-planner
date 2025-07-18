import React from "react";
import type { ActivityResponse } from "@/types";
import ActivityCard from "./ActivityCard";

interface DaySectionProps {
  dayNumber: number;
  activities: ActivityResponse[];
  onActivityEdit: (activityId: string, data: { custom_desc?: string | null }) => Promise<void>;
  onActivityAccept: (activityId: string) => void;
  onActivityReject: (activityId: string) => void;
  currency?: string;
}

const DaySection: React.FC<DaySectionProps> = ({
  dayNumber,
  activities,
  onActivityEdit,
  onActivityAccept,
  onActivityReject,
  currency,
}) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 px-1">Day {dayNumber}</h2>
      <div className="flex flex-col gap-4">
        {activities.length === 0 ? (
          <div className="text-gray-500">No activities for this day.</div>
        ) : (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onActivityEdit}
              onAccept={onActivityAccept}
              onReject={onActivityReject}
              currency={currency}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default DaySection;
