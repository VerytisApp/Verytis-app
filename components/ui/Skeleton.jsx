import React from 'react';

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
);

export const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
        </div>
    </div>
);

export const SkeletonTeamItem = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
    </div>
);

export const SkeletonTimelineItem = () => (
    <div className="flex gap-4 p-4">
        <div className="flex flex-col items-center">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-0.5 flex-1 bg-slate-100 my-1" />
        </div>
        <div className="flex-1 space-y-3 bg-white p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-12 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
            </div>
        </div>
    </div>
);

export const SkeletonDashboard = () => (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-6 w-40 mb-4" />
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    </div>
);

export default Skeleton;
