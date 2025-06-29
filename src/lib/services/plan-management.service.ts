import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ListPlansCommand,
  PlanListResponse,
  GetPlanCommand,
  PlanDetailResponse,
  ActivityResponse,
  PlanSummary,
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
   */
  async deletePlan(planId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("plans").delete().eq("id", planId).eq("user_id", userId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await logGenerationErrorWithoutJobId(userId, `DeletePlan error: ${errorMessage}`);

      throw error;
    }
  }
}

/**
 * Singleton instance of PlanManagementService
 */
export const planManagementService = new PlanManagementService(supabaseClient);
