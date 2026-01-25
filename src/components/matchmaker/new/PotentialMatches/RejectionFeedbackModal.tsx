// =============================================================================
// 📁 src/components/matchmaker/RejectionFeedbackModal.tsx
// =============================================================================
// 🎯 Rejection Feedback Modal V1.0 - NeshamaTech
// 
// מודל לתיעוד סיבת דחייה בצורה מובנית
// =============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  Clock,
  User,
  Flag,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

interface CategoryInfo {
  value: RejectionCategory;
  label: string;
  labelEn: string;
  group: 'objective' | 'subjective' | 'timing' | 'red_flag' | 'other';
  description: string;
}

interface RejectionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionFeedbackData) => Promise<void>;
  
  // Context
  rejectedUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejectingUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  suggestionId?: string;
  potentialMatchId?: string;
}

interface RejectionFeedbackData {
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
// CATEGORY DATA
// =============================================================================

const CATEGORY_GROUPS: Record<string, { title: string; icon: React.ReactNode; color: string }> = {
  objective: {
    title: "סיבות אובייקטיביות",
    icon: <User size={16} />,
    color: "blue",
  },
  subjective: {
    title: "סיבות סובייקטיביות",
    icon: <HelpCircle size={16} />,
    color: "purple",
  },
  timing: {
    title: "סיבות תזמון",
    icon: <Clock size={16} />,
    color: "orange",
  },
  red_flag: {
    title: "Red Flags",
    icon: <Flag size={16} />,
    color: "red",
  },
  other: {
    title: "אחר",
    icon: <HelpCircle size={16} />,
    color: "gray",
  },
};

const DEFAULT_CATEGORIES: CategoryInfo[] = [
  // Objective
  { value: 'AGE_GAP', label: 'פער גיל גדול מדי', labelEn: 'Age Gap', group: 'objective', description: '' },
  { value: 'RELIGIOUS_GAP', label: 'פער רמה דתית', labelEn: 'Religious Gap', group: 'objective', description: '' },
  { value: 'BACKGROUND_GAP', label: 'פער רקע/עדה', labelEn: 'Background Gap', group: 'objective', description: '' },
  { value: 'EDUCATION_GAP', label: 'פער השכלה/קריירה', labelEn: 'Education Gap', group: 'objective', description: '' },
  { value: 'GEOGRAPHIC_GAP', label: 'פער גיאוגרפי', labelEn: 'Geographic Gap', group: 'objective', description: '' },
  { value: 'KNOWS_PERSONALLY', label: 'מכיר/ה אישית', labelEn: 'Knows Personally', group: 'objective', description: '' },
  // Subjective
  { value: 'NOT_ATTRACTED', label: 'לא מושך/ת', labelEn: 'Not Attracted', group: 'subjective', description: '' },
  { value: 'NOT_INTERESTING', label: 'לא מעניין/ת', labelEn: 'Not Interesting', group: 'subjective', description: '' },
  { value: 'NO_CONNECTION', label: 'לא הרגשתי חיבור', labelEn: 'No Connection', group: 'subjective', description: '' },
  { value: 'GUT_FEELING', label: 'תחושת בטן שלילית', labelEn: 'Gut Feeling', group: 'subjective', description: '' },
  { value: 'SOMETHING_OFF', label: 'משהו לא הסתדר לי', labelEn: 'Something Off', group: 'subjective', description: '' },
  // Timing
  { value: 'NOT_AVAILABLE_NOW', label: 'לא זמין/ה כרגע', labelEn: 'Not Available Now', group: 'timing', description: '' },
  { value: 'IN_PROCESS_WITH_OTHER', label: 'בתהליך עם מישהו אחר', labelEn: 'In Process', group: 'timing', description: '' },
  { value: 'NEEDS_TIME', label: 'צריך/ה זמן לחשוב', labelEn: 'Needs Time', group: 'timing', description: '' },
  { value: 'EXTERNAL_PRESSURE', label: 'לחץ חיצוני', labelEn: 'External Pressure', group: 'timing', description: '' },
  // Red Flags
  { value: 'INCONSISTENT_STORY', label: 'חוסר עקביות בסיפור', labelEn: 'Inconsistent Story', group: 'red_flag', description: '' },
  { value: 'PROBLEMATIC_BEHAVIOR', label: 'התנהגות בעייתית', labelEn: 'Problematic Behavior', group: 'red_flag', description: '' },
  { value: 'UNREALISTIC_EXPECTATIONS', label: 'ציפיות לא ריאליסטיות', labelEn: 'Unrealistic Expectations', group: 'red_flag', description: '' },
  { value: 'CONCERNING_HISTORY', label: 'היסטוריה מדאיגה', labelEn: 'Concerning History', group: 'red_flag', description: '' },
  // Other
  { value: 'OTHER', label: 'סיבה אחרת', labelEn: 'Other', group: 'other', description: '' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function RejectionFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  rejectedUser,
  rejectingUser,
  suggestionId,
  potentialMatchId,
}: RejectionFeedbackModalProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<RejectionCategory | null>(null);
  const [freeText, setFreeText] = useState("");
  const [wasExpected, setWasExpected] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("objective");
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/matchmaker/rejection-feedback?action=categories");
        if (response.ok) {
          const data = await response.json();
          if (data.categories) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        // Use default categories
        console.warn("Could not fetch categories, using defaults");
      }
    }
    
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(null);
      setFreeText("");
      setWasExpected(null);
      setError(null);
      setExpandedGroup("objective");
    }
  }, [isOpen]);

  // Group categories
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, CategoryInfo[]>);

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedCategory) {
      setError("יש לבחור סיבת דחייה");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        rejectedUserId: rejectedUser.id,
        rejectingUserId: rejectingUser.id,
        suggestionId,
        potentialMatchId,
        category: selectedCategory,
        freeText: freeText.trim() || undefined,
        wasExpected: wasExpected ?? undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירת הפידבק");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle group
  const toggleGroup = (group: string) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-white rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">תיעוד סיבת דחייה</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Context */}
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{rejectingUser.firstName} {rejectingUser.lastName}</span>
                {" "}דחה את{" "}
                <span className="font-medium">{rejectedUser.firstName} {rejectedUser.lastName}</span>
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">סיבת הדחייה</label>
                
                {Object.entries(CATEGORY_GROUPS).map(([group, info]) => {
                  const groupCats = groupedCategories[group] || [];
                  if (groupCats.length === 0) return null;

                  const isExpanded = expandedGroup === group;
                  const colorClass = {
                    blue: "border-blue-200 bg-blue-50",
                    purple: "border-purple-200 bg-purple-50",
                    orange: "border-orange-200 bg-orange-50",
                    red: "border-red-200 bg-red-50",
                    gray: "border-gray-200 bg-gray-50",
                  }[info.color] || "border-gray-200 bg-gray-50";

                  return (
                    <div key={group} className={`rounded-lg border ${colorClass} overflow-hidden`}>
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between p-3 text-sm font-medium"
                      >
                        <span className="flex items-center gap-2">
                          {info.icon}
                          {info.title}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* Group Items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3 space-y-1"
                          >
                            {groupCats.map((cat) => (
                              <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm text-right transition-colors ${
                                  selectedCategory === cat.value
                                    ? "bg-primary text-white"
                                    : "bg-white hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                {selectedCategory === cat.value && <Check size={14} />}
                                <span className="flex-1">{cat.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Was Expected */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  האם הדחייה הייתה צפויה?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWasExpected(true)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      wasExpected === true
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    כן, צפיתי לזה
                  </button>
                  <button
                    onClick={() => setWasExpected(false)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      wasExpected === false
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    לא, הפתיע אותי
                  </button>
                </div>
              </div>

              {/* Free Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  פירוט נוסף (אופציונלי)
                </label>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="הוסף מידע נוסף שיעזור להבין את הדחייה..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory || submitting}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    שמור
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HOOK FOR EASY USAGE
// =============================================================================

export function useRejectionFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<{
    rejectedUser: { id: string; firstName: string; lastName: string };
    rejectingUser: { id: string; firstName: string; lastName: string };
    suggestionId?: string;
    potentialMatchId?: string;
  } | null>(null);

  const open = (data: NonNullable<typeof context>) => {
    setContext(data);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setContext(null);
  };

  const submit = async (data: RejectionFeedbackData) => {
    const response = await fetch("/api/matchmaker/rejection-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to save rejection feedback");
    }
  };

  return {
    isOpen,
    context,
    open,
    close,
    submit,
  };
}
