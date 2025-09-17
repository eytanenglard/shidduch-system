// src/app/[locale]/(authenticated)/profile/components/advisor/AIProfileAdvisorDialog.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Import cn utility

import AnalysisResultDisplay from './AnalysisResultDisplay';
import type { AiProfileAnalysisResult } from '@/lib/services/aiService';
import {
  AIAdvisorDialogDict,
  AnalysisResultDisplayDict,
} from '@/types/dictionary';

interface AIProfileAdvisorDialogProps {
  userId: string;
  dict: AIAdvisorDialogDict;
  analysisDict: AnalysisResultDisplayDict;
  locale: string; // Added locale prop
}

export const AIProfileAdvisorDialog: React.FC<AIProfileAdvisorDialogProps> = ({
  userId,
  dict,
  analysisDict,
  locale,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AiProfileAnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const handleGetAnalysis = async () => {
    if (analysis) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-my-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
    }
  };

  const handleTriggerClick = () => {
    if (!analysis && !isLoading) {
      handleGetAnalysis();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleTriggerClick}
          variant="outline"
          size="lg"
          className="rounded-full border-2 border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-lg group w-full max-w-sm flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-purple-500 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          <span>{dict.triggerButton}</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0"
        dir={direction} // Dynamically set direction
      >
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-start gap-4">
            {/* Wrapper for title and description */}
            <div className="flex-grow">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <span>{dict.dialogTitle}</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {dict.dialogDescription}
              </DialogDescription>
            </div>

            {/* Close Button - now part of the flex layout */}
            <DialogClose asChild>
              <button className="rounded-full p-1.5 text-gray-500 hover:text-gray-800 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-5 w-5" />
                <span className="sr-only">{dict.closeButton}</span>
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-lg font-semibold text-gray-700">
                {dict.loadingTitle}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {dict.loadingDescription}
              </p>
            </div>
          ) : error ? (
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
                onClick={handleGetAnalysis}
                variant="outline"
                className="mt-4"
              >
                {dict.retryButton}
              </Button>
            </div>
          ) : analysis ? (
            <AnalysisResultDisplay
              analysis={analysis}
              dict={analysisDict}
              locale={locale} // Pass locale down
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>{dict.initialState}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIProfileAdvisorDialog;
