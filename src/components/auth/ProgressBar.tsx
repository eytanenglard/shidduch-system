// src/components/auth/ProgressBar.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string; // Supports {{step}} and {{total}} placeholders
  locale: 'he' | 'en';
  animationDuration?: number;
  stepNames?: string[]; // Optional descriptive names for each step
}

// ============================================================================
// COMPONENT
// ============================================================================

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabel,
  locale,
  animationDuration = 0.5,
  stepNames,
}) => {
  const percentage = Math.min((currentStep / totalSteps) * 100, 100);
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const isRTL = locale === 'he';

  const formatLabel = (step: number): string => {
    return stepLabel
      .replace('{{step}}', step.toString())
      .replace('{{total}}', totalSteps.toString());
  };

  return (
    <div
      className="w-full relative"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-label={formatLabel(currentStep)}
    >
      {/* Step labels — hidden on very small screens to prevent overlap */}
      <div className="hidden sm:flex justify-between mb-2">
        {steps.map((step) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div
              key={step}
              className={`text-xs font-medium transition-colors duration-300 ${
                isCurrent
                  ? 'text-teal-700 font-semibold'
                  : isCompleted
                    ? 'text-teal-600'
                    : 'text-gray-400'
              }`}
            >
              {stepNames?.[step - 1] || formatLabel(step)}
            </div>
          );
        })}
      </div>

      {/* Mobile: show only current step */}
      <div className="sm:hidden text-center mb-2">
        <span className="text-xs font-medium text-teal-700">
          {formatLabel(currentStep)}
          {stepNames?.[currentStep - 1] && (
            <span className="text-gray-500 mr-1">
              {' '}
              — {stepNames[currentStep - 1]}
            </span>
          )}
        </span>
      </div>

      {/* Progress bar container with markers */}
      <div className="relative">
        {/* Track */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 rounded-full"
            initial={{
              width: `${Math.max(((currentStep - 1) / totalSteps) * 100, 0)}%`,
            }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: animationDuration, ease: 'easeInOut' }}
          />
        </div>

        {/* Step markers — positioned on top of the track */}
        <div className="absolute inset-0 flex justify-between items-center">
          {steps.map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isPending = step > currentStep;

            return (
              <motion.div
                key={step}
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 border-teal-500 text-white shadow-md'
                    : isCurrent
                      ? 'bg-gradient-to-br from-teal-500 via-orange-500 to-amber-500 border-orange-400 text-white shadow-lg'
                      : 'bg-white border-gray-300 text-gray-500'
                }`}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span>{step}</span>
                )}

                {/* Pulse ring for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-teal-400"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
