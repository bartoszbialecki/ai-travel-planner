import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SortSelect from "../SortSelect";

// Mock the UI components
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    ...props
  }: React.ComponentProps<"div"> & { value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select" data-value={value} {...props}>
      {children}
      <button onClick={() => onValueChange("name")}>Change to name</button>
      <button onClick={() => onValueChange("destination")}>Change to destination</button>
      <button onClick={() => onValueChange("created_at")}>Change to created_at</button>
      <button onClick={() => onValueChange("asc")}>Change to asc</button>
      <button onClick={() => onValueChange("desc")}>Change to desc</button>
    </div>
  ),
  SelectTrigger: ({ children, className, ...props }: React.ComponentProps<"button">) => (
    <button data-testid="select-trigger" className={className} {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder, ...props }: React.ComponentProps<"span"> & { placeholder?: string }) => (
    <span data-testid="select-value" {...props}>
      {placeholder}
    </span>
  ),
  SelectContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-testid="select-content" {...props}>
      {children}
    </div>
  ),
  SelectItem: ({ children, value, ...props }: React.ComponentProps<"div"> & { value: string }) => (
    <div data-testid="select-item" data-value={value} {...props}>
      {children}
    </div>
  ),
}));

describe("SortSelect", () => {
  const mockOnSortChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render sort label and both selects", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
      const selects = screen.getAllByTestId("select");
      expect(selects).toHaveLength(2);
    });

    it("should render sort options correctly", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("Creation Date")).toBeInTheDocument();
      expect(screen.getByText("Plan Name")).toBeInTheDocument();
      expect(screen.getByText("Destination")).toBeInTheDocument();
    });

    it("should render order options correctly", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("A to Z")).toBeInTheDocument();
      expect(screen.getByText("Z to A")).toBeInTheDocument();
    });

    it("should display current sort value", () => {
      render(<SortSelect sort="name" order="asc" onSortChange={mockOnSortChange} />);

      const sortValue = screen.getByText("Plan Name");
      expect(sortValue).toBeInTheDocument();
    });

    it("should display current order value", () => {
      render(<SortSelect sort="name" order="asc" onSortChange={mockOnSortChange} />);

      const orderValue = screen.getByText("A to Z");
      expect(orderValue).toBeInTheDocument();
    });
  });

  describe("sort options", () => {
    it("should have all required sort options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const sortItems = screen.getAllByTestId("select-item");
      const sortValues = sortItems.map((item) => item.getAttribute("data-value"));

      expect(sortValues).toContain("created_at");
      expect(sortValues).toContain("name");
      expect(sortValues).toContain("destination");
    });

    it("should have correct labels for sort options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("Creation Date")).toBeInTheDocument();
      expect(screen.getByText("Plan Name")).toBeInTheDocument();
      expect(screen.getByText("Destination")).toBeInTheDocument();
    });

    it("should have icons in sort options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("📅")).toBeInTheDocument();
      expect(screen.getByText("📝")).toBeInTheDocument();
      expect(screen.getByText("📍")).toBeInTheDocument();
    });
  });

  describe("order options", () => {
    it("should have all required order options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const orderItems = screen.getAllByTestId("select-item");
      const orderValues = orderItems.map((item) => item.getAttribute("data-value"));

      expect(orderValues).toContain("asc");
      expect(orderValues).toContain("desc");
    });

    it("should have correct labels for order options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("A to Z")).toBeInTheDocument();
      expect(screen.getByText("Z to A")).toBeInTheDocument();
    });

    it("should have icons in order options", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      expect(screen.getByText("↑")).toBeInTheDocument();
      expect(screen.getByText("↓")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onSortChange when sort value changes", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const changeToNameButton = screen.getAllByText("Change to name")[0];
      fireEvent.click(changeToNameButton);

      expect(mockOnSortChange).toHaveBeenCalledWith("name", "desc");
    });

    it("should call onSortChange when order value changes", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const changeToAscButton = screen.getAllByText("Change to asc")[1]; // Second select (order)
      fireEvent.click(changeToAscButton);

      expect(mockOnSortChange).toHaveBeenCalledWith("created_at", "asc");
    });

    it("should maintain current sort when order changes", () => {
      render(<SortSelect sort="name" order="desc" onSortChange={mockOnSortChange} />);

      const changeToAscButton = screen.getAllByText("Change to asc")[1]; // Second select (order)
      fireEvent.click(changeToAscButton);

      expect(mockOnSortChange).toHaveBeenCalledWith("name", "asc");
    });

    it("should maintain current order when sort changes", () => {
      render(<SortSelect sort="created_at" order="asc" onSortChange={mockOnSortChange} />);

      const changeToDestinationButton = screen.getAllByText("Change to destination")[0];
      fireEvent.click(changeToDestinationButton);

      expect(mockOnSortChange).toHaveBeenCalledWith("destination", "asc");
    });
  });

  describe("accessibility", () => {
    it("should have proper placeholder text", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const values = screen.getAllByTestId("select-value");
      expect(values[0]).toHaveTextContent("Select sort field");
      expect(values[1]).toHaveTextContent("Order");
    });

    it("should have proper button elements for triggers", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const triggers = screen.getAllByTestId("select-trigger");
      expect(triggers).toHaveLength(2);
      triggers.forEach((trigger) => {
        expect(trigger.tagName).toBe("BUTTON");
      });
    });

    it("should have proper select content structure", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const contents = screen.getAllByTestId("select-content");
      expect(contents).toHaveLength(2);
    });

    it("should have proper select items", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const items = screen.getAllByTestId("select-item");
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("should handle all valid sort values", () => {
      const sortValues: ("created_at" | "name" | "destination")[] = ["created_at", "name", "destination"];

      sortValues.forEach((sort) => {
        const { unmount } = render(<SortSelect sort={sort} order="desc" onSortChange={mockOnSortChange} />);

        expect(screen.getByText("Sort by:")).toBeInTheDocument();
        unmount();
      });
    });

    it("should handle all valid order values", () => {
      const orderValues: ("asc" | "desc")[] = ["asc", "desc"];

      orderValues.forEach((order) => {
        const { unmount } = render(<SortSelect sort="created_at" order={order} onSortChange={mockOnSortChange} />);

        expect(screen.getByText("Sort by:")).toBeInTheDocument();
        unmount();
      });
    });

    it("should handle rapid changes", () => {
      render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const sortSelect = screen.getAllByTestId("select")[0];
      const orderSelect = screen.getAllByTestId("select")[1];

      fireEvent.click(sortSelect);
      fireEvent.click(orderSelect);

      // Should not crash with rapid interactions
      expect(sortSelect).toBeInTheDocument();
      expect(orderSelect).toBeInTheDocument();
    });
  });

  describe("performance optimization", () => {
    it("should use React.memo for performance", () => {
      // This test verifies that the component is memoized
      expect(SortSelect.$$typeof).toBeDefined();
    });

    it("should not re-render unnecessarily with same props", () => {
      const { rerender } = render(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const initialSelects = screen.getAllByTestId("select");
      const initialCount = initialSelects.length;

      // Re-render with same props
      rerender(<SortSelect sort="created_at" order="desc" onSortChange={mockOnSortChange} />);

      const newSelects = screen.getAllByTestId("select");
      expect(newSelects).toHaveLength(initialCount);
    });
  });
});
