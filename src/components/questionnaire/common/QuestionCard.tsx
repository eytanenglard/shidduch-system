// src/components/questionnaire/common/QuestionCard.tsx
import React, { useState } from 'react';
import { VisibilityToggleButton } from '@/components/ui/VisibilityToggleButton';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
import type { QuestionCardDict } from '@/types/dictionary'; // ייבוא טיפוס המילון

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
  language?: string;
  isFirstInList?: boolean;
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
  isVisible: boolean;
  onVisibilityChange: (isVisible: boolean) => void;
  onSave?: () => void;
  isSaving?: boolean;
  dict: QuestionCardDict; // קבלת המילון כ-prop
}

const getThemeClasses = (themeColor: string) => {
  const themes = {
    sky: {
      border: 'border-sky-500',
      text: 'text-sky-700',
      bg: 'bg-sky-100',
      bgSoft: 'bg-sky-50',
      ring: 'ring-sky-300',
      icon: 'text-sky-500',
    },
    rose: {
      border: 'border-rose-500',
      text: 'text-rose-700',
      bg: 'bg-rose-100',
      bgSoft: 'bg-rose-50',
      ring: 'ring-rose-300',
      icon: 'text-rose-500',
    },
    purple: {
      border: 'border-purple-500',
      text: 'text-purple-700',
      bg: 'bg-purple-100',
      bgSoft: 'bg-purple-50',
      ring: 'ring-purple-300',
      icon: 'text-purple-500',
    },
    teal: {
      border: 'border-teal-500',
      text: 'text-teal-700',
      bg: 'bg-teal-100',
      bgSoft: 'bg-teal-50',
      ring: 'ring-teal-300',
      icon: 'text-teal-500',
    },
    amber: {
      border: 'border-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-100',
      bgSoft: 'bg-amber-50',
      ring: 'ring-amber-300',
      icon: 'text-amber-500',
    },
  };
  return themes[themeColor as keyof typeof themes] || themes.sky;
};

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
  themeColor = 'sky',
  isVisible,
  onVisibilityChange,
  onSave,
  isSaving,
  dict, // שימוש במשתנה dict
}: QuestionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { delay: 0.1, duration: 0.3 } },
  };

  const themeClasses = getThemeClasses(themeColor);

  return (
    <motion.div
      key={question.id}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={cardVariants}
    >
      <Card
        role="region"
        aria-labelledby={question.id}
        className={cn(
          'transition-all duration-300 shadow-lg rounded-xl overflow-hidden border',
          isDisabled ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-xl',
          `border-t-4 ${themeClasses.border}`,
          className
        )}
      >
        <CardHeader className="relative flex flex-col space-y-2 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-medium border-2',
                        themeClasses.border,
                        themeClasses.bgSoft,
                        themeClasses.text
                      )}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      {dict.depthLabels[depth]}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{dict.depthDescriptions[depth]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRequired && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  {dict.requiredBadge}
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
                          'h-8 w-8 rounded-full',
                          isBookmarked
                            ? 'text-amber-500 bg-amber-100'
                            : 'text-slate-400 hover:bg-slate-100'
                        )}
                        aria-label={
                          isBookmarked
                            ? dict.tooltips.removeBookmark
                            : dict.tooltips.addBookmark
                        }
                      >
                        <Bookmark className="w-4 h-4" />
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
                          'h-8 w-8 rounded-full',
                          showHelp
                            ? `${themeClasses.bg} ${themeClasses.text}`
                            : 'text-slate-400 hover:bg-slate-100'
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
                    <TooltipContent>
                      <p>
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

          <motion.div variants={contentVariants}>
            <h2
              id={question.id}
              className="text-xl sm:text-2xl font-semibold mt-3 text-slate-800 leading-snug"
            >
              {question.question}
            </h2>
          </motion.div>
        </CardHeader>

        <CardContent className="relative pt-2 space-y-4">
          <AnimatePresence>
            {showHelp && question.metadata?.helpText && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Alert
                  className={cn(
                    themeClasses.bgSoft,
                    'border-2',
                    themeClasses.border
                      .replace('border-', 'border-')
                      .replace('-500', '-200')
                  )}
                >
                  <Lightbulb className={cn('h-4 w-4', themeClasses.icon)} />
                  <AlertDescription
                    className={cn(themeClasses.text, 'font-medium')}
                  >
                    {question.metadata.helpText}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert role="alert" variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription className="text-sm">
                    {validationError}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4">
            <motion.div variants={contentVariants} className="relative">
              {children}
            </motion.div>
          </div>
        </CardContent>

        <CardFooter className="relative flex justify-between items-center pt-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <VisibilityToggleButton
                    isVisible={isVisible}
                    onToggle={() => onVisibilityChange(!isVisible)}
                    disabled={isDisabled}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-center">
                    <p className="font-medium mb-1">
                      {isVisible
                        ? dict.tooltips.visibility.visibleTitle
                        : dict.tooltips.visibility.hiddenTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isVisible
                        ? dict.tooltips.visibility.visibleDesc
                        : dict.tooltips.visibility.hiddenDesc}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1">
            {onSave && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                      onClick={onSave}
                      disabled={isSaving || isDisabled}
                      aria-label={dict.tooltips.saveProgress}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile?tab=questionnaire" legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                        aria-label={dict.tooltips.viewProfile}
                      >
                        <BookUser className="w-4 h-4" />
                      </Button>
                    </a>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dict.tooltips.viewProfile}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                disabled={isRequired || isDisabled}
                className={cn(
                  'text-slate-500 hover:text-slate-800',
                  (isRequired || isDisabled) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isRequired ? dict.skipButton.required : dict.skipButton.skip}
                {!isRequired && <SkipForward className="w-4 h-4 mr-2" />}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
