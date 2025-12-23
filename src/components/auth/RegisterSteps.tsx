// src/components/auth/RegisterSteps.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RegistrationProvider, useRegistration } from './RegistrationContext';
import Link from 'next/link';
import WelcomeStep from './steps/WelcomeStep';
import BasicInfoStep from './steps/BasicInfoStep';
import EmailVerificationCodeStep from './steps/EmailVerificationCodeStep';
import PersonalDetailsStep from './steps/PersonalDetailsStep';
import CompleteStep from './steps/CompleteStep';
import ProgressBar from './ProgressBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPES
// ============================================================================

interface RegisterStepsProps {
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}

// ============================================================================
// HELPER: קביעת לאן להפנות את המשתמש
// ============================================================================

interface UserRedirectState {
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  termsAndPrivacyAcceptedAt?: Date | string | null;
  role?: string;
  isVerified?: boolean;
  status?: string;
}

/**
 * מחזיר את הנתיב שאליו צריך להפנות את המשתמש,
 * או null אם המשתמש צריך להישאר בדף הנוכחי (register).
 */
function getRedirectPathForUser(
  user: UserRedirectState,
  locale: string
): string | null {
  // 🔴 לוג מפורט
  console.log('[getRedirectPathForUser] Input:', {
    isProfileComplete: user.isProfileComplete,
    isPhoneVerified: user.isPhoneVerified,
    termsAndPrivacyAcceptedAt: user.termsAndPrivacyAcceptedAt,
    hasTerms: !!user.termsAndPrivacyAcceptedAt,
    role: user.role,
    locale,
  });

  // תרחיש 1: אדמין/שדכן - לא צריכים להשלים פרופיל
  if (user.role === 'ADMIN' || user.role === 'MATCHMAKER') {
    console.log(
      '[getRedirectPathForUser] -> Admin/Matchmaker, redirecting to admin'
    );
    return `/${locale}/admin/engagement`;
  }

  // תרחיש 2: הכל שלם - הפנה לפרופיל
  if (
    user.isProfileComplete &&
    user.isPhoneVerified &&
    user.termsAndPrivacyAcceptedAt
  ) {
    console.log(
      '[getRedirectPathForUser] -> All complete, redirecting to profile'
    );
    return `/${locale}/profile`;
  }

  // תרחיש 3: פרופיל שלם + terms מאושרים, אבל פלאפון לא מאומת
  // 🔴 זה התיקון העיקרי!
  if (
    user.isProfileComplete &&
    user.termsAndPrivacyAcceptedAt &&
    !user.isPhoneVerified
  ) {
    console.log(
      '[getRedirectPathForUser] -> Profile complete but phone not verified, redirecting to verify-phone'
    );
    return `/${locale}/auth/verify-phone`;
  }

  // תרחיש 4: צריך להשלים פרופיל או לאשר terms - נשאר בדף register
  console.log(
    '[getRedirectPathForUser] -> Needs to complete profile/terms, staying on register'
  );
  return null;
}

