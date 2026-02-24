-- ==========================================
-- PHASE 6 : ADVANCED MULTI-TENANCY
-- ==========================================

-- 1. ADD organization_id TO webhook_events
-- This allows strict isolation even for raw webhook events.
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 2. BACKFILL: Try to resolve existing organization IDs if possible
-- For Slack: Match via integrations and team_id in payload
UPDATE public.webhook_events w
SET organization_id = i.organization_id
FROM public.integrations i
WHERE w.provider = 'slack'
AND w.organization_id IS NULL
AND i.provider = 'slack'
AND i.external_id = (w.payload->>'team_id');

-- For GitHub: Match via integrations and installation_id in payload
UPDATE public.webhook_events w
SET organization_id = i.organization_id
FROM public.integrations i
WHERE w.provider = 'github'
AND w.organization_id IS NULL
AND i.provider = 'github'
AND i.settings->>'installation_id' = (w.payload->'installation'->>'id');

-- 3. INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_webhook_events_organization_id ON public.webhook_events(organization_id);

-- 4. RLS ENFORCEMENT
-- Ensure webhook events are also filtered by organization if accessed via API
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for webhooks" ON public.webhook_events;
CREATE POLICY "Org isolation for webhooks" ON public.webhook_events
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
