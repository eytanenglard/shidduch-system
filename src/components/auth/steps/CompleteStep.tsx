// src/components/auth/steps/CompleteStep.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserStatus } from '@prisma/client';
import type { User as SessionUserType } from '@/types/next-auth';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

interface CompleteStepProps {
  dict: RegisterStepsDict['steps']['complete'];
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
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

const CompleteStep: React.FC<CompleteStepProps> = ({ dict }) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <StandardizedLoadingSpinner className="text-cyan-600 w-10 h-10" />
        <p className="text-lg text-gray-600">{dict.loading}</p>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated' || !session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const user = session.user as SessionUserType;

  // Scenario 1: Needs email verification
  if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
    return (
      <motion.div
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex justify-center" variants={circleVariants}>
          <div className="w-24 h-24 rounded-full bg-cyan-100 flex items-center justify-center">
            <Mail className="h-12 w-12 text-cyan-600" />
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
    );
  }

  // Scenario 2: Needs profile completion
  if (!user.isProfileComplete) {
    return (
      <motion.div
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
            onClick={() =>
              router.push('/auth/register?reason=complete_profile')
            }
            className="w-full"
          >
            {dict.completeProfileButton}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Scenario 3: Needs phone verification
  if (!user.isPhoneVerified) {
    return (
      <motion.div
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
            onClick={() => router.push('/auth/verify-phone')}
            className="w-full"
          >
            {dict.verifyPhoneButton}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Scenario 4: Everything is complete
  return (
    <motion.div
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex justify-center" variants={circleVariants}>
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
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
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <Button onClick={() => router.push('/profile')} className="w-full">
          <User className="h-4 w-4 ml-2" /> {dict.myProfileButton}
        </Button>
        <Button
          onClick={() => router.push('/questionnaire')}
          variant="outline"
          className="w-full"
        >
          {dict.questionnaireButton}
        </Button>
        <Link href="/" className="text-sm text-gray-500 hover:underline mt-2">
          {dict.backToHomeLink}
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CompleteStep;
