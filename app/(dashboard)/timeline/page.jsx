'use client';

import { useRole } from '@/lib/providers';
import { Timeline } from '@/components/pages';

export default function TimelinePage() {
    const { currentRole } = useRole();
    return <Timeline userRole={currentRole} />;
}
