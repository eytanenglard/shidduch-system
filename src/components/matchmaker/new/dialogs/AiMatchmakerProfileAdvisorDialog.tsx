// src/components/matchmaker/new/dialogs/AiMatchmakerProfileAdvisorDialog.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, X, Bot, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Candidate } from '../types/candidates';
// שינוי ייבוא 1: שימוש בטיפוס החדש והקומפוננטה החדשה
import type { AiProfileSummaryResult } from '@/lib/services/aiService'; 
import ProfileSummaryDisplay from '../ProfileSummaryDisplay'; // וודא שהנתיב נכון לקובץ שיצרת
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import { Button } from '@/components/ui/button';

interface AiMatchmakerProfileAdvisorDialogProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  dict: MatchmakerPageDictionary['candidatesManager']['aiProfileAdvisor'];
  locale: string;
}

export const AiMatchmakerProfileAdvisorDialog: React.FC<
  AiMatchmakerProfileAdvisorDialogProps
> = ({ candidate, isOpen, onClose, dict, locale }) => {
  // שינוי 2: עדכון ה-State לטיפוס החדש
  const [analysis, setAnalysis] = useState<AiProfileSummaryResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!candidate || isLoading) return;

      if (analysis && !forceRefresh) return;

      setIsLoading(true);
      setError(null);
      if (!forceRefresh) {
        setAnalysis(null);
      }

      try {
        const response = await fetch('/api/ai/matchmaker/analyze-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // אנחנו שולחים forceRefresh אם המשתמש ביקש
          body: JSON.stringify({ 
            userId: candidate.id,
            forceRefresh: forceRefresh
          }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Error getting profile analysis.');
        }
        setAnalysis(result.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(errorMessage);
        toast.error(dict.toast.errorTitle, {
          description: dict.toast.errorDescription.replace(
            '{{error}}',
            errorMessage
          ),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [candidate, isLoading, analysis, dict.toast]
  );

  useEffect(() => {
    if (isOpen) {
      getAnalysis();
    } else {
      setAnalysis(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, getAnalysis]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  // יצירת מילון אד-הוק לקומפוננטה החדשה מתוך המילון הקיים (או שתרצה להוסיף מפתחות חדשים לדיקשנרי)
  // כרגע נשתמש בערכים מתוך הדיקשנרי הקיים ככל הניתן
  const summaryDisplayDict = {
    personalityTitle: dict.analysisResult.summary.personalityTitle,
    personalityDescription: "ניתוח אישיות מבוסס AI", // אפשר להוסיף למילון
    lookingForTitle: dict.analysisResult.summary.lookingForTitle,
    lookingForDescription: "סיכום העדפות ודרישות", // אפשר להוסיף למילון
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0"
        dir={direction}
      >
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot className="w-6 h-6 text-indigo-500" />
              <span>
                {dict.dialogTitle} {candidate?.firstName} {candidate?.lastName}
              </span>
            </DialogTitle>
            <DialogClose asChild>
              <button className="rounded-full p-1.5 text-gray-500 hover:text-gray-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
          <DialogDescription>{dict.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                {dict.loadingTitle}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {dict.loadingDescription}
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>{dict.errorAlertTitle}</AlertTitle>
                <AlertDescription>
                  <p>{dict.errorAlertDescription}</p>
                  <p className="text-xs mt-2">{error}</p>
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => getAnalysis(true)}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                {dict.retryButton || 'נסה שוב'}
              </Button>
            </div>
          )}
          
          {/* שינוי 3: רינדור הקומפוננטה החדשה */}
          {analysis && !isLoading && (
            <div className="space-y-6">
              <ProfileSummaryDisplay
                summary={analysis}
                dict={summaryDisplayDict}
                locale={locale}
              />
               <div className="flex justify-center pt-4">
                 <Button
                    onClick={() => getAnalysis(true)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-800"
                  >
                    <RefreshCw className="w-3 h-3 ml-2" />
                    רענן נתונים (צור מחדש)
                  </Button>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};