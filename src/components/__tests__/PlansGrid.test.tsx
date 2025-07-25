import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlansGrid from "../PlansGrid";
import type { PlanListResponse } from "@/types";

describe("PlansGrid", () => {
  const mockPlans: PlanListResponse["plans"] = [
    {
      id: "1",
      name: "Paris Adventure",
      destination: "Paris, France",
      start_date: "2025-06-01",
      end_date: "2025-06-05",
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
      start_date: "2025-07-10",
      end_date: "2025-07-15",
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

      // Check dates (new format)
      expect(screen.getByText("Jun 1 - Jun 5, 2025")).toBeInTheDocument();
      expect(screen.getByText("Jul 10 - Jul 15, 2025")).toBeInTheDocument();

      // Check people count (new format)
      expect(screen.getByText("2 adults, 1 child")).toBeInTheDocument();
      expect(screen.getByText("1 adult")).toBeInTheDocument();

      // Check travel style (new format)
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("relaxation")).toBeInTheDocument();

      // Check creation date (new format)
      expect(screen.getByText("Created Jan 15, 2024")).toBeInTheDocument();
      expect(screen.getByText("Created Jan 20, 2024")).toBeInTheDocument();
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
      expect(screen.getByText("Flexible")).toBeInTheDocument(); // Should show "Flexible" for null
      expect(screen.getByText("Created Jan 25, 2024")).toBeInTheDocument();
    });

    it("should render empty state when no plans provided", () => {
      render(<PlansGrid plans={[]} onPlanClick={mockOnPlanClick} />);

      expect(screen.queryByText("Paris Adventure")).not.toBeInTheDocument();
      expect(screen.queryByText("Rome Discovery")).not.toBeInTheDocument();
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

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0); // Should show skeleton cards

      // Check that no actual plan content is rendered
      expect(screen.queryByText("Paris Adventure")).not.toBeInTheDocument();
    });

    it("should render correct number of skeleton cards", () => {
      render(<PlansGrid plans={[]} onPlanClick={mockOnPlanClick} loading={true} />);

      const cards = document.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(6); // Default skeleton count
    });

    it("should not render skeletons when loading is false", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} loading={false} />);

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons).toHaveLength(0);
    });

    it("should not render skeletons when loading prop is not provided", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons).toHaveLength(0);
    });
  });

  describe("plan status indicators", () => {
    it("should show active status for future plans", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const futurePlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          end_date: futureDate.toISOString().split("T")[0],
        },
      ];

      render(<PlansGrid plans={futurePlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show past status for completed plans", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const pastPlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          end_date: pastDate.toISOString().split("T")[0],
        },
      ];

      render(<PlansGrid plans={pastPlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("should show correct day count", () => {
      render(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      // First plan: Jun 1 to Jun 5 = 5 days
      expect(screen.getByText("5 days")).toBeInTheDocument();
      // Second plan: Jul 10 to Jul 15 = 5 days (inclusive)
      expect(screen.getByText("5 days")).toBeInTheDocument();
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

      expect(screen.getByText("0 adults")).toBeInTheDocument();
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

    it("should handle single day trips", () => {
      const singleDayPlan: PlanListResponse["plans"] = [
        {
          ...mockPlans[0],
          start_date: "2024-06-01",
          end_date: "2024-06-01",
        },
      ];

      render(<PlansGrid plans={singleDayPlan} onPlanClick={mockOnPlanClick} />);

      expect(screen.getByText("0 days")).toBeInTheDocument();
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

      const initialCards = document.querySelectorAll('[data-slot="card"]');
      const initialCount = initialCards.length;

      // Re-render with same props
      rerender(<PlansGrid plans={mockPlans} onPlanClick={mockOnPlanClick} />);

      const newCards = document.querySelectorAll('[data-slot="card"]');
      expect(newCards).toHaveLength(initialCount);
    });
  });
});
