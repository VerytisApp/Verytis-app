-- Add last_check timestamp for trigger polling (cron worker)

alter table public.ai_agents
  add column if not exists last_check timestamp with time zone;

