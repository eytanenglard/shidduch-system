import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  Info,
  Globe,
  CheckCircle2,
  ChevronRight,
  Award,
  Star,
  TrendingUp,
  Timer,
  PlayCircle,
  BarChart3,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import type { WorldId } from '../types/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { QuestionnaireProgressDict } from '@/types/dictionary';

interface QuestionnaireProgressProps {
  completedWorlds: WorldId[];
  allWorlds?: WorldId[];
  currentWorld: WorldId;
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  estimatedTimeLeft?: number; // in minutes
  lastSaved?: Date | null;
  onWorldChange?: (worldId: WorldId) => void;
  className?: string;
  dict: QuestionnaireProgressDict;
}

export default function QuestionnaireProgress({
  completedWorlds,
  allWorlds = ['PERSONALITY', 'VALUES', 'RELATIONSHIP', 'PARTNER', 'RELIGION'],
  currentWorld,
  totalQuestions,
  answeredQuestions,
  requiredQuestions,
  answeredRequiredQuestions,
  estimatedTimeLeft = 0,
  lastSaved = null,
  onWorldChange,
  className = '',
  dict,
}: QuestionnaireProgressProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const worldLabels = dict.worldLabels;

  const totalCompletion = Math.round(
    (answeredQuestions / totalQuestions) * 100
  );
  const requiredCompletion = Math.round(
    (answeredRequiredQuestions / requiredQuestions) * 100
  );
  const worldsCompletion = Math.round(
    (completedWorlds.length / allWorlds.length) * 100
  );

  let progressStatus: 'low' | 'medium' | 'high' | 'complete' = 'low';
  if (totalCompletion >= 100) progressStatus = 'complete';
  else if (totalCompletion >= 75) progressStatus = 'high';
  else if (totalCompletion >= 40) progressStatus = 'medium';

  const statusColors = {
    low: 'text-amber-600',
    medium: 'text-blue-600',
    high: 'text-blue-700',
    complete: 'text-green-600',
  };
  const statusBgColors = {
    low: 'bg-amber-100',
    medium: 'bg-blue-100',
    high: 'bg-blue-100',
    complete: 'bg-green-100',
  };

  const formatTimeLeft = (minutes: number): string => {
    if (minutes < 1) return dict.timeStrings.lessThanAMinute;
    if (minutes < 60) return `${minutes} ${dict.timeStrings.minutesSuffix}`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ${dict.timeStrings.hours} ${mins > 0 ? `${dict.timeStrings.and}${mins} ${dict.timeStrings.minutesSuffix}` : ''}`;
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    if (diffInMinutes < 1) return dict.timeStrings.savedNow;
    if (diffInMinutes < 60)
      return dict.timeStrings.savedMinutesAgo.replace(
        '{{minutes}}',
        diffInMinutes.toString()
      );

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return dict.timeStrings.savedHoursAgo.replace(
        '{{hours}}',
        diffInHours.toString()
      );

    return dict.timeStrings.savedAtTime.replace(
      '{{time}}',
      date.toLocaleTimeString()
    );
  };

  const getNextRecommendedWorld = (): WorldId | null => {
    for (const world of allWorlds) {
      if (!completedWorlds.includes(world) && world !== currentWorld) {
        return world;
      }
    }
    return null;
  };

  const AccordionSection = ({
    title,
    icon,
    children,
    id,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    id: string;
  }) => {
    const isExpanded = expandedSection === id;

    return (
      <div className="border rounded-lg overflow-hidden mb-2">
        <button
          className={cn(
            'w-full flex items-center justify-between p-3 text-left transition-colors',
            isExpanded
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white hover:bg-gray-50'
          )}
          onClick={() => setExpandedSection(isExpanded ? null : id)}
        >
          <div className="flex items-center">
            <div
              className={cn(
                'mr-2',
                isExpanded ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              {icon}
            </div>
            <span
              className={cn('font-medium', isExpanded ? 'text-blue-700' : '')}
            >
              {title}
            </span>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 transition-transform',
              isExpanded ? 'transform rotate-90 text-blue-600' : 'text-gray-400'
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3 bg-blue-50/50 border-t">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const RewardsInfo = () => {
    const achievements = [
      {
        key: 'goal' as const,
        condition: requiredCompletion >= 100,
        icon: <Award className="h-4 w-4 text-amber-500" />,
      },
      {
        key: 'halfway' as const,
        condition: totalCompletion >= 50,
        icon: <Star className="h-4 w-4 text-amber-500" />,
      },
      {
        key: 'advanced' as const,
        condition: totalCompletion >= 80,
        icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      },
      {
        key: 'complete' as const,
        condition: totalCompletion >= 100,
        icon: <CheckCircle2 className="h-4 w-4 text-amber-500" />,
      },
    ];

    const earnedAchievements = achievements.filter((a) => a.condition);

    return (
      <div className="space-y-2">
        {earnedAchievements.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-2">
              {dict.rewards.achievedText}
            </p>
            <div className="space-y-2">
              {earnedAchievements.map((achievement, index) => {
                const achievementDict =
                  dict.rewards.achievements[achievement.key];
                return (
                  <div
                    key={index}
                    className="flex items-center bg-white p-2 rounded-lg border"
                  >
                    <div className="mr-2">{achievement.icon}</div>
                    <div>
                      <div className="font-medium text-sm">
                        {achievementDict.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {achievementDict.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {earnedAchievements.length < achievements.length && (
              <p className="text-xs text-gray-500 mt-3">
                {dict.rewards.moreToGo.replace(
                  '{{count}}',
                  (achievements.length - earnedAchievements.length).toString()
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-600">{dict.rewards.prompt}</p>
        )}
      </div>
    );
  };

  const WorldRecommendations = () => {
    const nextWorld = getNextRecommendedWorld();
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{dict.recommendations.title}</p>
        <div className="flex flex-col space-y-1">
          {allWorlds.map((world, index) => {
            const isCompleted = completedWorlds.includes(world);
            const isCurrent = currentWorld === world;
            const isNextRecommended = world === nextWorld;
            return (
              <div
                key={world}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border',
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : isCurrent
                      ? 'bg-blue-50 border-blue-200'
                      : isNextRecommended
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-gray-200'
                )}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full mr-2 text-gray-600 bg-white border">
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      isCompleted
                        ? 'text-green-700'
                        : isCurrent
                          ? 'text-blue-700'
                          : isNextRecommended
                            ? 'text-amber-700'
                            : ''
                    )}
                  >
                    {worldLabels[world as keyof typeof worldLabels]}
                  </span>
                </div>
                <div className="flex items-center">
                  {isCompleted ? (
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {dict.recommendations.statuses.completed}
                    </Badge>
                  ) : isCurrent ? (
                    <Badge className="bg-blue-100 text-blue-800 border-0">
                      <PlayCircle className="w-3 h-3 mr-1" />
                      {dict.recommendations.statuses.active}
                    </Badge>
                  ) : isNextRecommended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                      onClick={() => onWorldChange?.(world)}
                    >
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      {dict.recommendations.ctaButton}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 text-xs">
                      {dict.recommendations.statuses.pending}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TimeBreakdown = () => {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600 flex items-center">
          <Timer className="h-4 w-4 mr-1 text-blue-500" />
          <span>
            {dict.timeBreakdown.title.replace(
              '{{timeLeft}}',
              formatTimeLeft(estimatedTimeLeft)
            )}
          </span>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="text-xs text-gray-500">
            {dict.timeBreakdown.subtitle}
          </div>
          {allWorlds.map((world) => {
            const isCompleted = completedWorlds.includes(world);
            const remainingWorlds = allWorlds.length - completedWorlds.length;
            const timePerWorld =
              remainingWorlds > 0
                ? Math.round(estimatedTimeLeft / remainingWorlds)
                : 0;
            return (
              <div key={world} className="flex items-center justify-between">
                <span className="text-sm flex items-center">
                  {isCompleted ? (
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 mr-1 text-blue-400" />
                  )}
                  {worldLabels[world as keyof typeof worldLabels]}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  )}
                >
                  {isCompleted
                    ? dict.timeBreakdown.statusCompleted
                    : dict.timeBreakdown.timePerWorld.replace(
                        '{{time}}',
                        timePerWorld.toString()
                      )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getProgressBadgeText = () => {
    if (progressStatus === 'complete') return dict.statusBadge.complete;
    if (totalCompletion <= 5) return dict.statusBadge.started;
    return dict.statusBadge.progress.replace(
      '{{progress}}',
      totalCompletion.toString()
    );
  };

  const renderMobile = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
          {dict.mobile.title}
        </h3>
        <Badge
          className={cn(
            statusBgColors[progressStatus],
            'text-xs border-0',
            statusColors[progressStatus]
          )}
        >
          {getProgressBadgeText()}
        </Badge>
      </div>
      <div className="space-y-2 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">{dict.mobile.totalLabel}</span>
            <span className="font-medium">
              {answeredQuestions} / {totalQuestions}
            </span>
          </div>
          <Progress value={totalCompletion} className="h-2" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">{dict.mobile.requiredLabel}</span>
            <span
              className={cn(
                'font-medium',
                requiredCompletion < 100
                  ? answeredRequiredQuestions === 0
                    ? 'text-red-600'
                    : 'text-amber-600'
                  : 'text-green-600'
              )}
            >
              {answeredRequiredQuestions} / {requiredQuestions}
            </span>
          </div>
          <Progress
            value={requiredCompletion}
            className={cn('h-2', requiredCompletion < 100 ? 'bg-gray-100' : '')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs pt-1">
        {estimatedTimeLeft > 0 && (
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
            <span className="text-gray-600">
              {dict.mobile.timeLeftLabel.replace(
                '{{timeLeft}}',
                formatTimeLeft(estimatedTimeLeft)
              )}
            </span>
          </div>
        )}
        {lastSaved && (
          <div className="flex items-center">
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" />
            <span className="text-gray-600">
              {dict.mobile.savedLabel.replace(
                '{{time}}',
                getRelativeTime(lastSaved)
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktop = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-medium">{dict.desktop.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{dict.desktop.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    statusBgColors[progressStatus],
                    'text-xs border-0 py-1 px-2',
                    statusColors[progressStatus]
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  {getProgressBadgeText()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dict.desktop.tooltip.completionDetails
                    .replace('{{answered}}', answeredQuestions.toString())
                    .replace('{{total}}', totalQuestions.toString())}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 max-w-xs">
                  <p className="font-medium">
                    {dict.desktop.tooltip.progressInfoTitle}
                  </p>
                  <p className="text-xs">
                    {dict.desktop.tooltip.progressInfoDesc}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              {dict.desktop.progressSummaryTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    {dict.mobile.totalLabel}
                  </span>
                  <span className="font-medium">
                    {answeredQuestions} / {totalQuestions}
                  </span>
                </div>
                <Progress value={totalCompletion} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    {dict.mobile.requiredLabel}
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      requiredCompletion < 100
                        ? answeredRequiredQuestions === 0
                          ? 'text-red-600'
                          : 'text-amber-600'
                        : 'text-green-600'
                    )}
                  >
                    {answeredRequiredQuestions} / {requiredQuestions}
                  </span>
                </div>
                <Progress
                  value={requiredCompletion}
                  className={cn(
                    'h-2',
                    requiredCompletion < 100 ? 'bg-gray-100' : ''
                  )}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    {dict.desktop.worldsTitle}
                  </span>
                  <span className="font-medium">
                    {completedWorlds.length} / {allWorlds.length}
                  </span>
                </div>
                <Progress value={worldsCompletion} className="h-2" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 mt-2 border-t text-sm">
              {estimatedTimeLeft > 0 && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-gray-600">
                    {dict.mobile.timeLeftLabel.replace(
                      '{{timeLeft}}',
                      formatTimeLeft(estimatedTimeLeft)
                    )}
                  </span>
                </div>
              )}
              {lastSaved && (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-gray-600">
                    {dict.mobile.savedLabel.replace(
                      '{{time}}',
                      lastSaved.toLocaleTimeString()
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-12 md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="h-5 w-5 mr-2 text-amber-500" />
              {dict.desktop.achievementsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RewardsInfo />
          </CardContent>
        </Card>
        <Card className="col-span-12">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              {dict.desktop.worldsTitle}
            </CardTitle>
            <CardDescription>{dict.desktop.worldsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AccordionSection
                title={dict.desktop.accordion.recommendations}
                icon={<Star className="h-4 w-4" />}
                id="worlds-recommendations"
              >
                <WorldRecommendations />
              </AccordionSection>
              <AccordionSection
                title={dict.desktop.accordion.timeBreakdown}
                icon={<Clock className="h-4 w-4" />}
                id="time-breakdown"
              >
                <TimeBreakdown />
              </AccordionSection>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-4', className)}>
      {isTablet ? renderMobile() : renderDesktop()}
    </div>
  );
}
