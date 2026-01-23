// src/components/auth/steps/OptionalInfoStep.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// הסרנו את useSession כי אנחנו לא צריכים אותו יותר כאן
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================ התיקון הסופי ============================
  const handleSubmit = async () => {
    // נעל את הכפתורים כדי למנוע לחיצות כפולות
    setIsLoading(true);
    setError(null);

    try {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        maritalStatus: data.maritalStatus,
        city: data.city,  
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      if (
        !profileData.firstName ||
        !profileData.lastName ||
        !profileData.phone
      ) {
        throw new Error(dict.errors.missingData);
      }

      // 1. שמור את הפרופיל. חכה לסיום.
      const profileResponse = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      // 2. שלח את קוד האימות. חכה לסיום.
      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
      });
      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      // 3. נווט מיידית לדף הבא. בלי שום דבר באמצע.
      router.push(`/${locale}/auth/verify-phone`);
    } catch (err) {
      // אם משהו נכשל, הצג שגיאה ושחרר את הכפתורים
      setError(err instanceof Error ? err.message : dict.errors.default);
      setIsLoading(false);
    }
  };
  // =====================================================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="space-y-5"
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
        {/* שדות הטופס */}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
          disabled={isLoading}
        >
          <ArrowRight
            className={`h-4 w-4 ml-2 ${locale === 'en' ? 'transform rotate-180' : ''}`}
          />{' '}
          {dict.backButton}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`flex items-center gap-2 ${isLoading ? 'bg-gray-400' : 'bg-gradient-to-r from-cyan-500 to-pink-500'}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span></span>
            </>
          ) : (
            <>
              {dict.nextButton}{' '}
              <ArrowLeft
                className={`h-4 w-4 mr-2 ${locale === 'en' ? 'transform rotate-180' : ''}`}
              />{' '}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OptionalInfoStep;
