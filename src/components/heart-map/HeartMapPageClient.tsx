'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useGuestAnswers } from './hooks/useGuestAnswers';
import HeartMapIntro from './HeartMapIntro';
import HeartMapFlow from './HeartMapFlow';
import HeartMapResults from './HeartMapResults';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
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
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated';
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

  // Initialize: load profile + server SF data (authenticated) or localStorage (guest)
  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const init = async () => {
      setIsInitializing(true);

      // 1. Always check localStorage first (available for both guests and authenticated)
      const localSaved = loadAnswers();

      if (session?.user?.id) {
        // Authenticated user: fetch profile gender + existing SF answers from server
        try {
          const [profileRes, sfRes] = await Promise.all([
            fetch('/api/profile'),
            fetch('/api/user/soul-fingerprint'),
          ]);

          // Set gender from profile (authoritative source for authenticated users)
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const g = profileData?.profile?.gender;
            if (g === 'MALE' || g === 'FEMALE') {
              setGender(g);
            }
          }

          // Load existing SF answers from server (takes priority over localStorage)
          if (sfRes.ok) {
            const sfData = await sfRes.json();
            const serverAnswers = sfData?.profileTags?.sectionAnswers as SFAnswers | undefined;
            if (serverAnswers && Object.keys(serverAnswers).length > 0) {
              setInitialAnswers(serverAnswers);
              setIsInitializing(false);
              return; // Server data found — skip localStorage
            }
          }
        } catch {
          // Silently fail — fall through to localStorage
        }
      }

      // Fallback: load from localStorage (guest or no server data)
      if (localSaved && Object.keys(localSaved.answers).length > 0) {
        setInitialAnswers(localSaved.answers);
        // Only set gender from localStorage if not already set by profile
        setGender((prev) => prev ?? localSaved.gender);
      }

      setIsInitializing(false);
    };

    init();
  }, [session?.user?.id, sessionStatus, loadAnswers]);

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

  // Show spinner while session or initial data is loading
  if (sessionStatus === 'loading' || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10 flex items-center justify-center">
        <StandardizedLoadingSpinner text={isRTL ? 'טוען...' : 'Loading...'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10" dir={isRTL ? 'rtl' : 'ltr'}>
      {screen === 'intro' && (
        <HeartMapIntro
          tHm={tHm}
          locale={locale}
          hasExistingProgress={!!initialAnswers && Object.keys(initialAnswers).length > 0}
          savedGender={gender}
          onStart={handleStartQuestionnaire}
          isAuthenticated={isAuthenticated}
          userName={session?.user?.firstName || null}
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
          isAuthenticated={isAuthenticated}
        />
      )}

      {screen === 'results' && (
        <HeartMapResults
          answers={finalAnswers}
          gender={gender!}
          locale={locale}
          t={t}
          tHm={tHm}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
