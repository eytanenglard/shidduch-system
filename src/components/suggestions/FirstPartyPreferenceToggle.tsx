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
        'p-4 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm',
        className
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* כותרת */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
          <Bell className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-semibold text-gray-700">
          {isHe ? 'הצעות מהסריקה האוטומטית' : 'Auto-Scan Suggestions'}
        </p>
      </div>

      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        {isHe
          ? 'האם תרצה/י לקבל הצעות שידוך ישירות מהסריקה הכללית היומית?'
          : 'Would you like to receive match suggestions directly from the daily auto-scan?'}
      </p>

      {/* שני כפתורים */}
      <div className="grid grid-cols-2 gap-2">
        {/* כפתור: כן */}
        <button
          onClick={() => handleToggle(true)}
          disabled={isSaving}
          className={cn(
            'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            wantsToBeFirst
              ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200 scale-[1.02]'
              : 'bg-gray-50 text-gray-500 hover:bg-teal-50 hover:text-teal-600 border border-gray-200'
          )}
        >
          {isSaving && wantsToBeFirst ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          <span className="text-xs leading-tight text-center">
            {isHe ? 'כן, אשמח לקבל' : 'Yes, receive them'}
          </span>
          {wantsToBeFirst && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-[9px] font-bold text-white">✓</span>
            </span>
          )}
        </button>

        {/* כפתור: לא */}
        <button
          onClick={() => handleToggle(false)}
          disabled={isSaving}
          className={cn(
            'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            !wantsToBeFirst
              ? 'bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-lg shadow-rose-200 scale-[1.02]'
              : 'bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 border border-gray-200'
          )}
        >
          {isSaving && !wantsToBeFirst ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          <span className="text-xs leading-tight text-center">
            {isHe ? 'לא, רק דרך שדכן' : 'No, matchmaker only'}
          </span>
          {!wantsToBeFirst && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-[9px] font-bold text-white">✓</span>
            </span>
          )}
        </button>
      </div>

      {/* הסבר מצב נוכחי */}
      <p className="text-[11px] text-center mt-3 text-gray-400 leading-relaxed">
        {wantsToBeFirst
          ? isHe
            ? 'הגדרה נוכחית: המערכת יכולה לשלוח לך הצעות ישירות'
            : 'Current: The system may send you suggestions directly'
          : isHe
            ? 'הגדרה נוכחית: הצעות יגיעו רק דרך שדכן אנושי'
            : 'Current: Suggestions will only come via a matchmaker'}
      </p>
    </div>
  );
};

export default FirstPartyPreferenceToggle;
