// HanukkahCountdown.tsx
// קומפוננטת ספירה לאחור לקמפיין חנוכה - NeshamaTech
// עיצוב מותאם לסגנון הדף עם תמיכה מלאה בעברית

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Sparkles, Gift } from 'lucide-react';

// ================== Configuration ==================
const CAMPAIGN_CONFIG = {
  // תאריך סיום הקמפיין - 22.12.2025 בשעה 17:00 (הדלקת נר אחרון)
  endDate: new Date('2025-12-22T17:00:00'),
  // תאריך התחלה - 14.12.2025 בשעה 17:00 (הדלקת נר ראשון)
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
    subtitle: 'כל שיתוף יכול להיות ההתחלה של סיפור אהבה',
    urgentTitle: 'ממהרים! נשארו פחות מ-24 שעות',
    veryUrgentTitle: 'שעות אחרונות!',
    ended: 'הקמפיין הסתיים!',
    endedSubtitle: 'תודה לכל המשתתפים - בקרוב נכריז על הזוכים!',
    days: 'ימים',
    hours: 'שעות',
    minutes: 'דקות',
    seconds: 'שניות',
    day: 'יום',
    hour: 'שעה',
    minute: 'דקה',
    second: 'שנייה',
    hurry: 'כל רגע חשוב - שתפו עכשיו!',
    dontMiss: 'אל תפספסו',
    floatingText: 'נשאר זמן',
  },
  en: {
    title: 'Campaign ends in',
    subtitle: 'Every share could be the start of a love story',
    urgentTitle: 'Hurry! Less than 24 hours left',
    veryUrgentTitle: 'Final hours!',
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
    dontMiss: "Don't miss out",
    floatingText: 'Time left',
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

// ================== Time Unit Box ==================
interface TimeUnitProps {
  value: number;
  label: string;
  isUrgent?: boolean;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label, isUrgent }) => {
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
      <motion.div
        className={`
          relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
          bg-white/80 backdrop-blur-sm 
          rounded-2xl shadow-lg
          border border-white/60
          flex items-center justify-center
          overflow-hidden
          ${isAnimating ? 'ring-2 ring-teal-400/50 ring-offset-1' : ''}
          ${isUrgent ? 'border-orange-200' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        {/* רקע גרדיאנט עדין */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-transparent to-orange-50/50" />

        {/* אפקט זוהר כשמתעדכן */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-teal-200/30 to-orange-200/30 rounded-2xl"
            />
          )}
        </AnimatePresence>

        {/* המספר */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -30, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`
              relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold
              bg-gradient-to-br bg-clip-text text-transparent
              ${
                isUrgent
                  ? 'from-orange-500 via-red-500 to-rose-500'
                  : 'from-teal-600 via-teal-500 to-orange-500'
              }
            `}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>

        {/* להבה קטנה בפינה */}
        {isUrgent && (
          <motion.div
            className="absolute -top-1 -right-1 text-lg"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🔥
          </motion.div>
        )}
      </motion.div>

      {/* תווית */}
      <span
        className={`
        mt-2 text-sm sm:text-base font-medium text-gray-600
        ${isUrgent ? 'text-orange-600' : ''}
      `}
      >
        {label}
      </span>
    </div>
  );
};

// ================== Separator ==================
const Separator: React.FC<{ isUrgent?: boolean }> = ({ isUrgent }) => (
  <div className="flex flex-col items-center justify-center h-16 sm:h-20 md:h-24 px-1 sm:px-2">
    <motion.div
      animate={{
        opacity: [0.4, 1, 0.4],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Flame
        className={`w-5 h-5 sm:w-6 sm:h-6 ${isUrgent ? 'text-orange-400' : 'text-teal-400'}`}
      />
    </motion.div>
  </div>
);

// ================== Progress Bar - Hanukkiah Style ==================
interface ProgressBarProps {
  progress: number;
  isHebrew: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isHebrew }) => {
  // חישוב כמה נרות דלוקים (1-8)
  const litCandles = Math.min(Math.ceil((progress / 100) * 8), 8);

  return (
    <div className="mt-6">
      {/* מיני חנוכייה כ-progress */}
      <div
        className="flex justify-center items-end gap-1.5 sm:gap-2 mb-3"
        dir="ltr"
      >
        {[...Array(8)].map((_, i) => {
          const isLit = i < litCandles;
          return (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* להבה */}
              <AnimatePresence>
                {isLit && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="mb-0.5"
                  >
                    <motion.span
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1 + Math.random() * 0.5,
                        repeat: Infinity,
                      }}
                      className="text-sm sm:text-base"
                    >
                      🔥
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* נר */}
              <div
                className={`
                  w-2.5 sm:w-3 h-8 sm:h-10 rounded-t-sm
                  transition-all duration-500
                  ${
                    isLit
                      ? 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 shadow-sm shadow-amber-200'
                      : 'bg-gradient-to-b from-gray-200 to-gray-300'
                  }
                `}
              />
            </motion.div>
          );
        })}
      </div>

      {/* טקסט התקדמות */}
      <div className="text-center">
        <span className="text-xs sm:text-sm text-gray-500">
          {isHebrew
            ? `${litCandles} מתוך 8 ימי חנוכה עברו`
            : `${litCandles} of 8 Hanukkah days passed`}
        </span>
      </div>
    </div>
  );
};

// ================== Campaign Ended State ==================
const CampaignEnded: React.FC<{ isHebrew: boolean; className?: string }> = ({
  isHebrew,
  className,
}) => {
  const t = isHebrew ? content.he : content.en;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-gradient-to-br from-amber-50 via-white to-orange-50 
        rounded-3xl p-8 shadow-xl border border-amber-200/60
        text-center ${className}
      `}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.6, repeat: 3 }}
        className="text-5xl mb-4"
      >
        🎉
      </motion.div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.ended}</h3>
      <p className="text-gray-600">{t.endedSubtitle}</p>

      {/* חנוכייה מלאה */}
      <div className="flex justify-center items-end gap-1.5 mt-6" dir="ltr">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              className="text-base"
            >
              🔥
            </motion.span>
            <div className="w-2.5 h-8 rounded-t-sm bg-gradient-to-b from-amber-200 to-amber-400" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ================== Hero Variant ==================
