// src/app/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
  Quote,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronUp,
  Scroll as ScrollIcon,
  GitCompareArrows,
  Star,
  Eye,
  Calendar,
  ArrowRight,
  Users,
  Target,
  Lightbulb,
  Gift,
  Phone,
  MessageSquare,
  Crown,
  Zap,
  Telescope,
  ChevronDown,
  BookOpen,
  Home,
  Music,
  Camera,
  Coffee,
  Globe,
  Maximize,
  Minimize,
  AlertTriangle,
  Bot,
  PartyPopper,
  Flame,
  TrendingUp,
  Timer,
  Compass,
  Shield,
  Handshake,
  Diamond,
  Gem,
  Award,
  Trophy,
  Wand2,
  Fingerprint,
  Puzzle,
  Network,
  Rocket,
  Sunrise,
  Mountain,
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

import { ProfileCard } from '@/app/components/profile';
import SuggestionTimeline from '../timeline/SuggestionTimeline';
import InquiryThreadView from '../inquiries/InquiryThreadView';
import { AskMatchmakerDialog } from '../dialogs/AskMatchmakerDialog';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import type { ExtendedMatchSuggestion } from '../types';

interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (suggestionId: string, newStatus: string) => Promise<void>;
  questionnaire: QuestionnaireResponse | null;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline'
  ) => void;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  return isMobile;
};

