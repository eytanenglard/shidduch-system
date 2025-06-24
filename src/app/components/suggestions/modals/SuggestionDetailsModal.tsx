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
import { 
  CheckCircle, 
  XCircle, 
  MessageCircle, 
  X, 
  Loader2,
  Sparkles,
  User,
  Info,
  Clock,
  Heart,
  Quote,
  MapPin,
  Briefcase,
  GraduationCap,
  Scroll as ScrollIcon,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils"; // ודא שהוספת את הפונקציה לקובץ utils
import { cn } from "@/lib/utils";
import type { QuestionnaireResponse } from "@/types/next-auth";

import { ProfileCard } from "@/app/components/profile";
import SuggestionTimeline from "../timeline/SuggestionTimeline";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import type { ExtendedMatchSuggestion } from "../types"; 

// --- קומפוננטות עזר פנימיות לעיצוב החדש ---

const HeroIntroduction: React.FC<{
  matchmaker: { firstName: string; lastName: string; };
  personalNote?: string | null;
}> = ({ matchmaker, personalNote }) => (
  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-100/50 via-pink-100/50 to-blue-100/50 border border-purple-200/40 shadow-lg">
    <div className="flex justify-center mb-4">
      <Avatar className="w-16 h-16 border-4 border-white shadow-md">
        <AvatarFallback className="bg-purple-500 text-white text-xl font-bold">
          {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
        </AvatarFallback>
      </Avatar>
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">הצעה מיוחדת בדרך אליך...</h2>
    <p className="text-gray-600 mt-2">מחשבות מהשדכן/ית, {matchmaker.firstName}:</p>
    {personalNote && (
      <div className="mt-4 max-w-2xl mx-auto">
        <div className="relative bg-white/60 p-4 rounded-xl shadow-inner border border-purple-100">
          <Quote className="absolute top-2 right-2 w-8 h-8 text-purple-200/80 transform scale-x-[-1]" />
          <p className="text-lg text-purple-800 italic font-medium leading-relaxed">
            {personalNote}
          </p>
          <Quote className="absolute bottom-2 left-2 w-8 h-8 text-purple-200/80" />
        </div>
      </div>
    )}
  </div>
);

const ProfilePeek: React.FC<{
  targetParty: ExtendedMatchSuggestion['secondParty'];
  onViewProfileClick: () => void;
}> = ({ targetParty, onViewProfileClick }) => {
  const age = targetParty.profile?.birthDate ? new Date().getFullYear() - new Date(targetParty.profile.birthDate).getFullYear() : null;
  const mainImage = targetParty.images?.find(img => img.isMain)?.url;

  return (
    <Card className="overflow-hidden shadow-xl transition-all hover:shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="relative h-64 md:h-auto">
          {mainImage ? (
            <Image src={mainImage} alt={`תמונה של ${targetParty.firstName}`} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <User className="w-16 h-16 text-slate-400" />
            </div>
          )}
        </div>
        <div className="md:col-span-2 p-6 flex flex-col justify-between bg-white">
          <div>
            <p className="text-sm font-semibold text-blue-600">הזדמנות להכיר את</p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
              {targetParty.firstName} {targetParty.lastName}
              {age && <span className="text-2xl font-bold text-gray-500 ml-2">, {age}</span>}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span>{targetParty.profile?.city || "לא צוין"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <span>{targetParty.profile?.occupation || "לא צוין"}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-left">
            <Button onClick={onViewProfileClick} size="lg" className="font-bold">
              לפרופיל המלא
              <ChevronLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const KeyIngredients: React.FC<{
  matchingReason?: string | null;
}> = ({ matchingReason }) => {
  // Define the highlight type explicitly to solve the 'never' type issue
  type Highlight = { icon: React.ElementType; text: string };
  
  const getHighlightsFromReason = (): Highlight[] => {
    const highlights: Highlight[] = []; // <-- כאן התיקון
    const reason = matchingReason?.toLowerCase() || '';
    if (reason.includes('ערכים') || reason.includes('השקפה')) {
      highlights.push({ icon: ScrollIcon, text: 'ערכים והשקפת עולם' });
    }
    if (reason.includes('אישיות') || reason.includes('אופי')) {
      highlights.push({ icon: Heart, text: 'חיבור אישיותי' });
    }
    if (reason.includes('רקע') || reason.includes('השכלה')) {
      highlights.push({ icon: GraduationCap, text: 'רקע וסגנון חיים' });
    }
    if (highlights.length === 0 && matchingReason) {
        highlights.push({ icon: Sparkles, text: 'ניצוץ מיוחד' });
    }
    return highlights;
  }
  
  const highlights = getHighlightsFromReason();

  if (highlights.length === 0) return null;

  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">רכיבי מפתח להתאמה מוצלחת</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500 transform transition-transform hover:-translate-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <item.icon className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-xl text-gray-800">{item.text}</h4>
          </div>
        ))}
      </div>
      {matchingReason && 
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-gray-700 text-center"><span className="font-semibold">פירוט מהשדכן/ית:</span> {matchingReason}</p>
          </CardContent>
        </Card>
      }
    </div>
  );
};

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
  
  // State for the questionnaire data
const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);

  useEffect(() => {
    // Reset tab and data when modal opens or suggestion changes
    if (isOpen) {
      setActiveTab("presentation");
      setQuestionnaire(null);
    } else {
      return; // Don't fetch if modal is closed
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
          toast.error("שגיאה בטעינת פרטי השאלון.");
        }
      } catch (error) {
        console.error("Error fetching questionnaire:", error);
        toast.error("שגיאה קריטית בטעינת פרטי השאלון.");
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
      toast.success("הסטטוס עודכן בהצלחה!");
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
      toast.success("שאלתך נשלחה בהצלחה!");
      setShowAskDialog(false);
    } catch (error) {
      console.error("Error sending question:", error);
      toast.error("אירעה שגיאה בשליחת השאלה.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 shadow-2xl rounded-2xl" 
          dir="rtl"
        >
          <DialogHeader className="px-6 py-3 border-b flex-shrink-0 flex flex-row items-center justify-between bg-white sticky top-0 z-20">
             <DialogTitle className="text-xl font-bold text-gray-800">
                הזדמנות להכיר: הצעה עבורך
             </DialogTitle>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={onClose} 
               className="rounded-full h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
             >
               <X className="w-4 h-4" />
             </Button>
          </DialogHeader>
          
          <div className="flex-grow min-h-0">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col min-h-0 h-full">
                <div className="border-b px-4 pt-2 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="presentation" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            תמצית ההצעה
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            פרופיל מלא
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-gray-500" />
                            פרטים והיסטוריה
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                <ScrollArea className="flex-grow">
                    <TabsContent value="presentation" className="mt-0 p-4 md:p-8 space-y-8 bg-gradient-to-b from-slate-50 to-blue-50">
                        <HeroIntroduction 
                            matchmaker={suggestion.matchmaker}
                            personalNote={isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes}
                        />
                        <ProfilePeek 
                            targetParty={targetParty} 
                            onViewProfileClick={() => setActiveTab('profile')} 
                        />
                        <KeyIngredients
                            matchingReason={suggestion.matchingReason}
                        />
                        <div className="text-center pt-4 border-t border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">רוצה חוות דעת נוספת?</h3>
                            <UserAiAnalysisDialog suggestedUserId={targetParty.id} />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="profile" className="mt-0 p-2 md:p-4">
                        {isQuestionnaireLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="mr-4">טוען פרופיל מלא...</p>
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

                    <TabsContent value="details" className="mt-0 p-4 md:p-6 space-y-6">
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold mb-2">פרטי הצעה טכניים</h3>
                                <p><span className="font-semibold">סטטוס נוכחי:</span> {suggestion.status}</p>
                                {suggestion.decisionDeadline && <p><span className="font-semibold">תאריך יעד להחלטה:</span> {new Date(suggestion.decisionDeadline).toLocaleDateString('he-IL')}</p>}
                            </CardContent>
                        </Card>
                        <SuggestionTimeline statusHistory={suggestion.statusHistory} />
                    </TabsContent>
                </ScrollArea>
             </Tabs>
          </div>
          
          <DialogFooter className="px-6 py-3 border-t flex-shrink-0 bg-gray-50/50">
            <div className="flex gap-2 w-full justify-between items-center">
              <div>
                 <Button 
                   variant="outline" 
                   onClick={() => setShowAskDialog(true)} 
                   disabled={isSubmitting}
                 >
                   <MessageCircle className="w-4 h-4 ml-2" />
                   שאלה לשדכן/ית
                 </Button>
              </div>
              <div className="flex gap-2">
                 {canActOnSuggestion && (
                   <Button 
                     variant="outline" 
                     className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold" 
                     disabled={isSubmitting} 
                     onClick={() => handleStatusChange(isFirstParty ? "FIRST_PARTY_DECLINED" : "SECOND_PARTY_DECLINED")}
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <XCircle className="w-4 h-4 ml-2" />}
                     לא מעוניין/ת, תודה
                   </Button>
                 )}
                 {canActOnSuggestion && (
                   <Button 
                     variant="default" 
                     className="bg-green-600 hover:bg-green-700 font-semibold" 
                     disabled={isSubmitting} 
                     onClick={() => handleStatusChange(isFirstParty ? "FIRST_PARTY_APPROVED" : "SECOND_PARTY_APPROVED")}
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                     מעוניין/ת להמשיך
                   </Button>
                 )}
              </div>
            </div>
          </DialogFooter>
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