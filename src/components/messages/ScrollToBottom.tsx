// src/components/messages/ScrollToBottom.tsx
//
// Floating button that appears when user scrolls up in chat.
// Shows new message count badge.

'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToBottomProps {
  visible: boolean;
  newMessageCount: number;
  onClick: () => void;
  locale: 'he' | 'en';
}

export default function ScrollToBottom({
  visible,
  newMessageCount,
  onClick,
  locale,
}: ScrollToBottomProps) {
  if (!visible) return null;

  const isHe = locale === 'he';

  return (
    <div className="absolute bottom-4 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-full',
          'bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200',
          'hover:bg-white hover:shadow-xl transition-all duration-200',
          'text-sm font-medium text-gray-700'
        )}
      >
        <ChevronDown className="w-4 h-4" />
        {newMessageCount > 0 ? (
          <span>
            {newMessageCount}{' '}
            {isHe ? 'הודעות חדשות' : 'new messages'}
          </span>
        ) : (
          <span>{isHe ? 'גלול למטה' : 'Scroll to bottom'}</span>
        )}
        {newMessageCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-bold animate-zoom-in">
            {newMessageCount}
          </span>
        )}
      </button>
    </div>
  );
}
