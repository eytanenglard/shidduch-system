'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';

interface JobCompleteBannerProps {
  matchesCount: number;
  targetName: string;
  method: SearchMethod;
  onViewResults: () => void;
  onDismiss: () => void;
}

const JobCompleteBanner: React.FC<JobCompleteBannerProps> = ({
  matchesCount,
  targetName,
  method,
  onViewResults,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <span className="font-medium text-green-800">
              נמצאו {matchesCount} התאמות עבור {targetName}!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onViewResults}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Sparkles className="w-4 h-4 ml-1" />
            הצג
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCompleteBanner;
