// src/app/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle as UiAlertTitle,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getInitials, cn } from '@/lib/utils';
import type { QuestionnaireResponse } from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

import { ProfileCard } from '@/app/components/profile';
import SuggestionTimeline from '../timeline/SuggestionTimeline';
import InquiryThreadView from '../inquiries/InquiryThreadView';
import { AskMatchmakerDialog } from '../dialogs/AskMatchmakerDialog';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import UserAiAnalysisDisplay from '../compatibility/UserAiAnalysisDisplay';
import type { ExtendedMatchSuggestion } from '../types';

// ===============================
// TYPES & INTERFACES
// ===============================

interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (suggestionId: string, newStatus: string) => Promise<void>;
}

// ===============================
// ENHANCED HERO SECTION (No changes here)
// ===============================

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
  }

  const getExcitementFactors = (): ExcitementFactor[] => {
    const factors: ExcitementFactor[] = [];
    if (targetParty.profile?.religiousLevel)
      factors.push({
        icon: ScrollIcon,
        label: 'השקפת עולם משותפת',
        value: targetParty.profile.religiousLevel,
        color: 'from-purple-500 to-violet-600',
      });
    if (targetParty.profile?.city)
      factors.push({
        icon: MapPin,
        label: 'מיקום נוח',
        value: targetParty.profile.city,
        color: 'from-emerald-500 to-green-600',
      });
    if (targetParty.profile?.education)
      factors.push({
        icon: GraduationCap,
        label: 'רקע השכלתי',
        value: targetParty.profile.education,
        color: 'from-blue-500 to-cyan-600',
      });
    if (targetParty.profile?.occupation)
      factors.push({
        icon: Briefcase,
        label: 'תחום מקצועי',
        value: targetParty.profile.occupation,
        color: 'from-amber-500 to-orange-600',
      });
    return factors;
  };
  const excitementFactors = getExcitementFactors();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>
      <div className="relative z-10 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100">
            <div className="relative">
              <Avatar className="w-16 h-16 border-4 border-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-bold">
                  {getInitials(
                    `${matchmaker.firstName} ${matchmaker.lastName}`
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-purple-600">
                הצעה מיוחדת מהשדכן/ית
              </p>
              <p className="text-xl font-bold text-gray-800">
                {matchmaker.firstName} {matchmaker.lastName}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
            <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              {mainImage ? (
                <Image
                  src={mainImage}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 right-6 left-6">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {targetParty.firstName}
                      </h3>
                      {age && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                          {age} שנים
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={onViewProfile}
                      className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl rounded-full px-6 py-3 font-bold"
                    >
                      <Telescope className="w-4 h-4 ml-2" /> גלה עוד
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-white">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    זו יכולה להיות ההתאמה המושלמת
                  </h2>
                  <p className="text-lg text-gray-600">
                    השדכן זיהה כאן שילוב נדיר של התאמה ופוטנציאל.
                  </p>
                </div>
                {excitementFactors.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {excitementFactors.map((factor, index) => (
                      <div
                        key={index}
                        className="relative p-4 bg-white/70 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full bg-gradient-to-r text-white flex items-center justify-center shadow-md',
                              factor.color
                            )}
                          >
                            <factor.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {factor.label}
                            </p>
                            <p className="text-gray-600 text-xs truncate">
                              {factor.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={onViewProfile}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl rounded-xl h-12 font-bold text-base"
                  >
                    <User className="w-5 h-5 ml-2" /> צפה בפרופיל המלא
                  </Button>
                  <Button
                    onClick={onStartConversation}
                    variant="outline"
                    className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-lg rounded-xl h-12 font-bold text-base"
                  >
                    <MessageSquare className="w-5 h-5 ml-2" /> יש לי שאלה לשדכן
                  </Button>
                </div>
              </CardContent>
            </Card>
            {(personalNote || matchingReason) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-cyan-800 text-lg mb-3">
                        התובנה של השדכן
                      </h3>
                      {personalNote && (
                        <p className="text-cyan-900 leading-relaxed italic mb-2">
                          “{personalNote}”
                        </p>
                      )}
                      {matchingReason && (
                        <p className="text-blue-900 leading-relaxed">
                          “{matchingReason}”
                        </p>
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

// ===============================
// QUICK ACTIONS ENHANCED - MOBILE OPTIMIZED
// ===============================

const EnhancedQuickActions: React.FC<{
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
}> = ({ canAct, isSubmitting, onApprove, onDecline, onAskQuestion }) => (
  <div className="flex-shrink-0 bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm border-t border-purple-100 p-4 md:p-6">
    {/* ======================= START OF CHANGE FOR MOBILE ======================= */}
    {/*
      Here is the core change.
      On mobile (default), we use a `grid` layout for vertical stacking.
      On medium screens and up (`md:`), we switch to a `flex` layout for horizontal arrangement.
    */}
    <div className="max-w-4xl mx-auto grid grid-cols-1 gap-3 md:flex md:gap-4">
      {canAct && (
        // Approve Button (Primary Action) - always visible if user can act
        <Button
          className="w-full md:flex-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl h-14 font-bold text-base transform hover:scale-105"
          disabled={isSubmitting}
          onClick={onApprove}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="flex items-center justify-center">
              <Heart className="w-5 h-5 ml-2 animate-pulse" />
              <span>מעוניין/ת להכיר!</span>
            </div>
          )}
        </Button>
      )}

      {/* Ask Question Button (Secondary Action) */}
      <Button
        variant="outline"
        onClick={onAskQuestion}
        disabled={isSubmitting}
        className="w-full md:flex-1 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 rounded-xl h-14 font-semibold text-base shadow-lg"
      >
        <MessageCircle className="w-5 h-5 ml-2" />
        שאלות לשדכן
      </Button>

      {canAct && (
        // Decline Button (Tertiary Action) - styled to be less prominent
        <Button
          variant="ghost" // Using ghost variant for a more subtle look on mobile
          className="w-full md:flex-1 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-300 rounded-xl h-14 font-semibold text-base md:border-2 md:border-gray-200 md:shadow-lg md:hover:border-gray-300"
          disabled={isSubmitting}
          onClick={onDecline}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <XCircle className="w-5 h-5 ml-2" />
              <span>לא מתאים כרגע</span>
            </>
          )}
        </Button>
      )}
    </div>
    {/* ======================== END OF CHANGE FOR MOBILE ======================== */}

    <div className="text-center mt-4">
      <p className="text-sm text-gray-600 font-medium">
        ✨ כל סיפור אהבה מתחיל בהחלטה אחת ✨
      </p>
    </div>
  </div>
);

// ===============================
// MAIN COMPONENT
// ===============================

const SuggestionDetailsModal: React.FC<SuggestionDetailsModalProps> = ({
  suggestion,
  userId,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState('presentation');
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<
    'approve' | 'decline' | null
  >(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);

  const isFirstParty = suggestion?.firstPartyId === userId;
  const targetParty = suggestion
    ? isFirstParty
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;
  const targetPartyId = targetParty?.id;

  useEffect(() => {
    if (isOpen) {
      setActiveTab('presentation');
      setQuestionnaire(null);
      setIsFullScreen(!!document.fullscreenElement);

      if (targetPartyId) {
        const fetchQuestionnaire = async () => {
          setIsQuestionnaireLoading(true);
          try {
            const response = await fetch(
              `/api/profile/questionnaire?userId=${targetPartyId}`
            );
            const data = await response.json();
            if (response.ok && data.success)
              setQuestionnaire(data.questionnaireResponse);
          } catch (error) {
            console.error('Error fetching questionnaire:', error);
          } finally {
            setIsQuestionnaireLoading(false);
          }
        };
        fetchQuestionnaire();
      }
    }

    const handleFullScreenChange = () =>
      setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isOpen, targetPartyId]);

  if (!suggestion || !targetParty) return null;

  const canActOnSuggestion =
    (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') ||
    (!isFirstParty && suggestion.status === 'PENDING_SECOND_PARTY');

  const toggleFullScreen = () => {
    if (!dialogContentRef.current) return;
    if (!document.fullscreenElement) {
      dialogContentRef.current
        .requestFullscreen()
        .catch(() => toast.error('לא ניתן לעבור למסך מלא'));
    } else {
      document.exitFullscreen();
    }
  };

  const triggerConfirmDialog = (action: 'approve' | 'decline') => {
    setActionToConfirm(action);
    setShowConfirmDialog(true);
  };

  const executeConfirmedAction = async () => {
    if (!onStatusChange || !suggestion || !actionToConfirm) return;
    const newStatus =
      actionToConfirm === 'approve'
        ? isFirstParty
          ? 'FIRST_PARTY_APPROVED'
          : 'SECOND_PARTY_APPROVED'
        : isFirstParty
          ? 'FIRST_PARTY_DECLINED'
          : 'SECOND_PARTY_DECLINED';
    setIsSubmitting(true);
    setShowConfirmDialog(false);
    try {
      await onStatusChange(suggestion.id, newStatus);
      toast.success('הסטטוס עודכן בהצלחה!');
      onClose();
    } catch (error) {
      toast.error('אירעה שגיאה בעדכון הסטטוס.');
    } finally {
      setIsSubmitting(false);
      setActionToConfirm(null);
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
      toast.success('שאלתך נשלחה בהצלחה!');
      setShowAskDialog(false);
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת השאלה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          ref={dialogContentRef}
          className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 shadow-2xl rounded-3xl border-0 bg-white overflow-hidden"
          dir="rtl"
        >
          <DialogHeader className="px-6 py-4 border-b border-purple-100 flex-shrink-0 flex flex-row items-center justify-between bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  הצעה מיוחדת
                </DialogTitle>
                <p className="text-sm text-gray-600">הצצה להזדמנות חדשה</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullScreen}
                      className="rounded-full h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {isFullScreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullScreen ? 'צא ממסך מלא' : 'מסך מלא'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-grow min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* ======================= START OF CHANGE FOR TABS ======================= */}
              <div className="border-b border-purple-100 px-2 sm:px-6 pt-2 bg-gradient-to-r from-purple-50/50 to-pink-50/50 backdrop-blur-sm sticky top-0 z-20">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-2xl p-1 h-16 shadow-lg border border-purple-100">
                  <TabsTrigger
                    value="presentation"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden md:inline">הצגה</span>
                    <span className="md:hidden">הצגה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="profile"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden md:inline">פרופיל מלא</span>
                    <span className="md:hidden">פרופיל</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="compatibility"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <GitCompareArrows className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden md:inline">ניתוח התאמה</span>
                    <span className="md:hidden">התאמה</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="details"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden md:inline">פרטים ותקשורת</span>
                    <span className="md:hidden">פרטים</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* ======================== END OF CHANGE FOR TABS ======================== */}

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
              <TabsContent value="profile" className="mt-0 p-4 md:p-6">
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : targetParty.profile ? (
                  <ProfileCard
                    profile={targetParty.profile}
                    isProfileComplete={targetParty.isProfileComplete}
                    images={targetParty.images}
                    questionnaire={questionnaire}
                    viewMode="candidate"
                  />
                ) : (
                  <div className="text-center p-8">
                    <AlertTriangle className="w-16 h-16 text-red-400 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold">שגיאה בטעינת פרופיל</h3>
                    <p>לא הצלחנו לטעון את הפרופיל. אנא פנה לשדכן.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="compatibility"
                className="mt-0 p-2 md:p-4 bg-slate-50 min-h-full"
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center space-y-8 p-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto shadow-lg">
                    <Bot className="w-12 h-12 text-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-800">
                      רוצה מבט מעמיק יותר?
                    </h3>
                    <p className="text-gray-600 max-w-lg mx-auto">
                      ה-AI שלנו יכול לנתח את הנתונים ולספק לך תובנות על פוטנציאל
                      החיבור.
                    </p>
                  </div>
                  <UserAiAnalysisDialog suggestedUserId={targetParty.id} />
                </div>
              </TabsContent>
              <TabsContent
                value="details"
                className="mt-0 p-6 md:p-8 space-y-8"
              >
                <SuggestionTimeline statusHistory={suggestion.statusHistory} />
                <InquiryThreadView
                  suggestionId={suggestion.id}
                  userId={userId}
                  showComposer={true}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <EnhancedQuickActions
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-0 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actionToConfirm === 'approve'
                ? 'אישור הצעת השידוך'
                : 'דחיית הצעת השידוך'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
              {actionToConfirm === 'approve'
                ? isFirstParty
                  ? 'אתה מאשר את ההצעה. היא תועבר לצד השני לאישור.'
                  : 'הצד הראשון כבר אישר! באישור שלך, פרטי הקשר יוחלפו.'
                : 'האם אתה בטוח שברצונך לדחות את ההצעה?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl" disabled={isSubmitting}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedAction}
              disabled={isSubmitting}
              className={cn(
                'rounded-xl font-medium shadow-lg',
                actionToConfirm === 'approve'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : actionToConfirm === 'approve' ? (
                'כן, לאשר!'
              ) : (
                'דחיית ההצעה'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SuggestionDetailsModal;