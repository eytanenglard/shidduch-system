// src/components/auth/RegisterSteps.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  RegistrationProvider,
  useRegistration,
  STEPS,
} from './RegistrationContext';
import Link from 'next/link';
import WelcomeStep from './steps/WelcomeStep';
import BasicInfoStep from './steps/BasicInfoStep';
import EmailVerificationCodeStep from './steps/EmailVerificationCodeStep';
import PersonalDetailsStep from './steps/PersonalDetailsStep';
import CompleteStep from './steps/CompleteStep';
import ProgressBar from './ProgressBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// DEBUG UTILITY
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';
const debugLog = (label: string, ...args: unknown[]) => {
  if (isDev) console.log(`[RegisterSteps][${label}]`, ...args);
};

// ============================================================================
// TYPES
// ============================================================================

interface RegisterStepsProps {
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RegistrationErrorBoundary extends React.Component<
  { children: React.ReactNode; dict: RegisterStepsDict; onReset: () => void },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    dict: RegisterStepsDict;
    onReset: () => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      '[RegistrationErrorBoundary] Caught error:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {this.props.dict.errorBoundary?.title || 'אופס! משהו השתבש'}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              {this.props.dict.errorBoundary?.description ||
                'אירעה שגיאה לא צפויה. אנא נסה לרענן את הדף.'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 text-white"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              {this.props.dict.errorBoundary?.refreshButton || 'התחל מחדש'}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HELPER: Determine redirect path for authenticated user
// ============================================================================

interface UserRedirectState {
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  termsAndPrivacyAcceptedAt?: Date | string | null;
  role?: string;
  isVerified?: boolean;
  status?: string;
}

function getRedirectPathForUser(
  user: UserRedirectState,
  locale: string
): string | null {
  debugLog('getRedirectPathForUser', {
    isProfileComplete: user.isProfileComplete,
    isPhoneVerified: user.isPhoneVerified,
    hasTerms: !!user.termsAndPrivacyAcceptedAt,
    role: user.role,
  });

  // Admin/Matchmaker — no need to complete profile
  if (user.role === 'ADMIN' || user.role === 'MATCHMAKER') {
    return `/${locale}/admin/engagement`;
  }

  // Everything complete — go to profile
  if (
    user.isProfileComplete &&
    user.isPhoneVerified &&
    user.termsAndPrivacyAcceptedAt
  ) {
    return `/${locale}/profile`;
  }

  // Profile complete + terms accepted, but phone not verified
  if (
    user.isProfileComplete &&
    user.termsAndPrivacyAcceptedAt &&
    !user.isPhoneVerified
  ) {
    return `/${locale}/auth/verify-phone`;
  }

  // Needs to complete profile or accept terms — stay on register
  return null;
}

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================

const RegisterStepsContent: React.FC<{
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}> = ({ dict, locale }) => {
  const {
    data: registrationContextData,
    initializeFromSession,
    resetForm,
    goToStep,
    submission,
  } = useRegistration();

  const router = useRouter();
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const searchParams = useSearchParams();

  // State
  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Refs for preventing duplicate operations
  const redirectInProgressRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // ============================================================================
  // Prefetch likely redirect targets
  // ============================================================================
  useEffect(() => {
    router.prefetch(`/${locale}/profile`);
    router.prefetch(`/${locale}/auth/verify-phone`);
    router.prefetch(`/${locale}/admin/engagement`);
  }, [router, locale]);

  // ============================================================================
  // Effect 1: Show incomplete profile message from URL params
  // ============================================================================
  useEffect(() => {
    const reasonParam = searchParams.get('reason');
    if (
      (reasonParam === 'complete_profile' || reasonParam === 'verify_phone') &&
      !registrationContextData.isCompletingProfile
    ) {
      setShowIncompleteProfileMessage(true);
    } else {
      setShowIncompleteProfileMessage(false);
    }
  }, [searchParams, registrationContextData.isCompletingProfile]);

  // ============================================================================
  // Effect 2: Redirect logic (depends only on session)
  // ============================================================================
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;
    if (redirectInProgressRef.current) return;

    const user = session.user as SessionUserType;
    const redirectPath = getRedirectPathForUser(user, locale);

    if (!redirectPath) return;

    // Prevent redirect to current path
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath === redirectPath) return;

