-- Enable Storage extension (if not already enabled)
-- Note: 'storage' schema usually exists by default in Supabase

-- 1. AVATARS BUCKET (Public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar Public Read"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Avatar Upload Own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[2] -- {org}/{user_id}/file
  );

create policy "Avatar Update Own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- [A] Added Delete Policy
create policy "Avatar Delete Own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- 2. EMAILS BUCKET (Private - Org Restricted)
insert into storage.buckets (id, name, public)
values ('emails', 'emails', false)
on conflict (id) do nothing;

create policy "Emails Org Read"
  on storage.objects for select
  using (
    bucket_id = 'emails'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Service Role (Admin Client) bypasses RLS for uploads.
-- Users cannot upload emails manually.

-- 3. REPORTS BUCKET (Private - Org Restricted)
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

create policy "Reports Org Read"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- [C] Refined Policy: Only Admins/Managers can upload reports manually
create policy "Reports Upload Admin Manager"
  on storage.objects for insert
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- 4. EXPORTS BUCKET (Private - User Restricted)
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

create policy "Exports Own Read"
  on storage.objects for select
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[3] = auth.uid()::text -- {org}/csv/{user_id}/file
  );

-- [B] Added Delete Policy
create policy "Exports Delete Own"
  on storage.objects for delete
  using (
    bucket_id = 'exports'
    and (storage.foldername(name))[3] = auth.uid()::text
  );

-- 5. ASSETS BUCKET (Public - Branding & UI Customization)
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

create policy "Assets Public Read"
  on storage.objects for select
  using ( bucket_id = 'assets' );

create policy "Assets Upload Admin Manager"
  on storage.objects for insert
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

create policy "Assets Update Admin Manager"
  on storage.objects for update
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

create policy "Assets Delete Admin Manager"
  on storage.objects for delete
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );

-- 6. PROOFS BUCKET (Private - Evidence Attachments)
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "Proofs Org Read"
  on storage.objects for select
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

create policy "Proofs Upload Member"
  on storage.objects for insert
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

