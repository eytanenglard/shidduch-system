// src/components/suggestions/cards/CardCountdown.tsx
// Countdown timer + unread indicator for suggestion cards

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownDict {
  daysLeft: string;
  hoursLeft: string;
  minutesLeft: string;
  expired: string;
}

interface CardCountdownProps {
  deadline: Date | string;
  locale: 'he' | 'en';
  dict?: CountdownDict;
  className?: string;
}

const CardCountdown: React.FC<CardCountdownProps> = ({
  deadline,
  locale,
  dict,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    total: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
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
    intervalRef.current = setInterval(calc, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline]);

  // Expired state
  if (isExpired) {
    const expiredLabel = dict?.expired ?? (locale === 'he' ? 'פג תוקף' : 'Expired');
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
          'bg-red-50 text-red-700 border border-red-200',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>{expiredLabel}</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 12;
  const isCritical = timeLeft.days === 0 && timeLeft.hours < 3;

  const formatTime = () => {
    if (timeLeft.days > 0) {
      const template = dict?.daysLeft;
      return template
        ? template.replace('{{count}}', String(timeLeft.days))
        : locale === 'he'
          ? `נותרו ${timeLeft.days} ימים`
          : `${timeLeft.days} days left`;
    }
    if (timeLeft.hours > 0) {
      const template = dict?.hoursLeft;
      return template
        ? template.replace('{{count}}', String(timeLeft.hours))
        : locale === 'he'
          ? `נותרו ${timeLeft.hours} שעות`
          : `${timeLeft.hours}h left`;
    }
    const template = dict?.minutesLeft;
    return template
      ? template.replace('{{count}}', String(timeLeft.minutes))
      : locale === 'he'
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
