import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPlanInDb, getPlanGenerationStatus } from "../plan-generation.service";

// Mock Supabase client
vi.mock("../../db/supabase.client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "test-plan-id" } })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-user-id" } } })),
    },
  },
}));

describe("Plan Generation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a plan in database successfully", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: "test-plan-id" } })),
          })),
        })),
      })),
    };

    const input = {
      name: "Paris Trip",
      destination: "Paris",
      start_date: "2024-06-01",
      end_date: "2024-06-07",
      adults_count: 2,
      children_count: 0,
      budget_total: 5000,
      budget_currency: "EUR",
      travel_style: "active" as const,
    };

    const result = await createPlanInDb(mockSupabase as any, input);

    expect(result).toBeDefined();
    expect(result.job_id).toBeDefined();
    expect(result.estimated_completion).toBeDefined();
  });

  it("should get plan generation status successfully", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: "test-plan-id",
                  status: "completed",
                  created_at: new Date().toISOString(),
                  job_id: "test-job-id",
                },
              })
            ),
          })),
        })),
      })),
    };

    const result = await getPlanGenerationStatus(mockSupabase as any, "test-job-id");

    expect(result).toBeDefined();
    expect(result.job_id).toBe("test-job-id");
    expect(result.status).toBe("completed");
    expect(result.progress).toBe(100);
  });

  it("should return notFound when plan doesn't exist", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
          })),
        })),
      })),
    };

    const result = await getPlanGenerationStatus(mockSupabase as any, "non-existent-job");

    expect(result).toEqual({ notFound: true });
  });
});
