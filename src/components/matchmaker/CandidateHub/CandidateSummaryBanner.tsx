// CandidateSummaryBanner.tsx — Quick overview banner between header and tabs

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Hourglass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/components/matchmaker/new/types/candidates';

interface CandidateSummaryBannerProps {
  candidate: Candidate;
  isRtl: boolean;
}

const AVAILABILITY_DOTS: Record<string, { dot: string; label: string }> = {
  AVAILABLE: { dot: 'bg-emerald-500', label: 'זמין/ה' },
  DATING: { dot: 'bg-amber-500', label: 'בדייטים' },
  UNAVAILABLE: { dot: 'bg-red-500', label: 'לא זמין/ה' },
  PAUSED: { dot: 'bg-gray-400', label: 'מושהה' },
};

const READINESS_LABELS: Record<string, string> = {
  VERY_READY: '🚀 מאוד מוכן/ה',
  READY: '✅ מוכן/ה',
  SOMEWHAT_READY: '🌱 פחות מוכן/ה',
  UNCERTAIN: '🤔 לא בטוח/ה',
  NOT_READY: '⏸️ לא מוכן/ה',
};

const MARITAL_HE: Record<string, string> = {
  single: 'רווק/ה',
  divorced: 'גרוש/ה',
  widowed: 'אלמן/ה',
};

const RELIGIOUS_HE: Record<string, string> = {
  secular: 'חילוני',
  traditional: 'מסורתי',
  religious: 'דתי',
  orthodox: 'חרדי',
  'national-religious': 'דתי-לאומי',
  'national-religious-torani': 'דתי-לאומי תורני',
  'national-religious-open': 'דתי-לאומי פתוח',
  'modern-orthodox': 'חרדי-מודרני',
  'ultra-orthodox': 'חרדי',
  'haredi-leumi': 'חרד"ל',
};

export default function CandidateSummaryBanner({ candidate, isRtl }: CandidateSummaryBannerProps) {
  const profile = candidate.profile;

  const availability = AVAILABILITY_DOTS[profile.availabilityStatus ?? ''] ?? AVAILABILITY_DOTS.AVAILABLE;
  const readiness = READINESS_LABELS[(profile as any).readinessLevel ?? ''] ?? null;
  const marital = MARITAL_HE[profile.maritalStatus as string] ?? profile.maritalStatus ?? null;
  const religious = RELIGIOUS_HE[profile.religiousLevel ?? ''] ?? profile.religiousLevel ?? null;

  const suggestionsReceived = (profile as any).suggestionsReceived ?? 0;
  const suggestionsAccepted = (profile as any).suggestionsAccepted ?? 0;
  const suggestionsDeclined = (profile as any).suggestionsDeclined ?? 0;

  const waitingDays = useMemo(() => {
    const lastSuggested = (profile as any).lastSuggestedAt;
    const sinceDate = lastSuggested
      ? new Date(lastSuggested)
      : new Date(candidate.createdAt);
    return Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [(profile as any).lastSuggestedAt, candidate.createdAt]);

  const aboutSnippet = useMemo(() => {
    const text = profile.about || (profile as any).aiProfileSummary?.summary || '';
    if (!text) return null;
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }, [profile.about, (profile as any).aiProfileSummary]);

  // Line 1 pieces
  const line1Parts = [
    profile.occupation || profile.education,
    religious,
    profile.city,
    marital,
  ].filter(Boolean);

  return (
    <Card className="border-teal-100 bg-gradient-to-r from-white to-teal-50/30 overflow-hidden">
      <CardContent className="p-4 space-y-1.5">
        {/* Line 1: Identity */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className={cn('w-2 h-2 rounded-full shrink-0', availability.dot)} />
          <span className="text-xs font-medium text-gray-500">{availability.label}</span>
          {line1Parts.length > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-gray-700 font-medium">{line1Parts.join('  ·  ')}</span>
            </>
          )}
        </div>

        {/* Line 2: Stats */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
          {suggestionsReceived > 0 ? (
            <>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-gray-400" />
                {suggestionsReceived} {isRtl ? 'הצעות' : 'suggestions'}
              </span>
              {suggestionsAccepted > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  {suggestionsAccepted} {isRtl ? 'אושרו' : 'approved'}
                </span>
              )}
              {suggestionsDeclined > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-3 h-3" />
                  {suggestionsDeclined} {isRtl ? 'נדחו' : 'declined'}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 text-amber-600">
              <User className="w-3 h-3" />
              {isRtl ? 'טרם קיבל/ה הצעה' : 'No suggestions yet'}
            </span>
          )}

          {waitingDays > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className={cn(
                'flex items-center gap-1',
                waitingDays > 30 ? 'text-red-500 font-medium' : waitingDays > 14 ? 'text-amber-600' : 'text-gray-500'
              )}>
                <Hourglass className="w-3 h-3" />
                {isRtl ? `ממתינ/ה ${waitingDays} ימים` : `Waiting ${waitingDays} days`}
              </span>
            </>
          )}

          {readiness && (
            <>
              <span className="text-gray-300">·</span>
              <span>{readiness}</span>
            </>
          )}
        </div>

        {/* Line 3: About snippet */}
        {aboutSnippet && (
          <p className="text-xs text-gray-400 italic truncate">
            &ldquo;{aboutSnippet}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}
