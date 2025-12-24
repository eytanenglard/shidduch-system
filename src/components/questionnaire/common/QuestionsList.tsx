// src/components/questionnaire/common/QuestionsList.tsx
'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  AlertCircle,
  Circle,
  Sparkles,
  Star,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Question,
  QuestionnaireAnswer,
  AnswerValue,
  QuestionDepth,
} from '../types/types';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionsListDict } from '@/types/dictionary';

interface QuestionsListProps {
  locale: string;
  allQuestions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: QuestionnaireAnswer[];
  className?: string;
  onClose?: () => void;
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
  dict: QuestionsListDict;
}

const getThemeConfig = (themeColor: string) => {
  const themes = {
    sky: {
      gradient: 'from-cyan-400 via-sky-500 to-blue-500',
      lightBg: 'from-cyan-50 to-blue-50',
      textColor: 'text-cyan-700',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      ringColor: 'ring-cyan-300',
      bgSoft: 'bg-cyan-50',
      shadowColor: 'shadow-cyan-200/50',
    },
    rose: {
      gradient: 'from-rose-400 via-pink-500 to-red-500',
      lightBg: 'from-rose-50 to-pink-50',
      textColor: 'text-rose-700',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      ringColor: 'ring-rose-300',
      bgSoft: 'bg-rose-50',
      shadowColor: 'shadow-rose-200/50',
    },
    purple: {
      gradient: 'from-purple-400 via-violet-500 to-indigo-500',
      lightBg: 'from-purple-50 to-indigo-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      ringColor: 'ring-purple-300',
      bgSoft: 'bg-purple-50',
      shadowColor: 'shadow-purple-200/50',
    },
    teal: {
      gradient: 'from-teal-400 via-emerald-500 to-green-500',
      lightBg: 'from-teal-50 to-emerald-50',
      textColor: 'text-teal-700',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      ringColor: 'ring-teal-300',
      bgSoft: 'bg-teal-50',
      shadowColor: 'shadow-teal-200/50',
    },
    amber: {
      gradient: 'from-amber-400 via-orange-500 to-yellow-500',
      lightBg: 'from-amber-50 to-orange-50',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      ringColor: 'ring-amber-300',
      bgSoft: 'bg-amber-50',
      shadowColor: 'shadow-amber-200/50',
    },
  };
  return themes[themeColor as keyof typeof themes] || themes.sky;
};

