-- Migration: Global Organization Settings Table
-- Create a table specifically designed to hold a single row for global platform settings

CREATE TABLE IF NOT EXISTS public.organization_settings (
    id text PRIMARY KEY DEFAULT 'default',
    workspace_name text DEFAULT 'Verytis AI-Ops',
    display_language text DEFAULT 'English (US)',
    timezone text DEFAULT 'UTC',
    slack_webhook_url text,
    sms_alert_phone text,
    security_email text,
    routing_rules jsonb DEFAULT '[]'::jsonb,
    max_org_spend numeric DEFAULT 5000,
    default_max_per_agent numeric DEFAULT 200,
    banned_keywords text[] DEFAULT ARRAY[]::text[],
    blocked_actions text[] DEFAULT ARRAY[]::text[],
    providers jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Enforce single row
    CONSTRAINT ensure_single_row CHECK (id = 'default')
);

-- RLS Configuration
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and update these settings
CREATE POLICY "Admins can view org settings" ON public.organization_settings
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can update org settings" ON public.organization_settings
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Insert the default row if it doesn't exist
INSERT INTO public.organization_settings (id)
SELECT 'default'
WHERE NOT EXISTS (SELECT 1 FROM public.organization_settings WHERE id = 'default');

-- Trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at_org_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_org_settings();
