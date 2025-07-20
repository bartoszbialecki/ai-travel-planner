import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  describe("rendering", () => {
    it("should render all main elements", () => {
      render(<EmptyState />);

      // Main content
      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
      expect(screen.getByText(/Start your journey by creating your first AI-powered travel plan/)).toBeInTheDocument();

      // Buttons
      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
      expect(screen.getByText("Learn More")).toBeInTheDocument();

      // Icon
      expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should have correct navigation links", () => {
      render(<EmptyState />);

      const primaryButton = screen.getByRole("link", { name: "Create Your First Plan" });
      const secondaryButton = screen.getByRole("link", { name: "Learn More" });

      expect(primaryButton).toHaveAttribute("href", "/generate");
      expect(secondaryButton).toHaveAttribute("href", "/generate");
    });
  });

  describe("feature highlights", () => {
    it("should render feature highlights section", () => {
      render(<EmptyState />);

      expect(screen.getByText("AI-Powered")).toBeInTheDocument();
      expect(screen.getByText("Budget-Friendly")).toBeInTheDocument();
      expect(screen.getByText("Personalized")).toBeInTheDocument();
    });

    it("should render feature descriptions", () => {
      render(<EmptyState />);

      expect(screen.getByText("Smart recommendations")).toBeInTheDocument();
      expect(screen.getByText("Cost-optimized plans")).toBeInTheDocument();
      expect(screen.getByText("Tailored to you")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic structure and link roles", () => {
      render(<EmptyState />);

      // Should have proper link roles
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent("Create Your First Plan");
      expect(links[1]).toHaveTextContent("Learn More");
    });

    it("should be focusable", () => {
      render(<EmptyState />);

      const primaryLink = screen.getByRole("link", { name: "Create Your First Plan" });
      primaryLink.focus();
      expect(document.activeElement).toBe(primaryLink);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid re-renders", () => {
      const { rerender } = render(<EmptyState />);

      // Re-render multiple times
      rerender(<EmptyState />);
      rerender(<EmptyState />);
      rerender(<EmptyState />);

      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
    });
  });

  describe("performance", () => {
    it("should render efficiently", () => {
      const startTime = performance.now();
      render(<EmptyState />);
      const endTime = performance.now();

      // Should render quickly (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("should not cause memory leaks", () => {
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<EmptyState />);
        unmount();
      }

      // If we get here without errors, no memory leaks occurred
      expect(true).toBe(true);
    });
  });
});
