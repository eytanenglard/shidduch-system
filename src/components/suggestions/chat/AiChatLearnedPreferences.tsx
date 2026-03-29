// src/components/suggestions/chat/AiChatLearnedPreferences.tsx
// =============================================================================
// Shows what Neshama has learned about user preferences (transparent to user)
// User can view and delete learned traits
// =============================================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Brain, ThumbsUp, ThumbsDown, X, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LearnedTrait {
  trait: string;
  score: number;
}

interface LearnedPreferences {
  likedTraits: LearnedTrait[];
  avoidedTraits: LearnedTrait[];
  insights: string | null;
  summary: string | null;
  lastUpdated: string | null;
  totalFeedbacks: number;
}

// Trait label translations
const TRAIT_LABELS: Record<string, { he: string; en: string }> = {
  religious_match: { he: 'התאמה דתית', en: 'Religious match' },
  personality_match: { he: 'התאמת אישיות', en: 'Personality match' },
  age_appropriate: { he: 'התאמת גיל', en: 'Age appropriate' },
  shared_values: { he: 'ערכים משותפים', en: 'Shared values' },
  similar_background: { he: 'רקע דומה', en: 'Similar background' },
  attractive_profile: { he: 'פרופיל מושך', en: 'Attractive profile' },
  good_career: { he: 'קריירה טובה', en: 'Good career' },
  interesting_person: { he: 'אדם מעניין', en: 'Interesting person' },
  age_gap: { he: 'פער גילאים', en: 'Age gap' },
  religious_gap: { he: 'פער דתי', en: 'Religious gap' },
  geographic_gap: { he: 'מרחק גיאוגרפי', en: 'Geographic distance' },
  not_attracted: { he: 'לא נמשכתי', en: 'Not attracted' },
  no_connection: { he: 'אין חיבור', en: 'No connection' },
  background_gap: { he: 'פער רקע', en: 'Background gap' },
  education_gap: { he: 'פער השכלתי', en: 'Education gap' },
  gut_feeling: { he: 'תחושת בטן', en: 'Gut feeling' },
  NOT_ATTRACTED: { he: 'לא נמשכתי', en: 'Not attracted' },
  RELIGIOUS_GAP: { he: 'פער דתי', en: 'Religious gap' },
  AGE_GAP: { he: 'פער גילאים', en: 'Age gap' },
  GEOGRAPHIC_GAP: { he: 'מרחק גיאוגרפי', en: 'Geographic distance' },
  EDUCATION_GAP: { he: 'פער השכלתי', en: 'Education gap' },
  BAD_PHOTOS: { he: 'תמונות לא ברורות', en: 'Unclear photos' },
  GUT_FEELING: { he: 'תחושת בטן', en: 'Gut feeling' },
  OTHER: { he: 'אחר', en: 'Other' },
};

interface AiChatLearnedPreferencesProps {
  locale: 'he' | 'en';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AiChatLearnedPreferences({
  locale,
  open,
  onOpenChange,
}: AiChatLearnedPreferencesProps) {
  const isHebrew = locale === 'he';
  const [preferences, setPreferences] = useState<LearnedPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTrait, setDeletingTrait] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ai-chat/preferences');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchPreferences();
  }, [open, fetchPreferences]);

  const handleDeleteTrait = async (traitType: 'liked' | 'avoided', traitName: string) => {
    setDeletingTrait(traitName);
    try {
      const res = await fetch('/api/ai-chat/preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traitType, traitName }),
      });
      if (res.ok) {
        // Remove from local state
        setPreferences((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            likedTraits: traitType === 'liked' ? prev.likedTraits.filter((t) => t.trait !== traitName) : prev.likedTraits,
            avoidedTraits: traitType === 'avoided' ? prev.avoidedTraits.filter((t) => t.trait !== traitName) : prev.avoidedTraits,
          };
        });
      }
    } catch { /* non-critical */ }
    finally { setDeletingTrait(null); }
  };

  const getTraitLabel = (trait: string) => {
    const labels = TRAIT_LABELS[trait];
    if (labels) return isHebrew ? labels.he : labels.en;
    return trait;
  };

  const hasData = preferences && (
    preferences.likedTraits.length > 0
    || preferences.avoidedTraits.length > 0
    || preferences.insights
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isHebrew ? 'מה נשמה למדה עלייך' : 'What Neshama learned about you'}
              </h3>
              <p className="text-[10px] text-gray-500">
                {isHebrew ? 'העדפות שנלמדו מהשיחות והדחיות שלך' : 'Preferences learned from your chats and feedback'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            </div>
          ) : !hasData ? (
            <div className="text-center py-8">
              <Brain className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                {isHebrew
                  ? 'עדיין לא למדתי מספיק. ככל שנדבר יותר, אלמד מה חשוב לך.'
                  : "I haven't learned enough yet. The more we chat, the better I'll understand you."}
              </p>
            </div>
          ) : (
            <>
              {/* Liked traits */}
              {preferences!.likedTraits.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    <h4 className="text-xs font-semibold text-gray-700">
                      {isHebrew ? 'מה שחשוב לך' : 'What matters to you'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences!.likedTraits.map((t) => (
                      <span
                        key={t.trait}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {getTraitLabel(t.trait)}
                        {t.score > 1 && (
                          <span className="text-[9px] text-emerald-500">x{t.score}</span>
                        )}
                        <button
                          onClick={() => handleDeleteTrait('liked', t.trait)}
                          disabled={deletingTrait === t.trait}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-emerald-200"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Avoided traits */}
              {preferences!.avoidedTraits.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                    <h4 className="text-xs font-semibold text-gray-700">
                      {isHebrew ? 'מה פחות מתאים' : 'What matters less'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences!.avoidedTraits.map((t) => (
                      <span
                        key={t.trait}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        {getTraitLabel(t.trait)}
                        {t.score > 1 && (
                          <span className="text-[9px] text-rose-500">x{t.score}</span>
                        )}
                        <button
                          onClick={() => handleDeleteTrait('avoided', t.trait)}
                          disabled={deletingTrait === t.trait}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-rose-200"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Free-form insights */}
              {preferences!.insights && (
                <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                  <p className="text-xs text-violet-800 leading-relaxed">
                    {preferences!.insights}
                  </p>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                <span>
                  {preferences!.totalFeedbacks > 0 && (
                    isHebrew
                      ? `מבוסס על ${preferences!.totalFeedbacks} פידבקים`
                      : `Based on ${preferences!.totalFeedbacks} feedbacks`
                  )}
                </span>
                <button
                  onClick={fetchPreferences}
                  className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {isHebrew ? 'רענן' : 'Refresh'}
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {isHebrew
                  ? 'ההעדפות נלמדות אוטומטית מהשיחות והדחיות שלך. אם משהו לא מדויק — לחצ/י X כדי למחוק אותו.'
                  : 'Preferences are learned automatically from your chats and feedback. If something is inaccurate, click X to remove it.'}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
