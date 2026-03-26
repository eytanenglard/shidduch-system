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
  // Connected via SSE — show nothing
  if (isConnected) return null;
  // Not connected and not polling — offline
  // Polling — degraded mode, still working

  const isHe = locale === 'he';

  if (!isConnected && !isPolling) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 border-b border-red-100 text-red-600 text-xs font-medium animate-fade-in">
        <WifiOff className="w-3.5 h-3.5" />
        <span>{isHe ? 'אין חיבור — ממתין לחיבור מחדש...' : 'No connection — waiting to reconnect...'}</span>
      </div>
    );
  }

  if (isPolling) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-amber-600 text-xs font-medium animate-fade-in">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>{isHe ? 'מתעדכן בצורה איטית יותר' : 'Updating less frequently'}</span>
      </div>
    );
  }

  return null;
}
