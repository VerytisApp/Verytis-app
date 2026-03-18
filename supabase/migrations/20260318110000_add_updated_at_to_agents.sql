-- Migration: 20260318110000_add_updated_at_to_agents.sql
-- Ajoute la colonne updated_at à ai_agents avec un trigger automatique PostgreSQL.
-- updated_at est mis à jour UNIQUEMENT lors d'une véritable requête UPDATE (PUT/PATCH).
-- Le front-end utilisera ce champ pour afficher la date de dernière sauvegarde réelle.

-- 1. Ajouter la colonne updated_at (nullable au début pour ne pas bloquer les lignes existantes)
ALTER TABLE public.ai_agents
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone
        DEFAULT timezone('utc'::text, now());

-- 2. Initialiser updated_at sur toutes les lignes existantes avec la valeur created_at
UPDATE public.ai_agents
    SET updated_at = created_at
    WHERE updated_at IS NULL;

-- 3. Créer la fonction trigger générique (réutilisable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attacher le trigger à la table ai_agents
DROP TRIGGER IF EXISTS trigger_ai_agents_updated_at ON public.ai_agents;
CREATE TRIGGER trigger_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
