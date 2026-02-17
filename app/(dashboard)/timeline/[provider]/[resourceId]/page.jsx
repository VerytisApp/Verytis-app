
'use client';

import { useRole } from '@/lib/providers';
import { TimelineFeed } from '@/components/pages';

export default function TimelineFeedPage() {
    const { currentRole } = useRole();
    return <TimelineFeed userRole={currentRole} />;
}
