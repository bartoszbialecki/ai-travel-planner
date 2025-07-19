import { render, screen, fireEvent } from "@testing-library/react";
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

      expect(screen.getByText("Your Travel Plans")).toBeInTheDocument();
      expect(screen.getByText("Create New Plan")).toBeInTheDocument();
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
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
    });
  });

  describe("hero section", () => {
    it("should render hero title", () => {
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

      expect(screen.getByText("Your Travel Plans")).toBeInTheDocument();
    });

    it("should render hero description", () => {
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

      expect(screen.getByText(/Manage and explore your AI-generated travel itineraries/)).toBeInTheDocument();
    });

    it("should render create new plan button", () => {
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

      const createButton = screen.getByText("Create New Plan");
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute("href", "/generate");
    });
  });

  describe("statistics section", () => {
    it("should render statistics cards", () => {
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

      expect(screen.getByText("Total Plans")).toBeInTheDocument();
      expect(screen.getByText("Active Plans")).toBeInTheDocument();
      expect(screen.getByText("Completed Plans")).toBeInTheDocument();
    });

    it("should display correct plan counts", () => {
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

      expect(screen.getAllByText("2")).toHaveLength(2); // Total plans and Completed plans
    });
  });

  describe("controls section", () => {
    it("should render sort controls", () => {
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
    });
  });

  describe("interactions", () => {
    it("should handle sort changes", () => {
      const mockSetSort = vi.fn();
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: mockSetSort,
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const sortButton = screen.getByTestId("sort-name-asc");
      fireEvent.click(sortButton);

      expect(mockSetSort).toHaveBeenCalledWith("name", "asc");
    });

    it("should handle pagination changes", () => {
      const mockSetPage = vi.fn();
      mockUsePlansList.mockReturnValue({
        plans: mockPlans,
        loading: false,
        error: null,
        page: 1,
        totalPages: 3,
        sort: "created_at",
        order: "desc",
        setPage: mockSetPage,
        setSort: vi.fn(),
        fetchPlans: vi.fn(),
      });

      render(<PlansDashboardPage />);

      const nextButton = screen.getByTestId("next-page");
      fireEvent.click(nextButton);

      expect(mockSetPage).toHaveBeenCalledWith(2);
    });

    it("should handle plan clicks", () => {
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

      expect(mockPlansGrid).toHaveBeenCalledWith(
        expect.objectContaining({
          plans: mockPlans,
          onPlanClick: expect.any(Function),
        }),
        undefined
      );
    });
  });

  describe("error handling", () => {
    it("should show retry button on error", () => {
      const mockFetchPlans = vi.fn();
      mockUsePlansList.mockReturnValue({
        plans: [],
        loading: false,
        error: "Failed to load plans",
        page: 1,
        totalPages: 1,
        sort: "created_at",
        order: "desc",
        setPage: vi.fn(),
        setSort: vi.fn(),
        fetchPlans: mockFetchPlans,
      });

      render(<PlansDashboardPage />);

      const retryButton = screen.getByText("Try Again");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockFetchPlans).toHaveBeenCalled();
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

      const mainHeading = screen.getByText("Your Travel Plans");
      expect(mainHeading.tagName).toBe("H1");
    });

    it("should have proper button labels", () => {
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

      const createButton = screen.getByRole("link", { name: "Create New Plan" });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe("performance optimization", () => {
    it("should not re-render unnecessarily with same props", () => {
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

      const { rerender } = render(<PlansDashboardPage />);

      const initialTitle = screen.getByText("Your Travel Plans");

      // Re-render with same props
      rerender(<PlansDashboardPage />);

      const newTitle = screen.getByText("Your Travel Plans");
      expect(newTitle).toBe(initialTitle);
    });
  });
});
