// src/app/[locale]/auth/forgot-password/ForgotPasswordClient.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import type { ForgotPasswordDict } from '@/types/dictionaries/auth';

/**
 * הגדרת ה-Props שהקומפוננטה מקבלת.
 * dict: אובייקט התרגומים לשימוש ב-UI.
 * locale: השפה הנוכחית, לצורך שליחתה ל-API.
 */
interface ForgotPasswordClientProps {
  dict: ForgotPasswordDict;
  locale: 'he' | 'en';
}

export default function ForgotPasswordClient({
  dict,
  locale, // קבלת השפה כ-prop
}: ForgotPasswordClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email) {
      setError(dict.errors.missingEmail);
      setIsLoading(false);
      return;
    }

    try {
      // ============================ התיקון המרכזי ============================
      // הוספת פרמטר השפה `locale` לכתובת ה-URL של בקשת ה-API.
      // כך השרת ידע באיזו שפה לשלוח את המייל.
      const response = await fetch(`/api/auth/request-password-reset?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // =====================================================================

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || dict.errors.default);
      }

      // לאחר הצלחה, מעבירים את המשתמש לדף איפוס הסיסמה עם המייל שלו ב-URL.
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.default);
      // חשוב להפסיק את הטעינה במקרה של שגיאה.
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {dict.title}
          </h1>
          <p className="text-gray-600 text-sm">{dict.subtitle}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label
              htmlFor="email-forgot"
              className="block text-sm font-medium text-gray-700"
            >
              {dict.emailLabel}
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                id="email-forgot"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dict.emailPlaceholder}
                required
                className="w-full pr-10 pl-3 py-3"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-3">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>{dict.submitButtonLoading}</span>
              </>
            ) : (
              dict.submitButton
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            {dict.backToSignInLink}
          </Link>
        </div>
      </div>
    </div>
  );
}