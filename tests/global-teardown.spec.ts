import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types.ts";

/**
 * Global teardown test that cleans up the Supabase database after all tests.
 * This test runs after all other tests complete and only deletes data for the E2E test user.
 *
 * Required environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon key
 * - E2E_USERNAME_ID: User ID for the E2E test user whose data should be cleaned up
 *   (you can find this in Supabase Auth dashboard or by querying auth.users table)
 */
test("Database cleanup", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const e2eUserId = process.env.E2E_USERNAME_ID;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("SUPABASE_URL or SUPABASE_KEY not set, skipping database cleanup");
    return;
  }

  if (!e2eUserId) {
    console.warn("E2E_USERNAME_ID not set, skipping database cleanup");
    console.warn("To find your user ID, check Supabase Auth dashboard or run:");
    console.warn("SELECT id FROM auth.users WHERE email = 'your-test-email@example.com';");
    return;
  }

  // Create client using anon key
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  if (!e2eUsername || !e2ePassword) {
    console.warn("E2E_USERNAME or E2E_PASSWORD not set, skipping database cleanup");
    return;
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: e2eUsername,
    password: e2ePassword,
  });

  if (signInError) {
    console.error("Error signing in:", signInError);
    throw signInError;
  }

  console.log(`Starting database cleanup for E2E user: ${e2eUserId}...`);

  try {
    // First, get all plan IDs for the E2E user
    const { data: userPlans, error: plansQueryError } = await supabase
      .from("plans")
      .select("id")
      .eq("user_id", e2eUserId);

    if (plansQueryError) {
      console.warn("Error querying user plans:", plansQueryError);
      return;
    }

    if (!userPlans || userPlans.length === 0) {
      console.log("No plans found for E2E user, cleanup complete");
      return;
    }

    const planIds = userPlans.map((plan) => plan.id);
    console.log(`Found ${planIds.length} plans to clean up for E2E user`);

    // Delete in order of dependencies to avoid foreign key constraints

    // 1. Delete generation_errors for user's plans
    const { error: errorsError } = await supabase.from("generation_errors").delete().in("plan_id", planIds);

    if (errorsError) {
      console.warn("Error cleaning generation_errors for E2E user:", errorsError);
    } else {
      console.log("✓ Cleaned generation_errors for E2E user");
    }

    // 2. Delete plan_activity for user's plans
    const { error: activitiesError } = await supabase.from("plan_activity").delete().in("plan_id", planIds);

    if (activitiesError) {
      console.warn("Error cleaning plan_activity for E2E user:", activitiesError);
    } else {
      console.log("✓ Cleaned plan_activity for E2E user");
    }

    // 3. Delete plans for E2E user
    const { error: plansError } = await supabase.from("plans").delete().eq("user_id", e2eUserId);

    if (plansError) {
      console.warn("Error cleaning plans for E2E user:", plansError);
    } else {
      console.log("✓ Cleaned plans for E2E user");
    }

    // Note: We don't delete attractions as they are shared resources
    // that might be used by other users or tests

    console.log("Database cleanup for E2E user completed successfully");
  } catch (error) {
    console.error("Failed to clean up database for E2E user:", error);
    // Don't throw error to avoid failing the entire test suite
  }
});
