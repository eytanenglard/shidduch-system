'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ScoreBreakdown } from './types';

interface ScoreBreakdownDisplayProps {
  breakdown: ScoreBreakdown;
  className?: string;
}

const ScoreBreakdownDisplay: React.FC<ScoreBreakdownDisplayProps> = ({
  breakdown,
  className,
}) => {
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 35, color: 'bg-purple-500' },
    {
      key: 'careerFamily',
      label: 'קריירה-משפחה',
      max: 15,
      color: 'bg-blue-500',
    },
    { key: 'lifestyle', label: 'סגנון חיים', max: 15, color: 'bg-green-500' },
    { key: 'ambition', label: 'שאפתנות', max: 12, color: 'bg-orange-500' },
    { key: 'communication', label: 'תקשורת', max: 12, color: 'bg-cyan-500' },
    { key: 'values', label: 'ערכים', max: 11, color: 'bg-pink-500' },
  ];

  return (
    <div className={cn('space-y-1.5', className)}>
      {categories.map((cat) => {
        const value = breakdown[cat.key as keyof ScoreBreakdown] || 0;
        const percentage = (value / cat.max) * 100;
        return (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 truncate">
              {cat.label}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full rounded-full', cat.color)}
              />
            </div>
            <span className="text-xs text-gray-500 w-10 text-right">
              {value}/{cat.max}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ScoreBreakdownDisplay;
