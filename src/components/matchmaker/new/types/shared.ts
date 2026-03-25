// Shared types for the matchmaker module
// Consolidated from: candidates.ts, CandidatesManager/index.tsx, CandidatesList.tsx,
// CandidatesManager/SplitView.tsx, CandidatesManager/split-view/types.ts

import type { Candidate } from './candidates';

// ============================================================================
// AI SCORING TYPES
// ============================================================================

export type BackgroundCompatibility =
  | 'excellent'
  | 'good'
  | 'possible'
  | 'problematic'
  | 'not_recommended';

export interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

export interface AiMatch {
  userId: string;
  firstName?: string;
  lastName?: string;
  score?: number;
  firstPassScore?: number;
  finalScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  reasoning?: string;
  shortReasoning?: string;
  detailedReasoning?: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: BackgroundCompatibility;
  similarity?: number;
}

export interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number;
  durationMs?: number;
}

// ============================================================================
// CANDIDATE EXTENSION TYPES
// ============================================================================

export type CandidateWithAiData = Candidate & {
  aiScore?: number;
  aiReasoning?: string;
  aiMatch?: AiMatch;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?: BackgroundCompatibility;
  aiSimilarity?: number;
};

export interface VirtualCandidateData {
  virtualProfileId: string;
  virtualProfile: Record<string, unknown>;
  gender: string;
  religiousLevel: string;
  editedSummary?: string;
}

export type VirtualCandidate = Candidate & {
  isVirtual: boolean;
  virtualData?: VirtualCandidateData;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function toBackgroundCompatibility(
  value: string | undefined
): BackgroundCompatibility | undefined {
  const validValues: BackgroundCompatibility[] = [
    'excellent',
    'good',
    'possible',
    'problematic',
    'not_recommended',
  ];
  if (value && validValues.includes(value as BackgroundCompatibility)) {
    return value as BackgroundCompatibility;
  }
  return undefined;
}
