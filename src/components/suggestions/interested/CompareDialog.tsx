// src/components/suggestions/interested/CompareDialog.tsx
// Side-by-side comparison of saved suggestions with AI analysis
// Features: skeleton loading, sessionStorage cache, 3+ suggestions, feedback loop

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Scale,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Users,
  MessageCircle,
  Share2,
  Send,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { AiComparisonResult } from '@/lib/services/aiService';

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  onActivate: (suggestion: ExtendedMatchSuggestion) => void;
}

const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

// ─── SessionStorage helpers ────────────────────────────────────
const CACHE_KEY_PREFIX = 'ai_comparison_';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCacheKey(idA: string, idB: string): string {
  return CACHE_KEY_PREFIX + [idA, idB].sort().join('_');
}

function getCachedResult(idA: string, idB: string): AiComparisonResult | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(idA, idB));
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(getCacheKey(idA, idB));
      return null;
    }
    return data as AiComparisonResult;
  } catch {
    return null;
  }
}

function setCachedResult(idA: string, idB: string, data: AiComparisonResult): void {
  try {
    sessionStorage.setItem(
      getCacheKey(idA, idB),
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

// ─── Texts ─────────────────────────────────────────────────────
const TEXTS = {
  he: {
    title: 'השוואת הצעות',
    selectFirst: 'בחר/י הצעה ראשונה',
    selectSecond: 'בחר/י הצעה שנייה',
    age: 'גיל',
    city: 'עיר',
    occupation: 'תעסוקה',
    education: 'השכלה',
    religiousLevel: 'רמה דתית',
    matchReason: 'למה מתאים',
    activate: 'אשר/י',
    vs: 'VS',
    noData: 'לא צוין',
    chooseSuggestion: 'בחר/י',
    aiCompare: 'השווה עם AI',
    aiComparing: 'מנתח...',
    aiError: 'שגיאה בניתוח. נסה/י שוב.',
    aiSummary: 'סיכום השוואה',
    worldComparison: 'השוואה לפי עולמות',
    strengths: 'יתרונות ייחודיים',
    considerations: 'נקודות למחשבה',
    recommendation: 'המלצת AI',
    decisionQuestions: 'שאלות שיעזרו להחליט',
    high: 'גבוה',
    medium: 'בינוני',
    low: 'נמוך',
    comparingN: (n: number) => `משווה ${n} הצעות`,
    selectToCompare: 'בחר/י שתי הצעות להשוואה',
    quickCompare: 'השוואה מהירה',
    match: 'תואם',
    noMatch: 'לא תואם',
    askMatchmaker: 'שאל/י את השדכן/ית',
    askMatchmakerSent: 'ההודעה נשלחה לשדכן/ית!',
    shareComparison: 'שתף/י השוואה',
    shareCopied: 'ההשוואה הועתקה ללוח!',
    whatIf: 'מה אם...?',
    whatIfTitle: 'שאלות אינטראקטיביות',
    whatIfLoading: 'מעדכן המלצה...',
    whatIfChoose: 'בחר/י את מה שחשוב לך יותר:',
  },
  en: {
    title: 'Compare Suggestions',
    selectFirst: 'Select first suggestion',
    selectSecond: 'Select second suggestion',
    age: 'Age',
    city: 'City',
    occupation: 'Occupation',
    education: 'Education',
    religiousLevel: 'Religious Level',
    matchReason: 'Why it matches',
    activate: 'Approve',
    vs: 'VS',
    noData: 'Not specified',
    chooseSuggestion: 'Choose',
    aiCompare: 'Compare with AI',
    aiComparing: 'Analyzing...',
    aiError: 'Analysis failed. Please try again.',
    aiSummary: 'Comparison Summary',
    worldComparison: 'World Comparison',
    strengths: 'Unique Strengths',
    considerations: 'Points to Consider',
    recommendation: 'AI Recommendation',
    decisionQuestions: 'Questions to Help Decide',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    comparingN: (n: number) => `Comparing ${n} suggestions`,
    selectToCompare: 'Select two suggestions to compare',
    quickCompare: 'Quick Compare',
    match: 'Match',
    noMatch: 'Mismatch',
    askMatchmaker: 'Ask the Matchmaker',
    askMatchmakerSent: 'Message sent to your matchmaker!',
    shareComparison: 'Share Comparison',
    shareCopied: 'Comparison copied to clipboard!',
    whatIf: 'What if...?',
    whatIfTitle: 'Interactive Questions',
    whatIfLoading: 'Updating recommendation...',
    whatIfChoose: 'Choose what matters more to you:',
  },
};

const WORLD_ICONS: Record<string, React.ReactNode> = {
  'דת ורוחניות': <BookOpen className="w-4 h-4" />,
  'Religion & Spirituality': <BookOpen className="w-4 h-4" />,
  'אישיות וסגנון חיים': <User className="w-4 h-4" />,
  'Personality & Lifestyle': <User className="w-4 h-4" />,
  'ערכים ומשפחה': <Users className="w-4 h-4" />,
  'Values & Family': <Users className="w-4 h-4" />,
  'זוגיות ותקשורת': <MessageCircle className="w-4 h-4" />,
  'Partnership & Communication': <MessageCircle className="w-4 h-4" />,
};

const CHEMISTRY_CONFIG = {
  high: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  low: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

// ─── Chemistry Badge ───────────────────────────────────────────
const ChemistryBadge: React.FC<{
  level: 'high' | 'medium' | 'low';
  label: string;
}> = ({ level, label }) => {
  const config = CHEMISTRY_CONFIG[level];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', config.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {label}
    </span>
  );
};

// ─── Score Ring ────────────────────────────────────────────────
const ScoreRing: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score, size = 'md' }) => {
  const radius = size === 'md' ? 28 : 20;
  const stroke = size === 'md' ? 4 : 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dim = (radius + stroke) * 2;

  const color =
    score >= 80 ? 'stroke-emerald-500' :
    score >= 65 ? 'stroke-teal-500' :
    score >= 50 ? 'stroke-amber-500' :
    'stroke-slate-400';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={radius + stroke} cy={radius + stroke} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={radius + stroke} cy={radius + stroke} r={radius} fill="none"
          className={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn('absolute font-bold', size === 'md' ? 'text-sm' : 'text-xs')}>
        {score}
      </span>
    </div>
  );
};

