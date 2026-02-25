-- ================================================================
-- PHASE 13D — APP-CENTRIC ARCHIVE ORGANIZATION
-- Adding source_provider and context_label for contextual drill-down
-- ================================================================

-- 1. SCHEMA ENHANCEMENTS
ALTER TABLE public.archive_items ADD COLUMN IF NOT EXISTS source_provider TEXT;
ALTER TABLE public.archive_items ADD COLUMN IF NOT EXISTS context_label TEXT;

-- Index for app-centric drill-down browsing
-- This allows fast queries for "Slack > #general" or "GitHub > my-repo"
CREATE INDEX IF NOT EXISTS idx_archive_source_ctx 
  ON public.archive_items(organization_id, source_provider, context_label);

-- 2. UPDATED GENERIC TRIGGER FUNCTION
-- fn_archive_on_delete(source_provider, category, [context_field])
--
-- source_provider: 'slack', 'github', 'agent', 'identity', etc.
-- category: 'deleted_agents', 'revoked_connections', etc.
-- context_field: (Optional) The column name to use for context_label (e.g. 'name', 'email', 'title')
-- ================================================================

CREATE OR REPLACE FUNCTION fn_archive_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source_provider TEXT;
    v_category        TEXT;
    v_context_field   TEXT;
    v_context_label   TEXT;
    v_data            JSONB;
    v_label           TEXT;
    v_org_id          UUID;
    v_original_id     UUID;
    v_hash            TEXT;
    v_team_name       TEXT;
BEGIN
    -- Read arguments
    v_source_provider := TG_ARGV[0];
    v_category        := TG_ARGV[1];
    v_context_field   := TG_ARGV[2]; -- Optional field to extract context label

    -- Snapshot the entire row as JSONB
    v_data := row_to_json(OLD)::jsonb;
    v_original_id := (v_data ->> 'id')::uuid;
    v_org_id := (v_data ->> 'organization_id')::uuid;

    -- SMART LOOKUP: If org_id is missing, find it from parent table (fallback for relations)
    IF v_org_id IS NULL THEN
        CASE TG_TABLE_NAME
            WHEN 'team_members' THEN
                SELECT organization_id, name INTO v_org_id, v_team_name 
                FROM public.teams WHERE id = (v_data ->> 'team_id')::uuid;
            WHEN 'monitored_resources' THEN
                SELECT organization_id INTO v_org_id 
                FROM public.integrations WHERE id = (v_data ->> 'integration_id')::uuid;
            ELSE
                NULL;
        END CASE;
    END IF;

    -- Safety check: skip if we truly can't find an organization
    IF v_org_id IS NULL THEN
        RETURN OLD;
    END IF;

    -- Resolve context_label from data if field specified, else use provider
    IF v_context_field IS NOT NULL THEN
        v_context_label := v_data ->> v_context_field;
    END IF;
    
    -- Fallback for context_label if still null
    IF v_context_label IS NULL THEN
        CASE TG_TABLE_NAME
            WHEN 'team_members' THEN v_context_label := COALESCE(v_team_name, 'Unknown Team');
            WHEN 'activity_logs' THEN v_context_label := COALESCE(v_data ->> 'resource_id', 'Global');
            ELSE v_context_label := 'Global';
        END CASE;
    END IF;

    -- Resolve source_provider if dynamic (e.g. from integrations)
    IF v_source_provider = 'auto' THEN
        CASE TG_TABLE_NAME
            WHEN 'monitored_resources' THEN
                SELECT provider INTO v_source_provider FROM public.integrations WHERE id = (v_data ->> 'integration_id')::uuid;
            WHEN 'connections' THEN
                v_source_provider := v_data ->> 'provider';
            WHEN 'integrations' THEN
                v_source_provider := v_data ->> 'provider';
            ELSE
                v_source_provider := 'system';
        END CASE;
    END IF;

    -- EXTENDED LABELS (Human readable summary)
    CASE TG_TABLE_NAME
        WHEN 'ai_agents' THEN
            v_label := 'Agent: ' || COALESCE(v_data ->> 'name', 'Unknown');
        WHEN 'profiles' THEN
            v_label := 'Profile: ' || COALESCE(v_data ->> 'full_name', 'Unknown') 
                     || ' (' || COALESCE(v_data ->> 'email', '?') || ')';
        WHEN 'integrations' THEN
            v_label := 'Integration: ' || COALESCE(v_data ->> 'name', 'Unknown')
                     || ' (' || COALESCE(v_data ->> 'provider', '?') || ')';
        WHEN 'connections' THEN
            v_label := 'Connection: ' || COALESCE(v_data ->> 'provider', 'Unknown')
                     || ' (' || COALESCE(v_data ->> 'email', '?') || ')';
        WHEN 'teams' THEN
            v_label := 'Team: ' || COALESCE(v_data ->> 'name', 'Deleted Team');
        WHEN 'team_members' THEN
            v_label := 'Member Participation: ' || COALESCE(v_data ->> 'user_id', 'Unknown') 
                     || ' removed from ' || v_context_label;
        WHEN 'monitored_resources' THEN
            v_label := 'Resource: ' || COALESCE(v_data ->> 'name', 'Unknown')
                     || ' (' || COALESCE(v_data ->> 'type', '?') || ')';
        WHEN 'decisions' THEN
            v_label := 'Decision Voided: ' || COALESCE(v_data ->> 'title', 'Untitled');
        WHEN 'activity_logs' THEN
            v_label := 'Activity Log: ' || COALESCE(v_data ->> 'action_type', 'Log Entry');
        ELSE
            v_label := TG_TABLE_NAME || ': ' || COALESCE(v_data ->> 'name', v_data ->> 'id', 'Record');
    END CASE;

    -- Generate integrity hash
    v_hash := encode(digest(v_data::text, 'sha256'), 'hex');

    -- Insert into archive_items
    INSERT INTO public.archive_items (
        organization_id,
        source_provider,
        context_label,
        category,
        original_table,
        original_id,
        label,
        data,
        content_hash,
        archived_at
    ) VALUES (
        v_org_id,
        COALESCE(v_source_provider, 'system'),
        v_context_label,
        v_category,
        TG_TABLE_NAME,
        v_original_id,
        v_label,
        v_data,
        v_hash,
        NOW()
    )
    ON CONFLICT (organization_id, original_table, original_id) DO NOTHING;

    RETURN OLD;
