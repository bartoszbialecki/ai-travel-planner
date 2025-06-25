-- Migration: 20241220120100_fix_rls_performance.sql
-- Description: Fix RLS performance warnings by using subqueries for auth.uid()
-- Author: AI Assistant
-- Date: 2024-12-20

-- =====================================================
-- DROP EXISTING POLICIES
-- =====================================================

-- drop existing plans policies
drop policy if exists "users_can_select_own_plans" on public.plans;
drop policy if exists "users_can_insert_own_plans" on public.plans;
drop policy if exists "users_can_update_own_plans" on public.plans;
drop policy if exists "users_can_delete_own_plans" on public.plans;

-- drop existing plan_activity policies
drop policy if exists "users_can_select_own_plan_activities" on public.plan_activity;
drop policy if exists "users_can_insert_own_plan_activities" on public.plan_activity;
drop policy if exists "users_can_update_own_plan_activities" on public.plan_activity;
drop policy if exists "users_can_delete_own_plan_activities" on public.plan_activity;

-- drop existing generation_errors policies
drop policy if exists "users_can_select_own_generation_errors" on public.generation_errors;
drop policy if exists "users_can_insert_own_generation_errors" on public.generation_errors;
drop policy if exists "users_can_update_own_generation_errors" on public.generation_errors;
drop policy if exists "users_can_delete_own_generation_errors" on public.generation_errors;

-- =====================================================
-- CREATE OPTIMIZED RLS POLICIES
-- =====================================================

-- plans table policies with optimized auth.uid() calls
-- policy for authenticated users to select their own plans
create policy "users_can_select_own_plans" on public.plans
    for select
    to authenticated
    using (user_id = (select auth.uid()));

-- policy for authenticated users to insert their own plans
create policy "users_can_insert_own_plans" on public.plans
    for insert
    to authenticated
    with check (user_id = (select auth.uid()));

-- policy for authenticated users to update their own plans
create policy "users_can_update_own_plans" on public.plans
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

-- policy for authenticated users to delete their own plans
create policy "users_can_delete_own_plans" on public.plans
    for delete
    to authenticated
    using (user_id = (select auth.uid()));

-- plan_activity table policies with optimized auth.uid() calls
-- policy for authenticated users to select activities for their own plans
create policy "users_can_select_own_plan_activities" on public.plan_activity
    for select
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to insert activities for their own plans
create policy "users_can_insert_own_plan_activities" on public.plan_activity
    for insert
    to authenticated
    with check (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to update activities for their own plans
create policy "users_can_update_own_plan_activities" on public.plan_activity
    for update
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid())))
    with check (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to delete activities for their own plans
create policy "users_can_delete_own_plan_activities" on public.plan_activity
    for delete
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- generation_errors table policies with optimized auth.uid() calls
-- policy for authenticated users to select errors for their own plans
create policy "users_can_select_own_generation_errors" on public.generation_errors
    for select
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to insert errors for their own plans
create policy "users_can_insert_own_generation_errors" on public.generation_errors
    for insert
    to authenticated
    with check (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to update errors for their own plans
create policy "users_can_update_own_generation_errors" on public.generation_errors
    for update
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid())))
    with check (plan_id in (select id from public.plans where user_id = (select auth.uid())));

-- policy for authenticated users to delete errors for their own plans
create policy "users_can_delete_own_generation_errors" on public.generation_errors
    for delete
    to authenticated
    using (plan_id in (select id from public.plans where user_id = (select auth.uid()))); 