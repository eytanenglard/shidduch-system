'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const CompatibilityTabSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 bg-gray-50 space-y-4">
    {/* AI Analysis bar */}
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="w-48 h-3 rounded" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>

    {/* Score bar + rows */}
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Overall score bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-8 rounded flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-16 h-3 rounded" />
            </div>
            <Skeleton className="w-full h-2 rounded-full" />
          </div>
        </div>
      </div>

      {/* Category rows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="px-1 py-1">
          {/* Category header for first, third row */}
          {(i === 0 || i === 2 || i === 4) && (
            <div className="flex justify-between px-3 pt-2 pb-1">
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-10 h-4 rounded-full" />
              </div>
              <Skeleton className="w-36 h-3 rounded" />
            </div>
            <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CompatibilityTabSkeleton;
