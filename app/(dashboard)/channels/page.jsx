'use client';

import { useRole } from '@/lib/providers';
import { Channels } from '@/components/pages';

export default function ChannelsPage() {
    const { currentRole } = useRole();
    return <Channels userRole={currentRole} />;
}
