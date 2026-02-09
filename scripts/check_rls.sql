
select tablename, rowsecurity from pg_tables where tablename = 'activity_logs';
select * from pg_policies where table_name = 'activity_logs';

