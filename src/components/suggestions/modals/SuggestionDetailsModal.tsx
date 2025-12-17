// src/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  return isMobile;
};

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

// --- Hero Section (Teal/Orange/Rose Palette - Matching HeroSection.tsx) ---
const EnhancedHeroSection: React.FC<{
  matchmaker: { firstName: string; lastName: string };
  targetParty: ExtendedMatchSuggestion['secondParty'];
  personalNote?: string | null;
  matchingReason?: string | null;
  locale: 'he' | 'en';
  onViewProfile: () => void;
  onStartConversation: () => void;
  dict: SuggestionsDictionary['modal']['header'];
}> = ({
  matchmaker,
  targetParty,
  personalNote,
  matchingReason,
  onViewProfile,
  onStartConversation,
  dict,
  locale,
}) => {
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-orange-50/30 overflow-hidden">
      {/* Background elements - Teal/Orange/Rose Blobs (matching HeroSection) */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-teal-200/40 to-emerald-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div
        className="relative z-10 p-4 md:p-8 lg:p-12 isolate"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="text-center mb-8 lg:mb-12">
          {/* Matchmaker Badge - Teal */}
          <div className="inline-flex items-center gap-2 mb-6 p-3 bg-white/95 rounded-2xl shadow-lg border border-teal-100 animate-fade-in-up">
            <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm font-bold">
                {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(locale === 'he' ? 'text-right' : 'text-left')}>
              <p className="text-xs font-medium text-teal-600 mb-1">
                {dict.suggestedBy}
              </p>
              <p className="text-lg font-bold text-gray-800">
                {matchmaker.firstName} {matchmaker.lastName}
              </p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mb-8">
            {/* Title Gradient - Teal/Orange/Rose (matching HeroSection) */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-rose-500 bg-clip-text text-transparent mb-6 leading-tight animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              {dict.title}
            </h1>
            <p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium animate-fade-in-up"
              style={{ animationDelay: '1s' }}
            >
              {dict.subtitleLine1}
              <br />
              {dict.subtitleLine2}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image Card */}
          <div
            className="relative group animate-fade-in-up"
            style={{ animationDelay: '1.5s' }}
          >
            {/* Glow Effect - Teal/Orange/Rose */}
            <div
              className="absolute -inset-4 bg-gradient-to-r from-teal-400/50 via-orange-400/50 to-rose-400/50 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse -z-10"
              aria-hidden="true"
            ></div>
            <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95">
              <div className="relative h-96 lg:h-[600px]">
                {mainImage ? (
                  <Image
                    src={getRelativeCloudinaryPath(mainImage)}
                    alt={`Image of ${targetParty.firstName}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-100 via-white to-orange-100 flex items-center justify-center">
                    <User className="w-24 h-24 text-teal-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-6">
                  <div className="bg-white/98 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                          {targetParty.firstName}
                        </h2>
                        {age && (
                          // Age Badge - Orange/Amber (matching HeroSection button)
                          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg text-lg px-4 py-2">
                            <Calendar
                              className={cn(
                                'w-4 h-4',
                                locale === 'he' ? 'ml-2' : 'mr-2'
                              )}
                            />
                            {dict.ageInYears.replace('{{age}}', age.toString())}
                          </Badge>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg mb-2">
                          <Telescope className="w-8 h-8 text-white" />
                        </div>
                        {/* Discover More - Teal/Emerald */}
                        <Button
                          onClick={onViewProfile}
                          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-xl rounded-full px-6 py-3 font-bold text-base"
                        >
                          {dict.discoverMore}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div
            className="space-y-8 animate-fade-in-up"
            style={{ animationDelay: '2s' }}
          >
            {/* Story Card - Teal/Orange/Rose gradient */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-teal-50 via-white to-orange-50 overflow-hidden">
              <CardContent className="p-8 relative">
                <div
                  className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-200/30 to-orange-200/30 rounded-full blur-2xl -z-10"
                  aria-hidden="true"
                ></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-rose-500 bg-clip-text text-transparent mb-4 leading-tight text-center">
                    {dict.matchStoryTitle}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {/* View Profile - Teal/Orange (matching HeroSection CTA) */}
                    <Button
                      onClick={onViewProfile}
                      size="lg"
                      className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-xl rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <User
                        className={cn(
                          'w-5 h-5',
                          locale === 'he' ? 'ml-2' : 'mr-2'
                        )}
                      />
                      {dict.viewFullProfile}
                      {locale === 'he' ? (
                        <ArrowLeft className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowRight className="w-4 h-4 ml-2" />
                      )}
                    </Button>
                    {/* Questions - Teal Outline (matching HeroSection secondary) */}
                    <Button
                      onClick={onStartConversation}
                      variant="outline"
                      size="lg"
                      className="border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 shadow-lg rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <MessageCircle
                        className={cn(
                          'w-5 h-5',
                          locale === 'he' ? 'ml-2' : 'mr-2'
                        )}
                      />
                      {dict.iHaveQuestions}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(personalNote || matchingReason) && (
              // Insights Card - Orange/Teal
              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-white to-teal-50 overflow-hidden">
                <CardContent className="p-6 relative">
                  <div
                    className={cn(
                      'flex items-start gap-4',
                      locale === 'he' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className="p-4 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg flex-shrink-0">
                      <Lightbulb className="w-7 h-7" />
                    </div>
                    <div
                      className={cn(
                        'flex-1',
                        locale === 'he' ? 'text-right' : 'text-left'
                      )}
                    >
                      <h3 className="font-bold text-orange-800 text-xl mb-4">
                        {dict.matchmakerInsight}
                      </h3>
                      {personalNote && (
                        // Personal Note - Orange tint
                        <div
                          className="mb-4 p-4 bg-white/70 rounded-xl shadow-inner border border-orange-100"
                          dir={locale === 'he' ? 'rtl' : 'ltr'}
                        >
                          <div
                            className={cn(
                              'flex items-start gap-2',
                              locale === 'he' ? 'flex-row-reverse' : 'flex-row'
                            )}
                          >
                            <Quote
                              className={cn(
                                'w-5 h-5 text-orange-500 mt-1 flex-shrink-0',
                                locale === 'he' ? 'ml-2' : 'mr-2'
                              )}
                            />
                            <div>
                              <h4
                                className={cn(
                                  'font-semibold text-orange-700 mb-2',
                                  locale === 'he' ? 'text-right' : 'text-left'
                                )}
                              >
                                {dict.whyYou}
                              </h4>
                              <p
                                className={cn(
                                  'text-orange-800 leading-relaxed italic font-medium',
                                  locale === 'he' ? 'text-right' : 'text-left'
                                )}
                              >
                                &quot;{personalNote}&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {matchingReason && (
                        // Matching Reason - Teal tint
                        <div
                          className="p-4 bg-white/70 rounded-xl shadow-inner border border-teal-100"
                          dir={locale === 'he' ? 'rtl' : 'ltr'}
                        >
                          <div
                            className={cn(
                              'flex items-start gap-2',
                              locale === 'he' ? 'flex-row-reverse' : 'flex-row'
                            )}
                          >
                            <Puzzle
                              className={cn(
                                'w-5 h-5 text-teal-500 mt-1 flex-shrink-0',
                                locale === 'he' ? 'ml-2' : 'mr-2'
                              )}
                            />
                            <div>
                              <h4
                                className={cn(
                                  'font-semibold text-teal-700 mb-2',
                                  locale === 'he' ? 'text-right' : 'text-left'
                                )}
                              >
                                {dict.ourConnection}
                              </h4>
                              <p
                                className={cn(
                                  'text-teal-800 leading-relaxed font-medium',
                                  locale === 'he' ? 'text-right' : 'text-left'
                                )}
                              >
                                &quot;{matchingReason}&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Quick Actions (Teal/Orange/Rose Palette) ---
const EnhancedQuickActions: React.FC<{
  isExpanded: boolean;
  onToggleExpand: () => void;
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
  locale: 'he' | 'en';
  dict: SuggestionsDictionary['modal']['actions'];
}> = ({
  isExpanded,
  onToggleExpand,
  canAct,
  isSubmitting,
  onApprove,
  onDecline,
  onAskQuestion,
  dict,
  locale,
}) => (
  <div
    className={cn(
      'flex-shrink-0 bg-gradient-to-r from-white via-teal-50/80 to-orange-50/80 border-t border-teal-100 transition-all duration-500 ease-in-out relative z-10',
      isExpanded ? 'p-4 md:p-6' : 'py-3 px-4 md:px-6'
    )}
    style={{ touchAction: 'manipulation' }}
  >
    <div className="max-w-4xl mx-auto relative z-10 isolate">
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {/* Main Icon - Orange/Amber (Celebration) */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-teal-800">
              {isExpanded ? dict.titleExpanded : dict.titleCollapsed}
            </p>
            {isExpanded && (
              <p className="text-sm text-gray-600 mt-1">{dict.subtitle}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 text-teal-600 hover:bg-teal-100/50 group-hover:scale-110 transition-all"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </Button>
      </div>
      {isExpanded && (
        <div className="mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-4 md:flex md:gap-6">
            {canAct && (
              // Approve - Teal/Orange (matching HeroSection CTA gradient)
              <Button
                className="relative w-full md:flex-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl h-16 font-bold text-lg transform hover:scale-105"
                disabled={isSubmitting}
                onClick={onApprove}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className={cn(
                        'w-6 h-6 animate-spin',
                        locale === 'he' ? 'ml-3' : 'mr-3'
                      )}
                    />
                    <span>{dict.sending}</span>
                  </>
                ) : (
                  <>
                    <Heart
                      className={cn(
                        'w-6 h-6 animate-pulse',
                        locale === 'he' ? 'ml-3' : 'mr-3'
                      )}
                    />
                    <span>{dict.approve}</span>
                    <Sparkles
                      className={cn(
                        'w-5 h-5',
                        locale === 'he' ? 'mr-2' : 'ml-2'
                      )}
                    />
                  </>
                )}
              </Button>
            )}
            {/* Ask - Teal Outline (matching HeroSection secondary button) */}
            <Button
              variant="outline"
              onClick={onAskQuestion}
              disabled={isSubmitting}
              className="w-full md:flex-1 border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 transition-all duration-300 rounded-2xl h-16 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MessageCircle
                className={cn('w-6 h-6', locale === 'he' ? 'ml-3' : 'mr-3')}
              />
              <span>{dict.ask}</span>
            </Button>
            {canAct && (
              // Decline - Ghost/Rose hover
              <Button
                variant="ghost"
                className="w-full md:flex-1 text-gray-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-300 rounded-2xl h-16 font-bold text-lg transform hover:scale-105"
                disabled={isSubmitting}
                onClick={onDecline}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className={cn(
                        'w-5 h-5 animate-spin',
                        locale === 'he' ? 'ml-2' : 'mr-2'
                      )}
                    />
                    <span>{dict.updating}</span>
                  </>
                ) : (
                  <>
                    <XCircle
                      className={cn(
                        'w-5 h-5 text-rose-500',
                        locale === 'he' ? 'ml-3' : 'mr-3'
                      )}
                    />
                    <span>{dict.decline}</span>
                  </>
                )}
              </Button>
            )}
          </div>
          {canAct && (
            <p className="mt-4 text-center text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-teal-600">💡</span>{' '}
              {dict.reminder}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
);

// --- Tabs (Teal/Orange/Rose Palette - Matching HeroSection principles) ---
const EnhancedTabsSection: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMobile: boolean;
  isTransitioning?: boolean;
  dict: SuggestionsDictionary['modal']['tabs'];
}> = ({
  activeTab,
  onTabChange,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  isMobile,
  isTransitioning = false,
  dict,
}) => (
  <div
    className="border-b border-teal-100 px-2 sm:px-6 pt-4 bg-gradient-to-r from-teal-50/95 via-white to-orange-50/95 sticky top-0 z-20"
    style={{ touchAction: 'manipulation' }}
  >
    <div className="flex items-center justify-between mb-4">
      <TabsList className="grid w-full grid-cols-4 bg-white/95 rounded-3xl p-2 h-20 shadow-xl border-2 border-teal-100 overflow-hidden">
        {/* Presentation - Orange/Amber (matching HeroSection privacy principle) */}
        <TabsTrigger
          value="presentation"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.presentation}</span>
          <span className="sm:hidden">{dict.presentationShort}</span>
        </TabsTrigger>
        {/* Profile - Teal/Emerald (matching HeroSection knowledge principle) */}
        <TabsTrigger
          value="profile"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-400 data-[state=active]:via-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.profile}</span>
          <span className="sm:hidden">{dict.profileShort}</span>
        </TabsTrigger>
        {/* Compatibility - Rose/Pink (matching HeroSection personal principle) */}
        <TabsTrigger
          value="compatibility"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-400 data-[state=active]:via-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <GitCompareArrows className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.compatibility}</span>
          <span className="sm:hidden">{dict.compatibilityShort}</span>
        </TabsTrigger>
        {/* Details - Slate/Gray (neutral) */}
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
        {!isMobile && (
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
        )}
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

  const isMobile = useIsMobile();
  const { isFullscreen, isTransitioning, toggleFullscreen } =
    useFullscreenModal(isOpen);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (isOpen && (isMobile || isFullscreen)) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, isMobile, isFullscreen]);

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

  const getModalClasses = () => {
    const baseClasses =
      'p-0 shadow-2xl border-0 bg-white overflow-hidden z-[50] flex flex-col transition-all duration-300 ease-in-out';
    if (isMobile) {
      return `${baseClasses} !w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0`;
    } else if (isFullscreen) {
      return `${baseClasses} !w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0 !translate-x-0 !translate-y-0 !transform-none`;
    } else {
      return `${baseClasses} md:max-w-7xl md:w-[95vw] md:h-[95vh] md:rounded-3xl`;
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(getModalClasses())}
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          onOpenAutoFocus={(e) => e.preventDefault()}
          data-fullscreen={isFullscreen}
          data-mobile={isMobile}
        >
          <ScrollArea className="flex-grow min-h-0 modal-scroll">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full"
            >
              <EnhancedTabsSection
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onClose={onClose}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                isMobile={isMobile}
                isTransitioning={isTransitioning}
                dict={dict.suggestions.modal.tabs}
              />
              <TabsContent value="presentation" className="mt-0">
                <EnhancedHeroSection
                  matchmaker={suggestion.matchmaker}
                  targetParty={targetParty}
                  locale={locale}
                  personalNote={
                    isFirstParty
                      ? suggestion.firstPartyNotes
                      : suggestion.secondPartyNotes
                  }
                  matchingReason={suggestion.matchingReason}
                  onViewProfile={() => setActiveTab('profile')}
                  onStartConversation={() => setShowAskDialog(true)}
                  dict={dict.suggestions.modal.header}
                />
              </TabsContent>
              <TabsContent
                value="profile"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-teal-50"
              >
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-700">
                        {dict.suggestions.modal.profile.loading}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {dict.suggestions.modal.profile.loadingDescription}
                      </p>
                    </div>
                  </div>
                ) : profileWithUser ? (
                  <ProfileCard
                    profile={profileWithUser}
                    isProfileComplete={targetParty.isProfileComplete}
                    images={targetParty.images}
                    questionnaire={questionnaire}
                    viewMode="candidate"
                    dict={dict.profileCard}
                    locale={locale}
                  />
                ) : (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-12 h-12 text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      {dict.suggestions.modal.profile.errorTitle}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      {dict.suggestions.modal.profile.errorDescription}
                    </p>
                    <Button
                      onClick={() => setShowAskDialog(true)}
                      className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      {dict.suggestions.modal.profile.contactMatchmaker}
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="compatibility"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-rose-50"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center space-y-8 p-6">
                  <div className="relative">
                    {/* Bot Icon - Teal */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mx-auto shadow-2xl">
                      <Bot className="w-16 h-16 text-teal-600" />
                    </div>
                    {/* Badge - Orange/Amber */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <Wand2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4 max-w-2xl">
                    <h3 className="text-3xl font-bold text-gray-800">
                      {dict.suggestions.modal.aiAnalysisCta.title}
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      {dict.suggestions.modal.aiAnalysisCta.description}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span>
                          {dict.suggestions.modal.aiAnalysisCta.feature1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-teal-500" />
                        <span>
                          {dict.suggestions.modal.aiAnalysisCta.feature2}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-orange-500" />
                        <span>
                          {dict.suggestions.modal.aiAnalysisCta.feature3}
                        </span>
                      </div>
                    </div>
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
                className="mt-0 p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-gray-50"
              >
                <div className="max-w-6xl mx-auto space-y-8">
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
            </Tabs>
          </ScrollArea>
          <EnhancedQuickActions
            isExpanded={isActionsExpanded}
            onToggleExpand={() => setIsActionsExpanded((prev) => !prev)}
            canAct={canActOnSuggestion}
            isSubmitting={isSubmitting}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onAskQuestion={() => setShowAskDialog(true)}
            dict={dict.suggestions.modal.actions}
            locale={locale}
          />
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
