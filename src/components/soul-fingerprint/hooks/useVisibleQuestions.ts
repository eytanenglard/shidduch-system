import { useMemo } from 'react';
import type { SFQuestion, SFAnswers, SectorGroup, SectorValue, LifeStageValue } from '../types';
import { isQuestionVisible } from '../types';

export function useVisibleQuestions(
  questions: SFQuestion[],
  answers: SFAnswers,
  sectorGroup: SectorGroup | null,
  sector: SectorValue | null,
  lifeStage: LifeStageValue | null,
  gender: 'MALE' | 'FEMALE' | null
) {
  const selfQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.forSelf &&
          isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender)
      ),
    [questions, answers, sectorGroup, sector, lifeStage, gender]
  );

  const partnerQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.forPartner &&
          isQuestionVisible(q, answers, sectorGroup, sector, lifeStage, gender)
      ),
    [questions, answers, sectorGroup, sector, lifeStage, gender]
  );

  return { selfQuestions, partnerQuestions };
}
