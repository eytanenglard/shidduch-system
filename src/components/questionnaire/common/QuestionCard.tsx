// src/components/questionnaire/common/QuestionCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { VisibilityToggleButton } from '@/components/ui/VisibilityToggleButton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark,
  AlertCircle,
  HelpCircle,
  SkipForward,
  Star,
  Lightbulb,
  Save,
  Loader2,
  BookUser,
  Sparkles,
  Clock,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, QuestionDepth } from '../types/types';
import { cn } from '@/lib/utils';
import type { QuestionCardDict } from '@/types/dictionary';

// --- Props Interface ---
interface QuestionCardProps {
  question: Question;
  depth: QuestionDepth;
  isRequired?: boolean;
  onSkip?: () => void;
  onBookmark?: () => void;
  onHelp?: () => void;
  className?: string;
  validationError?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
  locale?: 'he' | 'en'; // Prop לקביעת השפה והכיווניות
  isFirstInList?: boolean;
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
  dict: QuestionCardDict;
  currentQuestionNumber?: number;
  totalQuestions?: number;
  estimatedTimeMinutes?: number;
}

// --- Helper Functions ---
const getThemeConfig = (themeColor: string) => {
  const themes = {
    sky: {
      gradient: 'from-cyan-400 via-sky-500 to-blue-500',
      lightGradient: 'from-cyan-50 via-sky-50 to-blue-50',
      glowColor: 'shadow-cyan-400/40',
      iconColor: 'text-cyan-600',
      bgAccent: 'bg-cyan-50',
      borderAccent: 'border-cyan-200',
    },
    rose: {
      gradient: 'from-rose-400 via-pink-500 to-red-500',
      lightGradient: 'from-rose-50 via-pink-50 to-red-50',
      glowColor: 'shadow-rose-400/40',
      iconColor: 'text-rose-600',
      bgAccent: 'bg-rose-50',
      borderAccent: 'border-rose-200',
    },
    purple: {
      gradient: 'from-purple-400 via-violet-500 to-indigo-500',
      lightGradient: 'from-purple-50 via-violet-50 to-indigo-50',
      glowColor: 'shadow-purple-400/40',
      iconColor: 'text-purple-600',
      bgAccent: 'bg-purple-50',
      borderAccent: 'border-purple-200',
    },
    teal: {
      gradient: 'from-teal-400 via-emerald-500 to-green-500',
      lightGradient: 'from-teal-50 via-emerald-50 to-green-50',
      glowColor: 'shadow-teal-400/40',
      iconColor: 'text-teal-600',
      bgAccent: 'bg-teal-50',
      borderAccent: 'border-teal-200',
    },
    amber: {
      gradient: 'from-amber-400 via-orange-500 to-yellow-500',
      lightGradient: 'from-amber-50 via-orange-50 to-yellow-50',
      glowColor: 'shadow-amber-400/40',
      iconColor: 'text-amber-600',
      bgAccent: 'bg-amber-50',
      borderAccent: 'border-amber-200',
    },
  };
  return themes[themeColor as keyof typeof themes] || themes.sky;
};

const getDepthIcon = (depth: QuestionDepth) => {
  switch (depth) {
    case 'BASIC':
      return <Star className="w-4 h-4" fill="currentColor" />;
    case 'ADVANCED':
      return (
        <>
          <Star className="w-4 h-4" fill="currentColor" />
          <Star className="w-4 h-4" fill="currentColor" />
        </>
      );
    case 'EXPERT':
      return (
        <>
          <Star className="w-4 h-4" fill="currentColor" />
          <Star className="w-4 h-4" fill="currentColor" />
          <Star className="w-4 h-4" fill="currentColor" />
        </>
      );
    default:
      return <Star className="w-4 h-4" fill="currentColor" />;
  }
};

