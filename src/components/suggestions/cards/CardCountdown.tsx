// src/components/suggestions/cards/CardCountdown.tsx
// Countdown timer + unread indicator for suggestion cards

'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardCountdownProps {
  deadline: Date | string;
  locale: 'he' | 'en';
  className?: string;
}

const CardCountdown: React.FC<CardCountdownProps> = ({
  deadline,
  locale,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        total: diff,
      });
    };

    calc();
    const interval = setInterval(calc, 60_000); // Update every minute
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 12;
  const isCritical = timeLeft.days === 0 && timeLeft.hours < 3;

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return locale === 'he'
        ? `נותרו ${timeLeft.days} ימים`
        : `${timeLeft.days} days left`;
    }
    if (timeLeft.hours > 0) {
      return locale === 'he'
        ? `נותרו ${timeLeft.hours} שעות`
        : `${timeLeft.hours}h left`;
    }
    return locale === 'he'
      ? `נותרו ${timeLeft.minutes} דקות`
      : `${timeLeft.minutes}m left`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        isCritical
          ? 'bg-red-50 text-red-700 border border-red-200'
          : isUrgent
            ? 'bg-orange-50 text-orange-700 border border-orange-200'
            : 'bg-blue-50 text-blue-600 border border-blue-100',
        className
      )}
    >
      {isCritical ? (
        <AlertTriangle className="w-3 h-3 animate-pulse" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      <span>{formatTime()}</span>
    </div>
  );
};

export default CardCountdown;
