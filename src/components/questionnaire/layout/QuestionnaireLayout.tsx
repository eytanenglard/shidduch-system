// src/components/questionnaire/layout/QuestionnaireLayout.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Menu, Save, CheckCircle } from 'lucide-react';
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
// <-- שינוי 1: ייבואים חדשים לצורך בדיקת אימות וניווט
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Props Interface
export interface QuestionnaireLayoutProps {
  children: React.ReactNode;
  currentWorld: WorldId;
  completedWorlds: WorldId[];
  onWorldChange: (worldId: WorldId) => void;
  onExit?: () => void;
  locale?: 'he' | 'en';
  onSaveProgress?: () => Promise<void>;
  // isLoggedIn?: boolean;  <-- שינוי 2: הסרנו את Prop הזה, כי הקומפוננטה תדע לבדוק זאת בעצמה
  dict: {
    layout: QuestionnaireLayoutDict;
    worldLabels: MatchmakingQuestionnaireDict['worldLabels'];
    faq: QuestionnaireFaqDict;
    accessibilityFeatures: AccessibilityFeaturesDict;
  };
}

// הגדרות עיצוב נשארות כפי שהן
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
}: QuestionnaireLayoutProps) {
  // <-- שינוי 3: שימוש ב-hooks של next-auth ו-next/navigation
  const { status } = useSession();
  const router = useRouter();
  const isLoggedIn = status === 'authenticated';

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  // Mobile Header (עם עדכוני המילון שהוספנו קודם)
  const MobileHeader = () => (
    <header
      className={cn(
        'lg:hidden sticky top-0 z-40 backdrop-blur-xl bg-white/95 shadow-md border-b-2',
        currentColors.border
      )}
    >
      <div className="flex items-center justify-between p-3">
        <Button
          variant="ghost"
          size="sm"
          className="inline-flex items-center gap-2 hover:bg-gray-100 rounded-xl px-3"
        >
          <Menu className="h-5 w-5" />
          {!isSmallScreen && (
            <span className="font-semibold text-gray-700">
              {dict.layout.mobileNav.menuTitle}
            </span>
          )}
        </Button>
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', currentColors.bg)}></div>
          <span
            className={cn('text-sm font-bold truncate', currentColors.text)}
          >
            {dict.worldLabels[currentWorld]}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-xl',
                  saveSuccess
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                )}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isSaving
                  ? dict.layout.buttons.saving
                  : dict.layout.buttons.save}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );

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
            isLoggedIn={isLoggedIn} // <-- שינוי 4: מעבירים את המשתנה שחישבנו
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
        // <-- שינוי 5: הוספת ההודעה למשתמש לא מחובר גם בתצוגת מובייל
        <div className="flex flex-col">
          <MobileHeader />
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
                      {dict.layout.unauthenticatedPrompt.loginButton}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => router.push('/auth/register')}
                    >
                      {dict.layout.unauthenticatedPrompt.registerButton}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
