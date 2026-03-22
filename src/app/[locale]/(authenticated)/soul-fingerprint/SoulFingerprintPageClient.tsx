'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SoulFingerprintFlow from '@/components/soul-fingerprint/SoulFingerprintFlow';

// Dictionaries loaded client-side for this standalone feature
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
      return path; // Return key if not found
    }
  }
  if (typeof current === 'string') return current;
  // Support gendered text: { male: string, female: string }
  if (current && typeof current === 'object' && 'male' in (current as Record<string, unknown>) && 'female' in (current as Record<string, unknown>)) {
    const gendered = current as { male: string; female: string };
    return gender === 'FEMALE' ? gendered.female : gendered.male;
  }
  return path;
}

export default function SoulFingerprintPageClient({ locale }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dict = useMemo(() => (locale === 'he' ? heDict : enDict) as Record<string, unknown>, [locale]);
  const gender = (session?.user as { gender?: string })?.gender as 'MALE' | 'FEMALE' | null ?? null;

  const t = useCallback(
    (key: string) => getNestedValue(dict, key, gender),
    [dict, gender]
  );

  // Load existing data including previous answers
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/user/soul-fingerprint');
        if (res.ok) {
          const data = await res.json();
          if (data.profileTags) {
            // Map completedAt to isComplete for the flow component
            setInitialData({
              ...data.profileTags,
              isComplete: !!data.profileTags.completedAt,
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
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SoulFingerprintFlow
        gender={gender}
        initialData={initialData as { sectionAnswers?: Record<string, unknown>; isComplete?: boolean } | null}
        locale={locale}
        t={t}
        onComplete={() => router.push(`/${locale}/profile`)}
        onSkip={() => router.push(`/${locale}/profile`)}
      />
    </div>
  );
}
