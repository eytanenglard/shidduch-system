// src/components/questionnaire/layout/QuestionnaireLayout.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Menu,
  Save,
  CheckCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { WorldId } from '../types/types';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { QuestionnaireSidebar } from './QuestionnaireSidebar';
import type {
  QuestionnaireLayoutDict,
  MatchmakingQuestionnaireDict,
  QuestionnaireFaqDict,
  AccessibilityFeaturesDict,
} from '@/types/dictionary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Props Interface
export interface QuestionnaireLayoutProps {
  children: React.ReactNode;
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit?: () => void;
  locale?: 'he' | 'en';
  onSaveProgress?: () => Promise<void>;
  dict: {
    layout: QuestionnaireLayoutDict;
    worldLabels: MatchmakingQuestionnaireDict['worldLabels'];
    faq: QuestionnaireFaqDict;
    accessibilityFeatures: AccessibilityFeaturesDict;
  };
  // Props חדשים שיועברו מ-WorldComponent
  mobileHeaderContent?: React.ReactNode;
  onMenuOpen?: () => void;
}

const worldConfig = {
  PERSONALITY: { icon: () => <div />, themeColor: 'sky' },
  VALUES: { icon: () => <div />, themeColor: 'rose' },
  RELATIONSHIP: { icon: () => <div />, themeColor: 'purple' },
  PARTNER: { icon: () => <div />, themeColor: 'teal' },
  RELIGION: { icon: () => <div />, themeColor: 'amber' },
};

const colorMap = {
  sky: { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-600' },
  rose: { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-600' },
  purple: {
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  teal: { border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: {
    border: 'border-amber-300',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
};

export default function QuestionnaireLayout({
  children,
  currentWorld,
  completedWorlds,
  onWorldChange,
  onExit,
  locale = 'he',
  onSaveProgress,
  dict,
  mobileHeaderContent,
  onMenuOpen,
}: QuestionnaireLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const isLoggedIn = status === 'authenticated';

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const isRTL = locale === 'he';
  const currentThemeColor = worldConfig[currentWorld]?.themeColor || 'sky';
  const currentColors = colorMap[currentThemeColor as keyof typeof colorMap];

  const handleSave = useCallback(async () => {
    if (!onSaveProgress) return;
    setIsSaving(true);
    try {
      await onSaveProgress();
      setLastSaved(new Date());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed in layout:', err);
    } finally {
      setIsSaving(false);
    }
  }, [onSaveProgress]);

  const handleMenuOpen = () => {
    setIsMobileSidebarOpen(true);
    if (onMenuOpen) {
      onMenuOpen();
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50',
        isRTL ? 'rtl' : 'ltr'
      )}
    >
      {isDesktop ? (
        <div className="flex flex-row">
          <QuestionnaireSidebar
            currentWorld={currentWorld}
            completedWorlds={completedWorlds}
            onWorldChange={onWorldChange}
            onExit={onExit!}
            locale={locale}
            isLoggedIn={isLoggedIn}
            onSaveProgress={handleSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            lastSaved={lastSaved}
            dict={{
              layout: dict.layout,
              worldLabels: dict.worldLabels,
              faq: dict.faq,
              accessibilityFeatures: dict.accessibilityFeatures,
            }}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Mobile Sidebar Sheet - Hidden by default */}
          <Sheet
            open={isMobileSidebarOpen}
            onOpenChange={setIsMobileSidebarOpen}
          >
            <SheetContent
              side={isRTL ? 'right' : 'left'}
              className="w-[320px] p-0 flex flex-col"
            >
              <QuestionnaireSidebar
                currentWorld={currentWorld}
                completedWorlds={completedWorlds}
                onWorldChange={(worldId) => {
                  onWorldChange(worldId);
                  setIsMobileSidebarOpen(false);
                }}
                onExit={() => {
                  if (onExit) onExit();
                  setIsMobileSidebarOpen(false);
                }}
                locale={locale}
                isLoggedIn={isLoggedIn}
                onSaveProgress={handleSave}
                isSaving={isSaving}
                saveSuccess={saveSuccess}
                lastSaved={lastSaved}
                dict={dict}
              />
            </SheetContent>
          </Sheet>

          <main className="flex-1">
            {!isLoggedIn && (
              <div className="p-4">
                <div className="rounded-xl bg-yellow-50 p-4 border border-yellow-200 text-center">
                  <h3 className="text-sm font-semibold text-yellow-800">
                    {dict.layout.unauthenticatedPrompt.title}
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    {dict.layout.unauthenticatedPrompt.subtitle}
                  </p>
                  <div className="flex justify-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => router.push('/auth/signin')}
                    >
                      <LogIn className="w-4 h-4 ml-2" />
                      {dict.layout.unauthenticatedPrompt.loginButton}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => router.push('/auth/register')}
                    >
                      <UserPlus className="w-4 h-4 ml-2" />
                      {dict.layout.unauthenticatedPrompt.registerButton}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-2 sm:p-4">
              {/* העברת הפונקציה לפתיחת התפריט ל-children דרך Context או props */}
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    onMobileMenuOpen: handleMenuOpen,
                  });
                }
                return child;
              })}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
