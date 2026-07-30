-- Supabase migration: projects table + Row-Level Security
-- Run this in the Supabase SQL editor when setting up a new project.

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  html text not null,
  css_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Row-Level Security: each user can only see / write their own rows
alter table projects enable row level security;

create policy "Users can view their own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id);
