import type { Tables } from "./db/database.types";

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Request DTO for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Request DTO for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response DTO for authentication operations
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    created_at?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Response DTO for logout operation
 */
export interface LogoutResponse {
  message: string;
}

// ============================================================================
// PLAN GENERATION DTOs
// ============================================================================

export type TravelStyle = "active" | "relaxation" | "flexible";

/**
 * Request DTO for plan generation
 * Maps to TablesInsert<'plans'> with additional validation
 */
export interface GeneratePlanRequest {
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  adults_count: number;
  children_count: number;
  budget_total?: number | null;
  budget_currency?: string | null;
  travel_style?: TravelStyle | null;
}

export type GenerationStatus = "processing" | "completed" | "failed";

/**
 * Response DTO for plan generation initiation
 */
export interface GeneratePlanResponse {
  job_id: string;
  status: Extract<GenerationStatus, "processing">;
  estimated_completion: string;
}

/**
 * Response DTO for generation status check
 */
export interface GenerationStatusResponse {
  job_id: string;
  status: GenerationStatus;
  progress: number;
  plan_id?: string;
  error_message?: string;
}

// ============================================================================
// PLAN MANAGEMENT DTOs
// ============================================================================

/**
 * Response DTO for plan list with pagination
 */
export interface PlanListResponse {
  plans: Pick<
    Tables<"plans">,
    | "id"
    | "name"
    | "destination"
    | "start_date"
    | "end_date"
    | "adults_count"
    | "children_count"
    | "budget_total"
    | "budget_currency"
    | "travel_style"
    | "created_at"
    | "job_id"
    | "status"
  >[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Attraction DTO for activity responses
 */
export interface AttractionResponse {
  id: string;
  name: string;
  address: string;
  description: string;
}

/**
 * Activity DTO combining plan_activity with attraction data
 */
export interface ActivityResponse {
  id: string;
  attraction: AttractionResponse;
  day_number: number;
  activity_order: number;
  accepted: boolean;
  custom_desc: string | null;
  opening_hours: string | null;
  cost: number | null;
}

/**
 * Plan summary statistics
 */
export interface PlanSummary {
  total_days: number;
  total_activities: number;
  accepted_activities: number;
  estimated_total_cost: number;
}

/**
 * Response DTO for detailed plan with activities grouped by day
 */
export interface PlanDetailResponse extends Tables<"plans"> {
  activities: Record<number, ActivityResponse[]>;
  summary: PlanSummary;
}

/**
 * Response DTO for plan deletion
 */
export interface DeletePlanResponse {
  message: string;
}

// ============================================================================
// ACTIVITY MANAGEMENT DTOs
// ============================================================================

/**
 * Response DTO for activity acceptance
 */
export interface ActivityAcceptResponse {
  id: string;
  accepted: true;
  message: string;
}

/**
 * Response DTO for activity rejection
 */
export interface ActivityRejectResponse {
  id: string;
  accepted: false;
  message: string;
}

/**
 * Request DTO for activity updates
 * Maps to partial TablesUpdate<'plan_activity'>
 */
export interface UpdateActivityRequest {
  custom_desc?: string | null;
  opening_hours?: string | null;
  cost?: number | null;
}

/**
 * Response DTO for activity updates
 */
export interface UpdateActivityResponse extends UpdateActivityRequest {
  id: string;
  message: string;
}

// ============================================================================
// ATTRACTIONS DTOs
// ============================================================================

/**
 * Response DTO for attractions list with pagination
 */
export interface AttractionListResponse {
  attractions: Tables<"attractions">[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// ERROR RESPONSE DTOs
// ============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    error_details?: unknown;
  };
}

// ============================================================================
// COMMAND MODELS
// ============================================================================

/**
 * Command model for creating a new plan
 * Extends GeneratePlanRequest with user_id
 */
export interface CreatePlanCommand extends GeneratePlanRequest {
  user_id: string;
}

/**
 * Command model for updating plan activity
 * Maps to TablesUpdate<'plan_activity'>
 */
export interface UpdateActivityCommand extends UpdateActivityRequest {
  plan_id: string;
  activity_id: string;
}

/**
 * Command model for accepting/rejecting activity
 */
export interface ToggleActivityCommand {
  plan_id: string;
  activity_id: string;
  accepted: boolean;
}

/**
 * Command model for deleting a plan
 */
export interface DeletePlanCommand {
  plan_id: string;
  user_id: string;
}

/**
 * Command model for listing plans with pagination and sorting
 */
export interface ListPlansCommand {
  user_id: string;
  page: number;
  limit: number;
  sort: "created_at" | "name" | "destination";
  order: "asc" | "desc";
}

/**
 * Command model for retrieving a single plan by ID
 */
export interface GetPlanCommand {
  plan_id: string;
  user_id: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Search parameters for attractions
 */
export interface AttractionSearchParams extends PaginationParams {
  q?: string;
  destination?: string;
}

/**
 * Plan list query parameters
 */
export type PlanListParams = PaginationParams & {
  sort?: "created_at" | "name" | "destination";
  order?: "asc" | "desc";
};

// ============================================================================
// TYPE GUARDS AND VALIDATORS
// ============================================================================

/**
 * Type guard to check if object is a valid GeneratePlanRequest
 */
export function isValidGeneratePlanRequest(obj: unknown): obj is GeneratePlanRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).name === "string" &&
    typeof (obj as Record<string, unknown>).destination === "string" &&
    typeof (obj as Record<string, unknown>).start_date === "string" &&
    typeof (obj as Record<string, unknown>).end_date === "string" &&
    typeof (obj as Record<string, unknown>).adults_count === "number" &&
    typeof (obj as Record<string, unknown>).children_count === "number" &&
    ((obj as Record<string, unknown>).budget_total === null ||
      typeof (obj as Record<string, unknown>).budget_total === "number") &&
    ((obj as Record<string, unknown>).budget_currency === null ||
      typeof (obj as Record<string, unknown>).budget_currency === "string") &&
    ((obj as Record<string, unknown>).travel_style === null ||
      ["active", "relaxation", "flexible"].includes((obj as Record<string, unknown>).travel_style as string))
  );
}

/**
 * Type guard to check if object is a valid UpdateActivityRequest
 */
export function isValidUpdateActivityRequest(obj: unknown): obj is UpdateActivityRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ((obj as Record<string, unknown>).custom_desc === undefined ||
      (obj as Record<string, unknown>).custom_desc === null ||
      typeof (obj as Record<string, unknown>).custom_desc === "string") &&
    ((obj as Record<string, unknown>).opening_hours === undefined ||
      (obj as Record<string, unknown>).opening_hours === null ||
      typeof (obj as Record<string, unknown>).opening_hours === "string") &&
    ((obj as Record<string, unknown>).cost === undefined ||
      (obj as Record<string, unknown>).cost === null ||
      typeof (obj as Record<string, unknown>).cost === "number")
  );
}
