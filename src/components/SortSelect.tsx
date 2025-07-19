import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/**
 * SortSelect
 * Component for selecting sort key and order for the plans list.
 * Uses shadcn/ui Select.
 * Props:
 * - sort: current sort key
 * - order: current sort order
 * - onSortChange: callback when sort or order changes
 */
interface SortSelectProps {
  sort: "created_at" | "name" | "destination";
  order: "asc" | "desc";
  onSortChange: (sort: "created_at" | "name" | "destination", order: "asc" | "desc") => void;
}

const sortOptions = [
  { value: "created_at", label: "Creation Date", icon: "📅" },
  { value: "name", label: "Plan Name", icon: "📝" },
  { value: "destination", label: "Destination", icon: "📍" },
];

const orderOptions = [
  { value: "asc", label: "A to Z", icon: "↑" },
  { value: "desc", label: "Z to A", icon: "↓" },
];

const SortSelect: React.FC<SortSelectProps> = ({ sort, order, onSortChange }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
      </div>

      <Select value={sort} onValueChange={(v) => onSortChange(v as typeof sort, order)}>
        <SelectTrigger className="w-48 h-10 border-gray-200 hover:border-gray-300">
          <SelectValue placeholder="Select sort field" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <span>{opt.icon}</span>
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={order} onValueChange={(v) => onSortChange(sort, v as typeof order)}>
        <SelectTrigger className="w-32 h-10 border-gray-200 hover:border-gray-300">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          {orderOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(SortSelect);
