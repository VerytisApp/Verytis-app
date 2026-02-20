-- 1. Create Webhook Events Queue
create type webhook_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.webhook_events (
  id uuid default uuid_generate_v4() primary key,
  provider text not null,
  event_type text not null,
  payload jsonb not null,
  headers jsonb default '{}'::jsonb,
  status webhook_status default 'pending',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

create index idx_webhook_events_status on public.webhook_events(status, created_at);
create index idx_webhook_events_provider on public.webhook_events(provider);

alter table public.webhook_events enable row level security;
-- Webhooks are server-side only, no RLS policy needed (default deny all for anon/authenticated, accessed via service_role)

-- 2. Migrate activity_logs to Native PostgreSQL Partitioning (Range)
-- Since timescaledb is not activated, we'll use native partitioning.

-- A) Drop foreign keys tracking activity_logs
ALTER TABLE public.decisions DROP CONSTRAINT IF EXISTS decisions_activity_log_id_fkey;

-- B) Rename the existing table to migrate data securely
ALTER TABLE public.activity_logs RENAME TO activity_logs_old;

-- C) Create the new partitioned table (Primary Key must include the partition key)
CREATE TABLE public.activity_logs (
  id uuid default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  connection_id uuid references public.connections(id) on delete set null,
  action_type text not null,
  resource_id uuid references public.monitored_resources(id) on delete set null,
  summary text,
  metadata jsonb default '{}'::jsonb,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- D) Create initial partitions (Yearly for simplicity, you can use pg_partman for monthly auto-creation)
CREATE TABLE public.activity_logs_2024 PARTITION OF public.activity_logs FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE public.activity_logs_2025 PARTITION OF public.activity_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE public.activity_logs_2026 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE public.activity_logs_2027 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
CREATE TABLE public.activity_logs_2028 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
CREATE TABLE public.activity_logs_2029 PARTITION OF public.activity_logs FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');

-- Default partition for dates outside defined ranges
CREATE TABLE public.activity_logs_default PARTITION OF public.activity_logs DEFAULT;

-- E) Rename old indexes to avoid conflicts
ALTER INDEX IF EXISTS idx_activity_logs_org_date RENAME TO idx_activity_logs_org_date_old;
ALTER INDEX IF EXISTS idx_activity_logs_actor RENAME TO idx_activity_logs_actor_old;
ALTER INDEX IF EXISTS idx_activity_logs_resource RENAME TO idx_activity_logs_resource_old;
ALTER INDEX IF EXISTS idx_activity_logs_metadata RENAME TO idx_activity_logs_metadata_old;

-- Re-create essential Indexes and RLS on the new partitioned table
CREATE INDEX idx_activity_logs_org_date ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_actor ON public.activity_logs(actor_id);
CREATE INDEX idx_activity_logs_resource ON public.activity_logs(resource_id);
CREATE INDEX idx_activity_logs_metadata ON public.activity_logs USING GIN (metadata);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation for Logs" ON public.activity_logs FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

-- F) Migrate existing data from old table to partitioned table
INSERT INTO public.activity_logs (id, created_at, organization_id, actor_id, connection_id, action_type, resource_id, summary, metadata)
SELECT id, created_at, organization_id, actor_id, connection_id, action_type, resource_id, summary, metadata
FROM public.activity_logs_old;

-- G) Adapt Decisions table to hold composite Foreign Key
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS activity_log_created_at timestamp with time zone;

UPDATE public.decisions d
SET activity_log_created_at = a.created_at
FROM public.activity_logs_old a
WHERE d.activity_log_id = a.id;

-- H) Re-establish the foreign key using the composite PK (id, created_at)
ALTER TABLE public.decisions 
ADD CONSTRAINT decisions_activity_log_fkey 
FOREIGN KEY (activity_log_id, activity_log_created_at) 
REFERENCES public.activity_logs(id, created_at)
ON DELETE SET NULL;

-- I) Cleanup original table
DROP TABLE public.activity_logs_old;
