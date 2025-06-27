-- Migration: 20241220130000_add_job_tracking.sql
-- Description: Add job tracking columns to plans table
-- Author: AI Assistant
-- Date: 2024-12-20

-- Add job_id and status columns to plans table
ALTER TABLE public.plans 
ADD COLUMN job_id uuid,
ADD COLUMN status varchar(64) DEFAULT 'processing';

-- Add index for job_id for faster lookups
CREATE INDEX IF NOT EXISTS plans_job_id_idx ON public.plans(job_id);

-- Add comment for the new columns
COMMENT ON COLUMN public.plans.job_id IS 'unique identifier for the generation job';
COMMENT ON COLUMN public.plans.status IS 'current status of the plan (processing, completed, failed)'; 