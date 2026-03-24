'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SoulFingerprintFlow from '@/components/soul-fingerprint/SoulFingerprintFlow';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import heDict from '@/dictionaries/soul-fingerprint/he.json';
import enDict from '@/dictionaries/soul-fingerprint/en.json';

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

const SKIP_DIALOG_TEXTS = {
  he: {
    title: 'בטוח/ה?',
    description: 'בלי מפת הנשמה, השדכנים לא יוכלו להכיר אותך ולא תקבל/י הצעות. תוכל/י למלא אותה מאוחר יותר מהפרופיל.',
    cancel: 'בואו נמלא',
    confirm: 'כן, אדלג',
  },
  en: {
    title: 'Are you sure?',
    description: 'Without the Soul Map, matchmakers won\'t be able to know you and you won\'t receive suggestions. You can fill it out later from your profile.',
    cancel: 'Let\'s fill it out',
    confirm: 'Yes, skip',
  },
};

export default function HeartMapStepClient({ locale }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const dict = useMemo(() => (locale === 'he' ? heDict : enDict) as Record<string, unknown>, [locale]);
  const gender = (session?.user as { gender?: string })?.gender as 'MALE' | 'FEMALE' | null ?? null;
  const skipTexts = locale === 'he' ? SKIP_DIALOG_TEXTS.he : SKIP_DIALOG_TEXTS.en;

  const t = useCallback(
    (key: string) => getNestedValue(dict, key, gender),
    [dict, gender]
  );

  // Load existing soul fingerprint data (may have been imported from guest heart-map)
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/user/soul-fingerprint');
        if (res.ok) {
          const data = await res.json();
          if (data.profileTags) {
            // If already completed, redirect straight to profile
            if (data.profileTags.completedAt) {
              router.replace(`/${locale}/profile`);
              return;
            }
            setInitialData({
              ...data.profileTags,
              isComplete: false,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load soul fingerprint data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router, locale]);

  const handleComplete = useCallback(() => {
    router.push(`/${locale}/profile`);
  }, [router, locale]);

  const handleSkipRequest = useCallback(() => {
    setShowSkipDialog(true);
  }, []);

  const handleSkipConfirm = useCallback(() => {
    setShowSkipDialog(false);
    router.push(`/${locale}/profile`);
  }, [router, locale]);

  if (isLoading) {
    return (
      <StandardizedLoadingSpinner
        text={locale === 'he' ? 'טוען את מפת הנשמה...' : 'Loading your Soul Map...'}
        subtext={locale === 'he' ? 'מכינים את המסע עבורך' : 'Preparing your journey'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SoulFingerprintFlow
        gender={gender}
        initialData={initialData as { sectionAnswers?: Record<string, unknown>; isComplete?: boolean } | null}
        locale={locale}
        t={t}
        onComplete={handleComplete}
        onSkip={handleSkipRequest}
      />

      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{skipTexts.title}</AlertDialogTitle>
            <AlertDialogDescription>{skipTexts.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={locale === 'he' ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel>{skipTexts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSkipConfirm}
              className="bg-gray-500 hover:bg-gray-600"
            >
              {skipTexts.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
