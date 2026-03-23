'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGuestAnswers } from './hooks/useGuestAnswers';
import HeartMapIntro from './HeartMapIntro';
import HeartMapFlow from './HeartMapFlow';
import HeartMapResults from './HeartMapResults';
import type { SFAnswers } from '@/components/soul-fingerprint/types';

import heDict from '@/dictionaries/heart-map/he.json';
import enDict from '@/dictionaries/heart-map/en.json';
import heSfDict from '@/dictionaries/soul-fingerprint/he.json';
import enSfDict from '@/dictionaries/soul-fingerprint/en.json';

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
  const { loadAnswers, saveAnswers } = useGuestAnswers();

  const [screen, setScreen] = useState<FlowScreen>('intro');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [initialAnswers, setInitialAnswers] = useState<SFAnswers | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<SFAnswers>({});

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

  // Restore progress on mount
  useEffect(() => {
    const saved = loadAnswers();
    if (saved && Object.keys(saved.answers).length > 0) {
      setGender(saved.gender);
      setInitialAnswers(saved.answers);
      // Don't auto-jump to questionnaire — let user choose to resume from intro
    }
  }, [loadAnswers]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10" dir={isRTL ? 'rtl' : 'ltr'}>
      {screen === 'intro' && (
        <HeartMapIntro
          tHm={tHm}
          locale={locale}
          hasExistingProgress={!!initialAnswers && Object.keys(initialAnswers).length > 0}
          savedGender={gender}
          onStart={handleStartQuestionnaire}
        />
      )}

      {screen === 'questionnaire' && gender && (
        <HeartMapFlow
          gender={gender}
          initialAnswers={initialAnswers}
          locale={locale}
          t={t}
          tHm={tHm}
          saveToLocalStorage={saveAnswers}
          onComplete={handleQuestionnaireComplete}
          onBack={handleBackToIntro}
        />
      )}

      {screen === 'results' && (
        <HeartMapResults
          answers={finalAnswers}
          gender={gender!}
          locale={locale}
          t={t}
          tHm={tHm}
        />
      )}
    </div>
  );
}
