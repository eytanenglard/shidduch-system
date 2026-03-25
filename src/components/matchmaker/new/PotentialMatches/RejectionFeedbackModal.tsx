// =============================================================================
// 📁 src/components/matchmaker/new/PotentialMatches/RejectionFeedbackModal.tsx
// =============================================================================
// 🎯 Rejection Feedback Modal V2.2 - NeshamaTech
//
// מודל מהיר לתיעוד סיבת דחייה - קטגוריות לפני טקסט חופשי
// =============================================================================

'use client';

import React, { useState, useCallback, memo } from 'react';
import { X, Check, ChevronDown, ArrowLeftRight } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type RejectionCategory =
  | 'AGE_GAP'
  | 'RELIGIOUS_GAP'
  | 'BACKGROUND_GAP'
  | 'EDUCATION_GAP'
  | 'GEOGRAPHIC_GAP'
  | 'KNOWS_PERSONALLY'
  | 'NOT_ATTRACTED'
  | 'NOT_INTERESTING'
  | 'NO_CONNECTION'
  | 'GUT_FEELING'
  | 'SOMETHING_OFF'
  | 'NOT_AVAILABLE_NOW'
  | 'IN_PROCESS_WITH_OTHER'
  | 'NEEDS_TIME'
  | 'EXTERNAL_PRESSURE'
  | 'INCONSISTENT_STORY'
  | 'PROBLEMATIC_BEHAVIOR'
  | 'UNREALISTIC_EXPECTATIONS'
  | 'CONCERNING_HISTORY'
  | 'OTHER';

interface PartyInfo {
  id: string; // User ID
  profileId: string; // Profile ID - זה מה שה-DB צריך!
  firstName: string;
  lastName: string;
  gender?: 'MALE' | 'FEMALE';
}

interface RejectionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionFeedbackData) => Promise<void>;

  // שני הצדדים
  partyA: PartyInfo;
  partyB: PartyInfo;

  // ברירת מחדל - מי דחה (A או B)
  defaultRejectingParty?: 'A' | 'B';

  suggestionId?: string;
  potentialMatchId?: string;
}

export interface RejectionFeedbackData {
  rejectedProfileId: string;
  rejectingProfileId: string;
  rejectedUserId: string;
  rejectingUserId: string;
  suggestionId?: string;
  potentialMatchId?: string;
  category: RejectionCategory;
  subcategory?: string;
  freeText?: string;
  wasExpected?: boolean;
}

// =============================================================================
// QUICK CATEGORIES - מסודר לפי שכיחות
// =============================================================================

const QUICK_CATEGORIES: {
  value: RejectionCategory;
  label: string;
  emoji: string;
}[] = [
  { value: 'NOT_ATTRACTED', label: 'לא מושך/ת', emoji: '💔' },
  { value: 'AGE_GAP', label: 'פער גיל', emoji: '📅' },
  { value: 'RELIGIOUS_GAP', label: 'פער דתי', emoji: '✡️' },
  { value: 'NO_CONNECTION', label: 'אין חיבור', emoji: '🔗' },
  { value: 'GEOGRAPHIC_GAP', label: 'מרחק גיאוגרפי', emoji: '📍' },
  { value: 'KNOWS_PERSONALLY', label: 'מכיר/ה אישית', emoji: '👋' },
  { value: 'IN_PROCESS_WITH_OTHER', label: 'בתהליך אחר', emoji: '⏳' },
  { value: 'GUT_FEELING', label: 'תחושת בטן', emoji: '🤔' },
  { value: 'BACKGROUND_GAP', label: 'פער רקע', emoji: '🏠' },
  { value: 'NOT_AVAILABLE_NOW', label: 'לא זמין/ה כרגע', emoji: '🚫' },
  { value: 'OTHER', label: 'סיבה אחרת', emoji: '📝' },
];

// =============================================================================
// COMPONENT
// =============================================================================

function RejectionFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  partyA,
  partyB,
  defaultRejectingParty = 'A',
  suggestionId,
  potentialMatchId,
}: RejectionFeedbackModalProps) {
  const [rejectingParty, setRejectingParty] = useState<'A' | 'B'>(
    defaultRejectingParty
  );
  const [selectedCategory, setSelectedCategory] =
    useState<RejectionCategory | null>(null);
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // חישוב מי דוחה ומי נדחה
  const rejectingUser = rejectingParty === 'A' ? partyA : partyB;
  const rejectedUser = rejectingParty === 'A' ? partyB : partyA;

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setSelectedCategory(null);
    setFreeText('');
    setShowAllCategories(false);
    setRejectingParty(defaultRejectingParty);
    onClose();
  }, [onClose, defaultRejectingParty]);

  // החלפת צדדים
  const handleSwapParties = useCallback(() => {
    setRejectingParty((prev) => (prev === 'A' ? 'B' : 'A'));
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!selectedCategory && !freeText.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        rejectedProfileId: rejectedUser.profileId,
        rejectingProfileId: rejectingUser.profileId,
        rejectedUserId: rejectedUser.id,
        rejectingUserId: rejectingUser.id,
        suggestionId,
        potentialMatchId,
        category: selectedCategory || 'OTHER',
        freeText: freeText.trim() || undefined,
      });

      handleClose();
    } catch (err) {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedCategory,
    freeText,
    rejectedUser,
    rejectingUser,
    suggestionId,
    potentialMatchId,
    onSubmit,
    handleClose,
  ]);

  if (!isOpen) return null;

  const visibleCategories = showAllCategories
    ? QUICK_CATEGORIES
    : QUICK_CATEGORIES.slice(0, 6);

  const canSubmit = selectedCategory || freeText.trim().length > 0;

  // תוויות לפי מגדר
  const getGenderVerb = (gender?: 'MALE' | 'FEMALE') => {
    if (gender === 'MALE') return 'אמר';
    if (gender === 'FEMALE') return 'אמרה';
    return 'אמר/ה';
  };

  const getAboutLabel = (rejectedGender?: 'MALE' | 'FEMALE') => {
    if (rejectedGender === 'MALE') return 'עליו';
    if (rejectedGender === 'FEMALE') return 'עליה';
    return 'עליו/ה';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 max-h-[calc(100vh-32px)] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              תיעוד סיבת דחייה
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
          {/* Party Selector - מי דחה את מי */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              מי דחה את מי?
            </label>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              {/* Rejecting party */}
              <div className="flex-1 p-3 rounded-lg text-center bg-red-50 border-2 border-red-200">
                <div className="text-2xl mb-1">
                  {rejectingUser.gender === 'MALE' ? '👨' : '👩'}
                </div>
                <div className="font-bold text-gray-800 text-sm truncate">
                  {rejectingUser.firstName}
                </div>
                <div className="text-xs text-red-600 font-medium">דחה/תה</div>
              </div>

              {/* Swap button */}
              <button
                onClick={handleSwapParties}
                className="p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95 border border-gray-200"
                title="החלף צדדים"
              >
                <ArrowLeftRight size={18} className="text-gray-600" />
              </button>

              {/* Rejected party */}
              <div className="flex-1 p-3 rounded-lg text-center bg-blue-50 border-2 border-blue-200">
                <div className="text-2xl mb-1">
                  {rejectedUser.gender === 'MALE' ? '👨' : '👩'}
                </div>
                <div className="font-bold text-gray-800 text-sm truncate">
                  {rejectedUser.firstName}
                </div>
                <div className="text-xs text-blue-600 font-medium">נדחה/תה</div>
              </div>
            </div>
          </div>

          {/* Quick Categories - ראשון! */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              סיבת הדחייה
            </label>

            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.value ? null : cat.value
                    )
                  }
                  className={`
                    px-3 py-2 rounded-full text-sm font-medium transition-all
                    ${
                      selectedCategory === cat.value
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                    }
                  `}
                >
                  <span className="ml-1">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {!showAllCategories && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <ChevronDown size={14} />
                עוד אפשרויות
              </button>
            )}
          </div>

          {/* Free Text - אחרי הקטגוריות */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-lg">💬</span>
              מה {rejectingUser.firstName} {getGenderVerb(rejectingUser.gender)}{' '}
              {getAboutLabel(rejectedUser.gender)}? (אופציונלי)
            </label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder={`"לא מרגיש לי מתאים כי..."\n"משהו בתמונות לא דיבר אליי..."`}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors active:scale-98"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Check size={18} />
                שמור ודחה
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default memo(RejectionFeedbackModal);

// =============================================================================
// HOOK FOR EASY USAGE
// =============================================================================

export function useRejectionFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<{
    partyA: PartyInfo;
    partyB: PartyInfo;
    defaultRejectingParty?: 'A' | 'B';
    suggestionId?: string;
    potentialMatchId?: string;
  } | null>(null);

  const open = useCallback((data: NonNullable<typeof context>) => {
    setContext(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setContext(null), 200);
  }, []);

  const submit = useCallback(async (data: RejectionFeedbackData) => {
    const response = await fetch('/api/matchmaker/rejection-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // שליחת Profile IDs - זה מה שה-DB צריך!
        rejectedUserId: data.rejectedProfileId,
        rejectingUserId: data.rejectingProfileId,
        suggestionId: data.suggestionId,
        potentialMatchId: data.potentialMatchId,
        category: data.category,
        freeText: data.freeText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save rejection feedback');
    }

    return response.json();
  }, []);

  return {
    isOpen,
    context,
    open,
    close,
    submit,
  };
}
