'use client';

import { useRole } from '@/lib/providers';
import { Teams } from '@/components/pages';

export default function TeamsPage() {
    const { currentRole, currentUser } = useRole();
    return <Teams userRole={currentRole} currentUser={currentUser} />;
}
