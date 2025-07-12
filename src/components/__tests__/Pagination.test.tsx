import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pagination from "../Pagination";

// Mock the UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    ...props
  }: React.ComponentProps<"button"> & { variant?: string }) => (
    <button data-testid="button" onClick={onClick} disabled={disabled} className={variant} {...props}>
      {children}
    </button>
  ),
}));

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
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    it("should not render when totalPages <= 1", () => {
      const { container } = render(<Pagination page={1} totalPages={1} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when totalPages is 0", () => {
      const { container } = render(<Pagination page={1} totalPages={0} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should display correct page information", () => {
      render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("should disable Previous button on first page", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      expect(previousButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      render(<Pagination page={3} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle page", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("should call onPageChange with previous page when Previous button is clicked", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");

      if (previousButton) {
        fireEvent.click(previousButton);
      }

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange with next page when Next button is clicked", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      if (nextButton) {
        fireEvent.click(nextButton);
      }

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should not call onPageChange when Previous button is disabled", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");

      if (previousButton) {
        fireEvent.click(previousButton);
      }

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when Next button is disabled", () => {
      render(<Pagination page={3} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      if (nextButton) {
        fireEvent.click(nextButton);
      }

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe("layout and styling", () => {
    it("should have proper layout classes", () => {
      const { container } = render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const paginationContainer = container.firstChild as HTMLElement;
      expect(paginationContainer).toHaveClass("flex", "justify-center", "mt-8", "items-center", "gap-2");
    });

    it("should render buttons with outline variant", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("outline");
      });
    });

    it("should have proper spacing between elements", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const pageInfo = screen.getByText("Page 1 of 3");

      expect(buttons).toHaveLength(2);
      expect(pageInfo).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle very large page numbers", () => {
      render(<Pagination page={999} totalPages={1000} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Page 999 of 1000")).toBeInTheDocument();
    });

    it("should handle single digit page numbers", () => {
      render(<Pagination page={1} totalPages={9} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Page 1 of 9")).toBeInTheDocument();
    });

    it("should handle page 0 gracefully", () => {
      render(<Pagination page={0} totalPages={3} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Page 0 of 3")).toBeInTheDocument();
    });

    it("should handle negative page numbers", () => {
      render(<Pagination page={-1} totalPages={3} onPageChange={mockOnPageChange} />);

      expect(screen.getByText("Page -1 of 3")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper button labels", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      expect(previousButton).toHaveTextContent("Previous");
      expect(nextButton).toHaveTextContent("Next");
    });

    it("should have proper disabled state for screen readers", () => {
      render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");

      expect(previousButton).toBeDisabled();
    });
  });

  describe("performance optimization", () => {
    it("should use React.memo for performance", () => {
      // This test verifies that the component is memoized
      // React.memo returns a memoized component, so we can check if it has the $$typeof property
      expect(Pagination.$$typeof).toBeDefined();
    });

    it("should not re-render unnecessarily with same props", () => {
      const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const initialButtons = screen.getAllByTestId("button");
      const initialCount = initialButtons.length;

      // Re-render with same props
      rerender(<Pagination page={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const newButtons = screen.getAllByTestId("button");
      expect(newButtons).toHaveLength(initialCount);
    });
  });

  describe("callback behavior", () => {
    it("should call onPageChange only once per click", () => {
      render(<Pagination page={2} totalPages={3} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      if (nextButton) {
        fireEvent.click(nextButton);
        fireEvent.click(nextButton);
      }

      expect(mockOnPageChange).toHaveBeenCalledTimes(2);
      expect(mockOnPageChange).toHaveBeenNthCalledWith(1, 3);
      expect(mockOnPageChange).toHaveBeenNthCalledWith(2, 3);
    });

    it("should pass correct page numbers to callback", () => {
      render(<Pagination page={5} totalPages={10} onPageChange={mockOnPageChange} />);

      const buttons = screen.getAllByTestId("button");
      const previousButton = buttons.find((button) => button.textContent === "Previous");
      const nextButton = buttons.find((button) => button.textContent === "Next");

      if (previousButton) {
        fireEvent.click(previousButton);
      }
      expect(mockOnPageChange).toHaveBeenCalledWith(4);

      if (nextButton) {
        fireEvent.click(nextButton);
      }
      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });
  });
});
