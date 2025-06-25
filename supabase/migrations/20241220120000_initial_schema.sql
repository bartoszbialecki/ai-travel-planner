-- Migration: 20241220120000_initial_schema.sql
-- Description: Initial database schema for AI Travel Planner
-- Tables: plans, attractions, plan_activity, generation_errors
-- Author: AI Assistant
-- Date: 2024-12-20

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- plans table - stores travel plans created by users
create table public.plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null,
    destination varchar(255) not null,
    start_date date not null,
    end_date date not null,
    adults_count integer not null check (adults_count >= 1),
    children_count integer not null check (children_count >= 0),
    budget_total integer,
    budget_currency varchar(16),
    travel_style varchar(64),
    created_at timestamptz not null default now()
);

-- attractions table - stores available attractions/points of interest
create table public.attractions (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    address varchar(255) not null,
    description varchar(1000) not null,
    created_at timestamptz not null default now()
);

-- plan_activity table - links plans to attractions with day and order information
create table public.plan_activity (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    attraction_id uuid not null references public.attractions(id),
    day_number integer not null check (day_number >= 1 and day_number <= 30),
    activity_order integer not null,
    accepted boolean not null default true,
    custom_desc varchar(1000),
    opening_hours varchar(255),
    cost integer,
    created_at timestamptz not null default now()
);

-- generation_errors table - logs errors that occur during plan generation
create table public.generation_errors (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    error_message text not null,
    created_at timestamptz not null default now()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- plans table indexes
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists plans_created_at_idx on public.plans(created_at);

-- plan_activity table indexes
create index if not exists plan_activity_plan_day_idx on public.plan_activity(plan_id, day_number);
create index if not exists plan_activity_attraction_idx on public.plan_activity(attraction_id);
create index if not exists plan_activity_created_at_idx on public.plan_activity(created_at);

-- generation_errors table indexes
create index if not exists generation_errors_plan_id_idx on public.generation_errors(plan_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- enable rls on all tables that need access control
alter table public.plans enable row level security;
alter table public.plan_activity enable row level security;
alter table public.generation_errors enable row level security;

-- attractions table is public (no rls needed)
-- users table is managed by Supabase Auth (no rls needed)

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- plans table policies
-- policy for authenticated users to select their own plans
create policy "users_can_select_own_plans" on public.plans
    for select
    to authenticated
    using (user_id = auth.uid());

-- policy for authenticated users to insert their own plans
create policy "users_can_insert_own_plans" on public.plans
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- policy for authenticated users to update their own plans
create policy "users_can_update_own_plans" on public.plans
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- policy for authenticated users to delete their own plans
create policy "users_can_delete_own_plans" on public.plans
    for delete
    to authenticated
    using (user_id = auth.uid());

-- plan_activity table policies
-- policy for authenticated users to select activities for their own plans
create policy "users_can_select_own_plan_activities" on public.plan_activity
    for select
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to insert activities for their own plans
create policy "users_can_insert_own_plan_activities" on public.plan_activity
    for insert
    to authenticated
    with check (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to update activities for their own plans
create policy "users_can_update_own_plan_activities" on public.plan_activity
    for update
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()))
    with check (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to delete activities for their own plans
create policy "users_can_delete_own_plan_activities" on public.plan_activity
    for delete
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()));

-- generation_errors table policies
-- policy for authenticated users to select errors for their own plans
create policy "users_can_select_own_generation_errors" on public.generation_errors
    for select
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to insert errors for their own plans
create policy "users_can_insert_own_generation_errors" on public.generation_errors
    for insert
    to authenticated
    with check (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to update errors for their own plans
create policy "users_can_update_own_generation_errors" on public.generation_errors
    for update
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()))
    with check (plan_id in (select id from public.plans where user_id = auth.uid()));

-- policy for authenticated users to delete errors for their own plans
create policy "users_can_delete_own_generation_errors" on public.generation_errors
    for delete
    to authenticated
    using (plan_id in (select id from public.plans where user_id = auth.uid()));

-- =====================================================
-- ADD COMMENTS
-- =====================================================

comment on table public.plans is 'stores travel plans created by users';
comment on table public.attractions is 'stores available attractions/points of interest';
comment on table public.plan_activity is 'links plans to attractions with day and order information';
comment on table public.generation_errors is 'logs errors that occur during plan generation';

comment on column public.plans.user_id is 'references the user who created this plan (from auth.users)';
comment on column public.plans.adults_count is 'number of adults (minimum 1)';
comment on column public.plans.children_count is 'number of children (minimum 0)';
comment on column public.plans.budget_total is 'total budget amount in the specified currency';
comment on column public.plans.budget_currency is 'currency code for the budget (e.g., USD, EUR)';
comment on column public.plans.travel_style is 'preferred travel style (e.g., luxury, budget, adventure)';

comment on column public.plan_activity.plan_id is 'references the plan this activity belongs to';
comment on column public.plan_activity.attraction_id is 'references the attraction for this activity';
comment on column public.plan_activity.day_number is 'day of the trip (1-30)';
comment on column public.plan_activity.activity_order is 'order of this activity within the day';
comment on column public.plan_activity.accepted is 'whether the user has accepted this activity';
comment on column public.plan_activity.custom_desc is 'custom description for this activity';
comment on column public.plan_activity.opening_hours is 'opening hours for this attraction';
comment on column public.plan_activity.cost is 'cost of this activity';

comment on column public.generation_errors.plan_id is 'references the plan that had an error during generation';
comment on column public.generation_errors.error_message is 'detailed error message from the generation process'; 