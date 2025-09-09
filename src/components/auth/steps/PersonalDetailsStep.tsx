// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import { useState, useEffect } from 'react';
import PhoneNumberInput from '../PhoneNumberInput';

import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  Edit3,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Gender } from '@prisma/client';
import { motion } from 'framer-motion';
import ConsentCheckbox from '../ConsentCheckbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface PersonalDetailsStepProps {
  dict: RegisterStepsDict['steps']['personalDetails'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  locale: string;
}

// פונקציה לולידציה של מספר טלפון
const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  // ולידציה בסיסית - מספר צריך להתחיל ב+ ולהכיל לפחות 10 ספרות
  const cleanPhone = phone.replace(/\D/g, '');
  return (
    cleanPhone.length >= 10 && cleanPhone.length <= 15 && phone.startsWith('+')
  );
};

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  dict,
  consentDict,
  locale,
}) => {
  const {
    data: registrationState,
    updateField,
    nextStep,
    prevStep,
  } = useRegistration();
  const { data: session, update: updateSessionHook } = useSession();

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [consentChecked, setConsentChecked] = useState(
    !!session?.user?.termsAndPrivacyAcceptedAt
  );
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [generalApiError, setGeneralApiError] = useState<string | null>(null);

  const userHasAlreadyConsented = !!session?.user?.termsAndPrivacyAcceptedAt;

  // פונקציות ולידציה
  const validateFirstName = (name: string) => {
    if (!name.trim()) {
      setFirstNameError(dict.errors.firstNameRequired);
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = (name: string) => {
    if (!name.trim()) {
      setLastNameError(dict.errors.lastNameRequired);
      return false;
    }
    setLastNameError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError(dict.errors.phoneRequired);
      return false;
    }
    if (!validatePhoneNumber(phone)) {
      setPhoneError(dict.errors.phoneInvalid);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateAge = (birthDate: string) => {
    if (!birthDate) {
      setAgeError(dict.errors.birthDateRequired);
      return false;
    }

    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    // חישוב גיל מדויק
    const exactAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (exactAge < 18) {
      setAgeError(dict.errors.ageTooLow);
      return false;
    }
    if (exactAge > 120) {
      setAgeError(dict.errors.ageTooHigh);
      return false;
    }
    setAgeError('');
    return true;
  };

  // בדיקת תקינות הטופס
  useEffect(() => {
    const isFieldsValid =
      registrationState.firstName.trim() &&
      registrationState.lastName.trim() &&
      registrationState.phone &&
      validatePhoneNumber(registrationState.phone) &&
      registrationState.birthDate &&
      registrationState.gender &&
      registrationState.maritalStatus;

    const consentRequirementMet = userHasAlreadyConsented || consentChecked;
    setIsFormValid(!!isFieldsValid && consentRequirementMet);
  }, [registrationState, consentChecked, userHasAlreadyConsented]);

  const handleContinue = async () => {
    // ולידציה של כל השדות
    const isFirstNameValid = validateFirstName(registrationState.firstName);
    const isLastNameValid = validateLastName(registrationState.lastName);
    const isPhoneValid = validatePhone(registrationState.phone);
    const isAgeValid = validateAge(registrationState.birthDate);

    // בדיקת הסכמה
    if (!userHasAlreadyConsented && !consentChecked) {
      setConsentError(dict.errors.consentRequired);
      return;
    }

    // אם יש שגיאות, לא ממשיכים
    if (!isFirstNameValid || !isLastNameValid || !isPhoneValid || !isAgeValid) {
      return;
    }

    // טיפול בהסכמה אם נדרש
    if (!userHasAlreadyConsented) {
      setIsSubmittingConsent(true);
      try {
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok) {
          throw new Error('Failed to accept terms');
        }
        await updateSessionHook();
      } catch (error) {
        setGeneralApiError(dict.errors.consentApiError);
        setIsSubmittingConsent(false);
        return;
      }
      setIsSubmittingConsent(false);
    }

    // מעבר לשלב הבא
    nextStep();
  };

  // אנימציות
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* כותרת */}
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{dict.title}</h2>
        <p className="text-gray-600">{dict.subtitle}</p>
      </motion.div>

      {/* הודעת שגיאה כללית */}
      {generalApiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{generalApiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* טופס */}
      <motion.div variants={itemVariants} className="space-y-5">
        {/* שם פרטי */}
        <div className="space-y-2">
          <label
            htmlFor="firstNamePersonal"
            className="text-sm font-medium text-gray-700"
          >
            {dict.firstNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              id="firstNamePersonal"
              value={registrationState.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              onBlur={(e) => validateFirstName(e.target.value)}
              placeholder={dict.firstNamePlaceholder}
              required
              disabled={isSubmittingConsent}
              className={`pr-12 py-3 transition-all duration-200 ${
                firstNameError
                  ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                  : 'focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
          </div>
          {firstNameError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm"
            >
              {firstNameError}
            </motion.p>
          )}
        </div>

        {/* שם משפחה */}
        <div className="space-y-2">
          <label
            htmlFor="lastNamePersonal"
            className="text-sm font-medium text-gray-700"
          >
            {dict.lastNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              id="lastNamePersonal"
              value={registrationState.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              onBlur={(e) => validateLastName(e.target.value)}
              placeholder={dict.lastNamePlaceholder}
              required
              disabled={isSubmittingConsent}
              className={`pr-12 py-3 transition-all duration-200 ${
                lastNameError
                  ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                  : 'focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
          </div>
          {lastNameError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm"
            >
              {lastNameError}
            </motion.p>
          )}
        </div>

        {/* מספר טלפון - הרכיب החדש */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {dict.phoneLabel} <span className="text-red-500">*</span>
          </label>
          <PhoneNumberInput
            value={registrationState.phone}
            onChange={(value) => updateField('phone', value || '')}
            disabled={isSubmittingConsent}
            locale={locale as 'he' | 'en'}
            error={phoneError}
          />
        </div>

        {/* מגדר */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {dict.genderLabel} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => updateField('gender', Gender.MALE)}
              variant={
                registrationState.gender === Gender.MALE ? 'default' : 'outline'
              }
              disabled={isSubmittingConsent}
              className={`flex items-center justify-center gap-2 py-4 transition-all duration-200 ${
                registrationState.gender === Gender.MALE
                  ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                  : 'hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <span className="text-xl">👨</span>
              {dict.male}
            </Button>
            <Button
              type="button"
              onClick={() => updateField('gender', Gender.FEMALE)}
              variant={
                registrationState.gender === Gender.FEMALE
                  ? 'default'
                  : 'outline'
              }
              disabled={isSubmittingConsent}
              className={`flex items-center justify-center gap-2 py-4 transition-all duration-200 ${
                registrationState.gender === Gender.FEMALE
                  ? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500'
                  : 'hover:bg-pink-50 hover:border-pink-300'
              }`}
            >
              <span className="text-xl">👩</span>
              {dict.female}
            </Button>
          </div>
        </div>

        {/* תאריך לידה */}
        <div className="space-y-2">
          <label
            htmlFor="birthDatePersonal"
            className="text-sm font-medium text-gray-700"
          >
            {dict.birthDateLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <Input
              id="birthDatePersonal"
              type="date"
              value={registrationState.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              onBlur={(e) => validateAge(e.target.value)}
              required
              disabled={isSubmittingConsent}
              className={`pr-12 py-3 transition-all duration-200 ${
                ageError
                  ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                  : 'focus:ring-blue-200 focus:border-blue-500'
              }`}
            />
          </div>
          {ageError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm"
            >
              {ageError}
            </motion.p>
          )}
        </div>

        {/* מצב משפחתי */}
        <div className="space-y-2">
          <label
            htmlFor="maritalStatusPersonal"
            className="text-sm font-medium text-gray-700"
          >
            {dict.maritalStatusLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
            <select
              id="maritalStatusPersonal"
              value={registrationState.maritalStatus}
              onChange={(e) => updateField('maritalStatus', e.target.value)}
              required
              disabled={isSubmittingConsent}
              className={`w-full pr-12 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white transition-all duration-200 ${'focus:ring-blue-200 focus:border-blue-500 border-gray-300'}`}
            >
              <option value="" disabled>
                {dict.maritalStatusPlaceholder}
              </option>
              <option value="רווק/ה">{dict.maritalStatuses.single}</option>
              <option value="גרוש/ה">{dict.maritalStatuses.divorced}</option>
              <option value="אלמן/ה">{dict.maritalStatuses.widowed}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* הסכמה לתנאים אם נדרש */}
      {!userHasAlreadyConsented && (
        <motion.div
          variants={itemVariants}
          className="pt-6 border-t border-gray-200"
        >
          <ConsentCheckbox
            checked={consentChecked}
            onChange={setConsentChecked}
            error={consentError}
            dict={consentDict}
          />
        </motion.div>
      )}

      {/* כפתורי ניווט */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center pt-6 border-t border-gray-200"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={isSubmittingConsent}
          className="flex items-center gap-2 px-6 py-3 hover:bg-gray-50"
        >
          <ArrowRight
            className={`h-4 w-4 ${locale === 'en' ? 'transform rotate-180' : ''}`}
          />
          {dict.backButton}
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!isFormValid || isSubmittingConsent}
          className={`flex items-center gap-2 px-8 py-3 transition-all duration-200 ${
            !isFormValid || isSubmittingConsent
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isSubmittingConsent ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{dict.nextButtonLoading}</span>
            </>
          ) : (
            <>
              <span>{dict.nextButton}</span>
              <ArrowLeft
                className={`h-4 w-4 ${locale === 'en' ? 'transform rotate-180' : ''}`}
              />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PersonalDetailsStep;
