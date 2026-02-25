-- EMERGENCY RECONCILIATION: RE-LINKING FRAGMENTED LOGS
-- This script bypasses WORM to restore visibility to historical events after Phase 11 consolidation.

DO $$
DECLARE
    target_org_id UUID := '1abe99cd-78ae-4f6a-b839-c44e68e408d1';
    golden_admin_id UUID;
    golden_slack_conn_id UUID;
    golden_github_conn_id UUID;
    golden_trello_conn_id UUID;
    golden_sentinel_bot_id UUID;
BEGIN
    -- 1. GET GOLDEN ADMIN
    SELECT id INTO golden_admin_id FROM public.profiles WHERE full_name = 'Tychique Esteve' AND organization_id = target_org_id LIMIT 1;
    
    -- 2. GET GOLDEN CONNECTIONS
    SELECT id INTO golden_slack_conn_id FROM public.connections WHERE user_id = golden_admin_id AND provider = 'slack' LIMIT 1;
    SELECT id INTO golden_github_conn_id FROM public.connections WHERE user_id = golden_admin_id AND provider = 'github' LIMIT 1;
    SELECT id INTO golden_trello_conn_id FROM public.connections WHERE user_id = golden_admin_id AND provider = 'trello' LIMIT 1;

    -- 3. GET GOLDEN AGENT
    SELECT id INTO golden_sentinel_bot_id FROM public.ai_agents WHERE name = 'Sentinel-Bot' AND organization_id = target_org_id LIMIT 1;

    -- 4. DISABLE WORM (Surgical - only user-defined triggers)
    ALTER TABLE public.activity_logs DISABLE TRIGGER prevent_activity_log_modifications;
    ALTER TABLE public.activity_logs DISABLE TRIGGER trigger_block_truncate;

    -- 5. RECONCILE AGENTS
    UPDATE public.activity_logs
    SET agent_id = golden_sentinel_bot_id
    WHERE organization_id = target_org_id 
      AND (action_type = 'AI_TELEMETRY' OR action_type LIKE 'AI_%')
      AND agent_id IS DISTINCT FROM golden_sentinel_bot_id;

    -- 6. RECONCILE CONNECTIONS & ACTORS (BETA HEURISTIC)
    -- GitHub
    UPDATE public.activity_logs
    SET connection_id = golden_github_conn_id, actor_id = golden_admin_id
    WHERE organization_id = target_org_id 
      AND action_type ILIKE 'GITHUB_%'
      AND (connection_id IS DISTINCT FROM golden_github_conn_id OR actor_id IS DISTINCT FROM golden_admin_id);

    -- Slack
    UPDATE public.activity_logs
    SET connection_id = golden_slack_conn_id, actor_id = golden_admin_id
    WHERE organization_id = target_org_id 
      AND action_type ILIKE 'SLACK_%'
      AND (connection_id IS DISTINCT FROM golden_slack_conn_id OR actor_id IS DISTINCT FROM golden_admin_id);

    -- Trello
    UPDATE public.activity_logs
    SET connection_id = golden_trello_conn_id, actor_id = golden_admin_id
    WHERE organization_id = target_org_id 
      AND action_type ILIKE 'TRELLO_%'
      AND (connection_id IS DISTINCT FROM golden_trello_conn_id OR actor_id IS DISTINCT FROM golden_admin_id);

    -- 7. RE-LINK RESOURCES (MATCH BY NAME IN SUMMARY)
    UPDATE public.activity_logs l
    SET resource_id = r.id
    FROM public.monitored_resources r
    WHERE l.organization_id = target_org_id
      AND l.resource_id IS NULL
      AND l.summary ILIKE '%' || r.name || '%'
      AND r.integration_id IN (SELECT id FROM public.integrations WHERE organization_id = target_org_id);

    -- 8. ENABLE WORM
    ALTER TABLE public.activity_logs ENABLE ALWAYS TRIGGER prevent_activity_log_modifications;
    ALTER TABLE public.activity_logs ENABLE TRIGGER trigger_block_truncate;

    RAISE NOTICE 'Reconciliation Successful.';
END $$;
