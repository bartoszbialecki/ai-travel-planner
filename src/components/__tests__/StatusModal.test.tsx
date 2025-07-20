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
    it("renders modal with correct structure and accessibility", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      // Check modal structure
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Generating your travel plan...")).toBeInTheDocument();
      expect(screen.getByLabelText("Generation progress")).toBeInTheDocument();

      // Check accessibility attributes
      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(modal).toHaveAttribute("aria-describedby", "modal-desc");

      // Check focus management
      const card = screen.getByRole("dialog").querySelector('[tabindex="-1"]');
      expect(card).toHaveFocus();
    });
  });

  describe("Processing state", () => {
    it("shows processing state with progress and spinner", () => {
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

      // Check spinner is present
      const spinner = screen.getByText("Generating plan...").previousElementSibling;
      expect(spinner).toBeInTheDocument();
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

    it("calls onRetry when retry button is clicked", () => {
      const mockOnRetry = vi.fn();
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      render(<StatusModal {...defaultProps} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole("button", { name: /try again/i });
      retryButton.click();

      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe("Progress display", () => {
    it("shows progress percentage and bar with correct attributes", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 67,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      expect(screen.getByText("67%")).toBeInTheDocument();

      const progressBar = screen.getByLabelText("Generation progress");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  describe("Accessibility", () => {
    it("has proper live regions and focus management", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      render(<StatusModal {...defaultProps} />);

      // Check live regions
      const liveRegion = screen.getByText("Generating plan...").closest("div");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");

      // Check modal structure
      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });

    it("has proper error live region", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "failed",
        progress: 0,
        planId: undefined,
        error: "Test error",
      });

      render(<StatusModal {...defaultProps} />);

      const errorRegion = screen.getByText("Test error", { selector: '[aria-live="assertive"]' });
      expect(errorRegion).toBeInTheDocument();
    });
  });

  describe("Performance optimization", () => {
    it("does not re-render unnecessarily with same props", () => {
      mockUsePlanGenerationStatus.mockReturnValue({
        status: "processing",
        progress: 50,
        planId: undefined,
        error: undefined,
      });

      const { rerender } = render(<StatusModal {...defaultProps} />);

      const initialModal = screen.getByRole("dialog");

      // Re-render with same props
      rerender(<StatusModal {...defaultProps} />);

      const newModal = screen.getByRole("dialog");
      expect(newModal).toBe(initialModal);
    });
  });
});
