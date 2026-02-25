-- ================================================================
-- FIX: Update WORM trigger for activity_logs to allow archive deletions
-- The archive system (fn_archive_on_delete) needs to DELETE activity_logs
-- to transfer them to archive_items. The WORM policy should only block
-- client-initiated UPDATEs but allow DELETEs (which are handled by the
-- archive trigger that captures the full record before removal).
-- ================================================================

-- Replace the WORM trigger function to only block UPDATEs
-- DELETEs are safe because the BEFORE DELETE archive trigger captures the record first
CREATE OR REPLACE FUNCTION enforce_activity_logs_worm()
RETURNS trigger AS $$
BEGIN
    -- Only block UPDATEs — DELETEs are permitted because they trigger archive capture
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'WORM Policy Violation: Cannot UPDATE an existing activity_log record. The audit trail is Append-Only.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (keep it on UPDATE OR DELETE for defensive posture,
-- but the function now only raises for UPDATE)
DROP TRIGGER IF EXISTS prevent_activity_log_modifications ON public.activity_logs;
CREATE TRIGGER prevent_activity_log_modifications
BEFORE UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION enforce_activity_logs_worm();
