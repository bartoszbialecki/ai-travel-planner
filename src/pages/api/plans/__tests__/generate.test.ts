import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../generate";
import type { GeneratePlanRequest } from "../../../../types";
import { createPlanInDb } from "../../../../lib/services/plan-generation.service";
import { logGenerationErrorWithoutJobId } from "../../../../lib/services/error-logging.service";
import { JobQueueService } from "../../../../lib/services/job-queue.service";
import { logger } from "../../../../lib/services/logger";

// Mock dependencies
vi.mock("../../../../lib/services/plan-generation.service", () => ({
  createPlanInDb: vi.fn(),
}));

vi.mock("../../../../lib/services/error-logging.service", () => ({
  logGenerationErrorWithoutJobId: vi.fn(),
}));

vi.mock("../../../../lib/services/job-queue.service", () => ({
  JobQueueService: {
    getInstance: vi.fn(() => ({
      addJob: vi.fn(),
      jobs: new Map(),
      aiService: {},
      isProcessing: false,
      getJobStatus: vi.fn(),
      processJobs: vi.fn(),
      processJob: vi.fn(),
      saveActivitiesToDatabase: vi.fn(),
    })),
  },
}));

vi.mock("../../../../lib/services/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Create mock context helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockContext = (overrides: any = {}) => ({
  request: {
    json: vi.fn().mockResolvedValue({}),
    ...overrides.request,
  },
  locals: {
    user: { id: "user-123", email: "test@example.com" },
    supabase: { mockSupabaseClient: true },
    ...overrides.locals,
  },
  params: {},
  ...overrides,
});

// Create complete JobQueueService mock helper
const createJobQueueServiceMock = (addJobMock: ReturnType<typeof vi.fn>) =>
  ({
    addJob: addJobMock,
    jobs: new Map(),
    aiService: {},
    isProcessing: false,
    getJobStatus: vi.fn(),
    processJobs: vi.fn(),
    processJob: vi.fn(),
    saveActivitiesToDatabase: vi.fn(),
  }) as unknown as JobQueueService;

