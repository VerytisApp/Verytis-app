-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('admin', 'manager', 'member');
create type user_status as enum ('active', 'pending', 'inactive');
create type connection_provider as enum ('slack', 'microsoft_teams', 'microsoft_outlook', 'google', 'email_metadata_only');
create type connection_status as enum ('connected', 'expired', 'revoked');
create type team_type as enum ('operational', 'governance');
create type team_role as enum ('lead', 'member');
create type resource_type as enum ('channel', 'repo', 'folder');
create type audit_level as enum ('full', 'metadata_only', 'actions_only');
create type decision_status as enum ('validated', 'flagged'); -- Lightweight: only for "Green Checks"

-- ORGANIZATIONS (Multi-tenancy)
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  domain text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  email text not null,
  full_name text,
  avatar_url text,
  job_title text,
  role user_role default 'member',
  status user_status default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONNECTIONS (The Member Passport)
create table public.connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider connection_provider not null,
  provider_user_id text not null,
  email text,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  scopes jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  status connection_status default 'connected',
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, provider)
);

-- USER PERMISSIONS (App Scopes)
create table public.user_permissions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  permission_key text not null,
  is_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, permission_key)
);

-- TEAMS
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  type team_type default 'operational',
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TEAM MEMBERS
create table public.team_members (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role team_role default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, user_id)
);

-- INTEGRATIONS (Tenant Config)
create table public.integrations (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  provider connection_provider not null,
  name text not null,
  external_id text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MONITORED RESOURCES (Channels, Repos)
create table public.monitored_resources (
  id uuid default uuid_generate_v4() primary key,
  integration_id uuid references public.integrations(id) on delete cascade not null,
  external_id text not null,
  name text not null,
  type resource_type not null,
  audit_level audit_level default 'metadata_only',
  last_active_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(integration_id, external_id)
);

-- ACTIVITY LOGS (The Report - all actions)
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  connection_id uuid references public.connections(id) on delete set null,
  action_type text not null,
  resource_id uuid references public.monitored_resources(id) on delete set null,
  summary text,
  metadata jsonb default '{}'::jsonb
);

-- [A] DECISIONS (Lightweight table for fast "Green Checks" lookups)
create table public.decisions (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  activity_log_id uuid references public.activity_logs(id) on delete set null, -- Link to source log
  title text not null,
  status decision_status default 'validated',
  actor_id uuid references public.profiles(id) on delete set null,
  resource_id uuid references public.monitored_resources(id) on delete set null,
  decided_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY TEAM REPORTS
create table public.daily_team_reports (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  date date not null,
  active_users integer default 0,
  decisions_made integer default 0,
  messages_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, date)
);

-- WEEKLY TEAM REPORTS
create table public.weekly_team_reports (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  week_start_date date not null,
  active_users integer default 0,
  decisions_made integer default 0,
  pending_reviews integer default 0,
  risk_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, week_start_date)
);

-- [B] EMAIL METADATA (with organization_id for RLS perf + [C] UNIQUE constraint)
create table public.email_metadata (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null, -- [B] Added for RLS
  connection_id uuid references public.connections(id) on delete cascade not null,
  message_id text not null,
  sender text not null,
  recipients jsonb default '[]'::jsonb,
  subject text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(connection_id, message_id) -- [C] Prevent duplicate webhook events
);

-- MONTHLY REPORTS (AI-generated)
create table public.monthly_reports (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete cascade,
  month date not null,
  title text not null,
  summary_text text,
  summary_html text,
  metrics jsonb default '{}'::jsonb,
  generated_by text default 'ai',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, team_id, month)
);

-- REPORT DELIVERIES (Track sent reports)
create table public.report_deliveries (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.monthly_reports(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  delivery_method text not null,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(report_id, recipient_id)
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.user_permissions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.integrations enable row level security;
alter table public.monitored_resources enable row level security;
alter table public.activity_logs enable row level security;
alter table public.decisions enable row level security;
alter table public.daily_team_reports enable row level security;
alter table public.weekly_team_reports enable row level security;
alter table public.email_metadata enable row level security;
alter table public.organizations enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.report_deliveries enable row level security;

-- SECURITY: RLS Policies (Multi-tenant)
create or replace function get_auth_org_id()
returns uuid language sql security definer as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$;

create policy "Org isolation for Teams" on public.teams
  using (organization_id = get_auth_org_id());

create policy "Org isolation for Logs" on public.activity_logs
  for select using (organization_id = get_auth_org_id());

create policy "Org isolation for Decisions" on public.decisions
  for select using (organization_id = get_auth_org_id());

create policy "Org isolation for Emails" on public.email_metadata -- [B] Fast RLS check
  for select using (organization_id = get_auth_org_id());

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Org isolation for Monthly Reports" on public.monthly_reports
  using (organization_id = get_auth_org_id());

create policy "Users can view own deliveries" on public.report_deliveries
  for select using (recipient_id = auth.uid());

-- PERFORMANCE: Indexes
create index idx_activity_logs_org_date on public.activity_logs(organization_id, created_at desc);
create index idx_activity_logs_actor on public.activity_logs(actor_id);
create index idx_activity_logs_resource on public.activity_logs(resource_id);
create index idx_decisions_org_status on public.decisions(organization_id, status); -- [A] Fast decision lookups
create index idx_email_metadata_org on public.email_metadata(organization_id); -- [B] RLS perf
create index idx_profiles_org on public.profiles(organization_id);
create index idx_connections_user on public.connections(user_id);
create index idx_monitored_external_id on public.monitored_resources(external_id);
create index idx_monthly_reports_org_month on public.monthly_reports(organization_id, month desc);
create index idx_report_deliveries_recipient on public.report_deliveries(recipient_id);

-- FUTURE-PROOF: GIN indexes for JSONB searches
create index idx_email_recipients_gin on public.email_metadata using gin (recipients);
create index idx_activity_metadata_gin on public.activity_logs using gin (metadata);
create index idx_connections_scopes_gin on public.connections using gin (scopes);

