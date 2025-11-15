// src/components/questionnaire/common/StandardizedLoadingSpinner.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandardizedLoadingSpinnerProps {
  text?: string;
  subtext?: string;
  layout?: 'fullscreen' | 'inline';
  className?: string;
}

export default function StandardizedLoadingSpinner({
  text = 'טוען...',
  subtext,
  layout = 'fullscreen',
  className,
}: StandardizedLoadingSpinnerProps) {
  const containerClasses = {
    fullscreen: 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50 p-4',
    inline: 'flex flex-col items-center justify-center w-full my-8 p-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(containerClasses[layout], className)}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
        <Loader2 className="relative h-16 w-16 animate-spin text-teal-600" />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-xl font-semibold text-gray-700 text-center"
      >
        {text}
      </motion.p>
      {subtext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center gap-2 text-sm text-gray-500"
        >
          <Sparkles className="w-4 h-4" />
          <span>{subtext}</span>
        </motion.div>
      )}
    </motion.div>
  );
}