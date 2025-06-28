import { supabaseClient } from "../../db/supabase.client";
import type { CreatePlanCommand } from "../../types";
import { randomUUID } from "crypto";

export async function createPlanInDb(input: CreatePlanCommand) {
  const job_id = randomUUID();
  const estimated_completion = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // +5 min
  const { error } = await supabaseClient
    .from("plans")
    .insert([
      {
        ...input,
        job_id,
        status: "processing",
        created_at: new Date().toISOString(),
      },
    ])
    .select("id");
  if (error) {
    throw new Error(error.message);
  }
  return { job_id, estimated_completion };
}

/**
 * Calculates progress based on time elapsed and estimated completion time.
 * Provides more realistic progress feedback for long-running operations.
 *
 * @param createdAt - When the plan generation started
 * @param estimatedCompletion - When the generation is expected to complete
 * @returns Progress percentage (0-95, never reaches 100 until actually completed)
 */
function calculateTimeBasedProgress(createdAt: string, estimatedCompletion: string): number {
  const now = new Date();
  const start = new Date(createdAt);
  const estimated = new Date(estimatedCompletion);

  // If we're past estimated completion, show 95% (almost done)
  if (now >= estimated) {
    return 95;
  }

  const totalDuration = estimated.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  // Calculate progress as percentage of elapsed time vs total estimated time
  const progress = Math.min(95, Math.max(10, (elapsed / totalDuration) * 100));

  return Math.round(progress);
}

/**
 * Retrieves the status of plan generation based on jobId.
 * Returns status, progress, plan_id and error_message (if status=failed).
 * Progress calculation is now time-based for more realistic feedback.
 *
 * @param jobId - The unique job identifier for the plan generation
 * @returns Object containing generation status or { notFound: true } if plan doesn't exist
 *
 * Response structure:
 * - job_id: string - The job identifier
 * - status: "processing" | "completed" | "failed" - Current generation status
 * - progress: number - Progress percentage (0-100)
 * - plan_id: string | undefined - Plan ID (only when status="completed")
 * - error_message: string | undefined - Error details (only when status="failed")
 */
export async function getPlanGenerationStatus(jobId: string) {
  // Get plan by job_id from database with additional fields for progress calculation
  // This query uses the unique constraint on job_id for efficient lookup
  const { data: plan, error: planError } = await supabaseClient
    .from("plans")
    .select("id, status, created_at, job_id")
    .eq("job_id", jobId)
    .single();

  // Return notFound flag if plan doesn't exist or query failed
  if (planError || !plan) {
    return { notFound: true };
  }

  // Calculate progress based on generation status and time
  let progress = 0;
  if (plan.status === "completed") {
    progress = 100; // Generation finished successfully
  } else if (plan.status === "failed") {
    progress = 0; // Generation failed, no progress
  } else if (plan.status === "processing") {
    // Calculate time-based progress for processing status
    // Estimate completion time as 5 minutes from creation (matching createPlanInDb)
    const estimatedCompletion = new Date(new Date(plan.created_at).getTime() + 5 * 60 * 1000).toISOString();
    progress = calculateTimeBasedProgress(plan.created_at, estimatedCompletion);
  }

  // Get detailed error message if generation failed
  let error_message: string | undefined = undefined;
  if (plan.status === "failed") {
    // Query generation_errors table for the most recent error
    // Orders by created_at desc to get the latest error first
    const { data: errorRow } = await supabaseClient
      .from("generation_errors")
      .select("error_message")
      .eq("plan_id", plan.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Use actual error message from database or fallback to generic message
    if (errorRow && errorRow.error_message) {
      error_message = errorRow.error_message;
    } else {
      error_message = "Plan generation failed";
    }
  }

  // Return structured response matching GenerationStatusResponse type
  return {
    job_id: jobId,
    status: plan.status,
    progress,
    plan_id: plan.status === "completed" ? plan.id : undefined,
    error_message,
  };
}
