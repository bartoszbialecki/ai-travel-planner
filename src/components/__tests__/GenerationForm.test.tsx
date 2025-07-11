import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerationForm from "../GenerationForm";

// Mock fetch globally
global.fetch = vi.fn();

// Mock the hooks and services
vi.mock("../hooks/useFormDraft", () => ({
  useFormDraft: () => ({
    values: {
      name: "Paris trip",
      destination: "Paris",
      startDate: "2024-06-01",
      endDate: "2024-06-07",
      adultsCount: 2,
      childrenCount: 0,
      budgetTotal: 5000,
      budgetCurrency: "EUR",
      travelStyle: "active",
    },
    setValues: vi.fn(),
    resetDraft: vi.fn(),
  }),
}));

vi.mock("../hooks/usePlanGenerationStatus", () => ({
  usePlanGenerationStatus: () => ({
    isGenerating: false,
    progress: 0,
    error: null,
  }),
}));

describe("GenerationForm", () => {
  it("renders all form fields", () => {
    render(<GenerationForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adults/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/children/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    // Mock successful API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ job_id: "test-job-id" }),
    } as Response);

    render(<GenerationForm onSubmit={mockSubmit} />);

    await user.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith("test-job-id");
    });
  });
});
