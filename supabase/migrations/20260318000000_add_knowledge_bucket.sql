-- Migration: 20260318000000_add_knowledge_bucket.sql
-- Add 'agent_knowledge' storage bucket for the Contextual RAG Engine

-- 1. KNOWLEDGE BUCKET (Private - Org Restricted)
insert into storage.buckets (id, name, public)
values ('agent_knowledge', 'agent_knowledge', false)
on conflict (id) do nothing;

-- 2. READ Policy: Any user in the organization can read the documents
create policy "Knowledge Org Read"
  on storage.objects for select
  using (
    bucket_id = 'agent_knowledge'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- 3. INSERT Policy: Any user in the organization can upload documents
create policy "Knowledge Upload Member"
  on storage.objects for insert
  with check (
    bucket_id = 'agent_knowledge'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- 4. UPDATE Policy: Any user in the organization can update documents
create policy "Knowledge Update Member"
  on storage.objects for update
  using (
    bucket_id = 'agent_knowledge'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- 5. DELETE Policy: Only Admins and Managers can delete documents from the knowledge base
create policy "Knowledge Delete Admin Manager"
  on storage.objects for delete
  using (
    bucket_id = 'agent_knowledge'
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.profiles
      where id = auth.uid()
      and role in ('admin', 'manager')
    )
  );
