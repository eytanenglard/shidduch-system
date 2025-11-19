// src/app/[locale]/auth/register/RegisterClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  RegistrationProvider,
  useRegistration,
} from '@/components/auth/RegistrationContext';
import Link from 'next/link';
import WelcomeStep from '@/components/auth/steps/WelcomeStep';
import BasicInfoStep from '@/components/auth/steps/BasicInfoStep';
import EmailVerificationCodeStep from '@/components/auth/steps/EmailVerificationCodeStep';
import PersonalDetailsStep from '@/components/auth/steps/PersonalDetailsStep';
import CompleteStep from '@/components/auth/steps/CompleteStep';
import ProgressBar from '@/components/auth/ProgressBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface RegisterClientProps {
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}

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
    if (sessionStatus === 'loading') return;

    if (sessionStatus === 'authenticated' && session?.user) {
      const user = session.user as SessionUserType;
      if (user.isProfileComplete && user.isPhoneVerified && user.termsAndPrivacyAcceptedAt) {
        if (typeof window !== 'undefined' && window.location.pathname !== `/${locale}/profile`) {
          router.push(`/${locale}/profile`);
        }
        return;
      }

      const needsSetup = !user.termsAndPrivacyAcceptedAt || !user.isProfileComplete || !user.isPhoneVerified;
      if (needsSetup && (!initializationAttempted || (registrationContextData.step === 0 && !registrationContextData.isVerifyingEmailCode))) {
        initializeFromSession(user);
        setInitializationAttempted(true);
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

  const renderStep = (): React.ReactNode => {
    if (sessionStatus === 'loading') {
      return (<div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>);
    }

    if (registrationContextData.isVerifyingEmailCode && !registrationContextData.isCompletingProfile) {
      return (<EmailVerificationCodeStep dict={dict.steps.emailVerification} locale={locale} />);
    }

    //  ====== CORE CHANGE: Simplified profile completion flow ======
    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2: // This is now the single, combined step
          return (
            <PersonalDetailsStep
              personalDetailsDict={dict.steps.personalDetails}
              optionalInfoDict={dict.steps.optionalInfo} // Pass the dict for optional fields
              consentDict={dict.consentCheckbox}
              locale={locale}
            />
          );
        // case 3: was the OptionalInfoStep, which is now removed.
        case 4:
          return <CompleteStep dict={dict.steps.complete} />;
        default:
          resetForm();
          return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      }
    }
    // ====== END OF CORE CHANGE ======

    switch (registrationContextData.step) {
      case 0:
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      case 1:
        // ▼▼▼ התיקון כאן: הסרת consentDict ▼▼▼
        return (<BasicInfoStep dict={dict.steps.basicInfo} locale={locale} />);
      default:
        resetForm();
        return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
    }
  };

  //  ====== PROGRESS BAR LOGIC UPDATE ======
  let pageTitle = dict.headers.registerTitle;
  let stepDescription = dict.headers.welcomeDescription;
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // For initial registration
  let showProgressBar = false;

  if (registrationContextData.isVerifyingEmailCode && !registrationContextData.isCompletingProfile) {
    pageTitle = dict.headers.verifyEmailTitle;
    stepDescription = dict.headers.verifyEmailDescription.replace('{{email}}', registrationContextData.emailForVerification || '');
    showProgressBar = true;
    currentProgressBarStep = 1;
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = dict.headers.completeProfileTitle;
    totalProgressBarSteps = 1; // Only ONE step in the profile completion process now
    if (registrationContextData.step === 2) {
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt ? dict.headers.personalDetailsConsentedDescription : dict.headers.personalDetailsDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      stepDescription = session?.user?.isPhoneVerified ? dict.headers.completionReadyDescription : dict.headers.completionPhoneVerificationDescription;
      showProgressBar = false; // No progress bar on the final status page
    } else {
      stepDescription = dict.headers.loadingProfileDescription;
      showProgressBar = false;
    }
  } else {
    if (registrationContextData.step === 1) {
      pageTitle = dict.headers.registerTitle;
      stepDescription = dict.headers.accountCreationDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    }
  }
  // ====== END OF PROGRESS BAR LOGIC UPDATE ======

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold mb-2">{pageTitle}</h1>
        <p className="text-gray-600 max-w-md mx-auto">{stepDescription}</p>
      </div>

      {showIncompleteProfileMessage && (
        <Alert className="mb-6 w-full max-w-md bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="ml-3 rtl:mr-3 rtl:ml-0">
            <AlertTitle className="font-semibold mb-1">{dict.incompleteProfileAlert.title}</AlertTitle>
            <AlertDescription className="text-sm">{searchParams.get('reason') === 'verify_phone' ? dict.incompleteProfileAlert.verifyPhoneDescription : dict.incompleteProfileAlert.description}</AlertDescription>
          </div>
        </Alert>
      )}

      {showProgressBar && (
        <div className="w-full max-w-md mb-6">
          <ProgressBar currentStep={currentProgressBarStep} totalSteps={totalProgressBarSteps} stepLabel={dict.progressBar.stepLabel} locale={locale} />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        <div className="p-6 sm:p-8">{renderStep()}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        {dict.contactSupport}{' '}
        <Link href="/contact" className="text-cyan-600 hover:underline">{dict.contactSupportLink}</Link>
      </div>
    </div>
  );
};

export default function RegisterClient({ dict, locale }: RegisterClientProps) {
  return (
    <RegistrationProvider>
      <RegisterStepsContent dict={dict} locale={locale} />
    </RegistrationProvider>
  );
}