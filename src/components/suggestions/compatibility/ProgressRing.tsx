// src/components/suggestions/compatibility/ProgressRing.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const getScoreGradientId = (score: number) => {
  if (score >= 85) return 'ring-excellent';
  if (score >= 70) return 'ring-good';
  if (score >= 55) return 'ring-moderate';
  return 'ring-challenging';
};

const gradients: Record<string, [string, string]> = {
  'ring-excellent': ['#14b8a6', '#10b981'], // teal-500 → emerald-500
  'ring-good': ['#14b8a6', '#10b981'],
  'ring-moderate': ['#f97316', '#f59e0b'], // orange-500 → amber-500
  'ring-challenging': ['#f43f5e', '#ef4444'], // rose-500 → red-500
};

const getScoreTextColor = (score: number) => {
  if (score >= 70) return 'text-teal-600';
  if (score >= 55) return 'text-orange-600';
  return 'text-rose-600';
};

const ProgressRing: React.FC<ProgressRingProps> = ({
  score,
  size = 80,
  strokeWidth = 6,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradientId = getScoreGradientId(score);
  const [color1, color2] = gradients[gradientId];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-lg font-bold', getScoreTextColor(score))}>
          {score}%
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
