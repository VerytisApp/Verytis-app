'use client';

import { useRole } from '@/lib/providers';
import { UserDetail } from '@/components/pages';

export default function UserDetailPage() {
    const { currentRole } = useRole();
    return <UserDetail userRole={currentRole} />;
}
