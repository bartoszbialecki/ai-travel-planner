-- Migration: 20241220170000_add_attraction_unique_constraint.sql
-- Description: Add unique constraint on attractions table for upsert operations
-- Author: AI Assistant
-- Date: 2024-12-20

-- Add unique constraint on name and address for attractions
-- This allows upsert operations to work properly
ALTER TABLE public.attractions 
ADD CONSTRAINT attractions_name_address_unique UNIQUE (name, address);

-- Add comment
COMMENT ON CONSTRAINT attractions_name_address_unique ON public.attractions IS 'ensures unique attractions by name and address for upsert operations'; 