// --- Main Component ---
export default function QuestionCard({
  question,
  depth,
  isRequired = false,
  onSkip,
  onBookmark,
  onHelp,
  className = '',
  validationError,
  isDisabled = false,
  children,
  locale = 'he',
  themeColor = 'sky',
  isVisible,
  onVisibilityChange,
  onSave,
  isSaving,
  dict,
  currentQuestionNumber,
  totalQuestions,
  estimatedTimeMinutes = 5,
}: QuestionCardProps) {
  // --- State and Variables ---
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showBenefit, setShowBenefit] = useState(true);

  const isRTL = locale === 'he';
  const theme = getThemeConfig(themeColor);

  // --- Effects ---
  useEffect(() => {
    if (currentQuestionNumber && currentQuestionNumber % 5 === 0) {
      setShowBenefit(true);
      const timer = setTimeout(() => setShowBenefit(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowBenefit(false);
    }
  }, [currentQuestionNumber]);

  // --- Animation Variants ---
  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const currentBenefit =
    dict.benefitMessages[
      Math.floor(
        ((currentQuestionNumber || 0) / 5) % dict.benefitMessages.length
      )
    ];
  const progressPercentage =
    currentQuestionNumber && totalQuestions
      ? Math.round((currentQuestionNumber / totalQuestions) * 100)
      : 0;

  return (
    <motion.div
      key={question.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
      className="relative"
    >
  
      {/* Main Card */}
      <div
        role="region"
        aria-labelledby={question.id}
        className={cn(
          'relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-gray-50/50 shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white',
          isDisabled && 'opacity-75 cursor-not-allowed',
          className
        )}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div
          className={cn(
            'absolute top-4 w-32 h-32 rounded-full bg-gradient-to-br opacity-40 blur-3xl',
            theme.lightGradient,
            isRTL ? 'left-4' : 'right-4'
          )}
        />
        <div
          className={cn(
            'absolute bottom-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-30 blur-2xl',
            theme.lightGradient,
            isRTL ? 'right-4' : 'left-4'
          )}
        />

        <div className={cn('h-1.5 bg-gradient-to-r', theme.gradient)} />

        {/* Header Section */}
        <div className="relative px-6 sm:px-8 pt-6 pb-4 space-y-4">
          {currentQuestionNumber && totalQuestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full bg-gradient-to-r', theme.gradient)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">
                  {currentQuestionNumber}/{totalQuestions}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold border-2',
                    theme.borderAccent,
                    theme.bgAccent,
                    theme.iconColor
                  )}
                >
                  {progressPercentage}%
                </Badge>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div
              className={cn(
                'flex flex-wrap items-center gap-2',
                isRTL && 'flex-row-reverse'
              )}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r text-white border-0 shadow-md',
                        theme.gradient,
                        theme.glowColor
                      )}
                    >
                      {getDepthIcon(depth)}
                      <span className="text-xs font-bold">
                        {dict.depthLabels[depth]}
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs bg-white/95 backdrop-blur-sm"
                  >
                    <p className="text-sm font-medium">
                      {dict.depthDescriptions[depth]}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRequired && (
                <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-semibold px-3 py-1.5 animate-pulse border-0">
                  {dict.requiredBadge}
                </Badge>
              )}

              {estimatedTimeMinutes && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs border-gray-200 bg-white/80 text-gray-600"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {dict.estimatedTime.replace(
                      '{{minutes}}',
                      String(estimatedTimeMinutes)
                    )}
                  </span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {onBookmark && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={cn(
                          'h-9 w-9 rounded-xl transition-all duration-300',
                          isBookmarked
                            ? cn(
                                'bg-gradient-to-br shadow-md',
                                theme.lightGradient,
                                theme.iconColor,
                                theme.glowColor
                              )
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        aria-label={
                          isBookmarked
                            ? dict.tooltips.removeBookmark
                            : dict.tooltips.addBookmark
                        }
                      >
                        <Bookmark
                          className="w-4 h-4"
                          fill={isBookmarked ? 'currentColor' : 'none'}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/95 backdrop-blur-sm">
                      <p className="text-sm">
                        {isBookmarked
                          ? dict.tooltips.removeBookmark
                          : dict.tooltips.addBookmark}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {question.metadata?.helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHelp(!showHelp)}
                        className={cn(
                          'h-9 w-9 rounded-xl transition-all duration-300',
                          showHelp
                            ? cn(
                                'bg-gradient-to-br shadow-md',
                                theme.lightGradient,
                                theme.iconColor
                              )
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        aria-label={
                          showHelp
                            ? dict.tooltips.hideHelp
                            : dict.tooltips.showHelp
                        }
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/95 backdrop-blur-sm">
                      <p className="text-sm">
                        {showHelp
                          ? dict.tooltips.hideHelp
                          : dict.tooltips.whyQuestion}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h2
              id={question.id}
              className={cn(
                'text-2xl sm:text-3xl font-bold text-gray-800 leading-tight mt-4',
                isRTL ? 'text-right' : 'text-left'
              )}
            >
              {question.question}
            </h2>
          </motion.div>

          <div className="relative mt-4">
            <div
              className={cn(
                'absolute h-1 w-20 bg-gradient-to-r rounded-full',
                theme.gradient,
                theme.glowColor,
                isRTL ? 'right-0' : 'left-0'
              )}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="relative px-6 sm:px-8 pb-6 space-y-4">
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={cn(
                    'rounded-2xl p-4 border-2 bg-gradient-to-br shadow-md',
                    theme.lightGradient,
                    theme.borderAccent
                  )}
                >
                  <div
                    className={cn(
                      'flex items-start gap-3',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 p-2 rounded-xl bg-white shadow-sm',
                        theme.iconColor
                      )}
                    >
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 leading-relaxed">
                        {question.metadata.helpText}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  role="alert"
                  className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <AlertDescription className="text-sm font-medium text-red-700">
                      {validationError}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative mt-6"
          >
            {children}
          </motion.div>
        </div>
{/* ✨ --- START: ADD THIS NEW BLOCK --- ✨ */}

{/* Benefit Message integrated into the footer */}
<AnimatePresence>
  {showBenefit &&
    currentQuestionNumber &&
    currentQuestionNumber % 5 === 0 && (
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: 10, height: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="mt-4 pt-4 border-t border-gray-200"
      >
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl',
            'bg-gradient-to-br',
            theme.lightGradient,
            theme.borderAccent,
            'border'
          )}
        >
          <div className={cn('p-1.5 rounded-lg bg-white shadow-sm', theme.iconColor)}>
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className={cn('text-sm font-semibold', theme.iconColor.replace('text-', 'text-'))}>
            {currentBenefit}
          </span>
        </div>
      </motion.div>
    )}
</AnimatePresence>

        {/* Footer Section */}
        <div className="relative px-6 sm:px-8 py-5 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <VisibilityToggleButton
                      isVisible={isVisible}
                      onToggle={() => onVisibilityChange(!isVisible)}
                      disabled={isDisabled}
                      visibleText={dict.visibilityButton.visible}
                      hiddenText={dict.visibilityButton.hidden}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs bg-white/95 backdrop-blur-sm"
                  >
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-sm">
                        {isVisible
                          ? dict.tooltips.visibility.visibleTitle
                          : dict.tooltips.visibility.hiddenTitle}
                      </p>
                      <p className="text-xs text-gray-600">
                        {isVisible
                          ? dict.tooltips.visibility.visibleDesc
                          : dict.tooltips.visibility.hiddenDesc}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/profile?tab=questionnaire" legacyBehavior>
                      <a target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                          aria-label={dict.tooltips.viewProfile}
                        >
                          <BookUser className="w-4 h-4" />
                        </Button>
                      </a>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/95 backdrop-blur-sm">
                    <p className="text-sm">{dict.tooltips.viewProfile}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              {onSave && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-9 w-9 rounded-xl transition-all duration-300',
                          isSaving
                            ? cn('bg-gradient-to-br', theme.lightGradient)
                            : 'text-gray-500 hover:bg-gray-100'
                        )}
                        onClick={onSave}
                        disabled={isSaving || isDisabled}
                        aria-label={dict.tooltips.saveProgress}
                      >
                        {isSaving ? (
                          <Loader2
                            className={cn(
                              'w-4 h-4 animate-spin',
                              theme.iconColor
                            )}
                          />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/95 backdrop-blur-sm">
                      <p className="text-sm">
                        {isSaving
                          ? dict.tooltips.saveProgressSaving
                          : dict.tooltips.saveProgress}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {onSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  disabled={isRequired || isDisabled}
                  className={cn(
                    'rounded-xl px-4 py-2 flex items-center gap-2 transition-all',
                    isRequired || isDisabled
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  )}
                >
                  {isRequired ? (
                    <span className="text-sm font-medium">
                      {dict.skipButton.required}
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-medium">
                        {dict.skipButton.skip}
                      </span>
                      <SkipForward className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {currentQuestionNumber && currentQuestionNumber % 3 === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div
                className={cn(
                  'flex items-center gap-2 text-sm text-gray-600',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <TrendingUp
                  className={cn(
                    'w-4 h-4 text-green-500',
                    isRTL ? 'ml-2' : 'mr-2'
                  )}
                />
                <span className="font-medium">{dict.encouragementMessage}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
