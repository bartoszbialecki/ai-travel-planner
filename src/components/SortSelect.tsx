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
  { value: "created_at", label: "Creation date" },
  { value: "name", label: "Name" },
  { value: "destination", label: "Destination" },
];

const orderOptions = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const SortSelect: React.FC<SortSelectProps> = ({ sort, order, onSortChange }) => {
  return (
    <div className="flex gap-2 items-center mb-4">
      <Select value={sort} onValueChange={(v) => onSortChange(v as typeof sort, order)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={order} onValueChange={(v) => onSortChange(sort, v as typeof order)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          {orderOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(SortSelect);
