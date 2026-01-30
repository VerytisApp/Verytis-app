'use client';

import { useRole } from '@/lib/providers';
import { ChannelDetail } from '@/components/pages';

export default function ChannelDetailPage() {
    const { currentRole } = useRole();
    return <ChannelDetail userRole={currentRole} />;
}
