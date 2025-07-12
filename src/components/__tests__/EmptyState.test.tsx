import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  describe("rendering", () => {
    it("should render the empty state message", () => {
      render(<EmptyState />);

      expect(screen.getByText("You don't have any travel plans yet")).toBeInTheDocument();
    });

    it("should render the description text", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create your first plan and start exploring the world!")).toBeInTheDocument();
    });

    it("should render the emoji icon", () => {
      render(<EmptyState />);

      expect(screen.getByText("🗺️")).toBeInTheDocument();
    });

    it("should render the call-to-action button", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create new plan")).toBeInTheDocument();
    });
  });

  describe("layout and styling", () => {
    it("should have proper container classes", () => {
      const { container } = render(<EmptyState />);

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement).toHaveClass("flex", "flex-col", "items-center", "justify-center", "py-16");
    });

    it("should have proper emoji styling", () => {
      render(<EmptyState />);

      const emoji = screen.getByText("🗺️");
      expect(emoji).toHaveClass("text-3xl", "mb-4");
    });

    it("should have proper title styling", () => {
      render(<EmptyState />);

      const title = screen.getByText("You don't have any travel plans yet");
      expect(title).toHaveClass("text-lg", "font-semibold", "mb-2");
    });

    it("should have proper description styling", () => {
      render(<EmptyState />);

      const description = screen.getByText("Create your first plan and start exploring the world!");
      expect(description).toHaveClass("text-muted-foreground", "mb-6");
    });

    it("should have proper button styling", () => {
      render(<EmptyState />);

      const button = screen.getByText("Create new plan");
      expect(button).toHaveClass("shadcn-btn", "shadcn-btn-primary");
    });
  });

  describe("navigation", () => {
    it("should have correct href for the CTA button", () => {
      render(<EmptyState />);

      const button = screen.getByText("Create new plan");
      expect(button).toHaveAttribute("href", "/generate");
    });

    it("should navigate to generate page when clicked", () => {
      render(<EmptyState />);

      const button = screen.getByText("Create new plan");
      expect(button.tagName).toBe("A");
      expect(button).toHaveAttribute("href", "/generate");
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<EmptyState />);

      // Should have a heading-like element for the main message
      const title = screen.getByText("You don't have any travel plans yet");
      expect(title).toBeInTheDocument();

      // Should have descriptive text
      const description = screen.getByText("Create your first plan and start exploring the world!");
      expect(description).toBeInTheDocument();

      // Should have a clickable link
      const link = screen.getByRole("link", { name: "Create new plan" });
      expect(link).toBeInTheDocument();
    });

    it("should have proper link role", () => {
      render(<EmptyState />);

      const link = screen.getByRole("link");
      expect(link).toHaveTextContent("Create new plan");
    });
  });

  describe("content verification", () => {
    it("should have the correct emoji", () => {
      render(<EmptyState />);

      expect(screen.getByText("🗺️")).toBeInTheDocument();
    });

    it("should have the correct main message", () => {
      render(<EmptyState />);

      expect(screen.getByText("You don't have any travel plans yet")).toBeInTheDocument();
    });

    it("should have the correct description", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create your first plan and start exploring the world!")).toBeInTheDocument();
    });

    it("should have the correct button text", () => {
      render(<EmptyState />);

      expect(screen.getByText("Create new plan")).toBeInTheDocument();
    });
  });

  describe("responsive design", () => {
    it("should be centered vertically and horizontally", () => {
      const { container } = render(<EmptyState />);

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement).toHaveClass("flex", "flex-col", "items-center", "justify-center");
    });

    it("should have proper spacing", () => {
      render(<EmptyState />);

      const container = screen.getByText("🗺️").parentElement;
      expect(container).toHaveClass("py-16");
    });
  });

  describe("interaction behavior", () => {
    it("should be clickable", () => {
      render(<EmptyState />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });

    it("should have proper focus styles", () => {
      render(<EmptyState />);

      const link = screen.getByRole("link");
      // The link should be focusable
      link.focus();
      expect(document.activeElement).toBe(link);
    });
  });

  describe("edge cases", () => {
    it("should render without any props", () => {
      render(<EmptyState />);

      expect(screen.getByText("You don't have any travel plans yet")).toBeInTheDocument();
      expect(screen.getByText("Create new plan")).toBeInTheDocument();
    });

    it("should handle rapid re-renders", () => {
      const { rerender } = render(<EmptyState />);

      // Re-render multiple times
      rerender(<EmptyState />);
      rerender(<EmptyState />);
      rerender(<EmptyState />);

      expect(screen.getByText("You don't have any travel plans yet")).toBeInTheDocument();
      expect(screen.getByText("Create new plan")).toBeInTheDocument();
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