describe("POST /api/plans/generate", () => {
  const mockCreatePlanInDb = vi.mocked(createPlanInDb);
  const mockLogError = vi.mocked(logGenerationErrorWithoutJobId);
  const mockJobQueueService = vi.mocked(JobQueueService.getInstance);
  const mockLogger = vi.mocked(logger);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Request validation", () => {
    it("should return 400 for invalid JSON", async () => {
      const context = createMockContext({
        request: {
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_JSON");
      expect(data.error.message).toBe("Invalid JSON in request body");
    });

    it("should return 400 for missing required fields", async () => {
      const invalidRequest = {
        name: "",
        destination: "Paris",
        // Missing start_date, end_date, adults_count, children_count
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
      expect(data.error.details).toBeDefined();
    });

    it("should return 400 for invalid date format", async () => {
      const invalidRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "invalid-date",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    });

    it("should return 400 for invalid adults count", async () => {
      const invalidRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 0, // Invalid: must be at least 1
        children_count: 0,
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    });

    it("should return 400 for negative children count", async () => {
      const invalidRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: -1, // Invalid: cannot be negative
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    });

    it("should return 400 for invalid currency format", async () => {
      const invalidRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
        budget_total: 1000,
        budget_currency: "INVALID", // Invalid: must be 3 letters
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    });

    it("should return 400 for invalid travel style", async () => {
      const invalidRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
        travel_style: "invalid" as unknown as "active" | "relaxation" | "flexible", // Invalid: not in enum
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(invalidRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("Invalid request body");
    });
  });

  describe("Authentication", () => {
    it("should return 401 for missing user", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
        locals: {
          user: null, // No user
          supabase: { mockSupabaseClient: true },
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toBe("User not authenticated");
    });

    it("should return 401 for user without id", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
        locals: {
          user: { email: "test@example.com" }, // No id
          supabase: { mockSupabaseClient: true },
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe("UNAUTHORIZED");
      expect(data.error.message).toBe("User not authenticated");
    });
  });

  describe("Successful plan generation", () => {
    it("should create plan and return job details", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
        budget_total: 1000,
        budget_currency: "EUR",
        travel_style: "active",
      };

      const mockJobId = "job-123";
      const mockEstimatedCompletion = "2024-06-01T10:05:00Z";
      const mockAddJob = vi.fn();

      mockCreatePlanInDb.mockResolvedValue({
        job_id: mockJobId,
        estimated_completion: mockEstimatedCompletion,
      });

      mockJobQueueService.mockReturnValue(createJobQueueServiceMock(mockAddJob));

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.job_id).toBe(mockJobId);
      expect(data.status).toBe("processing");
      expect(data.estimated_completion).toBe(mockEstimatedCompletion);

      // Verify service calls
      expect(mockCreatePlanInDb).toHaveBeenCalledWith(
        context.locals.supabase,
        expect.objectContaining({
          ...validRequest,
          user_id: "user-123",
        })
      );
      expect(mockAddJob).toHaveBeenCalledWith(mockJobId);
    });

    it("should handle optional fields correctly", async () => {
      const minimalRequest: GeneratePlanRequest = {
        name: "Simple Trip",
        destination: "London",
        start_date: "2024-07-01",
        end_date: "2024-07-05",
        adults_count: 1,
        children_count: 0,
      };

      const mockJobId = "job-456";
      const mockEstimatedCompletion = "2024-07-01T10:05:00Z";
      const mockAddJob = vi.fn();

      mockCreatePlanInDb.mockResolvedValue({
        job_id: mockJobId,
        estimated_completion: mockEstimatedCompletion,
      });

      mockJobQueueService.mockReturnValue(createJobQueueServiceMock(mockAddJob));

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(minimalRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.job_id).toBe(mockJobId);
      expect(data.status).toBe("processing");

      // Verify service calls with minimal data
      expect(mockCreatePlanInDb).toHaveBeenCalledWith(
        context.locals.supabase,
        expect.objectContaining({
          ...minimalRequest,
          user_id: "user-123",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should handle database errors", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const dbError = new Error("Database connection failed");
      mockCreatePlanInDb.mockRejectedValue(dbError);

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(data.error.message).toBe("Failed to create plan.");

      // Verify error logging
      expect(mockLogError).toHaveBeenCalledWith("user-123", "Database connection failed");
      expect(mockLogger.error).toHaveBeenCalledWith("Plan generation DB error", dbError);
    });

    it("should handle job queue errors", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const mockJobId = "job-123";
      const mockEstimatedCompletion = "2024-06-01T10:05:00Z";
      const mockAddJob = vi.fn().mockRejectedValue(new Error("Queue service unavailable"));

      mockCreatePlanInDb.mockResolvedValue({
        job_id: mockJobId,
        estimated_completion: mockEstimatedCompletion,
      });

      mockJobQueueService.mockReturnValue(createJobQueueServiceMock(mockAddJob));

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(data.error.message).toBe("Failed to create plan.");

      // Verify error logging
      expect(mockLogError).toHaveBeenCalledWith("user-123", "Queue service unavailable");
    });

    it("should handle unknown errors", async () => {
      const validRequest: GeneratePlanRequest = {
        name: "Paris Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      // Simulate unknown error (not an Error instance)
      mockCreatePlanInDb.mockRejectedValue("Unknown error");

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(data.error.message).toBe("Failed to create plan.");

      // Verify error logging with unknown error message
      expect(mockLogError).toHaveBeenCalledWith("user-123", "Unknown error occurred");
    });
  });

  describe("Edge cases", () => {
    it("should handle very long plan names", async () => {
      const longName = "A".repeat(1000);
      const validRequest: GeneratePlanRequest = {
        name: longName,
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 2,
        children_count: 0,
      };

      const mockJobId = "job-123";
      const mockEstimatedCompletion = "2024-06-01T10:05:00Z";
      const mockAddJob = vi.fn();

      mockCreatePlanInDb.mockResolvedValue({
        job_id: mockJobId,
        estimated_completion: mockEstimatedCompletion,
      });

      mockJobQueueService.mockReturnValue(createJobQueueServiceMock(mockAddJob));

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(validRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.job_id).toBe(mockJobId);
    });

    it("should handle maximum values for counts and budget", async () => {
      const maxRequest: GeneratePlanRequest = {
        name: "Large Group Trip",
        destination: "Paris",
        start_date: "2024-06-01",
        end_date: "2024-06-10",
        adults_count: 50,
        children_count: 20,
        budget_total: 999999,
        budget_currency: "USD",
        travel_style: "flexible",
      };

      const mockJobId = "job-123";
      const mockEstimatedCompletion = "2024-06-01T10:05:00Z";
      const mockAddJob = vi.fn();

      mockCreatePlanInDb.mockResolvedValue({
        job_id: mockJobId,
        estimated_completion: mockEstimatedCompletion,
      });

      mockJobQueueService.mockReturnValue(createJobQueueServiceMock(mockAddJob));

      const context = createMockContext({
        request: {
          json: vi.fn().mockResolvedValue(maxRequest),
        },
      });

      const response = await POST(context);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.job_id).toBe(mockJobId);
    });
  });
});
