-- Add 'trello' to the connection_provider enum
-- This is required for the Trello integration to save to the integrations table
ALTER TYPE connection_provider ADD VALUE IF NOT EXISTS 'trello';
