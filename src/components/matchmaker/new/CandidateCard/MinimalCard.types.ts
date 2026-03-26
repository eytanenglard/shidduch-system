// MinimalCard.types.ts — Shared types & interfaces

import type { Candidate } from '../types/candidates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// ── Score & AI types ────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

export type CandidateWithAiData = Candidate & {
  aiScore?: number;
  aiReasoning?: string;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?:
    | 'excellent'
    | 'good'
    | 'possible'
    | 'problematic'
    | 'not_recommended';
  aiSimilarity?: number;
};

// ── Props ───────────────────────────────────────────────────────────────────

export type MinimalCardDict = MatchmakerPageDictionary['candidatesManager']['list']['minimalCard'] & {
  heightUnit?: string;
  languagesLabel?: string;
};

export interface MinimalCandidateCardProps {
  candidate: CandidateWithAiData;
  onClick: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate, e: React.MouseEvent) => void;
  onAnalyze?: (candidate: Candidate, e: React.MouseEvent) => void;
  onSendProfileFeedback?: (candidate: Candidate, e: React.MouseEvent) => void;
  isHighlighted?: boolean;
  highlightTerm?: string;
  className?: string;
  aiScore?: number;
  isAiTarget?: boolean;
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  isSelectableForComparison?: boolean;
  isSelectedForComparison?: boolean;
  onToggleComparison?: (candidate: Candidate, e: React.MouseEvent) => void;
  existingSuggestion?: { status: string; createdAt: string } | null;
  aiTargetName?: string;
  isCompact?: boolean;
  dict: MinimalCardDict;
}

// ── Config types ────────────────────────────────────────────────────────────

export interface PriorityConfig {
  color: string;
  borderColor: string;
  bg: string;
  textColor: string;
  label: string;
}

export interface ReadinessConfig {
  emoji: string;
  color: string;
  bg: string;
  label: string;
}

export interface BackgroundBadgeConfig {
  color: string;
  icon: React.FC<{ className?: string }>;
  label: string;
}

export interface AvailabilityConfig {
  label: string;
  className: string;
  dot: string;
  icon: React.ReactNode;
}

export interface WaitingConfig {
  label: string;
  className: string;
  textColor: string;
  show: boolean;
  showOnPhoto: boolean;
  days: number;
  neverSuggested: boolean;
}
