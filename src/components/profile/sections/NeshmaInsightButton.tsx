// src/app/[locale]/(authenticated)/profile/components/dashboard/NeshmaInsightButton.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Lock, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NeshmaInsightButtonProps {
  userId: string;
  locale: 'he' | 'en';
  completionPercentage: number;
  lastGeneratedAt?: string | null;
  generatedCount?: number;
  userRole?: string;
  dict: {
    buttonText: string;
    buttonSubtitle: string;
    dialogTitle: string;
    generating: string;
    close: string;
    lockedTitle?: string;
    lockedDescription?: string;
    alreadyGeneratedToday?: string;
    minimizedButtonText?: string;
  };
}

// --- שונה מ-95 ל-90 ---
const COMPLETION_THRESHOLD = 90;

export const NeshmaInsightButton: React.FC<NeshmaInsightButtonProps> = ({
  userId,
  locale,
  completionPercentage,
  lastGeneratedAt,
  generatedCount = 0,
  userRole,
  dict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const isPrivilegedUser = userRole === 'MATCHMAKER' || userRole === 'ADMIN';

  const isProfileComplete =
    completionPercentage >= COMPLETION_THRESHOLD || isPrivilegedUser;

  const canGenerateToday = () => {
    if (isPrivilegedUser) return true;

    if (!lastGeneratedAt) return true;
    const lastGenDate = new Date(lastGeneratedAt);
    const today = new Date();
    const diffTime = today.getTime() - lastGenDate.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const hasGeneratedBefore = generatedCount > 0;
  const canGenerate = isProfileComplete && canGenerateToday();

  useEffect(() => {
    if (hasGeneratedBefore && isProfileComplete) {
      setIsMinimized(true);
    }
  }, [hasGeneratedBefore, isProfileComplete]);

  const handleGenerateInsight = async () => {
    if (!canGenerate) {
      if (!isProfileComplete) {
        toast.error(
          locale === 'he'
            ? `יש להשלים את הפרופיל ל-${COMPLETION_THRESHOLD}% לפחות כדי לקבל את התמונה המלאה`
            : `Complete your profile to at least ${COMPLETION_THRESHOLD}% to get your Full Picture`
        );
      } else if (!canGenerateToday()) {
        toast.error(
          locale === 'he'
            ? 'ניתן ליצור את התמונה המלאה פעם אחת ב-24 שעות'
            : 'You can generate your Full Picture once every 24 hours'
        );
      }
      return;
    }

    setIsOpen(true);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/profile/neshama-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate insight');
      }

      const data = await response.json();
      setInsightText(data.insight);

      toast.success(
        locale === 'he'
          ? 'התמונה המלאה נוצרה בהצלחה!'
          : 'Your Full Picture was generated successfully!'
      );

      if (!isPrivilegedUser) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast.error(
        error.message ||
          (locale === 'he'
            ? 'אירעה שגיאה ביצירת התמונה המלאה'
            : 'Error generating your Full Picture')
      );
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!insightText) return;
    navigator.clipboard.writeText(insightText);
    toast.success(
      locale === 'he' ? 'הטקסט הועתק ללוח' : 'Text copied to clipboard'
    );
  };

  // --- Locked State ---
  if (!isProfileComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-6"
      >
        <div className="relative group opacity-60">
          <div className="relative bg-gradient-to-br from-slate-50/50 via-teal-50/50 to-orange-50/50 rounded-2xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-400 via-teal-400 to-orange-400 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -end-1 bg-white rounded-full p-1 shadow-md">
                  <Lock className="w-3 h-3 text-gray-600" />
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-700">
                  {dict.lockedTitle ||
                    (locale === 'he'
                      ? 'התמונה המלאה - נעולה'
                      : 'Full Picture - Locked')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dict.lockedDescription
                    ? dict.lockedDescription.replace(
                        '{{percentage}}',
                        completionPercentage.toString()
                      )
                    : locale === 'he'
                      ? `השלם את הפרופיל ל-${COMPLETION_THRESHOLD}% כדי לפתוח (כרגע: ${completionPercentage}%)`
                      : `Complete your profile to ${COMPLETION_THRESHOLD}% to unlock (Currently: ${completionPercentage}%)`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Minimized State (Already Generated Before) ---
  if (isMinimized && hasGeneratedBefore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="my-6"
      >
        <div className="relative bg-white/70 rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {dict.minimizedButtonText ||
                    (locale === 'he' ? 'התמונה המלאה' : 'Full Picture')}
                </h4>
                <p className="text-xs text-gray-500">
                  {canGenerateToday()
                    ? locale === 'he'
                      ? 'לחץ ליצירת דוח חדש ומעודכן'
                      : 'Click to generate a new updated report'
                    : dict.alreadyGeneratedToday ||
                      (locale === 'he'
                        ? 'נוצרה היום - זמינה שוב מחר'
                        : 'Generated today - Available tomorrow')}
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateInsight}
              disabled={!canGenerate}
              size="sm"
              className={cn(
                'gap-1.5 rounded-full text-xs',
                canGenerate
                  ? 'bg-gradient-to-r from-teal-600 to-orange-600 hover:from-teal-700 hover:to-orange-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {locale === 'he' ? 'צור מחדש' : 'Regenerate'}
            </Button>
          </div>
        </div>

        <InsightDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isGenerating={isGenerating}
          insightText={insightText}
          locale={locale}
          dict={dict}
          copyToClipboard={copyToClipboard}
        />
      </motion.div>
    );
  }

  // --- Main State (Ready to Generate) ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-6"
    >
      <motion.div
        className="relative cursor-pointer"
        onClick={handleGenerateInsight}
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-30 animate-pulse" />

        <div className="relative bg-gradient-to-br from-teal-50 via-orange-50 to-amber-50 rounded-2xl p-5 shadow-lg border border-teal-200">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 p-3 rounded-xl shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800">
                {dict.buttonText}
                {isPrivilegedUser && (
                  <span className="text-xs text-teal-600 font-normal mr-2">
                    (גישת שדכן)
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {dict.buttonSubtitle}
              </p>
            </div>

            <div className="bg-gradient-to-r from-teal-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
              {locale === 'he' ? 'צור עכשיו' : 'Generate'}
            </div>
          </div>
        </div>
      </motion.div>

      <InsightDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isGenerating={isGenerating}
        insightText={insightText}
        locale={locale}
        dict={dict}
        copyToClipboard={copyToClipboard}
      />
    </motion.div>
  );
};

// --- Insight Dialog ---
interface InsightDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isGenerating: boolean;
  insightText: string | null;
  locale: 'he' | 'en';
  dict: any;
  copyToClipboard: () => void;
}

const InsightDialog: React.FC<InsightDialogProps> = ({
  isOpen,
  setIsOpen,
  isGenerating,
  insightText,
  locale,
  dict,
  copyToClipboard,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden"
        dir={direction}
      >
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-teal-50 to-orange-50 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600" />
            {dict.dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-16 h-16 text-teal-600 animate-spin" />
            <p className="text-lg text-gray-600">{dict.generating}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="bg-white p-6 rounded-lg border shadow-sm text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base font-sans">
              {insightText}
            </div>
          </div>
        )}

        {!isGenerating && insightText && (
          <DialogFooter className="p-4 border-t bg-white gap-2 sm:gap-0 flex-shrink-0">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {locale === 'he' ? 'העתק טקסט' : 'Copy Text'}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {dict.close || (locale === 'he' ? 'סגור' : 'Close')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
