'use client';

import { useRole } from '@/lib/providers';
import { Timeline } from '@/components/pages';

export default function TimelineDetailPage() {
    const { currentRole } = useRole();
    return <Timeline userRole={currentRole} />;
}
