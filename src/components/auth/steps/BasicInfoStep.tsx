// src/components/auth/steps/BasicInfoStep.tsx
'use client';

import { useState } from 'react';
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
  ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';

interface BasicInfoStepProps {
  dict: RegisterStepsDict['steps']['basicInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  validationDict: RegisterStepsDict['validationErrors'];
  locale: 'he' | 'en';
}

// פונקציות עזר לולידציה
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== '' && emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// קודי שגיאה שמצדיקים הצעה להירשם עם Google
const GOOGLE_SIGNUP_SUGGESTED_ERRORS = [
  'DB_CONNECTION_ERROR',
  'DB_INIT_ERROR',
  'P1001',
  'P1002',
  'P1003',
  'P1008',
  'P1017',
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  dict,
  consentDict,
  validationDict,
  locale,
}) => {
  const { data, updateField, prevStep, proceedToEmailVerification } =
    useRegistration();

  // ניהול מצבי שגיאה מקומיים
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  // ניהול מצבי טעינה ושגיאות כלליות
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ========== 🔴 הוספה: מצב להצגת הצעת Google ==========
  const [showGoogleSuggestion, setShowGoogleSuggestion] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // =====================================================

  // ניהול נראות סיסמה
  const [passwordVisible, setPasswordVisible] = useState(false);

  // רשימת השדות החסרים לתצוגה בראש הטופס
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // ========== 🔴 הוספה: פונקציה להרשמה עם Google ==========
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: `/${locale}/auth/register`,
        redirect: true,
      });
    } catch (error) {
      console.error('Google signup error:', error);
      setIsGoogleLoading(false);
    }
  };
  // =======================================================

  const handleRegisterSubmit = async () => {
    // 1. איפוס שגיאות קודמות
    setApiError(null);
    setMissingFields([]);
    setEmailError('');
    setPasswordError('');
    setShowGoogleSuggestion(false); // ========== 🔴 הוספה ==========

    let hasError = false;
    const currentMissing: string[] = [];

    // 2. ולידציה של השדות

    // בדיקת אימייל
    if (!isValidEmail(data.email)) {
      setEmailError(dict.errors.invalidEmail);
      currentMissing.push(validationDict.fields.email);
      hasError = true;
    }

    // בדיקת סיסמה
    if (!isValidPassword(data.password)) {
      setPasswordError(dict.errors.invalidPassword);
      currentMissing.push(validationDict.fields.password);
      hasError = true;
    }

    // בדיקת שם פרטי
    if (!data.firstName.trim()) {
      currentMissing.push(validationDict.fields.firstName);
      hasError = true;
    }

    // בדיקת שם משפחה
    if (!data.lastName.trim()) {
      currentMissing.push(validationDict.fields.lastName);
      hasError = true;
    }

    // 3. אם יש שגיאות - עצור והצג אותן
    if (hasError) {
      setMissingFields(currentMissing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. אם הכל תקין - שלח לשרת
    setIsLoading(true);

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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // ========== 🔴 הוספה: בדיקה אם להציע הרשמה עם Google ==========
        const errorCode = result.errorCode || '';
        if (
          GOOGLE_SIGNUP_SUGGESTED_ERRORS.includes(errorCode) ||
          result.error?.includes('שגיאת חיבור') ||
          result.error?.includes('P1001')
        ) {
          setShowGoogleSuggestion(true);
        }
        // ==============================================================
        throw new Error(result.error || dict.errors.default);
      }

      // מעבר לשלב אימות מייל עם האימייל שהתקבל מהשרת
      proceedToEmailVerification(result.email);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
    } finally {
      setIsLoading(false);
    }
  };

  // הגדרות אנימציה
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
      {/* התראת שגיאה כללית (מהשרת) */}
      {apiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* ========== 🔴 הוספה: הצעה להירשם עם Google ==========  */}
      <AnimatePresence>
        {showGoogleSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <AlertTitle className="text-blue-900 font-bold mb-1">
                      {locale === 'he'
                        ? 'נתקלנו בבעיה טכנית זמנית'
                        : 'We encountered a temporary technical issue'}
                    </AlertTitle>
                    <AlertDescription className="text-sm text-blue-700">
                      {locale === 'he'
                        ? 'ניתן להמשיך להירשם בקלות באמצעות חשבון Google שלך, או לנסות שוב בעוד מספר דקות.'
                        : 'You can easily continue registering with your Google account, or try again in a few minutes.'}
                    </AlertDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>
                        {locale === 'he'
                          ? 'המשך הרשמה עם Google'
                          : 'Continue with Google'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ========================================================= */}

      {/* התראת ולידציה (שדות חסרים) */}
      <AnimatePresence>
        {missingFields.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-800"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg shrink-0">
                  <ListChecks className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <AlertTitle className="text-red-900 font-bold mb-2">
                    {validationDict.title}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mb-2 font-medium">
                      {validationDict.pleaseFill}
                    </p>
                    <ul className="list-disc list-inside space-y-1 opacity-90 pr-2 rtl:pr-2 rtl:pl-0 ltr:pl-2">
                      {missingFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.h2
        className="text-xl font-bold text-gray-800 mb-4"
        variants={itemVariants}
      >
        {dict.title}
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        {/* שדה אימייל */}
        <div className="space-y-1">
          <label
            htmlFor="emailBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.emailLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="email"
              id="emailBasic"
              value={data.email}
              onChange={(e) => {
                updateField('email', e.target.value);
                if (emailError) setEmailError('');
              }}
              onBlur={() =>
                setEmailError(
                  isValidEmail(data.email) ? '' : dict.errors.invalidEmail
                )
              }
              placeholder={dict.emailPlaceholder}
              disabled={isLoading}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isLoading ? 'bg-gray-100' : ''} 
                ${
                  emailError ||
                  missingFields.includes(validationDict.fields.email)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
          </div>
          {emailError && (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {emailError}
            </p>
          )}
        </div>

        {/* שדה סיסמה */}
        <div className="space-y-1">
          <label
            htmlFor="passwordBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.passwordLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            <Input
              type={passwordVisible ? 'text' : 'password'}
              id="passwordBasic"
              value={data.password}
              onChange={(e) => {
                updateField('password', e.target.value);
                if (passwordError) setPasswordError('');
              }}
              onBlur={() =>
                setPasswordError(
                  isValidPassword(data.password)
                    ? ''
                    : dict.errors.invalidPassword
                )
              }
              placeholder={dict.passwordPlaceholder}
              disabled={isLoading}
              className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isLoading ? 'bg-gray-100' : ''} 
                ${
                  passwordError ||
                  missingFields.includes(validationDict.fields.password)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={passwordVisible ? 'הסתר סיסמה' : 'הצג סיסמה'}
            >
              {passwordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {passwordError ? (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {passwordError}
            </p>
          ) : (
            <p className="text-gray-500 text-xs mt-1">{dict.passwordHint}</p>
          )}
        </div>

        {/* שדה שם פרטי */}
        <div className="space-y-1">
          <label
            htmlFor="firstNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.firstNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="firstNameBasic"
              value={data.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder={dict.firstNamePlaceholder}
              disabled={isLoading}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isLoading ? 'bg-gray-100' : ''} 
                ${
                  missingFields.includes(validationDict.fields.firstName)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
          </div>
        </div>

        {/* שדה שם משפחה */}
        <div className="space-y-1">
          <label
            htmlFor="lastNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            {dict.lastNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="lastNameBasic"
              value={data.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder={dict.lastNamePlaceholder}
              disabled={isLoading}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors 
                ${isLoading ? 'bg-gray-100' : ''} 
                ${
                  missingFields.includes(validationDict.fields.lastName)
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                }`}
            />
          </div>
        </div>
      </motion.div>

      {/* בחירת שפה */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700"
        >
          {dict.languageLabel}
        </label>
        <select
          id="language"
          value={data.language}
          onChange={(e) =>
            updateField('language', e.target.value as 'he' | 'en')
          }
          disabled={isLoading}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none bg-white"
        >
          <option value="he">עברית</option>
          <option value="en">English</option>
        </select>
      </motion.div>

      {/* אזור הכפתורים */}
      <motion.div
        variants={itemVariants}
        className="pt-4 mt-6 border-t border-gray-200"
      >
        <Button
          type="button"
          onClick={handleRegisterSubmit}
          disabled={isLoading}
          className={`w-full flex items-center gap-2 justify-center text-white font-medium px-4 py-2.5 rounded-lg transition-all 
            ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg'
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
              <ArrowLeft
                className={`h-4 w-4 mr-2 ${locale === 'en' ? 'transform rotate-180' : ''}`}
              />{' '}
            </>
          )}
        </Button>

        <p className="text-[10px] text-gray-500 text-center mt-2 px-2">
          {dict.termsDisclaimer}
        </p>
      </motion.div>

      <div className="flex justify-center mt-2">
        <Button
          type="button"
          onClick={prevStep}
          variant="ghost"
          disabled={isLoading}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          <ArrowRight
            className={`h-3 w-3 ml-1 ${locale === 'en' ? 'transform rotate-180' : ''}`}
          />{' '}
          {dict.backButton}
        </Button>
      </div>
    </motion.div>
  );
};

export default BasicInfoStep;
