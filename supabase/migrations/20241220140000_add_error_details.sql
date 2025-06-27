-- Migration: 20241220140000_add_error_details.sql
-- Description: Add error_details column to generation_errors table
-- Author: AI Assistant
-- Date: 2024-12-20

-- Add error_details column to generation_errors table
ALTER TABLE public.generation_errors 
ADD COLUMN error_details jsonb;

-- Add comment for the new column
COMMENT ON COLUMN public.generation_errors.error_details IS 'additional error details in JSON format'; 