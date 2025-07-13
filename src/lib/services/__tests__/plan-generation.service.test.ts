/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CreatePlanCommand } from "../../../types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the UUID utility
vi.mock("../../utils/uuid", () => ({
  generateUUID: vi.fn(() => "12345678-1234-5678-9012-123456789012"),
}));

import { createPlanInDb, getPlanGenerationStatus } from "../plan-generation.service";
import { generateUUID } from "../../utils/uuid";

// Create a comprehensive mock for SupabaseClient
const createSupabaseMock = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe("plan-generation.service", () => {
  let mockSupabase: SupabaseClient;
  const mockGenerateUUID = vi.mocked(generateUUID);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the UUID mock
    mockGenerateUUID.mockReturnValue("12345678-1234-5678-9012-123456789012");
    mockSupabase = createSupabaseMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createPlanInDb", () => {
    const mockCommand: CreatePlanCommand = {
      user_id: "user-123",
      name: "Paris Adventure",
      destination: "Paris",
      start_date: "2024-06-01",
      end_date: "2024-06-10",
      adults_count: 2,
      children_count: 0,
      budget_total: 1500,
      budget_currency: "EUR",
      travel_style: "active",
    };

    it("should create plan successfully and return job_id and estimated_completion", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        error: null,
        data: [{ id: "plan-123" }],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

      const result = await createPlanInDb(mockSupabase, mockCommand);

      expect(result.job_id).toBe("12345678-1234-5678-9012-123456789012");
      expect(result.estimated_completion).toBeDefined();
      expect(new Date(result.estimated_completion).getTime()).toBeGreaterThan(Date.now());

      // Verify database call
      expect(mockFrom).toHaveBeenCalledWith("plans");
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...mockCommand,
          job_id: "12345678-1234-5678-9012-123456789012",
          status: "processing",
          created_at: expect.any(String),
        }),
      ]);
    });

    it("should generate UUID for job_id", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        error: null,
        data: [{ id: "plan-123" }],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createPlanInDb(mockSupabase, mockCommand);

      expect(result.job_id).toBe("12345678-1234-5678-9012-123456789012");
    });

    it("should set estimated completion to 5 minutes from now", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        error: null,
        data: [{ id: "plan-123" }],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const beforeCall = Date.now();
      const result = await createPlanInDb(mockSupabase, mockCommand);
      const afterCall = Date.now();

      const estimatedTime = new Date(result.estimated_completion).getTime();
      const expectedMin = beforeCall + 5 * 60 * 1000; // +5 minutes
      const expectedMax = afterCall + 5 * 60 * 1000; // +5 minutes

      expect(estimatedTime).toBeGreaterThanOrEqual(expectedMin);
      expect(estimatedTime).toBeLessThanOrEqual(expectedMax);
    });

    it("should handle database errors", async () => {
      const dbError = { message: "Database connection failed", code: "CONNECTION_ERROR" };
      const mockSelect = vi.fn().mockReturnValue({
        error: dbError,
        data: null,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(createPlanInDb(mockSupabase, mockCommand)).rejects.toThrow("Database connection failed");
    });

    it("should handle missing required fields", async () => {
      const incompleteCommand = {
        user_id: "user-123",
        name: "Paris Adventure",
        // Missing required fields
      } as CreatePlanCommand;

      const mockSelect = vi.fn().mockReturnValue({
        error: null,
        data: [{ id: "plan-123" }],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createPlanInDb(mockSupabase, incompleteCommand);

      expect(result.job_id).toBe("12345678-1234-5678-9012-123456789012");
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...incompleteCommand,
          job_id: "12345678-1234-5678-9012-123456789012",
          status: "processing",
          created_at: expect.any(String),
        }),
      ]);
    });

    it("should handle optional fields correctly", async () => {
      const minimalCommand: CreatePlanCommand = {
        user_id: "user-123",
        name: "Simple Trip",
        destination: "London",
        start_date: "2024-07-01",
        end_date: "2024-07-05",
        adults_count: 1,
        children_count: 0,
      };

      const mockSelect = vi.fn().mockReturnValue({
        error: null,
        data: [{ id: "plan-123" }],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createPlanInDb(mockSupabase, minimalCommand);

      expect(result.job_id).toBe("12345678-1234-5678-9012-123456789012");
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          ...minimalCommand,
          job_id: "12345678-1234-5678-9012-123456789012",
          status: "processing",
          created_at: expect.any(String),
        }),
      ]);
    });
  });

  describe("getPlanGenerationStatus", () => {
    const mockJobId = "test-job-123";

    it("should return notFound for non-existent plan", async () => {
      const mockSingle = vi.fn().mockReturnValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBe(true);
      expect(mockSelect).toHaveBeenCalledWith("id, status, created_at, job_id");
      expect(mockEq).toHaveBeenCalledWith("job_id", mockJobId);
    });

    it("should return completed status with 100% progress", async () => {
      const mockPlan = {
        id: "plan-123",
        status: "completed",
        created_at: "2024-06-01T10:00:00Z",
        job_id: mockJobId,
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBeUndefined();
      expect(result.job_id).toBe(mockJobId);
      expect(result.status).toBe("completed");
      expect(result.progress).toBe(100);
      expect(result.plan_id).toBe("plan-123");
    });

    it("should return failed status with 0% progress", async () => {
      const mockPlan = {
        id: "plan-123",
        status: "failed",
        created_at: "2024-06-01T10:00:00Z",
        job_id: mockJobId,
      };

      // Mock the plan query (first call)
      const mockPlanSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockPlanEq = vi.fn().mockReturnValue({
        single: mockPlanSingle,
      });

      const mockPlanSelect = vi.fn().mockReturnValue({
        eq: mockPlanEq,
      });

      // Mock the error query (second call) - return no error details
      const mockErrorSingle = vi.fn().mockReturnValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const mockErrorLimit = vi.fn().mockReturnValue({
        single: mockErrorSingle,
      });

      const mockErrorOrder = vi.fn().mockReturnValue({
        limit: mockErrorLimit,
      });

      const mockErrorEq = vi.fn().mockReturnValue({
        order: mockErrorOrder,
      });

      const mockErrorSelect = vi.fn().mockReturnValue({
        eq: mockErrorEq,
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "plans") {
          return {
            select: mockPlanSelect,
          } as any;
        } else if (table === "generation_errors") {
          return {
            select: mockErrorSelect,
          } as any;
        }
        return {} as any;
      });

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBeUndefined();
      expect(result.job_id).toBe(mockJobId);
      expect(result.status).toBe("failed");
      expect(result.progress).toBe(0);
      expect(result.plan_id).toBeUndefined(); // Only returned for completed status
      expect(result.error_message).toBe("Plan generation failed"); // Default error message when no specific error found
    });

    it("should calculate time-based progress for processing status", async () => {
      // Create a plan that started 2.5 minutes ago (50% progress for 5-minute estimate)
      const createdAt = new Date(Date.now() - 2.5 * 60 * 1000).toISOString();
      const mockPlan = {
        id: "plan-123",
        status: "processing",
        created_at: createdAt,
        job_id: mockJobId,
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBeUndefined();
      expect(result.job_id).toBe(mockJobId);
      expect(result.status).toBe("processing");
      expect(result.progress).toBeGreaterThan(40);
      expect(result.progress).toBeLessThan(60);
      expect(result.plan_id).toBeUndefined(); // Only returned for completed status
    });

    it("should cap progress at 95% for processing status", async () => {
      // Create a plan that started 10 minutes ago (should cap at 95%)
      const createdAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const mockPlan = {
        id: "plan-123",
        status: "processing",
        created_at: createdAt,
        job_id: mockJobId,
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.progress).toBe(95);
    });

    it("should include error message for failed status", async () => {
      const mockPlan = {
        id: "plan-123",
        status: "failed",
        created_at: "2024-06-01T10:00:00Z",
        job_id: mockJobId,
      };

      const mockErrorData = {
        id: "error-123",
        job_id: mockJobId,
        error_message: "AI service timeout",
        created_at: "2024-06-01T10:05:00Z",
      };

      // Mock the plan query (first call)
      const mockPlanSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockPlanEq = vi.fn().mockReturnValue({
        single: mockPlanSingle,
      });

      const mockPlanSelect = vi.fn().mockReturnValue({
        eq: mockPlanEq,
      });

      // Mock the error query (second call)
      const mockErrorSingle = vi.fn().mockReturnValue({
        data: mockErrorData,
        error: null,
      });

      const mockErrorLimit = vi.fn().mockReturnValue({
        single: mockErrorSingle,
      });

      const mockErrorOrder = vi.fn().mockReturnValue({
        limit: mockErrorLimit,
      });

      const mockErrorEq = vi.fn().mockReturnValue({
        order: mockErrorOrder,
      });

      const mockErrorSelect = vi.fn().mockReturnValue({
        eq: mockErrorEq,
      });

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        if (table === "plans") {
          return {
            select: mockPlanSelect,
          } as any;
        } else if (table === "generation_errors") {
          return {
            select: mockErrorSelect,
          } as any;
        }
        return {} as any;
      });

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.error_message).toBe("AI service timeout");
      expect(mockErrorEq).toHaveBeenCalledWith("plan_id", "plan-123");
    });

    it("should handle database errors gracefully", async () => {
      const dbError = { message: "Connection timeout", code: "TIMEOUT" };
      const mockSingle = vi.fn().mockReturnValue({
        data: null,
        error: dbError,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBe(true);
    });

    it("should handle missing plan data", async () => {
      const mockSingle = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.notFound).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle very recent plans (minimal progress)", async () => {
      const mockJobId = "test-job-123";
      const createdAt = new Date().toISOString(); // Just created
      const mockPlan = {
        id: "plan-123",
        status: "processing",
        created_at: createdAt,
        job_id: mockJobId,
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      expect(result.progress).toBeGreaterThanOrEqual(10);
      expect(result.progress).toBeLessThanOrEqual(95);
    });

    it("should handle invalid date format gracefully", async () => {
      const mockJobId = "test-job-123";
      const mockPlan = {
        id: "plan-123",
        status: "processing",
        created_at: "invalid-date",
        job_id: mockJobId,
      };

      const mockSingle = vi.fn().mockReturnValue({
        data: mockPlan,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlanGenerationStatus(mockSupabase, mockJobId);

      // Should handle gracefully and return default progress of 50
      expect(result.progress).toBe(50);
      expect(result.status).toBe("processing");
      expect(result.job_id).toBe(mockJobId);
    });
  });
});
