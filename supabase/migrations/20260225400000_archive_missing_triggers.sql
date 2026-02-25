-- ================================================================
-- PHASE 13C — FINAL ARCHIVE COVERAGE
-- Comprehensive triggers for Teams, Members, Resources, and Decisions
-- ================================================================

-- 1. ENHANCED GENERIC TRIGGER FUNCTION
-- Updated to look up organization_id from parent tables if missing
CREATE OR REPLACE FUNCTION fn_archive_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_section     TEXT;
    v_category    TEXT;
    v_data        JSONB;
    v_label       TEXT;
    v_org_id      UUID;
    v_original_id UUID;
    v_hash        TEXT;
    v_team_name   TEXT;
BEGIN
    v_section  := TG_ARGV[0];
    v_category := TG_ARGV[1];
    v_data     := row_to_json(OLD)::jsonb;
    v_original_id := (v_data ->> 'id')::uuid;
    v_org_id   := (v_data ->> 'organization_id')::uuid;

    -- SMART LOOKUP: If org_id is missing, find it from parent table
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

    -- EXTENDED LABELS
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
                     || ' removed from ' || COALESCE(v_team_name, 'Team');
        WHEN 'monitored_resources' THEN
            v_label := 'Resource: ' || COALESCE(v_data ->> 'name', 'Unknown')
                     || ' (' || COALESCE(v_data ->> 'type', '?') || ')';
        WHEN 'decisions' THEN
            v_label := 'Decision Voided: ' || COALESCE(v_data ->> 'title', 'Untitled')
                     || ' [Status: ' || COALESCE(v_data ->> 'status', '?') || ']';
        ELSE
            v_label := TG_TABLE_NAME || ': ' || COALESCE(v_data ->> 'name', v_data ->> 'id', 'Record');
    END CASE;

    v_hash := encode(digest(v_data::text, 'sha256'), 'hex');

    INSERT INTO public.archive_items (
        organization_id, section, category, original_table, original_id, label, data, content_hash, archived_at
    ) VALUES (
        v_org_id, v_section, v_category, TG_TABLE_NAME, v_original_id, v_label, v_data, v_hash, NOW()
    )
    ON CONFLICT (organization_id, original_table, original_id) DO NOTHING;

    RETURN OLD;
END;
$$;

-- 2. APPLY TRIGGERS TO AUDITED TABLES

-- A. Teams
DROP TRIGGER IF EXISTS trg_archive_teams ON public.teams;
CREATE TRIGGER trg_archive_teams
    BEFORE DELETE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('governance', 'deleted_teams');

-- B. Team Members
DROP TRIGGER IF EXISTS trg_archive_team_members ON public.team_members;
CREATE TRIGGER trg_archive_team_members
    BEFORE DELETE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('identity', 'removed_members');

-- C. Monitored Resources
DROP TRIGGER IF EXISTS trg_archive_resources ON public.monitored_resources;
CREATE TRIGGER trg_archive_resources
    BEFORE DELETE ON public.monitored_resources
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('system', 'unlinked_resources');

-- D. Decisions
DROP TRIGGER IF EXISTS trg_archive_decisions ON public.decisions;
CREATE TRIGGER trg_archive_decisions
    BEFORE DELETE ON public.decisions
    FOR EACH ROW EXECUTE FUNCTION fn_archive_on_delete('governance', 'void_decisions');
