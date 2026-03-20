'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSoulFingerprint } from './hooks/useSoulFingerprint';
import { deriveTagsFromAnswers } from './types';
import SoulFingerprintWelcome from './SoulFingerprintWelcome';
import SoulFingerprintComplete from './SoulFingerprintComplete';
import ProgressIndicator from './components/ProgressIndicator';
import SelfPartnerTabs from './components/SelfPartnerTabs';
import QuestionRenderer from './components/QuestionRenderer';
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

  const handleStart = useCallback(() => {
    setScreen('questionnaire');
  }, []);

  const handleNext = useCallback(() => {
    // If on self tab and there are partner questions, switch to partner
    if (!state.showingPartnerQuestions && hasPartnerQuestions) {
      switchToPartner();
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
              ? 'No partner questions for this section'
              : 'No questions match your profile for this section'}
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
        t={t}
        isRTL={isRTL}
      />
    </div>
  );
}
