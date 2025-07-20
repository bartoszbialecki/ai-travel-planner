import React from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

/**
 * StatsCard
 * Reusable component for displaying statistics in a card format.
 * Used in dashboard views to show key metrics with icons and styling.
 */
export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, bgColor }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-soft border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  );
};
