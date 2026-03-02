-- Add VERYTIS_API_KEY column to store the global platform API key

ALTER TABLE public.organization_settings
ADD COLUMN verytis_api_key text;
