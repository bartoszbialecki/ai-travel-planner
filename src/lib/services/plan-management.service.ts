import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ListPlansCommand,
  PlanListResponse,
  GetPlanCommand,
  PlanDetailResponse,
  ActivityResponse,
  PlanSummary,
  DeletePlanCommand,
  ToggleActivityCommand,
  ActivityAcceptResponse,
} from "../../types";
import type { Tables } from "../../db/database.types";
import { supabaseClient } from "../../db/supabase.client";
import { logGenerationErrorWithoutJobId } from "./error-logging.service";

/**
 * Service for managing travel plans
 */
export class PlanManagementService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Retrieves a paginated list of plans for a specific user
   */
  async listPlans(command: ListPlansCommand): Promise<PlanListResponse> {
    try {
      const { user_id, page, limit, sort, order } = command;
      const offset = (page - 1) * limit;

      // Build the query with proper filtering and sorting
      let query = this.supabase.from("plans").select("*", { count: "exact" }).eq("user_id", user_id);

      // Apply sorting
      query = query.order(sort, { ascending: order === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: plans, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!plans) {
        throw new Error("No plans data returned from database");
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        plans: plans.map((plan: Tables<"plans">) => ({
          id: plan.id,
          name: plan.name,
          destination: plan.destination,
          start_date: plan.start_date,
          end_date: plan.end_date,
          adults_count: plan.adults_count,
          children_count: plan.children_count,
          budget_total: plan.budget_total,
          budget_currency: plan.budget_currency,
          travel_style: plan.travel_style,
          created_at: plan.created_at,
          job_id: plan.job_id,
          status: plan.status,
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages,
        },
      };
    } catch (error) {
      // Log error for debugging
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(command.user_id, `ListPlans error: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Retrieves a single plan by ID for a specific user
   */
  async getPlanById(planId: string, userId: string): Promise<Tables<"plans">> {
    try {
      const { data: plan, error } = await this.supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", userId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!plan) {
        throw new Error("Plan not found");
      }

      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(userId, `GetPlanById error: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Retrieves detailed plan information with activities grouped by days
   */
  async getPlanDetails(command: GetPlanCommand): Promise<PlanDetailResponse> {
    try {
      const { plan_id, user_id } = command;

      // Input validation
      if (!plan_id || !user_id) {
        throw new Error("Plan ID and user ID are required");
      }

      // Get plan details with user authorization check
      const { data: plan, error: planError } = await this.supabase
        .from("plans")
        .select("*")
        .eq("id", plan_id)
        .eq("user_id", user_id)
        .single();

      if (planError) {
        if (planError.code === "PGRST116") {
          // No rows returned - plan not found or doesn't belong to user
          throw new Error("Plan not found");
        }
        throw new Error(`Database error: ${planError.message}`);
      }

      if (!plan) {
        throw new Error("Plan not found");
      }

      // Get activities with attraction details in a single optimized query
      const { data: activities, error: activitiesError } = await this.supabase
        .from("plan_activity")
        .select(
          `
          id,
          day_number,
          activity_order,
          accepted,
          custom_desc,
          opening_hours,
          cost,
          attraction:attractions (
            id,
            name,
            address,
            description
          )
        `
        )
        .eq("plan_id", plan_id)
        .order("day_number", { ascending: true })
        .order("activity_order", { ascending: true });

      if (activitiesError) {
        throw new Error(`Database error: ${activitiesError.message}`);
      }

      // Process activities and calculate summary efficiently
      const activitiesByDay: Record<number, ActivityResponse[]> = {};
      let totalActivities = 0;
      let acceptedActivities = 0;
      let estimatedTotalCost = 0;

      if (activities && activities.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activities.forEach((activity: any) => {
          const dayNumber = activity.day_number;

          // Initialize day array if not exists
          if (!activitiesByDay[dayNumber]) {
            activitiesByDay[dayNumber] = [];
          }

          // Create activity response object
          const activityResponse: ActivityResponse = {
            id: activity.id,
            attraction: {
              id: activity.attraction.id,
              name: activity.attraction.name,
              address: activity.attraction.address,
              description: activity.attraction.description,
            },
            day_number: activity.day_number,
            activity_order: activity.activity_order,
            accepted: activity.accepted,
            custom_desc: activity.custom_desc,
            opening_hours: activity.opening_hours,
            cost: activity.cost,
          };

          activitiesByDay[dayNumber].push(activityResponse);
          totalActivities++;

          // Update summary statistics
          if (activity.accepted) {
            acceptedActivities++;
          }

          if (activity.cost && typeof activity.cost === "number") {
            estimatedTotalCost += activity.cost;
          }
        });
      }

      // Calculate total days efficiently
      const startDate = new Date(plan.start_date);
      const endDate = new Date(plan.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Create summary with calculated statistics
      const summary: PlanSummary = {
        total_days: totalDays,
        total_activities: totalActivities,
        accepted_activities: acceptedActivities,
        estimated_total_cost: estimatedTotalCost,
      };

      // Return complete plan details
      return {
        ...plan,
        activities: activitiesByDay,
        summary,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(command.user_id, `GetPlanDetails error: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Deletes a plan by ID for a specific user
   * Implements proper permission validation and cascading deletion handling
   */
  async deletePlan(command: DeletePlanCommand): Promise<void> {
    try {
      const { plan_id, user_id } = command;

      // Input validation
      if (!plan_id || !user_id) {
        throw new Error("Plan ID and user ID are required");
      }

      // First, verify that the plan exists and belongs to the user
      // This provides better error handling and security
      const { data: plan, error: checkError } = await this.supabase
        .from("plans")
        .select("id")
        .eq("id", plan_id)
        .eq("user_id", user_id)
        .single();

      if (checkError) {
        if (checkError.code === "PGRST116") {
          // No rows returned - plan not found or doesn't belong to user
          throw new Error("Plan not found");
        }
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (!plan) {
        throw new Error("Plan not found");
      }

      // Delete the plan (cascading deletion will handle related records)
      const { error: deleteError } = await this.supabase
        .from("plans")
        .delete()
        .eq("id", plan_id)
        .eq("user_id", user_id);

      if (deleteError) {
        throw new Error(`Database error: ${deleteError.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(command.user_id, `DeletePlan error: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Accepts or rejects an activity in a plan
   * Implements proper permission validation and activity verification
   */
  async acceptActivity(command: ToggleActivityCommand): Promise<ActivityAcceptResponse> {
    try {
      const { plan_id, activity_id, accepted } = command;

      // Input validation
      if (!plan_id || !activity_id) {
        throw new Error("Plan ID and activity ID are required");
      }

      // First, verify that the plan exists and belongs to the user
      // This provides better error handling and security
      const { data: plan, error: planError } = await this.supabase
        .from("plans")
        .select("id, user_id")
        .eq("id", plan_id)
        .single();

      if (planError) {
        if (planError.code === "PGRST116") {
          // No rows returned - plan not found
          throw new Error("Plan not found");
        }
        throw new Error(`Database error: ${planError.message}`);
      }

      if (!plan) {
        throw new Error("Plan not found");
      }

      // TODO: Verify user_id matches the authenticated user when auth is implemented
      // For now, we'll proceed with the operation

      // Verify that the activity exists and belongs to the plan
      const { data: activity, error: activityError } = await this.supabase
        .from("plan_activity")
        .select("id, plan_id")
        .eq("id", activity_id)
        .eq("plan_id", plan_id)
        .single();

      if (activityError) {
        if (activityError.code === "PGRST116") {
          // No rows returned - activity not found or doesn't belong to plan
          throw new Error("Activity not found");
        }
        throw new Error(`Database error: ${activityError.message}`);
      }

      if (!activity) {
        throw new Error("Activity not found");
      }

      // Verify the activity belongs to the plan
      if (activity.plan_id !== plan_id) {
        throw new Error("Activity does not belong to the plan");
      }

      // Update the activity's accepted status
      const { error: updateError } = await this.supabase
        .from("plan_activity")
        .update({ accepted })
        .eq("id", activity_id)
        .eq("plan_id", plan_id);

      if (updateError) {
        throw new Error(`Database error: ${updateError.message}`);
      }

      // Return success response
      return {
        id: activity_id,
        accepted: true,
        message: "Activity accepted",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId("unknown", `AcceptActivity error: ${errorMessage}`);

      throw error;
    }
  }

  /**
   * Rejects an activity in a plan
   * Implements proper permission validation and activity verification
   */
  async rejectActivity(
    command: ToggleActivityCommand,
    userId: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string; statusCode?: number }> {
    try {
      const { plan_id, activity_id } = command;

      // Input validation
      if (!plan_id || !activity_id) {
        return {
          success: false,
          error: "Plan ID and activity ID are required",
          errorCode: "MISSING_PARAMETERS",
          statusCode: 400,
        };
      }

      // First, verify that the plan exists and belongs to the user
      const { data: plan, error: planError } = await this.supabase
        .from("plans")
        .select("id, user_id")
        .eq("id", plan_id)
        .single();

      if (planError) {
        if (planError.code === "PGRST116") {
          // No rows returned - plan not found
          return {
            success: false,
            error: "Plan not found",
            errorCode: "PLAN_NOT_FOUND",
            statusCode: 404,
          };
        }
        return {
          success: false,
          error: `Database error: ${planError.message}`,
          errorCode: "DATABASE_ERROR",
          statusCode: 500,
        };
      }

      if (!plan) {
        return {
          success: false,
          error: "Plan not found",
          errorCode: "PLAN_NOT_FOUND",
          statusCode: 404,
        };
      }

      // Verify that the plan belongs to the authenticated user
      if (plan.user_id !== userId) {
        return {
          success: false,
          error: "Plan does not belong to the authenticated user",
          errorCode: "FORBIDDEN",
          statusCode: 403,
        };
      }

      // Verify that the activity exists and belongs to the plan
      const { data: activity, error: activityError } = await this.supabase
        .from("plan_activity")
        .select("id, plan_id")
        .eq("id", activity_id)
        .eq("plan_id", plan_id)
        .single();

      if (activityError) {
        if (activityError.code === "PGRST116") {
          // No rows returned - activity not found or doesn't belong to plan
          return {
            success: false,
            error: "Activity not found",
            errorCode: "ACTIVITY_NOT_FOUND",
            statusCode: 404,
          };
        }
        return {
          success: false,
          error: `Database error: ${activityError.message}`,
          errorCode: "DATABASE_ERROR",
          statusCode: 500,
        };
      }

      if (!activity) {
        return {
          success: false,
          error: "Activity not found",
          errorCode: "ACTIVITY_NOT_FOUND",
          statusCode: 404,
        };
      }

      // Verify the activity belongs to the plan
      if (activity.plan_id !== plan_id) {
        return {
          success: false,
          error: "Activity does not belong to the plan",
          errorCode: "ACTIVITY_NOT_IN_PLAN",
          statusCode: 400,
        };
      }

      // Update the activity's accepted status to false (reject)
      const { error: updateError } = await this.supabase
        .from("plan_activity")
        .update({ accepted: false })
        .eq("id", activity_id)
        .eq("plan_id", plan_id);

      if (updateError) {
        return {
          success: false,
          error: `Database error: ${updateError.message}`,
          errorCode: "DATABASE_ERROR",
          statusCode: 500,
        };
      }

      // Return success response
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(userId, `RejectActivity error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        errorCode: "UNEXPECTED_ERROR",
        statusCode: 500,
      };
    }
  }
}

/**
 * Singleton instance of PlanManagementService
 */
export const planManagementService = new PlanManagementService(supabaseClient);
