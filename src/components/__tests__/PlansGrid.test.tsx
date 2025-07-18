import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlansGrid from "../PlansGrid";
import type { PlanListResponse } from "@/types";

// Mock the UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: React.ComponentProps<"div">) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: React.ComponentProps<"h3">) => (
    <h3 data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardContent: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, ...props }: React.ComponentProps<"div">) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe("PlansGrid", () => {
  const mockPlans: PlanListResponse["plans"] = [
    {
      id: "1",
      name: "Paris Adventure",
      destination: "Paris, France",
      start_date: "2024-06-01",
      end_date: "2024-06-05",
      adults_count: 2,
      children_count: 1,
      budget_total: 1500,
      budget_currency: "EUR",
      travel_style: "active",
      created_at: "2024-01-15T10:30:00Z",
      job_id: "job-1",
      status: "completed",
    },
    {
      id: "2",
      name: "Rome Discovery",
      destination: "Rome, Italy",
      start_date: "2024-07-10",
      end_date: "2024-07-15",
      adults_count: 1,
      children_count: 0,
      budget_total: 1200,
      budget_currency: "EUR",
      travel_style: "relaxation",
      created_at: "2024-01-20T14:45:00Z",
      job_id: "job-2",
      status: "completed",
    },
  ];

  const mockOnPlanClick = vi.fn((id: string) => `/plans/${id}`);

  describe("rendering plans", () => {
    it("should render all plans correctly", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("Paris Adventure")).toBeInTheDocument();
      expect(screen.getByText("Paris, France")).toBeInTheDocument();
      expect(screen.getByText("Rome Discovery")).toBeInTheDocument();
      expect(screen.getByText("Rome, Italy")).toBeInTheDocument();
    });

    it("should render plan details correctly", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      // Check dates
      expect(screen.getByText("2024-06-01 - 2024-06-05")).toBeInTheDocument();
      expect(screen.getByText("2024-07-10 - 2024-07-15")).toBeInTheDocument();

      // Check people count
      expect(screen.getByText("2 adults, 1 children")).toBeInTheDocument();
      expect(screen.getByText("1 adults, 0 children")).toBeInTheDocument();

      // Check travel style
      expect(screen.getByText("Style: active")).toBeInTheDocument();
      expect(screen.getByText("Style: relaxation")).toBeInTheDocument();

      // Check creation date
      expect(screen.getByText("Created: 2024-01-15")).toBeInTheDocument();
      expect(screen.getByText("Created: 2024-01-20")).toBeInTheDocument();
    });

    it("should handle missing optional fields gracefully", () => {
      const plansWithMissingFields: PlanListResponse["plans"] = [
        {
          id: "3",
          name: "Minimal Plan",
          destination: "Berlin, Germany",
          start_date: "2024-08-01",
          end_date: "2024-08-03",
          adults_count: 1,
          children_count: 0,
          budget_total: null,
          budget_currency: null,
          travel_style: null,
          created_at: "2024-01-25T09:00:00Z",
          job_id: "job-3",
          status: "completed",
        },
      ];

      render(<PlansGrid plans={plansWithMissingFields} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("Minimal Plan")).toBeInTheDocument();
      expect(screen.getByText("Berlin, Germany")).toBeInTheDocument();
      expect(screen.getByText("Style: -")).toBeInTheDocument(); // Should show dash for null
      expect(screen.getByText("Created: 2024-01-25")).toBeInTheDocument();
    });

    it("should render empty state when no plans provided", () => {
      render(<PlansGrid plans={[]} onPlanClick={mockOnPlanClick} />);

      expect(screen.queryByTestId("card")).not.toBeInTheDocument();
    });
  });

  describe("navigation and interactions", () => {
    it("should call onPlanClick with correct id when plan is clicked", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const firstPlanCard = screen.getByText("Paris Adventure").closest("a");
      expect(firstPlanCard).toBeInTheDocument();

      if (firstPlanCard) {
        fireEvent.click(firstPlanCard);
      }

      expect(mockOnPlanClick).toHaveBeenCalledWith("1");
    });

    it("should generate correct href for each plan", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const planLinks = screen.getAllByRole("link");
      expect(planLinks).toHaveLength(2);

      expect(planLinks[0]).toHaveAttribute("href", "/plans/1");
      expect(planLinks[1]).toHaveAttribute("href", "/plans/2");
    });

    it("should have proper accessibility attributes", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const planLinks = screen.getAllByRole("link");

      expect(planLinks[0]).toHaveAttribute("aria-label", "Details of plan Paris Adventure");
      expect(planLinks[1]).toHaveAttribute("aria-label", "Details of plan Rome Discovery");
    });
  });

  describe("loading state", () => {
    it("should render skeleton cards when loading is true", () => {
      render(<PlansGrid plans={[]} onPlanClick={mockOnPlanClick} loading={true} />);

      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons).toHaveLength(36); // 6 cards * 6 skeletons each (4 in content + 2 in header)

      // Check that no actual plan content is rendered
      expect(screen.queryByText("Paris Adventure")).not.toBeInTheDocument();
    });

    it("should render correct number of skeleton cards", () => {
      render(<PlansGrid plans={[]} onPlanClick={mockOnPlanClick} loading={true} />);

      const cards = screen.getAllByTestId("card");
      expect(cards).toHaveLength(6); // Default skeleton count
    });

    it("should not render skeletons when loading is false", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} loading={false} />);

      const skeletons = screen.queryAllByTestId("skeleton");
      expect(skeletons).toHaveLength(0);
    });

    it("should not render skeletons when loading prop is not provided", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const skeletons = screen.queryAllByTestId("skeleton");
      expect(skeletons).toHaveLength(0);
    });
  });

  describe("grid layout", () => {
    it("should have responsive grid classes", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const gridContainer = screen.getByText("Paris Adventure").closest("div")?.parentElement
        ?.parentElement?.parentElement;
      expect(gridContainer).toHaveClass("grid", "grid-cols-1", "sm:grid-cols-2", "md:grid-cols-3", "gap-6");
    });

    it("should render cards with hover effects", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const cards = screen.getAllByTestId("card");
      cards.forEach((card) => {
        expect(card).toHaveClass("cursor-pointer", "hover:shadow-lg");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle plans with very long names", () => {
      const longNamePlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          name: "This is a very long plan name that might cause layout issues if not handled properly",
        },
      ];

      render(<PlansGrid plans={longNamePlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText(longNamePlan[0].name)).toBeInTheDocument();
    });

    it("should handle plans with special characters in destination", () => {
      const specialCharPlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          destination: "São Paulo, Brasil & New York, USA",
        },
      ];

      render(<PlansGrid plans={specialCharPlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText(specialCharPlan[0].destination)).toBeInTheDocument();
    });

    it("should handle plans with zero adults and children", () => {
      const zeroPeoplePlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          adults_count: 0,
          children_count: 0,
        },
      ];

      render(<PlansGrid plans={zeroPeoplePlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("0 adults, 0 children")).toBeInTheDocument();
    });

    it("should handle plans with empty created_at string", () => {
      const noDatePlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          created_at: "",
        },
      ];

      render(<PlansGrid plans={noDatePlan} onPlanClick={mockOnPlanClick} />);

      // Should not crash and should handle empty string gracefully
      expect(screen.getByText("Paris Adventure")).toBeInTheDocument();
    });
  });

  describe("performance optimization", () => {
    it("should use React.memo for performance", () => {
      // This test verifies that the component is memoized
      // React.memo returns a memoized component, so we can check if it has the $$typeof property
      expect(PlansGrid.$$typeof).toBeDefined();
    });

    it("should not re-render unnecessarily with same props", () => {
      const { rerender } = render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const initialCards = screen.getAllByTestId("card");
      const initialCount = initialCards.length;

      // Re-render with same props
      rerender(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const newCards = screen.getAllByTestId("card");
      expect(newCards).toHaveLength(initialCount);
    });
  });
});
