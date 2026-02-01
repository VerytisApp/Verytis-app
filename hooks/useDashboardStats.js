import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useDashboardStats(periodDays = 7) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                // 1. Fetch Aggregated Stats via RPC
                const { data, error } = await supabase
                    .rpc('get_dashboard_stats', { period_days: periodDays });

                if (error) {
                    // Fallback to mock data on error (dev mode or missing permissions)
                    console.error('Error fetching dashboard stats:', error);
                    // throw error; // Uncomment to fail hard

                    // Temporary Fallback while waiting for migration to be applied
                    setStats({
                        total_decisions: 0,
                        avg_validation_time: '0h',
                        pending_actions: 0,
                        orphaned_decisions: 0
                    });
                } else {
                    setStats(data);
                }
            } catch (err) {
                console.error('Unexpected dashboard error:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [periodDays]);

    return { stats, loading, error };
}
