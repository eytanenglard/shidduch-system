// EditSuggestionForm.tsx - גרסה מתוקנת ומעודכנת

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import { DatePicker } from '@/components/ui/date-picker';
import type { Suggestion } from '@/types/suggestions';
import {
  RefreshCw,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Heart,
  Save,
  X,
  Star,
  Flame,
  Target,
  Shield,
  Crown,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  const [selectedStatus, setSelectedStatus] =
    useState<MatchSuggestionStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [matchingReason, setMatchingReason] = useState('');
  const [firstPartyNotes, setFirstPartyNotes] = useState('');
  const [secondPartyNotes, setSecondPartyNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [decisionDeadline, setDecisionDeadline] = useState<Date | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  // עדכון הטופס כאשר נתוני ההצעה משתנים
  useEffect(() => {
    if (suggestion) {
      console.log('Loading suggestion data:', suggestion);

      setPriority(suggestion.priority as Priority);
      setMatchingReason(suggestion.matchingReason || '');
      setFirstPartyNotes(suggestion.firstPartyNotes || '');
      setSecondPartyNotes(suggestion.secondPartyNotes || '');
      setInternalNotes(suggestion.internalNotes || '');

      setSelectedStatus(null);
      setStatusNotes('');
      setShowStatusChange(false);

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
      DRAFT: 'טיוטה',
      PENDING_FIRST_PARTY: "ממתין לתשובת צד א'",
      FIRST_PARTY_APPROVED: "צד א' אישר",
      FIRST_PARTY_DECLINED: "צד א' דחה",
      PENDING_SECOND_PARTY: "ממתין לתשובת צד ב'",
      SECOND_PARTY_APPROVED: "צד ב' אישר",
      SECOND_PARTY_DECLINED: "צד ב' דחה",
      AWAITING_MATCHMAKER_APPROVAL: 'ממתין לאישור שדכן',
      CONTACT_DETAILS_SHARED: 'פרטי קשר שותפו',
      AWAITING_FIRST_DATE_FEEDBACK: 'ממתין למשוב פגישה ראשונה',
      THINKING_AFTER_DATE: 'בשלב מחשבה אחרי פגישה',
      PROCEEDING_TO_SECOND_DATE: 'ממשיכים לפגישה שנייה',
      ENDED_AFTER_FIRST_DATE: 'הסתיים אחרי פגישה ראשונה',
      MEETING_PENDING: 'ממתין לקביעת פגישה',
      MEETING_SCHEDULED: 'פגישה נקבעה',
      MATCH_APPROVED: 'ההצעה אושרה',
      MATCH_DECLINED: 'ההצעה נדחתה',
      DATING: 'בתהליך היכרות',
      ENGAGED: 'מאורסים',
      MARRIED: 'נישאו',
      EXPIRED: 'פג תוקף',
      CLOSED: 'ההצעה נסגרה',
      CANCELLED: 'ההצעה בוטלה',
    };

    return statusLabels[statusValue] || statusValue;
  };

  // הסטטוסים הזמינים לשינוי
  const getAvailableStatuses = (): MatchSuggestionStatus[] => {
    if (!suggestion) return [];

    const allStatuses: MatchSuggestionStatus[] = [
      'DRAFT',
      'PENDING_FIRST_PARTY',
      'FIRST_PARTY_APPROVED',
      'FIRST_PARTY_DECLINED',
      'PENDING_SECOND_PARTY',
      'SECOND_PARTY_APPROVED',
      'SECOND_PARTY_DECLINED',
      'AWAITING_MATCHMAKER_APPROVAL',
      'CONTACT_DETAILS_SHARED',
      'AWAITING_FIRST_DATE_FEEDBACK',
      'THINKING_AFTER_DATE',
      'PROCEEDING_TO_SECOND_DATE',
      'ENDED_AFTER_FIRST_DATE',
      'MEETING_PENDING',
      'MEETING_SCHEDULED',
      'MATCH_APPROVED',
      'MATCH_DECLINED',
      'DATING',
      'ENGAGED',
      'MARRIED',
      'EXPIRED',
      'CLOSED',
      'CANCELLED',
    ];

    return allStatuses;
  };

  // הגשת הטופס
  const handleSubmit = async () => {
    if (!suggestion) {
      toast.error('לא נמצאו נתוני הצעה');
      return;
    }

    setIsSubmitting(true);

    try {
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

      if (selectedStatus && selectedStatus !== suggestion.status) {
        updateData.status = selectedStatus;
        updateData.statusNotes =
          statusNotes ||
          `סטטוס שונה מ-${getStatusLabel(suggestion.status)} ל-${getStatusLabel(selectedStatus)}`;
      }

      console.log('Submitting update data:', updateData);

      await onSave({
        suggestionId: suggestion.id,
        updates: updateData,
      });

      toast.success('פרטי ההצעה עודכנו בהצלחה');
      onClose();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error('שגיאה בעדכון פרטי ההצעה');
    } finally {
      setIsSubmitting(false);
    }
  };

  // פונקציות עזר לעיצוב
  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case Priority.URGENT:
        return {
          label: 'דחוף',
          color: 'from-red-500 to-pink-500',
          icon: Flame,
          textColor: 'text-red-600',
        };
      case Priority.HIGH:
        return {
          label: 'גבוהה',
          color: 'from-orange-500 to-amber-500',
          icon: Star,
          textColor: 'text-orange-600',
        };
      case Priority.MEDIUM:
        return {
          label: 'רגילה',
          color: 'from-blue-500 to-cyan-500',
          icon: Target,
          textColor: 'text-blue-600',
        };
      case Priority.LOW:
        return {
          label: 'נמוכה',
          color: 'from-gray-500 to-slate-500',
          icon: Shield,
          textColor: 'text-gray-600',
        };
      default:
        return {
          label: 'רגילה',
          color: 'from-blue-500 to-cyan-500',
          icon: Target,
          textColor: 'text-blue-600',
        };
    }
  };

  const getStatusInfo = (status: MatchSuggestionStatus) => {
    switch (status) {
      case 'PENDING_FIRST_PARTY':
      case 'PENDING_SECOND_PARTY':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'from-yellow-50 to-amber-50',
        };
      case 'FIRST_PARTY_APPROVED':
      case 'SECOND_PARTY_APPROVED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'from-green-50 to-emerald-50',
        };
      case 'DATING':
        return {
          icon: Heart,
          color: 'text-pink-600',
          bg: 'from-pink-50 to-rose-50',
        };
      case 'ENGAGED':
        return {
          icon: Crown,
          color: 'text-yellow-600',
          bg: 'from-yellow-50 to-orange-50',
        };
      case 'MARRIED':
        return {
          icon: Sparkles,
          color: 'text-purple-600',
          bg: 'from-purple-50 to-pink-50',
        };
      default:
        return {
          icon: RefreshCw,
          color: 'text-gray-600',
          bg: 'from-gray-50 to-slate-50',
        };
    }
  };

  if (!suggestion) return null;

  const currentPriorityInfo = getPriorityInfo(priority);
  const currentStatusInfo = getStatusInfo(suggestion.status);
  const CurrentStatusIcon = currentStatusInfo.icon;
  const CurrentPriorityIcon = currentPriorityInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl rounded-3xl p-0"
        dir="rtl"
      >
        {/* Hero Header */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br',
            currentStatusInfo.bg,
            'border-b border-gray-100'
          )}
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          </div>

          <div className="relative z-10 p-8">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                    <CurrentStatusIcon
                      className={cn('w-8 h-8', currentStatusInfo.color)}
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-gray-800">
                      עריכת הצעת שידוך #{suggestion.id.slice(-8)}
                    </DialogTitle>
                    <DialogDescription className="text-lg text-gray-600 mt-1">
                      עריכת הפרטים עבור ההצעה בין{' '}
                      {suggestion.firstParty.firstName}{' '}
                      {suggestion.firstParty.lastName} ל
                      {suggestion.secondParty.firstName}{' '}
                      {suggestion.secondParty.lastName}
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full h-12 w-12 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  className={cn(
                    'px-4 py-2 font-bold shadow-lg bg-gradient-to-r text-white',
                    currentPriorityInfo.color
                  )}
                >
                  <CurrentPriorityIcon className="w-4 h-4 ml-2" />
                  עדיפות: {currentPriorityInfo.label}
                </Badge>

                <Badge className="px-4 py-2 bg-white/20 backdrop-blur-sm text-gray-700 border border-white/30">
                  סטטוס נוכחי: {getStatusLabel(suggestion.status)}
                </Badge>
              </div>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* מידע נוכחי על ההצעה */}
          <Alert className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            <AlertDescription className="text-blue-800 font-medium">
              <strong>מידע נוכחי:</strong> ההצעה נוצרה עבור{' '}
              {suggestion.firstParty.firstName} {suggestion.firstParty.lastName}{' '}
              ו{suggestion.secondParty.firstName}{' '}
              {suggestion.secondParty.lastName}.
              <br />
              <strong>סטטוס:</strong> {getStatusLabel(suggestion.status)} •{' '}
              <strong>עדיפות:</strong> {currentPriorityInfo.label}
            </AlertDescription>
          </Alert>

          {/* Status and Priority Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Priority */}
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      'p-2 rounded-full bg-gradient-to-r text-white shadow-lg',
                      currentPriorityInfo.color
                    )}
                  >
                    <Star className="w-5 h-5" />
                  </div>
                  <Label className="text-lg font-bold text-gray-800">
                    עדיפות ההצעה
                  </Label>
                </div>

                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as Priority)}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl transition-all">
                    <SelectValue placeholder="בחר/י עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((p) => {
                      const info = getPriorityInfo(p);
                      const Icon = info.icon;
                      return (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('w-4 h-4', info.textColor)} />
                            {info.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Change */}
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <Label className="text-lg font-bold text-gray-800">
                      שינוי סטטוס
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant={showStatusChange ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowStatusChange(!showStatusChange)}
                    className={cn(
                      'rounded-xl transition-all duration-300',
                      showStatusChange
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
                    )}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    {showStatusChange ? 'ביטול שינוי' : 'שנה סטטוס'}
                  </Button>
                </div>

                {showStatusChange && (
                  <div className="space-y-4 p-4 border-2 border-purple-100 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                    <Select
                      value={selectedStatus || ''}
                      onValueChange={(value) => {
                        if (value && value !== 'NO_CHANGE') {
                          setSelectedStatus(value as MatchSuggestionStatus);
                        } else {
                          setSelectedStatus(null);
                          setStatusNotes('');
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 border-2 border-purple-200 bg-white">
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
                        <Label className="text-sm font-medium text-purple-800">
                          הערות לשינוי הסטטוס
                        </Label>
                        <Textarea
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          placeholder="הערות אופציונליות לשינוי הסטטוס..."
                          className="mt-2 h-20 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decision Deadline */}
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <Label className="text-lg font-bold text-gray-800">
                מועד החלטה אחרון
              </Label>
            </div>
            <DatePicker
              value={{ from: decisionDeadline, to: undefined }}
              onChange={({ from }) => setDecisionDeadline(from)}
            />
          </div>

          {/* Matching Reason */}
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                <Heart className="w-5 h-5" />
              </div>
              <Label className="text-lg font-bold text-gray-800">
                סיבת ההתאמה
              </Label>
            </div>
            <Textarea
              value={matchingReason}
              onChange={(e) => setMatchingReason(e.target.value)}
              placeholder="פרט/י מדוע יש התאמה בין המועמדים..."
              className="h-32 border-2 border-gray-200 focus:border-emerald-400 rounded-xl transition-all resize-none"
            />
          </div>

          {/* Party-specific Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <Label className="text-lg font-bold text-gray-800">
                  הערות לצד א&apos; ({suggestion.firstParty.firstName})
                </Label>
              </div>
              <Textarea
                value={firstPartyNotes}
                onChange={(e) => setFirstPartyNotes(e.target.value)}
                placeholder="הערות שיוצגו רק לצד א'..."
                className="h-32 border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all resize-none"
              />
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <Label className="text-lg font-bold text-gray-800">
                  הערות לצד ב&apos; ({suggestion.secondParty.firstName})
                </Label>
              </div>
              <Textarea
                value={secondPartyNotes}
                onChange={(e) => setSecondPartyNotes(e.target.value)}
                placeholder="הערות שיוצגו רק לצד ב'..."
                className="h-32 border-2 border-gray-200 focus:border-purple-400 rounded-xl transition-all resize-none"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                <MessageCircle className="w-5 h-5" />
              </div>
              <Label className="text-lg font-bold text-gray-800">
                הערות פנימיות
              </Label>
            </div>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="הערות פנימיות לשימוש השדכנים בלבד..."
              className="h-32 border-2 border-gray-200 focus:border-amber-400 rounded-xl transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex justify-between w-full items-center">
            <span className="text-sm text-gray-500 font-medium">
              כל השינויים יישמרו לאחר לחיצה על &quot;שמור שינויים&quot;
            </span>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-8 py-3 border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
              >
                ביטול
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSuggestionForm;
