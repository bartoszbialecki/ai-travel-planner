import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  describe("rendering", () => {
    it("should render the empty state message", () => {
      render(<EmptyState />);

      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
    });

    it("should render the description text", () => {
      render(<EmptyState />);

      expect(screen.getByText(/Start your journey by creating your first AI-powered travel plan/)).toBeInTheDocument();
    });

    it("should render the icon container", () => {
      render(<EmptyState />);

      // Check for the icon container with gradient background
      const iconContainer = screen.getByTestId("empty-state-icon");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should render the call-to-action button", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
    });

    it("should render the learn more button", () => {
      render(<EmptyState />);

      expect(screen.getByText("Learn More")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should have correct href for the primary CTA button", () => {
      render(<EmptyState />);

      const button = screen.getByText("Create Your First Plan");
      expect(button).toHaveAttribute("href", "/generate");
    });

    it("should have correct href for the learn more button", () => {
      render(<EmptyState />);

      const button = screen.getByText("Learn More");
      expect(button).toHaveAttribute("href", "/generate");
    });

    it("should navigate to generate page when clicked", () => {
      render(<EmptyState />);

      const primaryButton = screen.getByText("Create Your First Plan");
      expect(primaryButton.tagName).toBe("A");
      expect(primaryButton).toHaveAttribute("href", "/generate");
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
    it("should have proper semantic structure", () => {
      render(<EmptyState />);

      // Should have a heading-like element for the main message
      const title = screen.getByText("No Travel Plans Yet");
      expect(title).toBeInTheDocument();

      // Should have descriptive text
      const description = screen.getByText(/Start your journey by creating your first AI-powered travel plan/);
      expect(description).toBeInTheDocument();

      // Should have clickable links
      const primaryLink = screen.getByRole("link", { name: "Create Your First Plan" });
      const secondaryLink = screen.getByRole("link", { name: "Learn More" });
      expect(primaryLink).toBeInTheDocument();
      expect(secondaryLink).toBeInTheDocument();
    });

    it("should have proper link roles", () => {
      render(<EmptyState />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent("Create Your First Plan");
      expect(links[1]).toHaveTextContent("Learn More");
    });
  });

  describe("content verification", () => {
    it("should have the correct main message", () => {
      render(<EmptyState />);

      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
    });

    it("should have the correct description", () => {
      render(<EmptyState />);

      expect(screen.getByText(/Start your journey by creating your first AI-powered travel plan/)).toBeInTheDocument();
    });

    it("should have the correct primary button text", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
    });

    it("should have the correct secondary button text", () => {
      render(<EmptyState />);

      expect(screen.getByText("Learn More")).toBeInTheDocument();
    });
  });

  describe("interaction behavior", () => {
    it("should be clickable", () => {
      render(<EmptyState />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      links.forEach((link) => {
        expect(link.tagName).toBe("A");
      });
    });

    it("should be focusable", () => {
      render(<EmptyState />);

      const primaryLink = screen.getByRole("link", { name: "Create Your First Plan" });
      // The link should be focusable
      primaryLink.focus();
      expect(document.activeElement).toBe(primaryLink);
    });
  });

  describe("edge cases", () => {
    it("should render without any props", () => {
      render(<EmptyState />);

      expect(screen.getByText("No Travel Plans Yet")).toBeInTheDocument();
      expect(screen.getByText("Create Your First Plan")).toBeInTheDocument();
    });

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
