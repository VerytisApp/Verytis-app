-- ================================================================
-- PHASE 14: ROBUST RLS MANAGEMENT
-- UNIFY AND EXPAND POLICIES TO ALLOW INSERT/UPDATE/DELETE
-- ================================================================

-- 1. TEAMS
DROP POLICY IF EXISTS "Org isolation for Teams" ON public.teams;
CREATE POLICY "Org isolation for Teams" ON public.teams
  FOR ALL TO authenticated USING (
    organization_id = public.get_my_org_id()
  ) WITH CHECK (
    organization_id = public.get_my_org_id()
  );

-- 2. TEAM MEMBERS
DROP POLICY IF EXISTS "Org isolation for Team Members" ON public.team_members;
CREATE POLICY "Org isolation for Team Members" ON public.team_members
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = public.team_members.team_id
      AND t.organization_id = public.get_my_org_id()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = public.team_members.team_id
      AND t.organization_id = public.get_my_org_id()
    )
  );

-- 3. INTEGRATIONS
DROP POLICY IF EXISTS "Org isolation for Integrations" ON public.integrations;
CREATE POLICY "Org isolation for Integrations" ON public.integrations
  FOR ALL TO authenticated USING (
    organization_id = public.get_my_org_id()
  ) WITH CHECK (
    organization_id = public.get_my_org_id()
  );

-- 4. MONITORED RESOURCES
DROP POLICY IF EXISTS "Org isolation for Resources" ON public.monitored_resources;
CREATE POLICY "Org isolation for Resources" ON public.monitored_resources
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = public.monitored_resources.integration_id
      AND i.organization_id = public.get_my_org_id()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.integrations i
      WHERE i.id = public.monitored_resources.integration_id
      AND i.organization_id = public.get_my_org_id()
    )
  );

-- 5. AI AGENTS
-- Remove legacy named policy to prevent conflicts
DROP POLICY IF EXISTS "Org isolation for AI Agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Org isolation for Agents" ON public.ai_agents;
CREATE POLICY "Org isolation for Agents" ON public.ai_agents
  FOR ALL TO authenticated USING (
    organization_id = public.get_my_org_id()
  ) WITH CHECK (
    organization_id = public.get_my_org_id()
  );

-- 6. ACTIVITY LOGS
-- Need INSERT for audit logging, SELECT for dashboard
DROP POLICY IF EXISTS "Org isolation for Logs" ON public.activity_logs;
CREATE POLICY "Org isolation for Logs" ON public.activity_logs
  FOR ALL TO authenticated USING (
    organization_id = public.get_my_org_id()
  ) WITH CHECK (
    organization_id = public.get_my_org_id()
  );

-- 7. PROFILES
-- Ensure users can update their own profile (avatar, job_title)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Maintain org visibility for members
DROP POLICY IF EXISTS "Org members can view each other" ON public.profiles;
CREATE POLICY "Org members can view each other" ON public.profiles
  FOR SELECT TO authenticated USING (
    organization_id = public.get_my_org_id()
  );
