'use client';

import React, { useState } from 'react';
import {
  Loader2,
  Brain,
  Heart,
  Shield,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import type { AiPrepSectionProps } from './types';

// ===========================================================================
// AiPrepSection — displays AI preparation results inside saved cards
// ===========================================================================

export const PERSONALITY_TYPE_LABELS: Record<string, string> = {
  LEADER: 'מנהיג/ה',
  SUPPORTER: 'תומך/ת',
  ANALYTICAL: 'אנליטי/ת',
  CREATIVE: 'יצירתי/ת',
  CAREGIVER: 'מטפל/ת',
  ADVENTURER: 'הרפתקן/ית',
  HARMONIZER: 'מאזן/ת',
};

export const ATTACHMENT_STYLE_LABELS: Record<string, string> = {
  SECURE: 'בטוח/ה',
  ANXIOUS: 'חרד/ה',
  AVOIDANT: 'נמנע/ת',
  DISORGANIZED: 'לא מאורגן/ת',
};

export const LOVE_LANGUAGE_LABELS: Record<string, string> = {
  QUALITY_TIME: 'זמן איכות',
  WORDS_OF_AFFIRMATION: 'מילות אישור',
  PHYSICAL_TOUCH: 'מגע פיזי',
  ACTS_OF_SERVICE: 'מעשים',
  GIFTS: 'מתנות',
};

export const COMMUNICATION_STYLE_LABELS: Record<string, string> = {
  DIRECT: 'ישיר/ה',
  EMPATHETIC: 'אמפתי/ת',
  ANALYTICAL: 'אנליטי/ת',
  HUMOROUS: 'הומוריסטי/ת',
  EMOTIONAL: 'רגשי/ת',
};

export const HUMOR_STYLE_LABELS: Record<string, string> = {
  CYNICAL: 'ציני',
  LIGHT: 'קליל',
  WORDPLAY: 'משחקי מילים',
  SELF_DEPRECATING: 'הומור עצמי',
  PHYSICAL: 'פיזי',
  DRY: 'יבש',
};

const MetricBar: React.FC<{ label: string; value: number | null; max?: number }> = ({
  label,
  value,
  max = 100,
}) => {
  if (value === null || value === undefined) return null;
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 w-16 text-left truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 w-6 text-center">{value}</span>
    </div>
  );
};