// ─── Skeleton Loading ──────────────────────────────────────────
const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-gradient-to-r from-violet-100 via-indigo-50 to-violet-100 rounded-lg', className)} />
);

const AiSkeleton: React.FC = () => (
  <div className="space-y-3 mt-4">
    {/* Divider */}
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-violet-200/50" />
      <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 rounded-full border border-violet-200">
        <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
        <span className="text-xs font-semibold text-violet-500 animate-pulse">
          AI
        </span>
      </div>
      <div className="flex-1 h-px bg-violet-200/50" />
    </div>

    {/* Summary skeleton */}
    <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 space-y-2">
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-4/5" />
      <SkeletonPulse className="h-3 w-3/5" />
    </div>

    {/* World comparison skeleton */}
    <div className="border border-gray-100 rounded-xl p-3 space-y-2">
      <SkeletonPulse className="h-4 w-40" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-50">
          <SkeletonPulse className="w-4 h-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <SkeletonPulse className="h-3 w-24" />
            <div className="flex gap-2">
              <SkeletonPulse className="h-5 w-16 rounded-full" />
              <SkeletonPulse className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonPulse className="h-2.5 w-full" />
          </div>
        </div>
      ))}
    </div>

    {/* Strengths skeleton */}
    <div className="border border-gray-100 rounded-xl p-3">
      <SkeletonPulse className="h-4 w-32 mb-2" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-1.5">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-2.5 w-full" />
            <SkeletonPulse className="h-2.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>

    {/* Recommendation skeleton */}
    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
      <SkeletonPulse className="h-3.5 w-28" />
      <SkeletonPulse className="h-3 w-full" />
      <SkeletonPulse className="h-3 w-3/4" />
    </div>
  </div>
);

