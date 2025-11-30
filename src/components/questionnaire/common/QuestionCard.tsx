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
  locale?: 'he' | 'en';
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

// --- Helper Functions (Updated Palette) ---
const getThemeConfig = (themeColor: string) => {
  const themes = {
    sky: {
      gradient: 'from-sky-400 to-blue-500',
      lightGradient: 'from-sky-50 via-blue-50 to-white',
      glowColor: 'shadow-sky-400/30',
      iconColor: 'text-sky-600',
      bgAccent: 'bg-sky-50',
      borderAccent: 'border-sky-200',
    },
    rose: {
      gradient: 'from-rose-400 to-red-500', // Matches Hero Rose
      lightGradient: 'from-rose-50 via-red-50 to-white',
      glowColor: 'shadow-rose-400/30',
      iconColor: 'text-rose-600',
      bgAccent: 'bg-rose-50',
      borderAccent: 'border-rose-200',
    },
    purple: {
      gradient: 'from-purple-400 to-indigo-500',
      lightGradient: 'from-purple-50 via-indigo-50 to-white',
      glowColor: 'shadow-purple-400/30',
      iconColor: 'text-purple-600',
      bgAccent: 'bg-purple-50',
      borderAccent: 'border-purple-200',
    },
    teal: {
      gradient: 'from-teal-400 to-emerald-500', // Matches Hero Teal
      lightGradient: 'from-teal-50 via-emerald-50 to-white',
      glowColor: 'shadow-teal-400/30',
      iconColor: 'text-teal-600',
      bgAccent: 'bg-teal-50',
      borderAccent: 'border-teal-200',
    },
    amber: {
      gradient: 'from-amber-400 to-orange-500', // Matches Hero Orange/Amber
      lightGradient: 'from-amber-50 via-orange-50 to-white',
      glowColor: 'shadow-amber-400/30',
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
      return <Star className="w-3.5 h-3.5" fill="currentColor" />;
    case 'ADVANCED':
      return (
        <>
          <Star className="w-3.5 h-3.5" fill="currentColor" />
          <Star className="w-3.5 h-3.5" fill="currentColor" />
        </>
      );
    case 'EXPERT':
      return (
        <>
          <Star className="w-3.5 h-3.5" fill="currentColor" />
          <Star className="w-3.5 h-3.5" fill="currentColor" />
          <Star className="w-3.5 h-3.5" fill="currentColor" />
        </>
      );
    default:
      return <Star className="w-3.5 h-3.5" fill="currentColor" />;
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
          'relative overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm shadow-xl border border-white/60 transition-all duration-500',
          isDisabled && 'opacity-75 cursor-not-allowed',
          className
        )}
      >
        {/* Top Gradient Bar */}
        <div className={cn('h-1.5 w-full bg-gradient-to-r', theme.gradient)} />

        {/* Decorative Orbs */}
        <div
          className={cn(
            'absolute top-4 w-40 h-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl pointer-events-none',
            theme.lightGradient,
            isRTL ? 'left-[-20px]' : 'right-[-20px]'
          )}
        />

        {/* Header Section */}
        <div className="relative px-6 sm:px-8 pt-6 pb-4 space-y-4">
          {/* Progress Bar */}
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
                    // Updated Gradient for Progress
                    className="h-full bg-gradient-to-r from-teal-400 to-orange-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">
                  {currentQuestionNumber}/{totalQuestions}
                </span>
              </div>
            </motion.div>
          )}

          {/* Badges Row */}
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
                        'flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r text-white border-0 shadow-sm transition-all hover:shadow-md',
                        theme.gradient,
                        theme.glowColor
                      )}
                    >
                      {getDepthIcon(depth)}
                      <span className="text-xs font-bold tracking-wide">
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
                <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-semibold px-3 py-1.5 border-0 shadow-sm">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  {dict.requiredBadge}
                </Badge>
              )}

              {estimatedTimeMinutes && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs border-gray-200 bg-white/50 text-gray-600 backdrop-blur-sm"
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

            {/* Action Buttons (Help/Bookmark) */}
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
                            ? 'text-orange-500 bg-orange-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                      >
                        <Bookmark
                          className="w-5 h-5"
                          fill={isBookmarked ? 'currentColor' : 'none'}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
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
                            ? 'text-teal-600 bg-teal-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                      >
                        <HelpCircle className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {showHelp
                          ? dict.tooltips.hideHelp
                          : dict.tooltips.showHelp}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Question Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h2
              id={question.id}
              className={cn(
                'text-2xl sm:text-3xl font-bold text-gray-800 leading-tight mt-2',
                isRTL ? 'text-right' : 'text-left'
              )}
            >
              {question.question}
            </h2>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="relative px-6 sm:px-8 pb-6 space-y-6">
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-2xl p-4 border bg-teal-50/50 border-teal-100">
                  <div
                    className={cn(
                      'flex items-start gap-3',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <div className="flex-shrink-0 p-1.5 rounded-lg bg-teal-100 text-teal-600">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-teal-800 leading-relaxed">
                        {question.metadata.helpText}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation Error */}
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
                  className="bg-rose-50 border-rose-200 text-rose-900"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <AlertDescription className="text-sm font-medium">
                      {validationError}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer Input Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative"
          >
            {children}
          </motion.div>
        </div>

        {/* Encouragement Footer */}
        <AnimatePresence>
          {showBenefit &&
            currentQuestionNumber &&
            currentQuestionNumber % 5 === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-orange-50/50 border-t border-orange-100 px-6 py-3"
              >
                <div className="flex items-center justify-center gap-2 text-orange-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {currentBenefit}
                  </span>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Card Footer */}
        <div className="relative px-6 sm:px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <VisibilityToggleButton
              isVisible={isVisible}
              onToggle={() => onVisibilityChange(!isVisible)}
              disabled={isDisabled}
              visibleText={dict.visibilityButton.visible}
              hiddenText={dict.visibilityButton.hidden}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/profile?tab=questionnaire"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <BookUser className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
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
                      className="h-9 w-9 rounded-xl text-teal-600 hover:bg-teal-50"
                      onClick={onSave}
                      disabled={isSaving || isDisabled}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
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
                  'rounded-xl px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                  isRequired && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isRequired ? (
                  <span className="text-xs">{dict.skipButton.required}</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{dict.skipButton.skip}</span>
                    <SkipForward className="w-4 h-4" />
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
