'use client';

import { useRole } from '@/lib/providers';
import { UsersAndRoles } from '@/components/pages';

export default function UsersPage() {
    const { currentRole } = useRole();
    return <UsersAndRoles userRole={currentRole} />;
}
