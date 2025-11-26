// src/app/components/auth/ResetPasswordForm.tsx
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

const validatePassword = (value: string): string | null => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(value)) {
    return 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.';
  }
  return null;
};

export default function ResetPasswordForm() {
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
    const tokenFromQuery = searchParams.get('token');

    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
    if (tokenFromQuery) {
      setOtp(tokenFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('כתובת המייל חסרה. אנא חזור להתחלה ונסה שנית.');
      setIsLoading(false);
      return;
    }
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('קוד האימות (OTP) חייב להיות בן 6 ספרות.');
      setIsLoading(false);
      return;
    }
    const passValidationError = validatePassword(newPassword);
    if (passValidationError) {
      setPasswordError(passValidationError);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות.');
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

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'אירעה שגיאה באיפוס הסיסמה.');
      }

      setSuccessMessage(
        data.message || 'הסיסמה אופסה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.'
      );
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.push('/auth/signin?reset=success');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative border border-white/50">
      {/* UPDATED: Top Bar Gradient (Teal -> Orange -> Amber) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500"></div>
      
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">איפוס סיסמה</h1>
          <p className="text-gray-600 text-sm">
            הזן את קוד האימות (OTP) שקיבלת במייל ואת הסיסמה החדשה שלך.
          </p>
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
            <AlertDescription id="password-error-message">
              {passwordError}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          // Success message can stay Green as it's a standard status color
          <Alert
            variant="default"
            className="mb-4 bg-green-50 border-green-200 text-green-700"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>הצלחה!</AlertTitle>
            <AlertDescription>
              {successMessage} אתה מועבר לדף ההתחברות...
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
                כתובת מייל (לאימות) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  id="email-reset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  // UPDATED: Focus Ring
                  className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none"
                  disabled={isLoading || !!searchParams.get('email')}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="otp-reset"
                className="block text-sm font-medium text-gray-700"
              >
                קוד אימות (OTP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeySquare className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  id="otp-reset"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  placeholder="xxxxxx"
                  maxLength={6}
                  required
                  // UPDATED: Focus Ring
                  className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none tracking-widest text-center"
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
                סיסמה חדשה <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password-reset"
                  aria-describedby={
                    passwordError ? 'password-error-message' : 'password-hint'
                  }
                  aria-invalid={!!passwordError}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    const validationErr = validatePassword(e.target.value);
                    if (e.target.value && validationErr)
                      setPasswordError(validationErr);
                    else setPasswordError(null);
                  }}
                  placeholder="לפחות 8 תווים, אות גדולה, קטנה ומספר"
                  required
                  // UPDATED: Focus Ring (Error red, else Teal)
                  className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!passwordError && (
                <p id="password-hint" className="mt-1 text-xs text-gray-500">
                  חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirm-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                אימות סיסמה חדשה <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password-reset"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="הזן את הסיסמה החדשה שוב"
                  required
                  // UPDATED: Focus Ring
                  className="w-full pr-10 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
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
              // UPDATED: Button Gradient (Teal -> Orange -> Amber)
              className="w-full py-3 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>מאפס סיסמה...</span>
                </>
              ) : (
                'אפס סיסמה'
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          {/* UPDATED: Link Color (Teal) */}
          <Link
            href="/auth/signin"
            className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}