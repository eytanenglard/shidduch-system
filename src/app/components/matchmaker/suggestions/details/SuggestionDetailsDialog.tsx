// SuggestionDetailsDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileCard } from "@/app/components/shared/shared/profile";
import { Timeline } from "@/components/ui/timeline";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  RefreshCw,
  Edit,
  Calendar,
  Clock,
  Download,
  AlarmClock,
  Trash2,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  User,
  ExternalLink,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MatchSuggestionStatus, Priority } from "@prisma/client";
import type { Suggestion } from "@/types/suggestions";
import type { QuestionnaireResponse } from "@/types/next-auth";

interface SuggestionDetailsDialogProps {
  suggestion: Suggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}

// Map status to its display info
const getStatusInfo = (status: MatchSuggestionStatus) => {
  const statusMap: Record<string, { label: string; icon: any; color: string }> =
    {
      DRAFT: { label: "טיוטה", icon: Edit, color: "text-gray-600" },
      PENDING_FIRST_PARTY: {
        label: "ממתין לתשובת צד א׳",
        icon: Clock,
        color: "text-yellow-600",
      },
      FIRST_PARTY_APPROVED: {
        label: "צד א׳ אישר",
        icon: CheckCircle,
        color: "text-green-600",
      },
      FIRST_PARTY_DECLINED: {
        label: "צד א׳ דחה",
        icon: XCircle,
        color: "text-red-600",
      },
      PENDING_SECOND_PARTY: {
        label: "ממתין לתשובת צד ב׳",
        icon: Clock,
        color: "text-blue-600",
      },
      SECOND_PARTY_APPROVED: {
        label: "צד ב׳ אישר",
        icon: CheckCircle,
        color: "text-green-600",
      },
      SECOND_PARTY_DECLINED: {
        label: "צד ב׳ דחה",
        icon: XCircle,
        color: "text-red-600",
      },
      AWAITING_MATCHMAKER_APPROVAL: {
        label: "ממתין לאישור שדכן",
        icon: AlertCircle,
        color: "text-purple-600",
      },
      CONTACT_DETAILS_SHARED: {
        label: "פרטי קשר שותפו",
        icon: Send,
        color: "text-purple-600",
      },
      AWAITING_FIRST_DATE_FEEDBACK: {
        label: "ממתין למשוב פגישה",
        icon: MessageCircle,
        color: "text-orange-600",
      },
      DATING: {
        label: "בתהליך היכרות",
        icon: Calendar,
        color: "text-pink-600",
      },
      EXPIRED: { label: "פג תוקף", icon: AlarmClock, color: "text-gray-600" },
      CLOSED: { label: "סגור", icon: XCircle, color: "text-gray-600" },
    };

  return (
    statusMap[status] || {
      label: status,
      icon: AlertCircle,
      color: "text-gray-600",
    }
  );
};