    debugLog('Redirect', `Navigating to: ${redirectPath}`);
    redirectInProgressRef.current = true;
    setIsRedirecting(true);
    router.push(redirectPath);
  }, [sessionStatus, session, router, locale]);

  // ============================================================================
  // Effect 3: Initialize form from session (runs once)
  // ============================================================================
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;
    if (hasInitializedRef.current) return;
    if (redirectInProgressRef.current) return;

    const user = session.user as SessionUserType;
    const redirectPath = getRedirectPathForUser(user, locale);

    // Only initialize if user needs to stay on register page
    if (redirectPath) return;

    const needsSetup =
      !user.termsAndPrivacyAcceptedAt || !user.isProfileComplete;

    if (needsSetup) {
      debugLog('Initialize', 'Initializing form from session');
      hasInitializedRef.current = true;
      initializeFromSession(user);
    }
  }, [sessionStatus, session, initializeFromSession, locale]);

  // ============================================================================
  // Effect 4: Handle unauthenticated state
  // ============================================================================
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      const registrationInProgress =
        registrationContextData.step > 0 ||
        registrationContextData.isVerifyingEmailCode;

      if (registrationInProgress) {
        debugLog('Unauthenticated', 'User logged out, resetting form');
        resetForm();
      }

      // Reset redirect flags
      redirectInProgressRef.current = false;
      hasInitializedRef.current = false;
      setIsRedirecting(false);
    }
  }, [
    sessionStatus,
    registrationContextData.step,
    registrationContextData.isVerifyingEmailCode,
    resetForm,
  ]);

  // ============================================================================
  // Effect 5: Refresh session when tab becomes visible
  // ============================================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        sessionStatus === 'authenticated'
      ) {
        debugLog('Visibility', 'Tab became visible, refreshing session');
        updateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionStatus, updateSession]);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================
  useEffect(() => {
    return () => {
      redirectInProgressRef.current = false;
    };
  }, []);

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================

  if (submission.isSubmitting) {
    return (
      <StandardizedLoadingSpinner
        text={submission.loadingText}
        subtext={submission.loadingSubtext}
      />
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40">
        <StandardizedLoadingSpinner
          text={locale === 'he' ? 'מעביר אותך...' : 'Redirecting...'}
        />
      </div>
    );
  }

  // ============================================================================
  // RENDER STEP
  // ============================================================================

  const renderStep = (): React.ReactNode => {
    if (sessionStatus === 'loading') {
      return (
        <div className="flex justify-center p-10">
          <StandardizedLoadingSpinner className="text-teal-600 w-8 h-8" />
        </div>
      );
    }

    // Email verification flow
    if (
      registrationContextData.isVerifyingEmailCode &&
      !registrationContextData.isCompletingProfile
    ) {
      return (
        <EmailVerificationCodeStep
          dict={dict.steps.emailVerification}
          locale={locale}
        />
      );
    }

    // Profile completion flow
    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case STEPS.PERSONAL_DETAILS:
          return (
            <PersonalDetailsStep
              personalDetailsDict={dict.steps.personalDetails}
              optionalInfoDict={dict.steps.optionalInfo}
              consentDict={dict.consentCheckbox}
              validationDict={dict.validationErrors}
              locale={locale}
            />
          );
        case STEPS.COMPLETE:
          return <CompleteStep dict={dict.steps.complete} locale={locale} />;
        default:
          // Instead of auto-reset (which could loop), show a recovery message
          debugLog(
            'renderStep',
            'Unexpected step in completing profile:',
            registrationContextData.step
          );
          return (
            <div className="text-center p-6 space-y-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
              <p className="text-gray-600">
                {locale === 'he'
                  ? 'אירעה שגיאה בטעינת הדף. אנא נסה שוב.'
                  : 'An error occurred loading the page. Please try again.'}
              </p>
              <Button onClick={resetForm} variant="outline" className="mx-auto">
                <RefreshCw className="h-4 w-4 ml-2" />
                {locale === 'he' ? 'התחל מחדש' : 'Start over'}
              </Button>
            </div>
          );
      }
    }

    // Normal registration flow
    switch (registrationContextData.step) {
      case STEPS.WELCOME:
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      case STEPS.BASIC_INFO:
        return (
          <BasicInfoStep
            dict={dict.steps.basicInfo}
            consentDict={dict.consentCheckbox}
            validationDict={dict.validationErrors}
            locale={locale}
          />
        );
      default:
        debugLog(
          'renderStep',
          'Unexpected step in regular flow:',
          registrationContextData.step
        );
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
    }
  };

  // ============================================================================
  // PAGE TITLE & DESCRIPTION LOGIC
  // ============================================================================

  let pageTitle = dict.headers.registerTitle;
  let stepDescription = dict.headers.welcomeDescription;
  let currentProgressBarStep = 0;
  const totalProgressBarSteps = 3;
  let showProgressBar = false;

  if (
    registrationContextData.isVerifyingEmailCode &&
    !registrationContextData.isCompletingProfile
  ) {
    pageTitle = dict.headers.verifyEmailTitle;
    stepDescription = dict.headers.verifyEmailDescription.replace(
      '{{email}}',
      registrationContextData.emailForVerification || ''
    );
    showProgressBar = true;
    currentProgressBarStep = 1;
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = dict.headers.completeProfileTitle;
    // Show progress bar in completing profile mode too
    showProgressBar = true;
    currentProgressBarStep = 2;

    if (registrationContextData.step === STEPS.PERSONAL_DETAILS) {
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? dict.headers.personalDetailsConsentedDescription
        : dict.headers.personalDetailsDescription;
    } else if (registrationContextData.step === STEPS.COMPLETE) {
      currentProgressBarStep = 3;
      stepDescription = session?.user?.isPhoneVerified
        ? dict.headers.completionReadyDescription
        : dict.headers.completionPhoneVerificationDescription;
    } else {
      stepDescription = dict.headers.loadingProfileDescription;
    }
  } else {
    if (registrationContextData.step === STEPS.BASIC_INFO) {
      pageTitle = dict.headers.registerTitle;
      stepDescription = dict.headers.accountCreationDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    }
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40 p-4 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-500 to-amber-500 text-3xl font-bold mb-2">
          {pageTitle}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">{stepDescription}</p>
      </div>

      {showIncompleteProfileMessage && (
        <Alert className="mb-6 w-full max-w-md bg-amber-50 border-amber-200 text-amber-800 shadow-md">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
          <div className="ml-3 rtl:mr-3 rtl:ml-0">
            <AlertTitle className="font-semibold mb-1">
              {dict.incompleteProfileAlert.title}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {searchParams.get('reason') === 'verify_phone'
                ? dict.incompleteProfileAlert.verifyPhoneDescription
                : dict.incompleteProfileAlert.description}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {showProgressBar && (
        <div className="w-full max-w-md mb-6">
          <ProgressBar
            currentStep={currentProgressBarStep}
            totalSteps={totalProgressBarSteps}
            stepLabel={dict.progressBar.stepLabel}
            locale={locale}
          />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative border border-white/50">
        <div className="p-6 sm:p-8">{renderStep()}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        {dict.contactSupport}{' '}
        <Link
          href={`/${locale}/contact`}
          className="text-teal-600 hover:underline hover:text-teal-700"
        >
          {dict.contactSupportLink}
        </Link>
      </div>
    </div>
  );
};

// ============================================================================
// WRAPPER WITH PROVIDER + ERROR BOUNDARY
// ============================================================================

export default function RegisterSteps({ dict, locale }: RegisterStepsProps) {
  const handleErrorReset = useCallback(() => {
    // Force a full page reload as a last resort
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return (
    <RegistrationProvider>
      <RegistrationErrorBoundary dict={dict} onReset={handleErrorReset}>
        <RegisterStepsContent dict={dict} locale={locale} />
      </RegistrationErrorBoundary>
    </RegistrationProvider>
  );
}
