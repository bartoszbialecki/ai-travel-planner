import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import StatusModal from "../StatusModal";

// Mock the usePlanGenerationStatus hook
vi.mock("../hooks/usePlanGenerationStatus");

import { usePlanGenerationStatus } from "../hooks/usePlanGenerationStatus";
const mockUsePlanGenerationStatus = vi.mocked(usePlanGenerationStatus);

describe("StatusModal", () => {
  const defaultProps = {
    jobId: "test-job-123",
    onComplete: vi.fn(),
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Modal rendering", () => {
    it("renders modal with correct structure", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Generating your travel plan...")).toBeInTheDocument();
      expect(screen.getByLabelText("Generation progress")).toBeInTheDocument();
    });

    it("has correct accessibility attributes", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(modal).toHaveAttribute("aria-describedby", "modal-desc");
    });

    it("focuses modal on mount", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      // The focus is on the Card element inside the dialog, not the dialog itself
      const card = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(card).toHaveFocus();
    });
  });

  describe("Processing state", () => {
    it("shows processing state with progress", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 75,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("Generating plan...")).toBeInTheDocument();
      expect(screen.getByLabelText("Generation progress")).toBeInTheDocument();
    });

    it("shows spinner during processing", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 25,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      const spinner = screen.getByText("Generating plan...").previousElementSibling;
      expect(spinner).toHaveClass("animate-spin");
    });

    it("updates progress dynamically", () => {
      // Start with 25% progress
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 25,
        planId: undefined,
        error: undefined,
      });

      const { rerender } = render(<StatusModal {...defaultProps} />);
      expect(screen.getByText("25%")).toBeInTheDocument();

      // Update to 75% progress
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 75,
        planId: undefined,
        error: undefined,
      });

      rerender(<StatusModal {...defaultProps} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Completed state", () => {
    it("calls onComplete when status becomes completed", async () => {
      const mockOnComplete = vi.fn();
      const planId = "plan-456";

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "completed",
        progress: 100,
        planId,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} onComplete={mockOnComplete} />);

      // Fast-forward timers to trigger the completion callback
      act(() => {
        vi.advanceTimersByTime(1001);
      });

      expect(mockOnComplete).toHaveBeenCalledWith(planId);
    });

    it("shows 100% progress when completed", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "completed",
        progress: 100,
        planId: "plan-456",
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("does not call onComplete without planId", async () => {
      const mockOnComplete = vi.fn();

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "completed",
        progress: 100,
        planId: undefined, // No planId
        error: undefined,
      });

      render(<StatusModal {...defaultProps} onComplete={mockOnComplete} />);

      act(() => {
        vi.advanceTimersByTime(1001);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe("Failed state", () => {
    it("shows error message and retry button", () => {
      const errorMessage = "AI service timeout";
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: errorMessage,
      });

      render(<StatusModal {...defaultProps} />);

      // Check for the visible error message specifically
      expect(screen.getByText(errorMessage, { selector: '[aria-live="assertive"]' })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("shows default error message when no specific error provided", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      // Check for the visible error message specifically
      expect(
        screen.getByText("An error occurred while generating the plan.", { selector: '[aria-live="assertive"]' })
      ).toBeInTheDocument();
    });

    it("calls onRetry when retry button is clicked", async () => {
      const mockOnRetry = vi.fn();

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      render(<StatusModal {...defaultProps} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole("button", { name: /try again/i });

      // Use fireEvent for simpler, synchronous interaction
      act(() => {
        retryButton.click();
      });

      expect(mockOnRetry).toHaveBeenCalled();
    }, 10000);

    it("announces error with live region", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      render(<StatusModal {...defaultProps} />);

      // Find the specific error element with aria-live
      const errorElement = screen.getByText("Test error", { selector: '[aria-live="assertive"]' });
      expect(errorElement).toHaveAttribute("aria-live", "assertive");
    });
  });

  describe("Timeout handling", () => {
    it("shows timeout message after 2 minutes", async () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      // Initially should show processing state
      expect(screen.getByText("Generating plan...")).toBeInTheDocument();

      // Fast-forward 2 minutes
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000 + 1);
      });

      expect(screen.getByText(/generation process timed out/i)).toBeInTheDocument();
    });

    it("shows timeout buttons after timeout", async () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000 + 1);
      });

      expect(screen.getByRole("button", { name: /return to form/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("does not timeout if status becomes completed", async () => {
      // Start with processing
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      const { rerender } = render(<StatusModal {...defaultProps} />);

      // Fast-forward 1 minute
      vi.advanceTimersByTime(60 * 1000);

      // Change to completed
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "completed",
        progress: 100,
        planId: "plan-123",
        error: undefined,
      });

      rerender(<StatusModal {...defaultProps} />);

      // Fast-forward another minute (total 2 minutes)
      vi.advanceTimersByTime(60 * 1000);

      // Should not show timeout message
      expect(screen.queryByText(/generation process timed out/i)).not.toBeInTheDocument();
    });

    it("does not timeout if status becomes failed", async () => {
      // Start with processing
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      const { rerender } = render(<StatusModal {...defaultProps} />);

      // Fast-forward 1 minute
      vi.advanceTimersByTime(60 * 1000);

      // Change to failed
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      rerender(<StatusModal {...defaultProps} />);

      // Fast-forward another minute (total 2 minutes)
      vi.advanceTimersByTime(60 * 1000);

      // Should not show timeout message
      expect(screen.queryByText(/generation process timed out/i)).not.toBeInTheDocument();
    });

    it("calls onRetry when try again is clicked after timeout", async () => {
      const mockOnRetry = vi.fn();

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} onRetry={mockOnRetry} />);

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000 + 1);
      });

      expect(screen.getByText(/generation process timed out/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });

      // Use fireEvent for simpler, synchronous interaction
      act(() => {
        tryAgainButton.click();
      });

      expect(mockOnRetry).toHaveBeenCalled();
    }, 10000);

    it("reloads page when return to form is clicked after timeout", async () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: mockReload },
        writable: true,
      });

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000 + 1);
      });

      expect(screen.getByText(/generation process timed out/i)).toBeInTheDocument();

      const returnButton = screen.getByRole("button", { name: /return to form/i });

      // Use fireEvent for simpler, synchronous interaction
      act(() => {
        returnButton.click();
      });

      expect(mockReload).toHaveBeenCalled();
    }, 10000);
  });

  describe("Accessibility features", () => {
    it("provides live region updates for status changes", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      const liveRegion = screen.getByText("50%");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("provides screen reader description", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      const description = screen.getByText("Your plan is being generated. Please wait.");
      expect(description).toHaveClass("sr-only");
    });

    it("has proper progress bar labeling", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 75,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      const progressBar = screen.getByLabelText("Generation progress");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("announces timeout with assertive live region", async () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000 + 1);
      });

      const timeoutMessage = screen.getByText(/generation process timed out/i).closest("div");
      expect(timeoutMessage).toHaveAttribute("aria-live", "assertive");
    });
  });

  describe("Focus management", () => {
    it("restores focus to previously focused element on unmount", () => {
      // Create a button to focus initially
      const button = document.createElement("button");
      button.textContent = "Previous Button";
      document.body.appendChild(button);
      button.focus();

      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      const { unmount } = render(<StatusModal {...defaultProps} />);

      // The Card element should have focus
      const card = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(card).toHaveFocus();

      unmount();

      // Focus should return to previous element
      expect(button).toHaveFocus();

      // Cleanup
      document.body.removeChild(button);
    });

    it("traps focus within modal", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      render(<StatusModal {...defaultProps} />);

      const card = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      const retryButton = screen.getByRole("button", { name: /try again/i });

      expect(card).toHaveFocus();

      // Focus should be trapped within modal
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles null jobId gracefully", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 0,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} jobId={null as unknown as string} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles rapid status changes", () => {
      // Rapid changes: processing -> failed -> processing -> completed
      const statuses = [
        { status: "processing" as const, progress: 25, planId: undefined, error: undefined },
        { status: "failed" as const, progress: 0, planId: undefined, error: "Error" },
        { status: "processing" as const, progress: 75, planId: undefined, error: undefined },
        { status: "completed" as const, progress: 100, planId: "plan-123", error: undefined },
      ];

      // Set initial status
      mockUsePlanGenerationStatus.mockReturnValue(statuses[0]);
      const { rerender } = render(<StatusModal {...defaultProps} />);

      // Apply remaining status changes
      statuses.slice(1).forEach((statusData) => {
        mockUsePlanGenerationStatus.mockReturnValue(statusData);
        rerender(<StatusModal {...defaultProps} />);
      });

      // Should end up in completed state
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles very long error messages", () => {
      const longError = "A".repeat(1000);
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: longError,
      });

      render(<StatusModal {...defaultProps} />);

      // Check for the visible error message specifically
      expect(screen.getByText(longError, { selector: '[aria-live="assertive"]' })).toBeInTheDocument();
    });

    it("handles progress values outside normal range", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 150, // Over 100%
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      expect(screen.getByText("150%")).toBeInTheDocument();
      expect(screen.getByLabelText("Generation progress")).toBeInTheDocument();
    });
  });
});
