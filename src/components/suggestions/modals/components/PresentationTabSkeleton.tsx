'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const PresentationTabSkeleton: React.FC = () => (
  <div className="bg-slate-50 min-h-[500px]">
    <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-5">
      {/* Matchmaker context skeleton */}
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-16 h-3 rounded" />
          <Skeleton className="w-28 h-4 rounded" />
        </div>
      </div>

      {/* Person spotlight skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <Skeleton className="w-full md:w-2/5 aspect-[3/4] md:min-h-[320px]" />
          <div className="flex-1 p-5 md:p-6 space-y-4">
            <Skeleton className="w-40 h-9 rounded" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="w-20 h-7 rounded-full" />
              <Skeleton className="w-24 h-7 rounded-full" />
              <Skeleton className="w-28 h-7 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="w-24 h-7 rounded-full" />
              <Skeleton className="w-20 h-7 rounded-full" />
            </div>
            <div className="flex gap-1.5 mt-1">
              <Skeleton className="w-16 h-6 rounded-full" />
              <Skeleton className="w-14 h-6 rounded-full" />
              <Skeleton className="w-18 h-6 rounded-full" />
            </div>
            <Skeleton className="w-full h-8 rounded" />
            <Skeleton className="w-36 h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Insight skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-4">
        <Skeleton className="w-40 h-5 rounded" />
        <Skeleton className="w-full h-20 rounded-xl" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>
    </div>
  </div>
);

export default PresentationTabSkeleton;
