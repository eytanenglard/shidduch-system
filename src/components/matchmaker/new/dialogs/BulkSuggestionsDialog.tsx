// src/components/matchmaker/dialogs/BulkSuggestionsDialog.tsx
// ─────────────────────────────────────────────────────────────
// דיאלוג להכנת הצעות מרוכזות: גבר אחד × N בנות
// 🆕 משופר: שליחה ברקע דרך BulkSuggestionsContext
// ─────────────────────────────────────────────────────────────

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import {
  cn,
  getRelativeCloudinaryPath,
  getInitials,
  calculateAge,
} from '@/lib/utils';
import type { Candidate } from '../types/candidates';
import NewSuggestionForm from '../../suggestions/NewSuggestionForm';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// 🆕 Import the background context
import {
  useBulkSuggestionsContext,
  type BulkSuggestionPayload,
} from '@/app/[locale]/contexts/BulkSuggestionsContext';

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
  secondParty: Candidate;
  data: BulkSuggestionItemData;
  isEdited: boolean;
  isExcluded: boolean;
}

export interface BulkSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  firstPartyCandidate: Candidate;
  secondPartyCandidates: Candidate[];
  existingSuggestions: Record<string, { status: string; createdAt: string }>;
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
// Item Row Component - Memoized for performance
// ═══════════════════════════════════════════════════════════════

const ItemRow = React.memo<{
  item: BulkItem;
  hasExistingSuggestion: boolean;
  onExclude: (id: string) => void;
  onReInclude: (id: string) => void;
  onEdit: (id: string) => void;
}>(({ item, hasExistingSuggestion, onExclude, onReInclude, onEdit }) => {
  const age = calculateAge(new Date(item.secondParty.profile.birthDate));
  const mainImg = item.secondParty.images?.find((img) => img.isMain)?.url;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        item.isExcluded
          ? 'opacity-40 bg-gray-50 border-gray-200'
          : hasExistingSuggestion
            ? 'bg-red-50/50 border-red-200 hover:border-red-300 hover:shadow-sm'
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
            {getInitials(
              `${item.secondParty.firstName} ${item.secondParty.lastName}`
            )}
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
            {age}, {item.secondParty.profile.city ?? ''}
          </span>
          {hasExistingSuggestion && !item.isExcluded && (
            <Badge className="bg-red-100 text-red-600 border-red-200 text-xs px-1.5 py-0 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              כבר הוצעו
            </Badge>
          )}
          {item.isEdited && !item.isExcluded && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-1.5 py-0">
              ✏️ נערכה
            </Badge>
          )}
        </div>

        {!item.isExcluded && (
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
              <span
                className="text-xs text-gray-400 truncate max-w-[120px]"
                title={item.data.notes.matchingReason}
              >
                💬 {item.data.notes.matchingReason}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!item.isExcluded ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
              onClick={() => onEdit(item.secondParty.id)}
              title="ערוך הצעה"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              onClick={() => onExclude(item.secondParty.id)}
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
            onClick={() => onReInclude(item.secondParty.id)}
          >
            <RotateCcw className="w-3 h-3 ml-1" />
            החזר
          </Button>
        )}
      </div>
    </div>
  );
});

ItemRow.displayName = 'ItemRow';

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

