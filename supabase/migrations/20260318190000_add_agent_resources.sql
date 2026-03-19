-- Agent-scoped monitored resources (for trigger APP selection)

create extension if not exists "uuid-ossp";

create table if not exists public.agent_resources (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references public.ai_agents(id) on delete cascade not null,
  provider text not null, -- 'slack' | 'github' | 'trello'
  connection_type text not null, -- 'team' | 'personal'
  connection_id uuid, -- optional reference to user_connections (not enforced here)
  external_id text not null, -- channelId / boardId / repoFullName
  name text,
  resource_type text, -- 'channel' | 'board' | 'repo' | etc.
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(agent_id, provider, connection_type, external_id)
);

alter table public.agent_resources enable row level security;

-- Allow org members to manage resources for agents in their org
drop policy if exists "Org isolation for Agent Resources" on public.agent_resources;
create policy "Org isolation for Agent Resources" on public.agent_resources
  for all to authenticated using (
    exists (
      select 1 from public.ai_agents a
      where a.id = public.agent_resources.agent_id
      and a.organization_id = public.get_my_org_id()
    )
  ) with check (
    exists (
      select 1 from public.ai_agents a
      where a.id = public.agent_resources.agent_id
      and a.organization_id = public.get_my_org_id()
    )
  );

