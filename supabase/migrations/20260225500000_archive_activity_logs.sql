-- ==============================================================
-- ADD ARCHIVE TRIGGER FOR ACTIVITY_LOGS (TIMELINE CONVERSATIONS)
-- ==============================================================

-- Ensure we can archive activity_logs even if they are partitioned.
-- The generic function fn_archive_on_delete() handles the data capture.

DROP TRIGGER IF EXISTS tr_archive_activity_log ON public.activity_logs;

CREATE TRIGGER tr_archive_activity_log
BEFORE DELETE ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION fn_archive_on_delete('timeline', 'deleted_activities');

-- Note: In partitioned tables, triggers must exist on each partition 
-- if they are not defined on the parent (PostgreSQL 11+ supports triggers on parent).
-- Since this is defined on the parent 'activity_logs', it will propagate.
