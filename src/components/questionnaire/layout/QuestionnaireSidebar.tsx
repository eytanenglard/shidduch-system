// src/components/questionnaire/layout/QuestionnaireSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  User,
  Users,
  Save,
  CheckCircle,
  Loader2,
  UserCheck,
  Home,
  LogIn,
  UserPlus,
  Scroll,
  ChevronLeft,
  ChevronRight,
  Edit,
  BookUser,
  Info,
  Sparkles,
  Target,
  Compass,
  Award,
  Check,
} from 'lucide-react';
import type { WorldId } from '../types/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import FAQ from '../components/FAQ';
import type {
  QuestionnaireLayoutDict,
  MatchmakingQuestionnaireDict,
  QuestionnaireFaqDict,
  AccessibilityFeaturesDict,
} from '@/types/dictionary';

// Interface for props
interface QuestionnaireSidebarProps {
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit: () => void;
  locale: 'he' | 'en';
  isLoggedIn: boolean;
  onSaveProgress: () => Promise<void>;
  isSaving: boolean;
  saveSuccess: boolean;
  lastSaved: Date | null;
  dict: {
    layout: QuestionnaireLayoutDict;
    worldLabels: MatchmakingQuestionnaireDict['worldLabels'];
    faq: QuestionnaireFaqDict;
    accessibilityFeatures: AccessibilityFeaturesDict;
  };
}

const worldConfig = {
  PERSONALITY: { icon: User, themeColor: 'sky', order: 1 },
  VALUES: { icon: Heart, themeColor: 'rose', order: 2 },
  RELATIONSHIP: { icon: Users, themeColor: 'purple', order: 3 },
  PARTNER: { icon: UserCheck, themeColor: 'teal', order: 4 },
  RELIGION: { icon: Scroll, themeColor: 'amber', order: 5 },
} as const;

const WORLD_ORDER: WorldId[] = [
  'PERSONALITY',
  'VALUES',
  'RELATIONSHIP',
  'PARTNER',
  'RELIGION',
];

const colorMap = {
  sky: {
    gradient: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-300',
    ring: 'ring-sky-400',
  },
  rose: {
    gradient: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-300',
    ring: 'ring-rose-400',
  },
  purple: {
    gradient: 'from-purple-400 to-indigo-500',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-300',
    ring: 'ring-purple-400',
  },
  teal: {
    gradient: 'from-teal-400 to-emerald-500',
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-300',
    ring: 'ring-teal-400',
  },
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-300',
    ring: 'ring-amber-400',
  },
};

const completedStyles = {
  sky: {
    border: 'border-sky-300',
    bgGradient: 'bg-gradient-to-r from-sky-50 to-sky-100',
    hoverGradient: 'hover:from-sky-100 hover:to-sky-150',
  },
  rose: {
    border: 'border-rose-300',
    bgGradient: 'bg-gradient-to-r from-rose-50 to-rose-100',
    hoverGradient: 'hover:from-rose-100 hover:to-rose-150',
  },
  purple: {
    border: 'border-purple-300',
    bgGradient: 'bg-gradient-to-r from-purple-50 to-purple-100',
    hoverGradient: 'hover:from-purple-100 hover:to-purple-150',
  },
  teal: {
    border: 'border-teal-300',
    bgGradient: 'bg-gradient-to-r from-teal-50 to-teal-100',
    hoverGradient: 'hover:from-teal-100 hover:to-teal-150',
  },
  amber: {
    border: 'border-amber-300',
    bgGradient: 'bg-gradient-to-r from-amber-50 to-amber-100',
    hoverGradient: 'hover:from-amber-100 hover:to-amber-150',
  },
} as const;

type ThemeColor = keyof typeof colorMap;

