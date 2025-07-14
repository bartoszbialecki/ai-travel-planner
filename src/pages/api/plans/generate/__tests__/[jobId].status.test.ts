import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "../[jobId]/status";
import { getPlanGenerationStatus } from "../../../../../lib/services/plan-generation.service";
import { createSupabaseServiceRoleClient } from "../../../../../db/supabase.client";
import type { GenerationStatusResponse, ErrorResponse } from "../../../../../types";

// Mock dependencies
vi.mock("../../../../../lib/services/plan-generation.service", () => ({
  getPlanGenerationStatus: vi.fn(),
}));

vi.mock("../../../../../db/supabase.client", () => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

// Create mock context helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockContext = (jobId: string, overrides: any = {}) => ({
  params: { jobId },
  request: {
    url: `http://localhost/api/plans/generate/${jobId}/status`,
    ...overrides.request,
  },
  locals: {
    user: { id: "user-123", email: "test@example.com" },
    supabase: { mockSupabaseClient: true },
    ...overrides.locals,
  },
  ...overrides,
});

describe("GET /api/plans/generate/{jobId}/status", () => {
  const mockGetPlanGenerationStatus = vi.mocked(getPlanGenerationStatus);
  const mockCreateSupabaseClient = vi.mocked(createSupabaseServiceRoleClient);

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateSupabaseClient.mockReturnValue({ mockSupabaseClient: true } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("UUID validation", () => {
    it("should return 400 for invalid UUID format", async () => {
      const context = createMockContext("invalid-uuid");

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JOB_ID");
      expect(data.error.message).toBe("Invalid job ID format. Must be a valid UUID.");
      expect(data.error.details.field).toBe("jobId");
      expect(data.error.details.issue).toBe("Invalid UUID format");
      expect(data.error.details.provided).toBe("invalid-uuid");
    });

    it("should return 400 for empty jobId", async () => {
      const context = createMockContext("");

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JOB_ID");
      expect(data.error.message).toBe("Invalid job ID format. Must be a valid UUID.");
    });

    it("should return 400 for undefined jobId", async () => {
      const context = createMockContext(undefined as unknown as string);

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JOB_ID");
      expect(data.error.message).toBe("Invalid job ID format. Must be a valid UUID.");
    });

    it("should return 400 for malformed UUID", async () => {
      const context = createMockContext("123e4567-e89b-12d3-a456-42661417400"); // Missing last digit

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JOB_ID");
      expect(data.error.message).toBe("Invalid job ID format. Must be a valid UUID.");
    });

    it("should accept valid UUID v4", async () => {
      const validUUID = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext(validUUID);

      mockGetPlanGenerationStatus.mockResolvedValue({
        job_id: validUUID,
        status: "processing",
        progress: 50,
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockGetPlanGenerationStatus).toHaveBeenCalledWith(expect.anything(), validUUID);
    });

    it("should accept valid UUID v1", async () => {
      const validUUID = "550e8400-e29b-11d4-a716-446655440000";
      const context = createMockContext(validUUID);

      mockGetPlanGenerationStatus.mockResolvedValue({
        job_id: validUUID,
        status: "processing",
        progress: 50,
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockGetPlanGenerationStatus).toHaveBeenCalledWith(expect.anything(), validUUID);
    });
  });

  describe("Status tracking", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("should return 404 for non-existent plan", async () => {
      const context = createMockContext(validUUID);

      mockGetPlanGenerationStatus.mockResolvedValue({
        notFound: true,
      });

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("PLAN_NOT_FOUND");
      expect(data.error.message).toBe("Plan with specified job ID not found.");
      expect(data.error.details.job_id).toBe(validUUID);
    });

    it("should return processing status", async () => {
      const context = createMockContext(validUUID);

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "processing",
        progress: 25,
        plan_id: undefined,
        error_message: undefined,
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.job_id).toBe(validUUID);
      expect(data.status).toBe("processing");
      expect(data.progress).toBe(25);
      expect(data.plan_id).toBeUndefined();
      expect(data.error_message).toBeUndefined();
    });

    it("should return completed status with plan_id", async () => {
      const context = createMockContext(validUUID);
      const planId = "plan-456";

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "completed",
        progress: 100,
        plan_id: planId,
        error_message: undefined,
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.job_id).toBe(validUUID);
      expect(data.status).toBe("completed");
      expect(data.progress).toBe(100);
      expect(data.plan_id).toBe(planId);
      expect(data.error_message).toBeUndefined();
    });

    it("should return failed status with error message", async () => {
      const context = createMockContext(validUUID);
      const errorMessage = "AI service temporarily unavailable";

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "failed",
        progress: 0,
        plan_id: undefined,
        error_message: errorMessage,
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.job_id).toBe(validUUID);
      expect(data.status).toBe("failed");
      expect(data.progress).toBe(0);
      expect(data.plan_id).toBeUndefined();
      expect(data.error_message).toBe(errorMessage);
    });
  });

  describe("Progress calculation", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("should return 0% progress for failed status", async () => {
      const context = createMockContext(validUUID);

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "failed",
        progress: 0,
        plan_id: undefined,
        error_message: "Generation failed",
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress).toBe(0);
    });

    it("should return 100% progress for completed status", async () => {
      const context = createMockContext(validUUID);

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "completed",
        progress: 100,
        plan_id: "plan-123",
        error_message: undefined,
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress).toBe(100);
    });

    it("should return time-based progress for processing status", async () => {
      const context = createMockContext(validUUID);

      const mockStatus: GenerationStatusResponse = {
        job_id: validUUID,
        status: "processing",
        progress: 65, // Time-based calculation
        plan_id: undefined,
        error_message: undefined,
      };

      mockGetPlanGenerationStatus.mockResolvedValue(mockStatus);

      const response = await GET(context);
      const data: GenerationStatusResponse = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress).toBe(65);
    });
  });

  describe("Error handling", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("should handle service errors gracefully", async () => {
      const context = createMockContext(validUUID);

      mockGetPlanGenerationStatus.mockRejectedValue(new Error("Database connection failed"));

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe("Internal server error occurred while processing request.");
      expect(data.error.details.job_id).toBe(validUUID);
    });

    it("should handle service client creation errors", async () => {
      const context = createMockContext(validUUID);

      mockCreateSupabaseClient.mockImplementation(() => {
        throw new Error("Failed to create Supabase client");
      });

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe("Internal server error occurred while processing request.");
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext(validUUID);

      // Simulate unexpected error (not an Error instance)
      mockGetPlanGenerationStatus.mockRejectedValue("Unexpected error");

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe("Internal server error occurred while processing request.");
    });
  });

  describe("Edge cases", () => {
    it("should handle UUID with mixed case", async () => {
      const mixedCaseUUID = "123E4567-E89B-12D3-A456-426614174000";
      const context = createMockContext(mixedCaseUUID);

      mockGetPlanGenerationStatus.mockResolvedValue({
        job_id: mixedCaseUUID,
        status: "processing",
        progress: 50,
      });

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockGetPlanGenerationStatus).toHaveBeenCalledWith(expect.anything(), mixedCaseUUID);
    });

    it("should handle service returning null", async () => {
      const validUUID = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext(validUUID);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockGetPlanGenerationStatus.mockResolvedValue(null as any);

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("PLAN_NOT_FOUND");
    });

    it("should handle service returning undefined", async () => {
      const validUUID = "123e4567-e89b-12d3-a456-426614174000";
      const context = createMockContext(validUUID);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockGetPlanGenerationStatus.mockResolvedValue(undefined as any);

      const response = await GET(context);
      const data: ErrorResponse = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("PLAN_NOT_FOUND");
    });
  });

  describe("Response format", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("should return correct content-type header", async () => {
      const context = createMockContext(validUUID);

      mockGetPlanGenerationStatus.mockResolvedValue({
        job_id: validUUID,
        status: "processing",
        progress: 50,
      });

      const response = await GET(context);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return valid JSON for all status types", async () => {
      const context = createMockContext(validUUID);

      const statuses: ("processing" | "completed" | "failed")[] = ["processing", "completed", "failed"];

      for (const status of statuses) {
        mockGetPlanGenerationStatus.mockResolvedValue({
          job_id: validUUID,
          status,
          progress: status === "completed" ? 100 : status === "failed" ? 0 : 50,
          plan_id: status === "completed" ? "plan-123" : undefined,
          error_message: status === "failed" ? "Test error" : undefined,
        });

        const response = await GET(context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.job_id).toBe(validUUID);
        expect(data.status).toBe(status);
        expect(typeof data.progress).toBe("number");
      }
    });
  });
});
