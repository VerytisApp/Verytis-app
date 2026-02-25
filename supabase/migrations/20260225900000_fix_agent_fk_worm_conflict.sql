-- ================================================================
-- FIX: Change activity_logs.agent_id FK from ON DELETE SET NULL to NO ACTION
-- The WORM policy on activity_logs prevents any UPDATE (including FK cascades).
-- When an agent is deleted, the ON DELETE SET NULL tries to UPDATE agent_id = NULL
-- on all related activity_logs, which triggers the WORM exception.
-- Fix: Use NO ACTION — the agent_id becomes an orphan reference, which is correct
-- for an immutable audit trail (the log preserves the original agent_id as history).
-- ================================================================

-- Drop the existing FK constraint
ALTER TABLE public.activity_logs 
  DROP CONSTRAINT IF EXISTS activity_logs_agent_id_fkey;

-- Re-add without cascade (NO ACTION = don't touch activity_logs when agent is deleted)
ALTER TABLE public.activity_logs 
  ADD CONSTRAINT activity_logs_agent_id_fkey 
  FOREIGN KEY (agent_id) REFERENCES public.ai_agents(id) ON DELETE NO ACTION;

-- But wait — NO ACTION would BLOCK the agent deletion because the FK still references it.
-- For an audit trail, we actually want to ALLOW deletion while preserving the UUID reference.
-- Solution: Remove the FK entirely. The agent_id is kept as a historical reference only.
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_agent_id_fkey;
