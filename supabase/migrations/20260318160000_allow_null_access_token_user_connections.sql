-- Allow GitHub App installations to be stored without OAuth tokens.
-- In the "team + installation_id" flow we intentionally persist only installation metadata
-- and generate installation access tokens on the fly.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_connections'
      and column_name = 'access_token'
  ) then
    execute 'alter table public.user_connections alter column access_token drop not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_connections'
      and column_name = 'refresh_token'
  ) then
    execute 'alter table public.user_connections alter column refresh_token drop not null';
  end if;
end $$;

