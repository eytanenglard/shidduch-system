'use client';

import { useState, useCallback } from 'react';
import type { SFAnswers } from '@/components/soul-fingerprint/types';
import { deriveTagsFromAnswers, derivePartnerTagsFromAnswers } from '@/components/soul-fingerprint/types';

interface MatchEstimateResult {
  estimatedMatches: number;
}

export function useMatchEstimate() {
  const [result, setResult] = useState<MatchEstimateResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = useCallback(async (answers: SFAnswers, gender: 'MALE' | 'FEMALE') => {
    setIsLoading(true);
    setError(null);

    try {
      const selfTags = deriveTagsFromAnswers(answers);
      const partnerTags = derivePartnerTagsFromAnswers(answers);

      const res = await fetch('/api/heart-map/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          sectorTags: selfTags.sectorTags,
          partnerSectorTags: partnerTags.sectorTags,
        }),
      });

      if (!res.ok) {
        throw new Error(`Estimation failed: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      return data as MatchEstimateResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to estimate matches';
      setError(message);
      console.error('[MatchEstimate] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, fetchEstimate };
}
