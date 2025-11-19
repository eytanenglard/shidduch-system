// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Ruler,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { Gender } from '@prisma/client';
import { motion } from 'framer-motion';
import ConsentCheckbox from '../ConsentCheckbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import SubmissionStatusIndicator, {
  SubmissionStatus,
} from './SubmissionStatusIndicator';

interface PersonalDetailsStepProps {
  personalDetailsDict: RegisterStepsDict['steps']['personalDetails'];
  optionalInfoDict: RegisterStepsDict['steps']['optionalInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  locale: 'he' | 'en';
}

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return (
    cleanPhone.length >= 10 && cleanPhone.length <= 15 && phone.startsWith('+')
  );
};

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  personalDetailsDict,
  optionalInfoDict,
  consentDict,
  locale,
}) => {
  const { data: registrationState, updateField, prevStep } = useRegistration();
  const { data: session, update: updateSessionHook } = useSession();
  const router = useRouter();

  // States for validation and UI
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [consentChecked, setConsentChecked] = useState(
    !!session?.user?.termsAndPrivacyAcceptedAt
  );
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // State for the new loading indicator
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');

  const userHasAlreadyConsented = !!session?.user?.termsAndPrivacyAcceptedAt;

  const validateFirstName = (name: string) => {
    if (!name.trim()) {
      setFirstNameError(personalDetailsDict.errors.firstNameRequired);
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = (name: string) => {
    if (!name.trim()) {
      setLastNameError(personalDetailsDict.errors.lastNameRequired);
      return false;
    }
    setLastNameError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError(personalDetailsDict.errors.phoneRequired);
      return false;
    }
    if (!validatePhoneNumber(phone)) {
      setPhoneError(personalDetailsDict.errors.phoneInvalid);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateAge = (birthDate: string) => {
    if (!birthDate) {
      setAgeError(personalDetailsDict.errors.birthDateRequired);
      return false;
    }
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    if (age < 18) {
      setAgeError(personalDetailsDict.errors.ageTooLow);
      return false;
    }
    if (age > 120) {
      setAgeError(personalDetailsDict.errors.ageTooHigh);
      return false;
    }
    setAgeError('');
    return true;
  };

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

  const handleSubmit = async () => {
    setApiError(null);
    const isFirstNameValid = validateFirstName(registrationState.firstName);
    const isLastNameValid = validateLastName(registrationState.lastName);
    const isPhoneValid = validatePhone(registrationState.phone);
    const isAgeValid = validateAge(registrationState.birthDate);
    if (!userHasAlreadyConsented && !consentChecked) {
      setConsentError(personalDetailsDict.errors.consentRequired);
      return;
    }
    if (!isFirstNameValid || !isLastNameValid || !isPhoneValid || !isAgeValid) {
      return;
    }

    setIsLoading(true);
    setSubmissionStatus('savingProfile'); // Start the indicator

    try {
      if (!userHasAlreadyConsented) {
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok)
          throw new Error(personalDetailsDict.errors.consentApiError);
        await updateSessionHook();
      }

      const profileData = {
        firstName: registrationState.firstName,
        lastName: registrationState.lastName,
        phone: registrationState.phone,
        gender: registrationState.gender,
        birthDate: registrationState.birthDate,
        maritalStatus: registrationState.maritalStatus,
        height: registrationState.height,
        occupation: registrationState.occupation,
        education: registrationState.education,
      };
      const profileResponse = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || optionalInfoDict.errors.default);
      }

      setSubmissionStatus('sendingCode'); // Update to the next step

      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
      });
      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json();
        throw new Error(errorData.error || optionalInfoDict.errors.default);
      }

      router.push(`/${locale}/auth/verify-phone`);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : optionalInfoDict.errors.default
      );
      setIsLoading(false);
      setSubmissionStatus('error'); // Hide on error
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const submissionSteps = [
    {
      id: 'savingProfile' as SubmissionStatus,
      text: optionalInfoDict.status.saving,
    },
    {
      id: 'sendingCode' as SubmissionStatus,
      text: optionalInfoDict.status.sendingCode,
    },
  ];

  return (
    <>
      <SubmissionStatusIndicator
        currentStatus={submissionStatus}
        steps={submissionSteps}
        dict={{
          title: 'מאמתים את הפרטים', // Can be moved to dictionary
          subtitle: 'זה לוקח רק מספר שניות, נא לא לסגור את החלון.',
        }}
      />
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {personalDetailsDict.title}
          </h2>
          <p className="text-gray-600">{personalDetailsDict.subtitle}</p>
        </motion.div>

        {apiError && (
          <motion.div variants={itemVariants}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>שגיאה</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-5">
          {/* Form fields remain unchanged */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstNamePersonal"
                className="text-sm font-medium text-gray-700"
              >
                {personalDetailsDict.firstNameLabel}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <Input
                  id="firstNamePersonal"
                  value={registrationState.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  onBlur={(e) => validateFirstName(e.target.value)}
                  placeholder={personalDetailsDict.firstNamePlaceholder}
                  required
                  disabled={isLoading}
                  className={`pr-12 py-3 ${
                    firstNameError
                      ? 'border-red-400 focus:ring-red-200'
                      : 'focus:ring-blue-200'
                  }`}
                />
              </div>
              {firstNameError && (
                <p className="text-red-500 text-sm">{firstNameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="lastNamePersonal"
                className="text-sm font-medium text-gray-700"
              >
                {personalDetailsDict.lastNameLabel}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <Input
                  id="lastNamePersonal"
                  value={registrationState.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  onBlur={(e) => validateLastName(e.target.value)}
                  placeholder={personalDetailsDict.lastNamePlaceholder}
                  required
                  disabled={isLoading}
                  className={`pr-12 py-3 ${
                    lastNameError
                      ? 'border-red-400 focus:ring-red-200'
                      : 'focus:ring-blue-200'
                  }`}
                />
              </div>
              {lastNameError && (
                <p className="text-red-500 text-sm">{lastNameError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {personalDetailsDict.phoneLabel}{' '}
              <span className="text-red-500">*</span>
            </label>
            <PhoneNumberInput
              value={registrationState.phone}
              onChange={(value) => updateField('phone', value || '')}
              disabled={isLoading}
              locale={locale}
              error={phoneError}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {personalDetailsDict.genderLabel}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => updateField('gender', Gender.MALE)}
                variant={
                  registrationState.gender === Gender.MALE
                    ? 'default'
                    : 'outline'
                }
                disabled={isLoading}
                className={`py-4 ${
                  registrationState.gender === Gender.MALE ? 'bg-blue-500' : ''
                }`}
              >
                👨 {personalDetailsDict.male}
              </Button>
              <Button
                type="button"
                onClick={() => updateField('gender', Gender.FEMALE)}
                variant={
                  registrationState.gender === Gender.FEMALE
                    ? 'default'
                    : 'outline'
                }
                disabled={isLoading}
                className={`py-4 ${
                  registrationState.gender === Gender.FEMALE
                    ? 'bg-pink-500'
                    : ''
                }`}
              >
                👩 {personalDetailsDict.female}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="birthDatePersonal"
                className="text-sm font-medium text-gray-700"
              >
                {personalDetailsDict.birthDateLabel}{' '}
                <span className="text-red-500">*</span>
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
                  disabled={isLoading}
                  className={`pr-12 py-3 ${
                    ageError
                      ? 'border-red-400 focus:ring-red-200'
                      : 'focus:ring-blue-200'
                  }`}
                />
              </div>
              {ageError && <p className="text-red-500 text-sm">{ageError}</p>}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="maritalStatusPersonal"
                className="text-sm font-medium text-gray-700"
              >
                {personalDetailsDict.maritalStatusLabel}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <select
                  id="maritalStatusPersonal"
                  value={registrationState.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pr-12 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white"
                >
                  <option value="" disabled>
                    {personalDetailsDict.maritalStatusPlaceholder}
                  </option>
                  <option value="רווק/ה">
                    {personalDetailsDict.maritalStatuses.single}
                  </option>
                  <option value="גרוש/ה">
                    {personalDetailsDict.maritalStatuses.divorced}
                  </option>
                  <option value="אלמן/ה">
                    {personalDetailsDict.maritalStatuses.widowed}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {optionalInfoDict.title}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {optionalInfoDict.subtitle}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="heightOptional"
                  className="text-sm font-medium text-gray-700 flex items-center gap-1"
                >
                  <Ruler className="h-4 w-4 text-gray-400" />
                  {optionalInfoDict.heightLabel}
                </label>
                <Input
                  type="number"
                  id="heightOptional"
                  min="120"
                  max="220"
                  value={registrationState.height ?? ''}
                  onChange={(e) =>
                    updateField(
                      'height',
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder={optionalInfoDict.heightPlaceholder}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="occupationOptional"
                  className="text-sm font-medium text-gray-700 flex items-center gap-1"
                >
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  {optionalInfoDict.occupationLabel}
                </label>
                <Input
                  type="text"
                  id="occupationOptional"
                  value={registrationState.occupation ?? ''}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder={optionalInfoDict.occupationPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <label
                htmlFor="educationOptional"
                className="text-sm font-medium text-gray-700 flex items-center gap-1"
              >
                <GraduationCap className="h-4 w-4 text-gray-400" />
                {optionalInfoDict.educationLabel}
              </label>
              <Input
                type="text"
                id="educationOptional"
                value={registrationState.education ?? ''}
                onChange={(e) => updateField('education', e.target.value)}
                placeholder={optionalInfoDict.educationPlaceholder}
                disabled={isLoading}
              />
            </div>
          </div>
        </motion.div>

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

        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center pt-6 border-t border-gray-200"
        >
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowRight
              className={`h-4 w-4 ${
                locale === 'en' ? 'transform rotate-180' : ''
              }`}
            />
            {personalDetailsDict.backButton}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="flex items-center gap-2 min-w-[150px] justify-center"
          >
            <>
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{personalDetailsDict.nextButtonLoading}</span>
                </>
              ) : (
                <>
                  <span>{personalDetailsDict.nextButton}</span>
                  <ArrowLeft
                    className={`h-4 w-4 ${
                      locale === 'en' ? 'transform rotate-180' : ''
                    }`}
                  />
                </>
              )}
            </>
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default PersonalDetailsStep;
