// HanukkahCountdown.tsx
// קומפוננטת ספירה לאחור לקמפיין חנוכה - NeshamaTech
// משתלבת עם העיצוב הקיים של דף ההפניות

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, AlertTriangle, PartyPopper } from 'lucide-react';

// ================== Configuration ==================
const CAMPAIGN_CONFIG = {
  // תאריך סיום הקמפיין - מוצאי חנוכה (אחרי הנר השמיני)
  // חנוכה 2025: 14-22 בדצמבר, הקמפיין נגמר ב-22 בחצות
  endDate: new Date('2025-12-22T23:59:59'),
  // תאריך התחלה (לחישוב אחוז התקדמות)
  startDate: new Date('2025-12-14T17:00:00'),
};

// ================== Types ==================
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownProps {
  locale?: string;
  variant?: 'hero' | 'compact' | 'floating';
  className?: string;
  onComplete?: () => void;
}

// ================== Content ==================
const content = {
  he: {
    title: 'הקמפיין מסתיים בעוד',
    urgentTitle: '⚡ ממהרים! נשארו פחות מ-24 שעות',
    veryUrgentTitle: '🔥 שעות אחרונות!',
    ended: 'הקמפיין הסתיים!',
    endedSubtitle: 'תודה לכל המשתתפים - בקרוב נכריז על המנצחים!',
    days: 'ימים',
    hours: 'שעות',
    minutes: 'דקות',
    seconds: 'שניות',
    day: 'יום',
    hour: 'שעה',
    minute: 'דקה',
    second: 'שנייה',
    hurry: 'כל רגע חשוב - שתפו עכשיו!',
    progress: 'התקדמות הקמפיין',
  },
  en: {
    title: 'Campaign ends in',
    urgentTitle: '⚡ Hurry! Less than 24 hours left',
    veryUrgentTitle: '🔥 Final hours!',
    ended: 'Campaign ended!',
    endedSubtitle: 'Thank you to all participants - winners announced soon!',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    day: 'day',
    hour: 'hour',
    minute: 'minute',
    second: 'second',
    hurry: 'Every moment counts - share now!',
    progress: 'Campaign progress',
  },
};

// ================== Helper Functions ==================
const calculateTimeLeft = (): TimeLeft => {
  const now = new Date().getTime();
  const end = CAMPAIGN_CONFIG.endDate.getTime();
  const difference = end - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference,
  };
};

const calculateProgress = (): number => {
  const now = new Date().getTime();
  const start = CAMPAIGN_CONFIG.startDate.getTime();
  const end = CAMPAIGN_CONFIG.endDate.getTime();
  const total = end - start;
  const elapsed = now - start;
  return Math.min(Math.max((elapsed / total) * 100, 0), 100);
};

