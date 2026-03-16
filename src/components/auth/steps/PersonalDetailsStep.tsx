// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Gender, ReligiousJourney } from '@prisma/client';
import Autocomplete from 'react-google-autocomplete';

// Icons
import {
  User,
  Calendar,
  Globe,
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
  MapPin,
  ChevronDown,
  ChevronUp,
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

// Types
import type { RegisterStepsDict } from '@/types/dictionaries/auth';
import type { User as SessionUserType } from '@/types/next-auth';

// ============================================================================
// DEBUG UTILITY — prints only in development
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';
const debugLog = (label: string, ...args: unknown[]) => {
  if (isDev) console.log(`[PersonalDetailsStep][${label}]`, ...args);
};

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 1;
const MIN_ABOUT_LENGTH = 100;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
];
const AUTO_SAVE_KEY = 'neshamatech_registration_draft';

// ============================================================================
// HELPER: Calculate date boundaries for birth date input
// ============================================================================

function getDateBoundaries(): { minDate: string; maxDate: string } {
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  const minDate = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate()
  );
  return {
    minDate: minDate.toISOString().split('T')[0],
    maxDate: maxDate.toISOString().split('T')[0],
  };
}

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

const fieldErrorVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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
// COMPONENT: SimpleConsentBox
// ============================================================================

interface SimpleConsentBoxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

const SimpleConsentBox: React.FC<SimpleConsentBoxProps> = ({
  checked,
  onToggle,
  label,
  required,
  error,
  disabled = false,
}) => {
  return (
    <div
      onClick={() => {
        if (!disabled) onToggle();
      }}
      className={`
        relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${
          checked
            ? 'bg-teal-50/60 border-teal-200 shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
        ${error ? 'bg-red-50/50 border-red-200 ring-1 ring-red-100' : ''}
      `}
    >
      <div className="mt-1 shrink-0">
        <Checkbox
          checked={checked}
          disabled={disabled}
          className="pointer-events-none data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
        />
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium leading-relaxed ${checked ? 'text-teal-900' : 'text-gray-700'}`}
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </p>
        <AnimatePresence>
          {error && (
            <motion.p
              variants={fieldErrorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-xs text-red-500 mt-1 font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// STYLING HELPERS
// ============================================================================

const inputBaseClasses = (hasError: boolean) => `
  w-full pr-10 md:pr-11 py-3 border-2 rounded-xl 
  bg-white/95 backdrop-blur-none
  text-base md:text-sm 
  transition-colors duration-200
  disabled:opacity-50
  ${
    hasError
      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
      : 'border-gray-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-200'
  }
`;

interface FieldWrapperProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  hasValue?: boolean;
  className?: string;
  hideIconOnMobile?: boolean;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  icon,
  hasValue = false,
  className = '',
  hideIconOnMobile = false,
}) => (
  <div className={`relative group ${className}`}>
    <div
      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none ${
        hasValue ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'
      } ${hideIconOnMobile ? 'hidden md:block' : ''}`}
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
  <motion.div variants={itemVariants} className="mb-4 md:mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-lg md:text-xl font-bold text-gray-800">
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
// PHONE VALIDATION
// ============================================================================

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return (
    cleanPhone.length >= 10 && cleanPhone.length <= 15 && phone.startsWith('+')
  );
};

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

