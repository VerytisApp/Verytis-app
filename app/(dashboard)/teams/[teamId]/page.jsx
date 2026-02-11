'use client';

import { useRole } from '@/lib/providers';
import { TeamDetail } from '@/components/pages';

export default function TeamDetailPage() {
    const { currentRole, currentUser } = useRole();
    return <TeamDetail userRole={currentRole} currentUser={currentUser} />;
}
