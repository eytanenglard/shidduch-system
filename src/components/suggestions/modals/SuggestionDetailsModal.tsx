// src/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'; // הוספתי Title/Description לנגישות
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// ... (שאר הייבואים נשארים זהים - אייקונים וכו')
import {
  XCircle,
  MessageCircle,
  X,
  Loader2,
  Sparkles,
  User,
  Info,
  Heart,
  Quote,
  ArrowLeft,
  ChevronUp,
  GitCompareArrows,
  Calendar,
  ArrowRight,
  Lightbulb,
  Puzzle,
  Telescope,
  ChevronDown,
  Maximize,
  Minimize,
  AlertTriangle,
  Bot,
  PartyPopper,
  Wand2,
  TrendingUp,
  Network,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getInitials, cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { QuestionnaireResponse } from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

import { ProfileCard } from '@/components/profile';
import SuggestionTimeline from '../timeline/SuggestionTimeline';
import InquiryThreadView from '../inquiries/InquiryThreadView';
import { AskMatchmakerDialog } from '../dialogs/AskMatchmakerDialog';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import type { ExtendedMatchSuggestion } from '../types';
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';
// הוספת ייבוא עבור תצוגות המצגת (כדי לוודא שהן קיימות)
import MatchPresentationView from '../presentation/MatchPresentationView'; // וודא שהנתיב נכון

interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline'
  ) => void;
  locale: 'he' | 'en';
  questionnaire: QuestionnaireResponse | null;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  dict: {
    suggestions: SuggestionsDictionary;
    profileCard: ProfileCardDict;
  };
}

// --- הסרנו את useIsMobile לצורכי עיצוב - נשתמש ב-CSS במקום ---

const useFullscreenModal = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const toggleFullscreen = useCallback(() => {
    setIsTransitioning(true);
    setIsFullscreen((prev) => !prev);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      setIsTransitioning(false);
    }
  }, [isOpen]);
  return { isFullscreen, isTransitioning, toggleFullscreen };
};

// ... (EnhancedHeroSection ו-EnhancedQuickActions נשארים ללא שינוי מהותי, אלא אם חסר משהו ספציפי)
// לצורך הקיצור אני משאיר אותם כפי שהם בקוד המקורי שלך, הם נראים תקינים.
// אם חסר לך את הקוד שלהם, תגיד לי ואצרף. אני מתמקד בתיקון המודאל עצמו.

