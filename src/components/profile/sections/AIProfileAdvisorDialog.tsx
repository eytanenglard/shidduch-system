// src/app/[locale]/(authenticated)/profile/components/advisor/AIProfileAdvisorDialog.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
import { Sparkles, AlertTriangle, X, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  locale: string;
}

export const AIProfileAdvisorDialog: React.FC<AIProfileAdvisorDialogProps> = ({
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
    // אם כבר יש תוצאה, רק פתח את הדיאלוג
    if (analysis) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // הוספת headers למניעת Cache בדפדפן - חשוב מאוד לפתרון הבעיה
      const response = await fetch('/api/ai/analyze-my-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
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
      // איפוס שגיאות בסגירה
      setError(null);

      // תיקון חשוב: אם המשתמש סוגר את החלון באמצע טעינה שנתקעה,
      // אנחנו מאפסים את הסטטוס כדי שהכפתור יהיה זמין ללחיצה מחדש
      if (isLoading) {
        setIsLoading(false);
      }
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
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-sm"
        >
          <Button
            onClick={handleTriggerClick}
            variant="outline"
            size="lg"
            className="relative group overflow-hidden w-full rounded-2xl border-2 border-teal-200/60 bg-gradient-to-br from-teal-50 via-orange-50 to-white hover:border-teal-300 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-teal-200/50 py-7"
          >
            {/* Decorative background elements (Gradient only, no icons) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-200/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform duration-700" />

            {/* Content Container */}
            <div className="relative z-10 flex items-center justify-center gap-3 w-full">
              {/* 1. הטקסט מופיע ראשון בקוד */}
              <span className="font-semibold text-lg bg-gradient-to-r from-teal-700 via-orange-600 to-teal-700 bg-clip-text text-transparent group-hover:from-teal-800 group-hover:via-orange-700 group-hover:to-teal-800 transition-all duration-300">
                {dict.triggerButton}
              </span>

              {/* 2. הלוגו מופיע שני בקוד - מה שיגרום לו להיות "בסוף" המשפט (משמאל בעברית, מימין באנגלית) */}
              <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Image
                  src="/logo.png"
                  alt="NeshamaTech Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 border-2 border-teal-100/50 shadow-2xl overflow-hidden bg-gradient-to-br from-white via-teal-50/30 to-orange-50/30"
        dir={direction}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-200/20 to-transparent rounded-full blur-3xl animate-float-slow" />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-2xl animate-float-slow"
          style={{ animationDelay: '2s' }}
        />

        <DialogHeader className="relative z-10 p-6 border-b border-teal-100/50 bg-white/80 backdrop-blur-sm">
          <div className="flex justify-between items-start gap-4">
            <DialogClose asChild>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="rounded-full p-2 text-gray-400 hover:text-gray-700 hover:bg-teal-50 shrink-0 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">{dict.closeButton}</span>
              </motion.button>
            </DialogClose>

            <div className="flex-grow">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-orange-400 rounded-xl blur-lg opacity-40" />
                  <div className="relative bg-gradient-to-br from-teal-500 via-orange-500 to-teal-600 p-2.5 rounded-xl shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-teal-700 via-orange-600 to-teal-700 bg-clip-text text-transparent font-bold">
                  {dict.dialogTitle}
                </span>
              </DialogTitle>
              <DialogDescription className="mt-2 text-gray-600 leading-relaxed">
                {dict.dialogDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative z-10 flex-grow overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-0 w-32 h-32 rounded-full border-4 border-t-teal-500 border-r-orange-500 border-b-transparent border-l-transparent"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="absolute inset-2 w-28 h-28 rounded-full border-4 border-t-transparent border-r-orange-400 border-b-teal-400 border-l-transparent"
                  />

                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="bg-gradient-to-br from-teal-500 via-orange-500 to-teal-600 p-4 rounded-2xl shadow-2xl"
                    >
                      <Brain className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <p className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-orange-600 bg-clip-text text-transparent">
                    {dict.loadingTitle}
                  </p>
                  <p className="text-gray-600 max-w-md">
                    {dict.loadingDescription}
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-6">
                    {[0, 0.2, 0.4].map((delay) => (
                      <motion.div
                        key={delay}
                        animate={{
                          y: [0, -8, 0],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay,
                          ease: 'easeInOut',
                        }}
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-500 to-orange-500"
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center h-full text-center px-4"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-20" />
                  <div className="relative bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-full border-2 border-red-200">
                    <AlertTriangle className="h-16 w-16 text-red-500" />
                  </div>
                </div>

                <Alert
                  variant="destructive"
                  className="max-w-md bg-white/90 backdrop-blur-sm border-2 border-red-200 shadow-xl"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle className="text-lg font-bold">
                    {dict.errorAlertTitle}
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">{dict.errorAlertDescription}</p>
                    <p className="text-xs text-gray-600 bg-red-50 p-2 rounded-lg mt-2 font-mono">
                      {error}
                    </p>
                  </AlertDescription>
                </Alert>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleGetAnalysis}
                    variant="outline"
                    className="mt-6 bg-gradient-to-r from-teal-50 to-orange-50 border-2 border-teal-300 hover:border-teal-400 text-teal-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {dict.retryButton}
                  </Button>
                </motion.div>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <AnalysisResultDisplay
                  analysis={analysis}
                  dict={analysisDict}
                  locale={locale}
                />
              </motion.div>
            ) : (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-300 to-orange-300 rounded-full blur-2xl opacity-30" />
                    <div className="relative bg-gradient-to-br from-teal-100 to-orange-100 p-8 rounded-full border-2 border-teal-200">
                      <Sparkles className="w-16 h-16 text-teal-600" />
                    </div>
                  </div>
                  <p className="text-lg text-gray-600">{dict.initialState}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>

      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(0) translateX(20px);
          }
          75% {
            transform: translateY(20px) translateX(10px);
          }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
      `}</style>
    </Dialog>
  );
};

export default AIProfileAdvisorDialog;
