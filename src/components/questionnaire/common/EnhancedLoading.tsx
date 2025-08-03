// src/components/questionnaire/common/EnhancedLoading.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Heart,
  User,
  Users,
  Scroll,
  UserCheck,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// World configuration with enhanced theming
const worldsConfig = {
  PERSONALITY: {
    icon: User,
    label: 'אישיות',
    description: 'מגלים מי אני באמת',
    color: 'from-sky-400 to-blue-500',
    bgGradient: 'from-sky-50 to-blue-50',
    textColor: 'text-sky-700',
  },
  VALUES: {
    icon: Heart,
    label: 'ערכים',
    description: 'הבסיס למשמעות בחיים',
    color: 'from-rose-400 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50',
    textColor: 'text-rose-700',
  },
  RELATIONSHIP: {
    icon: Users,
    label: 'זוגיות',
    description: 'החזון לקשר משמעותי',
    color: 'from-purple-400 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50',
    textColor: 'text-purple-700',
  },
  PARTNER: {
    icon: UserCheck,
    label: 'פרטנר',
    description: 'מי מתאים לי באמת',
    color: 'from-teal-400 to-emerald-500',
    bgGradient: 'from-teal-50 to-emerald-50',
    textColor: 'text-teal-700',
  },
  RELIGION: {
    icon: Scroll,
    label: 'דת ומסורת',
    description: 'השורשים והמורשת',
    color: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
    textColor: 'text-amber-700',
  },
};

// Loading phases with meaningful messages
const loadingPhases = [
  {
    id: 1,
    title: 'מכינים את המסע שלך...',
    subtitle: 'טוענים את השאלון המותאם אישית',
    duration: 1500,
    icon: Sparkles,
  },
  {
    id: 2,
    title: 'בודקים את ההתקדמות הקיימת...',
    subtitle: 'מאחזרים את התשובות השמורות',
    duration: 1200,
    icon: CheckCircle,
  },
  {
    id: 3,
    title: 'מתאמים את העולמות...',
    subtitle: 'יוצרים חוויה מותאמת למצבך',
    duration: 1000,
    icon: Heart,
  },
  {
    id: 4,
    title: 'כמעט מוכן!',
    subtitle: 'סיכום אחרון לפני התחלה',
    duration: 800,
    icon: Clock,
  },
];

// Inspirational quotes that change during loading
const inspirationalQuotes = [
  'הזיווג הוא לא מציאת האדם המושלם, אלא מציאת האדם שמושלם עבורך',
  'כל אדם הוא עולם שלם, ובמפגש בין שני עולמות נוצר קסם',
  'השאלון הזה הוא הצעד הראשון במסע למציאת הנשמה התאומה שלך',
  'ככל שתכיר את עצמך יותר, כך תוכל למצוא את מי שמשלים אותך',
];

interface EnhancedLoadingProps {
  className?: string;
  onComplete?: () => void;
  loadingText?: string;
  showWorldsPreview?: boolean;
  estimatedTime?: number; // in seconds
  userName?: string;
  hasExistingProgress?: boolean;
}

