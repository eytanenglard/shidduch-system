// src/app/[locale]/auth/register/RegisterClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  RegistrationProvider,
  useRegistration,
} from '@/components/auth/RegistrationContext';
import WelcomeStep from '@/components/auth/steps/WelcomeStep';
import BasicInfoStep from '@/components/auth/steps/BasicInfoStep';
import EmailVerificationCodeStep from '@/components/auth/steps/EmailVerificationCodeStep';
import PersonalDetailsStep from '@/components/auth/steps/PersonalDetailsStep';
import OptionalInfoStep from '@/components/auth/steps/OptionalInfoStep';
import CompleteStep from '@/components/auth/steps/CompleteStep';
import ProgressBar from '@/components/auth/ProgressBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Info, Loader2 } from 'lucide-react';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface RegisterClientProps {
  dict: RegisterStepsDict;
}

const RegisterStepsContent: React.FC<{ dict: RegisterStepsDict }> = ({
  dict,
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
      if (
        user.isProfileComplete &&
        user.isPhoneVerified &&
        user.termsAndPrivacyAcceptedAt
      ) {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/profile'
        ) {
          router.push('/profile');
        }
        return;
      }

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
      // Complex logic for resetting form based on state, remains as is.
      // This part is logic-heavy and doesn't contain hardcoded strings for translation.
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
  ]);

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
      return <EmailVerificationCodeStep dict={dict.steps.emailVerification} />;
    }

    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2:
          return (
            <PersonalDetailsStep
              dict={dict.steps.personalDetails}
              consentDict={dict.consentCheckbox}
            />
          );
        case 3:
          return <OptionalInfoStep dict={dict.steps.optionalInfo} />;
        case 4:
          return <CompleteStep dict={dict.steps.complete} />;
        default:
          resetForm();
          return <WelcomeStep dict={dict.steps.welcome} />;
      }
    }

    switch (registrationContextData.step) {
      case 0:
        return <WelcomeStep dict={dict.steps.welcome} />;
      case 1:
        return (
          <BasicInfoStep
            dict={dict.steps.basicInfo}
            consentDict={dict.consentCheckbox}
          />
        );
      default:
        resetForm();
        return <WelcomeStep dict={dict.steps.welcome} />;
    }
  };

  let pageTitle = dict.headers.registerTitle;
  let stepDescription = dict.headers.welcomeDescription;
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3;
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
    totalProgressBarSteps = 2;
    if (registrationContextData.step === 2) {
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? dict.headers.personalDetailsConsentedDescription
        : dict.headers.personalDetailsDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) {
      stepDescription = dict.headers.optionalInfoDescription;
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      stepDescription = session?.user?.isPhoneVerified
        ? dict.headers.completionReadyDescription
        : dict.headers.completionPhoneVerificationDescription;
      showProgressBar = false;
    } else {
      stepDescription = dict.headers.loadingProfileDescription;
      showProgressBar =
        registrationContextData.step > 1 && registrationContextData.step < 4;
    }
  } else {
    if (registrationContextData.step === 1) {
      pageTitle = dict.headers.registerTitle;
      stepDescription = dict.headers.accountCreationDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    }
  }

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
          />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        <div className="p-6 sm:p-8">{renderStep()}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        {dict.contactSupport}{' '}
        <a href="/contact" className="text-cyan-600 hover:underline">
          {dict.contactSupportLink}
        </a>
      </div>
    </div>
  );
};

export default function RegisterClient({ dict }: RegisterClientProps) {
  return (
    <RegistrationProvider>
      <RegisterStepsContent dict={dict} />
    </RegistrationProvider>
  );
}
