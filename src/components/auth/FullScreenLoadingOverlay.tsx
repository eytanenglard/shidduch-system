// src/components/auth/FullScreenLoadingOverlay.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

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
}

const FullScreenLoadingOverlay: React.FC<FullScreenLoadingOverlayProps> = ({
  isVisible,
  currentStepId,
  steps,
  dict,
  locale = 'he',
}) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // מעקב אחרי שלבים שהושלמו
  useEffect(() => {
    if (!isVisible) {
      setCompletedSteps([]);
      return;
    }

    const currentIndex = steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex > 0) {
      const newCompleted = steps.slice(0, currentIndex).map((s) => s.id);
      setCompletedSteps(newCompleted);
    }
  }, [currentStepId, steps, isVisible]);

  const currentStep = steps.find((s) => s.id === currentStepId);

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
        >
          {/* רקע אנימטיבי עדין */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* גרדיאנט עליון */}
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
            {/* גרדיאנט תחתון */}
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

          {/* תוכן מרכזי */}
          <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
            {/* לוגו מונפש - משתמש ב-StandardizedLoadingSpinner בלי טקסט כי נוסיף משלנו */}
            <div className="mb-0">
              <StandardizedLoadingSpinner className="!min-h-0 !p-0" />
            </div>

            {/* כותרת */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              {dict.title}
            </motion.h2>

            {/* תת-כותרת */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 text-sm mb-8"
            >
              {dict.subtitle}
            </motion.p>

            {/* שלבי התקדמות */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full space-y-3"
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
                    {/* אייקון סטטוס */}
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

                    {/* טקסט השלב */}
                    <div className="flex-1 text-right rtl:text-right ltr:text-left">
                      <p
                        className={`text-sm font-medium transition-colors ${
                          isCurrent
                            ? 'text-teal-700'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-gray-400'
                        }`}
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

            {/* הודעת טיפ */}
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