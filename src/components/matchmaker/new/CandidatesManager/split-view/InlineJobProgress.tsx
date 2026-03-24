'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';

interface InlineJobProgressProps {
  progress: number;
  progressMessage: string;
  method: SearchMethod;
  onCancel: () => void;
}

const InlineJobProgress: React.FC<InlineJobProgressProps> = ({
  progress,
  progressMessage,
  method,
  onCancel,
}) => {
  const isVector = method === 'vector';
  const bgClass = isVector ? 'bg-blue-50' : 'bg-purple-50';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('rounded-lg p-3 border', bgClass)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2
            className={cn(
              'w-4 h-4 animate-spin',
              isVector ? 'text-blue-600' : 'text-purple-600'
            )}
          />
          <span className="text-sm font-medium text-gray-700">
            {progressMessage || 'מעבד...'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="relative">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{progress}%</span>
        <span>רץ ברקע - ניתן להמשיך לעבוד</span>
      </div>
    </motion.div>
  );
};

export default InlineJobProgress;
