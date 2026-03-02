-- ==========================================
-- PHASE 7 : MONTHLY PARTITIONING & HARDENING (2026-2028 ONLY)
-- ==========================================

-- 0. Handle dependencies (Drop FK constraint temporarily to allow partition drop)
ALTER TABLE IF EXISTS public.decisions 
    DROP CONSTRAINT IF EXISTS decisions_activity_log_fkey;

-- 1. Cleanup old yearly partitions to avoid range conflicts
-- Note: We use DROP ... CASCADE to be absolutely sure, but explicit constraint drop above is safer for readability.
DROP TABLE IF EXISTS public.activity_logs_2024;
DROP TABLE IF EXISTS public.activity_logs_2025;
DROP TABLE IF EXISTS public.activity_logs_2026;
DROP TABLE IF EXISTS public.activity_logs_2027;
DROP TABLE IF EXISTS public.activity_logs_2028;
DROP TABLE IF EXISTS public.activity_logs_2029;

-- 2. Create partitions for 2026 (Monthly)
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_01 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_02 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_03 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_04 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_05 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_06 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_07 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_08 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_09 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_10 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_11 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2026_12 PARTITION OF public.activity_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- 3. Create partitions for 2027 (Monthly)
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_01 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_02 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_03 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_04 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_05 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_06 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_07 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-07-01') TO ('2027-08-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_08 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-08-01') TO ('2027-09-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_09 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-09-01') TO ('2027-10-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_10 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-10-01') TO ('2027-11-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_11 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-11-01') TO ('2027-12-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2027_12 PARTITION OF public.activity_logs FOR VALUES FROM ('2027-12-01') TO ('2028-01-01');

-- 4. Create partitions for 2028 (Monthly)
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_01 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-01-01') TO ('2028-02-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_02 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-02-01') TO ('2028-03-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_03 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-03-01') TO ('2028-04-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_04 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-04-01') TO ('2028-05-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_05 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-05-01') TO ('2028-06-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_06 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-06-01') TO ('2028-07-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_07 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-07-01') TO ('2028-08-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_08 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-08-01') TO ('2028-09-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_09 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-09-01') TO ('2028-10-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_10 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-10-01') TO ('2028-11-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_11 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-11-01') TO ('2028-12-01');
CREATE TABLE IF NOT EXISTS public.activity_logs_2028_12 PARTITION OF public.activity_logs FOR VALUES FROM ('2028-12-01') TO ('2029-01-01');

-- 5. RE-ESTABLISH RELATIONSHIPS
-- Re-create the foreign key on the main partitioned table
ALTER TABLE public.decisions 
ADD CONSTRAINT decisions_activity_log_fkey 
FOREIGN KEY (activity_log_id, activity_log_created_at) 
REFERENCES public.activity_logs(id, created_at)
ON DELETE SET NULL;

-- 6. HARDENING : Ensure all tables have mandatory organization_id
ALTER TABLE public.activity_logs ALTER COLUMN organization_id SET NOT NULL;

COMMENT ON TABLE public.activity_logs IS 'Audit trail table partitioned monthly. RLS enforced via JWT org_id claim.';
