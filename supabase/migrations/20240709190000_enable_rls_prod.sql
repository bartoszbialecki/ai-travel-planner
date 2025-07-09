-- Migration: 20240709190000_enable_rls_prod.sql
-- Description: Re-enable RLS for production/secure environments
-- Author: AI Assistant
-- Date: 2024-07-09

-- Re-enable RLS on all relevant tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_errors ENABLE ROW LEVEL SECURITY;

-- Update comments to indicate RLS is enabled
COMMENT ON TABLE public.plans IS 'stores travel plans created by users - RLS ENABLED';
COMMENT ON TABLE public.plan_activity IS 'links plans to attractions with day and order information - RLS ENABLED';
COMMENT ON TABLE public.generation_errors IS 'logs errors that occur during plan generation - RLS ENABLED'; 