END;
$$;

-- 3. RE-ATTACH UPDATED TRIGGERS
-- Using the new argument signature: (source_provider, category, context_field)

-- A. ai_agents
DROP TRIGGER IF EXISTS trg_archive_ai_agents ON public.ai_agents;
CREATE TRIGGER trg_archive_ai_agents BEFORE DELETE ON public.ai_agents
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('agent', 'deleted_agents', 'name');

-- B. profiles
DROP TRIGGER IF EXISTS trg_archive_profiles ON public.profiles;
CREATE TRIGGER trg_archive_profiles BEFORE DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('identity', 'deleted_profiles', 'email');

-- C. integrations
DROP TRIGGER IF EXISTS trg_archive_integrations ON public.integrations;
CREATE TRIGGER trg_archive_integrations BEFORE DELETE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('auto', 'deleted_integrations', 'name');

-- D. connections
DROP TRIGGER IF EXISTS trg_archive_connections ON public.connections;
CREATE TRIGGER trg_archive_connections BEFORE DELETE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('auto', 'revoked_connections', 'email');

-- E. teams
DROP TRIGGER IF EXISTS trg_archive_teams ON public.teams;
CREATE TRIGGER trg_archive_teams BEFORE DELETE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('governance', 'deleted_teams', 'name');

-- F. team_members
DROP TRIGGER IF EXISTS trg_archive_team_members ON public.team_members;
CREATE TRIGGER trg_archive_team_members BEFORE DELETE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('identity', 'removed_members');

-- G. monitored_resources
DROP TRIGGER IF EXISTS trg_archive_resources ON public.monitored_resources;
CREATE TRIGGER trg_archive_resources BEFORE DELETE ON public.monitored_resources
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('auto', 'unlinked_resources', 'name');

-- H. decisions
DROP TRIGGER IF EXISTS trg_archive_decisions ON public.decisions;
CREATE TRIGGER trg_archive_decisions BEFORE DELETE ON public.decisions
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('governance', 'void_decisions', 'title');

-- I. activity_logs
DROP TRIGGER IF EXISTS tr_archive_activity_log ON public.activity_logs;
CREATE TRIGGER tr_archive_activity_log BEFORE DELETE ON public.activity_logs
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('auto', 'deleted_activities');
