// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
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
}

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  dict,
  consentDict,
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

  const validateFirstName = (name: string) =>
    !name.trim() && setFirstNameError(dict.errors.firstNameRequired);
  const validateLastName = (name: string) =>
    !name.trim() && setLastNameError(dict.errors.lastNameRequired);
  const validatePhone = (phone: string) => {
    if (!phone.trim()) setPhoneError(dict.errors.phoneRequired);
    else if (!/^0\d{9}$/.test(phone)) setPhoneError(dict.errors.phoneInvalid);
    else setPhoneError('');
  };
  const validateAge = (birthDate: string) => {
    if (!birthDate) return setAgeError(dict.errors.birthDateRequired);
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age < 18) setAgeError(dict.errors.ageTooLow);
    else if (age > 120) setAgeError(dict.errors.ageTooHigh);
    else setAgeError('');
  };

  useEffect(() => {
    const isFieldsValid =
      registrationState.firstName.trim() &&
      registrationState.lastName.trim() &&
      /^0\d{9}$/.test(registrationState.phone) &&
      registrationState.birthDate &&
      registrationState.gender &&
      registrationState.maritalStatus;
    const consentRequirementMet = userHasAlreadyConsented || consentChecked;
    setIsFormValid(!!isFieldsValid && consentRequirementMet);
  }, [registrationState, consentChecked, userHasAlreadyConsented]);

  const handleContinue = async () => {
    // Trigger all validations on submit attempt
    validateFirstName(registrationState.firstName);
    validateLastName(registrationState.lastName);
    validatePhone(registrationState.phone);
    validateAge(registrationState.birthDate);

    if (!userHasAlreadyConsented && !consentChecked) {
      setConsentError(dict.errors.consentRequired);
      return;
    }

    if (!isFormValid) return;

    if (!userHasAlreadyConsented) {
      setIsSubmittingConsent(true);
      try {
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok) throw new Error();
        await updateSessionHook();
      } catch (error) {
        setGeneralApiError(dict.errors.consentApiError);
        setIsSubmittingConsent(false);
        return;
      }
      setIsSubmittingConsent(false);
    }
    nextStep();
  };

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
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-xl font-semibold text-gray-800"
        variants={itemVariants}
      >
        {dict.title}
      </motion.h2>
      <motion.p className="text-sm text-gray-500" variants={itemVariants}>
        {dict.subtitle}
      </motion.p>

      {generalApiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generalApiError}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        {/* All fields updated to use dict */}
        <div className="space-y-1">
          <label htmlFor="firstNamePersonal">
            {dict.firstNameLabel} <span className="text-red-500">*</span>
          </label>
          <Input
            id="firstNamePersonal"
            value={registrationState.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            onBlur={(e) => validateFirstName(e.target.value)}
            placeholder={dict.firstNamePlaceholder}
            required
            disabled={isSubmittingConsent}
          />
          {firstNameError && (
            <p className="text-red-500 text-xs mt-1">{firstNameError}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="lastNamePersonal">
            {dict.lastNameLabel} <span className="text-red-500">*</span>
          </label>
          <Input
            id="lastNamePersonal"
            value={registrationState.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            onBlur={(e) => validateLastName(e.target.value)}
            placeholder={dict.lastNamePlaceholder}
            required
            disabled={isSubmittingConsent}
          />
          {lastNameError && (
            <p className="text-red-500 text-xs mt-1">{lastNameError}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="phonePersonal">
            {dict.phoneLabel} <span className="text-red-500">*</span>
          </label>
          <Input
            id="phonePersonal"
            type="tel"
            value={registrationState.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            onBlur={(e) => validatePhone(e.target.value)}
            placeholder={dict.phonePlaceholder}
            required
            maxLength={10}
            disabled={isSubmittingConsent}
          />
          {phoneError && (
            <p className="text-red-500 text-xs mt-1">{phoneError}</p>
          )}
        </div>
        <div className="space-y-1">
          <label>
            {dict.genderLabel} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Button
              type="button"
              onClick={() => updateField('gender', Gender.MALE)}
              variant={
                registrationState.gender === Gender.MALE ? 'default' : 'outline'
              }
              disabled={isSubmittingConsent}
            >
              👨 {dict.male}
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
            >
              👩 {dict.female}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="birthDatePersonal">
            {dict.birthDateLabel} <span className="text-red-500">*</span>
          </label>
          <Input
            id="birthDatePersonal"
            type="date"
            value={registrationState.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
            onBlur={(e) => validateAge(e.target.value)}
            required
            disabled={isSubmittingConsent}
          />
          {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="maritalStatusPersonal">
            {dict.maritalStatusLabel} <span className="text-red-500">*</span>
          </label>
          <select
            id="maritalStatusPersonal"
            value={registrationState.maritalStatus}
            onChange={(e) => updateField('maritalStatus', e.target.value)}
            required
            disabled={isSubmittingConsent}
            className="w-full p-2 border rounded"
          >
            <option value="" disabled>
              {dict.maritalStatusPlaceholder}
            </option>
            <option value="רווק/ה">{dict.maritalStatuses.single}</option>
            <option value="גרוש/ה">{dict.maritalStatuses.divorced}</option>
            <option value="אלמן/ה">{dict.maritalStatuses.widowed}</option>
          </select>
        </div>
      </motion.div>

      {!userHasAlreadyConsented && (
        <motion.div variants={itemVariants} className="mt-6 pt-4 border-t">
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
        className="flex justify-between items-center pt-5 mt-6 border-t"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          disabled={isSubmittingConsent}
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          {dict.backButton}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isFormValid || isSubmittingConsent}
        >
          {isSubmittingConsent ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>{dict.nextButtonLoading}</span>
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

export default PersonalDetailsStep;
