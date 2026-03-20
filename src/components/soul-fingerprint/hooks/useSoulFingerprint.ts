'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  SFAnswers,
  SFState,
  SectorGroup,
  SectorValue,
  LifeStageValue,
  SFQuestion,
  SectionId,
} from '../types';
import { getSectorGroup, isQuestionVisible, deriveTagsFromAnswers, derivePartnerTagsFromAnswers } from '../types';
import { SF_SECTIONS } from '../questions';
import { useAutoSave } from './useAutoSave';

export function useSoulFingerprint(
  gender: 'MALE' | 'FEMALE' | null,
  initialData?: { sectionAnswers?: SFAnswers; isComplete?: boolean } | null
) {
  const [state, setState] = useState<SFState>(() => {
    const savedAnswers = (initialData?.sectionAnswers as SFAnswers) || {};
    const sector = (savedAnswers['anchor_sector'] as SectorValue) || null;
    return {
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answers: savedAnswers,
      sectorGroup: getSectorGroup(sector),
      sector,
      lifeStage: (savedAnswers['anchor_life_stage'] as LifeStageValue) || null,
      isComplete: initialData?.isComplete || false,
      showingPartnerQuestions: false,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentSection = SF_SECTIONS[state.currentSectionIndex];

  // Get visible questions for current section
  const visibleSelfQuestions = useMemo(
    () =>
      currentSection.questions.filter(
        (q) =>
          q.forSelf &&
          isQuestionVisible(q, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender)
      ),
    [currentSection, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender]
  );

  const visiblePartnerQuestions = useMemo(
    () =>
      currentSection.questions.filter(
        (q) =>
          q.forPartner &&
          isQuestionVisible(q, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender)
      ),
    [currentSection, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender]
  );

  const hasPartnerQuestions = visiblePartnerQuestions.length > 0;

  const currentQuestions = state.showingPartnerQuestions
    ? visiblePartnerQuestions
    : visibleSelfQuestions;

  // Invalidation: when an answer changes, remove dependent answers that became invisible
  const findDependentQuestions = useCallback(
    (questionId: string): SFQuestion[] => {
      return SF_SECTIONS.flatMap((s) => s.questions).filter((q) => {
        if (!q.conditions) return false;
        if (q.conditions.requiredAnswers?.some((r) => r.questionId === questionId))
          return true;
        if (q.conditions.excludeAnswers?.some((e) => e.questionId === questionId))
          return true;
        return false;
      });
    },
    []
  );

  const setAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      setState((prev) => {
        const newAnswers = { ...prev.answers, [questionId]: value };

        // Update sector/sectorGroup/lifeStage if anchor questions changed
        let newSector = prev.sector;
        let newSectorGroup = prev.sectorGroup;
        let newLifeStage = prev.lifeStage;

        if (questionId === 'anchor_sector') {
          newSector = value as SectorValue;
          newSectorGroup = getSectorGroup(newSector);
        }
        if (questionId === 'anchor_life_stage') {
          newLifeStage = value as LifeStageValue;
        }

        // Invalidate dependent answers
        const deps = findDependentQuestions(questionId);
        for (const dep of deps) {
          if (!isQuestionVisible(dep, newAnswers, newSectorGroup, newSector, newLifeStage, gender)) {
            delete newAnswers[dep.id];
          }
        }

        // Also invalidate across all questions when sector changes
        if (questionId === 'anchor_sector') {
          for (const section of SF_SECTIONS) {
            for (const q of section.questions) {
              if (q.id === questionId) continue;
              if (!isQuestionVisible(q, newAnswers, newSectorGroup, newSector, newLifeStage, gender)) {
                delete newAnswers[q.id];
              }
            }
          }
        }

        return {
          ...prev,
          answers: newAnswers,
          sector: newSector,
          sectorGroup: newSectorGroup,
          lifeStage: newLifeStage,
        };
      });
    },
    [findDependentQuestions, gender]
  );

  const goToSection = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentSectionIndex: index,
      currentQuestionIndex: 0,
      showingPartnerQuestions: false,
    }));
  }, []);

  const nextSection = useCallback(() => {
    setState((prev) => {
      if (prev.currentSectionIndex < SF_SECTIONS.length - 1) {
        return {
          ...prev,
          currentSectionIndex: prev.currentSectionIndex + 1,
          currentQuestionIndex: 0,
          showingPartnerQuestions: false,
        };
      }
      return { ...prev, isComplete: true };
    });
  }, []);

  const prevSection = useCallback(() => {
    setState((prev) => {
      if (prev.showingPartnerQuestions) {
        return { ...prev, showingPartnerQuestions: false };
      }
      if (prev.currentSectionIndex > 0) {
        return {
          ...prev,
          currentSectionIndex: prev.currentSectionIndex - 1,
          currentQuestionIndex: 0,
          showingPartnerQuestions: false,
        };
      }
      return prev;
    });
  }, []);

  const switchToPartner = useCallback(() => {
    setState((prev) => ({ ...prev, showingPartnerQuestions: true, currentQuestionIndex: 0 }));
  }, []);

  const switchToSelf = useCallback(() => {
    setState((prev) => ({ ...prev, showingPartnerQuestions: false, currentQuestionIndex: 0 }));
  }, []);

  // Compute progress per section
  const sectionProgress = useMemo(() => {
    return SF_SECTIONS.map((section) => {
      const visibleQ = section.questions.filter((q) =>
        isQuestionVisible(q, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender)
      );
      const answeredQ = visibleQ.filter((q) => {
        const ans = state.answers[q.id];
        return ans !== null && ans !== undefined && ans !== '';
      });
      return {
        sectionId: section.id as SectionId,
        total: visibleQ.length,
        answered: answeredQ.length,
        isComplete: visibleQ.length > 0 && answeredQ.length >= visibleQ.filter((q) => !q.isOptional).length,
      };
    });
  }, [state.answers, state.sectorGroup, state.sector, state.lifeStage, gender]);

  // Save function
  const saveFn = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const selfTags = deriveTagsFromAnswers(state.answers);
      const partnerTags = derivePartnerTagsFromAnswers(state.answers);

      await fetch('/api/user/soul-fingerprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionAnswers: state.answers,
          ...selfTags,
          partnerTags,
          isComplete: state.isComplete,
        }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('[SoulFingerprint] Save failed:', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [state.answers, state.isComplete]);

  useAutoSave(state.answers, saveFn, 3000);

  return {
    state,
    currentSection,
    currentQuestions,
    visibleSelfQuestions,
    visiblePartnerQuestions,
    hasPartnerQuestions,
    sectionProgress,
    isSaving,
    saveStatus,
    setAnswer,
    goToSection,
    nextSection,
    prevSection,
    switchToPartner,
    switchToSelf,
    saveNow: saveFn,
    totalSections: SF_SECTIONS.length,
  };
}