const NavButton = React.memo(
  ({
    worldId,
    currentWorld,
    completedWorlds,
    onWorldChange,
    dict,
    isMobile = false,
    currentThemeColor,
    locale,
  }: {
    worldId: WorldId;
    currentWorld: WorldId;
    completedWorlds: WorldId[];
    onWorldChange: (worldId: WorldId) => void;
    dict: QuestionnaireSidebarProps['dict'];
    isMobile?: boolean;
    currentThemeColor: ThemeColor;
    locale: 'he' | 'en';
  }) => {
    const { icon: Icon, themeColor, order } = worldConfig[worldId];
    const label = dict.worldLabels[worldId];
    const isActive = currentWorld === worldId;
    const isCompleted = completedWorlds.includes(worldId);
    const colors = colorMap[themeColor];
    const currentColors = colorMap[currentThemeColor];
    const isRTL = locale === 'he';

    let status: 'active' | 'completed' | 'available' = 'available';
    if (isActive) status = 'active';
    else if (isCompleted) status = 'completed';

    const statusConfig = {
      active: {
        containerClass: cn(
          'relative overflow-hidden border-2 shadow-lg',
          `bg-gradient-to-r ${colors.gradient} ${colors.border}`,
          'ring-2 ring-offset-1',
          colors.ring
        ),
        textClass: 'text-white font-bold',
        iconClass: 'text-white',
        badge: (
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex-shrink-0"
          >
            {isRTL ? (
              <ChevronLeft className="h-5 w-5 text-white" />
            ) : (
              <ChevronRight className="h-5 w-5 text-white" />
            )}
          </motion.div>
        ),
        shimmer: true,
      },
      completed: {
        containerClass: cn(
          'border-2 shadow-sm hover:shadow-md',
          completedStyles[currentThemeColor].border,
          completedStyles[currentThemeColor].bgGradient,
          completedStyles[currentThemeColor].hoverGradient
        ),
        textClass: cn('font-semibold', currentColors.text),
        iconClass: currentColors.text,
        badge: (
          <div className="flex items-center gap-1">
            <Check className={cn('h-4 w-4', currentColors.text)} />
            <Edit
              className={cn('h-3.5 w-3.5 opacity-60', currentColors.text)}
            />
          </div>
        ),
        shimmer: false,
      },
      available: {
        containerClass: cn(
          'bg-white border-2 border-gray-200',
          'hover:bg-gray-50 hover:border-gray-300',
          'shadow-sm hover:shadow'
        ),
        textClass: 'text-gray-700 font-medium',
        iconClass: colors.text,
        badge: null,
        shimmer: false,
      },
    };
    const config = statusConfig[status];

    return (
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: order * 0.05 }}
      >
        <Button
          variant="ghost"
          size={isMobile ? 'sm' : 'default'}
          className={cn(
            'flex items-center justify-between w-full mb-2.5 transition-all duration-300 rounded-xl relative',
            config.containerClass,
            isMobile ? 'py-3 px-3' : 'p-4 h-auto'
          )}
          onClick={() => onWorldChange(worldId)}
        >
          {config.shimmer && (
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full animate-shimmer"></span>
          )}
          <div className="relative z-10 flex items-center gap-3 flex-1">
            <div
              className={cn(
                'p-2 rounded-lg flex-shrink-0 transition-all duration-300',
                status === 'active'
                  ? 'bg-white/20 backdrop-blur-sm'
                  : status === 'completed'
                    ? currentColors.bg
                    : colors.bg
              )}
            >
              <Icon className={cn('h-5 w-5', config.iconClass)} />
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className={cn('truncate text-sm', config.textClass)}>
                {label}
              </span>
              {!isMobile && (
                <span
                  className={cn(
                    'text-xs font-normal',
                    status === 'active' ? 'text-white/80' : 'text-gray-500'
                  )}
                >
                  {status === 'active' && dict.layout.navButtonStatus.active}
                  {status === 'completed' &&
                    dict.layout.navButtonStatus.completed}
                  {status === 'available' &&
                    dict.layout.navButtonStatus.available.replace(
                      '{{order}}',
                      String(order)
                    )}
                </span>
              )}
            </div>
            <div className="flex-shrink-0">{config.badge}</div>
          </div>
        </Button>
      </motion.div>
    );
  }
);
NavButton.displayName = 'NavButton';

