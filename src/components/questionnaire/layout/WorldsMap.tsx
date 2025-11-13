// src/components/questionnaire/layout/WorldsMap.tsx

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Scroll,
  Heart,
  Users,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Star,
  UserCheck,
  Sparkles,
  Edit3,
  Award,
  BookUser,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Compass,
  Map,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import type { WorldsMapDict } from '@/types/dictionary';
import type { QuestionnaireAnswer } from '../types/types';

// Konfiguracja wizualna (ikony, kolory)
const worldsConfig = {
  PERSONALITY: { icon: User, order: 1, themeColor: 'sky' },
  VALUES: { icon: Heart, order: 2, themeColor: 'rose' },
  RELATIONSHIP: {
    icon: Users,
    order: 3,
    themeColor: 'purple',
  },
  PARTNER: {
    icon: UserCheck,
    order: 4,
    themeColor: 'teal',
  },
  RELIGION: { icon: Scroll, order: 5, themeColor: 'amber' },
} as const;

type WorldId = keyof typeof worldsConfig;
const WORLD_ORDER: WorldId[] = [
  'PERSONALITY',
  'VALUES',
  'RELATIONSHIP',
  'PARTNER',
  'RELIGION',
];
type WorldStatus =
  | 'completed'
  | 'recommended'
  | 'active'
  | 'available'
  | 'locked';

// Interfejsy propsów komponentów
interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  answers: QuestionnaireAnswer[];
  worldStats: Record<WorldId, { questionCount: number }>;
  className?: string;
  dict: WorldsMapDict;
  locale: 'he' | 'en';
}

interface WorldCardProps {
  worldId: WorldId;
  status: WorldStatus;
  onSelect: () => void;
  dict: WorldsMapDict['worldCard'];
  fullContent: WorldsMapDict['worldsContent'][WorldId];
  stats: { questionCount: number; estimatedTime: number };
  progress: { completed: number; total: number };
  locale: 'he' | 'en';
  worldNumber: number;
}

interface ProgressHeaderProps {
  userName?: string | null;
  completionPercent: number;
  completedCount: number;
  totalCount: number;
  nextRecommendedWorld?: WorldId;
  onGoToRecommended: () => void;
  dict: WorldsMapDict['progressHeader'];
  worldLabels: WorldsMapDict['worldLabels'];
  totalAnswered: number;
  totalQuestions: number;
}

// Enhanced Background Component
const EnhancedBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-30">
      <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-teal-300/40 to-cyan-400/25 rounded-full blur-3xl animate-float-slow" />
      <div
        className="absolute top-1/3 right-20 w-56 h-56 bg-gradient-to-br from-orange-300/35 to-amber-400/25 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-pink-300/30 to-rose-400/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-300/30 to-indigo-400/20 rounded-full blur-3xl animate-float-slow"
        style={{ animationDelay: '6s' }}
      />
    </div>
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:32px_32px]" />
    <svg
      className="absolute inset-0 w-full h-full opacity-5"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M0,250 Q250,150 500,250 T1000,250 L1000,0 L0,0 Z"
        fill="url(#bgGrad)"
        className="animate-pulse-slow"
      />
      <path
        d="M0,750 Q250,850 500,750 T1000,750 L1000,1000 L0,1000 Z"
        fill="url(#bgGrad)"
        className="animate-pulse-slow"
        style={{ animationDelay: '3s' }}
      />
    </svg>
  </div>
);

