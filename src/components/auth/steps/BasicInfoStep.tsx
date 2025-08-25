// src/components/auth/steps/BasicInfoStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConsentCheckbox from '../ConsentCheckbox';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface BasicInfoStepProps {
  dict: RegisterStepsDict['steps']['basicInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== '' && emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ dict, consentDict }) => {
  const { data, updateField, prevStep, proceedToEmailVerification } =
    useRegistration();
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const isEmailValid = isValidEmail(data.email);
    const isPasswordValid = isValidPassword(data.password);
    const isNameValid =
      data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    setIsFormValid(
      isEmailValid &&
        isPasswordValid &&
        isNameValid &&
        consentChecked &&
        !isLoading
    );
  }, [
    data.email,
    data.password,
    data.firstName,
    data.lastName,
    consentChecked,
    isLoading,
  ]);

  const handleRegisterSubmit = async () => {
    setConsentError(null);
    if (!consentChecked) {
      setConsentError(dict.errors.consentRequired);
      return;
    }

    if (!isFormValid) {
      setApiError(dict.errors.fillFields);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          marketingConsent: marketingConsent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || dict.errors.default);
      }

      proceedToEmailVerification(result.email);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
    } finally {
      setIsLoading(false);
    }
  };

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
      {apiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.h2
        className="text-xl font-bold text-gray-800 mb-4"
        variants={itemVariants}
      >
        {dict.title}
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        {/* Email, Password, First/Last Name fields updated to use dict */}
        {/* Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="emailBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.emailLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              id="emailBasic"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() =>
                setEmailError(
                  isValidEmail(data.email) ? '' : dict.errors.invalidEmail
                )
              }
              placeholder={dict.emailPlaceholder}
              disabled={isLoading}
              required
            />
          </div>
          {emailError && (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {emailError}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="passwordBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.passwordLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="password"
              id="passwordBasic"
              value={data.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() =>
                setPasswordError(
                  isValidPassword(data.password)
                    ? ''
                    : dict.errors.invalidPassword
                )
              }
              placeholder={dict.passwordPlaceholder}
              disabled={isLoading}
              required
            />
          </div>
          {passwordError ? (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {passwordError}
            </p>
          ) : (
            <p className="text-gray-500 text-xs mt-1">{dict.passwordHint}</p>
          )}
        </div>

        {/* Name Fields */}
        <div className="space-y-1">
          <label
            htmlFor="firstNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.firstNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="firstNameBasic"
              value={data.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder={dict.firstNamePlaceholder}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="lastNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.lastNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="lastNameBasic"
              value={data.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder={dict.lastNamePlaceholder}
              disabled={isLoading}
              required
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6">
        <ConsentCheckbox
          checked={consentChecked}
          onChange={(isChecked) => {
            setConsentChecked(isChecked);
            if (isChecked) setConsentError(null);
          }}
          error={consentError}
          dict={consentDict}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mt-4">
        <div className="flex items-start space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="marketingConsent"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="marketingConsent" className="text-sm text-gray-700">
            {dict.marketingConsent}
          </label>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-6 border-t border-gray-200"
      >
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          disabled={isLoading}
        >
          <ArrowRight className="h-4 w-4 ml-2" /> {dict.backButton}
        </Button>
        <Button
          type="button"
          onClick={handleRegisterSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
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

export default BasicInfoStep;