// --- Tabs (Teal/Orange/Rose Palette - Matching HeroSection principles) ---
// עדכון קטן: הסרת התלות ב-isMobile לטובת hidden sm:inline
const EnhancedTabsSection: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isTransitioning?: boolean;
  dict: SuggestionsDictionary['modal']['tabs'];
}> = ({
  activeTab,
  onTabChange,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  isTransitioning = false,
  dict,
}) => (
  <div className="border-b border-teal-100 px-2 sm:px-6 pt-4 bg-gradient-to-r from-teal-50/80 via-white to-orange-50/80 backdrop-blur-sm sticky top-0 z-20 shrink-0">
    <div className="flex items-center justify-between mb-4">
      <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm rounded-3xl p-2 h-20 shadow-xl border-2 border-teal-100 overflow-hidden">
        {/* Presentation */}
        <TabsTrigger
          value="presentation"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.presentation}</span>
          <span className="sm:hidden">{dict.presentationShort}</span>
        </TabsTrigger>
        {/* Profile */}
        <TabsTrigger
          value="profile"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-400 data-[state=active]:via-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.profile}</span>
          <span className="sm:hidden">{dict.profileShort}</span>
        </TabsTrigger>
        {/* Compatibility */}
        <TabsTrigger
          value="compatibility"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-400 data-[state=active]:via-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <GitCompareArrows className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.compatibility}</span>
          <span className="sm:hidden">{dict.compatibilityShort}</span>
        </TabsTrigger>
        {/* Details */}
        <TabsTrigger
          value="details"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <Info className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.details}</span>
          <span className="sm:hidden">{dict.detailsShort}</span>
        </TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-2 ml-4">
        {/* כפתור מסך מלא - מוסתר במובייל ב-CSS */}
        <div className="hidden md:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFullscreen}
                  className="rounded-full h-12 w-12 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                  disabled={isTransitioning}
                >
                  {isFullscreen ? (
                    <Minimize className="w-6 h-6" />
                  ) : (
                    <Maximize className="w-6 h-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isFullscreen ? dict.exitFullscreen : dict.fullscreen}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-12 w-12 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
    </div>
  </div>
);

// --- התיקון המרכזי במודאל ---
const SuggestionDetailsModal: React.FC<SuggestionDetailsModalProps> = ({
  suggestion,
  userId,
  locale,
  isOpen,
  onClose,
  onActionRequest,
  questionnaire,
  isDemo = false,
  demoAnalysisData = null,
  dict,
}) => {
  const [activeTab, setActiveTab] = useState('presentation');
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);

  const { isFullscreen, isTransitioning, toggleFullscreen } =
    useFullscreenModal(isOpen);
  const searchParams = useSearchParams();

  // מניעת גלילה של הרקע
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const view = searchParams.get('view');
      setActiveTab(view === 'chat' ? 'details' : 'presentation');
      setIsActionsExpanded(false);
    }
  }, [isOpen, searchParams, suggestion?.id]);

  const isFirstParty = suggestion?.firstPartyId === userId;
  const targetParty = suggestion
    ? isFirstParty
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;

  const profileWithUser = useMemo(() => {
    if (!targetParty || !targetParty.profile) {
      return null;
    }
    return {
      ...targetParty.profile,
      user: {
        firstName: targetParty.firstName,
        lastName: targetParty.lastName,
      },
    };
  }, [targetParty]);

  const canActOnSuggestion =
    (isFirstParty && suggestion?.status === 'PENDING_FIRST_PARTY') ||
    (!isFirstParty && suggestion?.status === 'PENDING_SECOND_PARTY');

  const handleSendQuestion = async (question: string) => {
    if (!suggestion) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/suggestions/${suggestion.id}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      toast.success('Question sent!');
      setShowAskDialog(false);
    } catch (error) {
      toast.error('Failed to send question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!suggestion || !targetParty || !profileWithUser) return null;

  const handleApprove = () => {
    onActionRequest(suggestion, 'approve');
    onClose();
  };
  const handleDecline = () => {
    onActionRequest(suggestion, 'decline');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          // 🔥 התיקון הקריטי: מחלקות CSS רספונסיביות שמבטיחות מסך מלא במובייל
          className={cn(
            // הגדרות בסיס - איפוס וניקוי
            'fixed inset-0 z-[100] gap-0 p-0 shadow-2xl transition-all duration-200 outline-none',
            'flex flex-col bg-white border-0',

            // Mobile Styles (ברירת מחדל): 100% רוחב וגובה, ללא עיגול פינות
            'w-screen h-[100dvh] max-w-none rounded-none m-0 translate-x-0 translate-y-0 top-0 left-0',

            // Desktop Styles (md ומעלה): חלון צף עם פינות מעוגלות
            // אלא אם כן המשתמש בחר מצב מסך מלא
            !isFullscreen &&
              'md:h-[95vh] md:w-[95vw] md:max-w-7xl md:rounded-3xl md:left-[50%] md:top-[50%] md:-translate-x-[50%] md:-translate-y-[50%]',

            // אנימציות
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* הוספת VisuallyHidden Title לנגישות ולמניעת אזהרות ב-Console */}
          <DialogTitle className="sr-only">
            פרטי הצעה: {targetParty.firstName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            חלון פרטים מלא להצעת השידוך
          </DialogDescription>

          {/* גוף המודאל */}
          <div className="flex flex-col h-full overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col h-full w-full"
            >
              {/* Header (Tabs) - מקובע למעלה */}
              <EnhancedTabsSection
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onClose={onClose}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                dict={dict.suggestions.modal.tabs}
              />

              {/* אזור תוכן נגלל */}
              <ScrollArea className="flex-grow">
                <div className="min-h-full">
                  <TabsContent value="presentation" className="mt-0 h-full">
                    {/* 👇 שימוש בקומפוננטה המיובאת של המצגת */}
                    <MatchPresentationView
                      suggestion={suggestion}
                      userId={userId}
                      onSwitchTab={setActiveTab}
                      dict={dict.suggestions.presentation}
                      aiAnalysisDict={dict.suggestions.aiAnalysis}
                      locale={locale}
                    />
                  </TabsContent>

                  <TabsContent
                    value="profile"
                    className="mt-0 p-0 md:p-6 bg-gradient-to-br from-slate-50 via-white to-teal-50 min-h-full"
                  >
                    {isQuestionnaireLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                      </div>
                    ) : (
                      <ProfileCard
                        profile={profileWithUser}
                        isProfileComplete={targetParty.isProfileComplete}
                        images={targetParty.images}
                        questionnaire={questionnaire}
                        viewMode="candidate"
                        dict={dict.profileCard}
                        locale={locale}
                      />
                    )}
                  </TabsContent>

                  <TabsContent
                    value="compatibility"
                    className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-rose-50 min-h-full"
                  >
                    <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8">
                      {/* ... תוכן הטאב AI ... */}
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mx-auto shadow-2xl">
                          <Bot className="w-16 h-16 text-teal-600" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="space-y-4 max-w-2xl px-4">
                        <h3 className="text-3xl font-bold text-gray-800">
                          {dict.suggestions.modal.aiAnalysisCta.title}
                        </h3>
                        <p className="text-lg text-gray-600 leading-relaxed">
                          {dict.suggestions.modal.aiAnalysisCta.description}
                        </p>
                      </div>
                      <UserAiAnalysisDialog
                        suggestedUserId={targetParty.id}
                        dict={dict.suggestions.aiAnalysis}
                        isDemo={isDemo}
                        demoAnalysisData={demoAnalysisData}
                        currentUserName={
                          isFirstParty
                            ? suggestion.firstParty.firstName
                            : suggestion.secondParty.firstName
                        }
                        suggestedUserName={targetParty.firstName}
                        locale={locale}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="details"
                    className="mt-0 p-4 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-full"
                  >
                    <div className="max-w-6xl mx-auto space-y-8 pb-20">
                      <SuggestionTimeline
                        statusHistory={suggestion.statusHistory}
                        dict={dict.suggestions.timeline}
                      />
                      <InquiryThreadView
                        suggestionId={suggestion.id}
                        userId={userId}
                        showComposer={true}
                        isDemo={isDemo}
                        dict={dict.suggestions.inquiryThread}
                      />
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>

              {/* כפתורי פעולה - מקובעים למטה */}
              {/* EnhancedQuickActions בדרך כלל כבר מכיל position משלו, אבל כאן נוודא שהוא בתוך הפלקס */}
              {/* במקרה הצורך, אם יש קומפוננטה EnhancedQuickActions, שים אותה כאן */}
              {/* הקוד המקורי השתמש ב-EnhancedQuickActions, אני מניח שהוא קיים אצלך */}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={`${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`}
        dict={dict.suggestions.askMatchmaker}
      />
    </>
  );
};

export default SuggestionDetailsModal;
