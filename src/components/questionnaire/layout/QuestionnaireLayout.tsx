// src/components/questionnaire/layout/QuestionnaireLayout.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Heart,
  User,
  Users,
  Save,
  LogOut,
  Settings,
  HelpCircle,
  CheckCircle,
  Loader2,
  Menu,
  X,
  Home,
  ArrowRightLeft,
  LogIn,
  UserPlus,
  Scroll,
  ChevronLeft,
  Edit,
  BookUser,
  Info,
  EyeOff,
} from 'lucide-react';
import type { WorldId } from '../types/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import FAQ from '../components/FAQ';
import AccessibilityFeatures from '../components/AccessibilityFeatures';
import type {
  QuestionnaireLayoutDict,
  MatchmakingQuestionnaireDict,
} from '@/types/dictionary';

// Props Interface
export interface QuestionnaireLayoutProps {
  children: React.ReactNode;
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit?: () => void;
  language?: string;
  onSaveProgress?: () => Promise<void>;
  isLoggedIn?: boolean;
  dict: {
    // The dict is now structured
    layout: QuestionnaireLayoutDict;
    worldLabels: MatchmakingQuestionnaireDict['worldLabels'];
  };
}

const worldConfig = {
  PERSONALITY: { icon: User, themeColor: 'sky' },
  VALUES: { icon: Heart, themeColor: 'rose' },
  RELATIONSHIP: { icon: Users, themeColor: 'purple' },
  PARTNER: { icon: User, themeColor: 'teal' },
  RELIGION: { icon: Scroll, themeColor: 'amber' },
} as const;

