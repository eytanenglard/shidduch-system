// src/app/[locale]/auth/reset-password/ResetPasswordClient.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  KeySquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import type { ResetPasswordDict } from '@/types/dictionaries/auth';

interface ResetPasswordClientProps {
  dict: ResetPasswordDict;
}

const validatePassword = (
  value: string,
  validationMessage: string
): string | null => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(value)) {
    return validationMessage;
  }
  return null;
};

export default function ResetPasswordClient({
  dict,
}: ResetPasswordClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);

    if (!email) {
      setError(dict.errors.missingEmail);
      setIsLoading(false);
      return;
    }
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError(dict.errors.invalidOtp);
      setIsLoading(false);
      return;
    }
    const passValidationError = validatePassword(
      newPassword,
      dict.passwordValidation.length
    );
    if (passValidationError) {
      setPasswordError(passValidationError);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(dict.errors.passwordsMismatch);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || dict.errors.default);

      setSuccessMessage(dict.successMessage);
      setTimeout(() => router.push('/auth/signin?reset=success'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.default);
    } finally {
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
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {passwordError && !error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאת סיסמה</AlertTitle>
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>הצלחה!</AlertTitle>
            <AlertDescription>
              {successMessage} {dict.successRedirect}
            </AlertDescription>
          </Alert>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="email-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.emailLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  id="email-reset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.emailPlaceholder}
                  required
                  disabled={isLoading || !!searchParams.get('email')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="otp-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.otpLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeySquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  id="otp-reset"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  placeholder={dict.otpPlaceholder}
                  maxLength={6}
                  required
                  disabled={isLoading}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="new-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.newPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password-reset"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={(e) =>
                    setPasswordError(
                      validatePassword(
                        e.target.value,
                        dict.passwordValidation.length
                      )
                    )
                  }
                  placeholder={dict.newPasswordPlaceholder}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  aria-label={
                    showPassword ? dict.hidePasswordAria : dict.showPasswordAria
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!passwordError && (
                <p className="mt-1 text-xs text-gray-500">
                  {dict.passwordHint}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="confirm-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.confirmPasswordLabel}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password-reset"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={dict.confirmPasswordPlaceholder}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  aria-label={
                    showConfirmPassword
                      ? dict.hidePasswordAria
                      : dict.showPasswordAria
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !!passwordError ||
                !otp ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="w-full"
            >
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
        )}

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
