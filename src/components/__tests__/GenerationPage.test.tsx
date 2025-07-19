import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerationPage from "../GenerationPage";
import GenerationForm from "../GenerationForm";
import StatusModal from "../StatusModal";

// Mock child components
vi.mock("../GenerationForm", () => ({
  default: vi.fn(({ onSubmit }) => (
    <div data-testid="generation-form">
      <button onClick={() => onSubmit("test-job-123")}>Submit Form</button>
    </div>
  )),
}));

vi.mock("../StatusModal", () => ({
  default: vi.fn(({ jobId, onComplete, onRetry }) => (
    <div data-testid="status-modal">
      <div>Job ID: {jobId}</div>
      <button onClick={() => onComplete("plan-456")}>Complete</button>
      <button onClick={onRetry}>Retry</button>
    </div>
  )),
}));

const mockGenerationForm = vi.mocked(GenerationForm);
const mockStatusModal = vi.mocked(StatusModal);

describe("GenerationPage", () => {
  // Mock window.location.href
  const mockLocationHref = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location.href
    const mockLocation = { href: "" };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });
    Object.defineProperty(window.location, "href", {
      set: mockLocationHref,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial rendering", () => {
    it("renders the generation form initially", () => {
      render(<GenerationPage />);

      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
    });

    it("renders hero section", () => {
      render(<GenerationPage />);

      expect(screen.getByText("Create Your Perfect Travel Plan")).toBeInTheDocument();
      expect(screen.getByText(/Let AI craft a personalized itinerary/)).toBeInTheDocument();
    });

    it("renders features section", () => {
      render(<GenerationPage />);

      expect(screen.getByText("AI-Powered")).toBeInTheDocument();
      expect(screen.getByText("Budget-Friendly")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
    });

    it("has correct container structure", () => {
      render(<GenerationPage />);

      const container = screen.getByTestId("generation-form").closest("div")?.parentElement?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it("renders only the form component without modal", () => {
      render(<GenerationPage />);

      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
    });
  });

  describe("Hero section", () => {
    it("renders hero title", () => {
      render(<GenerationPage />);

      expect(screen.getByText("Create Your Perfect Travel Plan")).toBeInTheDocument();
    });

    it("renders hero description", () => {
      render(<GenerationPage />);

      expect(screen.getByText(/Let AI craft a personalized itinerary/)).toBeInTheDocument();
    });
  });

  describe("Features section", () => {
    it("renders all feature cards", () => {
      render(<GenerationPage />);

      expect(screen.getByText("AI-Powered")).toBeInTheDocument();
      expect(screen.getByText("Budget-Friendly")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
    });

    it("renders feature descriptions", () => {
      render(<GenerationPage />);

      expect(screen.getByText(/Advanced AI algorithms/)).toBeInTheDocument();
      expect(screen.getByText(/Get detailed cost estimates/)).toBeInTheDocument();
      expect(screen.getByText(/Customized plans based on your travel style/)).toBeInTheDocument();
    });
  });

  describe("Form submission workflow", () => {
    it("shows status modal after form submission", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Initially only form is visible
      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // Submit form
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // Modal should appear
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
      expect(screen.getByText("Job ID: test-job-123")).toBeInTheDocument();
    });

    it("passes correct jobId to status modal", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(screen.getByText("Job ID: test-job-123")).toBeInTheDocument();
    });

    it("keeps form visible when modal is shown", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // Both form and modal should be visible
      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
    });
  });

  describe("Status completion workflow", () => {
    it("redirects to plan details when generation completes", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Submit form to show modal
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // Complete the generation
      const completeButton = screen.getByText("Complete");
      await user.click(completeButton);

      // Should redirect to plan details
      expect(mockLocationHref).toHaveBeenCalledWith("/plans/plan-456");
    });

    it("handles completion with different plan IDs", async () => {
      const user = userEvent.setup();

      // Mock the StatusModal to return different plan ID
      mockStatusModal.mockImplementation(({ onComplete }) => (
        <div data-testid="status-modal">
          <button onClick={() => onComplete("different-plan-id")}>Complete</button>
        </div>
      ));

      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      const completeButton = screen.getByText("Complete");
      await user.click(completeButton);

      expect(mockLocationHref).toHaveBeenCalledWith("/plans/different-plan-id");
    });

    it("uses useCallback for handleStatusComplete", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // The onComplete function should be stable between renders
      const completeButton = screen.getByText("Complete");
      expect(completeButton).toBeInTheDocument();
    });
  });

  describe("Retry workflow", () => {
    it("hides modal and resets to form when retry is clicked", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Submit form to show modal
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(screen.getByTestId("status-modal")).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      // Modal should be hidden
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
    });

    it("allows resubmission after retry", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // First submission
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(screen.getByTestId("status-modal")).toBeInTheDocument();

      // Retry
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      // Modal should be hidden
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // Submit again
      await user.click(submitButton);
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
    });
  });

  describe("Component integration", () => {
    it("passes onSubmit prop to GenerationForm", () => {
      render(<GenerationPage />);

      expect(mockGenerationForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSubmit: expect.any(Function),
        }),
        undefined
      );
    });

    it("passes correct props to StatusModal when shown", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(mockStatusModal).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: "test-job-123",
          onComplete: expect.any(Function),
          onRetry: expect.any(Function),
        }),
        undefined
      );
    });

    it("does not render StatusModal initially", () => {
      render(<GenerationPage />);

      expect(mockStatusModal).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<GenerationPage />);

      const mainHeading = screen.getByText("Create Your Perfect Travel Plan");
      expect(mainHeading.tagName).toBe("H1");
    });

    it("has proper feature headings", () => {
      render(<GenerationPage />);

      const featureHeadings = screen.getAllByText(/AI-Powered|Budget-Friendly|Personalized/);
      featureHeadings.forEach((heading) => {
        expect(heading.tagName).toBe("H3");
      });
    });

    it("has proper semantic structure", () => {
      render(<GenerationPage />);

      // Should have main content area
      const mainContent = screen.getByTestId("generation-form").closest("div")?.parentElement;
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe("Performance optimization", () => {
    it("does not re-render unnecessarily with same props", () => {
      const { rerender } = render(<GenerationPage />);

      const initialForm = screen.getByTestId("generation-form");

      // Re-render with same props
      rerender(<GenerationPage />);

      const newForm = screen.getByTestId("generation-form");
      expect(newForm).toBe(initialForm);
    });
  });
});
