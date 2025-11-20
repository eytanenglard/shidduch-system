// src/components/auth/steps/PersonalDetailsStep.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegistration } from '@/components/auth/RegistrationContext';
import {
  User,
  Calendar,
  MapPin,
  Heart,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Shield,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PersonalDetailsStepProps {
  personalDetailsDict: RegisterStepsDict['steps']['personalDetails'];
  optionalInfoDict: RegisterStepsDict['steps']['optionalInfo'];
  consentDict: RegisterStepsDict['consentCheckbox'];
  locale: 'he' | 'en';
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
// FIELD WRAPPER COMPONENT (for consistent styling)
// ============================================================================

interface FieldWrapperProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  hasValue?: boolean;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  icon,
  hasValue = false,
}) => (
  <div className="relative group">
    <div
      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 ${
        hasValue
          ? 'text-cyan-500 scale-110'
          : 'text-gray-400 group-hover:text-gray-500'
      }`}
    >
      {icon}
    </div>
    {children}
  </div>
);

// ============================================================================
// INFO TOOLTIP COMPONENT
// ============================================================================

interface InfoTooltipProps {
  text: string;
  locale: 'he' | 'en';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, locale }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isRTL = locale === 'he';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="ml-1 text-gray-400 hover:text-cyan-500 transition-colors"
        aria-label="מידע נוסף"
      >
        <Info className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${isRTL ? 'right-0' : 'left-0'} bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <div className="relative">
              {text}
              <div
                className={`absolute top-full ${isRTL ? 'right-4' : 'left-4'} w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

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
      <div
        className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
      >
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    {subtitle && (
      <p className="text-sm text-gray-600 leading-relaxed mr-11">{subtitle}</p>
    )}
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PersonalDetailsStep({
  personalDetailsDict,
  optionalInfoDict,
  consentDict,
  locale,
}: PersonalDetailsStepProps) {
  const router = useRouter();
  const { data, setData, nextStep } = useRegistration();

  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    birthDate: data.birthDate || '',
    gender: data.gender || '',
    city: data.city || '',
    maritalStatus: data.maritalStatus || '',
    hasChildren: data.hasChildren || false,
    numberOfChildren: data.numberOfChildren || '',
    profession: data.profession || '',
    education: data.education || '',
    religiousLevel: data.religiousLevel || '',
  });

  // Check if terms were already accepted (use optional chaining)
  const wasTermsAccepted = (data as any).termsAccepted || false;
  const [termsAccepted, setTermsAccepted] = useState(wasTermsAccepted);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const isRTL = locale === 'he';

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = personalDetailsDict.firstNameRequired || 'שדה חובה';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = personalDetailsDict.lastNameRequired || 'שדה חובה';
    }
    if (!formData.birthDate) {
      errors.birthDate = personalDetailsDict.birthDateRequired || 'שדה חובה';
    }
    if (!formData.gender) {
      errors.gender = personalDetailsDict.genderRequired || 'שדה חובה';
    }
    if (!formData.city.trim()) {
      errors.city = personalDetailsDict.cityRequired || 'שדה חובה';
    }

    // Check if terms need to be accepted (if not already accepted before)
    const wasAccepted = (data as any).termsAccepted;
    if (!termsAccepted && !wasAccepted) {
      errors.terms = consentDict.error || 'יש לאשר את התנאים';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError(personalDetailsDict.validationFailed || 'יש לתקן שגיאות בטופס');
      return;
    }

    setIsLoading(true);

    try {
      const wasAccepted = (data as any).termsAccepted;
      
      // Update context
      setData({
        ...data,
        ...formData,
        termsAccepted: termsAccepted || wasAccepted,
      } as any);

      // Save to backend
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          termsAccepted: termsAccepted || wasAccepted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || personalDetailsDict.saveError || 'שגיאה בשמירת הנתונים');
      }

      // Move to next step
      nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : personalDetailsDict.unexpectedError || 'אירעה שגיאה בלתי צפויה');
      setIsLoading(false);
    }
  };

  const hasRequiredFields =
    formData.firstName &&
    formData.lastName &&
    formData.birthDate &&
    formData.gender &&
    formData.city;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Message */}
      <motion.div
        variants={itemVariants}
        className="text-center p-4 bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 rounded-2xl border border-cyan-100"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-bold text-gray-800">
            {personalDetailsDict.welcomeTitle}
          </h2>
          <Heart className="w-5 h-5 text-pink-500" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {personalDetailsDict.welcomeSubtitle}
        </p>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <Alert variant="destructive" className="border-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Info Section */}
        <div className="space-y-5">
          <SectionHeader
            icon={<User className="w-5 h-5" />}
            title={personalDetailsDict.sectionTitle}
            subtitle={personalDetailsDict.sectionSubtitle}
            gradient="from-cyan-400 to-blue-500"
          />

          {/* First Name */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label
              htmlFor="firstName"
              className="text-sm font-semibold text-gray-700 flex items-center"
            >
              {personalDetailsDict.firstNameLabel}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <FieldWrapper
              icon={<User className="h-5 w-5" />}
              hasValue={!!formData.firstName}
            >
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder={personalDetailsDict.firstNamePlaceholder}
                className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                  validationErrors.firstName
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-cyan-400'
                } focus:ring-2 focus:ring-cyan-200`}
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </FieldWrapper>
            {validationErrors.firstName && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.firstName}
              </p>
            )}
          </motion.div>

          {/* Last Name */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label
              htmlFor="lastName"
              className="text-sm font-semibold text-gray-700 flex items-center"
            >
              {personalDetailsDict.lastNameLabel}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <FieldWrapper
              icon={<User className="h-5 w-5" />}
              hasValue={!!formData.lastName}
            >
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder={personalDetailsDict.lastNamePlaceholder}
                className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                  validationErrors.lastName
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-cyan-400'
                } focus:ring-2 focus:ring-cyan-200`}
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </FieldWrapper>
            {validationErrors.lastName && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.lastName}
              </p>
            )}
          </motion.div>

          {/* Birth Date & Gender - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Birth Date */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="birthDate"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.birthDateLabel}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <FieldWrapper
                icon={<Calendar className="h-5 w-5" />}
                hasValue={!!formData.birthDate}
              >
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                    validationErrors.birthDate
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-cyan-400'
                  } focus:ring-2 focus:ring-cyan-200`}
                  disabled={isLoading}
                />
              </FieldWrapper>
              {validationErrors.birthDate && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.birthDate}
                </p>
              )}
            </motion.div>

            {/* Gender */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="gender"
                className="text-sm font-semibold text-gray-700 flex items-center"
              >
                {personalDetailsDict.genderLabel}
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                    validationErrors.gender
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-gray-200 focus:border-cyan-400'
                  } focus:ring-2 focus:ring-cyan-200`}
                >
                  <SelectValue
                    placeholder={personalDetailsDict.genderPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    {personalDetailsDict.genderMale}
                  </SelectItem>
                  <SelectItem value="female">
                    {personalDetailsDict.genderFemale}
                  </SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.gender && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.gender}
                </p>
              )}
            </motion.div>
          </div>

          {/* City */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label
              htmlFor="city"
              className="text-sm font-semibold text-gray-700 flex items-center"
            >
              {personalDetailsDict.cityLabel}
              <span className="text-red-500 mr-1">*</span>
            </Label>
            <FieldWrapper
              icon={<MapPin className="h-5 w-5" />}
              hasValue={!!formData.city}
            >
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder={personalDetailsDict.cityPlaceholder}
                className={`pr-11 py-3 border-2 rounded-xl transition-all bg-white/50 backdrop-blur-sm ${
                  validationErrors.city
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-cyan-400'
                } focus:ring-2 focus:ring-cyan-200`}
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </FieldWrapper>
            {validationErrors.city && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.city}
              </p>
            )}
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-sm font-medium text-gray-500">
              {optionalInfoDict.sectionTitle}
            </span>
          </div>
        </motion.div>

        {/* Optional Info Section */}
        <div className="space-y-5">
          <SectionHeader
            icon={<Users className="w-5 h-5" />}
            title={optionalInfoDict.title}
            subtitle={optionalInfoDict.subtitle}
            gradient="from-purple-400 to-pink-500"
          />

          {/* Marital Status & Children - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Marital Status */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="maritalStatus"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.maritalStatusLabel}
              </Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => handleChange('maritalStatus', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200">
                  <SelectValue
                    placeholder={optionalInfoDict.maritalStatusPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">
                    {optionalInfoDict.maritalStatusSingle}
                  </SelectItem>
                  <SelectItem value="divorced">
                    {optionalInfoDict.maritalStatusDivorced}
                  </SelectItem>
                  <SelectItem value="widowed">
                    {optionalInfoDict.maritalStatusWidowed}
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Children */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="numberOfChildren"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.childrenLabel}
              </Label>
              <Select
                value={formData.numberOfChildren}
                onValueChange={(value) => handleChange('numberOfChildren', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200">
                  <SelectValue
                    placeholder={optionalInfoDict.childrenPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    {optionalInfoDict.childrenNone}
                  </SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4+">4+</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Profession & Education - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Profession */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="profession"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.professionLabel}
              </Label>
              <Input
                id="profession"
                type="text"
                value={formData.profession}
                onChange={(e) => handleChange('profession', e.target.value)}
                placeholder={optionalInfoDict.professionPlaceholder}
                className="pr-4 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </motion.div>

            {/* Education */}
            <motion.div variants={itemVariants} className="space-y-2">
              <Label
                htmlFor="education"
                className="text-sm font-semibold text-gray-700"
              >
                {optionalInfoDict.educationLabel}
              </Label>
              <Select
                value={formData.education}
                onValueChange={(value) => handleChange('education', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200">
                  <SelectValue
                    placeholder={optionalInfoDict.educationPlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">
                    {optionalInfoDict.educationHighSchool}
                  </SelectItem>
                  <SelectItem value="bachelors">
                    {optionalInfoDict.educationBachelors}
                  </SelectItem>
                  <SelectItem value="masters">
                    {optionalInfoDict.educationMasters}
                  </SelectItem>
                  <SelectItem value="doctorate">
                    {optionalInfoDict.educationDoctorate}
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Religious Level */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label
              htmlFor="religiousLevel"
              className="text-sm font-semibold text-gray-700"
            >
              {optionalInfoDict.religiousLevelLabel}
            </Label>
            <Select
              value={formData.religiousLevel}
              onValueChange={(value) => handleChange('religiousLevel', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="pr-11 py-3 border-2 border-gray-200 rounded-xl transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200">
                <SelectValue
                  placeholder={optionalInfoDict.religiousLevelPlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secular">
                  {optionalInfoDict.religiousLevelSecular}
                </SelectItem>
                <SelectItem value="traditional">
                  {optionalInfoDict.religiousLevelTraditional}
                </SelectItem>
                <SelectItem value="religious">
                  {optionalInfoDict.religiousLevelReligious}
                </SelectItem>
                <SelectItem value="ultraOrthodox">
                  {optionalInfoDict.religiousLevelUltraOrthodox}
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        {/* Terms Checkbox (only if not already accepted) */}
        {!wasTermsAccepted && (
          <motion.div variants={itemVariants}>
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                validationErrors.terms
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gradient-to-r from-cyan-50/50 to-purple-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked as boolean)
                  }
                  className="mt-1"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="terms"
                    className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                  >
                    {consentDict.label}{' '}
                    <a
                      href={consentDict.termsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
                    >
                      {consentDict.termsText}
                    </a>{' '}
                    {consentDict.and}{' '}
                    <a
                      href={consentDict.privacyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
                    >
                      {consentDict.privacyText}
                    </a>
                  </Label>
                  {validationErrors.terms && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.terms}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Note */}
        <motion.div variants={itemVariants}>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <Shield className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              {personalDetailsDict.privacyNote}
            </p>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            disabled={isLoading || !hasRequiredFields}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Shine effect */}
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            )}

            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{personalDetailsDict.submitButtonLoading}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{personalDetailsDict.submitButton}</span>
                {isRTL ? (
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </>
            )}
          </Button>

          {/* Progress Indicator */}
          {hasRequiredFields && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-green-600 mt-2 flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {personalDetailsDict.allFieldsCompleted}
            </motion.p>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
}