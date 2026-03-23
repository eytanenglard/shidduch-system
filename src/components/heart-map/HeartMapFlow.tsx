'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSoulFingerprint } from '@/components/soul-fingerprint/hooks/useSoulFingerprint';
import { deriveTagsFromAnswers } from '@/components/soul-fingerprint/types';
import ProgressIndicator from '@/components/soul-fingerprint/components/ProgressIndicator';
import SelfPartnerTabs from '@/components/soul-fingerprint/components/SelfPartnerTabs';
import QuestionRenderer from '@/components/soul-fingerprint/components/QuestionRenderer';
import NavigationButtons from '@/components/soul-fingerprint/components/NavigationButtons';
import HeartMapSectionReminder from './HeartMapSectionReminder';
import type { SFAnswers } from '@/components/soul-fingerprint/types';
import type { GuestHeartMapData } from './hooks/useGuestAnswers';
import { SF_SECTIONS } from '@/components/soul-fingerprint/questions';
import { ArrowLeft } from 'lucide-react';

interface Props {
  gender: 'MALE' | 'FEMALE';
  initialAnswers: SFAnswers | null;
  locale: string;
  t: (key: string) => string;
  tHm: (key: string) => string;
  saveToLocalStorage: (data: GuestHeartMapData) => void;
  onComplete: (answers: SFAnswers) => void;
  onBack: () => void;
}

export default function HeartMapFlow({
  gender,
  initialAnswers,
  locale,
  t,
  tHm,
  saveToLocalStorage,
  onComplete,
  onBack,
}: Props) {
  const isRTL = locale === 'he';

  const [showReminder, setShowReminder] = useState(false);
  const [partnerTransition, setPartnerTransition] = useState(false);

  // Custom save function that writes to localStorage instead of API
  const customSaveFn = useCallback(
    async (answers: SFAnswers, isComplete: boolean) => {
      saveToLocalStorage({
        answers,
        gender,
        currentSectionIndex: 0, // Will be updated below
        startedAt: new Date().toISOString(),
        completedAt: isComplete ? new Date().toISOString() : undefined,
      });
    },
    [saveToLocalStorage, gender]
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

  // Save section index to localStorage whenever it changes
  const saveCurrentProgress = useCallback(() => {
    saveToLocalStorage({
      answers: state.answers,
      gender,
      currentSectionIndex: state.currentSectionIndex,
      startedAt: new Date().toISOString(),
    });
  }, [state.answers, state.currentSectionIndex, gender, saveToLocalStorage]);

  const hasUnansweredRequired = useMemo(() => {
    return currentQuestions.some((q) => {
      if (q.isOptional) return false;
      const ans = state.answers[q.id];
      if (ans === null || ans === undefined || ans === '') return true;
      if (Array.isArray(ans) && ans.length === 0) return true;
      return false;
    });
  }, [currentQuestions, state.answers]);

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
      <div className="max-w-xl mx-auto py-6 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
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

        {/* Questions */}
        <div className="space-y-6">
          {currentQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <QuestionRenderer
                question={question}
                answers={state.answers}
                onAnswer={setAnswer}
                t={t}
                isRTL={isRTL}
              />
            </div>
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
      />
    </>
  );
}