const HeroCountdown: React.FC<
  CountdownProps & { timeLeft: TimeLeft; progress: number }
> = ({ locale = 'he', className = '', timeLeft, progress }) => {
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he : content.en;

  const isUrgent = timeLeft.days === 0;
  const isVeryUrgent = timeLeft.days === 0 && timeLeft.hours < 6;

  const getTitle = () => {
    if (isVeryUrgent) return t.veryUrgentTitle;
    if (isUrgent) return t.urgentTitle;
    return t.title;
  };

  const getLabel = (value: number, singular: string, plural: string) => {
    return value === 1 ? singular : plural;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden
        bg-white/70 backdrop-blur-xl rounded-3xl 
        p-6 sm:p-8 shadow-xl border border-white/60
        ${isUrgent ? 'ring-2 ring-orange-300/50 ring-offset-2 ring-offset-transparent' : ''}
        ${className}
      `}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      {/* רקע דקורטיבי */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-teal-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl" />
        {/* נקודות רקע */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10">
        {/* כותרת */}
        <div className="text-center mb-6">
          <motion.div
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3
              ${
                isVeryUrgent
                  ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700'
                  : isUrgent
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700'
                    : 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700'
              }
            `}
            animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isVeryUrgent ? (
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🔥
              </motion.span>
            ) : isUrgent ? (
              <Sparkles className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">{getTitle()}</span>
            {isVeryUrgent && (
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
              >
                🔥
              </motion.span>
            )}
          </motion.div>

          {!isUrgent && <p className="text-gray-500 text-sm">{t.subtitle}</p>}
        </div>

        {/* הספירה לאחור - תמיד LTR כדי שהמספרים יהיו בסדר הנכון */}
        <div
          className="flex items-start justify-center gap-1 sm:gap-2"
          dir="ltr"
        >
          <TimeUnit
            value={timeLeft.days}
            label={getLabel(timeLeft.days, t.day, t.days)}
            isUrgent={isUrgent}
          />
          <Separator isUrgent={isUrgent} />
          <TimeUnit
            value={timeLeft.hours}
            label={getLabel(timeLeft.hours, t.hour, t.hours)}
            isUrgent={isUrgent}
          />
          <Separator isUrgent={isUrgent} />
          <TimeUnit
            value={timeLeft.minutes}
            label={getLabel(timeLeft.minutes, t.minute, t.minutes)}
            isUrgent={isUrgent}
          />
          <Separator isUrgent={isUrgent} />
          <TimeUnit
            value={timeLeft.seconds}
            label={getLabel(timeLeft.seconds, t.second, t.seconds)}
            isUrgent={isUrgent}
          />
        </div>

      

        {/* הודעת דחיפות */}
        {isUrgent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <span
              className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r from-orange-500 to-amber-500 text-white
              text-sm font-bold shadow-lg
            `}
            >
              <Gift className="w-4 h-4" />
              {t.hurry}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ================== Compact Variant ==================
// ================== Compact Variant ==================
const CompactCountdown: React.FC<CountdownProps & { timeLeft: TimeLeft }> = ({
  locale = 'he',
  className = '',
  timeLeft,
}) => {
  const isHebrew = locale === 'he';
  const isUrgent = timeLeft.days === 0;

  // פורמט הזמן
  const formatTime = () => {
const parts: string[] = [];    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days}${isHebrew ? ' ימים' : 'd'}`);
    }
    parts.push(
      `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
    );
    return parts.join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        inline-flex items-center gap-2
        bg-white/90 backdrop-blur-sm rounded-full
        px-4 py-2 shadow-md border border-gray-100
        ${className}
      `}
    >
      {/* אייקון */}
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center text-sm
        ${isUrgent 
          ? 'bg-orange-100' 
          : 'bg-teal-100'
        }
      `}>
        {isUrgent ? '🔥' : '⏰'}
      </div>

      {/* טקסט */}
      <span className="text-xs text-gray-500">
        {isHebrew ? 'נשארו' : 'Left:'}
      </span>

      {/* זמן */}
      <span 
        className={`
          font-mono font-bold text-sm
          ${isUrgent ? 'text-orange-600' : 'text-teal-700'}
        `}
        dir="ltr"
      >
        {formatTime()}
      </span>
    </motion.div>
  );
};

// ================== Floating Variant ==================
const FloatingCountdown: React.FC<CountdownProps & { timeLeft: TimeLeft }> = ({
  locale = 'he',
  className = '',
  timeLeft,
}) => {
  const isHebrew = locale === 'he';
  const t = isHebrew ? content.he : content.en;
  const isUrgent = timeLeft.days === 0;
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={`
            fixed bottom-4 left-4 right-4 
            md:left-auto md:right-6 md:bottom-6 md:w-auto
            z-50 ${className}
          `}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          <motion.div
            className={`
              flex items-center justify-between md:justify-start gap-4
              bg-white/95 backdrop-blur-xl rounded-2xl
              px-5 py-4 shadow-2xl border border-white/60
              ${isUrgent ? 'ring-2 ring-orange-400/50' : ''}
            `}
            whileHover={{ scale: 1.01 }}
          >
            {/* אייקון + טקסט */}
            <div className="flex items-center gap-3">
              <div
                className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${
                  isUrgent
                    ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                    : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                }
                shadow-lg
              `}
              >
                {isUrgent ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Flame className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <Clock className="w-6 h-6 text-white" />
                )}
              </div>

              <div className={isHebrew ? 'text-right' : 'text-left'}>
                <div className="text-sm text-gray-500 font-medium">
                  {isUrgent
                    ? isHebrew
                      ? 'שעות אחרונות!'
                      : 'Final hours!'
                    : t.floatingText}
                </div>
                <div
                  className="font-mono font-bold text-xl text-gray-800"
                  dir="ltr"
                >
                  {timeLeft.days > 0 && (
                    <span className="text-teal-600">
                      {timeLeft.days}
                      {isHebrew ? 'י' : 'd'}{' '}
                    </span>
                  )}
                  {timeLeft.hours.toString().padStart(2, '0')}
                  <span className="text-gray-400">:</span>
                  {timeLeft.minutes.toString().padStart(2, '0')}
                  <span className="text-gray-400">:</span>
                  <motion.span
                    key={timeLeft.seconds}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </motion.span>
                </div>
              </div>
            </div>

            {/* חנוכייה מיני */}
            <div className="hidden sm:flex items-end gap-0.5" dir="ltr">
              {[...Array(8)].map((_, i) => {
                const progress = calculateProgress();
                const litCandles = Math.ceil((progress / 100) * 8);
                const isLit = i < litCandles;
                return (
                  <div key={i} className="flex flex-col items-center">
                    {isLit && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                        className="text-[10px]"
                      >
                        🔥
                      </motion.span>
                    )}
                    <div
                      className={`
                      w-1.5 h-4 rounded-t-sm
                      ${isLit ? 'bg-amber-300' : 'bg-gray-200'}
                    `}
                    />
                  </div>
                );
              })}
            </div>

            {/* כפתור סגירה */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs transition-colors shadow-sm"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ================== Main Component ==================
export const HanukkahCountdown: React.FC<CountdownProps> = ({
  locale = 'he',
  variant = 'hero',
  className = '',
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [progress, setProgress] = useState(calculateProgress());
  const isHebrew = locale === 'he';

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

  // הקמפיין הסתיים
  if (timeLeft.total <= 0) {
    return <CampaignEnded isHebrew={isHebrew} className={className} />;
  }

  // בחירת וריאנט
  switch (variant) {
    case 'compact':
      return (
        <CompactCountdown
          locale={locale}
          className={className}
          timeLeft={timeLeft}
        />
      );
    case 'floating':
      return (
        <FloatingCountdown
          locale={locale}
          className={className}
          timeLeft={timeLeft}
        />
      );
    case 'hero':
    default:
      return (
        <HeroCountdown
          locale={locale}
          className={className}
          timeLeft={timeLeft}
          progress={progress}
        />
      );
  }
};

// ================== Named Exports ==================
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
