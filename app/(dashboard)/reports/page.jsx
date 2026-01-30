'use client';

import { useRole } from '@/lib/providers';
import { AuditDocumentation } from '@/components/pages';

export default function ReportsPage() {
    const { currentRole } = useRole();
    return <AuditDocumentation userRole={currentRole} />;
}
