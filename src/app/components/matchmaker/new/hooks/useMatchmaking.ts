// /hooks/useMatchmaking.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { AvailabilityStatus } from '@prisma/client';
import { calculateMatchScore, MatchScore } from '../utils/matchingAlgorithm';
import { MATCH_THRESHOLDS } from '../constants/matchingCriteria';
import type { User } from '@/types/next-auth';
// Define types and interfaces
interface UseMatchmakingProps {
  candidates?: User[];
  onMatchFound?: (match: PotentialMatch) => void;
  onMatchScoreUpdate?: (scores: MatchScoreMap) => void;
}

export interface PotentialMatch {
  candidateA: User;
  candidateB: User;
  score: MatchScore;
  matchDate?: Date;
  status: 'new' | 'suggested' | 'rejected';
  lastUpdated: Date;
}

type MatchScoreMap = Map<string, Map<string, MatchScore>>;

interface MatchSuggestion {
  candidate: User;
  score: MatchScore;
  matchDate: Date;
}

export const useMatchmaking = ({
  candidates = [],
  onMatchScoreUpdate
}: UseMatchmakingProps = {}) => {
  // State declarations
  const [matchScores, setMatchScores] = useState<MatchScoreMap>(new Map());
  const [suggestedMatches, setSuggestedMatches] = useState<PotentialMatch[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculation, setLastCalculation] = useState<Date | null>(null);

  // Calculate all possible matches
  const calculateAllMatches = useCallback(() => {
    setIsCalculating(true);
    const newScores = new Map<string, Map<string, MatchScore>>();
    const newMatches: PotentialMatch[] = [];

    candidates.forEach((candidateA, indexA) => {
      const candidateAScores = new Map<string, MatchScore>();
      newScores.set(candidateA.id, candidateAScores);

      candidates.slice(indexA + 1).forEach(candidateB => {
        // Check basic compatibility conditions
        if (
          candidateA.profile?.gender === candidateB.profile?.gender ||
          candidateA.profile?.availabilityStatus !== AvailabilityStatus.AVAILABLE ||
          candidateB.profile?.availabilityStatus !== AvailabilityStatus.AVAILABLE
        ) {
          return;
        }

        // Calculate match score
        const matchScore = calculateMatchScore(candidateA.profile, candidateB.profile);
        
        if (matchScore) {
          candidateAScores.set(candidateB.id, matchScore);

          // Add to potential matches if score is good enough
          if (matchScore.score >= MATCH_THRESHOLDS.GOOD) {
            newMatches.push({
              candidateA,
              candidateB,
              score: matchScore,
              matchDate: new Date(),
              status: 'new',
              lastUpdated: new Date()
            });
          }
        }
      });
    });

    setMatchScores(newScores);
    setSuggestedMatches(prev => {
      const existing = new Set(prev.map(m => 
        `${m.candidateA.id}-${m.candidateB.id}`
      ));
      
      return [
        ...prev,
        ...newMatches.filter(m => 
          !existing.has(`${m.candidateA.id}-${m.candidateB.id}`)
        )
      ].sort((a, b) => b.score.score - a.score.score);
    });

    onMatchScoreUpdate?.(newScores);
    setIsCalculating(false);
    setLastCalculation(new Date());
  }, [candidates, onMatchScoreUpdate]);

  // Recalculate matches when candidates list changes
  useEffect(() => {
    if (candidates.length > 0 && !isCalculating) {
      calculateAllMatches();
    }
  }, [candidates, calculateAllMatches, isCalculating]);

  // Get best matches for a specific candidate
  const getBestMatchesForCandidate = useCallback((
    candidateId: string,
    limit: number = 5
  ): MatchSuggestion[] => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return [];

    const matches: MatchSuggestion[] = [];
    const candidateScores = matchScores.get(candidateId);

    if (candidateScores) {
      candidateScores.forEach((score, otherId) => {
        const otherCandidate = candidates.find(c => c.id === otherId);
        if (otherCandidate && score.score >= MATCH_THRESHOLDS.FAIR) {
          matches.push({
            candidate: otherCandidate,
            score,
            matchDate: new Date()
          });
        }
      });
    }

    return matches
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, limit);
  }, [candidates, matchScores]);

  // Analyze matches by categories
  const matchAnalytics = useMemo(() => {
    const analytics = {
      total: suggestedMatches.length,
      byCategory: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      },
      averageScore: 0,
      recentMatches: [] as PotentialMatch[]
    };

    suggestedMatches.forEach(match => {
      if (match.score.score >= MATCH_THRESHOLDS.EXCELLENT) {
        analytics.byCategory.excellent++;
      } else if (match.score.score >= MATCH_THRESHOLDS.GOOD) {
        analytics.byCategory.good++;
      } else if (match.score.score >= MATCH_THRESHOLDS.FAIR) {
        analytics.byCategory.fair++;
      } else {
        analytics.byCategory.poor++;
      }
    });

    analytics.averageScore = suggestedMatches.reduce(
      (sum, match) => sum + match.score.score,
      0
    ) / (suggestedMatches.length || 1);

    // Get recent matches (last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    analytics.recentMatches = suggestedMatches
      .filter(match => match.matchDate && match.matchDate >= oneWeekAgo)
      .sort((a, b) => 
        (b.matchDate?.getTime() || 0) - (a.matchDate?.getTime() || 0)
      );

    return analytics;
  }, [suggestedMatches]);

  // Update match status
  const updateMatchStatus = useCallback((
    candidateAId: string,
    candidateBId: string,
    status: 'suggested' | 'rejected'
  ) => {
    setSuggestedMatches(prev => prev.map(match => {
      if (
        (match.candidateA.id === candidateAId && match.candidateB.id === candidateBId) ||
        (match.candidateA.id === candidateBId && match.candidateB.id === candidateAId)
      ) {
        return {
          ...match,
          status,
          lastUpdated: new Date()
        };
      }
      return match;
    }));
  }, []);

  // Return hook interface
  return {
    matchScores,
    suggestedMatches,
    isCalculating,
    lastCalculation,
    matchAnalytics,
    getBestMatchesForCandidate,
    calculateAllMatches,
    updateMatchStatus
  };
};

export default useMatchmaking;