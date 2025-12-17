// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Edit3,
  Ruler,
  Briefcase,
  GraduationCap,
  BookOpen,
  Shield,
  ListChecks,
  Camera,
  ImagePlus,
  FileText,
  Info,
  Trash2,
  Star,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Custom Components
import PhoneNumberInput from '../PhoneNumberInput';
import ConsentCheckbox from '../ConsentCheckbox';
import FullScreenLoadingOverlay, {
  LoadingStep,
} from '../FullScreenLoadingOverlay';

// Types
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPES
// ============================================================================

type SubmissionStatus =
  | 'idle'
  | 'acceptingTerms'
  | 'savingProfile'
  | 'uploadingPhotos'
  | 'sendingCode'
  | 'redirecting'
  | 'error';

interface UploadedPhoto {
  file: File;
  preview: string;
  isMain: boolean;
}

// ============================================================================
// ANIMATION VARIANTS
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

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

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
    {/* 
        FIX: Z-Index Management
        האייקון נמצא ב-z-10 ומוגדר כ-pointer-events-none.
        הילדים (Input) יקבלו z-20 בקוד הראשי כדי להיות מעליו.
    */}
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

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  gradient: string;
  required?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  gradient,
  required = false,
}) => (
  <motion.div variants={itemVariants} className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-bold text-gray-800">
        {title}
        {required && <span className="text-red-500 mr-1">*</span>}
      </h3>
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
  validationDict: RegisterStepsDict['validationErrors'];
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States - Validation Errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [religiousLevelError, setReligiousLevelError] = useState('');

  // States - Submission
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');

  // State for validation summary
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Photo upload states
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const MAX_PHOTOS = 5;
  const MIN_PHOTOS = 1;

  // About Me state
  const [aboutMe, setAboutMe] = useState('');
  const MIN_ABOUT_LENGTH = 100;

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

  // Image handling ref logic
  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = uploadedPhotos.map((p) => p.preview);
  }, [uploadedPhotos]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - uploadedPhotos.length;
    if (remainingSlots <= 0) {
      toast.error(
        personalDetailsDict.photos?.maxPhotosError ||
          `ניתן להעלות עד ${MAX_PHOTOS} תמונות`
      );
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const newPhotos: UploadedPhoto[] = [];

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (!validTypes.includes(file.type)) {
          toast.error(
            personalDetailsDict.photos?.invalidTypeError ||
              `${file.name}: סוג קובץ לא נתמך`
          );
          return;
        }
        if (file.size > maxSize) {
          toast.error(
            personalDetailsDict.photos?.fileTooLargeError ||
              `${file.name}: הקובץ גדול מדי (מקסימום 5MB)`
          );
          return;
        }

        const previewUrl = URL.createObjectURL(file);

        newPhotos.push({
          file,
          preview: previewUrl,
          isMain: uploadedPhotos.length === 0 && newPhotos.length === 0,
        });
      });

    if (newPhotos.length > 0) {
      setUploadedPhotos((prev) => [...prev, ...newPhotos]);
      toast.success(
        personalDetailsDict.photos?.uploadSuccess ||
          `${newPhotos.length} תמונות נוספו בהצלחה`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => {
      const newPhotos = [...prev];
      const wasMain = newPhotos[index].isMain;
      newPhotos.splice(index, 1);

      if (wasMain && newPhotos.length > 0) {
        newPhotos[0].isMain = true;
      }
      return newPhotos;
    });
  };

  const handleSetMainPhoto = (index: number) => {
    setUploadedPhotos((prev) =>
      prev.map((photo, i) => ({
        ...photo,
        isMain: i === index,
      }))
    );
  };

  const loadingSteps: LoadingStep[] = useMemo(() => {
    const steps: LoadingStep[] = [];

    if (!userHasAlreadyConsented) {
      steps.push({
        id: 'acceptingTerms',
        text:
          optionalInfoDict.loadingOverlay?.acceptingTerms ||
          'מאשר תנאי שימוש...',
      });
    }

    steps.push({
      id: 'savingProfile',
      text:
        optionalInfoDict.loadingOverlay?.savingProfile ||
        optionalInfoDict.status.saving,
      subtext: optionalInfoDict.loadingOverlay?.savingProfileSubtext,
    });

    if (uploadedPhotos.length > 0) {
      steps.push({
        id: 'uploadingPhotos',
        text: personalDetailsDict.photos?.uploadingPhotos || 'מעלה תמונות...',
      });
    }

    steps.push({
      id: 'sendingCode',
      text:
        optionalInfoDict.loadingOverlay?.sendingCode ||
        optionalInfoDict.status.sendingCode,
      subtext: optionalInfoDict.loadingOverlay?.sendingCodeSubtext,
    });

    steps.push({
      id: 'redirecting',
      text:
        optionalInfoDict.loadingOverlay?.redirecting || 'מעביר לאימות טלפון...',
    });

    return steps;
  }, [
    userHasAlreadyConsented,
    optionalInfoDict,
    uploadedPhotos.length,
    personalDetailsDict.photos,
  ]);

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

  const uploadPhotosToServer = async (): Promise<boolean> => {
    if (uploadedPhotos.length === 0) return true;

    try {
      const mainPhotoIndex = uploadedPhotos.findIndex((p) => p.isMain);

      const uploadResults = await Promise.all(
        uploadedPhotos.map(async (photo, index) => {
          const formData = new FormData();
          formData.append('file', photo.file);

          const response = await fetch('/api/profile/images', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `שגיאה בהעלאת תמונה ${index + 1}`
            );
          }

          return response.json();
        })
      );

      if (mainPhotoIndex > 0 && uploadResults[mainPhotoIndex]?.image?.id) {
        await fetch(
          `/api/profile/images/${uploadResults[mainPhotoIndex].image.id}`,
          {
            method: 'PUT',
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
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

    if (!registrationState.firstName.trim()) {
      setFirstNameError(personalDetailsDict.errors.firstNameRequired);
      currentMissing.push(validationDict.fields.firstName);
      hasError = true;
    }

    if (!registrationState.lastName.trim()) {
      setLastNameError(personalDetailsDict.errors.lastNameRequired);
      currentMissing.push(validationDict.fields.lastName);
      hasError = true;
    }

    if (
      !registrationState.phone ||
      !validatePhoneNumber(registrationState.phone)
    ) {
      setPhoneError(personalDetailsDict.errors.phoneInvalid);
      currentMissing.push(validationDict.fields.phone);
      hasError = true;
    }

    if (!registrationState.gender) {
      currentMissing.push(validationDict.fields.gender);
      hasError = true;
    }

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

    if (!registrationState.maritalStatus) {
      currentMissing.push(validationDict.fields.maritalStatus);
      hasError = true;
    }

    if (!registrationState.religiousLevel) {
      setReligiousLevelError(personalDetailsDict.errors.religiousLevelRequired);
      currentMissing.push(validationDict.fields.religiousLevel);
      hasError = true;
    }

    if (!consentChecked) {
      setConsentError(personalDetailsDict.errors.consentRequired);
      currentMissing.push(validationDict.fields.terms);
      hasError = true;
    }

    if (!engagementConsent) {
      setEngagementConsentError(
        personalDetailsDict.errors.engagementConsentRequired
      );
      currentMissing.push(validationDict.fields.engagement);
      hasError = true;
    }

    if (uploadedPhotos.length < MIN_PHOTOS) {
      currentMissing.push(
        personalDetailsDict.photos?.fieldName || 'תמונת פרופיל'
      );
      hasError = true;
    }

    if (aboutMe.trim().length < MIN_ABOUT_LENGTH) {
      currentMissing.push(
        personalDetailsDict.aboutMe?.fieldName || 'הסיפור שלי'
      );
      hasError = true;
    }

    if (hasError) {
      setMissingFields(currentMissing);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);

    try {
      if (!userHasAlreadyConsented) {
        setSubmissionStatus('acceptingTerms');
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok)
          throw new Error(personalDetailsDict.errors.consentApiError);
      }

      setSubmissionStatus('savingProfile');

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
        about: aboutMe,
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

      if (uploadedPhotos.length > 0) {
        setSubmissionStatus('uploadingPhotos');
        await uploadPhotosToServer();
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <FullScreenLoadingOverlay
        isVisible={
          isLoading &&
          submissionStatus !== 'idle' &&
          submissionStatus !== 'error'
        }
        currentStepId={submissionStatus}
        steps={loadingSteps}
        dict={{
          title: optionalInfoDict.loadingOverlay?.title || 'מאמתים את הפרטים',
          subtitle:
            optionalInfoDict.loadingOverlay?.subtitle ||
            'זה לוקח רק מספר שניות, נא לא לסגור את החלון.',
        }}
        locale={locale}
      />

      {/* FIX: Added touchAction: 'manipulation' to main container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Intro */}
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

        {/* Alerts */}
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

        {/* SECTION 1: PERSONAL INFO */}
        <div className="space-y-6">
          <SectionHeader
            icon={<User className="w-5 h-5" />}
            title={isRTL ? 'פרטים אישיים' : 'Personal Information'}
            gradient="from-teal-500 to-cyan-500"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* FIRST NAME */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.firstNameLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Edit3 className="h-5 w-5" />}
                hasValue={!!registrationState.firstName}
              >
                {/* FIX: Removed backdrop-blur-sm */}
                <Input
                  id="firstName"
                  type="text"
                  value={registrationState.firstName}
                  onChange={(e) => {
                    updateField('firstName', e.target.value);
                    if (e.target.value.trim()) setFirstNameError('');
                  }}
                  placeholder={personalDetailsDict.firstNamePlaceholder}
                  disabled={isLoading}
                  className={`relative z-20 touch-manipulation pr-11 py-3 border-2 rounded-xl transition-all bg-white ${
                    firstNameError ||
                    missingFields.includes(validationDict.fields.firstName)
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
              </FieldWrapper>
              {firstNameError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {firstNameError}
                </p>
              )}
            </motion.div>

            {/* LAST NAME */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.lastNameLabel}{' '}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Edit3 className="h-5 w-5" />}
                hasValue={!!registrationState.lastName}
              >
                {/* FIX: Removed backdrop-blur-sm */}
                <Input
                  id="lastName"
                  type="text"
                  value={registrationState.lastName}
                  onChange={(e) => {
                    updateField('lastName', e.target.value);
                    if (e.target.value.trim()) setLastNameError('');
                  }}
                  placeholder={personalDetailsDict.lastNamePlaceholder}
                  disabled={isLoading}
                  className={`relative z-20 touch-manipulation pr-11 py-3 border-2 rounded-xl transition-all bg-white ${
                    lastNameError ||
                    missingFields.includes(validationDict.fields.lastName)
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
              </FieldWrapper>
              {lastNameError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {lastNameError}
                </p>
              )}
            </motion.div>
          </div>

          {/* PHONE */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              {personalDetailsDict.phoneLabel}{' '}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            {/* PhoneNumberInput manages its own z-index internally, but container is safe */}
            <PhoneNumberInput
              value={registrationState.phone}
              onChange={(value) => {
                updateField('phone', value || '');
                if (value && validatePhoneNumber(value)) setPhoneError('');
              }}
              disabled={isLoading}
              error={
                phoneError ||
                (missingFields.includes(validationDict.fields.phone)
                  ? ' '
                  : undefined)
              }
              locale={locale}
            />
            {phoneError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {phoneError}
              </p>
            )}
          </motion.div>

          {/* GENDER */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              {personalDetailsDict.genderLabel}{' '}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: Gender.MALE, label: personalDetailsDict.male },
                { value: Gender.FEMALE, label: personalDetailsDict.female },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField('gender', value)}
                  disabled={isLoading}
                  className={`touch-manipulation active:scale-[0.98] py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                    registrationState.gender === value
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : missingFields.includes(validationDict.fields.gender)
                        ? 'border-red-300 text-gray-600 hover:bg-gray-50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* BIRTH DATE */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label
              htmlFor="birthDate"
              className="text-sm font-semibold text-gray-700 flex items-center"
            >
              {personalDetailsDict.birthDateLabel}{' '}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <FieldWrapper
              icon={<Calendar className="h-5 w-5" />}
              hasValue={!!registrationState.birthDate}
            >
              {/* FIX: Removed backdrop-blur-sm */}
              <Input
                id="birthDate"
                type="date"
                value={registrationState.birthDate}
                onChange={(e) => {
                  updateField('birthDate', e.target.value);
                  if (e.target.value) validateAge(e.target.value);
                }}
                disabled={isLoading}
                className={`relative z-20 touch-manipulation pr-11 py-3 border-2 rounded-xl transition-all bg-white ${
                  ageError ||
                  missingFields.includes(validationDict.fields.birthDate)
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200'
                }`}
              />
            </FieldWrapper>
            {ageError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {ageError}
              </p>
            )}
          </motion.div>

          {/* MARITAL STATUS */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center">
              {personalDetailsDict.maritalStatusLabel}{' '}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <FieldWrapper
              icon={<Heart className="h-5 w-5" />}
              hasValue={!!registrationState.maritalStatus}
            >
              <Select
                dir={isRTL ? 'rtl' : 'ltr'}
                value={registrationState.maritalStatus}
                onValueChange={(value) => updateField('maritalStatus', value)}
                disabled={isLoading}
              >
                {/* FIX: Removed backdrop-blur-sm */}
                <SelectTrigger
                  className={`relative z-20 touch-manipulation w-full pr-11 pl-3 py-3 h-auto border-2 rounded-xl transition-all bg-white ${
                    missingFields.includes(validationDict.fields.maritalStatus)
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200'
                  }`}
                >
                  <SelectValue
                    placeholder={personalDetailsDict.maritalStatusPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">
                    {personalDetailsDict.maritalStatuses.single}
                  </SelectItem>
                  <SelectItem value="divorced">
                    {personalDetailsDict.maritalStatuses.divorced}
                  </SelectItem>
                  <SelectItem value="widowed">
                    {personalDetailsDict.maritalStatuses.widowed}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FieldWrapper>
          </motion.div>
        </div>

        {/* SECTION 2: OPTIONAL INFO */}
        <div className="space-y-6">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title={optionalInfoDict.title}
            subtitle={optionalInfoDict.subtitle}
            gradient="from-orange-500 to-amber-500"
          />
          <div className="grid grid-cols-2 gap-4">
            {/* HEIGHT */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="heightOptional"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.heightLabel}
              </Label>
              <FieldWrapper
                icon={<Ruler className="h-5 w-5" />}
                hasValue={!!registrationState.height}
              >
                {/* FIX: Removed backdrop-blur-sm */}
                <Input
                  type="number"
                  id="heightOptional"
                  value={registrationState.height ?? ''}
                  onChange={(e) =>
                    updateField(
                      'height',
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder={optionalInfoDict.heightPlaceholder}
                  disabled={isLoading}
                  min={100}
                  max={250}
                  className="relative z-20 touch-manipulation pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </FieldWrapper>
            </motion.div>

            {/* OCCUPATION */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="occupationOptional"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.occupationLabel}
              </Label>
              <FieldWrapper
                icon={<Briefcase className="h-5 w-5" />}
                hasValue={!!registrationState.occupation}
              >
                {/* FIX: Removed backdrop-blur-sm */}
                <Input
                  type="text"
                  id="occupationOptional"
                  value={registrationState.occupation ?? ''}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  placeholder={optionalInfoDict.occupationPlaceholder}
                  disabled={isLoading}
                  className="relative z-20 touch-manipulation pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </FieldWrapper>
            </motion.div>
          </div>

          {/* EDUCATION */}
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
              {/* FIX: Removed backdrop-blur-sm */}
              <Input
                type="text"
                id="educationOptional"
                value={registrationState.education ?? ''}
                onChange={(e) => updateField('education', e.target.value)}
                placeholder={optionalInfoDict.educationPlaceholder}
                disabled={isLoading}
                className="relative z-20 touch-manipulation pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
            </FieldWrapper>
          </motion.div>

          {/* RELIGIOUS LEVEL */}
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
                {/* FIX: Removed backdrop-blur-sm */}
                <SelectTrigger
                  className={`relative z-20 touch-manipulation w-full pr-11 pl-3 py-3 h-auto border-2 rounded-xl transition-all bg-white ${
                    religiousLevelError ||
                    missingFields.includes(validationDict.fields.religiousLevel)
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200'
                  }`}
                >
                  <SelectValue
                    placeholder={personalDetailsDict.religiousLevelPlaceholder}
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

        {/* SECTION 3: PHOTOS */}
        <div className="space-y-6">
          <SectionHeader
            icon={<Camera className="w-5 h-5" />}
            title={personalDetailsDict.photos?.title || 'תמונות שלכם'}
            subtitle={
              personalDetailsDict.photos?.subtitle ||
              'תמונות טובות מגדילות משמעותית את הסיכוי להתאמות מוצלחות'
            }
            gradient="from-rose-500 to-pink-500"
            required={true}
          />
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {uploadedPhotos.map((photo, index) => (
                <div
                  key={photo.preview}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                    photo.isMain
                      ? 'border-teal-500 ring-2 ring-teal-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo.preview}
                    alt={`תמונה ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {photo.isMain && (
                    <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-teal-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border-none shadow-md">
                      <Star className="w-3 h-3 fill-current" />
                      <span>
                        {personalDetailsDict.photos?.mainPhoto || 'ראשית'}
                      </span>
                    </Badge>
                  )}
                  <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!photo.isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(index)}
                        className="touch-manipulation active:scale-95 p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="touch-manipulation active:scale-95 p-2 bg-red-500/90 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {uploadedPhotos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={`touch-manipulation active:scale-95 aspect-square rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                    uploadedPhotos.length < MIN_PHOTOS &&
                    missingFields.includes(
                      validationDict.fields?.photos || 'תמונת פרופיל'
                    )
                      ? 'border-red-300 bg-red-50/30 text-red-500 hover:border-red-400 hover:bg-red-50/50'
                      : 'border-teal-300 bg-teal-50/30 text-teal-600 hover:border-teal-400 hover:bg-teal-50/50'
                  }`}
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-xs font-medium">
                    {personalDetailsDict.photos?.addPhoto || 'הוסף תמונה'}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {MAX_PHOTOS - uploadedPhotos.length}{' '}
                    {isRTL ? 'נותרו' : 'remaining'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {uploadedPhotos.length < MIN_PHOTOS &&
              missingFields.includes(
                personalDetailsDict.photos?.fieldName || 'תמונת פרופיל'
              ) && (
                <p className="text-xs text-red-600 flex items-center gap-1 mb-3">
                  <AlertCircle className="w-3 h-3" />
                  {personalDetailsDict.photos?.required ||
                    'יש להעלות לפחות תמונה אחת'}
                </p>
              )}
            <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-xl p-3 border border-rose-100">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-rose-600">
                  {personalDetailsDict.photos?.tip || '💡 טיפ:'}
                </span>{' '}
                {personalDetailsDict.photos?.tipText ||
                  'העלו תמונות ברורות שמציגות את הפנים שלכם. תמונות איכותיות מגדילות את הסיכוי לקבל הצעות שידוך מדויקות.'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* SECTION 4: ABOUT ME */}
        <div className="space-y-6">
          <SectionHeader
            icon={<FileText className="w-5 h-5" />}
            title={
              personalDetailsDict.aboutMe?.title || 'הסיפור שלי במילים שלי'
            }
            subtitle={
              personalDetailsDict.aboutMe?.subtitle ||
              'ספרו על עצמכם - זה החלק שהכי עוזר לשדכנים להכיר אתכם'
            }
            gradient="from-purple-500 to-indigo-500"
            required={true}
          />
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="aboutMe"
                className="text-sm font-semibold text-gray-700 flex items-center gap-1"
              >
                {personalDetailsDict.aboutMe?.label || 'ספרו על עצמכם'}
                <span className="text-red-500 mr-1">*</span>
              </Label>
            </div>
            {/* FIX: Removed backdrop-blur-sm */}
            <Textarea
              id="aboutMe"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder={
                personalDetailsDict.aboutMe?.placeholder || 'ספרו על עצמכם...'
              }
              disabled={isLoading}
              className={`relative z-20 touch-manipulation min-h-[150px] py-3 border-2 rounded-xl transition-all bg-white resize-none ${
                aboutMe.trim().length < MIN_ABOUT_LENGTH &&
                missingFields.includes(
                  personalDetailsDict.aboutMe?.fieldName || 'הסיפור שלי'
                )
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : aboutMe.length > 0 &&
                      aboutMe.trim().length < MIN_ABOUT_LENGTH
                    ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-400'
                    : 'border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200'
              }`}
              rows={6}
            />
            <div className="flex justify-between items-center">
              <div>
                {aboutMe.trim().length < MIN_ABOUT_LENGTH &&
                missingFields.includes(
                  personalDetailsDict.aboutMe?.fieldName || 'הסיפור שלי'
                ) ? (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {personalDetailsDict.aboutMe?.required ||
                      `יש לכתוב לפחות ${MIN_ABOUT_LENGTH} תווים`}
                  </p>
                ) : (
                  aboutMe.length > 0 &&
                  aboutMe.trim().length < MIN_ABOUT_LENGTH && (
                    <span className="text-xs text-amber-600">
                      {personalDetailsDict.aboutMe?.minChars?.replace(
                        '{{remaining}}',
                        String(MIN_ABOUT_LENGTH - aboutMe.trim().length)
                      ) ||
                        `עוד ${MIN_ABOUT_LENGTH - aboutMe.trim().length} תווים מינימום`}
                    </span>
                  )
                )}
              </div>
              <span
                className={`text-xs ${
                  aboutMe.trim().length >= MIN_ABOUT_LENGTH
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                {aboutMe.trim().length} / {MIN_ABOUT_LENGTH}+
              </span>
            </div>
          </motion.div>
        </div>

        {/* SECTION 5: CONSENTS */}
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
          <div className="space-y-3 px-2">
            <div
              className={`flex items-start space-x-2 rtl:space-x-reverse rounded-lg p-2 transition-colors ${
                missingFields.includes(validationDict.fields.engagement)
                  ? 'bg-red-50 ring-1 ring-red-200'
                  : ''
              }`}
            >
              <Checkbox
                id="engagementConsent"
                checked={engagementConsent}
                onCheckedChange={(checked) => {
                  const isChecked = checked as boolean;
                  setEngagementConsent(isChecked);
                  if (isChecked) setEngagementConsentError(null);
                }}
                className="touch-manipulation mt-1 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
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
            <div className="flex items-start space-x-2 rtl:space-x-reverse p-2">
              <Checkbox
                id="promotionalConsent"
                checked={promotionalConsent}
                onCheckedChange={(checked) =>
                  setPromotionalConsent(checked as boolean)
                }
                className="touch-manipulation mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
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
        </motion.div>

        {/* BUTTONS */}
        <motion.div variants={itemVariants} className="flex gap-4 pt-4">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            disabled={isLoading}
            className="touch-manipulation active:scale-[0.98] px-6 py-6 rounded-xl border-2 hover:bg-gray-50"
          >
            <ArrowRight className={`h-5 w-5 ${isRTL ? '' : 'rotate-180'}`} />
            <span className="sr-only">{personalDetailsDict.backButton}</span>
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="touch-manipulation active:scale-[0.98] flex-1 py-6 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isLoading && (
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
                aria-hidden="true"
              />
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
                  className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${
                    !isRTL ? 'rotate-180 group-hover:translate-x-1' : ''
                  }`}
                />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
}