// Status groups for the progress indicator
const statusGroups = [
  ["DRAFT", "PENDING_FIRST_PARTY"],
  ["FIRST_PARTY_APPROVED", "PENDING_SECOND_PARTY"],
  ["SECOND_PARTY_APPROVED", "AWAITING_MATCHMAKER_APPROVAL"],
  ["CONTACT_DETAILS_SHARED", "AWAITING_FIRST_DATE_FEEDBACK"],
  ["DATING", "ENGAGED", "MARRIED"],
];
// הוספת מיפוי מלא של כל הסטטוסים האפשריים
const getAllStatusLabels = () => {
  // יצירת מיפוי של כל הסטטוסים האפשריים לפי הסכמה
  const statusLabels: Record<MatchSuggestionStatus, string> = {
    DRAFT: "טיוטה",
    PENDING_FIRST_PARTY: "ממתין לתשובת צד א׳",
    FIRST_PARTY_APPROVED: "צד א׳ אישר",
    FIRST_PARTY_DECLINED: "צד א׳ דחה",
    PENDING_SECOND_PARTY: "ממתין לתשובת צד ב׳",
    SECOND_PARTY_APPROVED: "צד ב׳ אישר",
    SECOND_PARTY_DECLINED: "צד ב׳ דחה",
    AWAITING_MATCHMAKER_APPROVAL: "ממתין לאישור שדכן",
    CONTACT_DETAILS_SHARED: "פרטי קשר שותפו",
    AWAITING_FIRST_DATE_FEEDBACK: "ממתין למשוב פגישה ראשונה",
    THINKING_AFTER_DATE: "בשלב מחשבה אחרי פגישה",
    PROCEEDING_TO_SECOND_DATE: "ממשיכים לפגישה שניה",
    ENDED_AFTER_FIRST_DATE: "הסתיים אחרי פגישה ראשונה",
    MEETING_PENDING: "ממתין לקביעת פגישה",
    MEETING_SCHEDULED: "פגישה נקבעה",
    MATCH_APPROVED: "ההצעה אושרה",
    MATCH_DECLINED: "ההצעה נדחתה",
    DATING: "בתהליך היכרות",
    ENGAGED: "מאורסים",
    MARRIED: "נישאו",
    EXPIRED: "פג תוקף",
    CLOSED: "סגור",
    CANCELLED: "בוטל",
  };

  return statusLabels;
};
// Helper to determine if a status change is possible
const canChangeStatus = (
  currentStatus: MatchSuggestionStatus
): MatchSuggestionStatus[] => {
  // Status changes that are allowed directly by the matchmaker
  const allowedChanges: Partial<
    Record<MatchSuggestionStatus, MatchSuggestionStatus[]>
  > = {
    // סטטוסים קיימים
    DRAFT: ["PENDING_FIRST_PARTY", "CANCELLED", "CLOSED"],
    PENDING_FIRST_PARTY: [
      "FIRST_PARTY_APPROVED",
      "FIRST_PARTY_DECLINED",
      "EXPIRED",
      "CANCELLED",
      "CLOSED",
    ],
    FIRST_PARTY_APPROVED: ["PENDING_SECOND_PARTY", "CANCELLED", "CLOSED"],
    FIRST_PARTY_DECLINED: ["PENDING_FIRST_PARTY", "CANCELLED", "CLOSED"],
    PENDING_SECOND_PARTY: [
      "SECOND_PARTY_APPROVED",
      "SECOND_PARTY_DECLINED",
      "EXPIRED",
      "CANCELLED",
      "CLOSED",
    ],
    SECOND_PARTY_APPROVED: ["CONTACT_DETAILS_SHARED", "CANCELLED", "CLOSED"],
    SECOND_PARTY_DECLINED: ["PENDING_SECOND_PARTY", "CANCELLED", "CLOSED"],
    CONTACT_DETAILS_SHARED: [
      "AWAITING_FIRST_DATE_FEEDBACK",
      "DATING",
      "CANCELLED",
      "CLOSED",
    ],
    AWAITING_FIRST_DATE_FEEDBACK: ["DATING", "CANCELLED", "CLOSED"],
    DATING: ["ENGAGED", "CLOSED"],
    ENGAGED: ["MARRIED", "CLOSED"],
    MARRIED: ["CLOSED"],
    EXPIRED: ["PENDING_FIRST_PARTY", "PENDING_SECOND_PARTY", "CLOSED"],
    CANCELLED: ["DRAFT"],
    CLOSED: [],

    // הוספת הסטטוסים החסרים
    AWAITING_MATCHMAKER_APPROVAL: [
      "CONTACT_DETAILS_SHARED",
      "CANCELLED",
      "CLOSED",
    ],
    THINKING_AFTER_DATE: [
      "PROCEEDING_TO_SECOND_DATE",
      "ENDED_AFTER_FIRST_DATE",
      "CLOSED",
    ],
    PROCEEDING_TO_SECOND_DATE: ["DATING", "CLOSED"],
    ENDED_AFTER_FIRST_DATE: ["CLOSED"],
    MEETING_PENDING: ["MEETING_SCHEDULED", "CANCELLED", "CLOSED"],
    MEETING_SCHEDULED: ["AWAITING_FIRST_DATE_FEEDBACK", "CANCELLED", "CLOSED"],
    MATCH_APPROVED: ["CONTACT_DETAILS_SHARED", "CANCELLED", "CLOSED"],
    MATCH_DECLINED: ["CLOSED"],
  };

  return allowedChanges[currentStatus] || [];
};

