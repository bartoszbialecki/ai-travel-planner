import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

// Add any providers here if needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Export userEvent setup
export const setupUser = () => userEvent.setup();

// Common test data
export const mockPlanData = {
  id: "test-plan-id",
  name: "Paris Adventure",
  destination: "Paris, France",
  start_date: "2024-06-01",
  end_date: "2024-06-07",
  adults_count: 2,
  children_count: 0,
  budget_total: 5000,
  budget_currency: "EUR",
  travel_style: "active" as const,
  status: "completed" as const,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockUserData = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
};

// Mock Supabase client for tests
export const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockPlanData })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [mockPlanData] })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: "new-plan-id" } })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: mockPlanData })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: mockUserData } })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: mockUserData } })),
    signUp: vi.fn(() => Promise.resolve({ data: { user: mockUserData } })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  },
});

// Mock fetch for API tests
export const mockFetch = (response: unknown, status = 200) => {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  );
};
