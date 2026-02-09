
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // SQL to enable Realtime and allow public read access
    const sql = `
        -- 1. Enable Realtime for activity_logs
        alter publication supabase_realtime add table activity_logs;

        -- 2. Enable RLS on the table (good practice, even if we open it up)
        alter table activity_logs enable row level security;

        -- 3. Drop existing policy if any to avoid conflicts
        drop policy if exists "Enable read access for all users" on activity_logs;

        -- 4. Create policy to allow anyone (anon) to read activity logs
        -- (Since this is a dashboard app, we assume public read for now, 
        --  or strictly authenticated. For realtime to work easily without auth context, we use anon)
        create policy "Enable read access for all users"
        on activity_logs for select
        to anon, authenticated
        using (true);
    `;

    // We can't execute raw SQL directly via JS client usually unless we use an RPC function 
    // that executes SQL. Checking if one exists or using the 'rpc' method if 'exec_sql' is defined.
    // IF NOT: We will return the SQL for the user to run.

    // Attempt standard 'rpc' call if a common helper exists, otherwise we might be stuck 
    // without direct SQL access from here.
    // BUT! Next.js backend has direct access? No, only via Supabase Client.

    // Let's try to list policies to confirm connectivity first.

    return NextResponse.json({
        message: "SQL to execute in Supabase Dashboard -> SQL Editor:",
        sql: sql
    });
}
