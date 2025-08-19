"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  // Calculate percentage
  const percentage = (currentStep / totalSteps) * 100;

  // Generate step markers
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full relative">
      {/* Step labels */}
      <div className="flex justify-between mb-2">
        {steps.map((step) => (
          <div
            key={step}
            className={`text-xs font-medium transition-colors duration-300 ${
              step <= currentStep ? "text-gray-800" : "text-gray-400"
            }`}
          >
            שלב {step}
          </div>
        ))}
      </div>

      {/* Progress bar track */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-pink-500"
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
                  ? "bg-gradient-to-r from-cyan-500 to-pink-500 shadow-md text-white"
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
