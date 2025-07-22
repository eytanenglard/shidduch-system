// EditSuggestionForm.tsx - גרסה מתוקנת ומעודכנת

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
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  // State variables
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [selectedStatus, setSelectedStatus] = useState<MatchSuggestionStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [matchingReason, setMatchingReason] = useState("");
  const [firstPartyNotes, setFirstPartyNotes] = useState("");
  const [secondPartyNotes, setSecondPartyNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [decisionDeadline, setDecisionDeadline] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  // תיקון: עדכון הטופס כאשר נתוני ההצעה משתנים
  useEffect(() => {
    if (suggestion) {
      console.log("Loading suggestion data:", suggestion);
      
      // עדכון כל השדות עם הנתונים הקיימים בהצעה
      setPriority(suggestion.priority as Priority);
      setMatchingReason(suggestion.matchingReason || "");
      setFirstPartyNotes(suggestion.firstPartyNotes || "");
      setSecondPartyNotes(suggestion.secondPartyNotes || "");
      setInternalNotes(suggestion.internalNotes || "");

      // איפוס שדות סטטוס
      setSelectedStatus(null);
      setStatusNotes("");
      setShowStatusChange(false);

      // טיפול נכון בתאריך
      if (suggestion.decisionDeadline) {
        const deadlineDate = new Date(suggestion.decisionDeadline);
        if (!isNaN(deadlineDate.getTime())) {
          setDecisionDeadline(deadlineDate);
        }
      } else {
        setDecisionDeadline(undefined);
      }
    }
  }, [suggestion]);

  // פונקציה להחזרת התווית המתאימה לסטטוס
  const getStatusLabel = (statusValue: MatchSuggestionStatus): string => {
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
      CLOSED: "ההצעה נסגרה",
      CANCELLED: "ההצעה בוטלה",
    };

    return statusLabels[statusValue] || statusValue;
  };

  // תיקון: הסטטוסים הזמינים לשינוי
  const getAvailableStatuses = (): MatchSuggestionStatus[] => {
    if (!suggestion) return [];

    // כל הסטטוסים האפשריים במערכת
    const allStatuses: MatchSuggestionStatus[] = [
      "DRAFT",
      "PENDING_FIRST_PARTY",
      "FIRST_PARTY_APPROVED",
      "FIRST_PARTY_DECLINED",
      "PENDING_SECOND_PARTY",
      "SECOND_PARTY_APPROVED",
      "SECOND_PARTY_DECLINED",
      "AWAITING_MATCHMAKER_APPROVAL",
      "CONTACT_DETAILS_SHARED",
      "AWAITING_FIRST_DATE_FEEDBACK",
      "THINKING_AFTER_DATE",
      "PROCEEDING_TO_SECOND_DATE",
      "ENDED_AFTER_FIRST_DATE",
      "MEETING_PENDING",
      "MEETING_SCHEDULED",
      "MATCH_APPROVED",
      "MATCH_DECLINED",
      "DATING",
      "ENGAGED",
      "MARRIED",
      "EXPIRED",
      "CLOSED",
      "CANCELLED",
    ];

    return allStatuses;
  };

  // תיקון: הגשת הטופס
  const handleSubmit = async () => {
    if (!suggestion) {
      toast.error("לא נמצאו נתוני הצעה");
      return;
    }

    setIsSubmitting(true);

    try {
      // הכנת הנתונים לעדכון
      const updateData: {
        priority: Priority;
        status?: MatchSuggestionStatus;
        statusNotes?: string;
        matchingReason: string;
        firstPartyNotes: string;
        secondPartyNotes: string;
        internalNotes: string;
        decisionDeadline?: Date;
      } = {
        priority,
        matchingReason,
        firstPartyNotes,
        secondPartyNotes,
        internalNotes,
        decisionDeadline,
      };

      // הוספת סטטוס אם נבחר
      if (selectedStatus && selectedStatus !== suggestion.status) {
        updateData.status = selectedStatus;
        updateData.statusNotes = statusNotes || `סטטוס שונה מ-${getStatusLabel(suggestion.status)} ל-${getStatusLabel(selectedStatus)}`;
      }

      console.log("Submitting update data:", updateData);

      // שליחת העדכון
      await onSave({
        suggestionId: suggestion.id,
        updates: updateData,
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

  // אם אין נתוני הצעה, לא להציג את הדיאלוג
  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            עריכת הצעת שידוך #{suggestion.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            עריכת הפרטים עבור ההצעה בין {suggestion.firstParty.firstName}{" "}
            {suggestion.firstParty.lastName} ל{suggestion.secondParty.firstName}{" "}
            {suggestion.secondParty.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* תיקון: מידע נוכחי על ההצעה */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>סטטוס נוכחי:</strong> {getStatusLabel(suggestion.status as MatchSuggestionStatus)}
              <br />
              <strong>עדיפות נוכחית:</strong> {
                suggestion.priority === "URGENT" ? "דחוף" :
                suggestion.priority === "HIGH" ? "גבוהה" :
                suggestion.priority === "MEDIUM" ? "רגילה" : "נמוכה"
              }
            </AlertDescription>
          </Alert>

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

            {/* Status Change */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>שינוי סטטוס (אופציונלי)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusChange(!showStatusChange)}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  {showStatusChange ? "ביטול שינוי" : "שנה סטטוס"}
                </Button>
              </div>
              
              {showStatusChange && (
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <Select
                    value={selectedStatus || ""}
                    onValueChange={(value) => {
                      if (value && value !== "NO_CHANGE") {
                        setSelectedStatus(value as MatchSuggestionStatus);
                      } else {
                        setSelectedStatus(null);
                        setStatusNotes("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י סטטוס חדש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_CHANGE">ללא שינוי</SelectItem>
                      {getAvailableStatuses().map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedStatus && (
                    <div>
                      <Label className="text-sm">הערות לשינוי הסטטוס</Label>
                      <Textarea
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="הערות אופציונליות לשינוי הסטטוס..."
                        className="mt-1 h-20"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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