'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Loader2,
  UserPlus,
  X,
  UploadCloud,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Heart,
  FileText,
  Camera,
  Users,
  GraduationCap,
  Briefcase,
  MapPin,
  Globe,
  Shield,
  Baby,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Gender } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface AddManualCandidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: () => void;
  dict: MatchmakerPageDictionary['candidatesManager']['addManualCandidateDialog'];
  locale: string;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;
const DEFAULT_REFERRED_BY = 'קבוצת שידוכים שוובל';

// Section Header Component
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
}> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
    <div className="text-primary">{icon}</div>
    <h3 className="font-semibold text-gray-700">{title}</h3>
  </div>
);

// Form Field Wrapper Component
const FormField: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>{children}</div>
);

export const AddManualCandidateDialog: React.FC<
  AddManualCandidateDialogProps
> = ({ isOpen, onClose, onCandidateAdded, dict }) => {
  // Basic Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Personal Details
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [maritalStatus, setMaritalStatus] = useState<string>('');
  const [religiousLevel, setReligiousLevel] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [height, setHeight] = useState('');
  const [hasChildrenFromPrevious, setHasChildrenFromPrevious] =
    useState<string>('');

  // Location
  const [city, setCity] = useState('');

  // Birth Date
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateInputMode, setBirthDateInputMode] = useState<'date' | 'age'>(
    'date'
  );
  const [ageInput, setAgeInput] = useState<string>('');

  // Education & Career
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [educationLevel, setEducationLevel] = useState('');

  // Military Service
  const [militaryService, setMilitaryService] = useState('');

  // Languages
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [additionalLanguages, setAdditionalLanguages] = useState('');

  // Family
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');

  // Additional Info
  const [about, setAbout] = useState('');
  const [manualEntryText, setManualEntryText] = useState('');
  const [referredBy, setReferredBy] = useState(DEFAULT_REFERRED_BY);

  // Images
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI State
  const [sendInvite, setSendInvite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setGender(undefined);
    setOrigin('');
    setMaritalStatus('');
    setReligiousLevel('');
    setHeight('');
    setHasChildrenFromPrevious('');
    setCity('');
    setBirthDate(undefined);
    setBirthDateInputMode('date');
    setAgeInput('');
    setOccupation('');
    setEducation('');
    setEducationLevel('');
    setMilitaryService('');
    setNativeLanguage('');
    setAdditionalLanguages('');
    setFatherOccupation('');
    setMotherOccupation('');
    setAbout('');
    setManualEntryText('');
    setReferredBy(DEFAULT_REFERRED_BY);
    setImages([]);
    setImagePreviews([]);
    setSendInvite(false);
    setIsSaving(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles: File[] = [];
      const validPreviews: string[] = [];

      newFiles.forEach((file) => {
        if (images.length + validFiles.length < MAX_IMAGES) {
          if (file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            validFiles.push(file);
            validPreviews.push(URL.createObjectURL(file));
          } else {
            toast.error(
              dict.fields.photos.fileTooLargeError
                .replace('{{fileName}}', file.name)
                .replace('{{maxSize}}', String(MAX_IMAGE_SIZE_MB))
            );
          }
        } else {
          toast.warning(
            dict.fields.photos.maxFilesWarning.replace(
              '{{max}}',
              String(MAX_IMAGES)
            )
          );
        }
      });

      setImages((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...validPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !maritalStatus ||
      !religiousLevel ||
      !manualEntryText
    ) {
      toast.error(dict.toasts.error.missingFields);
      setIsSaving(false);
      return;
    }

    let finalBirthDate: Date | undefined;
    let isBirthDateApproximate = false;

    if (birthDateInputMode === 'date') {
      if (!birthDate) {
        toast.error(dict.toasts.error.invalidBirthDate);
        setIsSaving(false);
        return;
      }
      finalBirthDate = birthDate;
    } else {
      const ageNum = parseInt(ageInput, 10);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        toast.error(dict.toasts.error.invalidAge);
        setIsSaving(false);
        return;
      }
      const birthYear = new Date().getFullYear() - ageNum;
      finalBirthDate = new Date(birthYear, 0, 1);
      isBirthDateApproximate = true;
    }

    const formData = new FormData();

    // --- שדות חובה ---
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('gender', gender);
    formData.append('maritalStatus', maritalStatus);
    formData.append('religiousLevel', religiousLevel);
    formData.append('birthDate', finalBirthDate.toISOString());
    formData.append('birthDateIsApproximate', String(isBirthDateApproximate));
    formData.append('manualEntryText', manualEntryText);

    // --- שדות אופציונליים ---
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);
    if (origin) formData.append('origin', origin);
    if (height) formData.append('height', height);
    if (city.trim()) formData.append('city', city.trim());
    if (occupation.trim()) formData.append('occupation', occupation.trim());
    if (education.trim()) formData.append('education', education.trim());
    if (educationLevel) formData.append('educationLevel', educationLevel);
    if (about.trim()) formData.append('about', about.trim());
    if (hasChildrenFromPrevious)
      formData.append('hasChildrenFromPrevious', hasChildrenFromPrevious);

    // שירות צבאי / לאומי
    if (militaryService.trim())
      formData.append('militaryService', militaryService.trim());

    // שפות
    if (nativeLanguage.trim())
      formData.append('nativeLanguage', nativeLanguage.trim());
    if (additionalLanguages.trim())
      formData.append('additionalLanguages', additionalLanguages.trim());

    // משפחה
    if (fatherOccupation.trim())
      formData.append('fatherOccupation', fatherOccupation.trim());
    if (motherOccupation.trim())
      formData.append('motherOccupation', motherOccupation.trim());

    // מקור הפניה
    formData.append('referredBy', referredBy.trim() || DEFAULT_REFERRED_BY);

    // תמונות
    images.forEach((image) => formData.append('images', image));

    try {
      const response = await fetch('/api/matchmaker/candidates/manual', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || dict.toasts.error.general);

      if (sendInvite && email && result.candidate?.id) {
        const promise = fetch(
          `/api/matchmaker/candidates/${result.candidate.id}/invite-setup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          }
        ).then(async (inviteResponse) => {
          if (!inviteResponse.ok) {
            const errorData = await inviteResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Invitation failed');
          }
          return inviteResponse.json();
        });
        toast.promise(promise, {
          loading: dict.toasts.success.inviteLoading,
          success: dict.toasts.success.inviteSent,
          error: (err: Error) =>
            dict.toasts.success.inviteError.replace('{{error}}', err.message),
        });
      } else {
        toast.success(dict.toasts.success.candidateAdded);
      }
      onCandidateAdded();
      handleClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : dict.toasts.error.general
      );
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-l from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            {dict.title}
          </DialogTitle>
          <DialogDescription className="text-right mt-1">
            {dict.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* ============================================================= */}
          {/* Section 1: Basic Information */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<User className="w-4 h-4" />}
              title="פרטים בסיסיים"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  {dict.fields.firstName.label}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={dict.fields.firstName.placeholder}
                  required
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              <FormField>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  {dict.fields.lastName.label}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={dict.fields.lastName.placeholder}
                  required
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 2: Contact Information */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Mail className="w-4 h-4" />}
              title="פרטי התקשרות"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {dict.fields.email.label}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.fields.email.placeholder}
                  dir="ltr"
                  className="text-left bg-white"
                />
                <p className="text-xs text-gray-500">
                  {dict.fields.email.description}
                </p>
              </FormField>

              <FormField>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  טלפון
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                  className="text-left bg-white"
                />
                <p className="text-xs text-gray-500">מספר טלפון ליצירת קשר</p>
              </FormField>
            </div>

            {/* Send Invite Checkbox */}
            {email && (
              <div className="mt-4 flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <Checkbox
                  id="sendInvite"
                  checked={sendInvite}
                  onCheckedChange={(checked) =>
                    setSendInvite(checked as boolean)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
                <label
                  htmlFor="sendInvite"
                  className="text-sm font-medium text-blue-900 cursor-pointer"
                >
                  {dict.fields.sendInvite.label}
                </label>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* Section 3: Personal Details */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Heart className="w-4 h-4" />}
              title="פרטים אישיים"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gender */}
              <FormField>
                <Label htmlFor="gender" className="text-sm font-medium">
                  {dict.fields.gender.label}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Select
                  value={gender}
                  onValueChange={(value: Gender) => setGender(value)}
                  required
                >
                  <SelectTrigger id="gender" dir="rtl" className="bg-white">
                    <SelectValue placeholder={dict.fields.gender.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">
                      {dict.fields.gender.male}
                    </SelectItem>
                    <SelectItem value="FEMALE">
                      {dict.fields.gender.female}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Marital Status */}
              {dict.fields.maritalStatus && (
                <FormField>
                  <Label
                    htmlFor="maritalStatus"
                    className="text-sm font-medium"
                  >
                    {dict.fields.maritalStatus.label}
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                  <Select
                    value={maritalStatus}
                    onValueChange={(value: string) => setMaritalStatus(value)}
                    required
                  >
                    <SelectTrigger
                      id="maritalStatus"
                      dir="rtl"
                      className="bg-white"
                    >
                      <SelectValue
                        placeholder={dict.fields.maritalStatus.placeholder}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {dict.fields.maritalStatus.options &&
                        Object.entries(dict.fields.maritalStatus.options).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              {/* Religious Level */}
              <FormField>
                <Label htmlFor="religiousLevel" className="text-sm font-medium">
                  {dict.fields.religiousLevel.label}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Select
                  value={religiousLevel}
                  onValueChange={(value: string) => setReligiousLevel(value)}
                  required
                >
                  <SelectTrigger
                    id="religiousLevel"
                    dir="rtl"
                    className="bg-white"
                  >
                    <SelectValue
                      placeholder={dict.fields.religiousLevel.placeholder}
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Object.entries(dict.fields.religiousLevel.options).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Origin */}
              <FormField>
                <Label htmlFor="origin" className="text-sm font-medium">
                  מוצא
                </Label>
                <Select
                  value={origin}
                  onValueChange={(value: string) => setOrigin(value)}
                >
                  <SelectTrigger id="origin" dir="rtl" className="bg-white">
                    <SelectValue placeholder="בחר מוצא" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="אשכנזי">אשכנזי</SelectItem>
                    <SelectItem value="ספרדי">ספרדי</SelectItem>
                    <SelectItem value="מזרחי">מזרחי</SelectItem>
                    <SelectItem value="תימני">תימני</SelectItem>
                    <SelectItem value="מרוקאי">מרוקאי</SelectItem>
                    <SelectItem value="עיראקי">עיראקי</SelectItem>
                    <SelectItem value="פרסי">פרסי</SelectItem>
                    <SelectItem value="כורדי">כורדי</SelectItem>
                    <SelectItem value="תוניסאי">תוניסאי</SelectItem>
                    <SelectItem value="לובי">לובי</SelectItem>
                    <SelectItem value="אתיופי">אתיופי</SelectItem>
                    <SelectItem value="גרוזיני">גרוזיני</SelectItem>
                    <SelectItem value="בוכרי">בוכרי</SelectItem>
                    <SelectItem value="הודי">הודי</SelectItem>
                    <SelectItem value="תורכי">תורכי</SelectItem>
                    <SelectItem value="מעורב">מעורב</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Height */}
              <FormField>
                <Label
                  htmlFor="height"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Ruler className="w-3.5 h-3.5 text-gray-400" />
                  {dict.fields.height.label}
                </Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={dict.fields.height.placeholder}
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              {/* City */}
              <FormField>
                <Label
                  htmlFor="city"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  עיר מגורים
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="למשל: ירושלים, תל אביב..."
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              {/* Has Children from Previous */}
              <FormField>
                <Label
                  htmlFor="hasChildrenFromPrevious"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Baby className="w-3.5 h-3.5 text-gray-400" />
                  ילדים מקשר קודם
                </Label>
                <Select
                  value={hasChildrenFromPrevious}
                  onValueChange={(value: string) =>
                    setHasChildrenFromPrevious(value)
                  }
                >
                  <SelectTrigger
                    id="hasChildrenFromPrevious"
                    dir="rtl"
                    className="bg-white"
                  >
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">כן</SelectItem>
                    <SelectItem value="false">לא</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 4: Birth Date */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Calendar className="w-4 h-4" />}
              title="תאריך לידה"
            />

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  {dict.fields.birthDate.modeLabel}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <RadioGroup
                  dir="rtl"
                  value={birthDateInputMode}
                  onValueChange={(value: 'date' | 'age') =>
                    setBirthDateInputMode(value)
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="date" id="r-date" />
                    <Label htmlFor="r-date" className="cursor-pointer text-sm">
                      {dict.fields.birthDate.dateMode}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="age" id="r-age" />
                    <Label htmlFor="r-age" className="cursor-pointer text-sm">
                      {dict.fields.birthDate.ageMode}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="max-w-xs">
                {birthDateInputMode === 'date' ? (
                  <FormField>
                    <Label htmlFor="birthDate" className="text-sm font-medium">
                      {dict.fields.birthDate.dateLabel}
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <DatePicker
                      value={birthDate ? { from: birthDate } : undefined}
                      onChange={({ from }) => setBirthDate(from)}
                      isRange={false}
                      placeholder={dict.fields.birthDate.datePlaceholder}
                      className="w-full bg-white"
                    />
                  </FormField>
                ) : (
                  <FormField>
                    <Label htmlFor="ageInput" className="text-sm font-medium">
                      {dict.fields.birthDate.ageLabel}
                      <span className="text-red-500 mr-1">*</span>
                    </Label>
                    <Input
                      id="ageInput"
                      type="number"
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value)}
                      placeholder={dict.fields.birthDate.agePlaceholder}
                      required={birthDateInputMode === 'age'}
                      dir="rtl"
                      min="1"
                      max="120"
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-500">
                      {dict.fields.birthDate.ageDescription}
                    </p>
                  </FormField>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 5: Education & Career */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<GraduationCap className="w-4 h-4" />}
              title="השכלה ותעסוקה"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Occupation */}
              <FormField>
                <Label
                  htmlFor="occupation"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  עיסוק / מקצוע
                </Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="למשל: מהנדס תוכנה, עורכת דין..."
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              {/* Education */}
              <FormField>
                <Label
                  htmlFor="education"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                  לימודים / מוסד
                </Label>
                <Input
                  id="education"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="למשל: מדעי המחשב, אוניברסיטת בר אילן"
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              {/* Education Level */}
              <FormField>
                <Label htmlFor="educationLevel" className="text-sm font-medium">
                  רמת השכלה
                </Label>
                <Select
                  value={educationLevel}
                  onValueChange={(value: string) => setEducationLevel(value)}
                >
                  <SelectTrigger
                    id="educationLevel"
                    dir="rtl"
                    className="bg-white"
                  >
                    <SelectValue placeholder="בחר רמת השכלה" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    <SelectItem value="תיכון">תיכון</SelectItem>
                    <SelectItem value="סמינר">סמינר</SelectItem>
                    <SelectItem value="ישיבה">ישיבה</SelectItem>
                    <SelectItem value="מכינה">מכינה</SelectItem>
                    <SelectItem value="תעודה מקצועית">תעודה מקצועית</SelectItem>
                    <SelectItem value="הנדסאי">הנדסאי</SelectItem>
                    <SelectItem value="תואר ראשון">תואר ראשון</SelectItem>
                    <SelectItem value="תואר שני">תואר שני</SelectItem>
                    <SelectItem value="תואר שלישי">תואר שלישי</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 6: Military Service */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Shield className="w-4 h-4" />}
              title="שירות צבאי / לאומי"
            />

            <FormField>
              <Label htmlFor="militaryService" className="text-sm font-medium">
                פירוט שירות
              </Label>
              <Input
                id="militaryService"
                value={militaryService}
                onChange={(e) => setMilitaryService(e.target.value)}
                placeholder="למשל: קצין חי״ר, שירות לאומי בבית חולים..."
                dir="rtl"
                className="bg-white"
              />
              <p className="text-xs text-gray-500">סוג השירות, תפקיד, יחידה</p>
            </FormField>
          </div>

          {/* ============================================================= */}
          {/* Section 7: Languages */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader icon={<Globe className="w-4 h-4" />} title="שפות" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="nativeLanguage" className="text-sm font-medium">
                  שפת אם
                </Label>
                <Input
                  id="nativeLanguage"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  placeholder="למשל: עברית"
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              <FormField>
                <Label
                  htmlFor="additionalLanguages"
                  className="text-sm font-medium"
                >
                  שפות נוספות
                </Label>
                <Input
                  id="additionalLanguages"
                  value={additionalLanguages}
                  onChange={(e) => setAdditionalLanguages(e.target.value)}
                  placeholder="למשל: אנגלית, צרפתית"
                  dir="rtl"
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">הפרדה בפסיקים</p>
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 8: Family */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Users className="w-4 h-4" />}
              title="רקע משפחתי"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField>
                <Label
                  htmlFor="fatherOccupation"
                  className="text-sm font-medium"
                >
                  מקצוע האב
                </Label>
                <Input
                  id="fatherOccupation"
                  value={fatherOccupation}
                  onChange={(e) => setFatherOccupation(e.target.value)}
                  placeholder="למשל: רב, מורה, רואה חשבון..."
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>

              <FormField>
                <Label
                  htmlFor="motherOccupation"
                  className="text-sm font-medium"
                >
                  מקצוע האם
                </Label>
                <Input
                  id="motherOccupation"
                  value={motherOccupation}
                  onChange={(e) => setMotherOccupation(e.target.value)}
                  placeholder="למשל: מנהלת, אחות, מעצבת..."
                  dir="rtl"
                  className="bg-white"
                />
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 9: Additional Info */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<FileText className="w-4 h-4" />}
              title="מידע נוסף"
            />

            <div className="space-y-4">
              {/* Referred By */}
              <FormField>
                <Label
                  htmlFor="referredBy"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  {dict.fields.referredBy?.label || 'הופנה ע״י'}
                </Label>
                <Input
                  id="referredBy"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder={
                    dict.fields.referredBy?.placeholder ||
                    'שם ופרטי התקשרות של איש הקשר'
                  }
                  dir="rtl"
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">
                  {dict.fields.referredBy?.description ||
                    'ברירת מחדל: קבוצת שידוכים שוובל'}
                </p>
              </FormField>

              {/* About — free text */}
              <FormField>
                <Label htmlFor="about" className="text-sm font-medium">
                  📄 אודות / תיאור חופשי
                </Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="תיאור כללי, אופי, תכונות, מה מחפש/ת, תחביבים..."
                  rows={4}
                  className="min-h-[100px] bg-white resize-none"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500">
                  שדה חופשי — כל מה שחשוב לדעת על המועמד/ת
                </p>
              </FormField>

              {/* Manual Entry Text */}
              <FormField>
                <Label
                  htmlFor="manualEntryText"
                  className="text-sm font-medium"
                >
                  {dict.fields.notes.label}
                  <span className="text-red-500 mr-1">*</span>
                </Label>
                <Textarea
                  id="manualEntryText"
                  value={manualEntryText}
                  onChange={(e) => setManualEntryText(e.target.value)}
                  placeholder={dict.fields.notes.placeholder}
                  rows={5}
                  required
                  className="min-h-[120px] bg-white resize-none"
                  dir="rtl"
                />
              </FormField>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Section 10: Photos */}
          {/* ============================================================= */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Camera className="w-4 h-4" />}
              title="תמונות"
            />

            <div>
              <Label className="text-sm font-medium block mb-3">
                {dict.fields.photos.label.replace(
                  '{{max}}',
                  String(MAX_IMAGES)
                )}
              </Label>

              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="p-2 bg-gray-100 rounded-full mb-2">
                    <UploadCloud className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {dict.fields.photos.cta}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {dict.fields.photos.description.replace(
                      '{{maxSize}}',
                      String(MAX_IMAGE_SIZE_MB)
                    )}
                  </p>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={images.length >= MAX_IMAGES}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <Image
                        src={preview}
                        alt={dict.fields.photos.previewAlt.replace(
                          '{{index}}',
                          String(index + 1)
                        )}
                        fill
                        className="rounded-lg object-cover border border-gray-200"
                        onLoad={() => URL.revokeObjectURL(preview)}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">
                          {dict.fields.photos.removeLabel}
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================= */}
          {/* Footer */}
          {/* ============================================================= */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 ml-2" />
                {dict.buttons.cancel}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 ml-2" />
              )}
              {isSaving ? dict.buttons.adding : dict.buttons.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
