-- ================================================================
-- FIX: Make 'section' column nullable in archive_items
-- The 'section' column is a legacy field replaced by 'source_provider'
-- in the app-centric migration. The trigger no longer populates it,
-- so it must be nullable to avoid constraint violations.
-- ================================================================

ALTER TABLE public.archive_items ALTER COLUMN section DROP NOT NULL;

-- Backfill existing rows that have source_provider but no section
UPDATE public.archive_items 
SET section = source_provider 
WHERE section IS NULL AND source_provider IS NOT NULL;
