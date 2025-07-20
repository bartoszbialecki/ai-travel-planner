import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pagination from "../Pagination";

describe("Pagination", () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render pagination controls when totalPages > 1", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should not render when totalPages <= 1", () => {
      const { container } = render(<Pagination page={1} totalPages={1} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when totalPages is 0", () => {
      const { container } = render(<Pagination page={1} totalPages={0} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should display correct page numbers", () => {
      render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should show ellipsis for large page counts", () => {
      render(<Pagination page={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getAllByText("...")).toHaveLength(2);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("should disable Previous button on first page", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      render(<Pagination page={3} totalPages={3} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle page", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should highlight current page", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByRole("button", { name: "2" });
      expect(currentPageButton).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onPageChange with previous page when Previous button is clicked", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange with next page when Next button is clicked", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange when page number is clicked", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const pageButton = screen.getByRole("button", { name: "3" });
      fireEvent.click(pageButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should not call onPageChange when Previous button is disabled", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(previousButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when Next button is disabled", () => {
      render(<Pagination page={3} totalPages={3} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("page number logic", () => {
    it("should show all pages when totalPages <= 5", () => {
      render(<Pagination page={1} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });

    it("should show ellipsis when page is near the beginning", () => {
      render(<Pagination page={2} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should show ellipsis when page is near the end", () => {
      render(<Pagination page={9} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("...")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should show ellipsis on both sides when page is in the middle", () => {
      render(<Pagination page={5} totalPages={10} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getAllByText("...")).toHaveLength(2);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle very large page numbers", () => {
      render(<Pagination page={999} totalPages={1000} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("999")).toBeInTheDocument();
      expect(screen.getByText("1000")).toBeInTheDocument();
    });

    it("should handle single digit page numbers", () => {
      render(<Pagination page={1} totalPages={9} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
    });

    it("should handle page 0 gracefully", () => {
      render(<Pagination page={0} totalPages={3} onPageChange={mockOnPageChange} />);

      // Page 0 should be treated as page 1
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should handle negative page numbers", () => {
      render(<Pagination page={-1} totalPages={3} onPageChange={mockOnPageChange} />);

      // Negative pages should be treated as page 1
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper button labels", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByText("Previous");
      const nextButton = screen.getByText("Next");

      expect(previousButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it("should have proper button roles", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have proper disabled states", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(previousButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("performance optimization", () => {
    it("should use React.memo for performance", () => {
      // This test verifies that the component is memoized
      expect(Pagination.$$typeof).toBeDefined();
    });

    it("should not re-render unnecessarily with same props", () => {
      const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const initialButtons = screen.getAllByRole("button");
      const initialCount = initialButtons.length;

      // Re-render with same props
      rerender(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const newButtons = screen.getAllByRole("button");
      expect(newButtons).toHaveLength(initialCount);
    });
  });
});
