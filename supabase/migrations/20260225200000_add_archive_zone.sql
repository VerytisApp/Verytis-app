-- ================================================================
-- PHASE 13 — ARCHIVE ZONE: Coffre-fort de données immutable
-- ================================================================

-- 1. Main archive storage table
CREATE TABLE IF NOT EXISTS public.archive_items (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    section         TEXT NOT NULL,           -- 'identity', 'agents', 'governance', 'finance', 'system'
    category        TEXT NOT NULL,           -- 'profiles', 'connections', 'executions', 'audit-trail', etc.
    original_table  TEXT NOT NULL,           -- source table name (e.g. 'activity_logs', 'ai_agents')
    original_id     UUID NOT NULL,           -- ID from the source table
    label           TEXT NOT NULL,           -- human-readable label
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,  -- full snapshot of the archived record
    archived_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    retention_until TIMESTAMPTZ,             -- when this can be trashed (NULL = forever)
    UNIQUE(organization_id, original_table, original_id)
);

-- 2. Trash bin (30-day soft delete before permanent purge)
CREATE TABLE IF NOT EXISTS public.archive_trash (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    archive_item_id UUID,                    -- reference to original archive_items.id (nullable after purge)
    section         TEXT NOT NULL,
    category        TEXT NOT NULL,
    label           TEXT NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}'::jsonb,
    deleted_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purge_at        TIMESTAMPTZ NOT NULL,    -- deleted_at + 30 days
    restored        BOOLEAN DEFAULT FALSE
);

-- 3. Enable RLS
ALTER TABLE public.archive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_trash ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — Org isolation
CREATE POLICY "Org isolation for archive_items"
    ON public.archive_items
    USING (organization_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));

CREATE POLICY "Org isolation for archive_trash"
    ON public.archive_trash
    USING (organization_id = (SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid));

-- Fallback for service_role (no JWT)
CREATE POLICY "Service role full access archive_items"
    ON public.archive_items
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access archive_trash"
    ON public.archive_trash
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Performance indexes
CREATE INDEX idx_archive_items_org_section ON public.archive_items(organization_id, section, category, archived_at DESC);
CREATE INDEX idx_archive_items_original ON public.archive_items(original_table, original_id);
CREATE INDEX idx_archive_items_data ON public.archive_items USING gin (data);

CREATE INDEX idx_archive_trash_org ON public.archive_trash(organization_id, deleted_at DESC);
CREATE INDEX idx_archive_trash_purge ON public.archive_trash(purge_at) WHERE NOT restored;
