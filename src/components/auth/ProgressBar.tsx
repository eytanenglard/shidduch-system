// src/components/auth/ProgressBar.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  locale: 'he' | 'en';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepLabel,
  locale,
}) => {
  const percentage = (currentStep / totalSteps) * 100;
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full relative" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Step labels */}
      <div className="flex justify-between mb-2">
        {steps.map((step) => (
          <div
            key={step}
            className={`text-xs font-medium transition-colors duration-300 ${
              step <= currentStep ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {stepLabel.replace('{{step}}', step.toString())}
          </div>
        ))}
      </div>

      {/* Progress bar track */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* UPDATED: Animated progress fill (Teal -> Orange -> Amber) */}
        <motion.div
          className="h-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500"
          initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step markers */}
      <div className="relative flex justify-between mt-1">
        {steps.map((step) => (
          <motion.div
            key={step}
            className={`w-6 h-6 rounded-full flex items-center justify-center -mt-4 z-10 transition-all duration-300
              ${
                step <= currentStep
                  // UPDATED: Marker Color
                  ? "bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 shadow-md text-white"
                  : "bg-white border-2 border-gray-300 text-gray-500"
              }`}
            initial={{ scale: step === currentStep ? 0.8 : 1 }}
            animate={{ scale: step === currentStep ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs font-semibold">{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;