// Enhanced Progress Header
const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  userName,
  completionPercent,
  completedCount,
  totalCount,
  nextRecommendedWorld,
  onGoToRecommended,
  dict,
  worldLabels,
  totalAnswered,
  totalQuestions,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/60 overflow-hidden"
      initial={{ opacity: 0, y: -30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-teal-200/30 to-transparent rounded-bl-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-tr-full blur-xl" />

      <div className="relative z-10 p-6 sm:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-orange-100 rounded-full px-4 py-2 mb-4">
              <Map className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-teal-700">
                מפת העולמות שלך
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2 leading-tight">
              {userName ? (
                <>
                  היי {userName},
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                    איפה אנחנו במסע?
                  </span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
                    המסע שלך לגילוי עצמי
                  </span>
                </>
              )}
            </h1>
            <p className="text-base text-gray-600">
              השלמת {completedCount} מתוך {totalCount} עולמות •{' '}
              <span className="font-semibold text-teal-600">
                {totalAnswered} מתוך {totalQuestions} שאלות
              </span>
            </p>
          </div>

          {/* Completion Badge */}
          {completionPercent > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-extrabold text-white">
                    {completionPercent}%
                  </span>
                </div>
                {completionPercent === 100 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Trophy className="w-7 h-7 text-amber-500 fill-amber-400" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Progress
              value={completionPercent}
              className="h-3 rounded-full flex-1 bg-gray-200/80"
              indicatorClassName="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 transition-all duration-500 rounded-full"
            />
          </div>

          {/* Milestones */}
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span className={completionPercent >= 20 ? 'text-teal-600 font-bold' : ''}>
              התחלה
            </span>
            <span className={completionPercent >= 40 ? 'text-teal-600 font-bold' : ''}>
              במסלול
            </span>
            <span className={completionPercent >= 60 ? 'text-orange-600 font-bold' : ''}>
              בעיצומו
            </span>
            <span className={completionPercent >= 80 ? 'text-orange-600 font-bold' : ''}>
              כמעט שם
            </span>
            <span className={completionPercent === 100 ? 'text-amber-600 font-bold' : ''}>
              הושלם!
            </span>
          </div>
        </div>

        {/* Next Recommended Action */}
        {nextRecommendedWorld && completionPercent < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 border-t border-gray-200/60"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-400 to-orange-500 rounded-lg flex-shrink-0">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    הצעד הבא במסע
                  </h3>
                  <p className="text-sm text-gray-600">
                    מוכן/ה להמשיך ל
                    <span className="font-bold text-teal-600">
                      {' '}
                      {worldLabels[nextRecommendedWorld]}
                    </span>
                    ?
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={onGoToRecommended}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                <div className="relative z-10 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 fill-current" />
                  <span>בוא נמשיך!</span>
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Completion Message */}
        {completionPercent === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-4 border-t border-gray-200/60"
          >
            <div className="text-center p-6 bg-gradient-to-r from-teal-50 via-orange-50 to-amber-50 rounded-2xl">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500 fill-amber-400" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                🎉 כל הכבוד! השלמת את כל העולמות
              </h3>
              <p className="text-gray-600">
                עכשיו אפשר לעיין בפרופיל המלא שלך ולראות את דוח הנשמה
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced World Card
const WorldCard: React.FC<WorldCardProps> = ({
  worldId,
  status,
  onSelect,
  dict,
  fullContent,
  locale,
  stats,
  progress,
  worldNumber,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = worldsConfig[worldId];
  const { icon: Icon, themeColor } = config;
  const isRTL = locale === 'he';
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;

  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const colorMap = {
    sky: {
      gradient: 'from-sky-400 to-blue-500',
      bg: 'bg-sky-100',
      text: 'text-sky-600',
      border: 'border-sky-300',
      glow: 'shadow-sky-400/30',
    },
    rose: {
      gradient: 'from-rose-400 to-pink-500',
      bg: 'bg-rose-100',
      text: 'text-rose-600',
      border: 'border-rose-300',
      glow: 'shadow-rose-400/30',
    },
    purple: {
      gradient: 'from-purple-400 to-indigo-500',
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-300',
      glow: 'shadow-purple-400/30',
    },
    teal: {
      gradient: 'from-teal-400 to-emerald-500',
      bg: 'bg-teal-100',
      text: 'text-teal-600',
      border: 'border-teal-300',
      glow: 'shadow-teal-400/30',
    },
    amber: {
      gradient: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      border: 'border-amber-300',
      glow: 'shadow-amber-400/30',
    },
  };

  const colors = colorMap[themeColor as keyof typeof colorMap];

  const statusInfo = {
    completed: {
      Icon: CheckCircle2,
      text: 'הושלם',
      badge: 'bg-green-100 text-green-700 border-green-300',
      action: 'ערוך תשובות',
      ActionIcon: Edit3,
      cardStyle: 'border-green-300 bg-white/90',
    },
    recommended: {
      Icon: Star,
      text: 'מומלץ',
      badge:
        'bg-gradient-to-r from-teal-100 to-orange-100 text-teal-700 border-teal-300 font-bold animate-pulse-glow',
      action: 'התחל עכשיו',
      ActionIcon: Zap,
      cardStyle:
        'border-teal-400 bg-gradient-to-br from-white via-teal-50/30 to-orange-50/30 shadow-2xl scale-[1.02] ring-2 ring-teal-300/50',
    },
    active: {
      Icon: Target,
      text: 'בתהליך',
      badge: `${colors.bg} ${colors.text} ${colors.border}`,
      action: 'המשך',
      ActionIcon: ForwardArrow,
      cardStyle: `${colors.border} bg-white/90`,
    },
    available: {
      Icon: Compass,
      text: 'זמין',
      badge: 'bg-gray-100 text-gray-700 border-gray-300',
      action: 'התחל',
      ActionIcon: ForwardArrow,
      cardStyle: 'border-gray-300 bg-white/80',
    },
    locked: {
      Icon: Lock,
      text: 'נעול',
      badge: 'bg-gray-200 text-gray-500 border-gray-300',
      action: 'השלם עולמות קודמים',
      ActionIcon: Lock,
      cardStyle: 'border-gray-300 bg-gray-50/80 opacity-60',
    },
  }[status];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: worldNumber * 0.1 }}
      whileHover={
        status !== 'locked'
          ? { y: -8, scale: 1.02, transition: { duration: 0.3 } }
          : undefined
      }
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 ease-out h-full backdrop-blur-sm border-2',
          statusInfo.cardStyle,
          status === 'locked' && 'cursor-not-allowed',
          status === 'recommended' && 'animate-float-gentle'
        )}
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-full blur-xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/30 to-transparent rounded-tr-full blur-lg" />

        {/* Recommended Badge Ribbon */}
        {status === 'recommended' && (
          <div className="absolute top-4 -right-10 rotate-45 bg-gradient-to-r from-teal-500 to-orange-500 text-white text-xs font-bold px-12 py-1 shadow-lg z-20">
            מומלץ
          </div>
        )}

        <div className="relative z-10 p-6 space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            {/* Icon */}
            <motion.div
              className={cn(
                'relative p-4 rounded-2xl flex-shrink-0 bg-gradient-to-br shadow-lg',
                colors.gradient
              )}
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 backdrop-blur-sm" />
              <Icon className="relative z-10 w-8 h-8 text-white" />
            </motion.div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                'font-semibold text-xs px-3 py-1 border-2',
                statusInfo.badge
              )}
            >
              <statusInfo.Icon className="w-3 h-3 me-1.5 inline" />
              {statusInfo.text}
            </Badge>
          </div>

          {/* World Number */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-gray-600">
                עולם {worldNumber}
              </span>
            </div>
            {status === 'completed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
              {fullContent.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {fullContent.description}
            </p>
          </div>

          {/* Progress Bar (for active/in-progress worlds) */}
          {(status === 'active' || (status === 'completed' && progressPercent < 100)) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  התקדמות: {progress.completed}/{progress.total}
                </span>
                <span className={cn('font-bold', colors.text)}>
                  {progressPercent}%
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2 rounded-full bg-gray-200/80"
                indicatorClassName={cn('bg-gradient-to-r transition-all duration-500', colors.gradient)}
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-200/60">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                <BookUser className={cn('w-4 h-4', colors.text)} />
              </div>
              <span className="font-medium">{stats.questionCount} שאלות</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                <Clock className={cn('w-4 h-4', colors.text)} />
              </div>
              <span className="font-medium">~{stats.estimatedTime} דקות</span>
            </div>
          </div>

          {/* Expandable Details */}
          {fullContent.benefits && fullContent.benefits.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors w-full"
                disabled={status === 'locked'}
              >
                <span>מה תגלה בעולם הזה?</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 space-y-2">
                      {fullContent.benefits.map((benefit, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <Check className={cn('w-4 h-4 mt-0.5 flex-shrink-0', colors.text)} />
                          <span>{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Button */}
          <Button
            className={cn(
              'w-full font-bold shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden',
              status === 'completed' &&
                'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50',
              status === 'recommended' &&
                'bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white',
              (status === 'active' || status === 'available') &&
                `bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white`,
              status === 'locked' &&
                'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
            )}
            onClick={onSelect}
            disabled={status === 'locked'}
          >
            {(status === 'recommended' ||
              status === 'active' ||
              status === 'available') && (
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <statusInfo.ActionIcon className="w-4 h-4" />
              {statusInfo.action}
            </span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// Review Card Component
const ReviewCard: React.FC<{
  dict: WorldsMapDict['reviewCard'];
  locale: 'he' | 'en';
}> = ({ dict, locale }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const isRTL = locale === 'he';
  const ReviewButtonArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-teal-50/40 to-white backdrop-blur-md shadow-xl border-2 border-teal-200/60">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-200/30 to-transparent rounded-bl-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-200/30 to-transparent rounded-tr-full blur-xl" />

        <CardContent className="relative z-10 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl shadow-lg flex-shrink-0">
              <BookUser className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {dict.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {dict.description}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/profile?tab=questionnaire`}>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/90 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400 font-bold shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              <ReviewButtonArrow className="w-5 h-5 me-2 group-hover:-translate-x-1 transition-transform" />
              {dict.button}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Completion Banner Component
const CompletionBanner: React.FC<{
  userName?: string | null;
  dict: WorldsMapDict['completionBanner'];
}> = ({ userName, dict }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white text-center shadow-2xl border-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-float-slow" />
          <div
            className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl animate-float-slow"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <CardContent className="relative z-10 p-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
          >
            <Trophy className="w-20 h-20 mx-auto mb-6 text-amber-300 fill-amber-200" />
          </motion.div>

          <h2 className="text-4xl font-extrabold mb-4">
            {userName ? `כל הכבוד, ${userName}!` : 'כל הכבוד!'}
          </h2>
          <p className="text-xl font-semibold mb-2 opacity-95">
            {dict.subtitle}
          </p>
          <p className="text-base opacity-90 max-w-2xl mx-auto leading-relaxed">
            {dict.description}
          </p>

          <motion.div
            className="mt-8 flex items-center justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-semibold">5 עולמות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-semibold">דוח נשמה מלא</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = '',
  dict,
  locale,
  answers,
  worldStats,
}: WorldsMapProps) {
  const { data: session } = useSession();
  const isRTL = locale === 'he';

  useEffect(() => {
    console.log(
      `%c[WorldsMap] Language is now: ${locale}`,
      'color: #14b8a6; font-weight: bold; font-size: 14px;'
    );
  }, [locale]);

  const worldsProgress = useMemo(() => {
    const progressMap: Record<WorldId, { completed: number; total: number }> = {
      PERSONALITY: {
        completed: 0,
        total: worldStats.PERSONALITY.questionCount,
      },
      VALUES: { completed: 0, total: worldStats.VALUES.questionCount },
      RELATIONSHIP: {
        completed: 0,
        total: worldStats.RELATIONSHIP.questionCount,
      },
      PARTNER: { completed: 0, total: worldStats.PARTNER.questionCount },
      RELIGION: { completed: 0, total: worldStats.RELIGION.questionCount },
    };

    for (const worldId of WORLD_ORDER) {
      const answeredQuestionsInWorld = new Set(
        answers.filter((a) => a.worldId === worldId).map((a) => a.questionId)
      );
      progressMap[worldId].completed = answeredQuestionsInWorld.size;
    }

    return progressMap;
  }, [answers, worldStats]);

  const totalQuestions = useMemo(
    () => WORLD_ORDER.reduce((sum, w) => sum + worldStats[w].questionCount, 0),
    [worldStats]
  );

  const totalAnswered = useMemo(
    () => WORLD_ORDER.reduce((sum, w) => sum + worldsProgress[w].completed, 0),
    [worldsProgress]
  );

  const completionPercent = Math.round(
    (completedWorlds.length / WORLD_ORDER.length) * 100
  );

  const nextRecommendedWorld = WORLD_ORDER.find(
    (world) => !completedWorlds.includes(world)
  );

  const getWorldStatus = (worldId: WorldId): WorldStatus => {
    if (completedWorlds.includes(worldId)) return 'completed';
    if (worldId === nextRecommendedWorld) return 'recommended';
    if (worldId === currentWorld) return 'active';
    return 'available';
  };

  return (
    <div
      className={cn(
        'relative min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50 overflow-hidden',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <EnhancedBackground />

      <div className="relative max-w-7xl mx-auto space-y-8 z-10">
        {/* Progress Header */}
        <ProgressHeader
          userName={session?.user?.firstName}
          completionPercent={completionPercent}
          completedCount={completedWorlds.length}
          totalCount={WORLD_ORDER.length}
          nextRecommendedWorld={nextRecommendedWorld}
          onGoToRecommended={() =>
            nextRecommendedWorld && onWorldChange(nextRecommendedWorld)
          }
          dict={dict.progressHeader}
          worldLabels={dict.worldLabels}
          totalAnswered={totalAnswered}
          totalQuestions={totalQuestions}
        />

        {/* Review Card (shown after completing at least one world) */}
        {completedWorlds.length > 0 && completionPercent < 100 && (
          <ReviewCard dict={dict.reviewCard} locale={locale} />
        )}

        {/* Worlds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORLD_ORDER.map((worldId, index) => {
            const stats = {
              questionCount: worldStats[worldId].questionCount,
              estimatedTime: Math.max(
                5,
                Math.round(worldStats[worldId].questionCount * 0.4)
              ),
            };
            return (
              <WorldCard
                key={worldId}
                worldId={worldId}
                worldNumber={index + 1}
                status={getWorldStatus(worldId)}
                onSelect={() => onWorldChange(worldId)}
                dict={dict.worldCard}
                fullContent={dict.worldsContent[worldId]}
                stats={stats}
                locale={locale}
                progress={worldsProgress[worldId]}
              />
            );
          })}
        </div>

        {/* Completion Banner */}
        {completionPercent === 100 && (
          <CompletionBanner
            userName={session?.user?.firstName}
            dict={dict.completionBanner}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(20, 184, 166, 0.3);
          }
          50% { 
            box-shadow: 0 0 20px rgba(20, 184, 166, 0.6), 0 0 30px rgba(249, 115, 22, 0.4);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0) translateX(0); 
          }
          25% { 
            transform: translateY(-25px) translateX(15px); 
          }
          50% { 
            transform: translateY(-10px) translateX(25px); 
          }
          75% { 
            transform: translateY(-20px) translateX(10px); 
          }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-5px); 
          }
        }
        .animate-float-gentle {
          animation: float-gentle 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          100% { 
            transform: translateX(100%); 
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
}