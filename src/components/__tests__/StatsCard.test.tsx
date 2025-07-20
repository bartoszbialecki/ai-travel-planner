import { render, screen } from "@testing-library/react";
import { StatsCard } from "../StatsCard";

describe("StatsCard", () => {
  const defaultProps = {
    title: "Test Title",
    value: 42,
    icon: <span data-testid="test-icon">📊</span>,
    bgColor: "bg-blue-50",
  };

  it("renders with correct title and value", () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies the correct background color class", () => {
    render(<StatsCard {...defaultProps} />);

    const iconContainer = screen.getByTestId("test-icon").parentElement;
    expect(iconContainer).toHaveClass("bg-blue-50");
  });

  it("renders with different props", () => {
    const customProps = {
      title: "Custom Metric",
      value: 100,
      icon: <span data-testid="custom-icon">🎯</span>,
      bgColor: "bg-green-50",
    };

    render(<StatsCard {...customProps} />);

    expect(screen.getByText("Custom Metric")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();

    const iconContainer = screen.getByTestId("custom-icon").parentElement;
    expect(iconContainer).toHaveClass("bg-green-50");
  });
});
