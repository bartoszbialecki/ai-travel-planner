import { supabaseClient } from "../../db/supabase.client";

export async function logGenerationError(job_id: string, error_message: string, details?: Record<string, unknown>) {
  // First, get plan_id from plans table using job_id
  const { data: planData, error: planError } = await supabaseClient
    .from("plans")
    .select("id")
    .eq("job_id", job_id)
    .single();

  if (planError || !planData) {
    console.error("Failed to find plan for job_id:", job_id, planError);
    return;
  }

  // Then insert error record
  const { error } = await supabaseClient.from("generation_errors").insert([
    {
      plan_id: planData.id,
      error_message,
      error_details: details,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) {
    console.error("Failed to log generation error:", error);
  }
}

export async function logGenerationErrorWithoutJobId(user_id: string, error_message: string) {
  // Create a temporary plan record just for error logging
  const { data: tempPlan, error: tempError } = await supabaseClient
    .from("plans")
    .insert([
      {
        user_id,
        name: "Error Logging Plan",
        destination: "Unknown",
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        adults_count: 1,
        children_count: 0,
        status: "failed",
        created_at: new Date().toISOString(),
      },
    ])
    .select("id")
    .single();

  if (tempError || !tempPlan) {
    console.error("Failed to create temp plan for error logging:", tempError);
    return;
  }

  // Log the error
  const { error } = await supabaseClient.from("generation_errors").insert([
    {
      plan_id: tempPlan.id,
      error_message,
      created_at: new Date().toISOString(),
    },
  ]);
  if (error) {
    console.error("Failed to log generation error:", error);
  }
}

/**
 * Logs API error with context (plan_id, error_message)
 */
export async function logApiErrorWithContext({ plan_id, error_message }: { plan_id?: string; error_message: string }) {
  try {
    if (!plan_id || typeof plan_id !== "string") {
      console.error("logApiErrorWithContext: plan_id is required and must be a string");
      return;
    }
    await supabaseClient.from("generation_errors").insert([
      {
        plan_id,
        error_message,
        error_details: null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("Failed to log API error:", err);
  }
}
