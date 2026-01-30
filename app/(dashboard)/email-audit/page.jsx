'use client';

import { useRole } from '@/lib/providers';
import { EmailAudit } from '@/components/pages';

export default function EmailAuditPage() {
    const { currentRole } = useRole();
    return <EmailAudit userRole={currentRole} />;
}
