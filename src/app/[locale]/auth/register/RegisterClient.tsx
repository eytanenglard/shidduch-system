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
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Loader2,
  Sparkles,
  Heart,
  Shield,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

// Import existing step components
import WelcomeStep from '@/components/auth/steps/WelcomeStep';
import BasicInfoStep from '@/components/auth/steps/BasicInfoStep';
import EmailVerificationCodeStep from '@/components/auth/steps/EmailVerificationCodeStep';
import PersonalDetailsStep from '@/components/auth/steps/PersonalDetailsStep';
import CompleteStep from '@/components/auth/steps/CompleteStep';
import ProgressBar from '@/components/auth/ProgressBar';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RegisterClientProps {
  dict: RegisterStepsDict;
  locale: 'he' | 'en';
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ============================================================================
// BACKGROUND COMPONENT
// ============================================================================

const DynamicBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    {/* Floating Gradients */}
    <motion.div
      className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, -30, 0],
        x: [0, 20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <motion.div
      className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, 40, 0],
        x: [0, -30, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
    <motion.div
      className="absolute bottom-32 left-1/4 w-72 h-72 bg-gradient-to-br from-orange-400/15 to-red-500/15 rounded-full blur-3xl"
      animate={{
        y: [0, -25, 0],
        x: [0, 15, 0],
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    />
    <motion.div
      className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, 35, 0],
        scale: [1, 1.12, 1],
      }}
      transition={{
        duration: 16,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    />

    {/* Dot Pattern */}
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]" />

    {/* SVG Decorative Waves */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z"
        fill="url(#waveGrad1)"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M0,800 C300,700 700,900 1000,800 L1000,1000 L0,1000 Z"
        fill="url(#waveGrad2)"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </svg>
  </div>
);

// ============================================================================
// HERO SECTION (MINI)
// ============================================================================

interface HeroSectionProps {
  title: string;
  subtitle: string;
  locale: 'he' | 'en';
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  locale,
}) => {
  const isRTL = locale === 'he';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8 text-center"
    >
      <motion.div variants={itemVariants} className="mb-4">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 text-cyan-500" />
          </motion.div>
          <span className="text-sm font-medium text-gray-700">
            {locale === 'he' ? 'הצעד הראשון למסע שלכם' : 'Your First Step'}
          </span>
          <Heart className="w-5 h-5 text-pink-500" />
        </div>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-gradient-slow">
          {title}
        </span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4"
        style={{
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: 'center',
        }}
      >
        {subtitle}
      </motion.p>

      {/* Decorative Line */}
      <motion.div variants={itemVariants} className="relative mt-6">
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full mx-auto" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-pink-400"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// MAIN REGISTRATION STEPS CONTENT
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
  } = useRegistration();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  const isRTL = locale === 'he';

  // Handle incomplete profile message
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

  // Initialize from session
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
          window.location.pathname !== `/${locale}/profile`
        ) {
          router.push(`/${locale}/profile`);
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

  // Render appropriate step
  const renderStep = (): React.ReactNode => {
    if (sessionStatus === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center p-16">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mb-4" />
          <p className="text-gray-600 text-sm">
            {locale === 'he' ? 'טוען...' : 'Loading...'}
          </p>
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

    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2:
          return (
            <PersonalDetailsStep
              personalDetailsDict={dict.steps.personalDetails}
              optionalInfoDict={dict.steps.optionalInfo}
              consentDict={dict.consentCheckbox}
              locale={locale}
            />
          );
        case 4:
          return <CompleteStep dict={dict.steps.complete} />;
        default:
          resetForm();
          return <WelcomeStep dict={dict.steps.welcome} locale={locale} />;
      }
    }

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

  // Determine page title and progress
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
    totalProgressBarSteps = 1;
    if (registrationContextData.step === 2) {
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? dict.headers.personalDetailsConsentedDescription
        : dict.headers.personalDetailsDescription;
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      stepDescription = session?.user?.isPhoneVerified
        ? dict.headers.completionReadyDescription
        : dict.headers.completionPhoneVerificationDescription;
      showProgressBar = false;
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

  return (
    <>
      <DynamicBackground />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
        {/* Back to Home Link */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute top-6 ${isRTL ? 'right-6' : 'left-6'}`}
        >
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
          >
            {isRTL ? (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            ) : (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            )}
            <span className="text-sm font-medium">
              {locale === 'he' ? 'חזרה לדף הבית' : 'Back to Home'}
            </span>
          </Link>
        </motion.div>

        {/* Hero Section */}
        <HeroSection
          title={pageTitle}
          subtitle={stepDescription}
          locale={locale}
        />

        {/* Incomplete Profile Alert */}
        <AnimatePresence>
          {showIncompleteProfileMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mb-6"
            >
              <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Info className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <AlertTitle className="font-bold text-amber-900 mb-1">
                      {dict.incompleteProfileAlert.title}
                    </AlertTitle>
                    <AlertDescription className="text-sm text-amber-800 leading-relaxed">
                      {searchParams.get('reason') === 'verify_phone'
                        ? dict.incompleteProfileAlert.verifyPhoneDescription
                        : dict.incompleteProfileAlert.description}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <AnimatePresence>
          {showProgressBar && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md mb-6"
            >
              <ProgressBar
                currentStep={currentProgressBarStep}
                totalSteps={totalProgressBarSteps}
                stepLabel={dict.progressBar.stepLabel}
                locale={locale}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card Container */}
        <motion.div
          {...pageTransition}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full transform translate-x-20 -translate-y-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-transparent rounded-full transform -translate-x-16 translate-y-16" />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={registrationContextData.step}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Shine Effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-50" />
          </div>
        </motion.div>

        {/* Support Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            {dict.contactSupport}{' '}
            <Link
              href={`/${locale}/contact`}
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors inline-flex items-center gap-1"
            >
              {dict.contactSupportLink}
              <Shield className="w-3 h-3" />
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes gradient-slow {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 6s ease infinite;
        }
      `}</style>
    </>
  );
};

// ============================================================================
// MAIN EXPORT WITH PROVIDER
// ============================================================================

export default function RegisterClient({ dict, locale }: RegisterClientProps) {
  return (
    <RegistrationProvider>
      <RegisterStepsContent dict={dict} locale={locale} />
    </RegistrationProvider>
  );
}