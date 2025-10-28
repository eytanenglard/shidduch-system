// src/components/auth/steps/BasicInfoStep.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
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
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConsentCheckbox from '../ConsentCheckbox';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import { Input } from '@/components/ui/input';

interface BasicInfoStepProps {
  dict: RegisterStepsDict['steps']['basicInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  locale: 'he' | 'en';
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== '' && emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ dict, consentDict, locale }) => {
  const { data, updateField, prevStep, proceedToEmailVerification } = useRegistration();
  
  // States for validation and UI
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // States for consents
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [engagementConsent, setEngagementConsent] = useState(false);
  const [promotionalConsent, setPromotionalConsent] = useState(false);

  useEffect(() => {
    const isEmailValid = isValidEmail(data.email);
    const isPasswordValid = isValidPassword(data.password);
    const isNameValid = data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    setIsFormValid(isEmailValid && isPasswordValid && isNameValid && consentChecked && !isLoading);
  }, [data.email, data.password, data.firstName, data.lastName, consentChecked, isLoading]);

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
      const response = await fetch(`/api/auth/register?locale=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          language: data.language,
          engagementEmailsConsent: engagementConsent,
          promotionalEmailsConsent: promotionalConsent,
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

      <motion.h2 className="text-xl font-bold text-gray-800 mb-4" variants={itemVariants}>
        {dict.title}
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="emailBasic" className="block text-sm font-medium text-gray-700">
            {dict.emailLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="email" id="emailBasic" value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => setEmailError(isValidEmail(data.email) ? '' : dict.errors.invalidEmail)}
              placeholder={dict.emailPlaceholder} disabled={isLoading} required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} ${emailError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-cyan-200 focus:border-cyan-500'}`}
            />
          </div>
          {emailError && <p role="alert" className="text-red-500 text-xs mt-1">{emailError}</p>}
        </div>
        
        <div className="space-y-1">
          <label htmlFor="passwordBasic" className="block text-sm font-medium text-gray-700">
            {dict.passwordLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            <Input
              type={passwordVisible ? 'text' : 'password'} id="passwordBasic" value={data.password}
              onChange={(e) => updateField('password', e.target.value)}
              onBlur={() => setPasswordError(isValidPassword(data.password) ? '' : dict.errors.invalidPassword)}
              placeholder={dict.passwordPlaceholder} disabled={isLoading} required
              className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} ${passwordError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-cyan-200 focus:border-cyan-500'}`}
            />
            <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" aria-label={passwordVisible ? 'הסתר סיסמה' : 'הצג סיסמה'}>
              {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordError ? <p role="alert" className="text-red-500 text-xs mt-1">{passwordError}</p> : <p className="text-gray-500 text-xs mt-1">{dict.passwordHint}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="firstNameBasic" className="block text-sm font-medium text-gray-700">
            {dict.firstNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text" id="firstNameBasic" value={data.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder={dict.firstNamePlaceholder} disabled={isLoading} required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="lastNameBasic" className="block text-sm font-medium text-gray-700">
            {dict.lastNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text" id="lastNameBasic" value={data.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder={dict.lastNamePlaceholder} disabled={isLoading} required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1">
        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
          {dict.languageLabel}
        </label>
        <select
          id="language"
          value={data.language}
          onChange={(e) => updateField('language', e.target.value as 'he' | 'en')}
          disabled={isLoading}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none bg-white"
        >
          <option value="he">עברית</option>
          <option value="en">English</option>
        </select>
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

      <motion.div variants={itemVariants} className="space-y-4 pt-4">
        <div className="flex items-start space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="engagementConsent"
            checked={engagementConsent}
            onChange={(e) => setEngagementConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="engagementConsent" className="text-sm text-gray-700">
            {dict.engagementConsentLabel}
          </label>
        </div>
        <div className="flex items-start space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="promotionalConsent"
            checked={promotionalConsent}
            onChange={(e) => setPromotionalConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
          />
          <label htmlFor="promotionalConsent" className="text-sm text-gray-700">
            {dict.promotionalConsentLabel}
          </label>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-6 border-t border-gray-200"
      >
        <Button type="button" onClick={prevStep} variant="outline" disabled={isLoading} className="flex items-center gap-2">
          <ArrowRight className={`h-4 w-4 ml-2 ${locale === 'en' ? 'transform rotate-180' : ''}`} />{' '}
          {dict.backButton}{' '}
        </Button>
        <Button
          type="button"
          onClick={handleRegisterSubmit}
          disabled={!isFormValid || isLoading}
          className={`flex items-center gap-2 min-w-[200px] justify-center text-white font-medium px-4 py-2.5 rounded-lg transition-opacity ${
            isFormValid && !isLoading
              ? 'bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-md hover:shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>{dict.nextButtonLoading}</span>
            </>
          ) : (
            <>
              <span>{dict.nextButton}</span>
              <ArrowLeft className={`h-4 w-4 mr-2 ${locale === 'en' ? 'transform rotate-180' : ''}`} />{' '}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;