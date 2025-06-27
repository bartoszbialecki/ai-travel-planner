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
