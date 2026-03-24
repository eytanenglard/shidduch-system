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

type FlowScreen = 'welcome' | 'questionnaire' | 'complete';

interface Props {
  gender: 'MALE' | 'FEMALE' | null;
  initialData?: { sectionAnswers?: Record<string, unknown>; isComplete?: boolean } | null;
  locale: string;
  t: (key: string) => string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function SoulFingerprintFlow({
  gender,
  initialData,
  locale,
  t,
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

  const handleExpand = useCallback((questionId: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  }, []);

  // Wrap setAnswer to auto-collapse after editing a previously-answered question
  const handleAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      setAnswer(questionId, value);
      // Auto-collapse after a short delay if this was an expanded compact question
      if (expandedQuestionIds.has(questionId)) {
        setTimeout(() => {
          setExpandedQuestionIds((prev) => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
          });
        }, 1200);
      }
    },
    [setAnswer, expandedQuestionIds]
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
    // If on last section, go to complete
    if (state.currentSectionIndex === totalSections - 1) {
      saveNow().then(() => {
        setScreen('complete');
        onComplete?.();
      });
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

            if (answered && !isExpanded) {
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

            // Full view for unanswered or expanded questions
            return (
              <div
                key={question.id}
                ref={isFirstUnanswered ? firstUnansweredRef : undefined}
                id={`sf-question-${question.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-all duration-300"
              >
                <QuestionRenderer
                  question={question}
                  answers={state.answers}
                  onAnswer={handleAnswer}
                  t={t}
                  isRTL={isRTL}
                />
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
