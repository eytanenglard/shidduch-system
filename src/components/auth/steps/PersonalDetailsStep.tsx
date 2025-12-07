// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Gender } from '@prisma/client';

// Icons
import {
  User,
  Calendar,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Languages,
  Edit3,
  Ruler,
  Briefcase,
  GraduationCap,
  BookOpen,
  Shield,
  Users,
  ListChecks, // אייקון חדש לרשימת השגיאות
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Custom Components
import PhoneNumberInput from '../PhoneNumberInput';
import ConsentCheckbox from '../ConsentCheckbox';
import SubmissionStatusIndicator, {
  SubmissionStatus,
} from './SubmissionStatusIndicator';

// Types
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// ANIMATION & STYLING VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// Helper Component: Field Wrapper
interface FieldWrapperProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  hasValue?: boolean;
  className?: string;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  icon,
  hasValue = false,
  className = '',
}) => (
  <div className={`relative group ${className}`}>
    <div
      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10 pointer-events-none ${
        hasValue
          ? 'text-teal-500 scale-110'
          : 'text-gray-400 group-hover:text-gray-500'
      }`}
    >
      {icon}
    </div>
    {children}
  </div>
);

// Helper Component: Section Header
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  gradient: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  gradient,
}) => (
  <motion.div variants={itemVariants} className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    {subtitle && (
      <p className="text-sm text-gray-600 leading-relaxed mr-12">{subtitle}</p>
    )}
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface PersonalDetailsStepProps {
  personalDetailsDict: RegisterStepsDict['steps']['personalDetails'];
  optionalInfoDict: RegisterStepsDict['steps']['optionalInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  validationDict: RegisterStepsDict['validationErrors']; // מילון הודעות השגיאה החדש
  locale: 'he' | 'en';
}

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return (
    cleanPhone.length >= 10 && cleanPhone.length <= 15 && phone.startsWith('+')
  );
};

export default function PersonalDetailsStep({
  personalDetailsDict,
  optionalInfoDict,
  consentDict,
  validationDict,
  locale,
}: PersonalDetailsStepProps) {
  const { data: registrationState, updateField, prevStep } = useRegistration();
  const { data: session } = useSession();
  const router = useRouter();

  // States
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [religiousLevelError, setReligiousLevelError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');

  // New State for validation summary
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Consent Logic
  const userHasAlreadyConsented = !!session?.user?.termsAndPrivacyAcceptedAt;
  const [consentChecked, setConsentChecked] = useState(userHasAlreadyConsented);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [engagementConsent, setEngagementConsent] = useState(
    session?.user?.engagementEmailsConsent || false
  );
  const [promotionalConsent, setPromotionalConsent] = useState(
    session?.user?.promotionalEmailsConsent || false
  );
  const [engagementConsentError, setEngagementConsentError] = useState<
    string | null
  >(null);

  const isRTL = locale === 'he';

  const religiousLevelOptions = useMemo(() => {
    return Object.entries(personalDetailsDict.religiousLevels).map(
      ([value, label]) => ({
        value,
        label,
      })
    );
  }, [personalDetailsDict.religiousLevels]);

  useEffect(() => {
    router.prefetch(`/${locale}/auth/verify-phone`);
  }, [router, locale]);

  // Validation Functions
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

  const handleSubmit = async () => {
    // 1. איפוס שגיאות קודמות
    setApiError(null);
    setConsentError(null);
    setEngagementConsentError(null);
    setReligiousLevelError('');
    setMissingFields([]);
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    setAgeError('');

    const currentMissing: string[] = [];
    let hasError = false;

    // 2. בדיקת שדות והוספה לרשימת החסרים

    // שם פרטי
    if (!registrationState.firstName.trim()) {
      setFirstNameError(personalDetailsDict.errors.firstNameRequired);
      currentMissing.push(validationDict.fields.firstName);
      hasError = true;
    }

    // שם משפחה
    if (!registrationState.lastName.trim()) {
      setLastNameError(personalDetailsDict.errors.lastNameRequired);
      currentMissing.push(validationDict.fields.lastName);
      hasError = true;
    }

    // טלפון
    if (
      !registrationState.phone ||
      !validatePhoneNumber(registrationState.phone)
    ) {
      setPhoneError(personalDetailsDict.errors.phoneInvalid);
      currentMissing.push(validationDict.fields.phone);
      hasError = true;
    }

    // מגדר
    if (!registrationState.gender) {
      currentMissing.push(validationDict.fields.gender);
      hasError = true;
    }

    // תאריך לידה וגיל
    if (!registrationState.birthDate) {
      setAgeError(personalDetailsDict.errors.birthDateRequired);
      currentMissing.push(validationDict.fields.birthDate);
      hasError = true;
    } else {
      if (!validateAge(registrationState.birthDate)) {
        currentMissing.push(validationDict.fields.birthDate);
        hasError = true;
      }
    }

    // מצב משפחתי
    if (!registrationState.maritalStatus) {
      currentMissing.push(validationDict.fields.maritalStatus);
      hasError = true;
    }

    // רמה דתית
    if (!registrationState.religiousLevel) {
      setReligiousLevelError(personalDetailsDict.errors.religiousLevelRequired);
      currentMissing.push(validationDict.fields.religiousLevel);
      hasError = true;
    }

    // הסכמה לתנאי שימוש
    if (!consentChecked) {
      setConsentError(personalDetailsDict.errors.consentRequired);
      currentMissing.push(validationDict.fields.terms);
      hasError = true;
    }

    // הסכמה לדיוור (engagement)
    if (!engagementConsent) {
      setEngagementConsentError(
        personalDetailsDict.errors.engagementConsentRequired
      );
      currentMissing.push(validationDict.fields.engagement);
      hasError = true;
    }

    // 3. עצירה אם יש שגיאות
    if (hasError) {
      setMissingFields(currentMissing);
      // גלילה לראש העמוד כדי לראות את ההתראות
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. המשך תהליך שמירה (אם הכל תקין)
    setIsLoading(true);
    setSubmissionStatus('savingProfile');

    try {
      if (!userHasAlreadyConsented) {
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok)
          throw new Error(personalDetailsDict.errors.consentApiError);
      }

      const profileData = {
        firstName: registrationState.firstName,
        lastName: registrationState.lastName,
        phone: registrationState.phone,
        gender: registrationState.gender,
        birthDate: registrationState.birthDate,
        maritalStatus: registrationState.maritalStatus,
        religiousLevel: registrationState.religiousLevel,
        height: registrationState.height,
        occupation: registrationState.occupation,
        education: registrationState.education,
        engagementEmailsConsent: engagementConsent,
        promotionalEmailsConsent: promotionalConsent,
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

      setSubmissionStatus('sendingCode');

      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
      });
      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json();
        throw new Error(errorData.error || optionalInfoDict.errors.default);
      }

      setSubmissionStatus('redirecting');
      router.push(`/${locale}/auth/verify-phone`);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : optionalInfoDict.errors.default
      );
      setIsLoading(false);
      setSubmissionStatus('error');
    }
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
    {
      id: 'redirecting' as SubmissionStatus,
      text:
        locale === 'he'
          ? 'מעבירים אותך לאימות...'
          : 'Redirecting to verification...',
    },
  ];

  return (
    <>
      <SubmissionStatusIndicator
        currentStatus={submissionStatus}
        steps={submissionSteps}
        dict={{
          title: locale === 'he' ? 'מאמתים את הפרטים' : 'Verifying details',
          subtitle:
            locale === 'he'
              ? 'זה לוקח רק מספר שניות, נא לא לסגור את החלון.'
              : 'This takes just a few seconds, please do not close the window.',
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* הודעת פתיחה */}
        <motion.div
          variants={itemVariants}
          className="text-center p-4 bg-gradient-to-r from-teal-50 via-orange-50 to-rose-50 rounded-2xl border border-teal-100"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-800">
              {personalDetailsDict.title}
            </h2>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {personalDetailsDict.subtitle}
          </p>
        </motion.div>

        {/* --- אזור התראות שגיאה וולידציה --- */}
        <AnimatePresence>
          {(apiError || missingFields.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6"
            >
              <Alert
                variant="destructive"
                className="border-2 bg-red-50/80 border-red-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg shrink-0">
                    {/* אייקון משתנה בהתאם לסוג השגיאה */}
                    {apiError ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <ListChecks className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="w-full">
                    {apiError ? (
                      <AlertDescription className="text-sm font-medium pt-1">
                        {apiError}
                      </AlertDescription>
                    ) : (
                      <>
                        <AlertTitle className="text-red-900 font-bold mb-2">
                          {validationDict.title}
                        </AlertTitle>
                        <AlertDescription className="text-red-800 text-sm">
                          <p className="mb-2 font-medium">
                            {validationDict.pleaseFill}
                          </p>
                          <ul className="list-disc list-inside space-y-1 opacity-90 pr-2 rtl:pr-2 rtl:pl-0 ltr:pl-2">
                            {missingFields.map((field, i) => (
                              <li key={i}>{field}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </>
                    )}
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <div className="space-y-8">
          {/* --- PERSONAL DETAILS SECTION --- */}
          <div className="space-y-5">
            <SectionHeader
              icon={<User className="w-5 h-5" />}
              title={personalDetailsDict.title}
              gradient="from-teal-400 to-emerald-500"
            />

            {/* First Name */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="firstNamePersonal"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.firstNameLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Edit3 className="h-5 w-5" />}
                hasValue={!!registrationState.firstName}
              >
                <Input
                  id="firstNamePersonal"
                  value={registrationState.firstName}
                  onChange={(e) => {
                    updateField('firstName', e.target.value);
                    if (e.target.value.trim()) setFirstNameError('');
                  }}
                  onBlur={(e) => validateFirstName(e.target.value)}
                  placeholder={personalDetailsDict.firstNamePlaceholder}
                  required
                  disabled={isLoading}
                  className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                    firstNameError ||
                    missingFields.includes(validationDict.fields.firstName)
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-teal-400 focus:ring-teal-200'
                  } focus:ring-2`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FieldWrapper>
              {firstNameError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {firstNameError}
                </p>
              )}
            </motion.div>

            {/* Last Name */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="lastNamePersonal"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.lastNameLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Edit3 className="h-5 w-5" />}
                hasValue={!!registrationState.lastName}
              >
                <Input
                  id="lastNamePersonal"
                  value={registrationState.lastName}
                  onChange={(e) => {
                    updateField('lastName', e.target.value);
                    if (e.target.value.trim()) setLastNameError('');
                  }}
                  onBlur={(e) => validateLastName(e.target.value)}
                  placeholder={personalDetailsDict.lastNamePlaceholder}
                  required
                  disabled={isLoading}
                  className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                    lastNameError ||
                    missingFields.includes(validationDict.fields.lastName)
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-teal-400 focus:ring-teal-200'
                  } focus:ring-2`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FieldWrapper>
              {lastNameError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {lastNameError}
                </p>
              )}
            </motion.div>

            {/* Language Selection */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                {personalDetailsDict.languageLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Languages className="h-5 w-5" />}
                hasValue={!!registrationState.language}
              >
                <Select
                  dir={isRTL ? 'rtl' : 'ltr'}
                  value={registrationState.language}
                  onValueChange={(value) =>
                    updateField('language', value as 'he' | 'en')
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full pr-11 pl-3 py-3 h-auto border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200">
                    <SelectValue
                      placeholder={personalDetailsDict.languagePlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </motion.div>

            {/* Phone */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                {personalDetailsDict.phoneLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <div
                className={`rounded-xl ${phoneError || missingFields.includes(validationDict.fields.phone) ? 'ring-2 ring-red-300 bg-red-50' : ''}`}
              >
                <PhoneNumberInput
                  value={registrationState.phone}
                  onChange={(value) => {
                    updateField('phone', value || '');
                    if (value) setPhoneError('');
                  }}
                  disabled={isLoading}
                  locale={locale}
                  error={phoneError}
                />
              </div>
            </motion.div>

            {/* Gender Selection */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                {personalDetailsDict.genderLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <div
                className={`grid grid-cols-2 gap-4 p-1 rounded-xl ${missingFields.includes(validationDict.fields.gender) ? 'ring-2 ring-red-300 bg-red-50' : ''}`}
              >
                {/* Male Button */}
                <Button
                  type="button"
                  onClick={() => updateField('gender', Gender.MALE)}
                  variant="outline"
                  disabled={isLoading}
                  className={`py-6 rounded-xl border-2 transition-all ${
                    registrationState.gender === Gender.MALE
                      ? 'bg-teal-50 border-teal-400 text-teal-700 ring-2 ring-teal-200'
                      : 'border-gray-200 hover:border-teal-200 text-gray-600'
                  }`}
                >
                  <span className="text-xl mr-2">👨</span>{' '}
                  {personalDetailsDict.male}
                </Button>

                {/* Female Button */}
                <Button
                  type="button"
                  onClick={() => updateField('gender', Gender.FEMALE)}
                  variant="outline"
                  disabled={isLoading}
                  className={`py-6 rounded-xl border-2 transition-all ${
                    registrationState.gender === Gender.FEMALE
                      ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-200'
                      : 'border-gray-200 hover:border-rose-200 text-gray-600'
                  }`}
                >
                  <span className="text-xl mr-2">👩</span>{' '}
                  {personalDetailsDict.female}
                </Button>
              </div>
            </motion.div>

            {/* Birth Date & Marital Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Birth Date */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label
                  htmlFor="birthDatePersonal"
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  {personalDetailsDict.birthDateLabel}{' '}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <FieldWrapper
                  icon={<Calendar className="h-5 w-5" />}
                  hasValue={!!registrationState.birthDate}
                >
                  <Input
                    id="birthDatePersonal"
                    type="date"
                    value={registrationState.birthDate}
                    onChange={(e) => {
                      updateField('birthDate', e.target.value);
                      if (e.target.value) setAgeError('');
                    }}
                    onBlur={(e) => validateAge(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                      ageError ||
                      missingFields.includes(validationDict.fields.birthDate)
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:border-teal-400 focus:ring-teal-200'
                    } focus:ring-2`}
                  />
                </FieldWrapper>
                {ageError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {ageError}
                  </p>
                )}
              </motion.div>

              {/* Marital Status */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label
                  htmlFor="maritalStatusPersonal"
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  {personalDetailsDict.maritalStatusLabel}{' '}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <FieldWrapper
                  icon={<Users className="h-5 w-5" />}
                  hasValue={!!registrationState.maritalStatus}
                >
                  <select
                    id="maritalStatusPersonal"
                    value={registrationState.maritalStatus}
                    onChange={(e) =>
                      updateField('maritalStatus', e.target.value)
                    }
                    required
                    disabled={isLoading}
                    className={`w-full pr-11 pl-3 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm appearance-none text-gray-900 ${
                      missingFields.includes(
                        validationDict.fields.maritalStatus
                      )
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-teal-200'
                    } focus:ring-2`}
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
                </FieldWrapper>
              </motion.div>
            </div>
          </div>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm font-medium text-gray-500">
                {optionalInfoDict.title}
              </span>
            </div>
          </motion.div>

          {/* --- OPTIONAL INFO SECTION --- */}
          <div className="space-y-5">
            <SectionHeader
              icon={<Sparkles className="w-5 h-5" />}
              title={optionalInfoDict.title}
              subtitle={optionalInfoDict.subtitle}
              gradient="from-orange-400 to-amber-500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Height */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label
                  htmlFor="heightOptional"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                >
                  {optionalInfoDict.heightLabel}
                </Label>
                <FieldWrapper
                  icon={<Ruler className="h-5 w-5" />}
                  hasValue={!!registrationState.height}
                >
                  <Input
                    type="number"
                    id="heightOptional"
                    min="120"
                    max="220"
                    value={registrationState.height ?? ''}
                    onChange={(e) =>
                      updateField(
                        'height',
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                    placeholder={optionalInfoDict.heightPlaceholder}
                    disabled={isLoading}
                    className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                </FieldWrapper>
              </motion.div>

              {/* Occupation */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label
                  htmlFor="occupationOptional"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                >
                  {optionalInfoDict.occupationLabel}
                </Label>
                <FieldWrapper
                  icon={<Briefcase className="h-5 w-5" />}
                  hasValue={!!registrationState.occupation}
                >
                  <Input
                    type="text"
                    id="occupationOptional"
                    value={registrationState.occupation ?? ''}
                    onChange={(e) => updateField('occupation', e.target.value)}
                    placeholder={optionalInfoDict.occupationPlaceholder}
                    disabled={isLoading}
                    className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                </FieldWrapper>
              </motion.div>
            </div>

            {/* Education */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="educationOptional"
                className="text-sm font-semibold text-gray-700 flex items-center gap-1"
              >
                {optionalInfoDict.educationLabel}
              </Label>
              <FieldWrapper
                icon={<GraduationCap className="h-5 w-5" />}
                hasValue={!!registrationState.education}
              >
                <Input
                  type="text"
                  id="educationOptional"
                  value={registrationState.education ?? ''}
                  onChange={(e) => updateField('education', e.target.value)}
                  placeholder={optionalInfoDict.educationPlaceholder}
                  disabled={isLoading}
                  className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </FieldWrapper>
            </motion.div>

            {/* Religious Level */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                {personalDetailsDict.religiousLevelLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<BookOpen className="h-5 w-5" />}
                hasValue={!!registrationState.religiousLevel}
              >
                <Select
                  dir={isRTL ? 'rtl' : 'ltr'}
                  value={registrationState.religiousLevel || ''}
                  onValueChange={(value) => {
                    updateField('religiousLevel', value);
                    if (value) setReligiousLevelError('');
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`w-full pr-11 pl-3 py-3 h-auto border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                      religiousLevelError ||
                      missingFields.includes(
                        validationDict.fields.religiousLevel
                      )
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200'
                    }`}
                  >
                    <SelectValue
                      placeholder={
                        personalDetailsDict.religiousLevelPlaceholder
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {religiousLevelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              {religiousLevelError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {religiousLevelError}
                </p>
              )}
            </motion.div>
          </div>

          {/* --- CONSENTS SECTION --- */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                consentError ||
                missingFields.includes(validationDict.fields.terms)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50'
              }`}
            >
              <ConsentCheckbox
                checked={consentChecked}
                onChange={(isChecked) => {
                  setConsentChecked(isChecked);
                  if (isChecked) setConsentError(null);
                }}
                error={consentError}
                dict={consentDict}
              />
            </div>

            {/* Marketing Consents */}
            <div className="space-y-3 px-2">
              {/* Engagement Consent */}
              <div
                className={`flex items-start space-x-2 rtl:space-x-reverse rounded-lg p-2 transition-colors ${missingFields.includes(validationDict.fields.engagement) ? 'bg-red-50 ring-1 ring-red-200' : ''}`}
              >
                <Checkbox
                  id="engagementConsent"
                  checked={engagementConsent}
                  onCheckedChange={(checked) => {
                    const isChecked = checked as boolean;
                    setEngagementConsent(isChecked);
                    if (isChecked) setEngagementConsentError(null);
                  }}
                  className="mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="engagementConsent"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {personalDetailsDict.engagementConsentLabel}
                    <span className="text-red-500 mr-1">*</span>
                  </label>
                  {engagementConsentError && (
                    <p className="text-xs text-red-500">
                      {engagementConsentError}
                    </p>
                  )}
                </div>
              </div>

              {/* Promotional Consent */}
              <div className="flex items-start space-x-2 rtl:space-x-reverse p-2">
                <Checkbox
                  id="promotionalConsent"
                  checked={promotionalConsent}
                  onCheckedChange={(checked) =>
                    setPromotionalConsent(checked as boolean)
                  }
                  className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="promotionalConsent"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    {personalDetailsDict.promotionalConsentLabel}
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 mt-2">
              <Shield className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                {isRTL
                  ? 'הפרטים שלך מאובטחים ומוצפנים.'
                  : 'Your details are secure and encrypted.'}
              </p>
            </div>
          </motion.div>

          {/* --- BUTTONS --- */}
          <motion.div variants={itemVariants} className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              disabled={isLoading}
              className="px-6 py-6 rounded-xl border-2 hover:bg-gray-50"
            >
              <ArrowRight className={`h-5 w-5 ${isRTL ? '' : 'rotate-180'}`} />
              <span className="sr-only">{personalDetailsDict.backButton}</span>
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              )}

              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{personalDetailsDict.nextButtonLoading}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{personalDetailsDict.nextButton}</span>
                  <ArrowLeft
                    className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${!isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`}
                  />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