export default function PersonalDetailsStep({
  personalDetailsDict,
  optionalInfoDict,
  consentDict,
  validationDict,
  locale,
}: PersonalDetailsStepProps) {
  const {
    data: registrationState,
    updateField,
    prevStep,
    startSubmission,
    updateSubmission,
    endSubmission,
  } = useRegistration();
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRTL = locale === 'he';
  const dateBounds = useMemo(() => getDateBoundaries(), []);

  // ============================================================================
  // ERROR STATES
  // ============================================================================

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [religiousLevelError, setReligiousLevelError] = useState('');
  const [cityError, setCityError] = useState('');
  const [originError, setOriginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // ============================================================================
  // LOCAL FORM STATES
  // ============================================================================

  const [cityInputValue, setCityInputValue] = useState(
    registrationState.city || ''
  );

  interface UploadedPhoto {
    file: File;
    preview: string;
    isMain: boolean;
  }

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [aboutMe, setAboutMe] = useState('');
  const [matchingNotes, setMatchingNotes] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Consents
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

  // ============================================================================
  // RELIGIOUS LEVEL + JOURNEY OPTIONS
  // ============================================================================

  const religiousLevelOptions = useMemo(() => {
    return Object.entries(personalDetailsDict.religiousLevels).map(
      ([value, label]) => ({ value, label })
    );
  }, [personalDetailsDict.religiousLevels]);

  const religiousJourneyOptions = useMemo(() => {
    return Object.entries(personalDetailsDict.religiousJourneys).map(
      ([value, label]) => ({ value, label })
    );
  }, [personalDetailsDict.religiousJourneys]);

  // Controls the conditional 2-step religious journey question
  const [journeyQuestionAnswer, setJourneyQuestionAnswer] = useState<
    'yes' | 'no' | null
  >(
    registrationState.religiousJourney === ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE
      ? 'yes'
      : registrationState.religiousJourney
      ? 'no'
      : null
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cleanup photo previews
  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = uploadedPhotos.map((p) => p.preview);
  }, [uploadedPhotos]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Sync city input
  useEffect(() => {
    if (registrationState.city) {
      setCityInputValue(registrationState.city);
    }
  }, [registrationState.city]);

  // Prefetch next pages
  useEffect(() => {
    router.prefetch(`/${locale}/auth/verify-phone`);
    router.prefetch(`/${locale}/profile`);
  }, [router, locale]);

  // Guide: open on desktop, closed on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setIsGuideOpen(!isMobile);
  }, []);

  // Auto-save aboutMe to sessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(
          AUTO_SAVE_KEY,
          JSON.stringify({
            aboutMe,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        /* sessionStorage unavailable */
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [aboutMe]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(AUTO_SAVE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.aboutMe && !aboutMe) {
          setAboutMe(parsed.aboutMe);
        }
      }
    } catch {
      /* Ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // PHOTO HANDLERS
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

    const newPhotos: UploadedPhoto[] = [];
    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (!VALID_IMAGE_TYPES.includes(file.type)) {
          toast.error(`${file.name}: סוג קובץ לא נתמך`);
          return;
        }
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name}: הקובץ גדול מדי (מקסימום 10MB)`);
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
        personalDetailsDict.photos?.uploadSuccess || 'התמונות נוספו בהצלחה'
      );
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => {
      const newPhotos = [...prev];
      const wasMain = newPhotos[index].isMain;
      URL.revokeObjectURL(newPhotos[index].preview); // FIX: revoke on remove
      newPhotos.splice(index, 1);
      if (wasMain && newPhotos.length > 0) {
        newPhotos[0].isMain = true;
      }
      return newPhotos;
    });
  };

  const handleSetMainPhoto = (index: number) => {
    setUploadedPhotos((prev) =>
      prev.map((photo, i) => ({ ...photo, isMain: i === index }))
    );
  };

  // ============================================================================
  // AGE VALIDATION
  // ============================================================================

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

  // ============================================================================
  // PHOTO UPLOAD TO SERVER
  // ============================================================================

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
          { method: 'PUT' }
        );
      }
      return true;
    } catch (error) {
      debugLog('uploadPhotosToServer', 'Error:', error);
      throw error;
    }
  };

  // ============================================================================
  // SUBMIT HANDLER
  // ============================================================================

  const handleSubmit = async () => {
    setApiError(null);
    setConsentError(null);
    setEngagementConsentError(null);
    setReligiousLevelError('');
    setCityError('');
    setOriginError('');
    setMissingFields([]);
    setFirstNameError('');
    setLastNameError('');
    setPhoneError('');
    setAgeError('');

    const currentMissing: string[] = [];
    let hasError = false;

    // --- Validation ---
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
    } else if (!validateAge(registrationState.birthDate)) {
      currentMissing.push(validationDict.fields.birthDate);
      hasError = true;
    }
    if (!registrationState.city || !registrationState.city.trim()) {
      setCityError(
        personalDetailsDict.errors.cityRequired || 'נא לבחור עיר מגורים'
      );
      currentMissing.push(personalDetailsDict.cityLabel || 'עיר');
      hasError = true;
    }
    if (!registrationState.origin || !registrationState.origin.trim()) {
      setOriginError(
        personalDetailsDict.errors.originRequired || 'נא לציין מוצא'
      );
      currentMissing.push(validationDict.fields.origin);
      hasError = true;
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
      // 1. Consent
      if (!userHasAlreadyConsented) {
        startSubmission(
          'acceptingTerms',
          optionalInfoDict.loadingOverlay?.acceptingTerms ||
            'מאשר תנאי שימוש...',
          optionalInfoDict.loadingOverlay?.subtitle
        );
        const consentResponse = await fetch('/api/user/accept-terms', {
          method: 'POST',
        });
        if (!consentResponse.ok)
          throw new Error(personalDetailsDict.errors.consentApiError);
      } else {
        startSubmission(
          'savingProfile',
          optionalInfoDict.loadingOverlay?.savingProfile ||
            optionalInfoDict.status.saving,
          optionalInfoDict.loadingOverlay?.subtitle
        );
      }

      // 2. Profile Data
      updateSubmission(
        'savingProfile',
        optionalInfoDict.loadingOverlay?.savingProfile ||
          optionalInfoDict.status.saving
      );

      const profileData = {
        firstName: registrationState.firstName,
        lastName: registrationState.lastName,
        phone: registrationState.phone,
        gender: registrationState.gender,
        birthDate: registrationState.birthDate,
        maritalStatus: registrationState.maritalStatus,
        religiousLevel: registrationState.religiousLevel,
        religiousJourney: registrationState.religiousJourney,
        city: registrationState.city,
        origin: registrationState.origin,
        height: registrationState.height,
        occupation: registrationState.occupation,
        education: registrationState.education,
        about: aboutMe,
        matchingNotes: matchingNotes,
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

      // 3. Upload Photos
      if (uploadedPhotos.length > 0) {
        updateSubmission(
          'uploadingPhotos',
          personalDetailsDict.photos?.uploadingPhotos || 'מעלה תמונות...'
        );
        await uploadPhotosToServer();
      }

      // 4. Refresh session — double-verify to ensure JWT cookie is written
      //    First call triggers the JWT callback with trigger="update" → writes new cookie
      await updateSession();

      //    Brief wait for cookie propagation (prevents race condition with middleware)
      await new Promise((resolve) => setTimeout(resolve, 300));

      //    Second call reads the now-updated cookie → gives us truly fresh data
      const verifiedSession = await updateSession();
      const freshUser = verifiedSession?.user as SessionUserType | undefined;
      const isAlreadyPhoneVerified = freshUser?.isPhoneVerified ?? false;

      debugLog(
        'handleSubmit',
        'Verified session — isPhoneVerified:',
        isAlreadyPhoneVerified,
        'isProfileComplete:',
        freshUser?.isProfileComplete
      );

      // 5. Clear auto-save draft
      try {
        sessionStorage.removeItem(AUTO_SAVE_KEY);
      } catch {
        /* ignore */
      }

      // 6. Navigate
      if (isAlreadyPhoneVerified) {
        updateSubmission(
          'redirecting',
          optionalInfoDict.loadingOverlay?.redirecting || 'מעביר לפרופיל...'
        );
        router.push(`/${locale}/profile`);
      } else {
        updateSubmission(
          'sendingCode',
          optionalInfoDict.loadingOverlay?.sendingCode ||
            optionalInfoDict.status.sendingCode
        );
        const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
          method: 'POST',
        });
        if (!sendCodeResponse.ok) {
          const errorData = await sendCodeResponse.json();
          throw new Error(errorData.error || optionalInfoDict.errors.default);
        }
        updateSubmission(
          'redirecting',
          optionalInfoDict.loadingOverlay?.redirecting ||
            'מעביר לאימות טלפון...'
        );
        router.push(`/${locale}/auth/verify-phone`);
      }
    } catch (err) {
      endSubmission(true);
      setApiError(
        err instanceof Error ? err.message : optionalInfoDict.errors.default
      );
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8"
    >
      {/* --- TITLE BANNER --- */}
      <motion.div
        variants={itemVariants}
        className="text-center p-4 md:p-5 bg-gradient-to-r from-teal-100/80 via-orange-100/60 to-rose-100/80 rounded-2xl border border-teal-200/60"
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

      {/* OAuth welcome banner */}
      {registrationState.isGoogleSignup && (
        <motion.div
          variants={itemVariants}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center"
        >
          <p className="text-sm text-emerald-700">
            {isRTL
              ? '✅ נרשמת בהצלחה! כעת נשלים כמה פרטים אישיים.'
              : "✅ Registered successfully! Now let's complete some personal details."}
          </p>
        </motion.div>
      )}

      {/* --- VALIDATION ALERT --- */}
      <AnimatePresence>
        {(apiError || missingFields.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-4 md:mb-6"
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

      {/* ====== SECTION 1: Personal Details ====== */}
      <div className="space-y-5 md:space-y-6">
        <SectionHeader
          icon={<User className="w-5 h-5" />}
          title={isRTL ? 'פרטים אישיים' : 'Personal Information'}
          gradient="from-teal-500 to-cyan-500"
        />

        {/* Names: 1 col on mobile, 2 on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                maxLength={50}
                className={inputBaseClasses(
                  !!firstNameError ||
                    missingFields.includes(validationDict.fields.firstName)
                )}
              />
            </FieldWrapper>
            <AnimatePresence>
              {firstNameError && (
                <motion.p
                  variants={fieldErrorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" /> {firstNameError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

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
                maxLength={50}
                className={inputBaseClasses(
                  !!lastNameError ||
                    missingFields.includes(validationDict.fields.lastName)
                )}
              />
            </FieldWrapper>
            <AnimatePresence>
              {lastNameError && (
                <motion.p
                  variants={fieldErrorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" /> {lastNameError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Phone */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center">
            {personalDetailsDict.phoneLabel}{' '}
            <span className="text-red-500 mr-1">*</span>
          </Label>
          <PhoneNumberInput
            value={registrationState.phone}
            onChange={(value) => {
              let cleanValue = value || '';
              if (cleanValue.startsWith('+9720')) {
                cleanValue = cleanValue.replace('+9720', '+972');
              }
              updateField('phone', cleanValue);
              if (cleanValue && validatePhoneNumber(cleanValue))
                setPhoneError('');
            }}
            disabled={isLoading}
            error={
              phoneError ||
              (missingFields.includes(validationDict.fields.phone)
                ? ' '
                : undefined)
            }
            locale={locale}
            placeholder="50 123 4567"
          />
          <AnimatePresence>
            {phoneError && (
              <motion.p
                variants={fieldErrorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {phoneError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gender with emoji icons */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center">
            {personalDetailsDict.genderLabel}{' '}
            <span className="text-red-500 mr-1">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: Gender.MALE,
                label: personalDetailsDict.male,
                icon: '👨',
              },
              {
                value: Gender.FEMALE,
                label: personalDetailsDict.female,
                icon: '👩',
              },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField('gender', value)}
                disabled={isLoading}
                className={`py-3.5 px-4 rounded-xl border-2 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  registrationState.gender === value
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                    : missingFields.includes(validationDict.fields.gender)
                      ? 'border-red-300 text-gray-600 hover:bg-gray-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* City with Autocomplete + inline styles */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label
            htmlFor="city-autocomplete"
            className="text-sm font-semibold text-gray-700 flex items-center"
          >
            {personalDetailsDict.cityLabel || 'עיר מגורים'}{' '}
            <span className="text-red-500 mr-1">*</span>
          </Label>
          <FieldWrapper
            icon={<MapPin className="h-5 w-5" />}
            hasValue={!!registrationState.city}
          >
            <Autocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              id="city-autocomplete"
              language={locale}
              value={cityInputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCityInputValue(e.target.value);
                if (e.target.value) setCityError('');
              }}
              onPlaceSelected={(place) => {
                if (!place || !place.address_components) {
                  updateField('city', cityInputValue || '');
                  return;
                }
                const cityComponent = place.address_components.find(
                  (component) => component.types.includes('locality')
                );
                const selectedCity =
                  cityComponent?.long_name ||
                  place.formatted_address ||
                  cityInputValue;
                updateField('city', selectedCity);
                setCityInputValue(selectedCity);
                setCityError('');
              }}
              options={{
                types: ['(cities)'],
                componentRestrictions: { country: 'il' },
                fields: ['address_components', 'formatted_address', 'geometry'],
              }}
              disabled={isLoading}
              placeholder={personalDetailsDict.cityPlaceholder || 'חפש עיר...'}
              style={{
                width: '100%',
                paddingRight: '2.75rem',
                paddingLeft: '0.75rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                fontSize: '1rem',
                lineHeight: '1.5rem',
                borderRadius: '0.75rem',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor:
                  cityError ||
                  missingFields.includes(personalDetailsDict.cityLabel || 'עיר')
                    ? '#fca5a5'
                    : '#e5e7eb',
                backgroundColor: 'rgba(255,255,255,0.95)',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              className="focus:border-teal-400 focus:ring-2 focus:ring-teal-200 hover:border-gray-300 disabled:opacity-50 md:text-sm"
            />
          </FieldWrapper>
          <AnimatePresence>
            {cityError && (
              <motion.p
                variants={fieldErrorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {cityError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Origin */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label
            htmlFor="origin"
            className="text-sm font-semibold text-gray-700 flex items-center"
          >
            {personalDetailsDict.originLabel}{' '}
            <span className="text-red-500 mr-1">*</span>
          </Label>
          <FieldWrapper
            icon={<Globe className="h-5 w-5" />}
            hasValue={!!registrationState.origin}
          >
            <Input
              id="origin"
              type="text"
              value={registrationState.origin || ''}
              onChange={(e) => {
                updateField('origin', e.target.value);
                if (e.target.value.trim()) setOriginError('');
              }}
              placeholder={personalDetailsDict.originPlaceholder}
              disabled={isLoading}
              className={inputBaseClasses(
                !!originError ||
                  missingFields.includes(validationDict.fields.origin)
              )}
            />
          </FieldWrapper>
          <AnimatePresence>
            {originError && (
              <motion.p
                variants={fieldErrorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {originError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Birth Date with min/max + hidden icon on mobile */}
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
            hideIconOnMobile={true}
          >
            <Input
              id="birthDate"
              type="date"
              value={registrationState.birthDate}
              onChange={(e) => {
                updateField('birthDate', e.target.value);
                if (e.target.value) validateAge(e.target.value);
              }}
              disabled={isLoading}
              min={dateBounds.minDate}
              max={dateBounds.maxDate}
              className={`${inputBaseClasses(!!ageError || missingFields.includes(validationDict.fields.birthDate))} pr-3 md:pr-11`}
            />
          </FieldWrapper>
          <AnimatePresence>
            {ageError && (
              <motion.p
                variants={fieldErrorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {ageError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Marital Status */}
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
              <SelectTrigger
                className={inputBaseClasses(
                  missingFields.includes(validationDict.fields.maritalStatus)
                )}
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

      {/* ====== SECTION 2: Optional Info ====== */}
      <div className="space-y-5 md:space-y-6">
        <SectionHeader
          icon={<Sparkles className="w-5 h-5" />}
          title={optionalInfoDict.title}
          subtitle={optionalInfoDict.subtitle}
          gradient="from-orange-500 to-amber-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={inputBaseClasses(false)}
              />
            </FieldWrapper>
          </motion.div>

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
              <Input
                type="text"
                id="occupationOptional"
                value={registrationState.occupation ?? ''}
                onChange={(e) => updateField('occupation', e.target.value)}
                placeholder={optionalInfoDict.occupationPlaceholder}
                disabled={isLoading}
                className={inputBaseClasses(false)}
              />
            </FieldWrapper>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label
            htmlFor="educationOptional"
            className="text-sm font-semibold text-gray-700"
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
              className={inputBaseClasses(false)}
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
                // Reset journey answer when level changes
                setJourneyQuestionAnswer(null);
                updateField('religiousJourney', undefined);
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={inputBaseClasses(
                  !!religiousLevelError ||
                    missingFields.includes(validationDict.fields.religiousLevel)
                )}
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
          <AnimatePresence>
            {religiousLevelError && (
              <motion.p
                variants={fieldErrorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {religiousLevelError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Religious Journey — conditional 2-step question */}
        <AnimatePresence>
          {registrationState.religiousLevel && (
            <motion.div
              key="journey-question"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <Label className="text-sm font-semibold text-gray-700 block">
                {personalDetailsDict.religiousJourneyQuestion}
              </Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={journeyQuestionAnswer === 'yes' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 transition-all ${
                    journeyQuestionAnswer === 'yes'
                      ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                      : 'border-gray-300 text-gray-700 hover:border-teal-400'
                  }`}
                  onClick={() => {
                    setJourneyQuestionAnswer('yes');
                    updateField('religiousJourney', ReligiousJourney.BORN_INTO_CURRENT_LIFESTYLE);
                  }}
                  disabled={isLoading}
                >
                  {personalDetailsDict.religiousJourneyYes}
                </Button>
                <Button
                  type="button"
                  variant={journeyQuestionAnswer === 'no' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 transition-all ${
                    journeyQuestionAnswer === 'no'
                      ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                      : 'border-gray-300 text-gray-700 hover:border-teal-400'
                  }`}
                  onClick={() => {
                    setJourneyQuestionAnswer('no');
                    updateField('religiousJourney', undefined);
                  }}
                  disabled={isLoading}
                >
                  {personalDetailsDict.religiousJourneyNo}
                </Button>
              </div>

              <AnimatePresence>
                {journeyQuestionAnswer === 'no' && (
                  <motion.div
                    key="journey-dropdown"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    <Label className="text-xs text-gray-600">
                      {personalDetailsDict.religiousJourneyLabel}
                    </Label>
                    <FieldWrapper
                      icon={<BookOpen className="h-5 w-5" />}
                      hasValue={!!registrationState.religiousJourney}
                    >
                      <Select
                        dir={isRTL ? 'rtl' : 'ltr'}
                        value={registrationState.religiousJourney || ''}
                        onValueChange={(value) =>
                          updateField('religiousJourney', value as ReligiousJourney)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className={inputBaseClasses(false)}>
                          <SelectValue
                            placeholder={personalDetailsDict.religiousJourneyPlaceholder}
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[220px]">
                          {religiousJourneyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldWrapper>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====== SECTION 3: Photos ====== */}
      <div className="space-y-5 md:space-y-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {uploadedPhotos.map((photo, index) => (
              <div
                key={photo.preview}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors duration-200 group ${
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
                  <Badge className="absolute top-1.5 right-1.5 z-10 bg-gradient-to-r from-teal-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border-none shadow-md max-w-[calc(100%-12px)] truncate">
                    <Star className="w-3 h-3 fill-current shrink-0" />
                    <span className="truncate">
                      {personalDetailsDict.photos?.mainPhoto || 'ראשית'}
                    </span>
                  </Badge>
                )}
                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {!photo.isMain && (
                    <button
                      type="button"
                      onClick={() => handleSetMainPhoto(index)}
                      className="p-3 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title={
                        personalDetailsDict.photos?.setAsMain ||
                        'הגדר כתמונה ראשית'
                      }
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-3 bg-red-500/90 rounded-full text-white hover:bg-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title={personalDetailsDict.photos?.remove || 'הסר'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {uploadedPhotos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className={`aspect-square rounded-xl border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center gap-2 ${
                  uploadedPhotos.length < MIN_PHOTOS &&
                  missingFields.includes(
                    personalDetailsDict.photos?.fieldName || 'תמונת פרופיל'
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

          <AnimatePresence>
            {uploadedPhotos.length < MIN_PHOTOS &&
              missingFields.includes(
                personalDetailsDict.photos?.fieldName || 'תמונת פרופיל'
              ) && (
                <motion.p
                  variants={fieldErrorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-xs text-red-600 flex items-center gap-1 mb-3"
                >
                  <AlertCircle className="w-3 h-3" />
                  {personalDetailsDict.photos?.required ||
                    'יש להעלות לפחות תמונה אחת'}
                </motion.p>
              )}
          </AnimatePresence>

          <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-xl p-3 border border-rose-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-rose-600">
                {personalDetailsDict.photos?.tip || '💡 טיפ:'}
              </span>{' '}
              {personalDetailsDict.photos?.tipText ||
                'העלו תמונות ברורות שמציגות את הפנים שלכם.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ====== SECTION 4: About Me ====== */}
      <div className="space-y-5 md:space-y-6">
        <SectionHeader
          icon={<FileText className="w-5 h-5" />}
          title={personalDetailsDict.aboutMe?.title || 'כרטיס ההיכרות שלי'}
          subtitle={
            personalDetailsDict.aboutMe?.subtitle ||
            'הכרטיס הזה הוא מה שהשדכנים שלנו רואים, ומה שנשלח לצד השני כשמציעים שידוך.'
          }
          gradient="from-purple-500 to-indigo-500"
          required={true}
        />

        {/* Collapsible guidance */}
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-violet-50/40 rounded-2xl border border-purple-100/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full flex items-center justify-between p-4 md:p-5 text-right"
            >
              <span className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-purple-500" />
                {personalDetailsDict.aboutMe?.guidanceTitle ||
                  'מה לכלול בכרטיס? (לפי הסדר)'}
              </span>
              {isGuideOpen ? (
                <ChevronUp className="w-4 h-4 text-purple-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-500 shrink-0" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isGuideOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-1.5">
                    {[
                      {
                        emoji: '😊',
                        text:
                          personalDetailsDict.aboutMe?.guide1 ||
                          'שם, גיל וגובה',
                      },
                      {
                        emoji: '🌍',
                        text:
                          personalDetailsDict.aboutMe?.guide2 || 'עדה / מוצא',
                      },
                      {
                        emoji: '📍',
                        text:
                          personalDetailsDict.aboutMe?.guide3 || 'אזור מגורים',
                      },
                      {
                        emoji: '💍',
                        text: personalDetailsDict.aboutMe?.guide4 || 'סטטוס',
                      },
                      {
                        emoji: '🙏',
                        text:
                          personalDetailsDict.aboutMe?.guide5 ||
                          'רמה דתית ומגזר',
                      },
                      {
                        emoji: '🎓',
                        text:
                          personalDetailsDict.aboutMe?.guide6 || 'לימודים ורקע',
                      },
                      {
                        emoji: '🇮🇱',
                        text:
                          personalDetailsDict.aboutMe?.guide7 ||
                          'שירות צבאי / לאומי',
                      },
                      {
                        emoji: '💼',
                        text:
                          personalDetailsDict.aboutMe?.guide8 ||
                          'עיסוק ותעסוקה',
                      },
                      {
                        emoji: '🎭',
                        text:
                          personalDetailsDict.aboutMe?.guide9 || 'תכונות אופי',
                      },
                      {
                        emoji: '👨‍👩‍👧‍👦',
                        text:
                          personalDetailsDict.aboutMe?.guide10 ||
                          'קצת על המשפחה',
                      },
                      {
                        emoji: '🎨',
                        text: personalDetailsDict.aboutMe?.guide11 || 'תחביבים',
                      },
                      {
                        emoji: '🎯',
                        text:
                          personalDetailsDict.aboutMe?.guide12 ||
                          'מה אני מחפש/ת',
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 text-sm text-gray-700 leading-snug"
                      >
                        <span className="text-base shrink-0 w-6 text-center">
                          {item.emoji}
                        </span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600/80 mx-4 md:mx-5 mb-4 md:mb-5 leading-relaxed border-t border-purple-100/60 pt-3">
                    {personalDetailsDict.aboutMe?.guidanceNote ||
                      '💡 לא חובה לכתוב את כל הסעיפים, אבל ככל שתכתבו יותר – כך נוכל למצוא לכם התאמות מדויקות יותר.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Textarea */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="aboutMe"
              className="text-sm font-semibold text-gray-700 flex items-center gap-1"
            >
              {personalDetailsDict.aboutMe?.label || 'כרטיס ההיכרות שלכם'}
              <span className="text-red-500 mr-1">*</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs text-center"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <p>
                      {personalDetailsDict.aboutMe?.tooltip ||
                        'הכרטיס הזה נשלח לצד השני כשמציעים שידוך – שווה להשקיע!'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>

          <div className="relative group">
            <div
              className={`absolute right-3 top-4 transition-colors duration-200 z-10 pointer-events-none ${aboutMe.length > 0 ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <Textarea
              id="aboutMe"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder={
                personalDetailsDict.aboutMe?.shortPlaceholder ||
                '😊 שם, גיל, גובה\n🌍 עדה / מוצא\n📍 מגורים\n💍 סטטוס\n🙏 רמה דתית\n...\nכתבו בחופשיות!'
              }
              disabled={isLoading}
              className={`min-h-[200px] md:min-h-[220px] py-3 pr-10 md:pr-11 border-2 rounded-xl transition-colors duration-200 bg-white/95 resize-none text-base md:text-sm ${
                aboutMe.trim().length < MIN_ABOUT_LENGTH &&
                missingFields.includes(
                  personalDetailsDict.aboutMe?.fieldName || 'כרטיס ההיכרות'
                )
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : aboutMe.length > 0 &&
                      aboutMe.trim().length < MIN_ABOUT_LENGTH
                    ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-400'
                    : 'border-gray-200 hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200'
              }`}
              rows={10}
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              {aboutMe.trim().length < MIN_ABOUT_LENGTH &&
              missingFields.includes(
                personalDetailsDict.aboutMe?.fieldName || 'כרטיס ההיכרות'
              ) ? (
                <motion.p
                  variants={fieldErrorVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {personalDetailsDict.aboutMe?.required ||
                    `יש לכתוב לפחות ${MIN_ABOUT_LENGTH} תווים`}
                </motion.p>
              ) : (
                aboutMe.length > 0 &&
                aboutMe.trim().length < MIN_ABOUT_LENGTH && (
                  <span className="text-xs text-amber-600 font-medium">
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
              className={`text-sm font-semibold tabular-nums transition-colors duration-200 ${
                aboutMe.trim().length >= MIN_ABOUT_LENGTH
                  ? 'text-green-600'
                  : aboutMe.trim().length > 0
                    ? 'text-amber-500'
                    : 'text-gray-400'
              }`}
            >
              {aboutMe.trim().length} / {MIN_ABOUT_LENGTH}+
            </span>
          </div>
        </motion.div>
      </div>

      {/* ====== SECTION 4b: Looking For ====== */}
      <div className="space-y-5 md:space-y-6">
        <SectionHeader
          icon={<Heart className="w-5 h-5" />}
          title={personalDetailsDict.lookingFor?.title || 'מה את/ה מחפש/ת?'}
          subtitle={
            personalDetailsDict.lookingFor?.subtitle ||
            'תאר/י בקצרה את האדם שאת/ה מחפש/ת — זה עוזר לנו לחבר בין האנשים הנכונים'
          }
          gradient="from-rose-500 to-pink-500"
        />

        <motion.div variants={itemVariants}>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label
                htmlFor="lookingFor"
                className="text-sm font-semibold text-gray-700"
              >
                {personalDetailsDict.lookingFor?.label || 'תיאור בן/בת הזוג המבוקש/ת'}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="cursor-help">
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>
                      {personalDetailsDict.lookingFor?.tooltip ||
                        'תאר/י בקצרה את האדם שאת/ה מחפש/ת'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative group">
              <div
                className={`absolute right-3 top-4 transition-colors duration-200 z-10 pointer-events-none ${matchingNotes.length > 0 ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-500'}`}
              >
                <Heart className="h-5 w-5" />
              </div>
              <Textarea
                id="lookingFor"
                value={matchingNotes}
                onChange={(e) => setMatchingNotes(e.target.value)}
                placeholder={
                  personalDetailsDict.lookingFor?.placeholder ||
                  'לדוגמה: מחפש/ת מישהו שמח וחיובי, אמין, עם ערכים של משפחה ואמונה...'
                }
                disabled={isLoading}
                className="min-h-[120px] py-3 pr-10 md:pr-11 border-2 rounded-xl transition-colors duration-200 bg-white/95 resize-none text-base md:text-sm border-gray-200 hover:border-gray-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                rows={4}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ====== SECTION 5: Consents ====== */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div
          className={
            consentError || missingFields.includes(validationDict.fields.terms)
              ? 'rounded-2xl border-2 border-red-300'
              : ''
          }
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

        <div className="space-y-3">
          <SimpleConsentBox
            checked={engagementConsent}
            onToggle={() => {
              const newValue = !engagementConsent;
              setEngagementConsent(newValue);
              if (newValue) setEngagementConsentError(null);
            }}
            label={personalDetailsDict.engagementConsentLabel}
            required={true}
            disabled={isLoading}
            error={
              engagementConsentError ||
              (missingFields.includes(validationDict.fields.engagement)
                ? ' '
                : null)
            }
          />

          <SimpleConsentBox
            checked={promotionalConsent}
            onToggle={() => setPromotionalConsent(!promotionalConsent)}
            label={personalDetailsDict.promotionalConsentLabel}
            required={false}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 mt-2">
          <Shield className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            {isRTL
              ? 'הפרטים שלך מאובטחים ומוצפנים.'
              : 'Your details are secure and encrypted.'}
          </p>
        </div>
      </motion.div>

      {/* ====== SUBMIT BUTTONS ====== */}
      <motion.div variants={itemVariants} className="flex gap-3 md:gap-4 pt-4">
        <Button
          type="button"
          onClick={() => {
            if (registrationState.isCompletingProfile) {
              router.push(`/${locale}/profile`);
            } else {
              prevStep();
            }
          }}
          variant="outline"
          disabled={isLoading}
          className="px-5 py-6 rounded-xl border-2 hover:bg-gray-50 shrink-0"
        >
          <ArrowRight className={`h-5 w-5 ${isRTL ? '' : 'rotate-180'}`} />
          <span className="hidden sm:inline mr-1">
            {personalDetailsDict.backButton}
          </span>
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-6 bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
    </motion.div>
  );
}
