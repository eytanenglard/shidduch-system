// src/components/profile/sections/neshma-insight/InsightLockedState.tsx

'use client';

import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { COMPLETION_THRESHOLD } from '@/lib/constants/questionnaireConfig';

// =====================================================
// Types
// =====================================================

interface InsightLockedStateProps {
  locale: 'he' | 'en';
  completionPercentage: number;
  dict: {
    lockedTitle?: string;
    lockedDescription?: string;
  };
}

// =====================================================
// Component
// =====================================================

export const InsightLockedState: React.FC<InsightLockedStateProps> = ({
  locale,
  completionPercentage,
  dict,
}) => {
  const isHe = locale === 'he';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="my-6"
    >
      <div className="relative group opacity-60">
        <div className="relative bg-gradient-to-br from-slate-50/50 via-teal-50/50 to-orange-50/50 rounded-2xl p-4 shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-400 via-teal-400 to-orange-400 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -end-1 bg-white rounded-full p-1 shadow-md">
                <Lock className="w-3 h-3 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-700">
                {dict.lockedTitle || (isHe ? 'התמונה המלאה - נעולה' : 'Full Picture - Locked')}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {dict.lockedDescription
                  ? dict.lockedDescription.replace('{{percentage}}', completionPercentage.toString())
                  : isHe
                    ? `השלם את הפרופיל ל-${COMPLETION_THRESHOLD}% כדי לפתוח (כרגע: ${completionPercentage}%)`
                    : `Complete to ${COMPLETION_THRESHOLD}% to unlock (Currently: ${completionPercentage}%)`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