// ================== Animated Number Component ==================
const AnimatedNumber: React.FC<{ value: number; label: string }> = ({
  value,
  label,
}) => {
  const prevValue = useRef(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: -20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
              min-w-[3.5rem] h-14 md:min-w-[4rem] md:h-16
              bg-white/90 backdrop-blur-sm rounded-xl
              flex items-center justify-center
              shadow-lg border border-white/60
              ${isAnimating ? 'ring-2 ring-teal-400/50' : ''}
            `}
          >
            <span className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-teal-600 to-orange-500 bg-clip-text text-transparent">
              {value.toString().padStart(2, '0')}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-xs md:text-sm text-gray-600 mt-1.5 font-medium">
        {label}
      </span>
    </div>
  );
};

// ================== Flame Separator ==================
const FlameSeparator: React.FC = () => (
  <div className="flex flex-col items-center justify-center px-1 md:px-2">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
    </motion.div>
  </div>
);

// ================== Progress Bar ==================
const ProgressBar: React.FC<{ progress: number; locale: string }> = ({
  progress,
  locale,
}) => {
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he : content.en;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{t.progress}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-orange-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ================== Main Hero Countdown ==================
export const HanukkahCountdown: React.FC<CountdownProps> = ({
  locale = 'he',
  variant = 'hero',
  className = '',
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [progress, setProgress] = useState(calculateProgress());
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he : content.en;

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      setProgress(calculateProgress());

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Campaign ended
  if (timeLeft.total <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          bg-gradient-to-br from-amber-50 via-white to-orange-50 
          rounded-3xl p-6 md:p-8 shadow-xl border border-amber-200
          text-center ${className}
        `}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <PartyPopper className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        </motion.div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {t.ended}
        </h3>
        <p className="text-gray-600">{t.endedSubtitle}</p>
      </motion.div>
    );
  }

  // Determine urgency level
  const isUrgent = timeLeft.days === 0;
  const isVeryUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  // Get title based on urgency
  const getTitle = () => {
    if (isVeryUrgent) return t.veryUrgentTitle;
    if (isUrgent) return t.urgentTitle;
    return t.title;
  };

  // Get plural/singular labels
  const getLabel = (value: number, singular: string, plural: string) => {
    return value === 1 ? singular : plural;
  };

  // ================== Hero Variant ==================
  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden
          bg-white/80 backdrop-blur-xl rounded-3xl 
          p-6 md:p-8 shadow-2xl border border-white/60
          ${isUrgent ? 'ring-2 ring-orange-300 ring-offset-2' : ''}
          ${className}
        `}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-transparent rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3
                ${
                  isVeryUrgent
                    ? 'bg-red-100 text-red-700'
                    : isUrgent
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-teal-100 text-teal-700'
                }
              `}
              animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isUrgent ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">{getTitle()}</span>
            </motion.div>
          </div>

          {/* Countdown Grid */}
          <div
            className="flex items-center justify-center gap-2 md:gap-3"
            dir="ltr"
          >
            <AnimatedNumber
              value={timeLeft.days}
              label={getLabel(timeLeft.days, t.day, t.days)}
            />
            <FlameSeparator />
            <AnimatedNumber
              value={timeLeft.hours}
              label={getLabel(timeLeft.hours, t.hour, t.hours)}
            />
            <FlameSeparator />
            <AnimatedNumber
              value={timeLeft.minutes}
              label={getLabel(timeLeft.minutes, t.minute, t.minutes)}
            />
            <FlameSeparator />
            <AnimatedNumber
              value={timeLeft.seconds}
              label={getLabel(timeLeft.seconds, t.second, t.seconds)}
            />
          </div>

          {/* Progress Bar */}
          <ProgressBar progress={progress} locale={locale} />

          {/* Urgency Message */}
          {isUrgent && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-orange-600 font-medium text-sm mt-4"
            >
              {t.hurry}
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  // ================== Compact Variant ==================
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          inline-flex items-center gap-3 
          bg-white/80 backdrop-blur-sm rounded-2xl 
          px-5 py-3 shadow-lg border border-white/60
          ${isUrgent ? 'ring-2 ring-orange-300' : ''}
          ${className}
        `}
        dir="ltr"
      >
        <div className="flex items-center gap-1">
          {isUrgent ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </motion.div>
          ) : (
            <Clock className="w-5 h-5 text-teal-600" />
          )}
        </div>

        <div className="flex items-center gap-1.5 font-mono font-bold text-gray-800">
          {timeLeft.days > 0 && (
            <>
              <span className="bg-gray-100 px-2 py-1 rounded-lg">
                {timeLeft.days}
                <span className="text-xs text-gray-500 mr-0.5">d</span>
              </span>
            </>
          )}
          <span className="bg-gray-100 px-2 py-1 rounded-lg">
            {timeLeft.hours.toString().padStart(2, '0')}
            <span className="text-xs text-gray-500">h</span>
          </span>
          <span className="text-gray-400">:</span>
          <span className="bg-gray-100 px-2 py-1 rounded-lg">
            {timeLeft.minutes.toString().padStart(2, '0')}
            <span className="text-xs text-gray-500">m</span>
          </span>
          <span className="text-gray-400">:</span>
          <span className="bg-gray-100 px-2 py-1 rounded-lg">
            {timeLeft.seconds.toString().padStart(2, '0')}
            <span className="text-xs text-gray-500">s</span>
          </span>
        </div>
      </motion.div>
    );
  }

  // ================== Floating Variant ==================
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6
          md:w-auto z-50
          ${className}
        `}
      >
        <div
          className={`
            flex items-center justify-between md:justify-start gap-4
            bg-white/95 backdrop-blur-xl rounded-2xl 
            px-5 py-4 shadow-2xl border border-white/60
            ${isUrgent ? 'ring-2 ring-orange-400' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${isUrgent ? 'bg-orange-100' : 'bg-teal-100'}
            `}
            >
              {isUrgent ? (
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                </motion.div>
              ) : (
                <Clock className="w-5 h-5 text-teal-600" />
              )}
            </div>
            <div className={isHebrew ? 'text-right' : 'text-left'}>
              <div className="text-xs text-gray-500 font-medium">
                {isUrgent
                  ? isHebrew
                    ? 'שעות אחרונות!'
                    : 'Final hours!'
                  : t.title}
              </div>
              <div className="font-mono font-bold text-gray-800" dir="ltr">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {timeLeft.hours.toString().padStart(2, '0')}:
                {timeLeft.minutes.toString().padStart(2, '0')}:
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Mini flame animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            🕯️
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return null;
};

// ================== Named Exports for Different Use Cases ==================
export const CountdownHero = (props: Omit<CountdownProps, 'variant'>) => (
  <HanukkahCountdown {...props} variant="hero" />
);

export const CountdownCompact = (props: Omit<CountdownProps, 'variant'>) => (
  <HanukkahCountdown {...props} variant="compact" />
);

export const CountdownFloating = (props: Omit<CountdownProps, 'variant'>) => (
  <HanukkahCountdown {...props} variant="floating" />
);

export default HanukkahCountdown;
