-- ================================================================
-- PHASE 15: UNIFIED HISTORY BRIDGE
-- DE-NORMALIZING team_id TO activity_logs FOR PERSISTENT AUDIT
-- ================================================================

-- 1. Add team_id to activity_logs
-- We do NOT use a hard FK with ON DELETE SET NULL to ensure the ID persists 
-- even after the team record is removed from the 'teams' table.
-- This allows the Vault to bridge Snapshots to History.
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS team_id UUID;

-- 2. Add Index for fast cross-entity historical queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_team_id ON public.activity_logs(team_id);

-- 3. BACKFILL: Populate team_id from linked resources
-- This links historical logs to their parent teams.
UPDATE public.activity_logs l
SET team_id = r.team_id
FROM public.monitored_resources r
WHERE l.resource_id = r.id
AND l.team_id IS NULL
AND r.team_id IS NOT NULL;

-- 4. RLS Update: Ensure org members can query by team_id
-- (Existing policies already cover organization_id isolation)