const _QuestionnaireSidebar: React.FC<QuestionnaireSidebarProps> = ({
  currentWorld,
  completedWorlds,
  onWorldChange,
  onExit,
  locale,
  isLoggedIn,
  onSaveProgress,
  isSaving,
  saveSuccess,
  lastSaved,
  dict,
}) => {
  const isRTL = locale === 'he';
  const profileLinkWithTab = `/${locale}/profile?tab=questionnaire`;
  const currentThemeColor = worldConfig[currentWorld].themeColor;
  const currentColors = colorMap[currentThemeColor];

  const completionPercent = Math.round(
    (completedWorlds.length / WORLD_ORDER.length) * 100
  );

  return (
    <>
      <div className="relative p-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white">
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl">
                {dict.layout.sidebarHeader.title}
              </h3>
              <p className="text-sm text-white/90">
                {dict.layout.sidebarHeader.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 my-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-200/60 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-lg', currentColors.bg)}>
              <Target className={cn('h-4 w-4', currentColors.text)} />
            </div>
            <span className="text-sm font-bold text-gray-800">
              {dict.layout.sidebarProgress.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">
              {dict.layout.sidebarProgress.worldsLabel
                .replace('{{completedCount}}', String(completedWorlds.length))
                .replace('{{totalCount}}', String(WORLD_ORDER.length))}
            </span>
            <span className={cn('text-base font-bold', currentColors.text)}>
              {completionPercent}%
            </span>
          </div>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full',
              currentColors.gradient
            )}
          />
        </div>
        {completionPercent === 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <Award className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-bold text-amber-600">
              {dict.layout.sidebarProgress.completionMessage}
            </p>
          </motion.div>
        )}
      </motion.div>
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="space-y-1">
          {WORLD_ORDER.map((worldId) => (
            <NavButton
              key={worldId}
              worldId={worldId}
              currentWorld={currentWorld}
              completedWorlds={completedWorlds}
              onWorldChange={onWorldChange}
              dict={dict}
              currentThemeColor={currentThemeColor}
              locale={locale}
            />
          ))}
        </div>
      </div>
      {!isLoggedIn && (
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto my-3 p-5 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-300/60 rounded-xl shadow-md"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-base text-cyan-900 font-bold">
                {dict.layout.unauthenticatedPrompt.title}
              </p>
              <p className="text-sm text-cyan-700 leading-relaxed">
                {dict.layout.unauthenticatedPrompt.subtitle}
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400 font-semibold shadow-sm"
                  >
                    <LogIn className="w-4 h-4 ml-1" />
                    {dict.layout.unauthenticatedPrompt.loginButton}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-md"
                  >
                    <UserPlus className="w-4 h-4 ml-1" />
                    {dict.layout.unauthenticatedPrompt.registerButton}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <div className="p-4 border-t-2 border-gray-200 mt-auto space-y-3 bg-gray-50/50">
        {lastSaved && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center justify-center gap-2 p-2 bg-green-100/80 rounded-lg border border-green-300/60"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              {dict.layout.lastSavedSuccess.replace(
                '{{time}}',
                lastSaved.toLocaleTimeString(
                  locale === 'he' ? 'he-IL' : 'en-US'
                )
              )}
            </span>
          </motion.div>
        )}
        <Button
          variant="outline"
          className={cn(
            'w-full font-bold shadow-sm border-2 transition-all duration-300',
            saveSuccess
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white hover:bg-gray-50 border-gray-300'
          )}
          onClick={onSaveProgress}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {dict.layout.saveButton.saving}
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {dict.layout.saveButton.saved}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {dict.layout.saveButton.default}
            </>
          )}
        </Button>
        <Link href={profileLinkWithTab}>
          <Button
            variant="outline"
            className="w-full font-semibold border-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
          >
            <BookUser className="w-4 h-4 mr-2" />
            {dict.layout.actionButtons.review}
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full font-semibold border-2 border-gray-300 hover:bg-gray-50"
          onClick={onExit}
        >
          <Home className="w-4 h-4 mr-2" />
          {dict.layout.actionButtons.exitToMap}
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="w-full justify-start gap-2 bg-white hover:bg-gray-50 border-2 border-gray-200 font-semibold"
            >
              <div className="p-1 bg-purple-100 rounded">
                <Info className="h-3.5 w-3.5 text-purple-600" />
              </div>
              {dict.layout.actionButtons.faq}
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isRTL ? 'left' : 'right'}
            className="w-full sm:max-w-lg"
          >
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">
                {dict.layout.faqSheet.title}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FAQ dict={dict.faq} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export const QuestionnaireSidebar: React.FC<QuestionnaireSidebarProps> = (
  props
) => {
  return (
    <aside className="w-full lg:w-96 bg-gradient-to-b from-white to-gray-100/60 border-e-2 border-gray-200/80 flex flex-col h-screen sticky top-0">
      <_QuestionnaireSidebar {...props} />
    </aside>
  );
};
