-- ================================================================
-- PHASE 13B — ARCHIVE TRANSFER LOGIC
-- Schema optimizations + automatic archiving triggers
-- ================================================================

-- 0. Ensure pgcrypto is available (for SHA-256 hashing in triggers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- 1. SCHEMA ENHANCEMENTS
-- ================================================================

-- A. Content hash — tamper-proof integrity seal (SHA-256)
ALTER TABLE public.archive_items ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.archive_trash ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- B. Generated year column — fast temporal partitioning for 10+ years
ALTER TABLE public.archive_items 
  ADD COLUMN IF NOT EXISTS archive_year INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM archived_at AT TIME ZONE 'UTC')::int) STORED;

-- C. Performance index for year-based section browsing
CREATE INDEX IF NOT EXISTS idx_archive_year_section 
  ON public.archive_items(organization_id, archive_year, section);

-- ================================================================
-- 2. GENERIC TRIGGER FUNCTION
-- ================================================================
-- fn_archive_on_delete(section, category)
--
-- A single reusable BEFORE DELETE trigger function that:
--   1. Captures the full OLD record as JSONB
--   2. Generates a SHA-256 content hash
--   3. Inserts into archive_items with the right section/category
--   4. Builds a human-readable label from key fields
--   5. Returns OLD to let the DELETE proceed
-- ================================================================

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
BEGIN
    -- Read section and category from trigger arguments
    v_section  := TG_ARGV[0];
    v_category := TG_ARGV[1];

    -- Snapshot the entire row as JSONB
    v_data := row_to_json(OLD)::jsonb;

    -- Extract common fields
    v_original_id := (v_data ->> 'id')::uuid;

    -- Extract organization_id (all our tables have it)
    v_org_id := (v_data ->> 'organization_id')::uuid;

    -- If org_id is null, skip archiving (safety guard)
    IF v_org_id IS NULL THEN
        RETURN OLD;
    END IF;

    -- Build a human-readable label based on the source table
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
        ELSE
            v_label := TG_TABLE_NAME || ': ' || COALESCE(v_data ->> 'name', v_data ->> 'id', 'Record');
    END CASE;

    -- Generate SHA-256 content hash
    v_hash := encode(digest(v_data::text, 'sha256'), 'hex');

    -- Insert into archive_items (ON CONFLICT = skip if already archived)
    INSERT INTO public.archive_items (
        organization_id,
        section,
        category,
        original_table,
        original_id,
        label,
        data,
        content_hash,
        archived_at
    ) VALUES (
        v_org_id,
        v_section,
        v_category,
        TG_TABLE_NAME,
        v_original_id,
        v_label,
        v_data,
        v_hash,
        NOW()
    )
    ON CONFLICT (organization_id, original_table, original_id) DO NOTHING;

    -- Let the DELETE proceed
    RETURN OLD;
END;
$$;

-- ================================================================
-- 3. ATTACH TRIGGERS TO SOURCE TABLES
-- ================================================================

-- A. ai_agents → section: agents, category: deleted_agents
DROP TRIGGER IF EXISTS trg_archive_ai_agents ON public.ai_agents;
CREATE TRIGGER trg_archive_ai_agents
    BEFORE DELETE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION fn_archive_on_delete('agents', 'deleted_agents');

-- B. profiles → section: identity, category: deleted_profiles
DROP TRIGGER IF EXISTS trg_archive_profiles ON public.profiles;
CREATE TRIGGER trg_archive_profiles
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION fn_archive_on_delete('identity', 'deleted_profiles');

-- C. integrations → section: system, category: deleted_integrations
DROP TRIGGER IF EXISTS trg_archive_integrations ON public.integrations;
CREATE TRIGGER trg_archive_integrations
    BEFORE DELETE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION fn_archive_on_delete('system', 'deleted_integrations');

-- D. connections → section: identity, category: revoked_connections
DROP TRIGGER IF EXISTS trg_archive_connections ON public.connections;
CREATE TRIGGER trg_archive_connections
    BEFORE DELETE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION fn_archive_on_delete('identity', 'revoked_connections');

-- ================================================================
-- 4. HELPER: Backfill content_hash for existing archive_items
-- ================================================================
-- Run once to seal any items that were archived before this migration.
UPDATE public.archive_items
SET content_hash = encode(digest(data::text, 'sha256'), 'hex')
WHERE content_hash IS NULL;