// ============================================================================
// MAIN COMPONENT
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
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Ref למניעת הפניות כפולות
  const redirectInProgressRef = useRef(false);

  // 🔴 לוג טעינת הקומפוננטה
  console.log('[RegisterSteps] Component rendered', {
    sessionStatus,
    hasSession: !!session,
    hasUser: !!session?.user,
    isRedirecting,
    initializationAttempted,
  });

  // ============================================================================
  // Effect 1: הצגת הודעה על פרופיל לא שלם
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
  // Effect 2: לוגיקת ניתוב ואתחול הטופס
  // ============================================================================
  useEffect(() => {
    console.log('[RegisterSteps] Effect triggered', {
      sessionStatus,
      redirectInProgress: redirectInProgressRef.current,
    });

    // אל תעשה כלום אם הסשן בטעינה או אם כבר בתהליך הפניה
    if (sessionStatus === 'loading') {
      console.log('[RegisterSteps] Session loading, waiting...');
      return;
    }

    if (redirectInProgressRef.current) {
      console.log('[RegisterSteps] Redirect already in progress, skipping');
      return;
    }

    // ============================================================================
    // משתמש מחובר
    // ============================================================================
    if (sessionStatus === 'authenticated' && session?.user) {
      const user = session.user as SessionUserType;

      // 🔴 לוג מפורט של מצב המשתמש
      console.log('[RegisterSteps] ========== USER STATE ==========');
      console.log('[RegisterSteps] isProfileComplete:', user.isProfileComplete);
      console.log('[RegisterSteps] isPhoneVerified:', user.isPhoneVerified);
      console.log(
        '[RegisterSteps] termsAndPrivacyAcceptedAt:',
        user.termsAndPrivacyAcceptedAt
      );
      console.log('[RegisterSteps] role:', user.role);
      console.log('[RegisterSteps] ================================');

      // בדוק אם צריך להפנות
      const redirectPath = getRedirectPathForUser(user, locale);

      console.log(
        '[RegisterSteps] Redirect decision:',
        redirectPath || 'STAY ON REGISTER'
      );

      if (redirectPath) {
        // בדוק שאנחנו לא כבר בנתיב היעד
        const currentPath =
          typeof window !== 'undefined' ? window.location.pathname : '';
        console.log('[RegisterSteps] Current path:', currentPath);
        console.log('[RegisterSteps] Target path:', redirectPath);

        if (currentPath === redirectPath) {
          console.log(
            '[RegisterSteps] Already at target path, skipping redirect'
          );
          return;
        }

        console.log(`[RegisterSteps] 🚀 REDIRECTING to: ${redirectPath}`);
        redirectInProgressRef.current = true;
        setIsRedirecting(true);
        router.push(redirectPath);
        return;
      }

      // ============================================================================
      // המשתמש צריך להישאר בדף - אתחל את הטופס
      // ============================================================================
      const needsSetup =
        !user.termsAndPrivacyAcceptedAt || !user.isProfileComplete;

      console.log('[RegisterSteps] Needs setup:', needsSetup);
      console.log(
        '[RegisterSteps] initializationAttempted:',
        initializationAttempted
      );
      console.log(
        '[RegisterSteps] registrationContextData.step:',
        registrationContextData.step
      );
      console.log(
        '[RegisterSteps] registrationContextData.isVerifyingEmailCode:',
        registrationContextData.isVerifyingEmailCode
      );

      if (
        needsSetup &&
        (!initializationAttempted ||
          (registrationContextData.step === 0 &&
            !registrationContextData.isVerifyingEmailCode))
      ) {
        console.log('[RegisterSteps] Initializing form from session');
        initializeFromSession(user);
        setInitializationAttempted(true);
      }
    }

    // ============================================================================
    // משתמש לא מחובר
    // ============================================================================
    else if (sessionStatus === 'unauthenticated') {
      console.log('[RegisterSteps] User is unauthenticated');
      const registrationInProgress =
        registrationContextData.step > 0 ||
        registrationContextData.isVerifyingEmailCode;

      if (registrationInProgress) {
        console.log('[RegisterSteps] User logged out, resetting form');
        resetForm();
      }

      // אפס את דגל ההפניה
      redirectInProgressRef.current = false;
      setIsRedirecting(false);
    }
  }, [
    sessionStatus,
    session,
    router,
    registrationContextData.step,
    registrationContextData.isVerifyingEmailCode,
    registrationContextData.isCompletingProfile,
    initializeFromSession,
    resetForm,
    initializationAttempted,
    locale,
  ]);

  // ============================================================================
  // Effect 3: רענון הסשן כשחוזרים לדף (למקרה שמשהו השתנה בטאב אחר)
  // ============================================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        sessionStatus === 'authenticated'
      ) {
        console.log('[RegisterSteps] Tab became visible, refreshing session');
        updateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionStatus, updateSession]);

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================

  // מצב טעינה של submission
  if (submission.isSubmitting) {
    return (
      <StandardizedLoadingSpinner
        text={submission.loadingText}
        subtext={submission.loadingSubtext}
      />
    );
  }

  // מצב הפניה - הצג loading עד שההפניה תושלם
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
    // סשן בטעינה
    if (sessionStatus === 'loading') {
      return (
        <div className="flex justify-center p-10">
          <StandardizedLoadingSpinner className="text-teal-600 w-8 h-8" />
        </div>
      );
    }

    // אימות מייל
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

    // השלמת פרופיל
    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2:
          return (
            <PersonalDetailsStep
              personalDetailsDict={dict.steps.personalDetails}
              optionalInfoDict={dict.steps.optionalInfo}
              consentDict={dict.consentCheckbox}
              validationDict={dict.validationErrors}
              locale={locale}
            />
          );
        case 4:
          return <CompleteStep dict={dict.steps.complete} />;
        default:
          // מצב לא צפוי - אפס ותתחיל מחדש
          console.warn(
            '[RegisterSteps] Unexpected step in isCompletingProfile mode:',
            registrationContextData.step
          );
          resetForm();
          return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      }
    }

    // זרימת הרשמה רגילה
    switch (registrationContextData.step) {
      case 0:
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      case 1:
        return (
          <BasicInfoStep
            dict={dict.steps.basicInfo}
            consentDict={dict.consentCheckbox}
            validationDict={dict.validationErrors}
            locale={locale}
          />
        );
      default:
        console.warn(
          '[RegisterSteps] Unexpected step in regular flow:',
          registrationContextData.step
        );
        resetForm();
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
    }
  };

  // ============================================================================
  // PAGE TITLE & DESCRIPTION
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
    showProgressBar = false;

    if (registrationContextData.step === 2) {
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? dict.headers.personalDetailsConsentedDescription
        : dict.headers.personalDetailsDescription;
    } else if (registrationContextData.step === 4) {
      stepDescription = session?.user?.isPhoneVerified
        ? dict.headers.completionReadyDescription
        : dict.headers.completionPhoneVerificationDescription;
    } else {
      stepDescription = dict.headers.loadingProfileDescription;
    }
  } else {
    if (registrationContextData.step === 1) {
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
          href="/contact"
          className="text-teal-600 hover:underline hover:text-teal-700"
        >
          {dict.contactSupportLink}
        </Link>
      </div>
    </div>
  );
};

// ============================================================================
// WRAPPER WITH PROVIDER
// ============================================================================

export default function RegisterSteps({ dict, locale }: RegisterStepsProps) {
  return (
    <RegistrationProvider>
      <RegisterStepsContent dict={dict} locale={locale} />
    </RegistrationProvider>
  );
}
