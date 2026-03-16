// src/components/auth/FullScreenLoadingOverlay.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export type LoadingStep = {
  id: string;
  text: string;
  subtext?: string;
};

interface FullScreenLoadingOverlayProps {
  isVisible: boolean;
  currentStepId: string;
  steps: LoadingStep[];
  dict: {
    title: string;
    subtitle: string;
  };
  locale?: 'he' | 'en';
  timeoutMs?: number; // Escape hatch after this many ms (default: 30s)
  onTimeout?: () => void; // Called when timeout fires
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;

// ============================================================================
// COMPONENT
// ============================================================================

const FullScreenLoadingOverlay: React.FC<FullScreenLoadingOverlayProps> = ({
  isVisible,
  currentStepId,
  steps,
  dict,
  locale = 'he',
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onTimeout,
}) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // ============================================================================
  // Track completed steps
  // ============================================================================

  useEffect(() => {
    if (!isVisible) {
      // Reset when overlay closes
      setCompletedSteps([]);
      setIsTimedOut(false);
      return;
    }

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex > 0) {
      const newCompleted = steps.slice(0, currentIndex).map((s) => s.id);
      setCompletedSteps(newCompleted);
    }
  }, [currentStepId, steps, isVisible]);

  // ============================================================================
  // Timeout fallback — escape hatch if something gets stuck
  // ============================================================================

  useEffect(() => {
    if (!isVisible) return;

    setIsTimedOut(false);
    const timer = setTimeout(() => {
      setIsTimedOut(true);
      onTimeout?.();
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [isVisible, timeoutMs, onTimeout]);

  // ============================================================================
  // Handle manual escape
  // ============================================================================

  const handleForceRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  const currentStep = steps.find((s) => s.id === currentStepId);

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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(248, 250, 252, 0.97) 0%, rgba(240, 253, 250, 0.97) 50%, rgba(255, 247, 237, 0.97) 100%)',
            backdropFilter: 'blur(12px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={dict.title}
        >
          {/* Animated background — only render when visible */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(249, 115, 22, 0.06) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2,
              }}
            />
          </div>

          {/* Central content */}
          <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
            {/* Spinner */}
            <div className="mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-teal-500 border-r-orange-500"
              />
            </div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              {dict.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 text-sm mb-8"
            >
              {dict.subtitle}
            </motion.p>

            {/* Step progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full space-y-3"
              aria-live="polite"
              aria-atomic="false"
            >
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStepId;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: locale === 'he' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-teal-50 to-orange-50 border border-teal-200 shadow-sm'
                        : isCompleted
                          ? 'bg-green-50/50'
                          : 'bg-gray-50/50'
                    }`}
                  >
                    {/* Status icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-gradient-to-br from-teal-500 to-orange-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 25,
                          }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Step text */}
                    <div className="flex-1 text-right rtl:text-right ltr:text-left">
                      <p
                        className={`text-sm font-medium transition-colors ${
                          isCurrent
                            ? 'text-teal-700'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-400'
                        }`}
                        // Announce current step to screen readers
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {step.text}
                      </p>
                      {step.subtext && isCurrent && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-gray-500 mt-0.5"
                        >
                          {step.subtext}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Timeout warning */}
            <AnimatePresence>
              {isTimedOut && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 w-full p-4 bg-amber-50 border border-amber-200 rounded-xl text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">
                      {locale === 'he'
                        ? 'התהליך לוקח יותר זמן מהצפוי'
                        : 'This is taking longer than expected'}
                    </p>
                  </div>
                  <Button
                    onClick={handleForceRefresh}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    {locale === 'he' ? 'רענן את הדף' : 'Refresh page'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Don't close tip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex items-center gap-2 text-xs text-gray-400"
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {locale === 'he'
                  ? 'נא לא לסגור את החלון'
                  : "Please don't close this window"}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenLoadingOverlay;
