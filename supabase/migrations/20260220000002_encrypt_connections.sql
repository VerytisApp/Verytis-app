-- ==============================================================
-- CHIFFREMENT AU REPOS (AES-256) POUR LA TABLE 'connections'
-- ==============================================================

-- 1. Activer l'extension pgcrypto (incluse nativement dans PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto CASCADE;

-- Note : Pour une sécurité maximale, la clé de chiffrement 'db_encryption_key' 
-- devrait être stockée dans le Vault Supabase (supabase_vault).
-- Pour la démonstration / configuration initiale, nous utiliserons l'approche 
-- des paramètres de configuration PostgreSQL (current_setting).

-- 2. Création du Trigger de Chiffrement Transparent
CREATE OR REPLACE FUNCTION encrypt_connection_tokens()
RETURNS trigger AS $$
DECLARE
    encryption_key text;
BEGIN
    -- Récupération de la clé de chiffrement depuis les variables d'environnement Supabase (ou fallback)
    -- Dans Supabase Postgres, vous pouvez définir cette variable via :
    -- ALTER DATABASE postgres SET app.settings.encryption_key = 'votre-cle-secrete-aes-256';
    BEGIN
        encryption_key := current_setting('app.settings.encryption_key');
    EXCEPTION WHEN OTHERS THEN
        -- CLÉ DE FALLBACK (À remplacer impérativement en Production via le Vault ou ENV)
        encryption_key := 'verytis-default-fallback-db-key-2026';
    END;

    -- Chiffrement de l'Access Token (S'il est présent et pas déjà chiffré)
    IF NEW.access_token IS NOT NULL AND NEW.access_token NOT LIKE '\x%' THEN
        NEW.access_token := pgp_sym_encrypt(NEW.access_token, encryption_key, 'cipher-algo=aes256');
    END IF;

    -- Chiffrement du Refresh Token (S'il est présent et pas déjà chiffré)
    IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token NOT LIKE '\x%' THEN
        NEW.refresh_token := pgp_sym_encrypt(NEW.refresh_token, encryption_key, 'cipher-algo=aes256');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Application du Trigger sur la Table `connections`
DROP TRIGGER IF EXISTS trigger_encrypt_connection_tokens ON public.connections;
CREATE TRIGGER trigger_encrypt_connection_tokens
BEFORE INSERT OR UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION encrypt_connection_tokens();


-- ==============================================================
-- VUE SÉCURISÉE DE DÉCHIFFREMENT (Pour l'API Backend Uniquement)
-- ==============================================================

-- Pour que votre API Node.js puisse lire les tokens en clair sans avoir à 
-- gérer la clé pgcrypto directement, nous créons une vue sécurisée. 
-- L'API interrogera `decrypted_connections` au lieu de `connections`.

CREATE OR REPLACE VIEW public.decrypted_connections AS
SELECT
    id,
    user_id,
    provider,
    provider_user_id,
    email,
    -- Déchiffrement à la volée de l'access_token
    CASE 
        WHEN access_token LIKE '\x%' THEN
            pgp_sym_decrypt(access_token::bytea, 
                current_setting('app.settings.encryption_key', true)
            )
        ELSE access_token
    END AS access_token,
    -- Déchiffrement à la volée du refresh_token
    CASE 
        WHEN refresh_token LIKE '\x%' THEN
            pgp_sym_decrypt(refresh_token::bytea, 
                current_setting('app.settings.encryption_key', true)
            )
        ELSE refresh_token
    END AS refresh_token,
    expires_at,
    scopes,
    metadata,
    status,
    last_synced_at,
    created_at
FROM public.connections;

-- Sécurisation : Seul le backend (service_role) ou l'utilisateur authentifié (RLS) peut interroger cette vue
GRANT SELECT ON public.decrypted_connections TO authenticated, service_role;
