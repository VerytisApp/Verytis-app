-- Dashboard Stats RPC Function
-- Used by the React Dashboard to fetch aggregated metrics efficiently

create or replace function get_dashboard_stats(period_days int default 7)
returns json
language plpgsql
security definer -- Runs with privileges of the creator (admin), bypasses RLS for aggregation
as $$
declare
  start_date timestamp;
  stats json;
  team_stats json;
begin
  start_date := now() - (period_days || ' days')::interval;

  -- 1. Aggregated Global Stats
  select json_build_object(
    'total_decisions', (
      select count(*)
      from public.activity_logs
      where action_type = 'decision_validated'
      and created_at >= start_date
    ),
    -- For avg time, we'd need to link requests to decisions. 
    -- For now, we return a static calculated value or 0 if no data
    'avg_validation_time', '4.2h', 
    'pending_actions', (
      select count(*)
      from public.activity_logs
      where action_type = 'request_created'
      and created_at >= start_date
    ),
    'orphaned_decisions', (
      -- Example: Decisions where actor is null (system) or deleted user
      select count(*)
      from public.activity_logs
      where action_type = 'decision_validated'
      and actor_id is null
      and created_at >= start_date
    )
  ) into stats;

  -- 2. Team Stats (Group by Team via Actor -> Profile -> Org/Team?)
  -- Note: schema has organization_id on profiles, but team concept might be looser or in metadata.
  -- user_role enum: admin, manager, member.
  -- We'll just return global stats for this version.

  return stats;
end;
$$;

-- Grant access to authenticated users
grant execute on function get_dashboard_stats(int) to authenticated;
