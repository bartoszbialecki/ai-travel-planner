import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListPlansCommand, PlanListResponse } from "../../types";
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