const BulkSuggestionsDialog: React.FC<BulkSuggestionsDialogProps> = ({
  isOpen,
  onClose,
  firstPartyCandidate,
  secondPartyCandidates,
  existingSuggestions,
  dict,
  locale,
}) => {
  // 🆕 Use background context
  const { startBulkSend, isSending: isBackgroundSending } =
    useBulkSuggestionsContext();

  // ── State ──────────────────────────────────────────────────
  const [items, setItems] = useState<BulkItem[]>([]);
  const [editingSecondPartyId, setEditingSecondPartyId] = useState<
    string | null
  >(null);

  // ── Reset when dialog opens ────────────────────────────────
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
      setEditingSecondPartyId(null);
    }
  }, [isOpen, secondPartyCandidates]);

  // ── Derived ────────────────────────────────────────────────
  const activeItems = useMemo(
    () => items.filter((i) => !i.isExcluded),
    [items]
  );

  const editingItem = useMemo(
    () =>
      editingSecondPartyId
        ? (items.find((i) => i.secondParty.id === editingSecondPartyId) ?? null)
        : null,
    [editingSecondPartyId, items]
  );

  const excludedCount = useMemo(
    () => items.filter((i) => i.isExcluded).length,
    [items]
  );

  const editedCount = useMemo(
    () => items.filter((i) => i.isEdited && !i.isExcluded).length,
    [items]
  );

  const existingSuggestionCount = useMemo(
    () => activeItems.filter((i) => !!existingSuggestions[i.secondParty.id]).length,
    [activeItems, existingSuggestions]
  );

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

  const handleEdit = useCallback((id: string) => {
    setEditingSecondPartyId(id);
  }, []);

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

  // 🆕 שליחה ברקע - סוגר את הדיאלוג מיד!
  const handleSendAll = useCallback(() => {
    if (activeItems.length === 0) {
      toast.error('אין הצעות לשליחה');
      return;
    }

    // הכנת ה-payloads
    const payloads: BulkSuggestionPayload[] = activeItems.map((item) => ({
      firstPartyId: firstPartyCandidate.id,
      secondPartyId: item.secondParty.id,
      secondPartyName: `${item.secondParty.firstName} ${item.secondParty.lastName}`,
      priority: item.data.priority,
      decisionDeadline: item.data.decisionDeadline,
      firstPartyLanguage: item.data.firstPartyLanguage,
      secondPartyLanguage: item.data.secondPartyLanguage,
      notes: item.data.notes as Record<string, string> | undefined,
    }));

    // שליחה ברקע דרך ה-Context
    startBulkSend(
      `${firstPartyCandidate.firstName} ${firstPartyCandidate.lastName}`,
      payloads
    );

    // 🔥 סוגר את הדיאלוג מיד! ההצעות ימשיכו להישלח ברקע
    toast.info(`${activeItems.length} הצעות נשלחות ברקע... ניתן להמשיך לעבוד`, {
      position: 'bottom-left',
      duration: 3000,
    });
    onClose();
  }, [activeItems, firstPartyCandidate, startBulkSend, onClose]);

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
                      {firstPartyCandidate.firstName}{' '}
                      {firstPartyCandidate.lastName}
                    </span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-pink-600 font-semibold">
                      {activeItems.length} מועמדות
                    </span>
                  </span>
                  <span className="text-gray-500 text-xs block mt-0.5">
                    הגבר ישמש כצד א׳ בכל ההצעות. ניתן לערוך כל הצעה לפני השליחה.
                    <br />
                    <span className="text-emerald-600 font-medium">
                      💡 לאחר לחיצה על &quot;שלח&quot;, ההצעות יישלחו ברקע וניתן
                      לסגור את החלון.
                    </span>
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Background sending indicator */}
            {isBackgroundSending && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>יש שליחה פעילה ברקע. המתן לסיומה.</span>
              </div>
            )}

            {/* ⚠️ Existing suggestions warning */}
            {existingSuggestionCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>{existingSuggestionCount}</strong> מועמדות כבר הוצעו בעבר.
                  הן מסומנות באדום ברשימה.
                </span>
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
              items.map((item) => (
                <ItemRow
                  key={item.secondParty.id}
                  item={item}
                  hasExistingSuggestion={!!existingSuggestions[item.secondParty.id]}
                  onExclude={handleExclude}
                  onReInclude={handleReInclude}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>

          {/* Summary row */}
          {items.length > 0 && (
            <div className="flex-shrink-0 px-6 py-2 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
              <span>✅ {activeItems.length} פעילות</span>
              {excludedCount > 0 && <span>⛔ {excludedCount} הוצאו</span>}
              {editedCount > 0 && <span>✏️ {editedCount} נערכו</span>}
              {existingSuggestionCount > 0 && <span>⚠️ {existingSuggestionCount} כבר הוצעו</span>}
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ביטול
              </Button>

              <Button
                onClick={handleSendAll}
                disabled={activeItems.length === 0 || isBackgroundSending}
                className={cn(
                  'font-bold shadow-lg transition-all duration-300',
                  activeItems.length > 0 && !isBackgroundSending
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4 ml-2" />
                שלח {activeItems.length} הצעות ברקע
                <Sparkles className="w-4 h-4 mr-2 opacity-80" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NewSuggestionForm in edit mode ── */}
      {editingItem && (
        <NewSuggestionForm
          isOpen={!!editingSecondPartyId}
          onClose={() => setEditingSecondPartyId(null)}
          candidates={[firstPartyCandidate, editingItem.secondParty]}
          prefilledFirstParty={firstPartyCandidate}
          prefilledSecondParty={editingItem.secondParty}
          isBulkMode
          onDraftSave={(data) =>
            handleDraftSave(editingItem.secondParty.id, data)
          }
          onSubmit={async () => {}}
          dict={dict}
          locale={locale}
        />
      )}
    </>
  );
};

export default BulkSuggestionsDialog;