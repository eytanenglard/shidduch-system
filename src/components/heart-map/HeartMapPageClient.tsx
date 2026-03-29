'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuestAnswers } from './hooks/useGuestAnswers';
import HeartMapIntro from './HeartMapIntro';
import HeartMapFlow from './HeartMapFlow';
import HeartMapResults from './HeartMapResults';
import HeartMapErrorBoundary from './HeartMapErrorBoundary';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { SFAnswers } from '@/components/soul-fingerprint/types';

import heDict from '@/dictionaries/heart-map/he.json';
import enDict from '@/dictionaries/heart-map/en.json';
import heSfDict from '@/dictionaries/soul-fingerprint/he.json';
import enSfDict from '@/dictionaries/soul-fingerprint/en.json';
import {
  buildOptionTranslationMap,
  createTagTranslator,
  COMPUTED_TAG_TRANSLATIONS_HE,
  COMPUTED_TAG_TRANSLATIONS_EN,
} from '@/components/soul-fingerprint/tagTranslation';

type FlowScreen = 'intro' | 'questionnaire' | 'results';

interface Props {
  locale: string;
}

function getNestedValue(obj: Record<string, unknown>, path: string, gender?: 'MALE' | 'FEMALE' | null): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  if (typeof current === 'string') return current;
  if (current && typeof current === 'object' && 'male' in (current as Record<string, unknown>) && 'female' in (current as Record<string, unknown>)) {
    const gendered = current as { male: string; female: string };
    return gender === 'FEMALE' ? gendered.female : gendered.male;
  }
  return path;
}

export default function HeartMapPageClient({ locale }: Props) {
  const isRTL = locale === 'he';
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { loadAnswers, saveAnswers } = useGuestAnswers();

  const [screen, setScreen] = useState<FlowScreen>('intro');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<SFAnswers | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<SFAnswers>({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Combined dictionary: heart-map + soul-fingerprint (SF keys take priority for questionnaire rendering)
  const dict = useMemo(() => {
    const hmDict = (locale === 'he' ? heDict : enDict) as Record<string, unknown>;
    const sfDict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    return { ...sfDict, heartMap: hmDict } as Record<string, unknown>;
  }, [locale]);

  // Translation function — first try soul-fingerprint dict, then heart-map
  const t = useCallback(
    (key: string) => {
      const sfDict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
      const sfResult = getNestedValue(sfDict, key, gender);
      if (sfResult !== key) return sfResult;

      const hmDict = (locale === 'he' ? heDict : enDict) as Record<string, unknown>;
      return getNestedValue(hmDict, key, gender);
    },
    [locale, gender]
  );

  // Heart-map-specific translation
  const tHm = useCallback(
    (key: string) => {
      const hmDict = (locale === 'he' ? heDict : enDict) as Record<string, unknown>;
      return getNestedValue(hmDict, key, gender);
    },
    [locale, gender]
  );

  // Tag translator — converts raw tag values (e.g. "national_service") to localized labels
  const translateTag = useMemo(() => {
    const sfDict = (locale === 'he' ? heSfDict : enSfDict) as Record<string, unknown>;
    const optionMap = buildOptionTranslationMap(sfDict, gender);
    const computedMap = locale === 'he' ? COMPUTED_TAG_TRANSLATIONS_HE : COMPUTED_TAG_TRANSLATIONS_EN;
    return createTagTranslator(optionMap, computedMap);
  }, [locale, gender]);

  // Redirect authenticated users to the dedicated soul-fingerprint page
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      router.replace(`/${locale}/soul-fingerprint`);
    }
  }, [sessionStatus, router, locale]);

  // Initialize: load localStorage answers (guest only)
  useEffect(() => {
    if (sessionStatus === 'loading' || sessionStatus === 'authenticated') return;

    const init = async () => {
      setIsInitializing(true);

      const localSaved = loadAnswers();
      if (localSaved && Object.keys(localSaved.answers).length > 0) {
        setInitialAnswers(localSaved.answers);
        setGender((prev) => prev ?? localSaved.gender);
      }

      setIsInitializing(false);
    };

    init();
  }, [sessionStatus, loadAnswers]);

  const handleStartQuestionnaire = useCallback((selectedGender: 'MALE' | 'FEMALE', startFresh: boolean) => {
    setGender(selectedGender);
    if (startFresh) {
      setInitialAnswers(null);
    }
    setScreen('questionnaire');
  }, []);

  const handleQuestionnaireComplete = useCallback((answers: SFAnswers) => {
    setFinalAnswers(answers);
    setScreen('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToIntro = useCallback(() => {
    setScreen('intro');
  }, []);

  // Show spinner while session is loading, redirecting, or initializing
  if (sessionStatus === 'loading' || sessionStatus === 'authenticated' || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10 flex items-center justify-center">
        <StandardizedLoadingSpinner text={isRTL ? 'טוען...' : 'Loading...'} />
      </div>
    );
  }

  return (
    <HeartMapErrorBoundary locale={locale}>
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10" dir={isRTL ? 'rtl' : 'ltr'}>
      {screen === 'intro' && (
        <HeartMapIntro
          tHm={tHm}
          locale={locale}
          hasExistingProgress={!!initialAnswers && Object.keys(initialAnswers).length > 0}
          savedGender={gender}
          onStart={handleStartQuestionnaire}
          isAuthenticated={false}
          userName={null}
        />
      )}

      {screen === 'questionnaire' && gender && (
        <HeartMapFlow
          gender={gender}
          initialAnswers={initialAnswers}
          locale={locale}
          t={t}
          tHm={tHm}
          translateTag={translateTag}
          saveToLocalStorage={saveAnswers}
          onComplete={handleQuestionnaireComplete}
          onBack={handleBackToIntro}
          isAuthenticated={false}
        />
      )}

      {screen === 'results' && (
        <HeartMapResults
          answers={finalAnswers}
          gender={gender!}
          locale={locale}
          t={t}
          tHm={tHm}
          translateTag={translateTag}
          isAuthenticated={false}
        />
      )}
    </div>
    </HeartMapErrorBoundary>
  );
}
