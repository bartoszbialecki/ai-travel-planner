import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlanListResponse } from "@/types";

// Mock the usePlansList hook
vi.mock("@/components/hooks/usePlansList", () => ({
  usePlansList: vi.fn(),
}));

// Mock child components
vi.mock("@/components/PlansGrid", () => ({
  default: vi.fn(({ plans, loading }) => {
    if (loading) {
      return <div data-testid="plans-grid-loading">Loading plans...</div>;
    }
    return (
      <div data-testid="plans-grid">
        {plans.map((plan: PlanListResponse["plans"][0]) => (
          <div key={plan.id} data-testid={`plan-${plan.id}`}>
            {plan.name}
          </div>
        ))}
      </div>
    );
  }),
}));

vi.mock("@/components/EmptyState", () => ({
  default: vi.fn(() => <div data-testid="empty-state">No plans found</div>),
}));

vi.mock("@/components/Pagination", () => ({
  default: vi.fn(({ page, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(page - 1)} data-testid="prev-page">
        Previous
      </button>
      <span data-testid="page-info">
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPageChange(page + 1)} data-testid="next-page">
        Next
      </button>
    </div>
  )),
}));

vi.mock("@/components/SortSelect", () => ({
  default: vi.fn(({ onSortChange }) => (
    <div data-testid="sort-select">
      <button onClick={() => onSortChange("name", "asc")} data-testid="sort-name-asc">
        Sort by Name Asc
      </button>
      <button onClick={() => onSortChange("destination", "desc")} data-testid="sort-destination-desc">
        Sort by Destination Desc
      </button>
    </div>
  )),
}));

// Import after mocks
import PlansDashboardPage from "../PlansDashboardPage";
import { usePlansList } from "@/components/hooks/usePlansList";
import PlansGrid from "@/components/PlansGrid";

// Mock data
const mockPlans: PlanListResponse["plans"] = [
  {
    id: "1",
    name: "Paris Adventure",
    destination: "Paris",
    start_date: "2024-06-01",
    end_date: "2024-06-05",
    adults_count: 2,
    children_count: 0,
    budget_total: 1500,
    budget_currency: "EUR",
    travel_style: "cultural",
    created_at: "2024-01-15T10:00:00Z",
    job_id: "job-1",
    status: "completed",
  },
  {
    id: "2",
    name: "Tokyo Trip",
    destination: "Tokyo",
    start_date: "2024-07-10",
    end_date: "2024-07-15",
    adults_count: 1,
    children_count: 1,
    budget_total: 2000,
    budget_currency: "USD",
    travel_style: "adventure",
    created_at: "2024-01-20T14:30:00Z",
    job_id: "job-2",
    status: "completed",
  },
];

describe("PlansDashboardPage", () => {
  const mockUsePlansList = vi.mocked(usePlansList);
  const mockPlansGrid = vi.mocked(PlansGrid);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering states", () => {
    it("should render loading state correctly", () => {
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: true,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(screen.getByText("Your travel plans")).toBeInTheDocument();
      expect(screen.getByText("+ New plan")).toBeInTheDocument();
      expect(screen.getByTestId("sort-select")).toBeInTheDocument();
      expect(screen.getByTestId("plans-grid-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("should render error state correctly", () => {
      const errorMessage = "Failed to fetch plans";
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: false,
        error: errorMessage,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId("sort-select")).toBeInTheDocument();
      expect(screen.queryByTestId("plans-grid")).not.toBeInTheDocument();
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });

    it("should render empty state correctly", () => {
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(screen.getByTestId("sort-select")).toBeInTheDocument();
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      expect(screen.queryByTestId("plans-grid")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("should render plans list with pagination correctly", () => {
      const mockSetPage = vi.fn();
      const mockSetSort = vi.fn();

      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 3,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(screen.getByTestId("sort-select")).toBeInTheDocument();
      expect(screen.getByTestId("plans-grid")).toBeInTheDocument();
      expect(screen.getByTestId("plan-1")).toBeInTheDocument();
      expect(screen.getByTestId("plan-2")).toBeInTheDocument();
      expect(screen.getByText("Paris Adventure")).toBeInTheDocument();
      expect(screen.getByText("Tokyo Trip")).toBeInTheDocument();
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
      expect(screen.getByTestId("page-info")).toHaveTextContent("Page 1 of 3");
    });

    it("should not render pagination when totalPages is 1", () => {
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(screen.getByTestId("sort-select")).toBeInTheDocument();
      expect(screen.getByTestId("plans-grid")).toBeInTheDocument();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });
  });

  describe("user interactions", () => {
    it("should handle pagination correctly", async () => {
      const mockSetPage = vi.fn();
      const mockSetSort = vi.fn();

      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 2,
        totalPages: 3,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const prevButton = screen.getByTestId("prev-page");
      const nextButton = screen.getByTestId("next-page");

      fireEvent.click(prevButton);
      expect(mockSetPage).toHaveBeenCalledWith(1);

      fireEvent.click(nextButton);
      expect(mockSetPage).toHaveBeenCalledWith(3);
    });

    it("should handle sort changes correctly", () => {
      const mockSetPage = vi.fn();
      const mockSetSort = vi.fn();

      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const sortByNameButton = screen.getByTestId("sort-name-asc");
      const sortByDestinationButton = screen.getByTestId("sort-destination-desc");

      fireEvent.click(sortByNameButton);
      expect(mockSetSort).toHaveBeenCalledWith("name", "asc");

      fireEvent.click(sortByDestinationButton);
      expect(mockSetSort).toHaveBeenCalledWith("destination", "desc");
    });

    it("should generate correct plan URLs", () => {
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      // Check that PlansGrid receives the correct onPlanClick function
      expect(mockPlansGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          plans: mockPlans,
          onPlanClick: expect.any(Function),
        }),
        undefined
      );

      // Test the onPlanClick function
      const plansGridCall = mockPlansGrid.mock.calls[0][0];
      expect(plansGridCall.onPlanClick("123")).toBe("/plans/123");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Your travel plans");
    });

    it("should have accessible new plan button", () => {
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const newPlanButton = screen.getByRole("link", { name: "+ New plan" });
      expect(newPlanButton).toHaveAttribute("href", "/generate");
      expect(newPlanButton).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("hook integration", () => {
    it("should call usePlansList with correct parameters", () => {
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      expect(mockUsePlansList).toHaveBeenCalledWith({});
    });

    it("should handle hook state changes correctly", async () => {
      const mockSetPage = vi.fn();
      const mockSetSort = vi.fn();

      // Initial state
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: true,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      const { rerender } = render(<PlansDashboardPage />);
      expect(screen.getByTestId("plans-grid-loading")).toBeInTheDocument();

      // Change to loaded state with plans
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      rerender(<PlansDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId("plans-grid")).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should display error message with proper styling", () => {
      const errorMessage = "Network error occurred";
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: false,
        error: errorMessage,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toHaveClass("text-destructive");
      expect(errorElement).toHaveClass("text-center");
      expect(errorElement).toHaveClass("py-12");
    });
  });
});
