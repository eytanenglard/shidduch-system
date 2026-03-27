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

export interface SoulFingerprintOptions {
  /** Override the default API save with a custom function (e.g., localStorage for guest mode) */
  customSaveFn?: (answers: SFAnswers, isComplete: boolean) => Promise<void>;
  /** Disable auto-save entirely (useful when save is handled externally) */
  disableAutoSave?: boolean;
}

export function useSoulFingerprint(
  gender: 'MALE' | 'FEMALE' | null,
  initialData?: { sectionAnswers?: SFAnswers; isComplete?: boolean } | null,
  options?: SoulFingerprintOptions
) {
  const [state, setState] = useState<SFState>(() => {
    const savedAnswers = (initialData?.sectionAnswers as SFAnswers) || {};
    const sector = (savedAnswers['anchor_sector'] as SectorValue) || null;
    const sectorGroup = getSectorGroup(sector);
    const lifeStage = (savedAnswers['anchor_life_stage'] as LifeStageValue) || null;

    // Resume from last incomplete section when returning with saved data
    let startSection = 0;
    if (Object.keys(savedAnswers).length > 0 && !initialData?.isComplete) {
      for (let i = 0; i < SF_SECTIONS.length; i++) {
        const visibleQ = SF_SECTIONS[i].questions.filter((q) =>
          isQuestionVisible(q, savedAnswers, sectorGroup, sector, lifeStage, gender)
        );
        const requiredQ = visibleQ.filter((q) => !q.isOptional);
        const answered = requiredQ.filter((q) => {
          const ans = savedAnswers[q.id];
          return ans !== null && ans !== undefined && ans !== '';
        });
        if (answered.length < requiredQ.length) {
          startSection = i;
          break;
        }
        if (i === SF_SECTIONS.length - 1) startSection = i;
      }
    }

    return {
      currentSectionIndex: startSection,
      currentQuestionIndex: 0,
      answers: savedAnswers,
      sectorGroup,
      sector,
      lifeStage,
      isComplete: initialData?.isComplete || false,
      showingPartnerQuestions: false,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const scrollToTop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const goToSection = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentSectionIndex: index,
      currentQuestionIndex: 0,
      showingPartnerQuestions: false,
    }));
    scrollToTop();
  }, [scrollToTop]);

  const allRequiredAnswered = useCallback(() => {
    return SF_SECTIONS.every((section) => {
      const visibleQ = section.questions.filter((q) =>
        isQuestionVisible(q, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender)
      );
      const requiredQ = visibleQ.filter((q) => !q.isOptional);
      return requiredQ.every((q) => {
        const ans = state.answers[q.id];
        if (ans === null || ans === undefined || ans === '') return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        return true;
      });
    });
  }, [state.answers, state.sectorGroup, state.sector, state.lifeStage, gender]);

  const markComplete = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true }));
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
      return prev;
    });
    scrollToTop();
  }, [scrollToTop]);

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
    scrollToTop();
  }, [scrollToTop]);

  const switchToPartner = useCallback(() => {
    setState((prev) => ({ ...prev, showingPartnerQuestions: true, currentQuestionIndex: 0 }));
    scrollToTop();
  }, [scrollToTop]);

  const switchToSelf = useCallback(() => {
    setState((prev) => ({ ...prev, showingPartnerQuestions: false, currentQuestionIndex: 0 }));
    scrollToTop();
  }, [scrollToTop]);

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

  // Save function — uses customSaveFn if provided, otherwise default API save
  // overrideComplete allows callers to force isComplete=true without waiting for state update
  const saveFn = useCallback(async (overrideComplete?: boolean) => {
    const isComplete = overrideComplete ?? state.isComplete;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      if (options?.customSaveFn) {
        await options.customSaveFn(state.answers, isComplete);
      } else {
        const selfTags = deriveTagsFromAnswers(state.answers);
        const partnerTags = derivePartnerTagsFromAnswers(state.answers);

        await fetch('/api/user/soul-fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionAnswers: state.answers,
            ...selfTags,
            partnerTags,
            isComplete,
          }),
        });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('[SoulFingerprint] Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setIsSaving(false);
    }
  }, [state.answers, state.isComplete, options?.customSaveFn]);

  useAutoSave(state.answers, saveFn, options?.disableAutoSave ? 0 : 3000);

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
    allRequiredAnswered,
    markComplete,
  };
}