const formatDateSafely = (
  dateInput: Date | string | null | undefined
): string => {
  if (!dateInput) return "לא נקבע";

  // Ensure we're working with a Date object
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Validate that the date is valid before formatting
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "תאריך לא תקין";
  }

  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getDaysRemaining = (
  deadline: Date | string | null | undefined
): number | null => {
  if (!deadline) return null;

  // Convert string to Date if needed
  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;

  // Validate date
  if (!(deadlineDate instanceof Date) || isNaN(deadlineDate.getTime())) {
    return null;
  }

  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Get the status group index for progress indicator
const getStatusGroupIndex = (status: MatchSuggestionStatus): number => {
  for (let i = 0; i < statusGroups.length; i++) {
    if (statusGroups[i].includes(status)) {
      return i;
    }
  }
  return -1;
};

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire, setSecondPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [newStatus, setNewStatus] = useState<MatchSuggestionStatus | null>(
    null
  );
  const [showStatusChange, setShowStatusChange] = useState(false);

  // Calculate allowed status changes based on current status
  const allowedStatusChanges = suggestion
    ? canChangeStatus(suggestion.status as MatchSuggestionStatus)
    : [];

  useEffect(() => {
    const loadQuestionnaire = async (userId: string) => {
      try {
        const response = await fetch(
          `/api/profile/questionnaire?userId=${userId}`
        );
        const data = await response.json();

        if (data.success && data.questionnaireResponse) {
          return {
            ...data.questionnaireResponse,
            formattedAnswers: {
              values: data.questionnaireResponse.formattedAnswers.values || [],
              personality:
                data.questionnaireResponse.formattedAnswers.personality || [],
              relationship:
                data.questionnaireResponse.formattedAnswers.relationship || [],
              partner:
                data.questionnaireResponse.formattedAnswers.partner || [],
              religion:
                data.questionnaireResponse.formattedAnswers.religion || [],
            },
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to load questionnaire:", error);
        toast.error("שגיאה בטעינת השאלון");
        return null;
      }
    };

    const loadQuestionnaires = async () => {
      if (!suggestion) {
        setFirstPartyQuestionnaire(null);
        setSecondPartyQuestionnaire(null);
        return;
      }

      setIsLoading(true);
      try {
        const [firstParty, secondParty] = await Promise.all([
          loadQuestionnaire(suggestion.firstParty.id),
          loadQuestionnaire(suggestion.secondParty.id),
        ]);

        setFirstPartyQuestionnaire(firstParty);
        setSecondPartyQuestionnaire(secondParty);
      } catch (error) {
        console.error("Error loading questionnaires:", error);
        toast.error("שגיאה בטעינת השאלונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaires();
  }, [suggestion]);

  // Handle status change
  const handleStatusChange = async () => {
    if (!newStatus || !suggestion) return;

    setIsLoading(true);
    try {
      console.log(
        `שולח בקשה לשינוי סטטוס: ${newStatus} עם הערות: ${
          statusChangeNote || "ללא הערות"
        }`
      );

      // קריאה לנתיב ה-API הנכון עם הפרמטרים המתאימים
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestion.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            notes:
              statusChangeNote ||
              `סטטוס שונה ל-${getAllStatusLabels()[newStatus]}`,
          }),
        }
      );

      // בדיקת השגיאות בפורמט מפורט יותר
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server response:", errorData);
        throw new Error(
          errorData.error ||
            `Failed to update status: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("Status update response:", responseData);

      // עדכון הצליח - הקפצת הודעת הצלחה
      toast.success("סטטוס ההצעה עודכן בהצלחה");

      // עדכון הקומפוננטה ההורה
      onAction("changeStatus", {
        suggestionId: suggestion.id,
        newStatus,
        notes: statusChangeNote,
      });

      // איפוס מצב הטופס
      setShowStatusChange(false);
      setStatusChangeNote("");
      setNewStatus(null);
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(
        `שגיאה בעדכון הסטטוס: ${
          error instanceof Error ? error.message : "שגיאה לא מזוהה"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestion) return null;

  // Get status display info
  const statusInfo = getStatusInfo(suggestion.status as MatchSuggestionStatus);
  const StatusIcon = statusInfo.icon;

  // Format suggestion dates
  const createdDate = suggestion.createdAt;
  const lastActivityDate = suggestion.lastActivity;
  const decisionDeadlineDate = suggestion.decisionDeadline
    ? suggestion.decisionDeadline
    : null;

  // Days remaining for decision if applicable
  const daysRemaining = decisionDeadlineDate
    ? getDaysRemaining(decisionDeadlineDate)
    : null;

  // Get status progress index for the progress indicator
  const statusGroupIndex = getStatusGroupIndex(
    suggestion.status as MatchSuggestionStatus
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        {/* Header with Progress Bar */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-b flex-shrink-0">
          <DialogHeader className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  הצעת שידוך #{suggestion.id.toString().split("-")[0]}
                </DialogTitle>
                <DialogDescription className="text-lg mt-1">
                  {suggestion.firstParty.firstName}{" "}
                  {suggestion.firstParty.lastName} ו
                  {suggestion.secondParty.firstName}{" "}
                  {suggestion.secondParty.lastName}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`px-3 py-1.5 ${statusInfo.color} flex items-center gap-1 text-sm shadow-sm`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`px-3 shadow-sm ${
                    suggestion.priority === "URGENT"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : suggestion.priority === "HIGH"
                      ? "bg-orange-50 text-orange-600 border-orange-200"
                      : suggestion.priority === "MEDIUM"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {suggestion.priority === "URGENT"
                    ? "דחוף"
                    : suggestion.priority === "HIGH"
                    ? "עדיפות גבוהה"
                    : suggestion.priority === "MEDIUM"
                    ? "עדיפות רגילה"
                    : "עדיפות נמוכה"}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Status Progress Indicator */}
          <div className="px-6 pb-4">
            <div className="relative flex items-center justify-between w-full h-3 bg-gray-100 rounded-full mt-4">
              {statusGroupIndex >= 0 && (
                <div
                  className="absolute h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((statusGroupIndex + 1) / statusGroups.length) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              )}
              {statusGroups.map((_, index) => (
                <div
                  key={index}
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    index <= statusGroupIndex
                      ? "bg-blue-600 border-blue-700 text-white"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
              <span>יצירת הצעה</span>
              <span>אישור ראשוני</span>
              <span>אישור סופי</span>
              <span>שיתוף פרטים</span>
              <span>בתהליך היכרות</span>
            </div>
          </div>
        </div>
        {/* Main Content Area */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="px-6 pt-2 border-b justify-start gap-1 flex-shrink-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              סקירה כללית
            </TabsTrigger>
            <TabsTrigger
              value="firstParty"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              צד ראשון
            </TabsTrigger>
            <TabsTrigger
              value="secondParty"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              צד שני
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              ציר זמן
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              תקשורת
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-t-lg"
            >
              פעולות
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}

            <TabsContent
              value="overview"
              className="p-0 m-0 h-full overflow-auto"
            >
              <div className="p-6">
                {/* שינוי 1: שינוי המבנה כך שפרטי ההצעה יהיו בחלק העליון ושני הצדדים יהיו זה לצד זה */}
                <div className="space-y-3">
                  {/* פרטי הצעה - עיצוב מסודר וקומפקטי */}
                  <div className="bg-white rounded-xl shadow-sm border p-4 mb-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-semibold flex items-center">
                        <Calendar className="w-4 h-4 ml-1 text-blue-600" />
                        פרטי הצעה
                      </h3>
                      <Badge
                        className={`${statusInfo.color} px-2 py-0.5 text-xs`}
                      >
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">תאריך יצירה:</span>
                        <span className="font-medium mr-1">
                          {formatDateSafely(createdDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">עדכון אחרון:</span>
                        <span className="font-medium mr-1">
                          {formatDateSafely(lastActivityDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">שדכן:</span>
                        <span className="font-medium mr-1">
                          {`${suggestion.matchmaker?.firstName} ${suggestion.matchmaker?.lastName}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">דחיפות:</span>
                        <span
                          className={`font-medium mr-1 ${
                            suggestion.priority === "URGENT"
                              ? "text-red-600"
                              : suggestion.priority === "HIGH"
                              ? "text-orange-600"
                              : suggestion.priority === "MEDIUM"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        >
                          {suggestion.priority === "URGENT"
                            ? "דחוף"
                            : suggestion.priority === "HIGH"
                            ? "עדיפות גבוהה"
                            : suggestion.priority === "MEDIUM"
                            ? "עדיפות רגילה"
                            : "עדיפות נמוכה"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">מועד תגובה:</span>
                        <span className="font-medium mr-1">
                          {suggestion.responseDeadline
                            ? formatDateSafely(suggestion.responseDeadline)
                            : "לא נקבע"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">מועד להחלטה:</span>
                        <span
                          className={
                            daysRemaining !== null &&
                            daysRemaining < 3 &&
                            suggestion.status !== "EXPIRED"
                              ? "text-red-600 font-medium"
                              : "font-medium"
                          }
                        >
                          {decisionDeadlineDate
                            ? formatDateSafely(decisionDeadlineDate)
                            : "לא נקבע"}
                          {daysRemaining !== null &&
                            daysRemaining < 3 &&
                            suggestion.status !== "EXPIRED" && (
                              <span className="mr-1 text-red-600 text-xs">
                                (
                                {daysRemaining === 0
                                  ? "היום!"
                                  : `נותרו ${daysRemaining} ימים`}
                                )
                              </span>
                            )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatusChange(true)}
                        disabled={allowedStatusChanges.length === 0}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-1 h-7"
                      >
                        <RefreshCw className="w-3 h-3 ml-1" />
                        שנה סטטוס
                      </Button>
                    </div>
                  </div>

                  {/* שינוי 2: כרטיסי הצדדים מסודרים זה לצד זה בגריד עם 2 עמודות */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Party Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5 space-y-3 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold flex items-center text-blue-800">
                        <User className="w-5 h-5 ml-2 text-blue-600" />
                        צד א׳: {suggestion.firstParty.firstName}{" "}
                        {suggestion.firstParty.lastName}
                      </h3>

                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={
                            suggestion.firstParty.images.find(
                              (img) => img.isMain
                            )?.url || "/placeholders/user.png"
                          }
                          alt={`${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
                        />
                        <div>
                          <div className="font-medium">
                            {suggestion.firstParty.firstName}{" "}
                            {suggestion.firstParty.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 ml-1" />
                            {suggestion.firstParty.profile?.city || "לא צוין"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 divide-y">
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">קיבל את ההצעה:</span>
                          <span className="font-medium">
                            {suggestion.firstPartySent
                              ? formatDateSafely(suggestion.firstPartySent)
                              : "טרם נשלח"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">תגובה:</span>
                          <Badge
                            className={
                              suggestion.status === "FIRST_PARTY_APPROVED"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : suggestion.status === "FIRST_PARTY_DECLINED"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : suggestion.status === "PENDING_FIRST_PARTY"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {suggestion.status === "FIRST_PARTY_APPROVED"
                              ? "אישר"
                              : suggestion.status === "FIRST_PARTY_DECLINED"
                              ? "דחה"
                              : suggestion.status === "PENDING_FIRST_PARTY"
                              ? "ממתין לתשובה"
                              : "לא רלוונטי"}
                          </Badge>
                        </div>
                      </div>

                      {suggestion.firstPartyNotes && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-600 mb-1">
                            הערות:
                          </h4>
                          <div className="bg-blue-50 rounded-lg p-3 text-sm border border-blue-100">
                            {suggestion.firstPartyNotes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            onAction("contact", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.firstParty.id,
                              partyType: "first",
                            })
                          }
                        >
                          <MessageCircle className="w-4 h-4 ml-1" />
                          צור קשר
                        </Button>

                        {suggestion.status === "PENDING_FIRST_PARTY" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                            onClick={() =>
                              onAction("reminder", {
                                suggestionId: suggestion.id,
                                partyId: suggestion.firstParty.id,
                                partyType: "first",
                              })
                            }
                          >
                            <AlertCircle className="w-4 h-4 ml-2" />
                            שלח תזכורת
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Second Party Status Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-5 space-y-3 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold flex items-center text-purple-800">
                        <User className="w-5 h-5 ml-2 text-purple-600" />
                        צד ב׳: {suggestion.secondParty.firstName}{" "}
                        {suggestion.secondParty.lastName}
                      </h3>

                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={
                            suggestion.secondParty.images.find(
                              (img) => img.isMain
                            )?.url || "/placeholders/user.png"
                          }
                          alt={`${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`}
                          className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
                        />
                        <div>
                          <div className="font-medium">
                            {suggestion.secondParty.firstName}{" "}
                            {suggestion.secondParty.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 ml-1" />
                            {suggestion.secondParty.profile?.city || "לא צוין"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 divide-y">
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">קיבל את ההצעה:</span>
                          <span className="font-medium">
                            {suggestion.secondPartySent
                              ? formatDateSafely(suggestion.secondPartySent)
                              : "טרם נשלח"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">תגובה:</span>
                          <Badge
                            className={
                              suggestion.status === "SECOND_PARTY_APPROVED"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : suggestion.status === "SECOND_PARTY_DECLINED"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : suggestion.status === "PENDING_SECOND_PARTY"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {suggestion.status === "SECOND_PARTY_APPROVED"
                              ? "אישר"
                              : suggestion.status === "SECOND_PARTY_DECLINED"
                              ? "דחה"
                              : suggestion.status === "PENDING_SECOND_PARTY"
                              ? "ממתין לתשובה"
                              : "לא רלוונטי"}
                          </Badge>
                        </div>
                      </div>

                      {suggestion.secondPartyNotes && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-600 mb-1">
                            הערות:
                          </h4>
                          <div className="bg-purple-50 rounded-lg p-3 text-sm border border-purple-100">
                            {suggestion.secondPartyNotes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-purple-200 hover:bg-purple-50"
                          onClick={() =>
                            onAction("contact", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.secondParty.id,
                              partyType: "second",
                            })
                          }
                        >
                          <MessageCircle className="w-4 h-4 ml-1" />
                          צור קשר
                        </Button>

                        {suggestion.status === "PENDING_SECOND_PARTY" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            onClick={() =>
                              onAction("reminder", {
                                suggestionId: suggestion.id,
                                partyId: suggestion.secondParty.id,
                                partyType: "second",
                              })
                            }
                          >
                            <Send className="w-4 h-4 ml-1" />
                            שלח תזכורת
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* מידע נוסף */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {/* Matching Reason Card */}
                    {suggestion.matchingReason && (
                      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold flex items-center">
                          <User className="w-5 h-5 ml-2 text-green-600" />
                          סיבת ההתאמה
                        </h3>
                        <div className="bg-green-50 rounded-lg border border-green-100 p-4 text-gray-700">
                          {suggestion.matchingReason}
                        </div>
                      </div>
                    )}

                    {/* Internal Notes */}
                    {suggestion.internalNotes && (
                      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-semibold flex items-center">
                          <AlertCircle className="w-5 h-5 ml-2 text-amber-600" />
                          הערות פנימיות
                        </h3>
                        <div className="bg-amber-50 rounded-lg border border-amber-100 p-4 text-gray-700">
                          {suggestion.internalNotes}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold flex items-center">
                        <RefreshCw className="w-5 h-5 ml-2 text-gray-600" />
                        פעולות מהירות
                      </h3>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() =>
                            onAction("edit", { suggestionId: suggestion.id })
                          }
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          ערוך הצעה
                        </Button>

                        {(suggestion.status === "PENDING_FIRST_PARTY" ||
                          suggestion.status === "PENDING_SECOND_PARTY") && (
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() =>
                              onAction("sendReminder", {
                                suggestionId: suggestion.id,
                                type:
                                  suggestion.status === "PENDING_FIRST_PARTY"
                                    ? "first"
                                    : "second",
                              })
                            }
                          >
                            <Send className="w-4 h-4 ml-1" />
                            שלח תזכורת
                          </Button>
                        )}

                        {(suggestion.status === "FIRST_PARTY_APPROVED" ||
                          suggestion.status === "SECOND_PARTY_APPROVED") && (
                          <Button
                            variant="default"
                            className="justify-start bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              onAction("shareContacts", {
                                suggestionId: suggestion.id,
                              })
                            }
                          >
                            <ExternalLink className="w-4 h-4 ml-1" />
                            שתף פרטי קשר
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* First Party Tab */}
            <TabsContent value="firstParty" className="p-0 m-0 h-full">
              <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-blue-800">
                      {suggestion.firstParty.firstName}{" "}
                      {suggestion.firstParty.lastName}
                    </h3>
                    <Badge className="px-3 py-1.5 bg-blue-100 text-blue-700 border-blue-200">
                      צד א׳
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <img
                      src={
                        suggestion.firstParty.images.find((img) => img.isMain)
                          ?.url || "/placeholders/user.png"
                      }
                      alt={`${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                    />
                    <div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 ml-1 text-blue-500" />
                          <span>
                            {suggestion.firstParty.profile?.city || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 ml-1 text-blue-500" />
                          <span>
                            {suggestion.firstParty.email || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 ml-1 text-blue-500" />
                          <span>
                            {suggestion.firstParty?.phone || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1 text-blue-500" />
                          <span>
                            {suggestion.firstParty.profile?.birthDate
                              ? new Date(
                                  suggestion.firstParty.profile.birthDate
                                ).toLocaleDateString("he-IL")
                              : "לא צוין"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-blue-200 hover:bg-blue-50"
                      onClick={() =>
                        onAction("contact", {
                          suggestionId: suggestion.id,
                          partyId: suggestion.firstParty.id,
                          partyType: "first",
                        })
                      }
                    >
                      <MessageCircle className="w-4 h-4 ml-1" />
                      צור קשר
                    </Button>

                    {suggestion.status === "PENDING_FIRST_PARTY" && (
                      <Button
                        className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                        onClick={() =>
                          onAction("reminder", {
                            suggestionId: suggestion.id,
                            partyId: suggestion.firstParty.id,
                            partyType: "first",
                          })
                        }
                      >
                        <AlertCircle className="w-4 h-4 ml-2" />
                        שלח תזכורת לצד ראשון
                      </Button>
                    )}

                    {suggestion.status === "PENDING_SECOND_PARTY" && (
                      <Button
                        className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                        onClick={() =>
                          onAction("reminder", {
                            suggestionId: suggestion.id,
                            partyId: suggestion.secondParty.id,
                            partyType: "second",
                          })
                        }
                      >
                        <AlertCircle className="w-4 h-4 ml-2" />
                        שלח תזכורת לצד שני
                      </Button>
                    )}

                    {suggestion.status === "AWAITING_FIRST_DATE_FEEDBACK" && (
                      <Button
                        className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                        onClick={() =>
                          onAction("reminder", {
                            suggestionId: suggestion.id,
                            partyType: "both",
                          })
                        }
                      >
                        <AlertCircle className="w-4 h-4 ml-2" />
                        שלח בקשת עדכון מפגש
                      </Button>
                    )}
                  </div>
                </div>

                <ProfileCard
                  profile={suggestion.firstParty.profile}
                  images={suggestion.firstParty.images}
                  questionnaire={firstPartyQuestionnaire}
                  viewMode="matchmaker"
                />

                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-medium mb-2">
                    הערות לגבי {suggestion.firstParty.firstName}
                  </h3>
                  {suggestion.firstPartyNotes ? (
                    <p>{suggestion.firstPartyNotes}</p>
                  ) : (
                    <p className="text-gray-500">אין הערות ספציפיות</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Second Party Tab */}
            <TabsContent value="secondParty" className="p-0 m-0 h-full">
              <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-5 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-purple-800">
                      {suggestion.secondParty.firstName}{" "}
                      {suggestion.secondParty.lastName}
                    </h3>
                    <Badge className="px-3 py-1.5 bg-purple-100 text-purple-700 border-purple-200">
                      צד ב׳
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <img
                      src={
                        suggestion.secondParty.images.find((img) => img.isMain)
                          ?.url || "/placeholders/user.png"
                      }
                      alt={`${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                    />
                    <div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 ml-1 text-purple-500" />
                          <span>
                            {suggestion.secondParty.profile?.city || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 ml-1 text-purple-500" />
                          <span>
                            {suggestion.secondParty.email || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 ml-1 text-purple-500" />
                          <span>
                            {suggestion.secondParty.phone || "לא צוין"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1 text-purple-500" />
                          <span>
                            {suggestion.secondParty.profile?.birthDate
                              ? new Date(
                                  suggestion.secondParty.profile.birthDate
                                ).toLocaleDateString("he-IL")
                              : "לא צוין"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-200 hover:bg-purple-50"
                      onClick={() =>
                        onAction("contact", {
                          suggestionId: suggestion.id,
                          partyId: suggestion.secondParty.id,
                          partyType: "second",
                        })
                      }
                    >
                      <MessageCircle className="w-4 h-4 ml-1" />
                      צור קשר
                    </Button>

                    {suggestion.status === "PENDING_SECOND_PARTY" && (
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          onAction("reminder", {
                            suggestionId: suggestion.id,
                            partyId: suggestion.secondParty.id,
                            partyType: "second",
                          })
                        }
                      >
                        <Send className="w-4 h-4 ml-1" />
                        שלח תזכורת
                      </Button>
                    )}
                  </div>
                </div>

                <ProfileCard
                  profile={suggestion.secondParty.profile}
                  images={suggestion.secondParty.images}
                  questionnaire={secondPartyQuestionnaire}
                  viewMode="matchmaker"
                />

                <div className="mt-4 p-4 border rounded-lg bg-purple-50">
                  <h3 className="font-medium mb-2">
                    הערות לגבי {suggestion.secondParty.firstName}
                  </h3>
                  {suggestion.secondPartyNotes ? (
                    <p>{suggestion.secondPartyNotes}</p>
                  ) : (
                    <p className="text-gray-500">אין הערות ספציפיות</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-0 m-0 h-full">
              <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3 mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calendar className="w-5 h-5 ml-2 text-blue-600" />
                    התקדמות ההצעה
                  </h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-100 mr-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          נוצר: {formatDateSafely(suggestion.createdAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          פעילות אחרונה:{" "}
                          {formatDateSafely(suggestion.lastActivity)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`px-3 py-1.5 flex items-center gap-1 ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="text-lg font-semibold mb-4">
                    היסטוריית סטטוסים
                  </h3>

                  <ScrollArea className="h-[400px] pr-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      </div>
                    ) : (
                      <Timeline
                        items={(suggestion?.statusHistory || []).map(
                          (history) => ({
                            title: getStatusInfo(
                              history.status as MatchSuggestionStatus
                            ).label,
                            description: history.notes || "אין הערות",
                            date:
                              typeof history.createdAt === "string"
                                ? new Date(history.createdAt)
                                : history.createdAt,
                            icon: history.status.includes("APPROVED")
                              ? CheckCircle
                              : history.status.includes("DECLINED")
                              ? XCircle
                              : history.status.includes("PENDING")
                              ? Clock
                              : AlertCircle,
                            iconColor: history.status.includes("APPROVED")
                              ? "text-green-600"
                              : history.status.includes("DECLINED")
                              ? "text-red-600"
                              : history.status.includes("PENDING")
                              ? "text-yellow-600"
                              : "text-blue-600",
                          })
                        )}
                      />
                    )}
                  </ScrollArea>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onAction("exportHistory", {
                          suggestionId: suggestion.id,
                        })
                      }
                    >
                      <Download className="w-4 h-4 ml-1" />
                      ייצא היסטוריה
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Communication Tab */}
            <TabsContent value="communication" className="p-0 m-0 h-full">
              <div className="p-6">
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl shadow-sm border p-5 mb-6">
                  <h3 className="text-xl font-semibold mb-2">תקשורת</h3>
                  <p className="text-gray-600">
                    ניהול התקשורת עם הצדדים השונים בהצעה. שליחת הודעות ותזכורות.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Party Communication */}
                  <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                      <User className="w-5 h-5 ml-2 text-blue-600" />
                      תקשורת עם {suggestion.firstParty.firstName}{" "}
                      {suggestion.firstParty.lastName}
                    </h4>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-blue-200 hover:bg-blue-50"
                        onClick={() =>
                          onAction("message", {
                            suggestionId: suggestion.id,
                            partyId: suggestion.firstParty.id,
                            partyType: "first",
                            suggestion: suggestion, // הוסף את ההצעה המלאה
                          })
                        }
                      >
                        <MessageCircle className="w-4 h-4 ml-2" />
                        שלח הודעה
                      </Button>

                      {suggestion.status === "PENDING_FIRST_PARTY" && (
                        <Button
                          className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                          onClick={() =>
                            onAction("reminder", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.firstParty.id,
                              partyType: "first",
                            })
                          }
                        >
                          <AlertCircle className="w-4 h-4 ml-2" />
                          שלח תזכורת
                        </Button>
                      )}

                      {(suggestion.status === "FIRST_PARTY_APPROVED" ||
                        suggestion.status === "SECOND_PARTY_APPROVED") && (
                        <Button
                          variant="default"
                          className="w-full justify-start bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            onAction("shareContacts", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.firstParty.id,
                            })
                          }
                        >
                          <Send className="w-4 h-4 ml-2" />
                          שתף פרטי קשר
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Second Party Communication */}
                  <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-5 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold mb-4 text-purple-800 flex items-center">
                      <User className="w-5 h-5 ml-2 text-purple-600" />
                      תקשורת עם {suggestion.secondParty.firstName}{" "}
                      {suggestion.secondParty.lastName}
                    </h4>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          onAction("edit", {
                            suggestionId: suggestion.id,
                            suggestion: suggestion, // הוסף את ההצעה המלאה
                          })
                        }
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        ערוך פרטי הצעה
                      </Button>

                      {suggestion.status === "PENDING_SECOND_PARTY" && (
                        <Button
                          className="w-full justify-start bg-yellow-500 hover:bg-yellow-600"
                          onClick={() =>
                            onAction("reminder", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.secondParty.id,
                              partyType: "second",
                            })
                          }
                        >
                          <AlertCircle className="w-4 h-4 ml-2" />
                          שלח תזכורת
                        </Button>
                      )}

                      {(suggestion.status === "FIRST_PARTY_APPROVED" ||
                        suggestion.status === "SECOND_PARTY_APPROVED") && (
                        <Button
                          variant="default"
                          className="w-full justify-start bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            onAction("shareContacts", {
                              suggestionId: suggestion.id,
                              partyId: suggestion.secondParty.id,
                            })
                          }
                        >
                          <Send className="w-4 h-4 ml-2" />
                          שתף פרטי קשר
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meeting Arrangement Section */}
                {(suggestion.status === "CONTACT_DETAILS_SHARED" ||
                  suggestion.status === "DATING") && (
                  <div className="mt-6 bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      <Calendar className="w-5 h-5 ml-2 text-pink-600" />
                      תיאום פגישה
                    </h4>
                    <div className="space-y-3">
                      <p className="text-gray-600">
                        סיוע בתיאום פגישה בין הצדדים ותיעוד מועדי הפגישות
                      </p>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-pink-600 hover:bg-pink-700"
                          onClick={() =>
                            onAction("scheduleMeeting", {
                              suggestionId: suggestion.id,
                            })
                          }
                        >
                          <Calendar className="w-4 h-4 ml-2" />
                          תאם פגישה חדשה
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            onAction("viewMeetings", {
                              suggestionId: suggestion.id,
                            })
                          }
                        >
                          <Clock className="w-4 h-4 ml-2" />
                          צפה בפגישות קודמות
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="p-0 m-0 h-full">
              <div className="p-6">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-sm border p-5 mb-6">
                  <h3 className="text-xl font-semibold mb-2">פעולות נוספות</h3>
                  <p className="text-gray-600">
                    פעולות נוספות שניתן לבצע על הצעת השידוך
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Status Change */}
                  <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <div className="p-2 rounded-full bg-blue-100 w-fit mb-3">
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-3">שינוי סטטוס</h4>
                    <p className="text-sm text-gray-600 mb-4 h-12">
                      עדכון סטטוס ההצעה בהתאם להתקדמות התהליך
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setShowStatusChange(true)}
                      disabled={allowedStatusChanges.length === 0}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      שנה סטטוס
                    </Button>
                  </div>

                  {/* Edit Suggestion */}
                  <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <div className="p-2 rounded-full bg-amber-100 w-fit mb-3">
                      <Edit className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-3">עריכת הצעה</h4>
                    <p className="text-sm text-gray-600 mb-4 h-12">
                      עריכת פרטי ההצעה, סיבת ההתאמה והערות
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        onAction("edit", { suggestionId: suggestion.id })
                      }
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      ערוך פרטי הצעה
                    </Button>
                  </div>

                  {/* Delete Suggestion */}
                  <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <div className="p-2 rounded-full bg-red-100 w-fit mb-3">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-3">מחיקת הצעה</h4>
                    <p className="text-sm text-gray-600 mb-4 h-12">
                      מחיקת ההצעה לצמיתות מהמערכת
                    </p>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() =>
                        onAction("delete", { suggestionId: suggestion.id })
                      }
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחק הצעה
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resend to Both Parties */}
                  {canChangeStatus(
                    suggestion.status as MatchSuggestionStatus
                  ).includes("PENDING_FIRST_PARTY") && (
                    <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                      <h4 className="text-lg font-semibold mb-3 flex items-center">
                        <Send className="w-5 h-5 ml-2 text-purple-600" />
                        שליחה מחדש
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        שליחת ההצעה מחדש לשני הצדדים
                      </p>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          onAction("resendToAll", {
                            suggestionId: suggestion.id,
                          })
                        }
                      >
                        <Send className="w-4 h-4 ml-2" />
                        שלח מחדש לשני הצדדים
                      </Button>
                    </div>
                  )}

                  {/* Export Suggestion Details */}
                  <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      <Download className="w-5 h-5 ml-2 text-green-600" />
                      ייצוא פרטי הצעה
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      ייצוא כל פרטי ההצעה בפורמט PDF או CSV
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-green-200 hover:bg-green-50 text-green-700"
                      onClick={() =>
                        onAction("export", { suggestionId: suggestion.id })
                      }
                    >
                      <Download className="w-4 h-4 ml-2" />
                      ייצא פרטי הצעה
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        {/* Status Change Dialog */}
        {showStatusChange && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 ml-2 text-blue-600" />
                שינוי סטטוס הצעה
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    סטטוס נוכחי
                  </label>
                  <div className="flex items-center p-2 bg-gray-50 rounded border">
                    <StatusIcon
                      className={`w-5 h-5 ml-2 ${statusInfo.color}`}
                    />
                    <span className="font-medium">{statusInfo.label}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    סטטוס חדש
                  </label>
                  <Select
                    value={newStatus || undefined}
                    onValueChange={(value) => {
                      console.log("Selected new status:", value);
                      setNewStatus(value as MatchSuggestionStatus);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר/י סטטוס חדש" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80 overflow-y-auto">
                      {/* מציג את כל הסטטוסים האפשריים במערכת */}
                      {Object.entries(getAllStatusLabels()).map(
                        ([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    הערות לשינוי סטטוס
                  </label>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder="הערות אופציונליות לשינוי הסטטוס..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStatusChange(false);
                      setNewStatus(null);
                      setStatusChangeNote("");
                    }}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 ml-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        מעדכן...
                      </>
                    ) : (
                      "שמור שינוי"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              className="border-red-200 hover:bg-red-50 text-red-600"
              onClick={() =>
                onAction("delete", { suggestionId: suggestion.id })
              }
            >
              <Trash2 className="w-4 h-4 ml-1" />
              מחק הצעה
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                סגור
              </Button>
              <Button
                // תיקון: המקום השלישי בו צריך לוודא שהפונקציה מופעלת נכון
                onClick={() => setShowStatusChange(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                עדכן סטטוס
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;
