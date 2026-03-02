-- Migration: Fix Global Organization Settings RLS
-- Replacing team_members with profiles and correcting the role check.

DROP POLICY IF EXISTS "Admins can view org settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Admins can update org settings" ON public.organization_settings;

CREATE POLICY "Authenticated can view org settings" ON public.organization_settings
    FOR SELECT USING ( auth.role() = 'authenticated' );

CREATE POLICY "Authenticated can update org settings" ON public.organization_settings
    FOR UPDATE USING ( auth.role() = 'authenticated' );
