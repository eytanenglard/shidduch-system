// src/app/components/suggestions/modals/SuggestionDetailsModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  ChevronLeft,
  GitCompareArrows,
  Star,
  Camera,
  Calendar,
  Phone,
  Mail,
  Brain,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { QuestionnaireResponse } from "@/types/next-auth";

import { ProfileCard } from "@/app/components/profile";
import SuggestionTimeline from "../timeline/SuggestionTimeline";
import InquiryThreadView from "../inquiries/InquiryThreadView";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import MatchCompatibilityView from "../compatibility/MatchCompatibilityView";
import type { ExtendedMatchSuggestion } from "../types"; 

// --- קומפוננטות עזר מעוצבות עם העיצוב החדש ---

const HeroSection: React.FC<{
  matchmaker: { firstName: string; lastName: string; };
  targetParty: ExtendedMatchSuggestion['secondParty'];
  personalNote?: string | null;
  onViewProfile: () => void;
}> = ({ matchmaker, targetParty, personalNote, onViewProfile }) => {
  const age = targetParty.profile?.birthDate ? 
    new Date().getFullYear() - new Date(targetParty.profile.birthDate).getFullYear() : null;
  const mainImage = targetParty.images?.find(img => img.isMain)?.url;

  return (
    <div className="relative overflow-hidden">
      {/* רקע גרדיאנט חדש */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 via-white to-emerald-50/20"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-100/20 to-emerald-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-cyan-100/20 rounded-full blur-2xl"></div>
      
      <div className="relative z-10 p-8 md:p-12">
        {/* כותרת מרכזית */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Avatar className="w-16 h-16 border-4 border-white shadow-xl">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-xl font-bold">
                {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium text-cyan-600">הצעה מיוחדת מ</p>
              <p className="text-lg font-bold text-gray-800">{matchmaker.firstName} {matchmaker.lastName}</p>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            הזדמנות להכיר את
            <span className="block bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {targetParty.firstName}
            </span>
          </h1>
          
          {age && (
            <p className="text-xl text-gray-600 font-medium">{age} שנים • מחפש/ת אהבה אמיתית</p>
          )}
        </div>

        {/* קלאסה ראשית - תמונה ופרטים */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* תמונה */}
          <div className="relative group">
            <div className="relative h-80 lg:h-96 rounded-3xl overflow-hidden shadow-2xl">
              {mainImage ? (
                <Image 
                  src={mainImage} 
                  alt={`תמונה של ${targetParty.firstName}`} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <User className="w-24 h-24 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              
              {/* פרטי יסוד על התמונה */}
              <div className="absolute bottom-4 right-4 left-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {targetParty.firstName} {targetParty.lastName}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {targetParty.profile?.city && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-cyan-500" />
                        <span>{targetParty.profile.city}</span>
                      </div>
                    )}
                    {targetParty.profile?.occupation && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        <span className="truncate">{targetParty.profile.occupation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* כפתור צפייה בפרופיל */}
            <Button 
              onClick={onViewProfile}
              className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm shadow-lg border-0 rounded-full"
              size="sm"
            >
              <Eye className="w-4 h-4 ml-1" />
              פרופיל מלא
            </Button>
          </div>

          {/* פרטים ונימוק */}
          <div className="space-y-6">
            {/* מה מיוחד כאן */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-cyan-50/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">מה מיוחד כאן?</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {targetParty.profile?.religiousLevel && (
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                      <ScrollIcon className="w-5 h-5 text-cyan-600" />
                      <div>
                        <p className="font-semibold text-gray-800">השקפת עולם</p>
                        <p className="text-sm text-gray-600">{targetParty.profile.religiousLevel}</p>
                      </div>
                    </div>
                  )}
                  
                  {targetParty.profile?.education && (
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-gray-800">השכלה</p>
                        <p className="text-sm text-gray-600">{targetParty.profile.education}</p>
                      </div>
                    </div>
                  )}
                  
                  {targetParty.profile?.about && (
                    <div className="p-3 bg-white/60 rounded-xl">
                      <p className="font-semibold text-gray-800 mb-1">קצת עליו/ה</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                        {targetParty.profile.about}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* הערות אישיות מהשדכן */}
            {personalNote && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Quote className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-800 mb-2">מחשבות אישיות מהשדכן/ית</h4>
                      <p className="text-blue-900 leading-relaxed italic">{personalNote}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* קורא לפעולה */}
            <div className="text-center p-6 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl text-white shadow-xl">
              <Star className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">מוכן/ה לצעד הבא?</h3>
              <p className="text-cyan-100 mb-4">השדכן/ית האמין/ה שיש כאן פוטנציאל מיוחד</p>
              <UserAiAnalysisDialog suggestedUserId={targetParty.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActions: React.FC<{
  canAct: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onAskQuestion: () => void;
}> = ({ canAct, isSubmitting, onApprove, onDecline, onAskQuestion }) => (
  <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4">
    <div className="flex gap-3 max-w-2xl mx-auto">
      {/* שאלה לשדכן */}
      <Button 
        variant="outline" 
        onClick={onAskQuestion} 
        disabled={isSubmitting}
        className="flex-1 border-gray-200 hover:bg-gray-50 transition-colors rounded-xl h-12"
      >
        <MessageCircle className="w-5 h-5 ml-2" />
        שאלה לשדכן/ית
      </Button>
      
      {canAct && (
        <>
          {/* דחייה */}
          <Button 
            variant="outline" 
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors rounded-xl h-12 font-medium" 
            disabled={isSubmitting} 
            onClick={onDecline}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <XCircle className="w-5 h-5 ml-2" />
            )}
            לא מתאים לי
          </Button>
          
          {/* אישור */}
          <Button 
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl h-12 font-medium" 
            disabled={isSubmitting} 
            onClick={onApprove}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 ml-2" />
            )}
            מעוניין/ת להכיר!
          </Button>
        </>
      )}
    </div>
  </div>
);

// --- הקומפוננטה הראשית ---
interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (suggestionId: string, newStatus: string) => Promise<void>;
}

const SuggestionDetailsModal: React.FC<SuggestionDetailsModalProps> = ({
  suggestion,
  userId,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState("presentation");
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("presentation");
      setQuestionnaire(null);
    } else {
      return;
    }

    if (!suggestion) return;

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
        } else {
          console.error("Failed to fetch questionnaire:", data.error);
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
      } finally {
        setIsQuestionnaireLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [isOpen, suggestion, userId]);

  if (!suggestion) {
    return null;
  }

  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
  
  const canActOnSuggestion =
    (isFirstParty && suggestion.status === "PENDING_FIRST_PARTY") ||
    (!isFirstParty && suggestion.status === "PENDING_SECOND_PARTY");

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    setIsSubmitting(true);
    try {
      await onStatusChange(suggestion.id, newStatus);
      toast.success("הסטטוס עודכן בהצלחה!", {
        description: newStatus.includes("APPROVED") 
          ? "השדכן/ית יקבל הודעה ויתקדם עם התהליך"
          : "תודה על המשוב הכנה"
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
      toast.success("שאלתך נשלחה בהצלחה!", {
        description: "השדכן/ית יחזור אליך בהקדם"
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 shadow-2xl rounded-3xl border-0 bg-white overflow-hidden" 
          dir="rtl"
        >
          {/* כותרת */}
          <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0 flex flex-row items-center justify-between bg-white/90 backdrop-blur-sm sticky top-0 z-30">
             <DialogTitle className="text-xl font-bold text-gray-800">
                הצעת שידוך מיוחדת
             </DialogTitle>
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
                {/* טאבים */}
                <div className="border-b border-gray-100 px-6 pt-2 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                    <TabsList className="grid w-full grid-cols-4 bg-cyan-50/50 rounded-2xl p-1 h-14">
                        <TabsTrigger 
                          value="presentation" 
                          className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium"
                        >
                            <Sparkles className="w-5 h-5 text-cyan-500" />
                            <span>ההצעה</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="profile" 
                          className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium"
                        >
                            <User className="w-5 h-5 text-emerald-500" />
                            <span>פרופיל מלא</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="compatibility" 
                          className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium"
                        >
                            <GitCompareArrows className="w-5 h-5 text-blue-500" />
                            <span>ניתוח התאמה</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="details" 
                          className="flex items-center gap-2 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-medium"
                        >
                            <Info className="w-5 h-5 text-gray-500" />
                            <span>פרטים</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                {/* תוכן ההצעה */}
                <TabsContent value="presentation" className="mt-0">
                    <HeroSection 
                        matchmaker={suggestion.matchmaker}
                        targetParty={targetParty}
                        personalNote={isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes}
                        onViewProfile={() => setActiveTab('profile')}
                    />
                </TabsContent>
                
                {/* פרופיל מלא */}
                <TabsContent value="profile" className="mt-0 p-4 md:p-6">
                    {isQuestionnaireLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">טוען פרופיל מלא...</p>
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

                {/* ניתוח התאמה */}
                <TabsContent value="compatibility" className="mt-0 p-2 md:p-4">
                  <MatchCompatibilityView 
                    firstParty={isFirstParty ? suggestion.firstParty : suggestion.secondParty}
                    secondParty={isFirstParty ? suggestion.secondParty : suggestion.firstParty}
                    matchingReason={suggestion.matchingReason}
                  />
                </TabsContent>

                {/* פרטים וניהול */}
                <TabsContent value="details" className="mt-0 p-6 md:p-8 space-y-8">
                    {/* מידע על ההצעה */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-cyan-600" />
                                מידע על ההצעה
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">סטטוס נוכחי:</span>
                                        <Badge className="bg-cyan-100 text-cyan-800">
                                            {suggestion.status}
                                        </Badge>
                                    </div>
                                    {suggestion.decisionDeadline && (
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-700">תאריך יעד:</span>
                                            <span className="text-gray-600">
                                                {new Date(suggestion.decisionDeadline).toLocaleDateString('he-IL')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">תאריך יצירה:</span>
                                        <span className="text-gray-600">
                                            {new Date(suggestion.createdAt).toLocaleDateString('he-IL')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">עדיפות:</span>
                                        <Badge variant="outline">
                                            {suggestion.priority}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* היסטוריית התהליך */}
                    <SuggestionTimeline statusHistory={suggestion.statusHistory} />

                    {/* שיחה עם השדכן */}
                    <InquiryThreadView 
                      suggestionId={suggestion.id}
                      userId={userId}
                      showComposer={true}
                    />
                </TabsContent>
             </Tabs>
          </ScrollArea>
          
          {/* כפתורי פעולה */}
          <QuickActions
             canAct={canActOnSuggestion}
             isSubmitting={isSubmitting}
             onApprove={handleApprove}
             onDecline={handleDecline}
             onAskQuestion={() => setShowAskDialog(true)}
          />
        </DialogContent>
      </Dialog>
      
      {/* דיאלוג שאלה לשדכן */}
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