import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { Candidate } from '../types/candidates';

interface SimilarCandidatesToasts {
  similarFound: string;
  noSimilarFound: string;
  similarError: string;
}

export function useSimilarCandidates(
  candidates: Candidate[],
  maleCandidates: Candidate[],
  femaleCandidates: Candidate[],
  t: SimilarCandidatesToasts,
) {
  const [similarCandidateIds, setSimilarCandidateIds] = useState<Set<string> | null>(null);

  const handleShowSimilar = useCallback(
    async (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      const toastId = toast.loading(`מחפש מועמדים דומים ל${candidate.firstName}...`);
      try {
        const res = await fetch(`/api/matchmaker/candidates/similar?userId=${candidate.id}`);
        const data = await res.json();
        if (data.success && data.similarIds?.length > 0) {
          setSimilarCandidateIds(new Set(data.similarIds));
          toast.success(t.similarFound.replace('{{count}}', String(data.similarIds.length)).replace('{{name}}', candidate.firstName), {
            id: toastId,
            duration: 4000,
            action: {
              label: 'נקה סינון',
              onClick: () => setSimilarCandidateIds(null),
            },
          });
        } else {
          toast.info(t.noSimilarFound, { id: toastId });
        }
      } catch {
        toast.error(t.similarError, { id: toastId });
      }
    },
    [t]
  );

  const clearSimilar = useCallback(() => setSimilarCandidateIds(null), []);

  const displayCandidates = useMemo(() => {
    if (!similarCandidateIds) return candidates;
    return candidates.filter((c) => similarCandidateIds.has(c.id));
  }, [candidates, similarCandidateIds]);

  const displayMaleCandidates = useMemo(() => {
    if (!similarCandidateIds) return maleCandidates;
    return maleCandidates.filter((c) => similarCandidateIds.has(c.id));
  }, [maleCandidates, similarCandidateIds]);

  const displayFemaleCandidates = useMemo(() => {
    if (!similarCandidateIds) return femaleCandidates;
    return femaleCandidates.filter((c) => similarCandidateIds.has(c.id));
  }, [femaleCandidates, similarCandidateIds]);

  return {
    similarCandidateIds,
    handleShowSimilar,
    clearSimilar,
    displayCandidates,
    displayMaleCandidates,
    displayFemaleCandidates,
  };
}
