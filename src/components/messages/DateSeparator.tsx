// src/components/messages/DateSeparator.tsx
//
// WhatsApp-style date separator pill for chat views.

'use client';

import React from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface DateSeparatorProps {
  dateStr: string;
  locale: 'he' | 'en';
}

export function formatDateSeparator(dateStr: string, locale: 'he' | 'en'): string {
  const date = new Date(dateStr);
  const loc = locale === 'he' ? he : enUS;

  if (isToday(date)) return locale === 'he' ? 'היום' : 'Today';
  if (isYesterday(date)) return locale === 'he' ? 'אתמול' : 'Yesterday';
  return format(date, locale === 'he' ? 'EEEE, d בMMMM' : 'EEEE, MMMM d', {
    locale: loc,
  });
}

export function shouldShowDateSeparator(
  dates: string[],
  index: number
): boolean {
  if (index === 0) return true;
  return !isSameDay(new Date(dates[index]), new Date(dates[index - 1]));
}

export default function DateSeparator({ dateStr, locale }: DateSeparatorProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-center my-4 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
        <span className="text-xs font-medium text-gray-500">
          {formatDateSeparator(dateStr, locale)}
        </span>
      </div>
    </div>
  );
}
