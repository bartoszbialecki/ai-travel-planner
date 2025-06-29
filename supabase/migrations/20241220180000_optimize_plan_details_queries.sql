-- Migration: 20241220180000_optimize_plan_details_queries.sql
-- Description: Add indexes to optimize plan details queries for GET /api/plans/{id}
-- Author: AI Assistant
-- Date: 2024-12-20

-- =====================================================
-- OPTIMIZE PLAN DETAILS QUERIES
-- =====================================================

-- Composite index for plan_activity queries with plan_id and ordering
-- This optimizes the query: SELECT * FROM plan_activity WHERE plan_id = ? ORDER BY day_number, activity_order
create index if not exists plan_activity_plan_order_idx 
on public.plan_activity(plan_id, day_number, activity_order);

-- Index for plan lookup by id and user_id (for authorization check)
-- This optimizes the query: SELECT * FROM plans WHERE id = ? AND user_id = ?
create index if not exists plans_id_user_idx 
on public.plans(id, user_id);

-- Index for attractions lookup (already covered by primary key, but adding for completeness)
-- This ensures fast lookups when joining with attractions table
create index if not exists attractions_id_idx 
on public.attractions(id);

-- =====================================================
-- ADD COMMENTS
-- =====================================================

comment on index public.plan_activity_plan_order_idx is 'Optimizes queries for retrieving plan activities ordered by day and activity order';
comment on index public.plans_id_user_idx is 'Optimizes plan lookup with user authorization check';
comment on index public.attractions_id_idx is 'Ensures fast attraction lookups in plan details queries'; 