// src/components/matchmaker/dialogs/BulkSuggestionsDialog.tsx
// ─────────────────────────────────────────────────────────────
// דיאלוג להכנת הצעות מרוכזות: גבר אחד × N בנות
// ─────────────────────────────────────────────────────────────

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  X,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Users,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { addDays } from 'date-fns';
import { cn, getRelativeCloudinaryPath, getInitials, calculateAge } from '@/lib/utils';
import type { Candidate } from '../new/types/candidates';
import NewSuggestionForm from '../suggestions/NewSuggestionForm';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface BulkSuggestionItemData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  decisionDeadline: Date;
  firstPartyLanguage: 'he' | 'en';
  secondPartyLanguage: 'he' | 'en';
  notes?: {
    matchingReason?: string;
    forFirstParty?: string;
    forSecondParty?: string;
    internal?: string;
  };
}

interface BulkItem {
  secondParty: Candidate;          // הבת
  data: BulkSuggestionItemData;
  isEdited: boolean;
  isExcluded: boolean;
}

type SendStatus = 'idle' | 'sending' | 'done';
type ItemResult = 'success' | 'error' | 'blocked';

export interface BulkSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** הגבר – יהיה צד א' בכל ההצעות כברירת מחדל */
  firstPartyCandidate: Candidate;
  /** הבנות – כל אחת תקבל הצעה נפרדת */
  secondPartyCandidates: Candidate[];
  dict: MatchmakerPageDictionary;
  locale: string;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const createDefaultData = (): BulkSuggestionItemData => ({
  priority: 'MEDIUM',
  decisionDeadline: addDays(new Date(), 7),
  firstPartyLanguage: 'he',
  secondPartyLanguage: 'he',
});

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'נמוכה',
  MEDIUM: 'רגילה',
  HIGH: 'גבוהה',
  URGENT: 'דחופה',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-600 border-blue-200',
  HIGH: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  URGENT: 'bg-red-100 text-red-600 border-red-200',
};

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

