// src/app/components/suggestions/modals/SuggestionDetailsModal.tsx
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
  CheckCircle,
  XCircle,
  MessageCircle,
  X,
  Loader2,
  Sparkles,
  User,
  Info,
  Heart,
  Brain,
  Quote,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronUp,
  Scroll as ScrollIcon,
  GitCompareArrows,
  Eye,
  Calendar,
  ArrowRight,
  Users,
  Target,
  Lightbulb,
  Puzzle,
  Telescope,
  ChevronDown,
  Rocket,
  Sunrise,
  Mountain,
  Timer,
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
// =============================    KEY CHANGE #1    =============================
// ייבאנו את שני הטיפוסים הדרושים למילון
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';
// ==============================================================================

interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline'
  ) => void;
  questionnaire: QuestionnaireResponse | null;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  // =============================    KEY CHANGE #2    =============================
  // עדכנו את ה-prop כך שיקבל אובייקט המכיל את שני המילונים
  // שהקומפוננטה הזו צריכה כדי לתפקד ולרנדר את ילדיה.
  dict: {
    suggestions: SuggestionsDictionary;
    profileCard: ProfileCardDict;
  };
  // ==============================================================================
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

const EnhancedHeroSection: React.FC<{
  matchmaker: { firstName: string; lastName: string };
  targetParty: ExtendedMatchSuggestion['secondParty'];
  personalNote?: string | null;
  matchingReason?: string | null;
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
}) => {
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 mb-6 p-3 bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 animate-fade-in-up">
            <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-bold">
                {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-xs font-medium text-purple-600 mb-1">
                {dict.suggestedBy}
              </p>
              <p className="text-lg font-bold text-gray-800">
                {matchmaker.firstName} {matchmaker.lastName}
              </p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mb-8">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight animate-fade-in-up"
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
          <div
            className="relative group animate-fade-in-up"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/50 via-pink-400/50 to-blue-400/50 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
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
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center">
                    <User className="w-24 h-24 text-purple-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-6">
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                          {targetParty.firstName}
                        </h2>
                        {age && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg text-lg px-4 py-2">
                            <Calendar className="w-4 h-4 ml-2" />
                            {dict.ageInYears.replace('{{age}}', age.toString())}
                          </Badge>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg mb-2">
                          <Telescope className="w-8 h-8 text-white" />
                        </div>
                        <Button
                          onClick={onViewProfile}
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl rounded-full px-6 py-3 font-bold text-base"
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
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-white overflow-hidden">
              <CardContent className="p-8 relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight text-center">
                    {dict.matchStoryTitle}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <Button
                      onClick={onViewProfile}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <User className="w-5 h-5 ml-2" />
                      {dict.viewFullProfile}
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                    <Button
                      onClick={onStartConversation}
                      variant="outline"
                      size="lg"
                      className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-lg rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <MessageCircle className="w-5 h-5 ml-2" />
                      {dict.iHaveQuestions}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {(personalNote || matchingReason) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                      <Lightbulb className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-800 text-xl mb-4">
                        {dict.matchmakerInsight}
                      </h3>
                      {personalNote && (
                        <div className="mb-4 p-4 bg-white/70 rounded-xl shadow-inner border border-cyan-100">
                          <div className="flex items-start gap-2">
                            <Quote className="w-5 h-5 text-cyan-500 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-cyan-800 mb-2">
                                {dict.whyYou}
                              </h4>
                              <p className="text-cyan-900 leading-relaxed italic font-medium">
                                “{personalNote}”
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {matchingReason && (
                        <div className="p-4 bg-white/70 rounded-xl shadow-inner border border-blue-100">
                          <div className="flex items-start gap-2">
                            <Puzzle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-blue-800 mb-2">
                                {dict.ourConnection}
                              </h4>
                              <p className="text-blue-900 leading-relaxed font-medium">
                                “{matchingReason}”
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

const EnhancedQuickActions: React.FC<{
  isExpanded: boolean;
  onToggleExpand: () => void;
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
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
}) => (
  <div
    className={cn(
      'flex-shrink-0 bg-gradient-to-r from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm border-t border-purple-100 transition-all duration-500 ease-in-out relative z-10',
      isExpanded ? 'p-4 md:p-6' : 'py-3 px-4 md:px-6'
    )}
  >
    <div className="max-w-4xl mx-auto relative z-10">
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-purple-700">
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
          className="rounded-full h-10 w-10 text-purple-500 hover:bg-purple-100/50 group-hover:scale-110 transition-all"
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
              <Button
                className="relative w-full md:flex-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl h-16 font-bold text-lg transform hover:scale-105"
                disabled={isSubmitting}
                onClick={onApprove}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin ml-3" />
                    <span>{dict.sending}</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-6 h-6 animate-pulse ml-3" />
                    <span>{dict.approve}</span>
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onAskQuestion}
              disabled={isSubmitting}
              className="w-full md:flex-1 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 rounded-2xl h-16 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MessageCircle className="w-6 h-6 ml-3" />
              <span>{dict.ask}</span>
            </Button>
            {canAct && (
              <Button
                variant="ghost"
                className="w-full md:flex-1 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-300 rounded-2xl h-16 font-bold text-lg transform hover:scale-105"
                disabled={isSubmitting}
                onClick={onDecline}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    <span>{dict.updating}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 ml-3" />
                    <span>{dict.decline}</span>
                  </>
                )}
              </Button>
            )}
          </div>
          {canAct && (
            <p className="mt-4 text-center text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-purple-600">💡</span>{' '}
              {dict.reminder}
            </p>
          )}
        </div>
      )}
    </div>
  </div>
);

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
  <div className="border-b border-purple-100 px-2 sm:px-6 pt-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm sticky top-0 z-20">
    <div className="flex items-center justify-between mb-4">
      <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm rounded-3xl p-2 h-20 shadow-xl border-2 border-purple-100 overflow-hidden">
        <TabsTrigger
          value="presentation"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.presentation}</span>
          <span className="sm:hidden">{dict.presentationShort}</span>
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.profile}</span>
          <span className="sm:hidden">{dict.profileShort}</span>
        </TabsTrigger>
        <TabsTrigger
          value="compatibility"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
        >
          <GitCompareArrows className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">{dict.compatibility}</span>
          <span className="sm:hidden">{dict.compatibilityShort}</span>
        </TabsTrigger>
        <TabsTrigger
          value="details"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold"
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
                  className="rounded-full h-12 w-12 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
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

  // src/components/suggestions/modals/SuggestionDetailsModal.tsx

  const getModalClasses = () => {
    const base =
      'p-0 shadow-2xl border-0 bg-white overflow-hidden z-[50] flex flex-col transition-all duration-300 ease-in-out';
    if (isMobile)
      //  <-- כאן התיקון
      return `${base} !w-screen !h-[100dvh] !max-w-none !max-h-none !rounded-none`;
    if (isFullscreen)
      return `${base} !w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0`;
    return `${base} md:max-w-7xl md:w-[95vw] md:h-[95vh] md:rounded-3xl`;
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(getModalClasses())}
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
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
                // =============================    KEY CHANGE #3 (Usage)    =============================
                // ניגשים למילון דרך המפתח המתאים
                dict={dict.suggestions.modal.tabs}
                // ======================================================================================
              />
              <TabsContent value="presentation" className="mt-0">
                <EnhancedHeroSection
                  matchmaker={suggestion.matchmaker}
                  targetParty={targetParty}
                  personalNote={
                    isFirstParty
                      ? suggestion.firstPartyNotes
                      : suggestion.secondPartyNotes
                  }
                  matchingReason={suggestion.matchingReason}
                  onViewProfile={() => setActiveTab('profile')}
                  onStartConversation={() => setShowAskDialog(true)}
                  // =============================    KEY CHANGE #3 (Usage)    =============================
                  dict={dict.suggestions.modal.header}
                  // ======================================================================================
                />
              </TabsContent>
              <TabsContent
                value="profile"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50"
              >
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
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
                    // =============================    KEY CHANGE #3 (Usage)    =============================
                    // מעבירים לקומפוננטת הפרופיל את המילון שלה
                    dict={dict.profileCard}
                    // ======================================================================================
                  />
                ) : (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      {dict.suggestions.modal.profile.errorTitle}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      {dict.suggestions.modal.profile.errorDescription}
                    </p>
                    <Button
                      onClick={() => setShowAskDialog(true)}
                      className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      {dict.suggestions.modal.profile.contactMatchmaker}
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="compatibility"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center space-y-8 p-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto shadow-2xl">
                      <Bot className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
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
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          {dict.suggestions.modal.aiAnalysisCta.feature1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        <span>
                          {dict.suggestions.modal.aiAnalysisCta.feature2}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4" />
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
                  />
                </div>
              </TabsContent>
              <TabsContent
                value="details"
                className="mt-0 p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-gray-50"
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