// ─── Quick Comparison Table (no AI needed) ─────────────────────
const QuickCompareTable: React.FC<{
  suggestionA: ExtendedMatchSuggestion;
  suggestionB: ExtendedMatchSuggestion;
  userId: string;
  locale: 'he' | 'en';
  t: typeof TEXTS['he'];
}> = ({ suggestionA, suggestionB, userId, locale, t }) => {
  const getTarget = (s: ExtendedMatchSuggestion) =>
    s.firstPartyId === userId ? s.secondParty : s.firstParty;

  const targetA = getTarget(suggestionA);
  const targetB = getTarget(suggestionB);
  const profA = targetA.profile;
  const profB = targetB.profile;

  const ageA = calculateAge(profA?.birthDate);
  const ageB = calculateAge(profB?.birthDate);

  const rows: Array<{
    label: string;
    icon: React.ReactNode;
    valueA: string | number | null | undefined;
    valueB: string | number | null | undefined;
    compare?: boolean;
  }> = [
    { label: t.age, icon: <User className="w-3 h-3" />, valueA: ageA, valueB: ageB },
    { label: t.city, icon: <MapPin className="w-3 h-3" />, valueA: profA?.city, valueB: profB?.city, compare: true },
    { label: t.occupation, icon: <Briefcase className="w-3 h-3" />, valueA: profA?.occupation, valueB: profB?.occupation },
    { label: t.education, icon: <GraduationCap className="w-3 h-3" />, valueA: profA?.education, valueB: profB?.education, compare: true },
    { label: t.religiousLevel, icon: <Star className="w-3 h-3" />, valueA: profA?.religiousLevel, valueB: profB?.religiousLevel, compare: true },
  ];

  return (
    <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50/70 border-b border-gray-100">
        <Scale className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600">{t.quickCompare}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((row, i) => {
          const isSame = row.compare && row.valueA && row.valueB && String(row.valueA) === String(row.valueB);
          return (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-1.5">
              <div className="text-[11px] text-gray-800 font-medium text-center truncate">
                {row.valueA || <span className="text-gray-300">—</span>}
              </div>
              <div className="flex flex-col items-center gap-0.5 px-1.5">
                <span className="text-gray-400">{row.icon}</span>
                {row.compare && row.valueA && row.valueB && (
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isSame ? 'bg-emerald-400' : 'bg-amber-400'
                  )} />
                )}
              </div>
              <div className="text-[11px] text-gray-800 font-medium text-center truncate">
                {row.valueB || <span className="text-gray-300">—</span>}
              </div>
            </div>
          );
        })}
      </div>
      {/* Names footer */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-1.5 bg-gray-50/50 border-t border-gray-100">
        <p className="text-[10px] text-gray-500 text-center font-medium">{targetA.firstName}</p>
        <div className="px-1.5" />
        <p className="text-[10px] text-gray-500 text-center font-medium">{targetB.firstName}</p>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════

const CompareDialog: React.FC<CompareDialogProps> = ({
  open,
  onOpenChange,
  suggestions,
  userId,
  locale,
  onActivate,
}) => {
  const t = TEXTS[locale];
  const isRtl = locale === 'he';

  const [selectedA, setSelectedA] = useState<string | null>(suggestions[0]?.id || null);
  const [selectedB, setSelectedB] = useState<string | null>(suggestions[1]?.id || null);
  const [aiResult, setAiResult] = useState<AiComparisonResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    worlds: true,
    strengths: false,
    considerations: false,
    questions: false,
  });
  const [whatIfAnswer, setWhatIfAnswer] = useState<string | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<string | null>(null);
  const feedbackSentRef = useRef(false);

  const suggestionA = suggestions.find((s) => s.id === selectedA);
  const suggestionB = suggestions.find((s) => s.id === selectedB);

  // Restore from sessionStorage when selection changes
  useEffect(() => {
    if (selectedA && selectedB) {
      const cached = getCachedResult(selectedA, selectedB);
      if (cached) {
        setAiResult(cached);
        setExpandedSections({ worlds: true, strengths: true, considerations: true, questions: true });
      }
    }
  }, [selectedA, selectedB]);

  // Reset AI results when selection changes
  const handleSelectA = useCallback((id: string) => {
    setSelectedA(id);
    setAiResult(null);
    setAiError(false);
    setWhatIfAnswer(null);
    setWhatIfResult(null);
    feedbackSentRef.current = false;
  }, []);

  const handleSelectB = useCallback((id: string) => {
    setSelectedB(id);
    setAiResult(null);
    setAiError(false);
    setWhatIfAnswer(null);
    setWhatIfResult(null);
    feedbackSentRef.current = false;
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const getTarget = (suggestion: ExtendedMatchSuggestion) => {
    return suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;
  };

  // ��── Feedback: track which suggestion was activated after comparison ──
  const handleActivateWithFeedback = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      // If AI comparison was done and we haven't sent feedback yet, track the choice
      if (aiResult && !feedbackSentRef.current && selectedA && selectedB) {
        feedbackSentRef.current = true;
        // Fire-and-forget — don't block activation
        fetch('/api/ai/compare-suggestions/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chosenSuggestionId: suggestion.id,
            otherSuggestionId: suggestion.id === selectedA ? selectedB : selectedA,
            comparisonScores: {
              chosenScore: suggestion.id === selectedA ? aiResult.suggestionA.score : aiResult.suggestionB.score,
              otherScore: suggestion.id === selectedA ? aiResult.suggestionB.score : aiResult.suggestionA.score,
            },
          }),
        }).catch(() => {/* ignore */});
      }

      onActivate(suggestion);
    },
    [aiResult, selectedA, selectedB, onActivate]
  );

  // ─── AI Compare Handler ──────────────────────────────────────
  const handleAiCompare = useCallback(async () => {
    if (!selectedA || !selectedB) return;

    // Check sessionStorage first
    const cached = getCachedResult(selectedA, selectedB);
    if (cached) {
      setAiResult(cached);
      setExpandedSections({ worlds: true, strengths: true, considerations: true, questions: true });
      return;
    }

    setAiLoading(true);
    setAiError(false);

    try {
      const res = await fetch('/api/ai/compare-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({
          suggestionIdA: selectedA,
          suggestionIdB: selectedB,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiResult(data.data);
        setCachedResult(selectedA, selectedB, data.data);
        setExpandedSections({ worlds: true, strengths: true, considerations: true, questions: true });
      } else {
        setAiError(true);
      }
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, [selectedA, selectedB, locale]);

  // ─── Ask Matchmaker Handler ──────────────────────────────────
  const handleAskMatchmaker = useCallback(async () => {
    if (!suggestionA || !suggestionB || !aiResult) return;
    const nameA = getTarget(suggestionA).firstName;
    const nameB = getTarget(suggestionB).firstName;

    const message = locale === 'he'
      ? `שלום, השוויתי בין ההצעות של ${nameA} ו-${nameB} ואשמח לשמוע את דעתך. ה-AI נתן ציון ${aiResult.suggestionA.score} ל-${nameA} ו-${aiResult.suggestionB.score} ל-${nameB}. מה דעתך?`
      : `Hi, I compared the suggestions for ${nameA} and ${nameB} and would love to hear your thoughts. The AI scored ${nameA} at ${aiResult.suggestionA.score} and ${nameB} at ${aiResult.suggestionB.score}. What do you think?`;

    try {
      await fetch('/api/chat/send-to-matchmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestionA.id,
          message,
          context: 'comparison',
        }),
      });
      toast.success(t.askMatchmakerSent);
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(message);
      toast.success(t.askMatchmakerSent);
    }
  }, [suggestionA, suggestionB, aiResult, locale, t]);

  // ─── Share Comparison (anonymous clipboard copy) ─────────────
  const handleShareComparison = useCallback(async () => {
    if (!aiResult || !suggestionA || !suggestionB) return;
    const nameA = getTarget(suggestionA).firstName;
    const nameB = getTarget(suggestionB).firstName;

    const worldLines = aiResult.worldComparison.map((w) =>
      `${w.world}: ${nameA} (${w.chemistryA}) | ${nameB} (${w.chemistryB})`
    ).join('\n');

    const text = locale === 'he'
      ? `📊 השוואת הצעות שידוך

${aiResult.comparisonSummary}

ציונים: ${nameA} ${aiResult.suggestionA.score}/100 | ${nameB} ${aiResult.suggestionB.score}/100

${worldLines}

💡 ${aiResult.recommendation}

— NeshamaTech AI`
      : `📊 Match Comparison

${aiResult.comparisonSummary}

Scores: ${nameA} ${aiResult.suggestionA.score}/100 | ${nameB} ${aiResult.suggestionB.score}/100

${worldLines}

💡 ${aiResult.recommendation}

— NeshamaTech AI`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.shareCopied);
    } catch {
      // ignore
    }
  }, [aiResult, suggestionA, suggestionB, locale, t]);

  // ─── What-if Scenario Handler ────────────────────────────────
  const handleWhatIf = useCallback(async (choice: string) => {
    if (!selectedA || !selectedB || !aiResult) return;
    setWhatIfAnswer(choice);
    setWhatIfLoading(true);

    try {
      const res = await fetch('/api/ai/compare-suggestions/what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({
          suggestionIdA: selectedA,
          suggestionIdB: selectedB,
          userChoice: choice,
          originalResult: aiResult,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.updatedRecommendation) {
        setWhatIfResult(data.data.updatedRecommendation);
      }
    } catch {
      // ignore — not critical
    } finally {
      setWhatIfLoading(false);
    }
  }, [selectedA, selectedB, aiResult, locale]);

  // ─── Suggestion Chip Selector (for 3+ suggestions) ──────────
  const renderSelector = (
    selected: string | null,
    onSelect: (id: string) => void,
    exclude: string | null,
    label: string
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {suggestions
          .filter((s) => s.id !== exclude)
          .map((s) => {
            const target = getTarget(s);
            const mainImage = target.images?.find((img) => img.isMain);
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 transition-all text-sm',
                  selected === s.id
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {mainImage?.url ? (
                    <Image
                      src={getRelativeCloudinaryPath(mainImage.url)}
                      alt={target.firstName}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-xs">{target.firstName}</span>
              </button>
            );
          })}
      </div>
    </div>
  );

  // ─── Profile Card ────────────────────────────────────────────
  const renderProfile = (
    suggestion: ExtendedMatchSuggestion | undefined,
    side: 'A' | 'B'
  ) => {
    if (!suggestion) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[260px]">
          <p className="text-gray-400 text-sm">{t.chooseSuggestion}</p>
        </div>
      );
    }

    const target = getTarget(suggestion);
    const mainImage = target.images?.find((img) => img.isMain);
    const age = calculateAge(target.profile?.birthDate);
    const aiScore = side === 'A' ? aiResult?.suggestionA : aiResult?.suggestionB;

    const fields = [
      { icon: MapPin, label: t.city, value: target.profile?.city },
      { icon: Briefcase, label: t.occupation, value: target.profile?.occupation },
      { icon: GraduationCap, label: t.education, value: target.profile?.education },
      { icon: Star, label: t.religiousLevel, value: target.profile?.religiousLevel },
    ];

    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Photo + Name */}
        <div className="relative h-36">
          {mainImage?.url ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={target.firstName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <User className="w-10 h-10 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2.5 right-2.5 left-2.5 text-white">
            <h4 className="text-base font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
              {target.firstName}
              {target.lastName ? ` ${target.lastName.charAt(0)}.` : ''}
            </h4>
            {age && (
              <p className="text-xs text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                {t.age}: {age}
              </p>
            )}
          </div>

          {/* AI Score badge */}
          {aiScore && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-2 left-2"
            >
              <ScoreRing score={aiScore.score} size="sm" />
            </motion.div>
          )}
        </div>

        {/* AI Title */}
        <AnimatePresence>
          {aiScore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
                <p className="text-xs font-semibold text-violet-700">{aiScore.title}</p>
                <p className="text-[10px] text-violet-600/80 leading-tight mt-0.5">{aiScore.highlight}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fields */}
        <div className="p-3 space-y-2">
          {fields.map((field, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <field.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 leading-none">{field.label}</p>
                <p className="text-xs font-medium text-gray-800 truncate">
                  {field.value || t.noData}
                </p>
              </div>
            </div>
          ))}

          {/* Match reason */}
          {suggestion.matchingReason && (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-start gap-1.5">
                <Heart className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-amber-600 font-medium">{t.matchReason}</p>
                  <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                    {suggestion.matchingReason.length > 100
                      ? `${suggestion.matchingReason.substring(0, 100)}...`
                      : suggestion.matchingReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activate button */}
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl mt-1 h-8 text-xs"
            onClick={() => handleActivateWithFeedback(suggestion)}
          >
            <Heart className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
            {t.activate}
          </Button>
        </div>
      </div>
    );
  };

  // ─── Collapsible Section ─────────────────────────────────────
  const CollapsibleSection: React.FC<{
    sectionKey: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    accentColor?: string;
  }> = ({ sectionKey, title, icon, children, accentColor = 'text-gray-700' }) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <span className={cn('flex-shrink-0', accentColor)}>{icon}</span>
        <span className={cn('text-sm font-semibold flex-1 text-start', accentColor)}>{title}</span>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── AI Results Section ──────────────────────────────────────
  const renderAiResults = () => {
    if (!aiResult) return null;

    const nameA = suggestionA ? getTarget(suggestionA).firstName : 'A';
    const nameB = suggestionB ? getTarget(suggestionB).firstName : 'B';

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-3 mt-4"
      >
        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 rounded-full border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700">
              {locale === 'he' ? 'ניתוח AI' : 'AI Analysis'}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
        </div>

        {/* Summary */}
        <div className="p-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
          <p className="text-sm text-violet-800 leading-relaxed">{aiResult.comparisonSummary}</p>
        </div>

        {/* World Comparison */}
        <CollapsibleSection
          sectionKey="worlds"
          title={t.worldComparison}
          icon={<Scale className="w-4 h-4" />}
          accentColor="text-indigo-700"
        >
          <div className="space-y-2.5">
            {aiResult.worldComparison.map((world, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-gray-50">
                <div className="mt-0.5 text-indigo-500">
                  {WORLD_ICONS[world.world] || <Star className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{world.world}</p>
                  <div className={cn('flex items-center gap-2 mt-1', isRtl && 'flex-row-reverse justify-end')}>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">{nameA}:</span>
                      <ChemistryBadge level={world.chemistryA} label={t[world.chemistryA]} />
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">{nameB}:</span>
                      <ChemistryBadge level={world.chemistryB} label={t[world.chemistryB]} />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{world.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Unique Strengths */}
        <CollapsibleSection
          sectionKey="strengths"
          title={t.strengths}
          icon={<CheckCircle className="w-4 h-4" />}
          accentColor="text-emerald-700"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1.5">{nameA}</p>
              <ul className="space-y-1">
                {aiResult.uniqueStrengthsA.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-gray-700 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1.5">{nameB}</p>
              <ul className="space-y-1">
                {aiResult.uniqueStrengthsB.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-gray-700 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* Considerations */}
        <CollapsibleSection
          sectionKey="considerations"
          title={t.considerations}
          icon={<AlertCircle className="w-4 h-4" />}
          accentColor="text-amber-700"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1.5">{nameA}</p>
              <ul className="space-y-1">
                {aiResult.considerationsA.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-gray-700 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1.5">{nameB}</p>
              <ul className="space-y-1">
                {aiResult.considerationsB.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-gray-700 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* AI Recommendation */}
        <div className="p-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200/60">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-teal-700">{t.recommendation}</p>
              <p className="text-xs text-teal-800 leading-relaxed mt-1">{aiResult.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Decision Questions */}
        <CollapsibleSection
          sectionKey="questions"
          title={t.decisionQuestions}
          icon={<HelpCircle className="w-4 h-4" />}
          accentColor="text-violet-700"
        >
          <ul className="space-y-2">
            {aiResult.decisionQuestions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 p-2 bg-violet-50/50 rounded-lg"
              >
                <span className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-violet-600">{i + 1}</span>
                </span>
                <p className="text-xs text-violet-800 leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      </motion.div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl border-0 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Scale className="w-5 h-5 text-teal-500" />
            {t.title}
            {suggestions.length > 2 && (
              <span className="text-sm font-normal text-gray-400 mr-1">
                ({t.comparingN(suggestions.length)})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Selectors — always show when 3+ suggestions */}
        {suggestions.length > 2 && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {renderSelector(selectedA, handleSelectA, selectedB, t.selectFirst)}
            {renderSelector(selectedB, handleSelectB, selectedA, t.selectSecond)}
          </div>
        )}

        {/* Profile Cards */}
        <div className="flex gap-3 items-stretch">
          {renderProfile(suggestionA, 'A')}

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center px-0.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border border-orange-200 shadow-sm">
              <span className="text-[10px] font-bold text-orange-600">{t.vs}</span>
            </div>
          </div>

          {renderProfile(suggestionB, 'B')}
        </div>

        {/* ── Quick Comparison Table (always visible, no AI needed) ── */}
        {suggestionA && suggestionB && (
          <QuickCompareTable
            suggestionA={suggestionA}
            suggestionB={suggestionB}
            userId={userId}
            locale={locale}
            t={t}
          />
        )}

        {/* AI Compare Button */}
        {suggestionA && suggestionB && !aiResult && !aiLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3"
          >
            <Button
              onClick={handleAiCompare}
              disabled={aiLoading}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Sparkles className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
              {t.aiCompare}
            </Button>

            {aiError && (
              <p className="text-xs text-red-500 text-center mt-2">{t.aiError}</p>
            )}
          </motion.div>
        )}

        {/* Skeleton Loading */}
        {aiLoading && <AiSkeleton />}

        {/* AI Results */}
        {renderAiResults()}

        {/* ── Post-AI Actions: What-if, Share, Ask Matchmaker ── */}
        {aiResult && (
          <div className="space-y-3 mt-2">
            {/* What-if Interactive Scenarios */}
            <CollapsibleSection
              sectionKey="whatif"
              title={t.whatIfTitle}
              icon={<Zap className="w-4 h-4" />}
              accentColor="text-orange-700"
            >
              <div className="space-y-2">
                <p className="text-xs text-gray-600">{t.whatIfChoose}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {(aiResult.decisionQuestions || []).slice(0, 3).map((q, i) => {
                    const isSelected = whatIfAnswer === q;
                    return (
                      <button
                        key={i}
                        onClick={() => handleWhatIf(q)}
                        disabled={whatIfLoading}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border text-start transition-all text-xs',
                          isSelected
                            ? 'border-orange-300 bg-orange-50 text-orange-800'
                            : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 text-gray-700'
                        )}
                      >
                        <ArrowRight className={cn('w-3 h-3 flex-shrink-0', isSelected ? 'text-orange-500' : 'text-gray-400')} />
                        <span className="leading-relaxed">{q}</span>
                      </button>
                    );
                  })}
                </div>

                {/* What-if result */}
                {whatIfLoading && (
                  <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                    <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                    <span className="text-xs text-orange-600">{t.whatIfLoading}</span>
                  </div>
                )}
                {whatIfResult && !whatIfLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-orange-800 leading-relaxed">{whatIfResult}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CollapsibleSection>

            {/* Action buttons: Share + Ask Matchmaker */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs border-gray-200 hover:bg-gray-50"
                onClick={handleShareComparison}
              >
                <Share2 className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
                {t.shareComparison}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-xl text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                onClick={handleAskMatchmaker}
              >
                <Send className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
                {t.askMatchmaker}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
