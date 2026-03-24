// src/components/matchmaker/new/PotentialMatches/match-card/types.ts

import type { PotentialMatch } from '../types/potentialMatches';
import type { CandidateToHide } from '../HideCandidateDialog';

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface PotentialMatchCardProps {
  match: PotentialMatch;
  onCreateSuggestion: (matchId: string) => void;
  onDismiss: (matchId: string) => void;
  onReview: (matchId: string) => void;
  onRestore: (matchId: string) => void;
  onSave: (matchId: string) => void;
  onViewProfile: (userId: string) => void;
  onAnalyzeCandidate: (candidate: any) => void;
  onProfileFeedback: (candidate: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (matchId: string) => void;
  showSelection?: boolean;
  className?: string;
  onHideCandidate: (candidate: CandidateToHide) => void;
  hiddenCandidateIds?: Set<string>;
  onFilterByUser: (fullName: string) => void;
  isCompact?: boolean;
}

// =============================================================================
// SUGGESTION STATUS HEBREW LABELS
// =============================================================================

export const SUGGESTION_STATUS_HEBREW: Record<string, string> = {
  DRAFT: 'טיוטה',
  PENDING_FIRST_PARTY: 'ממתין לצד ראשון',
  PENDING_SECOND_PARTY: 'ממתין לצד שני',
  FIRST_PARTY_APPROVED: 'צד ראשון אישר',
  FIRST_PARTY_INTERESTED: 'צד ראשון מעוניין',
  FIRST_PARTY_DECLINED: 'צד ראשון דחה',
  SECOND_PARTY_APPROVED: 'צד שני אישר',
  SECOND_PARTY_DECLINED: 'צד שני דחה',
  CONTACT_DETAILS_SHARED: 'פרטים שותפו',
  DATING: 'בתהליך היכרות',
  ENGAGED: 'מאורסים',
  MARRIED: 'נשואים',
  CLOSED: 'נסגר',
  CANCELLED: 'בוטל',
  ENDED_AFTER_FIRST_DATE: 'הסתיים אחרי פגישה',
  MATCH_DECLINED: 'נדחה',
  RE_OFFERED_TO_FIRST_PARTY: 'הוצע מחדש',
};

export function getSuggestionStatusHebrew(status: string): string {
  return SUGGESTION_STATUS_HEBREW[status] || status;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-gray-600';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 85) return 'from-emerald-500 to-green-500';
  if (score >= 75) return 'from-blue-500 to-cyan-500';
  if (score >= 70) return 'from-amber-500 to-yellow-500';
  return 'from-gray-500 to-slate-500';
};

export const getStatusBadge = (status: string) => {
  // Dynamic imports not possible for the icon component, so we return string identifiers
  switch (status) {
    case 'PENDING':
      return {
        label: 'ממתין',
        color: 'bg-yellow-100 text-yellow-700',
        iconName: 'Clock' as const,
      };
    case 'REVIEWED':
      return { label: 'נבדק', color: 'bg-blue-100 text-blue-700', iconName: 'Eye' as const };
    case 'SENT':
      return {
        label: 'נשלחה הצעה',
        color: 'bg-green-100 text-green-700',
        iconName: 'Send' as const,
      };
    case 'DISMISSED':
      return { label: 'נדחה', color: 'bg-gray-100 text-gray-700', iconName: 'X' as const };
    case 'SHORTLISTED':
      return {
        label: 'שמור בצד',
        color: 'bg-purple-100 text-purple-700',
        iconName: 'Bookmark' as const,
      };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', iconName: 'Clock' as const };
  }
};

export type StatusIconName = 'Clock' | 'Eye' | 'Send' | 'X' | 'Bookmark';

export const getReligiousLevelLabel = (level: string | null): string => {
  if (!level) return 'לא צוין';
  const labels: Record<string, string> = {
    dati_leumi_torani: 'דתי לאומי תורני',
    dati_leumi_standard: 'דתי לאומי',
    dati_leumi_liberal: 'דתי לאומי ליברלי',
    charedi_modern: 'חרדי מודרני',
    masorti_strong: 'מסורתי חזק',
    masorti_light: 'מסורתי',
    secular_traditional_connection: 'חילוני עם קשר למסורת',
    secular: 'חילוני',
  };
  return labels[level] || level;
};

export const formatLanguages = (
  native: string | null | undefined,
  additional: string[] | null | undefined
): string => {
  const langMap: Record<string, string> = {
    hebrew: 'עברית',
    english: 'אנגלית',
    russian: 'רוסית',
    french: 'צרפתית',
    spanish: 'ספרדית',
    amharic: 'אמהרית',
    arabic: 'ערבית',
    german: 'גרמנית',
    italian: 'איטלקית',
  };

  const langs = [native, ...(additional || [])].filter(Boolean) as string[];

  return langs
    .map((lang) => langMap[lang.toLowerCase()] || lang)
    .slice(0, 3)
    .join(', ');
};

export const getMaritalStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '';
  const map: Record<string, string> = {
    single: 'רווק/ה',
    divorced: 'גרוש/ה',
    widowed: 'אלמן/ה',
    divorced_with_children: 'גרוש/ה +',
    widowed_with_children: 'אלמן/ה +',
  };
  return map[status.toLowerCase()] || status;
};
