-- Supabase schema for SwimSetter v1

-- Enable required extensions (if not already enabled)
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Profiles (onboarding)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- basic onboarding
  swim_level text not null check (swim_level in ('beginner', 'intermediate', 'advanced')),

  -- flexible preferences for future fields
  preferences jsonb not null default '{}'::jsonb
);

create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profiles_updated_at();

-- Plans (generated + accepted)
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- status lifecycle: 'generated' (visible only in-session), 'accepted', 'completed'
  status text not null default 'accepted' check (status in ('generated', 'accepted', 'completed')),

  -- what the user asked for (flexible for future inputs)
  request jsonb not null,

  -- the structured plan payload
  plan jsonb not null,

  -- for versioning/experiments
  generator_version text not null default 'v1'
);

-- Plan completions (completion + tags/ratings)
create table if not exists public.plan_completions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  completed_at timestamptz not null default now(),

  -- simple 1-5 rating
  rating int check (rating between 1 and 5),

  -- free-form tags like ['fun', 'tiring', 'kick','speed']
  tags text[] not null default array[]::text[],

  -- optional notes
  notes text
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.plan_completions enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Plans policies
create policy "plans_select_own" on public.plans
for select
using (auth.uid() = user_id);

create policy "plans_insert_own" on public.plans
for insert
with check (auth.uid() = user_id);

create policy "plans_update_own" on public.plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "plans_delete_own" on public.plans
for delete
using (auth.uid() = user_id);

-- Plan completions policies
create policy "plan_completions_select_own" on public.plan_completions
for select
using (auth.uid() = user_id);

create policy "plan_completions_insert_own" on public.plan_completions
for insert
with check (auth.uid() = user_id);

create policy "plan_completions_update_own" on public.plan_completions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "plan_completions_delete_own" on public.plan_completions
for delete
using (auth.uid() = user_id);

-- Indices
create index if not exists idx_profiles_id on public.profiles(id);

create index if not exists idx_plans_user_created_at
  on public.plans(user_id, created_at desc);

create index if not exists idx_plan_completions_user_completed_at
  on public.plan_completions(user_id, completed_at desc);

create index if not exists idx_plan_completions_tags_gin
  on public.plan_completions using gin (tags);

