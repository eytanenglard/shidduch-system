// src/components/auth/RegisterSteps.tsx
'use client';

import React, { useEffect, useState } from 'react';
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
import { Info, Loader2 } from 'lucide-react';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

/**
 * הגדרת ה-Props עבור הקומפוננטה הראשית.
 */
interface RegisterStepsProps {
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}

/**
 * רכיב התוכן הפנימי שמכיל את הלוגיקה המרכזית של תהליך ההרשמה.
 */
const RegisterStepsContent: React.FC<{
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}> = ({
  dict,
  locale,
}) => {
  const {
    data: registrationContextData,
    initializeFromSession,
    resetForm,
    goToStep,
  } = useRegistration();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // useEffect שמנהל את מצב ההרשמה והסשן
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

  useEffect(() => {
    if (sessionStatus === 'loading') {
      return;
    }
    if (sessionStatus === 'authenticated' && session?.user) {
      const user = session.user as SessionUserType;
      
      // בדיקה אם המשתמש כבר סיים את כל התהליך
      if (
        user.isProfileComplete &&
        user.isPhoneVerified &&
        user.termsAndPrivacyAcceptedAt
      ) {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== `/${locale}/profile`
        ) {
          router.push(`/${locale}/profile`);
        }
        return;
      }

      // בדיקה אם נדרשת השלמת פרטים
      const needsSetup =
        !user.termsAndPrivacyAcceptedAt ||
        !user.isProfileComplete ||
        !user.isPhoneVerified;
        
      if (
        needsSetup &&
        (!initializationAttempted ||
          (registrationContextData.step === 0 &&
            !registrationContextData.isVerifyingEmailCode))
      ) {
        initializeFromSession(user);
        setInitializationAttempted(true);
      }
    } else if (sessionStatus === 'unauthenticated') {
      const registrationInProgress =
        registrationContextData.step > 0 ||
        registrationContextData.isVerifyingEmailCode;
      if (registrationInProgress) {
        resetForm();
      }
    }
  }, [
    sessionStatus,
    session,
    router,
    registrationContextData,
    initializeFromSession,
    resetForm,
    goToStep,
    initializationAttempted,
    searchParams,
    locale,
  ]);

  /**
   * פונקציה שמחזירה את רכיב-השלב המתאים למצב הנוכחי.
   */
  const renderStep = (): React.ReactNode => {
    if (sessionStatus === 'loading') {
      return (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      );
    }

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

    // תהליך השלמת פרופיל (מאוחד)
    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2: // שלב מילוי הפרטים המאוחד
          return (
            <PersonalDetailsStep
              personalDetailsDict={dict.steps.personalDetails}
              optionalInfoDict={dict.steps.optionalInfo}
              consentDict={dict.consentCheckbox}
              locale={locale}
            />
          );
        case 4: // דף סיום והפניה
          return <CompleteStep dict={dict.steps.complete} />;
        default:
          resetForm();
          return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      }
    }

    // תהליך הרשמה רגיל (אימייל וסיסמה)
    switch (registrationContextData.step) {
      case 0:
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      case 1:
        return (
          <BasicInfoStep
            dict={dict.steps.basicInfo}
            consentDict={dict.consentCheckbox}
            locale={locale}
          />
        );
      default:
        resetForm();
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
    }
  };

  // ▼▼▼ לוגיקת הכותרות וסרגל ההתקדמות ▼▼▼
  let pageTitle = dict.headers.registerTitle;
  let stepDescription = dict.headers.welcomeDescription;
  let currentProgressBarStep = 0;
  const totalProgressBarSteps = 3;
  let showProgressBar = false;

  if (
    registrationContextData.isVerifyingEmailCode &&
    !registrationContextData.isCompletingProfile
  ) {
    // מצב אימות אימייל
    pageTitle = dict.headers.verifyEmailTitle;
    stepDescription = dict.headers.verifyEmailDescription.replace(
      '{{email}}',
      registrationContextData.emailForVerification || ''
    );
    showProgressBar = true;
    currentProgressBarStep = 1;

  } else if (registrationContextData.isCompletingProfile) {
    // מצב השלמת פרופיל (גוגל או משתמש רשום ללא פרופיל)
    pageTitle = dict.headers.completeProfileTitle;
    
    // אין צורך בסרגל התקדמות כי זה טופס אחד מאוחד
    showProgressBar = false; 

    if (registrationContextData.step === 2) {
      // שלב הפרטים האישיים
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? dict.headers.personalDetailsConsentedDescription
        : dict.headers.personalDetailsDescription;
    } else if (registrationContextData.step === 4) {
      // שלב הסיום
      stepDescription = session?.user?.isPhoneVerified
        ? dict.headers.completionReadyDescription
        : dict.headers.completionPhoneVerificationDescription;
    } else {
      stepDescription = dict.headers.loadingProfileDescription;
    }

  } else {
    // הרשמה רגילה - שלב יצירת החשבון
    if (registrationContextData.step === 1) {
      pageTitle = dict.headers.registerTitle;
      stepDescription = dict.headers.accountCreationDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    }
  }
  // ▲▲▲ סוף הלוגיקה ▲▲▲

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold mb-2">
          {pageTitle}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">{stepDescription}</p>
      </div>

      {showIncompleteProfileMessage && (
        <Alert className="mb-6 w-full max-w-md bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
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

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        <div className="p-6 sm:p-8">{renderStep()}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        {dict.contactSupport}{' '}
        <Link href="/contact" className="text-cyan-600 hover:underline">
          {dict.contactSupportLink}
        </Link>
      </div>
    </div>
  );
};

/**
 * רכיב הייצוא הראשי (Wrapper).
 */
export default function RegisterSteps({ dict, locale }: RegisterStepsProps) {
  return (
    <RegistrationProvider>
      <RegisterStepsContent dict={dict} locale={locale} />
    </RegistrationProvider>
  );
}