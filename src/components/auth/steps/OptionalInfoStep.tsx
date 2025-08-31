// src/components/auth/steps/OptionalInfoStep.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ArrowRight,
  Ruler,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import SubmissionStatusIndicator, {
  SubmissionStatus,
} from './SubmissionStatusIndicator';

// הממשק המלא של ה-props
interface OptionalInfoStepProps {
  dict: RegisterStepsDict['steps']['optionalInfo'];
  locale: 'he' | 'en';
}

const OptionalInfoStep: React.FC<OptionalInfoStepProps> = ({
  dict,
  locale,
}) => {
  const { data, updateField, prevStep } = useRegistration();
  const router = useRouter();
  const { update: updateSessionHook } = useSession();
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmissionStatus('savingProfile');
    setError(null);
    try {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        maritalStatus: data.maritalStatus,
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      if (
        !profileData.firstName ||
        !profileData.lastName ||
        !profileData.phone ||
        !profileData.gender ||
        !profileData.birthDate ||
        !profileData.maritalStatus
      ) {
        throw new Error(dict.errors.missingData);
      }

      const profileResponse = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      setSubmissionStatus('updatingSession');
      await updateSessionHook();

      setSubmissionStatus('sendingCode');
      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
      });
      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      setSubmissionStatus('allDone');

      setTimeout(() => {
        // ====================== LOGGING START: Client-Side Navigation ======================
        console.log(
          `\n\n=========================================================`
        );
        console.log(`--- [Client-Side | OptionalInfoStep] ---`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(
          `➡️  Preparing to navigate after completing optional info.`
        );

        // בדיקה קריטית של ה-locale שהתקבל כ-prop
        console.log(`   Value of 'locale' prop received: "${locale}"`);

        if (!locale || (locale !== 'he' && locale !== 'en')) {
          console.error(
            `❌ CRITICAL ERROR: The 'locale' prop is invalid or undefined! Value: "${locale}". This will cause a redirect loop or incorrect language.`
          );
          console.log(
            `   This error originates from how this component is rendered by its parent (RegisterClient.tsx).`
          );
        }

        const targetUrl = `/${locale}/auth/verify-phone`;

        console.log(`   Constructed Target URL: "${targetUrl}"`);
        console.log(`   Executing: router.push("${targetUrl}")`);
        console.log(
          `=========================================================\n`
        );
        // ======================= LOGGING END =======================

        router.push(targetUrl);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.default);
      setSubmissionStatus('error');
    }
  };

  const isSubmitting =
    submissionStatus !== 'idle' && submissionStatus !== 'error';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <SubmissionStatusIndicator
        currentStatus={submissionStatus}
        dict={dict.status}
      />

      <motion.div
        className={`space-y-5 ${isSubmitting ? 'blur-sm pointer-events-none' : ''}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2
          className="text-xl font-bold text-gray-800"
          variants={itemVariants}
        >
          {dict.title}
        </motion.h2>
        <motion.p className="text-gray-600 text-sm" variants={itemVariants}>
          {dict.subtitle}
        </motion.p>

        {error && (
          <motion.div variants={itemVariants}>
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dict.errors.title}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="heightOptional"
              className="block text-sm font-medium text-gray-700 flex items-center gap-1"
            >
              <Ruler className="h-4 w-4 text-gray-400" />
              {dict.heightLabel}
            </label>
            <Input
              type="number"
              id="heightOptional"
              min="120"
              max="220"
              value={data.height ?? ''}
              onChange={(e) =>
                updateField(
                  'height',
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder={dict.heightPlaceholder}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="occupationOptional"
              className="block text-sm font-medium text-gray-700 flex items-center gap-1"
            >
              <Briefcase className="h-4 w-4 text-gray-400" />
              {dict.occupationLabel}
            </label>
            <Input
              type="text"
              id="occupationOptional"
              value={data.occupation ?? ''}
              onChange={(e) => updateField('occupation', e.target.value)}
              placeholder={dict.occupationPlaceholder}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="educationOptional"
              className="block text-sm font-medium text-gray-700 flex items-center gap-1"
            >
              <GraduationCap className="h-4 w-4 text-gray-400" />
              {dict.educationLabel}
            </label>
            <Input
              type="text"
              id="educationOptional"
              value={data.education ?? ''}
              onChange={(e) => updateField('education', e.target.value)}
              placeholder={dict.educationPlaceholder}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-between pt-4 mt-6"
        >
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            disabled={isSubmitting}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            {dict.backButton}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 ${isSubmitting ? 'bg-gray-400' : 'bg-gradient-to-r from-cyan-500 to-pink-500'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>בתהליך...</span>
              </>
            ) : (
              <>
                {dict.nextButton} <ArrowLeft className="h-4 w-4 mr-2" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default OptionalInfoStep;
