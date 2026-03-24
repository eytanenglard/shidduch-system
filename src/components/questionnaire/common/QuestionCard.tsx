// src/components/questionnaire/common/QuestionCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { VisibilityToggleButton } from '@/components/ui/VisibilityToggleButton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Clock,
  Sparkles,
  Cloud,
  CheckCircle,
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
  isBookmarked?: boolean;
  onHelp?: () => void;
  className?: string;
  validationError?: string;
  isDisabled?: boolean;
  children?: React.ReactNode;
  locale?: 'he' | 'en';
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  dict: QuestionCardDict;
  currentQuestionNumber?: number;
  totalQuestions?: number;
  estimatedTimeMinutes?: number;
}

// --- Theme Config ---
const getThemeConfig = (themeColor: string) => {
  const themes = {
    sky:    { gradient: 'from-sky-400 to-blue-500',     dot: 'bg-sky-400',    subtle: 'text-sky-600' },
    rose:   { gradient: 'from-rose-400 to-red-500',     dot: 'bg-rose-400',   subtle: 'text-rose-600' },
    purple: { gradient: 'from-purple-400 to-indigo-500',dot: 'bg-purple-400', subtle: 'text-purple-600' },
    teal:   { gradient: 'from-teal-400 to-emerald-500', dot: 'bg-teal-400',   subtle: 'text-teal-600' },
    amber:  { gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-400',  subtle: 'text-amber-600' },
  };
  return themes[themeColor as keyof typeof themes] || themes.sky;
};

const DEPTH_STARS: Record<QuestionDepth, number> = {
  BASIC: 1,
  ADVANCED: 2,
  EXPERT: 3,
};

// --- Main Component ---
export default function QuestionCard({
  question,
  depth,
  isRequired = false,
  onSkip,
  onBookmark,
  isBookmarked: isBookmarkedProp,
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
  lastSaved,
  dict,
  currentQuestionNumber,
  totalQuestions,
  estimatedTimeMinutes,
}: QuestionCardProps) {
  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(false);
  const isBookmarked = isBookmarkedProp ?? isBookmarkedLocal;
  const [showHelp, setShowHelp] = useState(false);
  const [showBenefit, setShowBenefit] = useState(false);

  // Show "saved" indicator for 4 seconds after a save completes
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  useEffect(() => {
    if (isSaving) {
      setShowSavedIndicator(true);
    } else if (showSavedIndicator && lastSaved) {
      const timer = setTimeout(() => setShowSavedIndicator(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaved, showSavedIndicator]);

  const isRTL = locale === 'he';
  const theme = getThemeConfig(themeColor);

  useEffect(() => {
    if (currentQuestionNumber && currentQuestionNumber % 5 === 0) {
      setShowBenefit(true);
      const timer = setTimeout(() => setShowBenefit(false), 7000);
      return () => clearTimeout(timer);
    } else {
      setShowBenefit(false);
    }
  }, [currentQuestionNumber]);

  const currentBenefit =
    dict.benefitMessages[
      Math.floor(((currentQuestionNumber || 0) / 5) % dict.benefitMessages.length)
    ];

  const progressPct =
    currentQuestionNumber && totalQuestions
      ? Math.round((currentQuestionNumber / totalQuestions) * 100)
      : 0;

  // Faster animation after the first question
  const isFirstQuestion = currentQuestionNumber === 1;
  const cardVariants = {
    initial: { opacity: 0, y: isFirstQuestion ? 24 : 12, scale: isFirstQuestion ? 0.98 : 1 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: isFirstQuestion ? 0.45 : 0.22, ease: [0.25, 1, 0.5, 1] } },
    exit:    { opacity: 0, y: -8, transition: { duration: isFirstQuestion ? 0.25 : 0.15 } },
  };

  return (
    <motion.div
      key={question.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
      className="relative"
    >
      <div
        role="region"
        aria-labelledby={question.id}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 transition-all duration-300',
          isDisabled && 'opacity-70 cursor-not-allowed',
          className
        )}
      >
        {/* ── Thin colour bar ── */}
        <div className={cn('h-1 w-full bg-gradient-to-r', theme.gradient)} />

        {/* ── Progress fill inside bar ── */}
        {currentQuestionNumber && totalQuestions && (
          <div className="absolute top-0 left-0 h-1 bg-black/10 transition-all duration-700"
            style={{ width: `${progressPct}%` }} />
        )}

        {/* ══ HEADER ══ */}
        <div className="px-6 sm:px-8 pt-5 pb-3 space-y-3">

          {/* Meta row: question counter + depth + time */}
          <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>

            {/* Left side: counter */}
            <div className={cn('flex items-center gap-2.5', isRTL && 'flex-row-reverse')}>
              {currentQuestionNumber && totalQuestions ? (
                <span className="text-xs font-semibold text-gray-400 tabular-nums">
                  {isRTL ? `שאלה ${currentQuestionNumber} / ${totalQuestions}` : `${currentQuestionNumber} / ${totalQuestions}`}
                </span>
              ) : null}

              {/* Depth dots */}
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn('w-3 h-3 transition-colors', i < DEPTH_STARS[depth] ? theme.subtle : 'text-gray-200')}
                    fill={i < DEPTH_STARS[depth] ? 'currentColor' : 'none'}
                  />
                ))}
              </span>

              {estimatedTimeMinutes && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {estimatedTimeMinutes}{isRTL ? " דק׳" : 'm'}
                </span>
              )}

              {isRequired && (
                <span className="text-xs font-semibold text-rose-500">
                  {dict.requiredBadge}
                </span>
              )}
            </div>

            {/* Right side: save status + help + bookmark */}
            <div className="flex items-center gap-0.5">
              {/* Auto-save status indicator */}
              <AnimatePresence>
                {(isSaving || showSavedIndicator) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                  >
                    {isSaving ? (
                      <Cloud className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (onBookmark) { onBookmark(); } else { setIsBookmarkedLocal(!isBookmarkedLocal); } }}
                      className={cn(
                        'h-8 w-8 rounded-lg transition-all',
                        isBookmarked ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? dict.tooltips.removeBookmark : dict.tooltips.addBookmark}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {question.metadata?.helpText && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHelp(!showHelp)}
                        className={cn(
                          'h-8 w-8 rounded-lg transition-all',
                          showHelp ? 'text-teal-600 bg-teal-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                        )}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showHelp ? dict.tooltips.hideHelp : dict.tooltips.showHelp}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Question text */}
          <motion.h2
            id={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className={cn(
              'text-xl sm:text-2xl font-bold text-gray-800 leading-snug',
              isRTL ? 'text-right' : 'text-left'
            )}
          >
            {question.question}
          </motion.h2>
        </div>

        {/* ══ CONTENT ══ */}
        <div className="px-6 sm:px-8 pb-5 space-y-4">

          {/* Help panel */}
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className={cn('flex items-start gap-3 rounded-xl p-3.5 bg-teal-50 border border-teal-100', isRTL && 'flex-row-reverse')}>
                  <Lightbulb className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-teal-800 leading-relaxed">{question.metadata.helpText}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Validation error */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Alert role="alert" className="bg-rose-50 border-rose-200 py-2.5">
                  <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <AlertDescription className="text-sm font-medium text-rose-700">
                      {validationError}
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer input */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            {children}
          </motion.div>
        </div>

        {/* ══ ENCOURAGEMENT BANNER ══ */}
        <AnimatePresence>
          {showBenefit && currentQuestionNumber && currentQuestionNumber % 5 === 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-orange-100 bg-orange-50/60 px-6 py-2.5"
            >
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{currentBenefit}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ FOOTER ══ */}
        <div className={cn(
          'px-6 sm:px-8 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center',
          isRTL ? 'flex-row-reverse justify-between' : 'justify-between'
        )}>
          {/* Visibility + profile link */}
          <div className="flex items-center gap-1">
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
                  <Link href="/profile?tab=questionnaire" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <BookUser className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{dict.tooltips.viewProfile}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Save + Skip */}
          <div className="flex items-center gap-1">
            {onSave && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-teal-500 hover:bg-teal-50"
                      onClick={onSave}
                      disabled={isSaving || isDisabled}
                    >
                      {isSaving
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Save className="w-3.5 h-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSaving ? dict.tooltips.saveProgressSaving : dict.tooltips.saveProgress}</p>
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
                  'h-8 rounded-lg px-3 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  isRequired && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isRequired ? (
                  dict.skipButton.required
                ) : (
                  <span className="flex items-center gap-1">
                    {dict.skipButton.skip}
                    <SkipForward className="w-3.5 h-3.5" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
