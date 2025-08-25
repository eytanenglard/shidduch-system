// src/app/[locale]/auth/signin/SignInClient.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { SignInDict } from '@/types/dictionaries/auth';

interface SignInClientProps {
  dict: SignInDict;
}

export default function SignInClient({ dict }: SignInClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // @ts-ignore
      const redirectUrl = session?.redirectUrl || '/profile';
      router.push(redirectUrl);
    }
  }, [status, session, router]);

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      switch (errorMessage) {
        case 'CredentialsSignin':
          setError(dict.errors.credentialsSignin);
          break;
        case 'OAuthAccountNotLinked':
          setError(dict.errors.oauthAccountNotLinked);
          break;
        default:
          setError(dict.errors.default.replace('{errorMessage}', errorMessage));
      }
    }
  }, [searchParams, dict.errors]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError(dict.errors.missingFields);
      setIsLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(dict.errors.credentialsSignin);
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    await signIn('google');
  };

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div
        className="flex w-full max-w-md flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-xl"
        style={{ minHeight: '520px' }}
      >
        <div className="mb-4 h-12 w-12">
          <Loader2 className="h-full w-full animate-spin text-cyan-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          {status === 'authenticated'
            ? dict.loader.success
            : dict.loader.loading}
        </h2>
        <p className="text-gray-600">
          {status === 'authenticated'
            ? dict.loader.redirecting
            : dict.loader.checking}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {dict.title}
          </h1>
          <p className="text-gray-600">{dict.subtitle}</p>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p id="form-error-message" className="text-red-600 text-sm">
              {error}
            </p>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 mb-6"
          aria-describedby={error ? 'form-error-message' : undefined}
        >
          <div className="space-y-1">
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {dict.emailLabel}
            </Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
                placeholder={dict.emailPlaceholder}
                required
                aria-required="true"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {dict.passwordLabel}
            </Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
                placeholder={dict.passwordPlaceholder}
                required
                aria-required="true"
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline mt-1"
              >
                {dict.forgotPasswordLink}
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-1" />
                <span>{dict.submitButtonLoading}</span>
              </>
            ) : (
              <span>{dict.submitButton}</span>
            )}
          </Button>
        </form>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              {dict.orDivider}
            </span>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          variant="outline"
          size="lg"
          className="w-full relative border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl flex items-center justify-center gap-3 group"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-1" />
              <span>{dict.googleButtonLoading}</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-gray-700 font-medium">
                {dict.googleButton}
              </span>
            </>
          )}
        </Button>
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {dict.noAccountPrompt}{' '}
            <Link
              href="/auth/register"
              className="text-cyan-600 font-medium hover:text-cyan-700 hover:underline"
            >
              {dict.signUpLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
