// src/components/auth/steps/CompleteStep.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Mail,
  User,
  Phone,
  ClipboardList,
  Home,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserStatus } from '@prisma/client';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import { useRegistration, STEPS } from '../RegistrationContext';

// ============================================================================
// TYPES
// ============================================================================

interface CompleteStepProps {
  dict: RegisterStepsDict['steps']['complete'];
  locale: 'he' | 'en';
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
};

const circleVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const CompleteStep: React.FC<CompleteStepProps> = ({ dict, locale }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { goToStep } = useRegistration();
  const [isNavigating, setIsNavigating] = useState(false);

  // Auto-redirect when everything is complete
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;
    const user = session.user as SessionUserType;

    // If everything is done, auto-redirect to profile after 4 seconds
    if (user.isProfileComplete && user.isPhoneVerified) {
      const timer = setTimeout(() => {
        router.push(`/${locale}/profile`);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, session, router, locale]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <StandardizedLoadingSpinner className="text-teal-600 w-10 h-10" />
        <p className="text-lg text-gray-600">{dict.loading}</p>
      </div>
    );
  }

  // ============================================================================
  // UNAUTHENTICATED — redirect to sign in
  // ============================================================================

  if (sessionStatus === 'unauthenticated' || !session?.user) {
    router.push(`/${locale}/auth/signin`);
    return null;
  }

  const user = session.user as SessionUserType;

  // ============================================================================
  // NAVIGATION HELPER
  // ============================================================================

  const handleNavigate = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };

  // ============================================================================
  // SCENARIO 1: Needs email verification
  // ============================================================================

  if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="email-verification"
          className="space-y-6 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="flex justify-center" variants={circleVariants}>
            <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
              <Mail className="h-12 w-12 text-teal-600" />
            </div>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-800"
            variants={itemVariants}
          >
            {dict.verifyEmailTitle}
          </motion.h2>
          <motion.p className="text-gray-600" variants={itemVariants}>
            {dict.verifyEmailSubtitle}{' '}
            <span className="font-bold text-gray-700">{user.email}</span>.
            <br />
            {dict.verifyEmailPrompt}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================================================
  // SCENARIO 2: Needs profile completion
  // ============================================================================

  if (!user.isProfileComplete) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="profile-completion"
          className="space-y-6 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="flex justify-center" variants={circleVariants}>
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-12 w-12 text-indigo-600" />
            </div>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-800"
            variants={itemVariants}
          >
            {dict.completeProfileTitle}
          </motion.h2>
          <motion.p className="text-gray-600" variants={itemVariants}>
            {dict.completeProfileSubtitle}
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button
              onClick={() => goToStep(STEPS.PERSONAL_DETAILS)}
              className="w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600"
            >
              <User className="h-4 w-4 ml-2" />
              {dict.completeProfileButton}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================================================
  // SCENARIO 3: Needs phone verification
  // ============================================================================

  if (!user.isPhoneVerified) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="phone-verification"
          className="space-y-6 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="flex justify-center" variants={circleVariants}>
            <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center">
              <Phone className="h-12 w-12 text-pink-600" />
            </div>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-800"
            variants={itemVariants}
          >
            {dict.verifyPhoneTitle}
          </motion.h2>
          <motion.p className="text-gray-600" variants={itemVariants}>
            {dict.verifyPhoneSubtitle}
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button
              onClick={() => handleNavigate(`/${locale}/auth/verify-phone`)}
              disabled={isNavigating}
              className="w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  {locale === 'he' ? 'מעביר...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 ml-2" />
                  {dict.verifyPhoneButton}
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================================================
  // SCENARIO 4: Everything is complete! 🎉
  // ============================================================================

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="all-done"
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Success celebration */}
        <motion.div className="flex justify-center" variants={circleVariants}>
          <motion.div
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
          >
            <CheckCircle className="h-12 w-12 text-green-600" />
          </motion.div>
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-gray-800"
          variants={itemVariants}
        >
          {dict.allDoneTitle}
        </motion.h2>

        <motion.p className="text-gray-600" variants={itemVariants}>
          {dict.allDoneSubtitle}
        </motion.p>

        {/* Auto-redirect notice */}
        <motion.p className="text-xs text-gray-400" variants={itemVariants}>
          {locale === 'he'
            ? 'מועבר לפרופיל שלך בעוד מספר שניות...'
            : 'Redirecting to your profile in a few seconds...'}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <Button
            onClick={() => handleNavigate(`/${locale}/profile`)}
            disabled={isNavigating}
            className="w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600"
          >
            <User className="h-4 w-4 ml-2" />
            {dict.myProfileButton}
          </Button>

          <Button
            onClick={() => handleNavigate(`/${locale}/questionnaire`)}
            disabled={isNavigating}
            variant="outline"
            className="w-full border-2"
          >
            <ClipboardList className="h-4 w-4 ml-2" />
            {dict.questionnaireButton}
          </Button>

          <Link
            href={`/${locale}`}
            className="text-sm text-gray-500 hover:underline mt-2 inline-flex items-center justify-center gap-1"
          >
            <Home className="h-3 w-3" />
            {dict.backToHomeLink}
          </Link>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompleteStep;
