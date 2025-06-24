"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, cn } from "@/lib/utils";
import type { QuestionnaireResponse } from "@/types/next-auth";

import { ProfileCard } from "@/app/components/profile";
import SuggestionTimeline from "../timeline/SuggestionTimeline";
import InquiryThreadView from "../inquiries/InquiryThreadView";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import MatchCompatibilityView from "../compatibility/MatchCompatibilityView";
import type { ExtendedMatchSuggestion } from "../types";

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
// ENHANCED HERO SECTION
// ===============================

const EnhancedHeroSection: React.FC<{
  matchmaker: { firstName: string; lastName: string; };
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
  onStartConversation
}) => {
  const age = targetParty.profile?.birthDate ? 
    new Date().getFullYear() - new Date(targetParty.profile.birthDate).getFullYear() : null;
  const mainImage = targetParty.images?.find(img => img.isMain)?.url;

  // Define the excitement factor type
  interface ExcitementFactor {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
  }

  // Generate excitement factors
  const getExcitementFactors = (): ExcitementFactor[] => {
    const factors: ExcitementFactor[] = [];
    
    if (targetParty.profile?.religiousLevel) {
      factors.push({
        icon: ScrollIcon,
        label: "השקפת עולם משותפת",
        value: targetParty.profile.religiousLevel,
        color: "from-purple-500 to-violet-600"
      });
    }
    
    if (targetParty.profile?.city) {
      factors.push({
        icon: MapPin,
        label: "מיקום נוח",
        value: targetParty.profile.city,
        color: "from-emerald-500 to-green-600"
      });
    }
    
    if (targetParty.profile?.education) {
      factors.push({
        icon: GraduationCap,
        label: "רקע השכלתי",
        value: targetParty.profile.education,
        color: "from-blue-500 to-cyan-600"
      });
    }
    
    if (targetParty.profile?.occupation) {
      factors.push({
        icon: Briefcase,
        label: "תחום מקצועי",
        value: targetParty.profile.occupation,
        color: "from-amber-500 to-orange-600"
      });
    }

    return factors;
  };

  const excitementFactors = getExcitementFactors();

  return (
    <div className="relative min-h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 p-8 md:p-12">
        {/* Matchmaker Introduction with Crown */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 mb-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100">
            <div className="relative">
              <Avatar className="w-16 h-16 border-4 border-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-bold">
                  {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-bold text-purple-600">הצעה מיוחדת מהשדכן המוביל</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{matchmaker.firstName} {matchmaker.lastName}</p>
              <p className="text-sm text-gray-600">מומחה בהתאמות מוצלחות</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Enhanced Profile Image Section */}
          <div className="relative">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
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
                    <div className="text-center">
                      <User className="w-24 h-24 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-600 font-semibold">תמונה בדרך אליך</p>
                      <p className="text-sm text-purple-500">כל הפרטים בפרופיל המלא</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Profile Overlay */}
                <div className="absolute bottom-6 right-6 left-6">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                          {targetParty.firstName}
                        </h3>
                        {age && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                              {age} שנים
                            </Badge>
                            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg">
                              <Heart className="w-3 h-3 ml-1" />
                              זמין להכרות
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={onViewProfile}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-xl rounded-full px-6 py-3 font-bold"
                      >
                        <Telescope className="w-4 h-4 ml-2" />
                        גלה עוד
                      </Button>
                    </div>
                    
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {targetParty.profile?.city && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">{targetParty.profile.city}</span>
                        </div>
                      )}
                      {targetParty.profile?.occupation && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 truncate">{targetParty.profile.occupation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Section */}
          <div className="space-y-8">
            {/* Excitement Header */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-white overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    זו יכולה להיות הנשמה התאומה שלך
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    השדכן שלנו זיהה כאן משהו מיוחד - שילוב נדיר של התאמה עמוקה ופוטנציאל אמיתי
                  </p>
                </div>

                {/* Excitement Factors */}
                {excitementFactors.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {excitementFactors.map((factor, index) => (
                      <div 
                        key={index}
                        className="relative p-4 bg-white/70 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full bg-gradient-to-r text-white flex items-center justify-center shadow-md", factor.color)}>
                            <factor.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">{factor.label}</p>
                            <p className="text-gray-600 text-xs truncate">{factor.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={onViewProfile}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl rounded-xl h-12 font-bold text-base"
                  >
                    <User className="w-5 h-5 ml-2" />
                    רוצה לראות הכל
                  </Button>
                  <Button 
                    onClick={onStartConversation}
                    variant="outline"
                    className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-lg rounded-xl h-12 font-bold text-base"
                  >
                    <MessageSquare className="w-5 h-5 ml-2" />
                    יש לי שאלות
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Matchmaker's Special Insight */}
            {(personalNote || matchingReason) && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-cyan-800 text-lg mb-3 flex items-center gap-2">
                        <Quote className="w-5 h-5" />
                        התובנה המיוחדת של השדכן
                      </h3>
                      
                      {personalNote && (
                        <div className="mb-4 p-4 bg-white/70 rounded-xl">
                          <h4 className="font-semibold text-cyan-700 mb-2">מיועד אישית עבורך:</h4>
                          <p className="text-cyan-900 leading-relaxed italic">&ldquo;{personalNote}&rdquo;</p>
                        </div>
                      )}
                      
                      {matchingReason && (
                        <div className="p-4 bg-white/70 rounded-xl">
                          <h4 className="font-semibold text-blue-700 mb-2">הסיבה להתאמה:</h4>
                          <p className="text-blue-900 leading-relaxed">&ldquo;{matchingReason}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success Stories Teaser */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Star className="w-12 h-12 text-yellow-500 fill-current" />
                    <Sparkles className="w-6 h-6 text-emerald-500 absolute -top-1 -right-1" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-emerald-800 mb-2">
                  הצלחות מדברות בעד עצמן
                </h3>
                <p className="text-emerald-700 mb-4">
                  השדכן שלנו כבר הוביל זוגות מאושרים השנה
                </p>
                <div className="flex justify-center">
                  <UserAiAnalysisDialog suggestedUserId={targetParty.id} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Section */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 text-white overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold">רגע האמת</h3>
                </div>
                <p className="text-gray-300">
                  כל סיפור אהבה מתחיל בהחלטה אחת
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <p className="text-sm text-gray-300">
                  {targetParty.firstName} מחכה להכיר אותך
                </p>
              </div>
              
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Target className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold">הזמן הוא עכשיו</h3>
                </div>
                <p className="text-gray-300">
                  ההזדמנויות הטובות לא מחכות
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ===============================
// QUICK ACTIONS ENHANCED
// ===============================

const EnhancedQuickActions: React.FC<{
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
}> = ({ 
  canAct, 
  isSubmitting, 
  onApprove, 
  onDecline, 
  onAskQuestion 
}) => (
  <div className="flex-shrink-0 bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm border-t border-purple-100 p-6">
    <div className="flex gap-4 max-w-4xl mx-auto">
      {/* Ask Question Button */}
      <Button 
        variant="outline" 
        onClick={onAskQuestion} 
        disabled={isSubmitting}
        className="flex-1 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 rounded-xl h-14 font-semibold text-base shadow-lg"
      >
        <MessageCircle className="w-5 h-5 ml-2" />
        שאלות לשדכן
      </Button>
      
      {canAct && (
        <>
          {/* Decline Button */}
          <Button 
            variant="outline" 
            className="flex-1 text-gray-600 border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all duration-300 rounded-xl h-14 font-semibold text-base shadow-lg" 
            disabled={isSubmitting} 
            onClick={onDecline}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <XCircle className="w-5 h-5 ml-2" />
            )}
            לא מתאים כרגע
          </Button>
          
          {/* Approve Button */}
          <Button 
            className="flex-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl h-14 font-bold text-base transform hover:scale-105" 
            disabled={isSubmitting} 
            onClick={onApprove}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <div className="flex items-center">
                <Heart className="w-5 h-5 ml-2 animate-pulse" />
                <span>בואו נכיר! 💫</span>
              </div>
            )}
          </Button>
        </>
      )}
    </div>
    
    {/* Motivational Footer */}
    <div className="text-center mt-4">
      <p className="text-sm text-gray-600 font-medium">
        ✨ כל סיפור אהבה מתחיל במילה אחת: כן ✨
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
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const [activeTab, setActiveTab] = useState("presentation");
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);

  // ===============================
  // EFFECTS
  // ===============================

  useEffect(() => {
    if (!isOpen || !suggestion) return;
    
    setActiveTab("presentation");
    setQuestionnaire(null);

    const targetPartyId = suggestion.firstPartyId === userId
      ? suggestion.secondPartyId
      : suggestion.firstPartyId;

    const fetchQuestionnaire = async () => {
      setIsQuestionnaireLoading(true);
      try {
        const response = await fetch(`/api/profile/questionnaire?userId=${targetPartyId}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setQuestionnaire(data.questionnaireResponse);
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      } finally {
        setIsQuestionnaireLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [isOpen, suggestion, userId]);

  // ===============================
  // COMPUTED VALUES
  // ===============================
  
  if (!suggestion) return null;

  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
  const canActOnSuggestion = 
    (isFirstParty && suggestion.status === "PENDING_FIRST_PARTY") ||
    (!isFirstParty && suggestion.status === "PENDING_SECOND_PARTY");

  // ===============================
  // EVENT HANDLERS
  // ===============================

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setIsSubmitting(true);
    try {
      await onStatusChange(suggestion.id, newStatus);
      toast.success("הסטטוס עודכן בהצלחה! 🎉", {
        description: newStatus.includes("APPROVED") 
          ? "השדכן/ית יקבל הודעה ויתקדם עם התהליך - זה מרגש!"
          : "תודה על המשוב הכנה - זה עוזר לנו להכיר אותך טוב יותר"
      });
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("אירעה שגיאה בעדכון הסטטוס.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSendQuestion = async (question: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/suggestions/${suggestion.id}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) throw new Error("Failed to send inquiry.");
      
      toast.success("שאלתך נשלחה בהצלחה! 📩", {
        description: "השדכן/ית יחזור אליך בהקדם עם תשובה מקצועית"
      });
      setShowAskDialog(false);
    } catch (error) {
      console.error("Error sending question:", error);
      toast.error("אירעה שגיאה בשליחת השאלה.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => {
    const newStatus = isFirstParty ? "FIRST_PARTY_APPROVED" : "SECOND_PARTY_APPROVED";
    handleStatusChange(newStatus);
  };

  const handleDecline = () => {
    const newStatus = isFirstParty ? "FIRST_PARTY_DECLINED" : "SECOND_PARTY_DECLINED";
    handleStatusChange(newStatus);
  };

  // ===============================
  // RENDER
  // ===============================

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 shadow-2xl rounded-3xl border-0 bg-white overflow-hidden" 
          dir="rtl"
        >
          {/* Enhanced Header */}
          <DialogHeader className="px-6 py-4 border-b border-purple-100 flex-shrink-0 flex flex-row items-center justify-between bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-800">
                  הצעת שידוך מיוחדת
                </DialogTitle>
                <p className="text-sm text-gray-600">אהבה אמיתית מתחילה כאן</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="rounded-full h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          
          <ScrollArea className="flex-grow min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Enhanced Tabs Navigation */}
              <div className="border-b border-purple-100 px-6 pt-2 bg-gradient-to-r from-purple-50/50 to-pink-50/50 backdrop-blur-sm sticky top-0 z-20">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-2xl p-1 h-16 shadow-lg border border-purple-100">
                  <TabsTrigger 
                    value="presentation" 
                    className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>ההצעה המיוחדת</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <User className="w-5 h-5" />
                    <span>פרופיל מלא</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compatibility" 
                    className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <GitCompareArrows className="w-5 h-5" />
                    <span>ניתוח התאמה</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold"
                  >
                    <Info className="w-5 h-5" />
                    <span>פרטים נוספים</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Tab Contents */}
              
              {/* Enhanced Presentation Tab */}
              <TabsContent value="presentation" className="mt-0">
                <EnhancedHeroSection 
                  matchmaker={suggestion.matchmaker}
                  targetParty={targetParty}
                  personalNote={isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes}
                  matchingReason={suggestion.matchingReason}
                  onViewProfile={() => setActiveTab('profile')}
                  onStartConversation={() => setShowAskDialog(true)}
                />
              </TabsContent>
              
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 p-4 md:p-6">
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">טוען פרופיל מלא...</p>
                      <p className="text-sm text-gray-500">הכנו משהו מיוחד בשבילך</p>
                    </div>
                  </div>
                ) : (
                  <ProfileCard
                    profile={targetParty.profile}
                    images={targetParty.images}
                    questionnaire={questionnaire}
                    viewMode="candidate"
                  />
                )}
              </TabsContent>

              {/* Compatibility Tab */}
              <TabsContent value="compatibility" className="mt-0 p-2 md:p-4">
                <MatchCompatibilityView 
                  firstParty={isFirstParty ? suggestion.firstParty : suggestion.secondParty}
                  secondParty={isFirstParty ? suggestion.secondParty : suggestion.firstParty}
                  matchingReason={suggestion.matchingReason}
                />
              </TabsContent>

              {/* Enhanced Details Tab */}
              <TabsContent value="details" className="mt-0 p-6 md:p-8 space-y-8">
                {/* Suggestion Information */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      מידע על ההצעה
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="font-semibold text-gray-700">סטטוס נוכחי:</span>
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md">
                            {suggestion.status}
                          </Badge>
                        </div>
                        {suggestion.decisionDeadline && (
                          <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                            <span className="font-semibold text-gray-700">תאריך יעד:</span>
                            <span className="text-gray-600 font-medium">
                              {new Date(suggestion.decisionDeadline).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-semibold text-gray-700">תאריך יצירה:</span>
                          <span className="text-gray-600 font-medium">
                            {new Date(suggestion.createdAt).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-semibold text-gray-700">עדיפות:</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border-2 font-semibold",
                              suggestion.priority === "HIGH" ? "border-red-300 text-red-700 bg-red-50" :
                              suggestion.priority === "MEDIUM" ? "border-amber-300 text-amber-700 bg-amber-50" :
                              "border-green-300 text-green-700 bg-green-50"
                            )}
                          >
                            {suggestion.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Process Timeline */}
                <SuggestionTimeline statusHistory={suggestion.statusHistory} />

                {/* Conversation with Matchmaker */}
                <InquiryThreadView 
                  suggestionId={suggestion.id}
                  userId={userId}
                  showComposer={true}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>
          
          {/* Enhanced Action Buttons */}
          <EnhancedQuickActions
            canAct={canActOnSuggestion}
            isSubmitting={isSubmitting}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onAskQuestion={() => setShowAskDialog(true)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Ask Matchmaker Dialog */}
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