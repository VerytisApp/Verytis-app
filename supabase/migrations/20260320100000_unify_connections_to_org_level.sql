-- Unify connections to Workspace level
-- Ensuring only one connection exists per provider per organization

-- 1. Migration for 'user_connections' table
do $$
begin
    -- Change the unique constraint to organization_id + provider
    -- We first drop the old constraint if we can find its name, 
    -- but usually it's easier to create a new unique index or constraint.
    
    -- In Supabase/Postgres, onConflict relies on a unique index or unique constraint.
    
    -- 1. BACKFILL: Assign organization_id to legacy records (where NULL)
    update public.user_connections uc
    set organization_id = p.organization_id
    from public.profiles p
    where uc.user_id = p.id and uc.organization_id is null and p.organization_id is not null;

    -- 2. DE-DUPLICATION: Keep only the most recent connection per (org, provider)
    delete from public.user_connections uc
    where id not in (
        select id from (
            select distinct on (organization_id, provider) id
            from public.user_connections
            where organization_id is not null
            order by organization_id, provider, created_at desc
        ) latest
    )
    and organization_id is not null;

    -- 3. Create the unique index for Workspace-level uniqueness
    if not exists (
        select 1 from pg_indexes 
        where indexname = 'idx_user_connections_org_provider_unique'
    ) then
        create unique index idx_user_connections_org_provider_unique 
        on public.user_connections (organization_id, provider) 
        where organization_id is not null;
    end if;

    -- 4. Defaults & Constraints
    alter table public.user_connections 
    alter column connection_type set default 'team',
    alter column scope set default 'team';

end $$;