const TagChip: React.FC<{ tag: string; color?: string }> = ({
  tag,
  color = 'bg-gray-100 text-gray-600',
}) => (
  <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full ${color} leading-tight`}>
    {tag.replace(/_/g, ' ')}
  </span>
);

export const AiPrepSection: React.FC<AiPrepSectionProps> = ({ status, result, error, onRetry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (status === 'preparing') {
    return (
      <div className="px-3 py-2.5 border-t border-purple-200 bg-gradient-to-l from-purple-50/80 to-indigo-50/50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
          <span className="text-xs text-purple-600 font-medium">
            מכין פרופיל AI מלא (מדדים, וקטורים, תגיות)...
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-purple-100 rounded-full overflow-hidden">
          <div className="h-full bg-purple-400 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="px-3 py-2 border-t border-red-200 bg-red-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>הכנת AI נכשלה{error ? `: ${error}` : ''}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] text-red-600 underline hover:text-red-700 font-medium"
            >
              נסה שוב
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status !== 'ready' || !result) return null;

  const m = result.metrics;
  const t = result.tags;

  return (
    <div className="border-t border-purple-200 bg-gradient-to-l from-purple-50/40 to-transparent">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-50/50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[11px] font-semibold text-purple-700">ניתוח AI מלא</span>
          {m?.confidenceScore && (
            <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
              ביטחון {m.confidenceScore}%
            </span>
          )}
          {result.metricsUpdated && (
            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded">
              מדדים ✓
            </span>
          )}
          {result.vectorsUpdated && (
            <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded">
              וקטורים ✓
            </span>
          )}
          {result.tagsGenerated && (
            <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded">
              תגיות ✓
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 max-h-[50vh] overflow-y-auto">
          {/* AI Summaries */}
          {(m?.aiPersonalitySummary || m?.aiSeekingSummary) && (
            <div className="space-y-2">
              {m.aiPersonalitySummary && (
                <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] font-semibold text-gray-600">סיכום אישיות</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed" dir="rtl">
                    {m.aiPersonalitySummary}
                  </p>
                </div>
              )}
              {m.aiSeekingSummary && (
                <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px] font-semibold text-gray-600">מה מחפש/ת</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed" dir="rtl">
                    {m.aiSeekingSummary}
                  </p>
                </div>
              )}
              {m.aiBackgroundSummary && (
                <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
                  <div className="flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-semibold text-gray-600">רקע</span>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed" dir="rtl">
                    {m.aiBackgroundSummary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matchmaker Guidelines */}
          {m?.aiMatchmakerGuidelines && (
            <div className="bg-amber-50/80 rounded-lg p-2 border border-amber-200">
              <span className="text-[10px] font-semibold text-amber-700 block mb-1">
                הנחיות לשדכן
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed" dir="rtl">
                {m.aiMatchmakerGuidelines}
              </p>
            </div>
          )}

          {/* Inferred Traits */}
          {(m?.inferredPersonalityType || m?.inferredAttachmentStyle || m?.inferredLoveLanguages) && (
            <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
              <span className="text-[10px] font-semibold text-gray-600 block mb-1.5">
                תכונות מזוהות
              </span>
              <div className="flex flex-wrap gap-1.5">
                {m.inferredPersonalityType && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {PERSONALITY_TYPE_LABELS[m.inferredPersonalityType] || m.inferredPersonalityType}
                  </span>
                )}
                {m.inferredAttachmentStyle && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                    {ATTACHMENT_STYLE_LABELS[m.inferredAttachmentStyle] || m.inferredAttachmentStyle}
                  </span>
                )}
                {m.communicationStyle && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {COMMUNICATION_STYLE_LABELS[m.communicationStyle] || m.communicationStyle}
                  </span>
                )}
                {m.humorStyle && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    הומור: {HUMOR_STYLE_LABELS[m.humorStyle] || m.humorStyle}
                  </span>
                )}
              </div>
              {m.inferredLoveLanguages && Array.isArray(m.inferredLoveLanguages) && m.inferredLoveLanguages.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="text-[9px] text-gray-400">שפות אהבה:</span>
                  {m.inferredLoveLanguages.map((lang: string, i: number) => (
                    <span
                      key={i}
                      className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full"
                    >
                      {LOVE_LANGUAGE_LABELS[lang] || lang}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Metrics */}
          {m && (
            <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
              <span className="text-[10px] font-semibold text-gray-600 block mb-1.5">
                מדדי אישיות
              </span>
              <div className="space-y-1">
                <MetricBar label="חברתיות" value={m.socialEnergy} />
                <MetricBar label="רגשיות" value={m.emotionalExpression} />
                <MetricBar label="יציבות" value={m.stabilityVsSpontaneity} />
                <MetricBar label="עצמאות" value={m.independenceLevel} />
                <MetricBar label="אופטימיות" value={m.optimismLevel} />
                <MetricBar label="שאפתנות" value={m.ambitionLevel} />
                <MetricBar label="קריירה" value={m.careerOrientation} />
                <MetricBar label="אינטלקט" value={m.intellectualOrientation} />
                <MetricBar label="רוחניות" value={m.spiritualDepth} />
                <MetricBar label="הרפתקנות" value={m.adventureScore} />
              </div>
            </div>
          )}

          {/* Soul Fingerprint Tags */}
          {t && (
            <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
              <span className="text-[10px] font-semibold text-gray-600 block mb-1.5">
                טביעת נשמה (תגיות AI)
              </span>
              <div className="space-y-1.5">
                {t.sectorTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">מגזר:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.sectorTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-teal-50 text-teal-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.personalityTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">אישיות:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.personalityTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-indigo-50 text-indigo-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.lifestyleTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">אורח חיים:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.lifestyleTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-emerald-50 text-emerald-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.careerTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">קריירה:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.careerTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-blue-50 text-blue-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.relationshipTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">יחסים:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.relationshipTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-rose-50 text-rose-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.familyVisionTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">חזון משפחתי:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.familyVisionTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-amber-50 text-amber-700" />
                      ))}
                    </div>
                  </div>
                )}
                {t.backgroundTags?.length > 0 && (
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-0.5">רקע:</span>
                    <div className="flex flex-wrap gap-1">
                      {t.backgroundTags.map((tag, i) => (
                        <TagChip key={i} tag={tag} color="bg-gray-100 text-gray-600" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deal Breakers & Must Haves */}
          {(m?.aiInferredDealBreakers?.length || m?.aiInferredMustHaves?.length) && (
            <div className="bg-white/80 rounded-lg p-2 border border-purple-100">
              {m.aiInferredMustHaves && m.aiInferredMustHaves.length > 0 && (
                <div className="mb-1.5">
                  <span className="text-[9px] text-emerald-600 font-semibold block mb-0.5">
                    חייב להיות:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.aiInferredMustHaves.map((item: string, i: number) => (
                      <span
                        key={i}
                        className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {m.aiInferredDealBreakers && m.aiInferredDealBreakers.length > 0 && (
                <div>
                  <span className="text-[9px] text-red-600 font-semibold block mb-0.5">
                    קווים אדומים:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.aiInferredDealBreakers.map((item: string, i: number) => (
                      <span
                        key={i}
                        className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Difficulty Flags */}
          {m?.difficultyFlags && Array.isArray(m.difficultyFlags) && m.difficultyFlags.length > 0 && (
            <div className="bg-orange-50/80 rounded-lg p-2 border border-orange-200">
              <span className="text-[9px] text-orange-700 font-semibold block mb-0.5">
                אתגרי התאמה:
              </span>
              <div className="flex flex-wrap gap-1">
                {m.difficultyFlags.map((flag: string, i: number) => (
                  <span
                    key={i}
                    className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
