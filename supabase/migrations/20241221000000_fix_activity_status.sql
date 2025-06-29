-- Migration: 20241221000000_fix_activity_status.sql
-- Description: Fix activity status to distinguish between unprocessed, accepted, and rejected activities
-- Author: AI Assistant
-- Date: 2024-12-21

-- =====================================================
-- FIX ACTIVITY STATUS
-- =====================================================

-- First, drop the NOT NULL constraint to allow NULL values
ALTER TABLE public.plan_activity 
ALTER COLUMN accepted DROP NOT NULL;

-- Change the default value of accepted column from true to null
-- This allows us to distinguish between:
-- null = no decision made yet (default)
-- true = explicitly accepted by user
-- false = explicitly rejected by user
ALTER TABLE public.plan_activity 
ALTER COLUMN accepted DROP DEFAULT;

ALTER TABLE public.plan_activity 
ALTER COLUMN accepted SET DEFAULT NULL;

-- Update existing records that have accepted = false but were never explicitly rejected
-- Set them to null to indicate no decision was made
UPDATE public.plan_activity 
SET accepted = NULL 
WHERE accepted = false;

-- Update the comment to be more accurate
COMMENT ON COLUMN public.plan_activity.accepted IS 'activity status: null = no decision, true = accepted by user, false = rejected by user'; 