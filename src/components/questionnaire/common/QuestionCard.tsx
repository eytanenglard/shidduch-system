// src/components/questionnaire/common/QuestionCard.tsx
import React, { useState, forwardRef } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Bookmark,
  AlertCircle,
  HelpCircle,
  SkipForward,
  Info,
  Star,
  X,
  MessageCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Users,
  Lock,
  Save, // *** הוספה חדשה ***
  Loader2, // *** הוספה חדשה ***
  BookUser, // *** הוספה חדשה ***
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, AnswerValue, QuestionDepth } from '../types/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
  onSave?: () => void; // *** הוספה חדשה ***
  isSaving?: boolean; // *** הוספה חדשה ***
}

const depthLabels: Record<QuestionDepth, string> = {
  BASIC: 'בסיסי',
  ADVANCED: 'מתקדם',
  EXPERT: 'מעמיק',
};

const depthDescriptions: Record<QuestionDepth, string> = {
  BASIC: 'שאלות חובה המהוות את הבסיס להיכרות',
  ADVANCED: 'שאלות מומלצות להיכרות מעמיקה יותר',
  EXPERT: 'שאלות העשרה לחיבור מעמיק במיוחד',
};

// פתרון לבעיית הצבעים הדינמיים
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
  isFirstInList = false,
  themeColor = 'sky',
  isVisible,
  onVisibilityChange,
  onSave, // *** קבלת Prop ***
  isSaving, // *** קבלת Prop ***
}: QuestionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

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
        className={cn(
          'transition-all duration-300 shadow-lg rounded-xl overflow-hidden border',
          'bg-white',
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
                      {depthLabels[depth]}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{depthDescriptions[depth]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isRequired && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  שאלת חובה *
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
                        aria-label={isBookmarked ? 'הסר סימניה' : 'הוסף סימניה'}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? 'הסר סימניה' : 'שמור לעיון חוזר'}</p>
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
                        aria-label={showHelp ? 'הסתר עזרה' : 'הצג עזרה'}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {showHelp ? 'הסתר עזרה' : 'למה אנחנו שואלים את זה?'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <motion.div variants={contentVariants}>
            <h2 className="text-xl sm:text-2xl font-semibold mt-3 text-slate-800 leading-snug">
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
                <Alert variant="destructive" className="py-2">
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
          {/* צד ימין (ב-RTL): מתג נראות */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`visibility-switch-${question.id}`} // *** 1. הוספת ID ייחודי ***
                        checked={isVisible}
                        onCheckedChange={onVisibilityChange}
                        disabled={isDisabled}
                        aria-label="הצג תשובה זו בפרופיל"
                        className="data-[state=checked]:bg-green-500"
                      />
                      <div className="flex items-center gap-1.5">
                        {/* ... (האייקונים נשארים כפי שהם) ... */}
                      </div>
                    </div>
                  </TooltipTrigger>
                  {/* ... (ה-TooltipContent נשאר כפי שהוא) ... */}
                </Tooltip>
              </TooltipProvider>
            </div>
            <motion.div
            // ... (קוד אנימציה קיים) ...
            >
              <Label
                htmlFor={`visibility-switch-${question.id}`} // *** 2. הוספת htmlFor ***
                className={cn(
                  'text-sm font-medium cursor-pointer transition-all duration-200',
                  isVisible ? 'text-green-700' : 'text-slate-500'
                )}
                // *** 3. הסרת onClick מיותר ***
              >
                {isVisible ? 'גלוי בפרופיל' : 'מוסתר מהפרופיל'}
              </Label>
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-colors duration-200',
                  isVisible ? 'bg-green-500' : 'bg-slate-400'
                )}
              />
            </motion.div>
          </div>

          {/* צד שמאל (ב-RTL): כפתורי פעולה */}
          <div className="flex items-center gap-1">
            {/* --- START: כפתור שמירה (אייקון בלבד) --- */}
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
                      aria-label="שמור התקדמות"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSaving ? 'שומר...' : 'שמור התקדמות'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* --- END: כפתור שמירה --- */}

            {/* --- START: כפתור צפייה בפרופיל (אייקון בלבד) --- */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile?tab=questionnaire" legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                        aria-label="צפה בפרופיל ובתשובות"
                      >
                        <BookUser className="w-4 h-4" />
                      </Button>
                    </a>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>צפה בפרופיל ובתשובות</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* --- END: כפתור צפייה בפרופיל --- */}

            {/* כפתור דילוג (נשאר כפי שהיה) */}
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
                {isRequired ? 'שאלת חובה' : 'דלג'}
                {!isRequired && <SkipForward className="w-4 h-4 mr-2" />}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
