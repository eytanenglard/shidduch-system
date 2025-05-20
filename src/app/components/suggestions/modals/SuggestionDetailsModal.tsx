// Full path: src/app/components/suggestions/modals/SuggestionDetailsModal.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Scroll,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { ProfileCard } from "@/app/components/profile";
import SuggestionTimeline from "../timeline/SuggestionTimeline";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";
import type { MatchSuggestion } from "@prisma/client";
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from "@/types/next-auth";
import { cn } from "@/lib/utils";

interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName: string;
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
  questionnaire?: QuestionnaireResponse | null;
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    DRAFT: "טיוטה",
    PENDING_FIRST_PARTY: "ממתין לתשובת הצד הראשון",
    FIRST_PARTY_APPROVED: "הצד הראשון אישר",
    FIRST_PARTY_DECLINED: "הצד הראשון דחה",
    PENDING_SECOND_PARTY: "ממתין לתשובת הצד השני",
    SECOND_PARTY_APPROVED: "הצד השני אישר",
    SECOND_PARTY_DECLINED: "הצד השני דחה",
    CONTACT_DETAILS_SHARED: "פרטי קשר שותפו",
    AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה ראשונה",
    THINKING_AFTER_DATE: "בחשיבה לאחר הפגישה",
    PROCEEDING_TO_SECOND_DATE: "התקדמות לפגישה שנייה",
    ENDED_AFTER_FIRST_DATE: "הסתיים לאחר פגישה ראשונה",
    DATING: "בתהליך היכרות",
    ENGAGED: "אירוסין",
    MARRIED: "נישואין",
    CANCELLED: "בוטל",
    CLOSED: "נסגר",
    EXPIRED: "פג תוקף",
  };

  return statusMap[status] || status;
};

