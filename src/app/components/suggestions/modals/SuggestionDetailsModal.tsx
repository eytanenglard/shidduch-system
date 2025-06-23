// src/app/components/suggestions/modals/SuggestionDetailsModal.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  Info,
  User,
  Clock,
  Briefcase,
  GraduationCap,
  MapPin,
  Scroll as ScrollIcon,
  Bot,
  Sparkles,
  X,
  Loader2, // 1. (FIX) הוספת אייקון טעינה
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { ProfileCard } from "@/app/components/profile";
import SuggestionTimeline from "../timeline/SuggestionTimeline";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage, QuestionnaireResponse } from "@/types/next-auth";
import { cn } from "@/lib/utils";
import { UserAiAnalysisDialog } from "../dialogs/UserAiAnalysisDialog";
import { toast } from "sonner"; // 2. (FIX) הוספת toast לשגיאות

// הגדרת טיפוסים מורחבים כפי שהיו בקובץ המקורי
interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName:string;
    email: string;
  };
}

interface PartyInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: ExtendedUserProfile;
  images: UserImage[];
}

interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

// 3. (FIX) הסרת השדה secondPartyQuestionnaire מהממשק
interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}


interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (suggestionId: string, newStatus: string) => Promise<void>;
}


// פונקציות עזר מהקובץ המקורי
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = { DRAFT: "טיוטה", PENDING_FIRST_PARTY: "ממתין לתשובתך", FIRST_PARTY_APPROVED: "אישרת", FIRST_PARTY_DECLINED: "דחית", PENDING_SECOND_PARTY: "ממתין לצד השני", SECOND_PARTY_APPROVED: "הצד השני אישר", SECOND_PARTY_DECLINED: "הצד השני דחה", CONTACT_DETAILS_SHARED: "פרטי קשר שותפו", AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה", THINKING_AFTER_DATE: "בחשיבה לאחר פגישה", PROCEEDING_TO_SECOND_DATE: "התקדמות לפגישה שנייה", ENDED_AFTER_FIRST_DATE: "הסתיים לאחר פגישה ראשונה", DATING: "בתהליך היכרות", ENGAGED: "אירוסין", MARRIED: "נישואין", CANCELLED: "בוטל", CLOSED: "נסגר", EXPIRED: "פג תוקף" };
  return statusMap[status] || status;
};

