// src/components/messages/ConnectionStatus.tsx
//
// Banner that shows when SSE is disconnected or using polling fallback.

'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  isPolling: boolean;
  locale: 'he' | 'en';
}

export default function ConnectionStatus({
  isConnected,
  isPolling,
  locale,
}: ConnectionStatusProps) {
  const isHe = locale === 'he';

  // Disconnected — no SSE, no polling
  if (!isConnected && !isPolling) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 border-b border-red-100 text-red-600 text-xs font-medium animate-fade-in">
        <WifiOff className="w-3.5 h-3.5" />
        <span>{isHe ? 'אין חיבור — ממתין לחיבור מחדש...' : 'No connection — waiting to reconnect...'}</span>
      </div>
    );
  }

  // Polling fallback — degraded mode
  if (isPolling && !isConnected) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-amber-600 text-xs font-medium animate-fade-in">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>{isHe ? 'מתעדכן בצורה איטית יותר' : 'Updating less frequently'}</span>
      </div>
    );
  }

  // Connected via SSE — show subtle live indicator
  if (isConnected) {
    return (
      <div className="flex items-center justify-end gap-1.5 px-3 py-1 border-b border-gray-50">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span className="text-[10px] text-gray-400">{isHe ? 'מחובר' : 'Live'}</span>
      </div>
    );
  }

  return null;
}
