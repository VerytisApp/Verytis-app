import * as Sentry from '@sentry/nextjs';
import './globals.css';

export function generateMetadata() {
    return {
        title: 'ICARE Admin Console | Governance Dashboard',
        description: 'Enterprise governance and compliance dashboard',
        other: {
            ...Sentry.getTraceData(),
        },
    };
}

import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 font-sans text-slate-900 selection:bg-indigo-200">
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
