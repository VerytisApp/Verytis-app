'use client';

import { useRole } from '@/lib/providers';
import { TeamDetail } from '@/components/pages';

export default function TeamDetailPage() {
    const { currentRole } = useRole();
    return <TeamDetail userRole={currentRole} />;
}
