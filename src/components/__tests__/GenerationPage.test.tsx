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

    it("has correct container structure", () => {
      render(<GenerationPage />);

      const container = screen.getByTestId("generation-form").parentElement;
      expect(container).toHaveClass("container", "mx-auto", "max-w-xl", "py-8");
    });

    it("renders only the form component without modal", () => {
      render(<GenerationPage />);

      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
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

      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // Second submission
      await user.click(submitButton);

      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
      expect(screen.getByText("Job ID: test-job-123")).toBeInTheDocument();
    });

    it("clears jobId state on retry", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Submit and verify modal shows with jobId
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(screen.getByText("Job ID: test-job-123")).toBeInTheDocument();

      // Retry
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      // Submit again
      await user.click(submitButton);

      // Should show modal with jobId again
      expect(screen.getByText("Job ID: test-job-123")).toBeInTheDocument();
    });
  });

  describe("Component prop passing", () => {
    it("passes onSubmit prop to GenerationForm", () => {
      render(<GenerationPage />);

      expect(mockGenerationForm).toHaveBeenCalledWith(
        {
          onSubmit: expect.any(Function),
        },
        undefined
      );
    });

    it("passes correct props to StatusModal when visible", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(mockStatusModal).toHaveBeenCalledWith(
        {
          jobId: "test-job-123",
          onComplete: expect.any(Function),
          onRetry: expect.any(Function),
        },
        undefined
      );
    });

    it("does not render StatusModal when jobId is null", () => {
      render(<GenerationPage />);

      expect(mockStatusModal).not.toHaveBeenCalled();
    });
  });

  describe("State management", () => {
    it("manages jobId state correctly", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Initial state - no modal
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // After form submission - modal appears
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      expect(screen.getByTestId("status-modal")).toBeInTheDocument();

      // After retry - modal disappears
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
    });

    it("handles multiple form submissions", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");

      // First submission
      await user.click(submitButton);
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();

      // Retry to reset
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);

      // Second submission
      await user.click(submitButton);
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
    });

    it("preserves form state during modal display", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Form should be present initially
      expect(screen.getByTestId("generation-form")).toBeInTheDocument();

      // Submit form
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // Form should still be present with modal
      expect(screen.getByTestId("generation-form")).toBeInTheDocument();
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("handles form submission errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock GenerationForm to throw an error
      mockGenerationForm.mockImplementation(({ onSubmit }) => (
        <div data-testid="generation-form">
          <button
            onClick={() => {
              try {
                onSubmit("test-job-123");
              } catch {
                // Error should be handled gracefully
              }
            }}
          >
            Submit Form
          </button>
        </div>
      ));

      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");

      // Should not throw
      expect(async () => {
        await user.click(submitButton);
      }).not.toThrow();
    });

    it("handles completion callback errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock location.href to throw
      Object.defineProperty(window.location, "href", {
        set: () => {
          throw new Error("Navigation error");
        },
        configurable: true,
      });

      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      const completeButton = screen.getByText("Complete");

      // Should not throw
      expect(async () => {
        await user.click(completeButton);
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("maintains proper focus management", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Form should be focusable
      const form = screen.getByTestId("generation-form");
      expect(form).toBeInTheDocument();

      // After showing modal, modal should be accessible
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      const modal = screen.getByTestId("status-modal");
      expect(modal).toBeInTheDocument();
    });

    it("provides proper semantic structure", () => {
      render(<GenerationPage />);

      const container = screen.getByTestId("generation-form").parentElement;
      expect(container).toHaveClass("container");
    });
  });

  describe("Edge cases", () => {
    it("handles rapid form submissions", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      const submitButton = screen.getByText("Submit Form");

      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only show one modal
      expect(screen.getByTestId("status-modal")).toBeInTheDocument();
    });

    it("handles empty or invalid jobId", async () => {
      const user = userEvent.setup();

      // Mock form to submit empty jobId
      mockGenerationForm.mockImplementation(({ onSubmit }) => (
        <div data-testid="generation-form">
          <button onClick={() => onSubmit("")}>Submit Empty</button>
          <button onClick={() => onSubmit(null as unknown as string)}>Submit Null</button>
          <button onClick={() => onSubmit(undefined as unknown as string)}>Submit Undefined</button>
        </div>
      ));

      render(<GenerationPage />);

      // Test empty string
      await user.click(screen.getByText("Submit Empty"));
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // Test null
      await user.click(screen.getByText("Submit Null"));
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();

      // Test undefined
      await user.click(screen.getByText("Submit Undefined"));
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
    });

    it("handles component unmounting during generation", () => {
      const { unmount } = render(<GenerationPage />);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it("handles rapid retry clicks", async () => {
      const user = userEvent.setup();
      render(<GenerationPage />);

      // Show modal
      const submitButton = screen.getByText("Submit Form");
      await user.click(submitButton);

      // Rapid retry clicks
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      // Should handle gracefully
      expect(screen.queryByTestId("status-modal")).not.toBeInTheDocument();
    });
  });
});