const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };
    updateHeight();
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
      return () =>
        window.visualViewport?.removeEventListener('resize', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);
  return viewportHeight;
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
}> = ({
  matchmaker,
  targetParty,
  personalNote,
  matchingReason,
  onViewProfile,
  onStartConversation,
}) => {
  const age = targetParty.profile?.birthDate
    ? new Date().getFullYear() -
      new Date(targetParty.profile.birthDate).getFullYear()
    : null;
  const mainImage = targetParty.images?.find((img) => img.isMain)?.url;

  interface ExcitementFactor {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    glow: string;
  }

  const getExcitementFactors = (): ExcitementFactor[] => {
    const factors: ExcitementFactor[] = [];
    if (targetParty.profile?.religiousLevel)
      factors.push({
        icon: ScrollIcon,
        label: 'השקפת עולם',
        value: targetParty.profile.religiousLevel,
        color: 'from-purple-500 to-violet-600',
        glow: 'shadow-purple-200',
      });
    if (targetParty.profile?.city)
      factors.push({
        icon: MapPin,
        label: 'אזור מגורים',
        value: targetParty.profile.city,
        color: 'from-emerald-500 to-green-600',
        glow: 'shadow-emerald-200',
      });
    if (targetParty.profile?.education)
      factors.push({
        icon: GraduationCap,
        label: 'רקע והשכלה',
        value: targetParty.profile.education,
        color: 'from-blue-500 to-cyan-600',
        glow: 'shadow-blue-200',
      });
    if (targetParty.profile?.occupation)
      factors.push({
        icon: Briefcase,
        label: 'תחום עיסוק',
        value: targetParty.profile.occupation,
        color: 'from-amber-500 to-orange-600',
        glow: 'shadow-amber-200',
      });
    return factors;
  };
  const excitementFactors = getExcitementFactors();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
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
                הצעה מ-
              </p>
              <p className="text-lg font-bold text-gray-800">
                {matchmaker.firstName} {matchmaker.lastName}
              </p>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mb-8">
            {/* --- START: UPDATED TEXT --- */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              זו הצעה שנבחרה במיוחד עבורך
            </h1>
            <p
              className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium animate-fade-in-up"
              style={{ animationDelay: '1s' }}
            >
              חשבנו עליך כשראינו את הפרופיל הזה.
              <br />
              אנו מאמינים שיש כאן בסיס אמיתי להיכרות משמעותית.
            </p>
            {/* --- END: UPDATED TEXT --- */}
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
                    alt={`תמונה של ${targetParty.firstName}`}
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
                            {age} שנים
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
                          גלה עוד ←
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {targetParty.profile?.city && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-gray-700">
                            {targetParty.profile.city}
                          </span>
                        </div>
                      )}
                      {targetParty.profile?.occupation && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-700 truncate">
                            {targetParty.profile.occupation}
                          </span>
                        </div>
                      )}
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
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                      <Diamond className="w-6 h-6 text-purple-500" />
                      <Gem className="w-7 h-7 text-pink-500" />
                    </div>
                    {/* --- START: UPDATED TEXT --- */}
                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
                      הסיפור שמאחורי ההתאמה
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      אנו מקשיבים למה שחשוב לך, גם בין השורות.
                      <br />
                      הנה כמה מהחיבורים שזיהינו כאן.
                    </p>
                    {/* --- END: UPDATED TEXT --- */}
                  </div>
                  {excitementFactors.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {excitementFactors.map((factor, index) => (
                        <div
                          key={index}
                          className={cn(
                            'relative p-4 bg-white/80 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group',
                            factor.glow
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-12 h-12 rounded-full bg-gradient-to-r text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform',
                                factor.color
                              )}
                            >
                              <factor.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm mb-1">
                                {factor.label}
                              </p>
                              <p className="text-gray-600 text-xs leading-relaxed">
                                {factor.value}
                              </p>
                            </div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={onViewProfile}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <User className="w-5 h-5 ml-2" />
                      צפה בפרופיל המלא
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>
                    <Button
                      onClick={onStartConversation}
                      variant="outline"
                      size="lg"
                      className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-lg rounded-xl h-14 font-bold text-base transform hover:scale-105 transition-all"
                    >
                      <MessageSquare className="w-5 h-5 ml-2" />
                      יש לי שאלות
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {(personalNote || matchingReason) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                        <Lightbulb className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-bold text-cyan-800 text-xl">
                            💭 התובנה המקצועית
                          </h3>
                        </div>
                        {personalNote && (
                          <div className="mb-4 p-4 bg-white/70 rounded-xl shadow-inner border border-cyan-100">
                            <div className="flex items-start gap-2">
                              <Quote className="w-5 h-5 text-cyan-500 mt-1 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-cyan-800 mb-2">
                                  למה זה מתאים דווקא לך:
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
                                  החיבור שאנחנו רואים:
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
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white overflow-hidden">
              <CardContent className="p-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20"></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-8 h-8 animate-bounce" />
                      <Sunrise className="w-6 h-6" />
                      <Mountain className="w-7 h-7" />
                    </div>
                  </div>
                  {/* --- START: UPDATED TEXT --- */}
                  <h3 className="text-2xl font-bold mb-3">
                    מה עכשיו? ההחלטה בידיים שלך
                  </h3>
                  <p className="text-emerald-100 text-lg leading-relaxed mb-4">
                    כל החלטה שתקבל/י היא צעד נכון במסע שלך.
                    <br />
                    קח/י את הזמן, ובחר/י מה שהכי מרגיש לך נכון.
                  </p>
                  {/* --- END: UPDATED TEXT --- */}
                  <div className="flex justify-center">
                    <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-base">
                      <Timer className="w-4 h-4 ml-2" />
                      הזמן הכי טוב הוא עכשיו
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (Rest of the file remains unchanged)
// The components EnhancedQuickActions, EnhancedTabsSection, and the main SuggestionDetailsModal
// will remain as they are, since their logic is not affected by these text changes.

const EnhancedQuickActions: React.FC<{
  isExpanded: boolean;
  onToggleExpand: () => void;
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
}> = ({
  isExpanded,
  onToggleExpand,
  canAct,
  isSubmitting,
  onApprove,
  onDecline,
  onAskQuestion,
}) => (
  <div
    className={cn(
      'flex-shrink-0 bg-gradient-to-r from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm border-t border-purple-100 transition-all duration-500 ease-in-out relative overflow-hidden',
      isExpanded ? 'p-4 md:p-6' : 'py-3 px-4 md:px-6'
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-pink-100/20 to-blue-100/20"></div>
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
              {isExpanded
                ? '✨ זה הרגע הכי חשוב - מה ההחלטה שלך?'
                : '🎯 פעולות מהירות'}
            </p>
            {isExpanded && (
              <p className="text-sm text-gray-600 mt-1">
                כל החלטה היא הזדמנות חדשה
              </p>
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
              <div className="relative md:flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur opacity-60 animate-pulse"></div>
                <Button
                  className="relative w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl h-16 font-bold text-lg transform hover:scale-105 overflow-hidden"
                  disabled={isSubmitting}
                  onClick={onApprove}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="w-6 h-6 animate-spin ml-3" />
                      <span>שולח...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center relative z-10">
                      <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 animate-pulse" />
                        <span>💝 מעוניין/ת להכיר!</span>
                        <Sparkles className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={onAskQuestion}
              disabled={isSubmitting}
              className="w-full md:flex-1 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 rounded-2xl h-16 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <MessageCircle className="w-6 h-6" />
                <span>🤔 שאלות לשדכן</span>
              </div>
            </Button>
            {canAct && (
              <Button
                variant="ghost"
                className="w-full md:flex-1 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-300 rounded-2xl h-16 font-bold text-lg md:border-2 md:border-gray-200 md:shadow-lg md:hover:border-gray-300 transform hover:scale-105"
                disabled={isSubmitting}
                onClick={onDecline}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    <span>מעדכן...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <XCircle className="w-5 h-5" />
                    <span>😔 לא מתאים כרגע</span>
                  </div>
                )}
              </Button>
            )}
          </div>
          {canAct && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 leading-relaxed">
                <span className="font-semibold text-purple-600">💡 זכור:</span>{' '}
                כל החלטה שתקבל תעביר אותנו צעד אחד קדימה במציאת ההתאמה המושלמת
                עבורך
              </p>
            </div>
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
}> = ({
  activeTab,
  onTabChange,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  isMobile,
  isTransitioning = false,
}) => (
  <div className="border-b border-purple-100 px-2 sm:px-6 pt-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm sticky top-0 z-20">
    <div className="flex items-center justify-between mb-4">
      <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm rounded-3xl p-2 h-20 shadow-xl border-2 border-purple-100 overflow-hidden">
        <TabsTrigger
          value="presentation"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-data-[state=active]:from-purple-600/20 group-data-[state=active]:to-pink-600/20 transition-all"></div>
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          <span className="relative z-10">
            <span className="hidden sm:inline">הצגה מרשימה</span>
            <span className="sm:hidden">הצגה</span>
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 to-green-600/0 group-data-[state=active]:from-emerald-600/20 group-data-[state=active]:to-green-600/20 transition-all"></div>
          <User className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          <span className="relative z-10">
            <span className="hidden sm:inline">פרופיל מלא</span>
            <span className="sm:hidden">פרופיל</span>
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="compatibility"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-data-[state=active]:from-blue-600/20 group-data-[state=active]:to-cyan-600/20 transition-all"></div>
          <GitCompareArrows className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          <span className="relative z-10">
            <span className="hidden sm:inline">ניתוח התאמה</span>
            <span className="sm:hidden">התאמה</span>
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="details"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold transition-all duration-300 hover:scale-105 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600/0 to-slate-600/0 group-data-[state=active]:from-gray-600/20 group-data-[state=active]:to-slate-600/20 transition-all"></div>
          <Info className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          <span className="relative z-10">
            <span className="hidden sm:inline">פרטים ותקשורת</span>
            <span className="sm:hidden">פרטים</span>
          </span>
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
                  className="rounded-full h-12 w-12 text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all hover:scale-110 fullscreen-button icon-transition"
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
                <p>{isFullscreen ? 'צמצם חלון' : 'הגדל למסך מלא'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-12 w-12 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all hover:scale-110"
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
  onStatusChange,
  questionnaire,
  onActionRequest,
  isDemo = false,
  demoAnalysisData = null,
}) => {
  const [activeTab, setActiveTab] = useState('presentation');
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);

  const isMobile = useIsMobile();
  const viewportHeight = useViewportHeight();
  const { isFullscreen, isTransitioning, toggleFullscreen } =
    useFullscreenModal(isOpen);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('presentation');
      setIsActionsExpanded(false);
      if (isMobile || isFullscreen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        if (isMobile) {
          document.documentElement.style.setProperty(
            '--vh',
            `${viewportHeight * 0.01}px`
          );
        }
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.removeProperty('--vh');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.removeProperty('--vh');
    };
  }, [isOpen, suggestion?.id, isMobile, isFullscreen, viewportHeight]);

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

  if (!suggestion || !targetParty || !profileWithUser) return null;

  const canActOnSuggestion =
    (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
    (!isFirstParty && suggestion.status === 'PENDING_SECOND_PARTY');

  const triggerConfirmDialog = (action: 'approve' | 'decline') => {
    if (suggestion) {
      onActionRequest(suggestion, action);
    }
  };

  const handleSendQuestion = async (question: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/suggestions/${suggestion.id}/inquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        }
      );
      if (!response.ok) throw new Error('Failed to send inquiry.');
      toast.success('🚀 שאלתך נשלחה בהצלחה!', {
        description: 'השדכן יחזור אליך עם תשובה בהקדם',
      });
      setShowAskDialog(false);
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת השאלה.');
    } finally {
      setIsSubmitting(false);
    }
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
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          data-fullscreen={isFullscreen}
          data-mobile={isMobile}
          style={
            isFullscreen && !isMobile
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  borderRadius: 0,
                  margin: 0,
                  transform: 'none',
                }
              : undefined
          }
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
                onToggleFullscreen={!isMobile ? toggleFullscreen : () => {}}
                isMobile={isMobile}
                isTransitioning={isTransitioning}
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
                />
              </TabsContent>
              <TabsContent
                value="profile"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen w-full grid place-items-center"
              >
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-700">
                        טוען פרופיל מפורט...
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        זה יכול לקחת מספר שניות
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
                  />
                ) : (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      שגיאה בטעינת פרופיל
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      לא הצלחנו לטעון את הפרופיל. אנא פנה לשדכן לקבלת עזרה
                      נוספת.
                    </p>
                    <Button
                      onClick={() => setShowAskDialog(true)}
                      className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <MessageCircle className="w-4 h-4 ml-2" />
                      פנה לשדכן
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="compatibility"
                className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen"
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
                      🔮 רוצה מבט מעמיק יותר?
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      ה-AI החכם שלנו יכול לנתח את כל הנתונים ולספק לך תובנות
                      מקצועיות על פוטנציאל החיבור, נקודות חוזק, וגם רעיונות
                      לפתיחת שיחה.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>ניתוח עמוק</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        <span>נקודות חיבור</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4" />
                        <span>הדרכה אישית</span>
                      </div>
                    </div>
                  </div>
                  <UserAiAnalysisDialog
                    suggestedUserId={targetParty.id}
                    isDemo={isDemo}
                    demoAnalysisData={demoAnalysisData}
                  />
                </div>
              </TabsContent>
              <TabsContent
                value="details"
                className="mt-0 p-6 md:p-8 space-y-8 bg-gradient-to-br from-slate-50 to-gray-50 min-h-screen"
              >
                <div className="max-w-6xl mx-auto space-y-8">
                  <SuggestionTimeline
                    statusHistory={suggestion.statusHistory}
                  />
                  {/* --- START: הוספת ה-prop החסר --- */}
                  <InquiryThreadView
                    suggestionId={suggestion.id}
                    userId={userId}
                    showComposer={true}
                    isDemo={isDemo}
                  />
                  {/* --- END: הוספת ה-prop החסר --- */}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          <EnhancedQuickActions
            isExpanded={isActionsExpanded}
            onToggleExpand={() => setIsActionsExpanded((prev) => !prev)}
            canAct={canActOnSuggestion}
            isSubmitting={isSubmitting}
            onApprove={() => triggerConfirmDialog('approve')}
            onDecline={() => triggerConfirmDialog('decline')}
            onAskQuestion={() => setShowAskDialog(true)}
          />
        </DialogContent>
      </Dialog>
      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={`${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`}
        suggestionId={suggestion.id}
      />
    </>
  );
};

export default SuggestionDetailsModal;
