'use client';

import { useRole } from '@/lib/providers';
import { Dashboard } from '@/components/pages';

export default function DashboardPage() {
    const { currentRole } = useRole();
    return <Dashboard userRole={currentRole} />;
}