const getPriorityLabel = (priority: string): { label: string; color: string } => {
  switch (priority) {
    case "LOW": return { label: "נמוכה", color: "bg-gray-100 text-gray-800" };
    case "MEDIUM": return { label: "בינונית", color: "bg-blue-100 text-blue-800" };
    case "HIGH": return { label: "גבוהה", color: "bg-yellow-100 text-yellow-800" };
    case "URGENT": return { label: "דחופה", color: "bg-red-100 text-red-800" };
    default: return { label: "בינונית", color: "bg-blue-100 text-blue-800" };
  }
};

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const SuggestionDetailsModal: React.FC<SuggestionDetailsModalProps> = ({
  suggestion,
  userId,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [activeTab, setActiveTab] = useState("profile");
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4. (FIX) הוספת state לניהול השאלון והטעינה שלו
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [isQuestionnaireLoading, setIsQuestionnaireLoading] = useState(false);


  // 5. (FIX) הוספת useEffect לטעינת השאלון כאשר המודאל נפתח
  useEffect(() => {
    // איפוס הטאב והשאלון כאשר המודאל נפתח או ההצעה משתנה
    if (isOpen) {
      setActiveTab("profile");
      setQuestionnaire(null);
    }

    if (!isOpen || !suggestion) {
      return;
    }

    const fetchQuestionnaire = async () => {
      setIsQuestionnaireLoading(true);
      try {
        const targetParty = suggestion.firstPartyId === userId
          ? suggestion.secondParty
          : suggestion.firstParty;
        
        const response = await fetch(`/api/profile/questionnaire?userId=${targetParty.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setQuestionnaire(data.questionnaireResponse);
        } else {
          setQuestionnaire(null);
          console.error("Failed to fetch questionnaire:", data.error || "Unknown error");
          toast.error("שגיאה בטעינת פרטי השאלון.");
        }
      } catch (error) {
        setQuestionnaire(null);
        console.error("Error fetching questionnaire:", error);
        toast.error("שגיאה בטעינת פרטי השאלון.");
      } finally {
        setIsQuestionnaireLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [isOpen, suggestion, userId]); // מופעל מחדש כשהמודאל נפתח או כשההצעה משתנה


  if (!suggestion) return null;

  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty ? suggestion.secondParty : suggestion.firstParty;
  const targetPartyAge = targetParty.profile?.birthDate ? calculateAge(new Date(targetParty.profile.birthDate)) : null;

  // 6. (FIX) נשתמש ב-state המקומי במקום בנתון שהגיע מה-props
  const targetQuestionnaire = questionnaire;

  const priorityInfo = getPriorityLabel(suggestion.priority);

  const canApprove =
    (isFirstParty && suggestion.status === "PENDING_FIRST_PARTY") ||
    (!isFirstParty && suggestion.status === "PENDING_SECOND_PARTY");
  const canDecline = canApprove;

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    try {
      setIsSubmitting(true);
      await onStatusChange(suggestion.id, newStatus);
      onClose();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuestion = async (question: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/suggestions/${suggestion.id}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("Failed to send inquiry");
      setShowAskDialog(false);
    } catch (error) {
      console.error("Error sending question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">
                הצעת שידוך עם {targetParty.firstName}
                {targetPartyAge && <span className="text-lg font-normal">, {targetPartyAge}</span>}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs py-1", priorityInfo.color)}>{priorityInfo.label}</Badge>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8"><X className="w-4 h-4" /></Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="border-b px-6 pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />פרופיל</TabsTrigger>
                  <TabsTrigger value="details"><Info className="w-4 h-4 mr-2" />פרטי ההצעה</TabsTrigger>
                  <TabsTrigger value="timeline"><Clock className="w-4 h-4 mr-2" />היסטוריה</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="profile" className="p-6">
                
                {currentUserId && (
                  <div className="mb-6 p-4 bg-purple-50 border border-dashed border-purple-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                          <h3 className="font-semibold text-purple-800 flex items-center gap-2 text-base">
                              <Bot className="w-5 h-5"/>
                              מתלבט/ת? קבל/י דעה שנייה מה-AI
                          </h3>
                          <p className="text-sm text-purple-700 mt-1">
                              קבל ניתוח מקיף של ההתאמה על סמך הפרופילים של שניכם כדי לקבל החלטה מושכלת.
                          </p>
                      </div>
                      <UserAiAnalysisDialog 
                          suggestedUserId={targetParty.id} 
                      />
                  </div>
                )}
                
                {/* 7. (FIX) הוספת טיפול במצב טעינה */}
                {isQuestionnaireLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="mr-4">טוען פרטי פרופיל...</p>
                  </div>
                ) : (
                  <ProfileCard
                    profile={{ ...targetParty.profile, user: { firstName: targetParty.firstName, lastName: targetParty.lastName, email: targetParty.email } }}
                    images={targetParty.images}
                    questionnaire={targetQuestionnaire}
                    viewMode="candidate"
                  />
                )}

              </TabsContent>

              <TabsContent value="details" className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4">פרטי ההצעה</h3>
                        <div className="space-y-4">
                            <div><p className="text-sm text-gray-500">סטטוס</p><Badge>{getStatusLabel(suggestion.status)}</Badge></div>
                            <div><p className="text-sm text-gray-500">שדכן</p><p>{suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}</p></div>
                            {suggestion.decisionDeadline && <div><p className="text-sm text-gray-500">תאריך יעד</p><p>{format(new Date(suggestion.decisionDeadline), "dd/MM/yyyy", { locale: he })}</p></div>}
                        </div>
                    </CardContent></Card>
                    <Card><CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4">סיבות להצעה</h3>
                        <p className="whitespace-pre-line">{suggestion.matchingReason || "לא צוינו סיבות מיוחדות."}</p>
                        {isFirstParty && suggestion.firstPartyNotes && <div className="mt-4"><h4 className="font-medium text-sm mb-2">הערות עבורך:</h4><div className="bg-blue-50 p-3 rounded">{suggestion.firstPartyNotes}</div></div>}
                        {!isFirstParty && suggestion.secondPartyNotes && <div className="mt-4"><h4 className="font-medium text-sm mb-2">הערות עבורך:</h4><div className="bg-blue-50 p-3 rounded">{suggestion.secondPartyNotes}</div></div>}
                    </CardContent></Card>
                    <Card className="md:col-span-2"><CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4">נקודות התאמה</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg"><h4 className="font-medium flex items-center gap-2"><GraduationCap className="text-green-600"/>רקע והשכלה</h4>{/*...*/}</div>
                            <div className="bg-blue-50 p-4 rounded-lg"><h4 className="font-medium flex items-center gap-2"><MapPin className="text-blue-600"/>מקום מגורים</h4>{/*...*/}</div>
                            <div className="bg-purple-50 p-4 rounded-lg"><h4 className="font-medium flex items-center gap-2"><ScrollIcon className="text-purple-600"/>רקע דתי</h4>{/*...*/}</div>
                        </div>
                    </CardContent></Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="p-6">
                <SuggestionTimeline statusHistory={suggestion.statusHistory} />
              </TabsContent>
            </ScrollArea>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <div className="flex gap-2 w-full">
              {canApprove && <Button variant="default" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting} onClick={() => handleStatusChange(isFirstParty ? "FIRST_PARTY_APPROVED" : "SECOND_PARTY_APPROVED")}><CheckCircle className="w-4 h-4 ml-2" />אישור ההצעה</Button>}
              {canDecline && <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" disabled={isSubmitting} onClick={() => handleStatusChange(isFirstParty ? "FIRST_PARTY_DECLINED" : "SECOND_PARTY_DECLINED")}><XCircle className="w-4 h-4 ml-2" />דחיית ההצעה</Button>}
              <Button variant="outline" onClick={() => setShowAskDialog(true)} disabled={isSubmitting}><MessageCircle className="w-4 h-4 ml-2" />שאלה לשדכן</Button>
              <Button variant="ghost" className="mr-auto" onClick={onClose} disabled={isSubmitting}>סגירה</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={`${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`}
      />
    </>
  );
};

export default SuggestionDetailsModal;