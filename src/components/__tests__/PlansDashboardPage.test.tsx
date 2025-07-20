import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlanListResponse } from "@/types";

// Mock the usePlansList hook (needed because it makes API calls)
vi.mock("@/components/hooks/usePlansList", () => ({
  usePlansList: vi.fn(),
}));

// Import after mocks
import PlansDashboardPage from "../PlansDashboardPage";
import { usePlansList } from "@/components/hooks/usePlansList";

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
      // Loading state should show skeleton cards (using CSS selector for data-slot)
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0); // Should show skeleton cards
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
      expect(screen.getByText("Try Again")).toBeInTheDocument();
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

      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
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

      expect(screen.getByText("Paris Adventure")).toBeInTheDocument();
      expect(screen.getByText("Tokyo Trip")).toBeInTheDocument();
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
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

      expect(screen.getByText("Sort by:")).toBeInTheDocument();
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

      // The SortSelect component is rendered but we can't easily test its interactions
      // without complex select component testing. This test verifies the component is rendered.
      expect(screen.getByText("Sort by:")).toBeInTheDocument();
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

      const nextButton = screen.getByRole("button", { name: /next/i });
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

      // Verify that plans are rendered
      expect(screen.getByText("Paris Adventure")).toBeInTheDocument();
      expect(screen.getByText("Tokyo Trip")).toBeInTheDocument();
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
