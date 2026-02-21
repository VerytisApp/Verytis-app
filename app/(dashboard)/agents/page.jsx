'use client';

import { useRole } from '@/lib/providers';
import AiAgents from '@/components/pages/AiAgents';

export default function AgentsPage() {
    const { currentRole } = useRole();
    return <AiAgents userRole={currentRole} />;
}