const QuestionsList: React.FC<QuestionsListProps> = ({
  allQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  locale = 'he',
  className = '',
  onClose,
  themeColor = 'sky',
  dict,
}) => {
  const isRTL = locale === 'he';
  const theme = getThemeConfig(themeColor);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const findAnswer = (questionId: string): AnswerValue | undefined => {
    return answers.find((a) => a.questionId === questionId)?.value;
  };

  const isAnswerNotEmpty = (answer: AnswerValue | undefined): boolean => {
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (
      typeof answer === 'object' &&
      !Array.isArray(answer) &&
      Object.keys(answer).length === 0
    )
      return false;
    return true;
  };

  const handleItemClick = (index: number) => {
    setCurrentQuestionIndex(index);
    onClose?.();
  };

  // חישוב סטטיסטיקות
  const answeredCount = allQuestions.filter((q) =>
    isAnswerNotEmpty(findAnswer(q.id))
  ).length;
  const totalCount = allQuestions.length;
  const progressPercentage = Math.round((answeredCount / totalCount) * 100);

  // הודעת מוטיבציה דינמית מהמילון
  const getMotivationalMessage = () => {
    if (progressPercentage >= 100) {
      return {
        emoji: '🎉',
        title: dict.motivationalMessages.finish.title,
        subtitle: dict.motivationalMessages.finish.subtitle,
        color: 'from-green-500 to-emerald-500',
      };
    }
    if (progressPercentage >= 75) {
      return {
        emoji: '🔥',
        title: dict.motivationalMessages.threeQuarters.title,
        subtitle: dict.motivationalMessages.threeQuarters.subtitle,
        color: theme.gradient,
      };
    }
    if (progressPercentage >= 50) {
      return {
        emoji: '⭐',
        title: dict.motivationalMessages.half.title,
        subtitle: dict.motivationalMessages.half.subtitle,
        color: theme.gradient,
      };
    }
    if (progressPercentage >= 25) {
      return {
        emoji: '🚀',
        title: dict.motivationalMessages.quarter.title,
        subtitle: dict.motivationalMessages.quarter.subtitle,
        color: theme.gradient,
      };
    }
    return {
      emoji: '💪',
      title: dict.motivationalMessages.start.title,
      subtitle: dict.motivationalMessages.start.subtitle,
      color: theme.gradient,
    };
  };

  const motivationalMessage = getMotivationalMessage();

  // אנימציות
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="px-2 pb-2">
        {/* Summary Section - סטטיסטיקות */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-shrink-0 mb-4 space-y-4"
        >
          {/* Progress Stats */}
          <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'p-2 rounded-xl bg-gradient-to-br',
                    theme.gradient,
                    'text-white shadow-md'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {answeredCount}/{totalCount}
                  </div>
                  <div className="text-xs text-gray-600">
                    {dict.stats.answeredQuestions}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className={cn('text-3xl font-bold', theme.textColor)}>
                  {progressPercentage}%
                </div>
                <div className="text-xs text-gray-500">
                  {dict.stats.complete}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn(
                  'h-full bg-gradient-to-r',
                  theme.gradient,
                  'shadow-lg'
                )}
              />
            </div>
          </div>

          {/* Motivational Card */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className={cn(
              'relative overflow-hidden rounded-2xl p-4 text-white shadow-lg',
              'bg-gradient-to-r',
              motivationalMessage.color
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="text-3xl">{motivationalMessage.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-lg">
                  {motivationalMessage.title}
                </div>
                <div className="text-sm text-white/90">
                  {motivationalMessage.subtitle}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">
                  {dict.stats.remaining}
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {totalCount - answeredCount}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  {dict.stats.done}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {answeredCount}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative space-y-2"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Timeline Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full"
            style={isRTL ? { right: '1.75rem' } : { left: '1.75rem' }}
          />

          {allQuestions.map((q, index) => {
            const answer = findAnswer(q.id);
            const isAnswered = isAnswerNotEmpty(answer);
            const isCurrent = index === currentQuestionIndex;
            const isHovered = hoveredIndex === index;

            // אייקון סטטוס
            let StatusIcon;
            let statusColor = '';
            let statusBgColor = '';

            if (isCurrent) {
              StatusIcon = Sparkles;
              statusColor = theme.iconColor;
              statusBgColor = cn('bg-gradient-to-br', theme.lightBg);
            } else if (isAnswered) {
              StatusIcon = CheckCircle2;
              statusColor = 'text-green-600';
              statusBgColor = 'bg-green-50';
            } else if (q.isRequired) {
              StatusIcon = AlertTriangle;
              statusColor = 'text-rose-500';
              statusBgColor = 'bg-rose-50';
            } else {
              StatusIcon = Circle;
              statusColor = 'text-gray-300';
              statusBgColor = 'bg-gray-50';
            }

            const depthMap: { [key in QuestionDepth]: number } = {
              BASIC: 1,
              ADVANCED: 2,
              EXPERT: 3,
            };
            const starCount = depthMap[q.depth] || 1;

            return (
              <motion.button
                key={q.id}
                variants={itemVariants}
                type="button"
                onClick={() => handleItemClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  'relative w-full flex items-start text-start p-4 rounded-2xl transition-all duration-300 border-2 group',
                  'hover:shadow-lg active:scale-[0.98]',
                  isCurrent
                    ? cn(
                        'bg-gradient-to-br',
                        theme.lightBg,
                        theme.borderColor,
                        'ring-2',
                        theme.ringColor,
                        theme.shadowColor
                      )
                    : isAnswered
                    ? 'bg-white border-green-200 hover:border-green-300 hover:bg-green-50/30'
                    : q.isRequired
                    ? 'bg-white border-rose-200 hover:border-rose-300 hover:bg-rose-50/30'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Icon Container */}
                <motion.div
                  
                  
                  className={cn(
                    'flex-shrink-0 z-10 rounded-xl p-2.5 shadow-md border-2 border-white transition-all duration-300',
                    statusBgColor,
                    isHovered && 'shadow-lg'
                  )}
                >
                  <StatusIcon className={cn('h-5 w-5', statusColor)} />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 ml-3 space-y-2">
                  {/* Question Number & Text */}
                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2',
                        isCurrent
                          ? cn(
                              'bg-gradient-to-br',
                              theme.gradient,
                              'text-white'
                            )
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {index + 1}
                    </span>
                    <p
                      className={cn(
                        'inline text-sm leading-relaxed transition-colors',
                        isCurrent
                          ? cn(theme.textColor, 'font-semibold')
                          : isAnswered
                          ? 'text-gray-700 font-medium'
                          : 'text-gray-600'
                      )}
                    >
                      {q.question}
                    </p>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Depth Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-medium border transition-all',
                        isCurrent
                          ? cn(
                              'bg-white/80 backdrop-blur-sm',
                              theme.borderColor,
                              theme.textColor
                            )
                          : 'bg-white border-gray-200 text-gray-600'
                      )}
                    >
                      {Array.from({ length: starCount }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-2.5 h-2.5 inline mx-0.5"
                          fill="currentColor"
                        />
                      ))}
                      <span className="ml-1">
                        {dict.depthLabels[q.depth]}
                      </span>
                    </Badge>

                    {/* Required Badge */}
                    {q.isRequired && !isAnswered && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-rose-50 border-rose-300 text-rose-700"
                      >
                        <AlertCircle className="w-2.5 h-2.5 mr-1" />
                        {dict.badges.required}
                      </Badge>
                    )}

                    {/* Answered Badge */}
                    {isAnswered && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-green-50 border-green-300 text-green-700"
                      >
                        <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        {dict.badges.answered}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Hover Indicator */}
                <AnimatePresence>
                  {isHovered && !isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-1/2 -translate-y-1/2"
                      style={isRTL ? { left: '8px' } : { right: '8px' }}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          'bg-gradient-to-br',
                          theme.gradient,
                          'text-white shadow-lg'
                        )}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Current Pulse Effect */}
                {isCurrent && (
                  <motion.div
                    className={cn(
                      'absolute inset-0 rounded-2xl border-2',
                      theme.borderColor
                    )}
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </ScrollArea>
  );
};

export default QuestionsList;