// src/components/questionnaire/layout/WorldsMap.tsx

import React, { useState, useEffect } from 'react'; // הוסף את useEffect אם הוא חסר
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Brain,
  BookUser,
  ChevronDown,
  Clock,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import type { WorldsMapDict } from '@/types/dictionary';

// Importowanie pytań w celu uzyskania dynamicznych statystyk
import { personalityQuestions } from '../questions/personality/personalityQuestions';
import { valuesQuestions } from '../questions/values/valuesQuestions';
import { relationshipQuestions } from '../questions/relationship/relationshipQuestions';
import { partnerQuestions } from '../questions/partner/partnerQuestions';
import { religionQuestions } from '../questions/religion/religionQuestions';

// Konfiguracja wizualna (ikony, kolory) — etykiety tekstowe zostały usunięte
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

// Dynamiczne obliczanie statystyk dla każdego świata
const worldStats = {
  PERSONALITY: {
    questionCount: personalityQuestions.length,
    estimatedTime: Math.max(5, Math.round(personalityQuestions.length * 0.4)),
  },
  VALUES: {
    questionCount: valuesQuestions.length,
    estimatedTime: Math.max(5, Math.round(valuesQuestions.length * 0.4)),
  },
  RELATIONSHIP: {
    questionCount: relationshipQuestions.length,
    estimatedTime: Math.max(5, Math.round(relationshipQuestions.length * 0.4)),
  },
  PARTNER: {
    questionCount: partnerQuestions.length,
    estimatedTime: Math.max(5, Math.round(partnerQuestions.length * 0.4)),
  },
  RELIGION: {
    questionCount: religionQuestions.length,
    estimatedTime: Math.max(5, Math.round(religionQuestions.length * 0.4)),
  },
};

// Interfejsy propsów komponentów
interface WorldsMapProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
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
  locale: 'he' | 'en'; // <-- הוסף שורה זו
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
}

// Podkomponenty
const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  userName,
  completionPercent,
  completedCount,
  totalCount,
  nextRecommendedWorld,
  onGoToRecommended,
  dict,
  worldLabels,
}) => (
  <motion.div
    className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/60 space-y-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
        {userName
          ? dict.greeting.replace('{{name}}', userName)
          : dict.defaultTitle}
      </h1>
      <p className="text-md text-gray-600 mt-1">
        {dict.progressText
          .replace('{{completedCount}}', completedCount.toString())
          .replace('{{totalCount}}', totalCount.toString())}
      </p>
    </div>
    <div className="flex items-center gap-4">
      <Progress
        value={completionPercent}
        className="h-2.5 rounded-full"
        indicatorClassName="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500"
      />
      <span className="font-bold text-teal-600 text-lg">
        {completionPercent}%
      </span>
    </div>
    {nextRecommendedWorld && (
      <Button
        size="lg"
        onClick={onGoToRecommended}
        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 animate-pulse-slow"
      >
        <Sparkles className="h-5 w-5 me-2 fill-current" />
        {dict.ctaButton.replace(
          '{{worldName}}',
          worldLabels[nextRecommendedWorld]
        )}
      </Button>
    )}
  </motion.div>
);

