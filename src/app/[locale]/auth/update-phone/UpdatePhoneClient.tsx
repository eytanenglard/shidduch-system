// src/app/[locale]/auth/update-phone/UpdatePhoneClient.tsx
'use client';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

import { useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { UpdatePhoneDict } from '@/types/dictionaries/auth';

// ======================= ייבואים חדשים =======================
import PhoneNumberInput from '@/components/auth/PhoneNumberInput';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
// =============================================================

interface UpdatePhoneClientProps {
  dict: UpdatePhoneDict;
  // הוספת locale לממשק כדי שנוכל לקבל אותו
  locale: 'he' | 'en';
}

const UpdatePhoneClient = ({ dict, locale }: UpdatePhoneClientProps) => {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [newPhone, setNewPhone] = useState<string | undefined>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      // ======================= ולידציה מעודכנת =======================
      if (!newPhone || !isPossiblePhoneNumber(newPhone)) {
        setError(dict.errors.invalidFormat);
        return;
      }
      // ===============================================================

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/update-and-resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPhone }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || dict.errors.updateFailed);
        }
        // הניווט הוא יחסי ולכן אין צורך ב-locale כאן
        router.push('/auth/verify-phone');
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(dict.errors.unexpected);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [newPhone, router, dict]
  );

   if (sessionStatus === 'loading') {
    // החלפת ה-div הישן
    return <StandardizedLoadingSpinner text={dict.loaderText} />;
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/auth/update-phone');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">{dict.title}</h1>
          <p
            className="text-gray-600 mt-2 text-sm sm:text-base"
            dangerouslySetInnerHTML={{
              __html: dict.description.replace(/\n/g, '<br />'),
            }}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
              {dict.newPhoneLabel}
            </label>
            {/* ======================= החלפת שדה הקלט הישן ======================= */}
            <PhoneNumberInput
              value={newPhone}
              onChange={setNewPhone}
              disabled={isLoading}
              locale={locale}
            />
            {/* ====================================================================== */}
          </div>
          <Button
            type="submit"
            disabled={isLoading || !newPhone}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              dict.submitButton
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Link
            href="/auth/verify-phone"
            className="text-sm text-cyan-600 hover:underline"
          >
            {dict.backToVerificationLink}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpdatePhoneClient;
