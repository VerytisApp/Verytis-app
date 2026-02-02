import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createAdminClient()

        // Check 1: Can we connect?
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

        // Check 2: Can we query the DB? (Even if empty)
        // We query 'organizations' as it's a core table.
        const { count, error: dbError } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            status: 'ok',
            connection: {
                storage: bucketError ? 'error' : 'connected',
                database: dbError ? 'error' : 'connected',
            },
            details: {
                bucketCount: buckets?.length || 0,
                orgCount: count || 0,
                buckets: buckets?.map(b => b.name) // List buckets to verify our migration worked
            },
            errors: {
                storage: bucketError,
                db: dbError
            }
        })
    } catch (e) {
        return NextResponse.json({ status: 'error', message: e.message }, { status: 500 })
    }
}