export default function EnhancedLoading({
  className = '',
  onComplete,
  loadingText = 'טוען את השאלון...',
  showWorldsPreview = true,
  estimatedTime = 4,
  userName,
  hasExistingProgress = false,
}: EnhancedLoadingProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [animatedWorlds, setAnimatedWorlds] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);

  // Calculate total duration based on phases
  const totalDuration = loadingPhases.reduce(
    (sum, phase) => sum + phase.duration,
    0
  );

  useEffect(() => {
    // Enable skip after 3 seconds
    const skipTimer = setTimeout(() => {
      setAllowSkip(true);
    }, 3000);

    // Progress simulation with phases
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;

      // Calculate which phase we should be in
      let phaseElapsed = 0;
      let newPhase = 0;

      for (let i = 0; i < loadingPhases.length; i++) {
        if (elapsed <= phaseElapsed + loadingPhases[i].duration) {
          newPhase = i;
          break;
        }
        phaseElapsed += loadingPhases[i].duration;
      }

      setCurrentPhase(newPhase);

      // Update progress
      const progressPercentage = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(progressPercentage);

      // Animate worlds appearing
      if (progressPercentage > 20 && showWorldsPreview) {
        const worldKeys = Object.keys(worldsConfig);
        const worldIndex = Math.floor((progressPercentage - 20) / 16); // Spread over 80% of loading
        if (worldIndex < worldKeys.length) {
          setAnimatedWorlds(
            (prev) => new Set([...prev, worldKeys[worldIndex]])
          );
        }
      }

      // Complete loading
      if (elapsed >= totalDuration) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 500);
        clearInterval(interval);
      }
    }, 50);

    // Quote rotation
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % inspirationalQuotes.length);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearInterval(quoteInterval);
      clearTimeout(skipTimer);
    };
  }, [onComplete, totalDuration, showWorldsPreview]);

  const handleSkip = () => {
    setIsComplete(true);
    onComplete?.();
  };

  const currentPhaseData = loadingPhases[currentPhase];
  const IconComponent = currentPhaseData?.icon || Loader2;

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4',
        className
      )}
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Header with Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Main Logo/Brand */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold shadow-lg mb-4"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 10px 25px rgba(59, 130, 246, 0.3)',
                '0 15px 35px rgba(59, 130, 246, 0.4)',
                '0 10px 25px rgba(59, 130, 246, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Heart className="w-8 h-8" />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {hasExistingProgress ? 'ברוך שובך' : 'ברוך הבא'}{' '}
            {userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-lg text-slate-600">
            {hasExistingProgress
              ? 'ממשיכים את המסע למציאת הזיווג המושלם'
              : 'מתחילים את המסע למציאת הזיווג המושלם'}
          </p>
        </motion.div>

        {/* Main Loading Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Current Phase Indicator */}
            <motion.div
              className="text-center mb-8"
              key={currentPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <IconComponent className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                {currentPhaseData?.title}
              </h2>
              <p className="text-slate-600">{currentPhaseData?.subtitle}</p>
            </motion.div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-slate-600 mb-2">
                <span>התקדמות</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress
                value={progress}
                className="h-3 bg-slate-200"
                indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
              />
            </div>

            {/* Worlds Preview */}
            {showWorldsPreview && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-slate-700 text-center mb-6">
                  העולמות שתעבור במסע
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(worldsConfig).map(([key, world], index) => {
                    const Icon = world.icon;
                    const isAnimated = animatedWorlds.has(key);

                    return (
                      <motion.div
                        key={key}
                        className="text-center"
                        initial={{ opacity: 0.3, scale: 0.8 }}
                        animate={{
                          opacity: isAnimated ? 1 : 0.3,
                          scale: isAnimated ? 1 : 0.8,
                        }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div
                          className={cn(
                            'relative mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-500',
                            isAnimated
                              ? `bg-gradient-to-br ${world.color} text-white shadow-lg`
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          <Icon className="w-7 h-7" />
                          {isAnimated && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-white/30"
                              initial={{ scale: 1, opacity: 0.5 }}
                              animate={{ scale: 1.2, opacity: 0 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <div
                          className={cn(
                            'text-xs font-medium transition-colors duration-500',
                            isAnimated ? world.textColor : 'text-slate-400'
                          )}
                        >
                          {world.label}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inspirational Quote */}
            <motion.div
              className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6"
              key={currentQuote}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-slate-700 italic text-lg leading-relaxed">
                “{inspirationalQuotes[currentQuote]}”
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {allowSkip && !isComplete && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="px-6 py-2 text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  דלג לשאלון
                </Button>
              )}

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={handleSkip}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium"
                  >
                    בוא נתחיל!
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Loading Indicators */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-1">
                {loadingPhases.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index <= currentPhase ? 'bg-blue-500' : 'bg-slate-300'
                    )}
                    animate={
                      index === currentPhase ? { scale: [1, 1.2, 1] } : {}
                    }
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-6 text-sm text-slate-500"
        >
          <p>מערכת שידוכים מתקדמת • פרטיות מוחלטת • התאמה מדעית</p>
        </motion.div>
      </div>
    </div>
  );
}
