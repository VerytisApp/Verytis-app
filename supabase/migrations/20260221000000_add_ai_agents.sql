-- Migration: 20260221000000_add_ai_agents.sql
-- Add AI Agents Telemetry to the Database

-- 1. Create the AI Agents table
create table public.ai_agents (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  api_key_hash text unique not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Extend activity_logs cleanly
alter table public.activity_logs 
  add column agent_id uuid references public.ai_agents(id) on delete set null;

-- 3. Enable RLS on ai_agents
alter table public.ai_agents enable row level security;

-- 4. RLS Policy: strictly isolate visibility and modifications to the same organization
create policy "Org isolation for AI Agents" on public.ai_agents
  using (organization_id = get_auth_org_id());

-- 5. Add Index for API Lookup by hash
create index idx_ai_agents_api_key_hash on public.ai_agents(api_key_hash);
create index idx_ai_agents_org on public.ai_agents(organization_id);
create index idx_activity_logs_agent on public.activity_logs(agent_id);
