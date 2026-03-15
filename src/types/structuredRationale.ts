// =================================================================
// FILE 2: SHARED TYPE — StructuredRationale
// Save as: src/types/structuredRationale.ts
// Used by both web app and mobile API routes
// =================================================================

/**
 * Cached AI analysis for one party (first or second).
 * Each party sees a different analysis because the prompt is
 * "analyze from MY perspective looking at the OTHER person."
 */
export interface CachedUserAnalysis {
  overallScore: number;
  matchTitle: string;
  matchSummary: string;
  compatibilityPoints: Array<{ area: string; explanation: string }>;
  pointsToConsider: Array<{ area: string; explanation: string }>;
  suggestedConversationStarters: string[];
  /** ISO date — when this analysis was generated */
  generatedAt: string;
  /** The userId of the user who requested this analysis */
  generatedForUserId: string;
  /**
   * ISO date — snapshot of the OTHER party's profile.contentUpdatedAt
   * at the time of generation. Used to detect staleness.
   */
  otherPartyProfileUpdatedAt: string | null;
}

/**
 * Structured rationale stored as JSON on MatchSuggestion.
 * Combines AI scanning data, matchmaker notes, and cached user analyses.
 */
export interface StructuredRationale {
  // === From AI scanning (PotentialMatch data at suggestion creation) ===
  ai?: {
    /** Overall compatibility score from scanning (0-100) */
    score: number;
    /** Short 1-2 sentence reasoning */
    shortReasoning: string;
    /** Detailed multi-paragraph reasoning */
    detailedReasoning?: string;
    /** Which scan method produced this score */
    scanMethod?: string;
    /** ISO date — when the AI scored this pair */
    scoredAt?: string;
    /** Score breakdown from the scan (varies by method) */
    scoreBreakdown?: Record<string, any>;
  };

  // === From the matchmaker at suggestion creation ===
  matchmaker?: {
    /** General reason for this match (goes to matchingReason too) */
    generalReason?: string;
    /** Personal note for first party */
    noteForFirstParty?: string;
    /** Personal note for second party */
    noteForSecondParty?: string;
    /** Internal matchmaker notes */
    internalNotes?: string;
  };

  // === Cached on-demand AI analyses (per party) ===
  /** Analysis cached for the FIRST party's perspective */
  firstPartyAnalysis?: CachedUserAnalysis;
  /** Analysis cached for the SECOND party's perspective */
  secondPartyAnalysis?: CachedUserAnalysis;
}

// =================================================================
// HELPER: Check if a cached analysis is still valid
// =================================================================

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Determines if a cached analysis should be used or regenerated.
 *
 * @param cached - The cached analysis (or undefined if none)
 * @param otherPartyContentUpdatedAt - The OTHER party's profile.contentUpdatedAt
 * @returns true if cache is valid, false if analysis should be regenerated
 */
export function isCacheValid(
  cached: CachedUserAnalysis | undefined,
  otherPartyContentUpdatedAt: Date | string | null | undefined
): boolean {
  if (!cached) return false;

  // 1. Check TTL (30 days)
  const generatedAt = new Date(cached.generatedAt).getTime();
  const now = Date.now();
  if (now - generatedAt > CACHE_TTL_MS) {
    return false; // Expired
  }

  // 2. Check if the other party's profile changed since generation
  if (otherPartyContentUpdatedAt && cached.otherPartyProfileUpdatedAt) {
    const profileUpdated = new Date(otherPartyContentUpdatedAt).getTime();
    const snapshotTime = new Date(cached.otherPartyProfileUpdatedAt).getTime();
    if (profileUpdated > snapshotTime) {
      return false; // Profile changed → stale
    }
  }

  return true;
}