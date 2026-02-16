DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_provider') THEN
        -- Create if not exists (fallback)
        CREATE TYPE connection_provider AS ENUM ('slack', 'github');
    ELSE
        -- Add value if not exists
        ALTER TYPE connection_provider ADD VALUE IF NOT EXISTS 'github';
    END IF;
END $$;
