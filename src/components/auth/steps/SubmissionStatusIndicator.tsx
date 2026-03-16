// src/components/auth/steps/SubmissionStatusIndicator.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export type SubmissionStatus =
  | 'idle'
  | 'creatingAccount'
  | 'acceptingTerms'
  | 'sendingCode'
  | 'savingProfile'
  | 'uploadingPhotos'
  | 'updatingSession'
  | 'redirecting'
  | 'error';

interface Step {
  id: SubmissionStatus;
  text: string;
}

interface SubmissionStatusIndicatorProps {
  currentStatus: SubmissionStatus;
  steps: Step[];
  dict: {
    title: string;
    subtitle: string;
  };
  locale?: 'he' | 'en';
  timeoutMs?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;

// ============================================================================
// COMPONENT
// ============================================================================

const SubmissionStatusIndicator: React.FC<SubmissionStatusIndicatorProps> = ({
  currentStatus,
  steps,
  dict,
  locale = 'he',
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const isRTL = locale === 'he';

  // ============================================================================
  // STEP STATUS HELPER
  // ============================================================================

  const getStepStatus = (
    stepId: SubmissionStatus,
    current: SubmissionStatus
  ): 'completed' | 'in-progress' | 'pending' => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === current);

    if (currentIndex === -1 || current === 'idle' || current === 'error') {
      return 'pending';
    }
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'in-progress';
    return 'pending';
  };

  // ============================================================================
  // PROGRESS CALCULATION
  // ============================================================================

  const currentIndex = steps.findIndex((s) => s.id === currentStatus);
  const progressPercent =
    currentIndex >= 0
      ? Math.round(((currentIndex + 0.5) / steps.length) * 100)
      : 0;

  // ============================================================================
  // TIMEOUT
  // ============================================================================

  useEffect(() => {
    if (currentStatus === 'idle' || currentStatus === 'error') {
      setIsTimedOut(false);
      return;
    }

    setIsTimedOut(false);
    const timer = setTimeout(() => setIsTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [currentStatus, timeoutMs]);

  // ============================================================================
  // ESCAPE HATCH
  // ============================================================================

  const handleForceRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // ============================================================================
  // VISIBILITY
  // ============================================================================

  const isVisible = currentStatus !== 'idle' && currentStatus !== 'error';

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={dict.title}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="h-2 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500" />

            {/* Overall progress bar */}
            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-500 to-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            <div className="p-6 text-center">
              {/* Header */}
              <div className="flex justify-center items-center gap-2 mb-4">
                <ShieldCheck className="h-7 w-7 text-teal-500" />
                <h3 className="text-xl font-bold text-gray-800">
                  {dict.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">{dict.subtitle}</p>

              {/* Steps */}
              <div className="space-y-3" aria-live="polite" aria-atomic="false">
                {steps.map((step) => {
                  const status = getStepStatus(step.id, currentStatus);

                  return (
                    <motion.div
                      key={step.id}
                      layout
                      className={`
                        flex items-center gap-4 p-3 rounded-xl transition-all duration-300
                        ${
                          status === 'in-progress'
                            ? 'bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200'
                            : status === 'completed'
                              ? 'bg-green-50/50'
                              : 'bg-gray-50'
                        }
                      `}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      {/* Status icon with animated transitions */}
                      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {status === 'completed' && (
                            <motion.div
                              key="completed"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 20,
                              }}
                            >
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            </motion.div>
                          )}
                          {status === 'in-progress' && (
                            <motion.div
                              key="progress"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
                            </motion.div>
                          )}
                          {status === 'pending' && (
                            <motion.div
                              key="pending"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="h-6 w-6 rounded-full border-2 border-gray-300"
                            />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Step text */}
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          status === 'completed'
                            ? 'text-green-600'
                            : status === 'in-progress'
                              ? 'text-teal-700'
                              : 'text-gray-400'
                        }`}
                        aria-current={
                          status === 'in-progress' ? 'step' : undefined
                        }
                      >
                        {step.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Timeout warning */}
              <AnimatePresence>
                {isTimedOut && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="mt-4"
                  >
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <p className="text-xs font-medium text-amber-800">
                          {locale === 'he'
                            ? 'התהליך לוקח יותר זמן מהצפוי'
                            : 'This is taking longer than expected'}
                        </p>
                      </div>
                      <Button
                        onClick={handleForceRefresh}
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs"
                      >
                        {locale === 'he' ? 'רענן את הדף' : 'Refresh page'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionStatusIndicator;
