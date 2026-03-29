'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSoulFingerprint } from '@/components/soul-fingerprint/hooks/useSoulFingerprint';
import ProgressIndicator from '@/components/soul-fingerprint/components/ProgressIndicator';
import SelfPartnerTabs from '@/components/soul-fingerprint/components/SelfPartnerTabs';
import NavigationButtons from '@/components/soul-fingerprint/components/NavigationButtons';
import AccordionQuestion from './AccordionQuestion';
import HeartMapSectionReminder from './HeartMapSectionReminder';
import FinishLineMode from './FinishLineMode';
import type { SFAnswers } from '@/components/soul-fingerprint/types';
import { deriveTagsFromAnswers, derivePartnerTagsFromAnswers, isQuestionVisible } from '@/components/soul-fingerprint/types';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import type { GuestHeartMapData } from './hooks/useGuestAnswers';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';

interface Props {
  gender: 'MALE' | 'FEMALE';
  initialAnswers: SFAnswers | null;
  locale: string;
  t: (key: string) => string;
  tHm: (key: string) => string;
  translateTag: (tag: string) => string;
  saveToLocalStorage: (data: GuestHeartMapData) => void;
  onComplete: (answers: SFAnswers) => void;
  onBack: () => void;
  isAuthenticated?: boolean;
}

