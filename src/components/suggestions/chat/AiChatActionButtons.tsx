// src/components/suggestions/chat/AiChatActionButtons.tsx
// =============================================================================
// Action buttons displayed in chat when a candidate is presented
// =============================================================================

'use client';

import React from 'react';
import { Heart, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatActionButton } from './useAiChat';

interface AiChatActionButtonsProps {
  buttons: ChatActionButton[];
  locale: 'he' | 'en';
  onAction: (type: ChatActionButton['type']) => void;
  disabled?: boolean;
}

export default function AiChatActionButtons({
  buttons,
  locale,
  onAction,
  disabled,
}: AiChatActionButtonsProps) {
  const isHebrew = locale === 'he';

  const iconMap: Record<string, React.ReactNode> = {
    interested: <Heart className="w-4 h-4" />,
    not_for_me: <X className="w-4 h-4" />,
    tell_me_more: <Info className="w-4 h-4" />,
  };

  const styleMap: Record<string, string> = {
    interested: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200',
    not_for_me: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    tell_me_more: 'bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200',
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center py-3">
      {buttons.map((btn) => (
        <button
          key={btn.type}
          onClick={() => onAction(btn.type)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium',
            'transition-all duration-200 shadow-sm hover:shadow-md active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm',
            styleMap[btn.type] || 'bg-gray-100 text-gray-600',
          )}
        >
          {iconMap[btn.type]}
          {isHebrew ? btn.label.he : btn.label.en}
        </button>
      ))}
    </div>
  );
}
