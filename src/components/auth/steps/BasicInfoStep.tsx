// src/components/auth/steps/BasicInfoStep.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ListChecks,
  LogIn,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface BasicInfoStepProps {
  dict: RegisterStepsDict['steps']['basicInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  validationDict: RegisterStepsDict['validationErrors'];
  locale: 'he' | 'en';
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== '' && emailRegex.test(email);
};

// Fixed: Now allows special characters (!@#$%^&* etc.)
const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// New: Name validation — allows Hebrew, English, spaces, hyphens, apostrophes
const isValidName = (name: string): boolean => {
  if (name.trim().length < 2) return false;
  if (name.trim().length > 50) return false;
  // Allow Hebrew, English, spaces, hyphens, apostrophes
  const nameRegex = /^[\u0590-\u05FFa-zA-Z\s\-']+$/;
  return nameRegex.test(name.trim());
};

// ============================================================================
// EMAIL TYPO DETECTION
// ============================================================================

const COMMON_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'walla.co.il': 'walla.co.il',
  'wallla.co.il': 'walla.co.il',
  'wall.co.il': 'walla.co.il',
};

function detectEmailTypo(email: string): string | null {
  const atIndex = email.indexOf('@');
  if (atIndex < 0) return null;
  const domain = email.slice(atIndex + 1).toLowerCase();
  const suggestion = COMMON_DOMAINS[domain];
  if (suggestion && suggestion !== domain) {
    return email.slice(0, atIndex + 1) + suggestion;
  }
  return null;
}

// ============================================================================
// PASSWORD STRENGTH
// ============================================================================

type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

const GOOGLE_SIGNUP_SUGGESTED_ERRORS = [
  'DB_CONNECTION_ERROR',
  'DB_INIT_ERROR',
  'P1001',
  'P1002',
  'P1003',
  'P1008',
  'P1017',
];

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  dict,
  consentDict,
  validationDict,
  locale,
}) => {
  const { data, updateField, prevStep, proceedToEmailVerification } =
    useRegistration();
  const router = useRouter();

  // Form state
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showGoogleSuggestion, setShowGoogleSuggestion] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAttemptingLogin, setIsAttemptingLogin] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Existing user state — shown when EMAIL_EXISTS
  const [showExistingUserDialog, setShowExistingUserDialog] = useState(false);

  const isRTL = locale === 'he';
  const isAnyLoading =
    isLoading || isAttemptingLogin || isGoogleLoading || isAppleLoading;

  // ============================================================================
  // OAUTH HANDLERS
  // ============================================================================

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: `/${locale}/auth/register`,
        redirect: true,
      });
    } catch (error) {
      console.error('Google signup error:', error);
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setIsAppleLoading(true);
    try {
      await signIn('apple', {
        callbackUrl: `/${locale}/auth/register`,
        redirect: true,
      });
    } catch (error) {
      console.error('Apple signup error:', error);
      setIsAppleLoading(false);
    }
  };

  // ============================================================================
  // EXISTING USER: Attempt login with provided credentials
  // ============================================================================

  const handleAttemptLoginWithExistingEmail = useCallback(async () => {
    setIsAttemptingLogin(true);
    setApiError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Login failed — show options dialog instead of auto-redirecting
        setShowExistingUserDialog(true);
        setIsAttemptingLogin(false);
        return;
      }

      if (result?.ok) {
        // Login succeeded — redirect based on session
        router.push(`/${locale}/auth/register`);
      }
    } catch (error) {
      console.error('Login attempt error:', error);
      setShowExistingUserDialog(true);
    } finally {
      setIsAttemptingLogin(false);
    }
  }, [data.email, data.password, locale, router]);

  const handleGoToForgotPassword = () => {
    router.push(
      `/${locale}/auth/forgot-password?email=${encodeURIComponent(data.email)}`
    );
  };

  const handleDismissExistingUser = () => {
    setShowExistingUserDialog(false);
    setApiError(null);
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleRegisterSubmit = async () => {
    setApiError(null);
    setMissingFields([]);
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');
    setShowGoogleSuggestion(false);
    setShowExistingUserDialog(false);

    let hasError = false;
    const currentMissing: string[] = [];

    // Email validation
    if (!isValidEmail(data.email)) {
      setEmailError(dict.errors.invalidEmail);
      currentMissing.push(validationDict.fields.email);
      hasError = true;
    }

    // Password validation (now accepts special characters)
    if (!isValidPassword(data.password)) {
      setPasswordError(dict.errors.invalidPassword);
      currentMissing.push(validationDict.fields.password);
      hasError = true;
    }

    // First name validation — min 2 chars, valid characters
    if (!data.firstName.trim()) {
      setFirstNameError(validationDict.fields.firstName);
      currentMissing.push(validationDict.fields.firstName);
      hasError = true;
    } else if (!isValidName(data.firstName)) {
      setFirstNameError(
        dict.errors.invalidName ||
          (locale === 'he'
            ? 'שם פרטי חייב להכיל לפחות 2 אותיות'
            : 'First name must be at least 2 letters')
      );
      currentMissing.push(validationDict.fields.firstName);
      hasError = true;
    }

    // Last name validation
    if (!data.lastName.trim()) {
      setLastNameError(validationDict.fields.lastName);
      currentMissing.push(validationDict.fields.lastName);
      hasError = true;
    } else if (!isValidName(data.lastName)) {
      setLastNameError(
        dict.errors.invalidName ||
          (locale === 'he'
            ? 'שם משפחה חייב להכיל לפחות 2 אותיות'
            : 'Last name must be at least 2 letters')
      );
      currentMissing.push(validationDict.fields.lastName);
      hasError = true;
    }

    if (hasError) {
      setMissingFields(currentMissing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/register?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          language: data.language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorCode = result.errorCode || '';

        // Rate limit: show friendly countdown
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          setRateLimitCountdown(retryAfter);
          const timer = setInterval(() => {
            setRateLimitCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          throw new Error(
            locale === 'he'
              ? `יותר מדי ניסיונות. אנא המתן ${retryAfter} שניות.`
              : `Too many attempts. Please wait ${retryAfter} seconds.`
          );
        }

        if (errorCode === 'EMAIL_EXISTS') {
          // Instead of auto-login, attempt login silently
          setIsLoading(false);
          await handleAttemptLoginWithExistingEmail();
          return;
        }

        if (
          GOOGLE_SIGNUP_SUGGESTED_ERRORS.includes(errorCode) ||
          result.error?.includes('שגיאת חיבור') ||
          result.error?.includes('P1001')
        ) {
          setShowGoogleSuggestion(true);
        }

        throw new Error(result.error || dict.errors.default);
      }

      proceedToEmailVerification(result.email);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Auto-login overlay */}
      <AnimatePresence>
        {isAttemptingLogin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
              <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {dict.existingUser?.loggingIn ||
                  (locale === 'he' ? 'מזהים אותך...' : 'Recognizing you...')}
              </h3>
              <p className="text-gray-600 text-sm">
                {dict.existingUser?.loggingInDescription ||
                  (locale === 'he'
                    ? 'נראה שכבר נרשמת אלינו! מנסים להתחבר עם הסיסמה שהזנת...'
                    : 'Looks like you already registered! Trying to log in with your password...')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing user dialog — clear options instead of auto-redirect */}
      <AnimatePresence>
        {showExistingUserDialog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <LogIn className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <AlertTitle className="text-blue-900 font-bold mb-1">
                      {locale === 'he'
                        ? 'כתובת מייל זו כבר רשומה'
                        : 'This email is already registered'}
                    </AlertTitle>
                    <AlertDescription className="text-sm text-blue-700">
                      {locale === 'he'
                        ? 'נראה שכבר יש לך חשבון. הסיסמה שהזנת לא התאימה. מה תרצה לעשות?'
                        : "It looks like you already have an account. The password didn't match. What would you like to do?"}
                    </AlertDescription>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleGoToForgotPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <KeyRound className="h-4 w-4 ml-2" />
                    {locale === 'he' ? 'איפוס סיסמה' : 'Reset password'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDismissExistingUser}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Mail className="h-4 w-4 ml-2" />
                    {locale === 'he'
                      ? 'להשתמש באימייל אחר'
                      : 'Use a different email'}
                  </Button>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Error */}
      <AnimatePresence>
        {apiError && !showExistingUserDialog && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dict.errors.title}</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google/Apple suggestion on DB errors */}
      <AnimatePresence>
        {showGoogleSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <AlertTitle className="text-blue-900 font-bold mb-1">
                      {dict.googleSuggestion?.title}
                    </AlertTitle>
                    <AlertDescription className="text-sm text-blue-700">
                      {dict.googleSuggestion?.description}
                    </AlertDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAppleSignup}
                  disabled={isAppleLoading || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white border-0 shadow-sm"
                >
                  {isAppleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>
                        {locale === 'he' ? 'מתחבר...' : 'Connecting...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      <span>
                        {locale === 'he'
                          ? 'הרשמה עם Apple'
                          : 'Sign up with Apple'}
                      </span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading || isAppleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{dict.googleSuggestion?.buttonLoading}</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{dict.googleSuggestion?.buttonText}</span>
                    </>
                  )}
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation errors summary */}
      <AnimatePresence>
        {missingFields.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-800"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg shrink-0">
                  <ListChecks className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <AlertTitle className="text-red-900 font-bold mb-2">
                    {validationDict.title}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mb-2 font-medium">
                      {validationDict.pleaseFill}
                    </p>
                    <ul className="list-disc list-inside space-y-1 opacity-90 pr-2 rtl:pr-2 rtl:pl-0 ltr:pl-2">
                      {missingFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.h2
        className="text-xl font-bold text-gray-800 mb-4"
        variants={itemVariants}
      >
        {dict.title}
      </motion.h2>

      {/* Form fields */}
      <motion.div variants={itemVariants} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="emailBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.emailLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="email"
              id="emailBasic"
              value={data.email}
              onChange={(e) => {
                const val = e.target.value;
                updateField('email', val);
                if (emailError) setEmailError('');
                // Check for email typo suggestion
                const typoSuggestion = detectEmailTypo(val);
                setEmailSuggestion(typoSuggestion);
              }}
              onBlur={() =>
                setEmailError(
                  data.email && !isValidEmail(data.email)
                    ? dict.errors.invalidEmail
                    : ''
                )
              }
              placeholder={dict.emailPlaceholder}
              disabled={isAnyLoading}
              aria-required="true"
              aria-invalid={!!emailError}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isAnyLoading ? 'bg-gray-100' : ''} 
                ${
                  emailError ||
                  missingFields.includes(validationDict.fields.email)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
          </div>
          {emailError && (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {emailError}
            </p>
          )}
          {emailSuggestion && !emailError && (
            <button
              type="button"
              onClick={() => {
                updateField('email', emailSuggestion);
                setEmailSuggestion(null);
              }}
              className="text-xs mt-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              {locale === 'he' ? 'התכוונת ל-' : 'Did you mean '}
              <strong>{emailSuggestion}</strong>?
            </button>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="passwordBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.passwordLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            <Input
              type={passwordVisible ? 'text' : 'password'}
              id="passwordBasic"
              value={data.password}
              onChange={(e) => {
                updateField('password', e.target.value);
                if (passwordError) setPasswordError('');
              }}
              onBlur={() =>
                setPasswordError(
                  data.password && !isValidPassword(data.password)
                    ? dict.errors.invalidPassword
                    : ''
                )
              }
              placeholder={dict.passwordPlaceholder}
              disabled={isAnyLoading}
              aria-required="true"
              aria-invalid={!!passwordError}
              className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isAnyLoading ? 'bg-gray-100' : ''} 
                ${
                  passwordError ||
                  missingFields.includes(validationDict.fields.password)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={passwordVisible ? 'הסתר סיסמה' : 'הצג סיסמה'}
            >
              {passwordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {passwordError && (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {passwordError}
            </p>
          )}
          {/* Password strength meter */}
          {data.password && (() => {
            const strength = getPasswordStrength(data.password);
            const strengthConfig = {
              weak: { width: 'w-1/3', color: 'bg-red-500', label: locale === 'he' ? 'חלשה' : 'Weak' },
              medium: { width: 'w-2/3', color: 'bg-amber-500', label: locale === 'he' ? 'בינונית' : 'Medium' },
              strong: { width: 'w-full', color: 'bg-green-500', label: locale === 'he' ? 'חזקה' : 'Strong' },
            } as const;
            if (strength === 'empty') return null;
            const config = strengthConfig[strength];
            return (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${config.color} ${config.width} rounded-full transition-all duration-300`} />
                </div>
                <p className={`text-xs ${strength === 'weak' ? 'text-red-600' : strength === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                  {config.label}
                </p>
              </div>
            );
          })()}
          <p className="text-xs text-gray-500 mt-1">{dict.passwordHint}</p>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="firstNameBasic"
              className="block text-sm font-medium text-gray-700"
            >
              {dict.firstNameLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                id="firstNameBasic"
                value={data.firstName}
                onChange={(e) => {
                  updateField('firstName', e.target.value);
                  if (firstNameError) setFirstNameError('');
                }}
                placeholder={dict.firstNamePlaceholder}
                disabled={isAnyLoading}
                aria-required="true"
                aria-invalid={!!firstNameError}
                maxLength={50}
                className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                  ${isAnyLoading ? 'bg-gray-100' : ''}
                  ${
                    firstNameError ||
                    missingFields.includes(validationDict.fields.firstName)
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                  }`}
              />
            </div>
            {firstNameError && (
              <p role="alert" className="text-red-500 text-xs mt-1">
                {firstNameError}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="lastNameBasic"
              className="block text-sm font-medium text-gray-700"
            >
              {dict.lastNameLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                id="lastNameBasic"
                value={data.lastName}
                onChange={(e) => {
                  updateField('lastName', e.target.value);
                  if (lastNameError) setLastNameError('');
                }}
                placeholder={dict.lastNamePlaceholder}
                disabled={isAnyLoading}
                aria-required="true"
                aria-invalid={!!lastNameError}
                maxLength={50}
                className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                  ${isAnyLoading ? 'bg-gray-100' : ''}
                  ${
                    lastNameError ||
                    missingFields.includes(validationDict.fields.lastName)
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                  }`}
              />
            </div>
            {lastNameError && (
              <p role="alert" className="text-red-500 text-xs mt-1">
                {lastNameError}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Navigation buttons */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between gap-4 pt-4"
      >
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          disabled={isAnyLoading}
          className="flex items-center gap-2"
        >
          {isRTL ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
          {dict.backButton}
        </Button>

        <Button
          type="button"
          onClick={handleRegisterSubmit}
          disabled={isAnyLoading || rateLimitCountdown > 0}
          className="flex-1 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {dict.nextButtonLoading}
            </>
          ) : rateLimitCountdown > 0 ? (
            <span>
              {locale === 'he' ? `המתן ${rateLimitCountdown}s` : `Wait ${rateLimitCountdown}s`}
            </span>
          ) : (
            <>
              {dict.nextButton}
              {isRTL ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;
