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

  // ============================ התיקון המרכזי ============================
  // נשתמש במשתנה מצב פשוט אחד בלבד
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true); // 1. נעל את הכפתורים
    setError(null);

    try {
      // 2. בצע את כל קריאות ה-API ההכרחיות ברצף
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

      // ודא שהנתונים הבסיסיים קיימים
      if (
        !profileData.firstName ||
        !profileData.lastName ||
        !profileData.phone
      ) {
        throw new Error(dict.errors.missingData);
      }

      // שמירת הפרופיל
      const profileResponse = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      // רענון הסשן
      await updateSessionHook();

      // שליחת קוד האימות
      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
      });
      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json();
        throw new Error(errorData.error || dict.errors.default);
      }

      // 3. נווט מיידית לדף הבא
      router.push(`/${locale}/auth/verify-phone`);
    } catch (err) {
      // במקרה של שגיאה, הצג אותה ושחרר את הכפתורים
      setError(err instanceof Error ? err.message : dict.errors.default);
      setIsLoading(false);
    }
    // הערה: אנחנו לא משחררים את הכפתורים (setIsLoading(false)) במקרה של הצלחה,
    // כי אנחנו כבר מנווטים מהדף הזה.
  };
  // ============================ סוף התיקון ============================

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
        {/* שדות הטופס נשארים ללא שינוי */}
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
          <ArrowRight className="h-4 w-4 ml-2" />
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
              <span>שומר...</span>
            </>
          ) : (
            <>
              {dict.nextButton} <ArrowLeft className="h-4 w-4 mr-2" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OptionalInfoStep;