const BulkSuggestionsDialog: React.FC<BulkSuggestionsDialogProps> = ({
  isOpen,
  onClose,
  firstPartyCandidate,
  secondPartyCandidates,
  dict,
  locale,
}) => {
  // ── State ──────────────────────────────────────────────────

  const [items, setItems] = useState<BulkItem[]>([]);
  const [editingSecondPartyId, setEditingSecondPartyId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [results, setResults] = useState<Record<string, ItemResult>>({});
  const [sendProgress, setSendProgress] = useState(0);

  // ── Reset when dialog opens with fresh candidates ──────────

  useEffect(() => {
    if (isOpen) {
      setItems(
        secondPartyCandidates.map((c) => ({
          secondParty: c,
          data: createDefaultData(),
          isEdited: false,
          isExcluded: false,
        }))
      );
      setSendStatus('idle');
      setResults({});
      setSendProgress(0);
      setEditingSecondPartyId(null);
    }
  }, [isOpen, secondPartyCandidates]);

  // ── Derived ────────────────────────────────────────────────

  const activeItems = items.filter((i) => !i.isExcluded);
  const editingItem = editingSecondPartyId
    ? items.find((i) => i.secondParty.id === editingSecondPartyId) ?? null
    : null;

  // ── Handlers ───────────────────────────────────────────────

  const handleExclude = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.secondParty.id === id ? { ...item, isExcluded: true } : item
      )
    );
  }, []);

  const handleReInclude = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.secondParty.id === id ? { ...item, isExcluded: false } : item
      )
    );
  }, []);

  /** נקרא מתוך NewSuggestionForm כשנמצאים ב-bulk mode */
  const handleDraftSave = useCallback(
    (secondPartyId: string, data: BulkSuggestionItemData) => {
      setItems((prev) =>
        prev.map((item) =>
          item.secondParty.id === secondPartyId
            ? { ...item, data, isEdited: true }
            : item
        )
      );
      setEditingSecondPartyId(null);
      toast.success('הנתונים נשמרו – ניתן לשנות עד השליחה');
    },
    []
  );

  /** שליחת כל ההצעות הפעילות ב-loop סדרתי */
  const handleSendAll = useCallback(async () => {
    if (activeItems.length === 0) {
      toast.error('אין הצעות לשליחה');
      return;
    }

    setSendStatus('sending');
    setSendProgress(0);
    const newResults: Record<string, ItemResult> = {};

    for (let i = 0; i < activeItems.length; i++) {
      const item = activeItems[i];

      try {
        const body = {
          firstPartyId: firstPartyCandidate.id,
          secondPartyId: item.secondParty.id,
          priority: item.data.priority,
          decisionDeadline: item.data.decisionDeadline,
          firstPartyLanguage: item.data.firstPartyLanguage,
          secondPartyLanguage: item.data.secondPartyLanguage,
          notes: item.data.notes ?? {},
        };

        const res = await fetch('/api/matchmaker/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          newResults[item.secondParty.id] = 'success';
        } else {
          const err = await res.json().catch(() => ({}));
          const msg: string = err?.error ?? '';
          // SuggestionService זורק הודעה עם "הצעה פעילה" כשיש חסימה
          newResults[item.secondParty.id] =
            msg.includes('הצעה פעילה') ? 'blocked' : 'error';
        }
      } catch {
        newResults[item.secondParty.id] = 'error';
      }

      setSendProgress(i + 1);
      setResults({ ...newResults });
    }

    setSendStatus('done');

    const successCount = Object.values(newResults).filter((r) => r === 'success').length;
    const blockedCount = Object.values(newResults).filter((r) => r === 'blocked').length;
    const errorCount   = Object.values(newResults).filter((r) => r === 'error').length;

    if (successCount > 0 && errorCount === 0 && blockedCount === 0) {
      toast.success(`${successCount} הצעות נשלחו בהצלחה! 💌`);
    } else if (successCount > 0) {
      const parts: string[] = [`${successCount} הצלחות`];
      if (blockedCount) parts.push(`${blockedCount} חסומות`);
      if (errorCount) parts.push(`${errorCount} שגיאות`);
      toast.warning(parts.join(' · '));
    } else {
      toast.error('שליחת ההצעות נכשלה. נסה שוב.');
    }
  }, [activeItems, firstPartyCandidate.id]);

  // ── Sub-renders ────────────────────────────────────────────

  const renderItemRow = (item: BulkItem) => {
    const age = calculateAge(new Date(item.secondParty.profile.birthDate));
    const mainImg = item.secondParty.images?.find((img) => img.isMain)?.url;
    const result = results[item.secondParty.id];

    return (
      <div
        key={item.secondParty.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
          item.isExcluded
            ? 'opacity-40 bg-gray-50 border-gray-200'
            : result === 'success'
            ? 'bg-green-50 border-green-200'
            : result === 'blocked'
            ? 'bg-amber-50 border-amber-200'
            : result === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200 hover:border-pink-200 hover:shadow-sm'
        )}
      >
        {/* Avatar */}
        <Avatar className="w-11 h-11 flex-shrink-0 border-2 border-white shadow-sm">
          {mainImg ? (
            <AvatarImage
              src={getRelativeCloudinaryPath(mainImg)}
              alt={item.secondParty.firstName}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-400 text-white text-sm font-bold">
              {getInitials(`${item.secondParty.firstName} ${item.secondParty.lastName}`)}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm truncate">
              {item.secondParty.firstName} {item.secondParty.lastName}
            </span>
            <span className="text-xs text-gray-400">
              {age},{' '}
              {item.secondParty.profile.city ?? ''}
            </span>
            {item.isEdited && !item.isExcluded && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-1.5 py-0">
                ✏️ נערכה
              </Badge>
            )}
          </div>

          {!item.isExcluded && !result && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge
                className={cn(
                  'text-xs px-2 py-0 font-medium',
                  PRIORITY_COLORS[item.data.priority]
                )}
              >
                {PRIORITY_LABELS[item.data.priority]}
              </Badge>
              <span className="text-xs text-gray-400">
                יעד: {item.data.decisionDeadline.toLocaleDateString('he-IL')}
              </span>
              {item.data.notes?.matchingReason && (
                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={item.data.notes.matchingReason}>
                  💬 {item.data.notes.matchingReason}
                </span>
              )}
            </div>
          )}

          {/* Result indicators */}
          {result === 'success' && (
            <span className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              נשלח בהצלחה
            </span>
          )}
          {result === 'blocked' && (
            <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3" />
              יש הצעה פעילה קיימת
            </span>
          )}
          {result === 'error' && (
            <span className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
              <XCircle className="w-3 h-3" />
              שגיאה בשליחה
            </span>
          )}
        </div>

        {/* Actions */}
        {sendStatus === 'idle' && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {!item.isExcluded ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                  onClick={() => setEditingSecondPartyId(item.secondParty.id)}
                  title="ערוך הצעה"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={() => handleExclude(item.secondParty.id)}
                  title="הסר מהרשימה"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-gray-500 hover:text-gray-700 h-8 px-2"
                onClick={() => handleReInclude(item.secondParty.id)}
              >
                <RotateCcw className="w-3 h-3 ml-1" />
                החזר
              </Button>
            )}
          </div>
        )}

        {/* Spinner while sending this item */}
        {sendStatus === 'sending' && !result && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
        )}
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────

  return (
    <>
      {/* ── Main bulk dialog ── */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
          dir="rtl"
        >
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg flex-shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  הכנת הצעות שידוך
                </DialogTitle>
                <DialogDescription className="mt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">
                      {firstPartyCandidate.firstName} {firstPartyCandidate.lastName}
                    </span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-pink-600 font-semibold">
                      {activeItems.length} מועמדות
                    </span>
                  </span>
                  <span className="text-gray-500 text-xs block mt-0.5">
                    הגבר ישמש כצד א׳ בכל ההצעות. ניתן לערוך כל הצעה לפני השליחה.
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Progress bar */}
            {sendStatus !== 'idle' && (
              <div className="mt-3">
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500"
                    style={{
                      width:
                        activeItems.length > 0
                          ? `${(sendProgress / activeItems.length) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {sendStatus === 'sending'
                    ? `שולח... ${sendProgress} מתוך ${activeItems.length}`
                    : `הסתיים – ${
                        Object.values(results).filter((r) => r === 'success').length
                      } נשלחו בהצלחה`}
                </p>
              </div>
            )}
          </DialogHeader>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users className="w-10 h-10 mb-2" />
                <p>אין מועמדות ברשימה</p>
              </div>
            ) : (
              items.map(renderItemRow)
            )}
          </div>

          {/* Summary row */}
          {items.length > 0 && sendStatus === 'idle' && (
            <div className="flex-shrink-0 px-6 py-2 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
              <span>✅ {activeItems.length} פעילות</span>
              {items.filter((i) => i.isExcluded).length > 0 && (
                <span>⛔ {items.filter((i) => i.isExcluded).length} הוצאו</span>
              )}
              {items.filter((i) => i.isEdited && !i.isExcluded).length > 0 && (
                <span>✏️ {items.filter((i) => i.isEdited && !i.isExcluded).length} נערכו</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            {sendStatus === 'done' ? (
              <div className="flex justify-center">
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 shadow-lg"
                >
                  סגור
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={sendStatus === 'sending'}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ביטול
                </Button>

                <Button
                  onClick={handleSendAll}
                  disabled={
                    sendStatus === 'sending' || activeItems.length === 0
                  }
                  className={cn(
                    'font-bold shadow-lg transition-all duration-300',
                    activeItems.length > 0
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {sendStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      שלח {activeItems.length} הצעות
                      <Sparkles className="w-4 h-4 mr-2 opacity-80" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NewSuggestionForm בmoad עריכה (נפתח מעל הדיאלוג הראשי) ── */}
      {editingItem && (
        <NewSuggestionForm
          isOpen={!!editingSecondPartyId}
          onClose={() => setEditingSecondPartyId(null)}
          allCandidates={[firstPartyCandidate, editingItem.secondParty]}
          prefilledFirstParty={firstPartyCandidate}
          prefilledSecondParty={editingItem.secondParty}
          isBulkMode
          onDraftSave={(data) =>
            handleDraftSave(editingItem.secondParty.id, data)
          }
          dict={dict}
          locale={locale}
        />
      )}
    </>
  );
};

export default BulkSuggestionsDialog;