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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-10 px-4 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === "..." ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                variant={pageNum === page ? "default" : "outline"}
                onClick={() => onPageChange(pageNum as number)}
                className={`h-10 w-10 p-0 ${
                  pageNum === page ? "gradient-primary hover:opacity-90" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-10 px-4 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
      >
        Next
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
};

export default React.memo(Pagination);