export default function HeartMapFlow({
  gender,
  initialAnswers,
  locale,
  t,
  tHm,
  translateTag,
  saveToLocalStorage,
  onComplete,
  onBack,
  isAuthenticated = false,
}: Props) {
  const isRTL = locale === 'he';

  const [showReminder, setShowReminder] = useState(false);
  const [partnerTransition, setPartnerTransition] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [finishLineMode, setFinishLineMode] = useState(false);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Custom save function that writes to localStorage (and also server if authenticated)
  const customSaveFn = useCallback(
    async (answers: SFAnswers, isComplete: boolean) => {
      // Always save to localStorage as backup
      saveToLocalStorage({
        answers,
        gender,
        currentSectionIndex: 0, // Will be updated below
        startedAt: new Date().toISOString(),
        completedAt: isComplete ? new Date().toISOString() : undefined,
      });

      // Also save to server if authenticated
      if (isAuthenticated) {
        try {
          const tags = deriveTagsFromAnswers(answers);
          const partnerTags = derivePartnerTagsFromAnswers(answers);
          await fetch('/api/user/soul-fingerprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionAnswers: answers,
              isComplete,
              ...tags,
              partnerTags,
            }),
          });
        } catch {
          // Silently fail — localStorage backup is the safety net
        }
      }
    },
    [saveToLocalStorage, gender, isAuthenticated]
  );

  const initialData = useMemo(() => {
    if (!initialAnswers) return null;
    return { sectionAnswers: initialAnswers, isComplete: false };
  }, [initialAnswers]);

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
  } = useSoulFingerprint(gender, initialData, { customSaveFn });

  // Count ALL unanswered required questions across ALL sections
  const globalUnansweredCount = useMemo(() => {
    let count = 0;
    for (const section of SF_SECTIONS) {
      for (const q of section.questions) {
        if (!isQuestionVisible(q, state.answers, state.sectorGroup, state.sector, state.lifeStage, gender)) continue;
        if (q.isOptional) continue;
        const ans = state.answers[q.id];
        if (ans === null || ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
          count++;
        }
      }
    }
    return count;
  }, [state.answers, state.sectorGroup, state.sector, state.lifeStage, gender]);

  const FINISH_LINE_THRESHOLD = 15;
  const showFinishLineBanner = globalUnansweredCount > 0 && globalUnansweredCount <= FINISH_LINE_THRESHOLD && !finishLineMode;

  // Reset active question to first unanswered when section/tab changes
  useEffect(() => {
    const firstUnanswered = currentQuestions.findIndex((q) => {
      if (q.isOptional) return false;
      const ans = state.answers[q.id];
      if (ans === null || ans === undefined || ans === '') return true;
      if (Array.isArray(ans) && ans.length === 0) return true;
      return false;
    });
    setActiveQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setShowValidation(false);
  }, [state.currentSectionIndex, state.showingPartnerQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save section index to localStorage whenever it changes
  const saveCurrentProgress = useCallback(() => {
    saveToLocalStorage({
      answers: state.answers,
      gender,
      currentSectionIndex: state.currentSectionIndex,
      startedAt: new Date().toISOString(),
    });
  }, [state.answers, state.currentSectionIndex, gender, saveToLocalStorage]);

  // Check if a question is answered
  const isQuestionAnswered = useCallback(
    (questionId: string) => {
      const ans = state.answers[questionId];
      if (ans === null || ans === undefined || ans === '') return false;
      if (Array.isArray(ans) && ans.length === 0) return false;
      return true;
    },
    [state.answers]
  );

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

  // Count answered questions for progress display
  const answeredCount = useMemo(() => {
    return currentQuestions.filter((q) => isQuestionAnswered(q.id)).length;
  }, [currentQuestions, isQuestionAnswered]);

  // Compute next section info for the section reminder modal
  const nextSectionInfo = useMemo(() => {
    const nextIdx = state.currentSectionIndex + 1;
    if (nextIdx >= totalSections) return undefined;
    const nextSec = SF_SECTIONS[nextIdx];
    const questionCount = nextSec.questions.filter(
      (q) => q.forSelf && isQuestionVisible(q, state.answers, null, null, null, gender)
    ).length;
    return {
      icon: nextSec.icon,
      titleKey: nextSec.titleKey,
      questionCount,
    };
  }, [state.currentSectionIndex, state.answers, gender, totalSections]);

  // Estimated time remaining (across all remaining sections)
  const estimatedMinutesRemaining = useMemo(() => {
    let totalRemaining = 0;
    for (let i = state.currentSectionIndex; i < totalSections; i++) {
      const sec = SF_SECTIONS[i];
      const qCount = sec.questions.filter(
        (q) => (q.forSelf || q.forPartner) && isQuestionVisible(q, state.answers, null, null, null, gender)
      ).length;
      // Estimate ~15 seconds per unanswered question
      const answeredInSection = sec.questions.filter((q) => {
        const ans = state.answers[q.id];
        return ans !== null && ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0);
      }).length;
      totalRemaining += Math.max(0, qCount - answeredInSection);
    }
    return Math.max(1, Math.round((totalRemaining * 15) / 60));
  }, [state.currentSectionIndex, state.answers, gender, totalSections]);

  // Reset validation when answers change
  useEffect(() => {
    if (showValidation && !hasUnansweredRequired) {
      setShowValidation(false);
    }
  }, [hasUnansweredRequired, showValidation]);

  // Auto-advance: move to next question and scroll into view
  const handleAutoAdvance = useCallback(
    (currentIndex: number) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < currentQuestions.length) {
        setActiveQuestionIndex(nextIndex);
        // Wait for accordion animation (300ms) before scrolling
        setTimeout(() => {
          const el = document.getElementById(`sf-question-${currentQuestions[nextIndex].id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      }
      // If it's the last question, don't auto-advance — user will click Next
    },
    [currentQuestions]
  );

  const handleScrollToUnanswered = useCallback(() => {
    if (unansweredRequiredIds.length === 0) return;
    setShowValidation(true);
    const idx = currentQuestions.findIndex((q) => q.id === unansweredRequiredIds[0]);
    if (idx >= 0) {
      setActiveQuestionIndex(idx);
      setTimeout(() => {
        const el = document.getElementById(`sf-question-${unansweredRequiredIds[0]}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [unansweredRequiredIds, currentQuestions]);

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

    // If on last section, complete
    if (state.currentSectionIndex === totalSections - 1) {
      saveNow().then(() => {
        onComplete(state.answers);
      });
      return;
    }

    // Show section reminder between sections, then advance
    saveCurrentProgress();
    setShowReminder(true);
  }, [
    state.showingPartnerQuestions,
    state.currentSectionIndex,
    state.answers,
    hasPartnerQuestions,
    switchToPartner,
    nextSection,
    totalSections,
    saveNow,
    onComplete,
    saveCurrentProgress,
  ]);

  const handleReminderContinue = useCallback(() => {
    setShowReminder(false);
    nextSection();
  }, [nextSection]);

  const handleBack = useCallback(() => {
    if (state.showingPartnerQuestions) {
      switchToSelf();
      return;
    }
    if (state.currentSectionIndex === 0) {
      onBack();
      return;
    }
    prevSection();
  }, [state.showingPartnerQuestions, state.currentSectionIndex, switchToSelf, prevSection, onBack]);

  const handleTabChange = useCallback(
    (tab: 'self' | 'partner') => {
      if (tab === 'partner') switchToPartner();
      else switchToSelf();
    },
    [switchToPartner, switchToSelf]
  );

  // Swipe gesture handlers for section navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only trigger if horizontal swipe > 80px and more horizontal than vertical
    if (Math.abs(deltaX) < 80 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    const isSwipeForward = isRTL ? deltaX > 0 : deltaX < 0;
    const isSwipeBack = isRTL ? deltaX < 0 : deltaX > 0;

    if (isSwipeForward && !hasUnansweredRequired) {
      handleNext();
    } else if (isSwipeBack) {
      handleBack();
    }
  }, [isRTL, hasUnansweredRequired, handleNext, handleBack]);

  // Finish Line mode — show all remaining unanswered in one view
  if (finishLineMode) {
    return (
      <FinishLineMode
        answers={state.answers}
        gender={gender}
        sectorGroup={state.sectorGroup}
        sector={state.sector}
        lifeStage={state.lifeStage}
        onAnswer={setAnswer}
        onExit={() => setFinishLineMode(false)}
        onComplete={() => {
          saveNow().then(() => {
            onComplete(state.answers);
          });
        }}
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

  return (
    <>
      <div
        className="max-w-xl mx-auto py-6 px-4"
        dir={isRTL ? 'rtl' : 'ltr'}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          {state.currentSectionIndex === 0 && !state.showingPartnerQuestions
            ? (isRTL ? 'חזרה' : 'Back')
            : (isRTL ? 'הקודם' : 'Previous')}
        </button>

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
          {/* Estimated time remaining */}
          <div className={`inline-flex items-center gap-1.5 mt-2 text-xs text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isRTL
                ? `כ-${estimatedMinutesRemaining} ${estimatedMinutesRemaining === 1 ? 'דקה' : 'דקות'} נותרו`
                : `~${estimatedMinutesRemaining} ${estimatedMinutesRemaining === 1 ? 'minute' : 'minutes'} remaining`}
            </span>
          </div>
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

        {/* In-section progress bar */}
        {currentQuestions.length > 0 && (
          <div className="mb-4">
            <div className={`flex items-center justify-between mb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs text-gray-500 font-medium">
                {answeredCount}/{currentQuestions.length} {isRTL ? 'שאלות' : 'questions'}
              </span>
              <span className="text-xs text-gray-400">
                {currentQuestions.length > 0
                  ? `${Math.round((answeredCount / currentQuestions.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentQuestions.length > 0 ? (answeredCount / currentQuestions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions - Accordion */}
        <div className="space-y-3">
          {currentQuestions.map((question, index) => (
            <AccordionQuestion
              key={question.id}
              question={question}
              answers={state.answers}
              onAnswer={setAnswer}
              t={t}
              translateTag={translateTag}
              isRTL={isRTL}
              isActive={activeQuestionIndex === index}
              isAnswered={isQuestionAnswered(question.id)}
              onActivate={() => {
                setActiveQuestionIndex(index);
                setTimeout(() => {
                  const el = document.getElementById(`sf-question-${question.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 350);
              }}
              onDeactivate={() => setActiveQuestionIndex(-1)}
              onAutoAdvance={() => handleAutoAdvance(index)}
              questionNumber={index + 1}
              totalQuestions={currentQuestions.length}
              highlightUnanswered={showValidation}
            />
          ))}
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

        {/* Finish Line banner — appears when < 15 questions remain globally */}
        {showFinishLineBanner && (
          <button
            onClick={() => setFinishLineMode(true)}
            className="w-full mt-6 mb-2 group"
            type="button"
          >
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200 rounded-2xl p-4 transition-all duration-300 hover:border-amber-300 hover:shadow-md">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm font-bold text-amber-800">
                    {t('finishLine.bannerTitle').replace('{{count}}', String(globalUnansweredCount))}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {t('finishLine.bannerSubtitle')}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-amber-400 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
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

      {/* Section Reminder Modal */}
      <HeartMapSectionReminder
        isOpen={showReminder}
        currentSection={state.currentSectionIndex + 1}
        totalSections={totalSections}
        locale={locale}
        tHm={tHm}
        onContinue={handleReminderContinue}
        nextSectionInfo={nextSectionInfo}
        t={t}
        completedSectionAnswered={answeredCount}
        completedSectionTotal={currentQuestions.length}
      />
    </>
  );
}
