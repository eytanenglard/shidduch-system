// קוד מתוקן ב-EditSuggestionForm.tsx עם פתרון לבעיית הטיפוסים

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Priority, MatchSuggestionStatus } from "@prisma/client";
import { DatePicker } from "@/components/ui/date-picker";
import type { Suggestion } from "@/types/suggestions";

interface EditSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onSave: (data: {
    suggestionId: string;
    updates: {
      priority?: Priority;
      status?: MatchSuggestionStatus;
      statusNotes?: string;
      matchingReason?: string;
      firstPartyNotes?: string;
      secondPartyNotes?: string;
      internalNotes?: string;
      decisionDeadline?: Date;
    };
  }) => Promise<void>;
}

const EditSuggestionForm: React.FC<EditSuggestionFormProps> = ({
  isOpen,
  onClose,
  suggestion,
  onSave,
}) => {
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  // נשתמש בסוג נפרד לתיעוד אם נבחר סטטוס חדש או לא
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  // נשתמש במשתנה נפרד שיחזיק את הסטטוס האמיתי שיישלח לשרת
  const [statusToUpdate, setStatusToUpdate] =
    useState<MatchSuggestionStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [matchingReason, setMatchingReason] = useState("");
  const [firstPartyNotes, setFirstPartyNotes] = useState("");
  const [secondPartyNotes, setSecondPartyNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [decisionDeadline, setDecisionDeadline] = useState<Date | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  // עדכון הטופס כאשר נתוני ההצעה משתנים
  useEffect(() => {
    if (suggestion) {
      // עדכון כל השדות עם הנתונים הקיימים בהצעה
      setPriority(suggestion.priority as Priority);
      setSelectedStatus(null);
      setStatusToUpdate(null);
      setStatusNotes("");
      setMatchingReason(suggestion.matchingReason || "");
      setFirstPartyNotes(suggestion.firstPartyNotes || "");
      setSecondPartyNotes(suggestion.secondPartyNotes || "");
      setInternalNotes(suggestion.internalNotes || "");

      // טיפול נכון בתאריך
      if (suggestion.decisionDeadline) {
        // וידוא שמדובר בתאריך תקין
        const deadlineDate = new Date(suggestion.decisionDeadline);
        if (!isNaN(deadlineDate.getTime())) {
          setDecisionDeadline(deadlineDate);
        }
      } else {
        setDecisionDeadline(undefined);
      }
    }
  }, [suggestion]);

  const handleSubmit = async () => {
    if (!suggestion) return;

    try {
      setIsSubmitting(true);

      // מבנה העדכון עם אפשרות לסטטוס
      const updateData: {
        priority: Priority;
        status?: MatchSuggestionStatus;
        statusNotes?: string;
        matchingReason: string;
        firstPartyNotes: string;
        secondPartyNotes: string;
        internalNotes: string;
        decisionDeadline: string | null;
      } = {
        priority,
        matchingReason,
        firstPartyNotes,
        secondPartyNotes,
        internalNotes,
        decisionDeadline: decisionDeadline
          ? decisionDeadline.toISOString()
          : null,
      };

      // הוספת סטטוס רק אם נבחר סטטוס חדש לעדכון
      if (statusToUpdate) {
        updateData.status = statusToUpdate;
        updateData.statusNotes =
          statusNotes || `סטטוס שונה ל-${getStatusLabel(statusToUpdate)}`;
      }

      // עדכון הקומפוננטה ההורה
      await onSave({
        suggestionId: suggestion.id,
        updates: {
          priority,
          status: statusToUpdate || undefined,
          statusNotes: statusToUpdate ? statusNotes : undefined,
          matchingReason,
          firstPartyNotes,
          secondPartyNotes,
          internalNotes,
          decisionDeadline,
        },
      });

      toast.success("פרטי ההצעה עודכנו בהצלחה");
      onClose();
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast.error("שגיאה בעדכון פרטי ההצעה");
    } finally {
      setIsSubmitting(false);
    }
  };

  // פונקציה להחזרת התווית המתאימה לסטטוס
  const getStatusLabel = (statusValue: string): string => {
    const statusLabels: Record<string, string> = {
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
      CLOSED: "ההצעה נסגרה",
      CANCELLED: "ההצעה בוטלה",
    };

    return statusLabels[statusValue] || statusValue;
  };

  // הסטטוסים שניתן לשנות אליהם - יכול להשתנות לפי הסטטוס הנוכחי
  const getAvailableStatuses = (): MatchSuggestionStatus[] => {
    if (!suggestion) return [];

    // סטטוסים מרכזיים שתמיד זמינים
    const commonStatuses: MatchSuggestionStatus[] = [
      "PENDING_FIRST_PARTY",
      "FIRST_PARTY_APPROVED",
      "FIRST_PARTY_DECLINED",
      "PENDING_SECOND_PARTY",
      "SECOND_PARTY_APPROVED",
      "SECOND_PARTY_DECLINED",
      "CONTACT_DETAILS_SHARED",
      "DATING",
      "EXPIRED",
      "CLOSED",
      "CANCELLED",
    ];

    return commonStatuses;
  };

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת הצעת שידוך</DialogTitle>
          <DialogDescription>
            עריכת הפרטים עבור ההצעה בין {suggestion.firstParty.firstName}{" "}
            {suggestion.firstParty.lastName} ל{suggestion.secondParty.firstName}{" "}
            {suggestion.secondParty.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status and Priority Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-2">
              <Label>עדיפות ההצעה</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר/י עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Priority.URGENT}>דחוף</SelectItem>
                  <SelectItem value={Priority.HIGH}>גבוהה</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>רגילה</SelectItem>
                  <SelectItem value={Priority.LOW}>נמוכה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>שינוי סטטוס (אופציונלי)</Label>
              <Select
                value={selectedStatus || undefined}
                onValueChange={(value) => {
                  setSelectedStatus(value);

                  // אם נבחר "ללא שינוי" או ערך ריק
                  if (value === "NO_CHANGE" || !value) {
                    setStatusToUpdate(null);
                    setShowStatusChange(false);
                  } else {
                    // אחרת, מעדכנים את הסטטוס שיישלח לשרת
                    setStatusToUpdate(value as MatchSuggestionStatus);
                    setShowStatusChange(true);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר/י סטטוס חדש (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {/* משתמשים בערך חוקי מהמערכת */}
                  <SelectItem value="NO_CHANGE">ללא שינוי</SelectItem>
                  {getAvailableStatuses().map((availableStatus) => (
                    <SelectItem key={availableStatus} value={availableStatus}>
                      {getStatusLabel(availableStatus)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Notes - מוצג רק אם נבחר סטטוס לעדכון */}
          {showStatusChange && statusToUpdate && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-md border">
              <Label>הערות לשינוי הסטטוס</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="הערות אופציונליות לשינוי הסטטוס..."
                className="h-20"
              />
              <div className="text-xs text-gray-500 mt-1">
                הערות אלו יוצגו בהיסטוריית השינויים של ההצעה
              </div>
            </div>
          )}

          {/* Decision Deadline */}
          <div className="space-y-2">
            <Label>מועד החלטה אחרון</Label>
            <DatePicker
              value={{ from: decisionDeadline, to: undefined }}
              onChange={({ from }) => setDecisionDeadline(from)}
            />
          </div>

          {/* Matching Reason */}
          <div className="space-y-2">
            <Label>סיבת ההתאמה</Label>
            <Textarea
              value={matchingReason}
              onChange={(e) => setMatchingReason(e.target.value)}
              placeholder="פרט/י מדוע יש התאמה בין המועמדים..."
              className="h-24"
            />
          </div>

          {/* Party-specific Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>הערות לצד א׳ ({suggestion.firstParty.firstName})</Label>
              <Textarea
                value={firstPartyNotes}
                onChange={(e) => setFirstPartyNotes(e.target.value)}
                placeholder="הערות שיוצגו רק לצד א׳..."
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>הערות לצד ב׳ ({suggestion.secondParty.firstName})</Label>
              <Textarea
                value={secondPartyNotes}
                onChange={(e) => setSecondPartyNotes(e.target.value)}
                placeholder="הערות שיוצגו רק לצד ב׳..."
                className="h-24"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label>הערות פנימיות</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="הערות פנימיות לשימוש השדכנים בלבד..."
              className="h-24"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "שומר..." : "שמור שינויים"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSuggestionForm;
