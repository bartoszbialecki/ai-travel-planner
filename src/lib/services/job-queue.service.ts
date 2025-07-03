import { supabaseClient } from "../../db/supabase.client";
import { MockAIService } from "./ai/mock-ai.service";
import type { AIGenerationRequest, AITravelPlanResponse } from "./ai/types";

export interface JobStatus {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  plan_id?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export class JobQueueService {
  private static instance: JobQueueService;
  private jobs = new Map<string, JobStatus>();
  private aiService: MockAIService;
  private isProcessing = false;

  private constructor() {
    this.aiService = new MockAIService();
  }

  static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  async addJob(job_id: string): Promise<void> {
    const job: JobStatus = {
      job_id,
      status: "pending",
      progress: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.jobs.set(job_id, job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobs();
    }
  }

  async getJobStatus(job_id: string): Promise<JobStatus | null> {
    return this.jobs.get(job_id) || null;
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      for (const [job_id, job] of this.jobs) {
        if (job.status === "pending") {
          await this.processJob(job_id, job);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job_id: string, job: JobStatus): Promise<void> {
    try {
      // Update status to processing
      job.status = "processing";
      job.progress = 10;
      job.updated_at = new Date();
      this.jobs.set(job_id, job);

      // Get plan data from database
      const { data: planData, error: planError } = await supabaseClient
        .from("plans")
        .select("*")
        .eq("job_id", job_id)
        .single();

      if (planError || !planData) {
        throw new Error("Plan not found in database");
      }

      // Prepare AI request
      const aiRequest: AIGenerationRequest = {
        destination: planData.destination,
        start_date: planData.start_date,
        end_date: planData.end_date,
        adults_count: planData.adults_count,
        children_count: planData.children_count,
        budget_total: planData.budget_total,
        budget_currency: planData.budget_currency,
        travel_style: planData.travel_style,
      };

      // Update progress
      job.progress = 30;
      job.updated_at = new Date();
      this.jobs.set(job_id, job);

      // Generate plan using AI
      const aiResult = await this.aiService.generateTravelPlan(aiRequest);

      if (!aiResult.success || !aiResult.data) {
        throw new Error(aiResult.error || "AI generation failed");
      }

      // Update progress
      job.progress = 70;
      job.updated_at = new Date();
      this.jobs.set(job_id, job);

      // Save activities to database
      await this.saveActivitiesToDatabase(planData.id, aiResult.data);

      // Update plan status in database to completed
      await supabaseClient.from("plans").update({ status: "completed" }).eq("id", planData.id);

      // Update job status
      job.status = "completed";
      job.progress = 100;
      job.plan_id = planData.id;
      job.updated_at = new Date();
      this.jobs.set(job_id, job);
    } catch (error) {
      // Update job status to failed
      job.status = "failed";
      job.error_message = error instanceof Error ? error.message : "Unknown error";
      job.updated_at = new Date();
      this.jobs.set(job_id, job);

      // Update plan status in database to failed (if planData is available)
      try {
        // Try to get planData again in case of error before it was fetched
        const { data: planData } = await supabaseClient.from("plans").select("id").eq("job_id", job_id).single();
        if (planData) {
          await supabaseClient.from("plans").update({ status: "failed" }).eq("id", planData.id);
        }
      } catch {
        // Ignore errors here to avoid masking the original error
      }

      console.error(`Job ${job_id} failed:`, error);
    }
  }

  private async saveActivitiesToDatabase(planId: string, aiData: AITravelPlanResponse): Promise<void> {
    const activities = [];

    for (const day of aiData.days) {
      for (const activity of day.activities) {
        // First, create or get attraction
        const { data: attraction, error: attractionError } = await supabaseClient
          .from("attractions")
          .upsert(
            {
              name: activity.name,
              address: activity.address,
              description: activity.description,
            },
            { onConflict: "name,address" }
          )
          .select("id")
          .single();

        if (attractionError) {
          console.error("Error creating attraction:", attractionError);
          continue;
        }

        // Then create plan activity
        activities.push({
          plan_id: planId,
          attraction_id: attraction.id,
          day_number: day.day_number,
          activity_order: activity.activity_order,
          custom_desc: activity.description,
          opening_hours: activity.opening_hours,
          cost: activity.cost,
        });
      }
    }

    if (activities.length > 0) {
      const { error } = await supabaseClient.from("plan_activity").insert(activities);

      if (error) {
        console.error("Error saving activities:", error);
        throw new Error("Failed to save activities to database");
      }
    }
  }
}