const getPriorityLabel = (
  priority: string
): { label: string; color: string } => {
  switch (priority) {
    case "LOW":
      return { label: "נמוכה", color: "bg-gray-100 text-gray-800" };
    case "MEDIUM":
      return { label: "בינונית", color: "bg-blue-100 text-blue-800" };
    case "HIGH":
      return { label: "גבוהה", color: "bg-yellow-100 text-yellow-800" };
    case "URGENT":
      return { label: "דחופה", color: "bg-red-100 text-red-800" };
    default:
      return { label: "בינונית", color: "bg-blue-100 text-blue-800" };
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
  questionnaire,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("profile");
    }
  }, [isOpen]);

  if (!suggestion) return null;

  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;
  const targetPartyAge = targetParty.profile?.birthDate
    ? calculateAge(new Date(targetParty.profile.birthDate))
    : null;

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

      const response = await fetch(
        `/api/suggestions/${suggestion.id}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

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
              <Badge className={cn("text-xs py-1", priorityInfo.color)}>
                {priorityInfo.label}
              </Badge>
              <DialogTitle className="text-xl">
                הצעת שידוך עם {targetParty.firstName} {targetParty.lastName}
                {targetPartyAge && (
                  <span className="text-sm font-normal mr-2">
                    ({targetPartyAge})
                  </span>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="border-b px-6">
                <TabsList className="mt-2">
                  <TabsTrigger
                    value="profile"
                    className="flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    פרופיל
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    פרטי ההצעה
                  </TabsTrigger>
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    היסטוריה
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <TabsContent value="profile" className="flex-1 p-6">
                  <ProfileCard
                    profile={{
                      ...targetParty.profile,
                      user: {
                        firstName: targetParty.firstName,
                        lastName: targetParty.lastName,
                        email: targetParty.email,
                      },
                    }}
                    images={targetParty.images}
                    questionnaire={questionnaire}
                    viewMode="candidate"
                  />
                </TabsContent>

                <TabsContent value="details" className="flex-1 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4 text-right">
                          פרטי ההצעה
                        </h3>
                        <div className="space-y-4 text-right">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">סטטוס</p>
                            <Badge className="text-sm">
                              {getStatusLabel(suggestion.status)}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 mb-1">שדכן</p>
                            <div className="flex items-center justify-end gap-2">
                              <p>
                                {suggestion.matchmaker.firstName}{" "}
                                {suggestion.matchmaker.lastName}
                              </p>
                              <Briefcase className="w-4 h-4" />
                            </div>
                          </div>

                          {suggestion.decisionDeadline && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">
                                תאריך יעד להחלטה
                              </p>
                              <div className="flex items-center justify-end gap-2">
                                <p>
                                  {format(
                                    new Date(suggestion.decisionDeadline),
                                    "dd/MM/yyyy",
                                    { locale: he }
                                  )}
                                </p>
                                <Calendar className="w-4 h-4" />
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              תאריך יצירה
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              <p>
                                {format(
                                  new Date(suggestion.createdAt),
                                  "dd/MM/yyyy",
                                  { locale: he }
                                )}
                              </p>
                              <Calendar className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4 text-right">
                          סיבות להצעה
                        </h3>
                        {suggestion.matchingReason ? (
                          <p className="text-right whitespace-pre-line">
                            {suggestion.matchingReason}
                          </p>
                        ) : (
                          <p className="text-right text-gray-500">
                            לא צוינו סיבות מיוחדות
                          </p>
                        )}

                        {isFirstParty && suggestion.firstPartyNotes && (
                          <div className="mt-4">
                            <h4 className="font-medium text-sm text-right mb-2">
                              הערות עבורך:
                            </h4>
                            <div className="bg-blue-50 p-3 rounded text-right">
                              {suggestion.firstPartyNotes}
                            </div>
                          </div>
                        )}

                        {!isFirstParty && suggestion.secondPartyNotes && (
                          <div className="mt-4">
                            <h4 className="font-medium text-sm text-right mb-2">
                              הערות עבורך:
                            </h4>
                            <div className="bg-blue-50 p-3 rounded text-right">
                              {suggestion.secondPartyNotes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-4 text-right">
                          נקודות התאמה
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <h4 className="font-medium">רקע והשכלה</h4>
                              <GraduationCap className="w-5 h-5 text-green-600" />
                            </div>
                            <ul className="text-right text-sm space-y-2">
                              {targetParty.profile.education && (
                                <li className="flex items-center justify-end gap-2">
                                  <span>{targetParty.profile.education}</span>
                                </li>
                              )}
                              {targetParty.profile.occupation && (
                                <li className="flex items-center justify-end gap-2">
                                  <span>{targetParty.profile.occupation}</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <h4 className="font-medium">מקום מגורים</h4>
                              <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <ul className="text-right text-sm space-y-2">
                              {targetParty.profile.city && (
                                <li className="flex items-center justify-end gap-2">
                                  <span>{targetParty.profile.city}</span>
                                </li>
                              )}
                             
                            </ul>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <h4 className="font-medium">רקע דתי</h4>
                              <Scroll className="w-5 h-5 text-purple-600" />
                            </div>
                            <ul className="text-right text-sm space-y-2">
                              {targetParty.profile.religiousLevel && (
                                <li className="flex items-center justify-end gap-2">
                                  <span>
                                    {targetParty.profile.religiousLevel}
                                  </span>
                                </li>
                              )}
                              {targetParty.profile.origin && (
                                <li className="flex items-center justify-end gap-2">
                                  <span>
                                    מוצא: {targetParty.profile.origin}
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="flex-1 p-6">
                  <SuggestionTimeline
                    statusHistory={suggestion.statusHistory}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <div className="flex gap-2 w-full">
              {canApprove && (
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleStatusChange(
                      isFirstParty
                        ? "FIRST_PARTY_APPROVED"
                        : "SECOND_PARTY_APPROVED"
                    )
                  }
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  אישור ההצעה
                </Button>
              )}

              {canDecline && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleStatusChange(
                      isFirstParty
                        ? "FIRST_PARTY_DECLINED"
                        : "SECOND_PARTY_DECLINED"
                    )
                  }
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  דחיית ההצעה
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowAskDialog(true)}
                disabled={isSubmitting}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                שאלה לשדכן
              </Button>

              <Button
                variant="ghost"
                className="mr-auto"
                onClick={onClose}
                disabled={isSubmitting}
              >
                סגירה
              </Button>
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