const WorldCard: React.FC<WorldCardProps> = ({
  worldId,
  status,
  onSelect,
  dict,
  fullContent,
  locale,
  stats,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = worldsConfig[worldId];
  const { icon: Icon, themeColor } = config;
  const isRTL = locale === 'he';

  const ForwardArrow = isRTL ? ArrowLeft : ArrowRight;
  const statusInfo = {
    completed: {
      Icon: CheckCircle2,
      text: dict.statuses.completed,
      badge: 'bg-green-100 text-green-800 border-green-300',
      action: dict.actions.edit,
      ActionIcon: Edit3,
    },
    recommended: {
      Icon: Star,
      text: dict.statuses.recommended,
      badge:
        'bg-gradient-to-r from-teal-100 to-orange-100 text-teal-800 border-teal-300',
      action: dict.actions.start,
      ActionIcon: ForwardArrow,
    },
    active: {
      Icon: Sparkles,
      text: dict.statuses.active,
      badge: `bg-${themeColor}-100 text-${themeColor}-800 border-${themeColor}-300`,
      action: dict.actions.continue,
      ActionIcon: ForwardArrow,
    },
    available: {
      Icon: ArrowRight,
      text: dict.statuses.available,
      badge: 'bg-gray-100 text-gray-800 border-gray-300',
      action: dict.actions.start,
      ActionIcon: ForwardArrow,
    },
    locked: {
      Icon: Lock,
      text: dict.statuses.locked,
      badge: 'bg-gray-200 text-gray-600 border-gray-300',
      action: dict.actions.locked,
      ActionIcon: Lock,
    },
  }[status];

  return (
    <Card
      className={cn(
        'flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm border-2',
        status === 'recommended' &&
          'border-gradient-to-r from-teal-300 to-orange-300 scale-105 shadow-2xl ring-2 ring-teal-200',
        status === 'locked' &&
          'opacity-60 bg-gray-50 cursor-not-allowed border-gray-200'
      )}
    >
      <div className="p-6 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              'p-3 rounded-xl flex-shrink-0',
              `bg-${themeColor}-100`
            )}
          >
            <Icon className={cn('w-8 h-8', `text-${themeColor}-600`)} />
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', statusInfo.badge)}
          >
            <statusInfo.Icon className="w-3.5 h-3.5 ms-1.5" />
            {statusInfo.text}
          </Badge>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {fullContent.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{fullContent.subtitle}</p>
        </div>
      </div>

      <div className="px-6 text-sm text-gray-500">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          {isExpanded ? dict.showLess : dict.readMore}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pt-4 pb-6 space-y-5">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Brain className={`w-5 h-5 text-${themeColor}-500`} />
                  {fullContent.whyIsItImportant}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {fullContent.whyIsItImportant}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 text-${themeColor}-500`} />
                  {fullContent.whatYouWillDiscover[0]}
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600">
                  {fullContent.whatYouWillDiscover.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <blockquote
                className={`border-s-4 border-${themeColor}-300 ps-4 py-2 bg-${themeColor}-50/60 my-4`}
              >
                <p className="text-sm text-gray-700 italic">
                  {fullContent.guidingThought}
                </p>
              </blockquote>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow" />

      <div className="p-4 bg-gray-50/80 mt-auto border-t">
        <div className="flex justify-between text-xs text-gray-500 mb-3 px-2">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            {dict.questionCount.replace(
              '{{count}}',
              stats.questionCount.toString()
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {dict.estimatedTime.replace(
              '{{count}}',
              stats.estimatedTime.toString()
            )}
          </span>
        </div>
        <Button
          className={cn(
            'w-full font-medium',
            `bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white`
          )}
          onClick={onSelect}
          disabled={status === 'locked'}
        >
          <statusInfo.ActionIcon className="w-4 h-4 ms-2" />
          {statusInfo.action}
        </Button>
      </div>
    </Card>
  );
};

// Komponent główny
export default function WorldsMap({
  currentWorld,
  completedWorlds,
  onWorldChange,
  className = '',
  dict,
  locale,
}: WorldsMapProps) {
  const { data: session } = useSession();

  const isRTL = locale === 'he';
  useEffect(() => {
    console.log(
      `%c[WorldsMap] Language is now: ${locale}`,
      'color: #007acc; font-weight: bold;'
    );
  }, [locale]);

  const completionPercent = Math.round(
    (completedWorlds.length / WORLD_ORDER.length) * 100
  );
  const nextRecommendedWorld = WORLD_ORDER.find(
    (world) => !completedWorlds.includes(world)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const getWorldStatus = (worldId: WorldId): WorldStatus => {
    if (completedWorlds.includes(worldId)) return 'completed';
    if (worldId === nextRecommendedWorld) return 'recommended';
    if (worldId === currentWorld) return 'active';
    return 'available';
  };

  const ReviewButtonArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className={cn(
        'p-4 sm:p-6 bg-gradient-to-b from-white via-teal-50/20 to-white min-h-screen relative overflow-hidden',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'} // Kluczowa zmiana: ustawienie kierunku
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-teal-200/30 to-orange-200/20 rounded-full blur-3xl animate-float-slow" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-2xl animate-float-slow"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-teal-200/25 to-amber-200/20 rounded-full blur-3xl animate-float-slow"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-orange-200/30 to-amber-200/25 rounded-full blur-2xl animate-float-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>
      <div className="max-w-7xl mx-auto space-y-8 relative">
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
        />
        {completedWorlds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-md shadow-md border border-white/60">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <BookUser className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {dict.reviewCard.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dict.reviewCard.description}
                    </p>
                  </div>
                </div>
                <Link href={`/${locale}/profile?tab=questionnaire`}>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white/80 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300"
                  >
                    <ReviewButtonArrow className="w-4 h-4 me-2" />
                    {dict.reviewCard.button}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {WORLD_ORDER.map((worldId) => (
            <motion.div variants={itemVariants} key={worldId}>
              <WorldCard
                worldId={worldId}
                status={getWorldStatus(worldId)}
                onSelect={() => onWorldChange(worldId)}
                dict={dict.worldCard}
                fullContent={dict.worldsContent[worldId]}
                stats={worldStats[worldId]}
                locale={locale} // <-- הוסף שורה זו
              />
            </motion.div>
          ))}
        </motion.div>
        {completionPercent === 100 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white text-center p-8 rounded-2xl shadow-2xl">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold">
                {dict.completionBanner.title.replace(
                  '{{name}}',
                  session?.user?.firstName || ''
                )}
              </h2>
              <p className="mt-2 text-lg opacity-90">
                {dict.completionBanner.subtitle}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {dict.completionBanner.description}
              </p>
            </Card>
          </motion.div>
        )}
      </div>
      <style jsx global>{`
        @keyframes pulse-slow {
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(0.5deg);
          }
          75% {
            transform: translateY(3px) rotate(-0.5deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
