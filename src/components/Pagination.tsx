import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Pagination
 * Pagination component for changing the page of the plans list.
 * Uses shadcn/ui Button.
 * Props:
 * - page: current page
 * - totalPages: total number of pages
 * - onPageChange: callback when page changes
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center mt-8 items-center gap-2">
      <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        Poprzednia
      </Button>
      <span className="px-4 py-2">
        Strona {page} z {totalPages}
      </span>
      <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        Następna
      </Button>
    </div>
  );
};

export default React.memo(Pagination);
