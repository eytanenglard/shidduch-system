// src/components/suggestions/chat/AiChatRejectionPicker.tsx
// =============================================================================
// Quick rejection category picker — shown inline when "Not for me" is tapped
// =============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Heart, MapPin, Calendar, Compass, HelpCircle, Frown } from 'lucide-react';

const REJECTION_OPTIONS = [
  { category: 'NOT_ATTRACTED', icon: Frown, he: 'לא נמשכתי', en: 'Not attracted' },
  { category: 'RELIGIOUS_GAP', icon: Heart, he: 'פער דתי', en: 'Religious gap' },
  { category: 'AGE_GAP', icon: Calendar, he: 'פער גילאים', en: 'Age gap' },
  { category: 'GEOGRAPHIC_GAP', icon: MapPin, he: 'מרחק גיאוגרפי', en: 'Geographic distance' },
  { category: 'GUT_FEELING', icon: Compass, he: 'תחושת בטן', en: 'Gut feeling' },
  { category: 'OTHER', icon: HelpCircle, he: 'אחר', en: 'Other' },
] as const;

interface AiChatRejectionPickerProps {
  locale: 'he' | 'en';
  onSelect: (category: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function AiChatRejectionPicker({
  locale,
  onSelect,
  onCancel,
  disabled,
}: AiChatRejectionPickerProps) {
  const isHebrew = locale === 'he';

  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 text-center">
        {isHebrew ? 'למה לא מתאים?' : 'Why not a match?'}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {REJECTION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.category}
              onClick={() => onSelect(opt.category)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
                'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200',
                'transition-all active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {isHebrew ? opt.he : opt.en}
            </button>
          );
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-[11px] text-gray-400 hover:text-gray-500 py-1 transition-colors"
      >
        {isHebrew ? 'ביטול' : 'Cancel'}
      </button>
    </div>
  );
}
