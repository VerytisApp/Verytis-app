-- ==========================================
-- A. WORM POUR LE STOCKAGE FICHIERS (RAPPORTS)
-- ==========================================

-- 1. Création du bucket 'reports' (s'il n'existe pas déjà)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reports', 'reports', false, 10485760) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- 2. Sécurisation WORM via Row Level Security (RLS) sur la table storage.objects
-- Sur Supabase, la table storage.objects a DÉJÀ le RLS d'activé par défaut.
-- Nous n'avons pas besoin (ni les droits) d'Altérer la table ou d'y mettre des Triggers système.
-- Nous gérons le "Ajout Seul" (Append-Only) en créant uniquement des politiques INSERT et SELECT.

-- Politique : Autoriser uniquement l'insertion de nouveaux fichiers dans 'reports'
CREATE POLICY "Allow INSERT in reports bucket" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'reports');

-- Politique : Autoriser la lecture des fichiers pour les utilisateurs authentifiés
CREATE POLICY "Allow SELECT in reports bucket" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'reports');

-- (Les requêtes UPDATE et DELETE seront bloquées nativement par le RLS pour tout utilisateur 'authenticated' ou 'anon')

-- ==========================================
-- B. WORM POUR LA BASE DE DONNEES (ACTIVITY LOGS)
-- ==========================================

-- 1. Création de la fonction Trigger pour interdire toute modification
CREATE OR REPLACE FUNCTION enforce_activity_logs_worm()
RETURNS trigger AS $$
BEGIN
    -- On lève une exception SQL interdisant explicitement l'opération
    RAISE EXCEPTION 'WORM Policy Violation: Cannot % an existing activity_log record. The audit trail is Append-Only.', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- 2. Application du Trigger sur la table activity_logs (UPDATE et DELETE)
DROP TRIGGER IF EXISTS prevent_activity_log_modifications ON public.activity_logs;

CREATE TRIGGER prevent_activity_log_modifications
BEFORE UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION enforce_activity_logs_worm();

-- Rappel : Puisque activity_logs est désormais un partitionnement Range (selon la migration précédente),
-- le trigger s'appliquera sur la table mère et filtrera toutes les sous-tables.
