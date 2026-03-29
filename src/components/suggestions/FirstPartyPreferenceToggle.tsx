'use client';

import React, { useState, useCallback } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FirstPartyPreferenceToggleProps {
  /** הערך הנוכחי - האם היוזר רוצה לקבל הצעות כצד א' */
  initialValue: boolean;
  locale: 'he' | 'en';
  className?: string;
}

/**
 * FirstPartyPreferenceToggle
 *
 * כפתור שמאפשר ליוזר לבחור האם הוא רוצה לקבל הצעות שידוך
 * כ"צד א'" בסריקה האוטומטית היומית.
 *
 * שימוש נפוץ: בנות שמעדיפות שרק שדכן יפנה אליהן ולא המערכת
 * ישירות.
 */
const FirstPartyPreferenceToggle: React.FC<FirstPartyPreferenceToggleProps> = ({
  initialValue,
  locale,
  className,
}) => {
  const [wantsToBeFirst, setWantsToBeFirst] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const isHe = locale === 'he';

  const handleToggle = useCallback(
    async (newValue: boolean) => {
      if (isSaving) return;

      setIsSaving(true);
      const previousValue = wantsToBeFirst;
      setWantsToBeFirst(newValue); // Optimistic update

      try {
        const response = await fetch('/api/profile/first-party-preference', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wantsToBeFirstParty: newValue }),
        });

        if (!response.ok) throw new Error('Failed to update');

        toast.success(
          newValue
            ? isHe
              ? '✅ תקבל/י הצעות בסריקה האוטומטית'
              : '✅ You will receive auto-scan suggestions'
            : isHe
              ? '🔕 לא תקבל/י הצעות בסריקה האוטומטית'
              : '🔕 Auto-scan suggestions disabled'
        );
      } catch {
        setWantsToBeFirst(previousValue); // Rollback
        toast.error(
          isHe ? 'שגיאה בשמירה, נסה שוב' : 'Save failed, please try again'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, wantsToBeFirst, isHe]
  );

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-100/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Icon */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
        wantsToBeFirst
          ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-md shadow-teal-400/25'
          : 'bg-gray-100 text-gray-400'
      )}>
        {wantsToBeFirst ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {isHe ? 'הצעות אוטומטיות' : 'Auto Suggestions'}
        </p>
        <p className="text-[11px] text-gray-400 leading-tight">
          {wantsToBeFirst
            ? (isHe ? 'המערכת שולחת לך הצעות' : 'System sends you suggestions')
            : (isHe ? 'רק דרך שדכן/ית' : 'Matchmaker only')}
        </p>
      </div>

      {/* Toggle switch */}
      <button
        onClick={() => handleToggle(!wantsToBeFirst)}
        disabled={isSaving}
        className={cn(
          'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2',
          wantsToBeFirst
            ? 'bg-gradient-to-r from-teal-400 to-emerald-500 focus:ring-teal-400 shadow-inner'
            : 'bg-gray-300 focus:ring-gray-300',
          isSaving && 'opacity-60'
        )}
        aria-label={isHe ? 'הצעות אוטומטיות' : 'Auto suggestions toggle'}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center',
            wantsToBeFirst && 'translate-x-5',
          )}
        >
          {isSaving && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
        </span>
      </button>
    </div>
  );
};

export default FirstPartyPreferenceToggle;
