'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackToPrevious() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm hover:shadow-md"
        >
            <ChevronLeft className="w-3 h-3 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back
        </button>
    );
}
