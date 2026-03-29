'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSoulFingerprint } from './hooks/useSoulFingerprint';
import { deriveTagsFromAnswers } from './types';
import SoulFingerprintWelcome from './SoulFingerprintWelcome';
import SoulFingerprintComplete from './SoulFingerprintComplete';
import ProgressIndicator from './components/ProgressIndicator';
import SelfPartnerTabs from './components/SelfPartnerTabs';
import QuestionRenderer from './components/QuestionRenderer';
import CompactAnswer from './components/CompactAnswer';
import NavigationButtons from './components/NavigationButtons';
import { SF_SECTIONS } from './questions';
import { Check } from 'lucide-react';

type FlowScreen = 'welcome' | 'questionnaire' | 'complete';

interface Props {
  gender: 'MALE' | 'FEMALE' | null;
  initialData?: { sectionAnswers?: Record<string, unknown>; isComplete?: boolean } | null;
  locale: string;
  t: (key: string) => string;
  translateTag: (tag: string) => string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function SoulFingerprintFlow({
  gender,
  initialData,
  locale,
  t,
  translateTag,
  onComplete,
  onSkip,
}: Props) {
  const isRTL = locale === 'he';

  const [screen, setScreen] = useState<FlowScreen>(() => {
    if (initialData?.isComplete) return 'complete';
    if (initialData?.sectionAnswers && Object.keys(initialData.sectionAnswers).length > 0)
      return 'questionnaire';
    return 'welcome';
  });

  const [partnerTransition, setPartnerTransition] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const compactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(() => {
    return !!(initialData?.sectionAnswers && Object.keys(initialData.sectionAnswers).length > 0 && !initialData?.isComplete);
  });
  const firstUnansweredRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const {
    state,
    currentSection,
    currentQuestions,
    visibleSelfQuestions,
    visiblePartnerQuestions,
    hasPartnerQuestions,
    sectionProgress,
    saveStatus,
    setAnswer,
    goToSection,
    nextSection,
    prevSection,
    switchToPartner,
    switchToSelf,
    saveNow,
    totalSections,
    allRequiredAnswered,
    markComplete,
  } = useSoulFingerprint(gender, initialData as { sectionAnswers?: Record<string, string | string[] | number | null>; isComplete?: boolean } | null);

  // Check which required questions in the current view are unanswered
  const unansweredRequiredIds = useMemo(() => {
    return currentQuestions
      .filter((q) => {
        if (q.isOptional) return false;
        const ans = state.answers[q.id];
        if (ans === null || ans === undefined || ans === '') return true;
        if (Array.isArray(ans) && ans.length === 0) return true;
        return false;
      })
      .map((q) => q.id);
  }, [currentQuestions, state.answers]);

  const hasUnansweredRequired = unansweredRequiredIds.length > 0;

  // Check if a question has a meaningful answer
  const hasAnswer = useCallback((questionId: string) => {
    const ans = state.answers[questionId];
    if (ans === null || ans === undefined || ans === '') return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  }, [state.answers]);

  // Count total remaining unanswered across all sections
  const totalRemainingCount = useMemo(() => {
    return sectionProgress.reduce((sum, s) => sum + (s.total - s.answered), 0);
  }, [sectionProgress]);

  // Auto-scroll to first unanswered question on mount (for returning users)
  useEffect(() => {
    if (hasScrolledRef.current || screen !== 'questionnaire') return;
    const hasExistingAnswers = initialData?.sectionAnswers && Object.keys(initialData.sectionAnswers).length > 0;
    if (!hasExistingAnswers) return;

    const timer = setTimeout(() => {
      if (firstUnansweredRef.current && !hasScrolledRef.current) {
        firstUnansweredRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledRef.current = true;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [screen, initialData]);

  // Reset scroll tracking and expand state when section or tab changes
  useEffect(() => {
    hasScrolledRef.current = false;
    setExpandedQuestionIds(new Set());
    setActiveQuestionId(null);
    if (compactTimerRef.current) {
      clearTimeout(compactTimerRef.current);
      compactTimerRef.current = null;
    }
  }, [state.currentSectionIndex, state.showingPartnerQuestions]);

  // Auto-scroll to first unanswered after section/tab change
  useEffect(() => {
    if (screen !== 'questionnaire') return;
    const timer = setTimeout(() => {
      if (firstUnansweredRef.current && !hasScrolledRef.current) {
        firstUnansweredRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledRef.current = true;
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state.currentSectionIndex, state.showingPartnerQuestions, screen]);

  // Deactivate a question (allow it to compact) and scroll to next unanswered
  const deactivateQuestion = useCallback((questionId: string) => {
    if (compactTimerRef.current) {
      clearTimeout(compactTimerRef.current);
      compactTimerRef.current = null;
    }
    setActiveQuestionId((prev) => (prev === questionId ? null : prev));
    setExpandedQuestionIds((prev) => {
      if (!prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });

    // Scroll to next unanswered question after compact animation
    setTimeout(() => {
      const idx = currentQuestions.findIndex(q => q.id === questionId);
      if (idx < 0) return;
      // Find next unanswered after this question
      for (let i = idx + 1; i < currentQuestions.length; i++) {
        const ans = state.answers[currentQuestions[i].id];
        const isUnanswered = ans === null || ans === undefined || ans === '' ||
          (Array.isArray(ans) && ans.length === 0);
        if (isUnanswered || expandedQuestionIds.has(currentQuestions[i].id)) {
          const el = document.getElementById(`sf-question-${currentQuestions[i].id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }, 350);
  }, [currentQuestions, state.answers, expandedQuestionIds]);

  // Schedule auto-compact after a delay
  const scheduleCompact = useCallback((questionId: string, delayMs: number) => {
    if (compactTimerRef.current) clearTimeout(compactTimerRef.current);
    compactTimerRef.current = setTimeout(() => {
      deactivateQuestion(questionId);
      compactTimerRef.current = null;
    }, delayMs);
  }, [deactivateQuestion]);

  // Activate a question (prevent it from compacting, deactivate previous)
  const activateQuestion = useCallback((questionId: string) => {
    setActiveQuestionId((prev) => {
      if (prev && prev !== questionId) {
        // Deactivate the previous question
        setExpandedQuestionIds((ids) => {
          if (!ids.has(prev)) return ids;
          const next = new Set(ids);
          next.delete(prev);
          return next;
        });
      }
      return questionId;
    });
    if (compactTimerRef.current) {
      clearTimeout(compactTimerRef.current);
      compactTimerRef.current = null;
    }
  }, []);

  // Expand a CompactAnswer for editing
  const handleExpand = useCallback((questionId: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
    activateQuestion(questionId);
  }, [activateQuestion]);

  // "Done" button handler — explicitly compact multiSelect/openText/slider
  const handleDone = useCallback((questionId: string) => {
    deactivateQuestion(questionId);
  }, [deactivateQuestion]);

  // Answer handler with type-specific compaction logic
  const handleAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      setAnswer(questionId, value);
      activateQuestion(questionId);

      const question = currentQuestions.find((q) => q.id === questionId);
      if (!question) return;

      switch (question.type) {
        case 'singleChoice': {
          // Auto-compact after 600ms (unless option has custom input)
          const selectedOpt = question.options?.find((o) => o.value === value);
          if (value && !selectedOpt?.isCustomInput) {
            scheduleCompact(questionId, 600);
          }
          break;
        }
        case 'multiSelect': {
          // Auto-compact only when maxSelections reached
          if (
            Array.isArray(value) &&
            question.maxSelections &&
            value.length >= question.maxSelections
          ) {
            scheduleCompact(questionId, 800);
          }
          // Otherwise: stay open, wait for "Done" or click-away
          break;
        }
        case 'slider': {
          // Auto-compact after 1200ms of last interaction
          scheduleCompact(questionId, 1200);
          break;
        }
        case 'openText': {
          // Don't auto-compact — wait for "Done" or click-away
          break;
        }
      }
    },
    [setAnswer, activateQuestion, scheduleCompact, currentQuestions]
  );

  // Check if a question should render as CompactAnswer
  const shouldCompact = useCallback(
    (questionId: string, answered: boolean, isExpanded: boolean) => {
      if (!answered) return false;
      if (isExpanded) return false;
      if (activeQuestionId === questionId) return false;
      return true;
    },
    [activeQuestionId]
  );

  const handleScrollToUnanswered = useCallback(() => {
    if (unansweredRequiredIds.length === 0) return;
    const el = document.getElementById(`sf-question-${unansweredRequiredIds[0]}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-red-300', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-red-300', 'ring-offset-2'), 2000);
    }
  }, [unansweredRequiredIds]);

  const handleStart = useCallback(() => {
    setScreen('questionnaire');
  }, []);

  const handleNext = useCallback(() => {
    // If on self tab and there are partner questions, switch to partner with animation
    if (!state.showingPartnerQuestions && hasPartnerQuestions) {
      setPartnerTransition(true);
      setTimeout(() => {
        switchToPartner();
        setPartnerTransition(false);
      }, 600);
      return;
    }
    // If on last section, validate and go to complete
    if (state.currentSectionIndex === totalSections - 1) {
      if (allRequiredAnswered()) {
        markComplete();
        saveNow(true).then(() => {
          setScreen('complete');
          onComplete?.();
        });
      } else {
        handleScrollToUnanswered();
      }
      return;
    }
    // Otherwise next section
    nextSection();
  }, [
    state.showingPartnerQuestions,
    state.currentSectionIndex,
    hasPartnerQuestions,
    switchToPartner,
    nextSection,
    totalSections,
    saveNow,
    onComplete,
    allRequiredAnswered,
    markComplete,
    handleScrollToUnanswered,
  ]);

  const handleBack = useCallback(() => {
    if (state.showingPartnerQuestions) {
      switchToSelf();
      return;
    }
    prevSection();
  }, [state.showingPartnerQuestions, switchToSelf, prevSection]);

  const handleTabChange = useCallback(
    (tab: 'self' | 'partner') => {
      if (tab === 'partner') switchToPartner();
      else switchToSelf();
    },
    [switchToPartner, switchToSelf]
  );

  const handleEditFromComplete = useCallback(() => {
    goToSection(0);
    setScreen('questionnaire');
  }, [goToSection]);

  // Welcome screen
  if (screen === 'welcome') {
    return (
      <SoulFingerprintWelcome
        onStart={handleStart}
        onSkip={() => onSkip?.()}
        t={t}
        isRTL={isRTL}
      />
    );
  }

  // Complete screen
  if (screen === 'complete') {
    const tags = deriveTagsFromAnswers(state.answers);
    return (
      <SoulFingerprintComplete
        tags={tags}
        onEdit={handleEditFromComplete}
        onContinue={() => onComplete?.()}
        t={t}
        translateTag={translateTag}
        isRTL={isRTL}
      />
    );
  }

  // Partner transition overlay
  if (partnerTransition) {
    return (
      <div className="max-w-xl mx-auto py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
            <span className="text-2xl">💞</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
            {t('labels.partnerTransitionTitle')}
          </h2>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            {t('labels.partnerTransitionSubtitle')}
          </p>
        </div>
      </div>
    );
  }

  // Questionnaire screen
  return (
    <div className="max-w-xl mx-auto py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Progress */}
      <ProgressIndicator
        sections={sectionProgress}
        currentIndex={state.currentSectionIndex}
        onSectionClick={goToSection}
        t={t}
        isRTL={isRTL}
      />

      {/* Section header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          <span className="mr-2">{currentSection.icon}</span>
          {t(currentSection.titleKey)}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{t(currentSection.subtitleKey)}</p>
      </div>

      {/* Self/Partner tabs */}
      <SelfPartnerTabs
        activeTab={state.showingPartnerQuestions ? 'partner' : 'self'}
        onTabChange={handleTabChange}
        hasPartnerQuestions={hasPartnerQuestions}
        selfCount={visibleSelfQuestions.length}
        partnerCount={visiblePartnerQuestions.length}
        t={t}
        isRTL={isRTL}
      />

      {/* Partner intro prompt */}
      {state.showingPartnerQuestions && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm font-medium text-teal-700">{t('labels.partnerSectionIntro')}</p>
          <p className="text-xs text-teal-600 mt-1">{t('labels.partnerSectionSubtitle')}</p>
        </div>
      )}

      {/* Resume banner */}
      {showResumeBanner && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">👋</span>
            <p className="text-sm text-teal-700 truncate">
              {t('labels.resumeBanner').replace('{{count}}', String(totalRemainingCount))}
            </p>
          </div>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="text-teal-400 hover:text-teal-600 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Questions — compact for answered, full for unanswered */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {currentQuestions.map((question, idx) => {
            const answered = hasAnswer(question.id);
            const isExpanded = expandedQuestionIds.has(question.id);
            // Find first unanswered for auto-scroll ref
            const isFirstUnanswered = !answered &&
              currentQuestions.findIndex((q) => !hasAnswer(q.id)) === idx;

            if (shouldCompact(question.id, answered, isExpanded)) {
              // Compact view for answered questions
              return (
                <CompactAnswer
                  key={question.id}
                  question={question}
                  answer={state.answers[question.id] as string | string[] | number | null}
                  onExpand={() => handleExpand(question.id)}
                  t={t}
                  isRTL={isRTL}
                />
              );
            }

            // Show "Done" button for multiSelect/openText/slider when the user has a value
            const showDone =
              activeQuestionId === question.id &&
              answered &&
              (question.type === 'multiSelect' || question.type === 'openText' || question.type === 'slider');

            // Full view for unanswered or expanded questions
            return (
              <div
                key={question.id}
                ref={isFirstUnanswered ? firstUnansweredRef : undefined}
                id={`sf-question-${question.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-300"
                onClick={() => {
                  if (activeQuestionId !== question.id) {
                    activateQuestion(question.id);
                  }
                }}
              >
                <QuestionRenderer
                  question={question}
                  answers={state.answers}
                  onAnswer={handleAnswer}
                  t={t}
                  isRTL={isRTL}
                />
                {showDone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDone(question.id);
                    }}
                    className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 transition-all duration-200 flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Check className="w-4 h-4" />
                    {isRTL ? 'סיימתי' : 'Done'}
                  </button>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {currentQuestions.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">
            {state.showingPartnerQuestions
              ? t('labels.noPartnerQuestions')
              : t('labels.noSelfQuestions')}
          </p>
        </div>
      )}

      {/* Navigation */}
      <NavigationButtons
        onNext={handleNext}
        onBack={handleBack}
        canGoBack={state.currentSectionIndex > 0 || state.showingPartnerQuestions}
        isLastSection={state.currentSectionIndex === totalSections - 1}
        isPartnerTab={state.showingPartnerQuestions}
        hasPartnerQuestions={hasPartnerQuestions}
        saveStatus={saveStatus}
        hasUnansweredRequired={hasUnansweredRequired}
        unansweredCount={unansweredRequiredIds.length}
        onScrollToUnanswered={handleScrollToUnanswered}
        t={t}
        isRTL={isRTL}
      />
    </div>
  );
}