export default function QuestionnaireLayout({
  children,
  currentWorld,
  completedWorlds,
  onWorldChange,
  onExit,
  language = 'he',
  isLoggedIn = false,
  onSaveProgress,
  dict,
}: QuestionnaireLayoutProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAccessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const currentThemeColor = worldConfig[currentWorld]?.themeColor || 'sky';
  const isRTL = language === 'he';
  const directionClass = isRTL ? 'rtl' : 'ltr';

  const handleSave = useCallback(async () => {
    if (!onSaveProgress) return;
    setIsSaving(true);
    try {
      await onSaveProgress();
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed in layout:', err);
    } finally {
      setIsSaving(false);
    }
  }, [onSaveProgress]);

  const NavButton = ({
    worldId,
    isMobile,
  }: {
    worldId: string;
    isMobile: boolean;
  }) => {
    const { icon: Icon, themeColor } =
      worldConfig[worldId as keyof typeof worldConfig];
    const label = dict.worldLabels[worldId as WorldId];
    const isActive = currentWorld === worldId;
    const isCompleted = completedWorlds.includes(worldId as WorldId);
    let status: 'active' | 'completed' | 'pending' = 'pending';
    if (isActive) status = 'active';
    else if (isCompleted) status = 'completed';

    const statusConfig = {
      active: {
        classes: `bg-${themeColor}-600 text-white shadow-lg hover:bg-${themeColor}-700 ring-2 ring-offset-2 ring-${themeColor}-400`,
        actionIcon: <ChevronLeft className="h-5 w-5 animate-pulse" />,
      },
      completed: {
        classes:
          'border-green-300 bg-green-50 text-green-800 hover:bg-green-100 opacity-90 hover:opacity-100',
        actionIcon: <Edit className="h-4 w-4 text-green-600" />,
      },
      pending: {
        classes: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700',
        actionIcon: null,
      },
    };
    const currentStatusConfig = statusConfig[status];

    return (
      <Button
        variant={'outline'}
        size={isMobile ? 'sm' : 'default'}
        className={cn(
          'flex items-center justify-between w-full mb-2 transition-all duration-200 rounded-lg',
          currentStatusConfig.classes,
          isMobile ? 'py-2 text-sm' : 'p-3'
        )}
        onClick={() => {
          onWorldChange(worldId as WorldId);
          if (isMobile) setShowMobileNav(false);
        }}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'h-5 w-5',
              isActive ? 'text-white' : `text-${themeColor}-500`
            )}
          />
          <span className="truncate text-right font-medium">{label}</span>
        </div>
        <div className="flex-shrink-0">{currentStatusConfig.actionIcon}</div>
      </Button>
    );
  };

  const ProfileNotice = () => (
    <div className="mx-4 my-2 p-3 bg-slate-100/80 border border-slate-200/90 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <Info className="h-4 w-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-600 leading-relaxed text-sm">
            <span className="font-medium text-slate-700">
              {dict.layout.profileNotice.title}
            </span>{' '}
            {dict.layout.profileNotice.textPart1}
            <span className="inline-flex items-center px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono">
              <EyeOff className="inline-block h-3 w-3 mr-1 text-slate-500" />
            </span>
            {dict.layout.profileNotice.textPart2}
            <br />
            <Link
              href="/profile?tab=questionnaire"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              target="_blank"
            >
              {dict.layout.profileNotice.link}
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  const UnauthenticatedPrompt = () => (
    <div className="p-3 my-3 bg-cyan-50/70 border border-cyan-200 rounded-lg text-center space-y-2">
      <p className="text-sm text-cyan-800 font-medium">
        {dict.layout.unauthenticatedPrompt.title}
      </p>
      <p className="text-xs text-cyan-700">
        {dict.layout.unauthenticatedPrompt.subtitle}
      </p>
      <div className="flex gap-2 justify-center pt-1">
        <Link href="/auth/signin">
          <Button variant="outline" size="sm" className="bg-white/80">
            <LogIn className="w-3 h-3 ml-1" />
            {dict.layout.unauthenticatedPrompt.loginButton}
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="default" size="sm">
            <UserPlus className="w-3 h-3 ml-1" />
            {dict.layout.unauthenticatedPrompt.registerButton}
          </Button>
        </Link>
      </div>
    </div>
  );

  const renderFAQButton = (isMobile: boolean) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? 'sm' : 'icon'}
          className={cn(
            'text-slate-500 hover:text-slate-800',
            isMobile
              ? 'w-full justify-start gap-3 p-3'
              : 'w-8 h-8 p-0 rounded-full'
          )}
          aria-label={dict.layout.tooltips.faq}
        >
          <HelpCircle className="h-5 w-5" />
          {isMobile && <span>{dict.layout.tooltips.faq}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-[90vw] max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{dict.layout.tooltips.faq}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FAQ />
        </div>
      </SheetContent>
    </Sheet>
  );

  const MobileNav = () => (
    <AnimatePresence>
      {showMobileNav && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowMobileNav(false)}
          />
          <motion.div
            initial={{ x: isRTL ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-3/4 max-w-xs bg-white shadow-lg p-4 z-50 ${directionClass} flex flex-col overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium flex items-center">
                <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-500" />
                {dict.layout.mobileNav.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileNav(false)}
                className="w-8 h-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-grow">
              {Object.keys(worldConfig).map((worldId) => (
                <NavButton key={worldId} worldId={worldId} isMobile={true} />
              ))}
            </div>
            {!isLoggedIn && <UnauthenticatedPrompt />}
            <div className="pt-4 mt-4 border-t space-y-2">
              <Link href="/profile?tab=questionnaire">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <BookUser className="h-4 w-4" />
                  {dict.layout.mobileNav.reviewAnswers}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={onExit}
              >
                <Home className="h-4 w-4" />
                {dict.layout.mobileNav.backToMap}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-500 hover:text-red-700"
                onClick={() => setShowExitPrompt(true)}
              >
                <LogOut className="h-4 w-4" />
                {dict.layout.mobileNav.exit}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`flex flex-col min-h-screen lg:flex-row bg-slate-50 ${directionClass}`}
    >
      <header
        className={cn(
          'lg:hidden sticky top-0 z-40 bg-white shadow-sm p-3 flex items-center justify-between',
          `border-b-2 border-${currentThemeColor}-200`
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileNav(true)}
          className="inline-flex items-center"
        >
          <Menu className="h-5 w-5" />
          {!isSmallScreen && <span className="ml-2">תפריט</span>}
        </Button>
        <div className="flex flex-col items-center">
          <h1
            className={cn(
              'text-sm font-semibold',
              `text-${currentThemeColor}-800`
            )}
          >
            {dict.worldLabels[currentWorld]}
          </h1>
          <div className="text-xs text-slate-500">
            {completedWorlds.length} / {Object.keys(worldConfig).length} הושלמו
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 rounded-full',
              isSaving
                ? `bg-${currentThemeColor}-100`
                : 'bg-green-50 text-green-600'
            )}
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>
      <MobileNav />
      <aside
        className={cn(
          'w-64 bg-white border-r hidden lg:flex lg:flex-col overflow-y-auto',
          isRTL ? 'border-l' : 'border-r'
        )}
      >
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg text-slate-800">
            {dict.layout.navHeader}
          </h3>
          <p className="text-xs text-slate-500">{dict.layout.navSubtitle}</p>
        </div>
        <div className="p-4 flex-grow">
          {Object.keys(worldConfig).map((worldId) => (
            <NavButton key={worldId} worldId={worldId} isMobile={false} />
          ))}
        </div>
        <ProfileNotice />
        {!isLoggedIn && (
          <div className="px-4">
            <UnauthenticatedPrompt />
          </div>
        )}
        <div className="p-4 border-t mt-auto space-y-2">
          {lastSaved && (
            <div className="flex items-center text-xs text-slate-500 mb-2">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              <span>
                {dict.layout.lastSaved.replace(
                  '{{time}}',
                  lastSaved.toLocaleTimeString()
                )}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {dict.layout.buttons.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {dict.layout.buttons.save}
              </>
            )}
          </Button>
          <Link href="/profile?tab=questionnaire">
            <Button variant="outline" className="w-full">
              <BookUser className="w-4 h-4 mr-2" />
              {dict.layout.buttons.review}
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={onExit}>
            <Home className="w-4 h-4 mr-2" />
            {dict.layout.buttons.map}
          </Button>
          <div className="flex gap-2 pt-2">
            {renderFAQButton(false)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 p-0 rounded-full text-slate-500"
                    onClick={() => setAccessibilityPanelOpen(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dict.layout.tooltips.accessibility}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-3 md:p-6 lg:pb-16 overflow-y-auto relative scroll-smooth">
        {children}
        <AccessibilityFeatures
          isPanelOpen={isAccessibilityPanelOpen}
          onPanelOpenChange={setAccessibilityPanelOpen}
          className="fixed bottom-4 right-4 lg:bottom-6 lg:left-6 lg:right-auto z-50"
        />
      </main>
      <AnimatePresence>
        {showExitPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {dict.layout.exitPrompt.title}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {dict.layout.exitPrompt.description}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExitPrompt(false)}
                    >
                      {dict.layout.exitPrompt.cancel}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await handleSave();
                        if (onExit) onExit();
                        setShowExitPrompt(false);
                      }}
                      disabled={isSaving}
                    >
                      {isSaving && (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      )}
                      {dict.layout.exitPrompt.saveAndExit}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setShowExitPrompt(false);
                        if (onExit) onExit();
                      }}
                    >
                      {dict.layout.exitPrompt.exitWithoutSaving}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
