-- ==============================================================
-- TABLE POUR LA CERTIFICATION DES RAPPORTS WORM (PAF)
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.report_exports (
    id uuid default uuid_generate_v4() primary key,
    file_hash text not null unique,
    file_url text not null,
    platform text,
    file_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour une recherche ultra rapide lors de la vérification du hash
CREATE INDEX idx_report_exports_hash ON public.report_exports(file_hash);

-- Active RLS
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Autorise n'importe qui à vérifier un rapport via l'API, mais limite l'insertion
CREATE POLICY "Allow public SELECT on report_exports" 
ON public.report_exports FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated INSERT on report_exports" 
ON public.report_exports FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- WORM (Ajout seul) pour la base de données : Interdire UPDATE et DELETE
CREATE OR REPLACE FUNCTION enforce_report_exports_worm()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'WORM Policy Violation: Cannot modify or delete export trace.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_report_exports_modifications ON public.report_exports;

CREATE TRIGGER prevent_report_exports_modifications
BEFORE UPDATE OR DELETE ON public.report_exports
FOR EACH ROW EXECUTE FUNCTION enforce_report_exports_worm();
