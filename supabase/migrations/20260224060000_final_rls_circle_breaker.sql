-- ==========================================
-- FINAL : ROBUST RLS WITH CIRCLE BREAKER
-- ==========================================

-- 1. HELPER FUNCTION (SECURITY DEFINER)
-- This function bypasses RLS to get the user's org_id, breaking recursion.
CREATE OR REPLACE FUNCTION public.get_my_org_id() 
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. PROFILES : Core Visibility
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Org members can view each other" ON public.profiles;
CREATE POLICY "Org members can view each other" ON public.profiles
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );

-- 3. TEAMS : Global Org Visibility
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Teams" ON public.teams;
CREATE POLICY "Org isolation for Teams" ON public.teams
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );

-- 4. TEAM MEMBERS : Roster Visibility
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Team Members" ON public.team_members;
CREATE POLICY "Org isolation for Team Members" ON public.team_members
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = public.team_members.team_id
      AND t.organization_id = public.get_my_org_id()
    )
  );

-- 5. INTEGRATIONS & RESOURCES : Stacks Visibility
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Integrations" ON public.integrations;
CREATE POLICY "Org isolation for Integrations" ON public.integrations
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );

ALTER TABLE public.monitored_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Resources" ON public.monitored_resources;
CREATE POLICY "Org isolation for Resources" ON public.monitored_resources
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = public.monitored_resources.integration_id
      AND i.organization_id = public.get_my_org_id()
    )
  );

-- 6. ACTIVITY LOGS : Feed Visibility
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Logs" ON public.activity_logs;
CREATE POLICY "Org isolation for Logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );

-- 7. AI AGENTS : Agents Visibility
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Agents" ON public.ai_agents;
CREATE POLICY "Org isolation for Agents" ON public.ai_agents
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );

-- 8. CONNECTIONS : Passport Visibility
-- Allow users to see their own passport integration status (non-sensitive fields)
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 9. INTEGRATIONS : Org-wide Status Visibility
-- Allow org members to check if deep-links (Slack, GitHub) are active.
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org isolation for Integrations" ON public.integrations;
CREATE POLICY "Org isolation for Integrations" ON public.integrations
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );
