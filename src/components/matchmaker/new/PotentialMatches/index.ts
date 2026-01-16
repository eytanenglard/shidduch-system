// =============================================================================
// src/components/matchmaker/PotentialMatches/index.ts
// Export file for PotentialMatches components
// =============================================================================

// Main Dashboard Component
export { default as PotentialMatchesDashboard } from './PotentialMatchesDashboard';
export { default } from './PotentialMatchesDashboard';

// Sub-components
export { default as PotentialMatchCard } from './PotentialMatchCard';
export { default as PotentialMatchesStats } from './PotentialMatchesStats';

// Hooks
export { usePotentialMatches } from './hooks/usePotentialMatches';

// Re-export types
export type {
  PotentialMatch,
  PotentialMatchesResponse,
  PotentialMatchesStats,
  LastScanInfo,
  PotentialMatchFilters,
  PotentialMatchSortBy,
  PotentialMatchFilterStatus,
  PotentialMatchAction,
  BatchScanResponse,
  BatchScanProgress,
  ScoreBreakdown,
  CandidateBasicInfo,
  ActiveSuggestionInfo,
} from '@/types/potentialMatches';
