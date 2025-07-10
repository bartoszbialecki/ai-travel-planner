import React from "react";
import type { ActivityResponse } from "@/types";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

interface DaysListProps {
  activities: Record<number, ActivityResponse[]>;
  currentDay: number;
  onDaySelect: (day: number) => void;
}

const DaysList: React.FC<DaysListProps> = ({ activities, currentDay, onDaySelect }) => {
  const days = Object.keys(activities)
    .map(Number)
    .sort((a, b) => a - b);

  if (days.length <= 7) {
    // Show buttons for up to 7 days
    return (
      <nav className="flex gap-2 overflow-x-auto mb-2 pb-2">
        {days.map((day) => (
          <Button
            key={day}
            variant={currentDay === day ? "default" : "outline"}
            size="sm"
            onClick={() => onDaySelect(day)}
            className="min-w-[80px]"
          >
            Day {day}
          </Button>
        ))}
      </nav>
    );
  }

  // Show dropdown for more than 7 days
  return (
    <div className="max-w-xs mb-2">
      <Select value={String(currentDay)} onValueChange={(val) => onDaySelect(Number(val))}>
        <SelectTrigger>
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={String(day)}>
              Day {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DaysList;
