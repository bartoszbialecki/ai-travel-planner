-- Migration: 20241220150000_disable_rls_dev.sql
-- Description: Temporarily disable RLS for local development
-- Author: AI Assistant
-- Date: 2024-12-20
-- NOTE: This is for development only. Re-enable RLS before production.

-- Disable RLS on all tables for development
ALTER TABLE public.plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_errors DISABLE ROW LEVEL SECURITY;

-- Add comment to remind us to re-enable later
COMMENT ON TABLE public.plans IS 'stores travel plans created by users - RLS DISABLED FOR DEV';
COMMENT ON TABLE public.plan_activity IS 'links plans to attractions with day and order information - RLS DISABLED FOR DEV';
COMMENT ON TABLE public.generation_errors IS 'logs errors that occur during plan generation - RLS DISABLED FOR DEV'; 