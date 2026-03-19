-- Shopify + unified connections: add explicit scope and metadata support
-- Non-breaking: backfills from existing `connection_type` when present.

do $$
begin
  -- Ensure metadata exists (Shopify needs metadata.store_url)
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_connections'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'user_connections' and column_name = 'metadata'
    ) then
      execute 'alter table public.user_connections add column metadata jsonb default ''{}''::jsonb';
    end if;

    -- Add `scope` column (requested naming). Values mirror `connection_type`.
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'user_connections' and column_name = 'scope'
    ) then
      execute 'alter table public.user_connections add column scope text';
    end if;

    -- Backfill scope from connection_type (personal/team) when available
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'user_connections' and column_name = 'connection_type'
    ) then
      execute $q$
        update public.user_connections
        set scope = connection_type
        where scope is null and connection_type in ('personal','team')
      $q$;
    end if;

    -- Enforce allowed values (soft: only if no constraint exists)
    if not exists (
      select 1
      from pg_constraint
      where conname = 'user_connections_scope_check'
    ) then
      begin
        execute 'alter table public.user_connections add constraint user_connections_scope_check check (scope is null or scope in (''personal'',''team''))';
      exception when others then
        -- If table/permissions differ across envs, skip constraint gracefully.
      end;
    end if;

    -- Performance: metadata jsonb queries
    begin
      execute 'create index if not exists idx_user_connections_metadata_gin on public.user_connections using gin (metadata)';
    exception when others then
      -- Skip if permissions do not allow index creation in this environment.
    end;
  end if;
end $$;

