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
  
  // Birth Date
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateInputMode, setBirthDateInputMode] = useState<'date' | 'age'>('date');
  const [ageInput, setAgeInput] = useState<string>('');
  
  // Additional Info
  const [manualEntryText, setManualEntryText] = useState('');
  const [referredBy, setReferredBy] = useState('');
  
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
    setBirthDate(undefined);
    setManualEntryText('');
    setImages([]);
    setImagePreviews([]);
    setSendInvite(false);
    setIsSaving(false);
    setBirthDateInputMode('date');
    setAgeInput('');
    setReferredBy('');
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
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    if (email) formData.append('email', email);
    if (phone) formData.append('phone', phone);
   if (origin) formData.append('origin', origin);
    formData.append('gender', gender);
    formData.append('maritalStatus', maritalStatus);
    formData.append('religiousLevel', religiousLevel);
    if (height) formData.append('height', height);
    formData.append('birthDate', finalBirthDate.toISOString());
    formData.append('birthDateIsApproximate', String(isBirthDateApproximate));
    formData.append('manualEntryText', manualEntryText);

    if (referredBy.trim()) {
      formData.append('referredBy', referredBy.trim());
    }

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
          {/* Section 1: Basic Information */}
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

          {/* Section 2: Contact Information */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Mail className="w-4 h-4" />}
              title="פרטי התקשרות"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField>
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
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
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
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
                <p className="text-xs text-gray-500">
                  מספר טלפון ליצירת קשר
                </p>
              </FormField>
            </div>

            {/* Send Invite Checkbox */}
            {email && (
              <div className="mt-4 flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <Checkbox
                  id="sendInvite"
                  checked={sendInvite}
                  onCheckedChange={(checked) => setSendInvite(checked as boolean)}
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

          {/* Section 3: Personal Details */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Heart className="w-4 h-4" />}
              title="פרטים אישיים"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <SelectItem value="MALE">{dict.fields.gender.male}</SelectItem>
                    <SelectItem value="FEMALE">{dict.fields.gender.female}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {dict.fields.maritalStatus && (
                <FormField>
                  <Label htmlFor="maritalStatus" className="text-sm font-medium">
                    {dict.fields.maritalStatus.label}
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                  <Select
                    value={maritalStatus}
                    onValueChange={(value: string) => setMaritalStatus(value)}
                    required
                  >
                    <SelectTrigger id="maritalStatus" dir="rtl" className="bg-white">
                      <SelectValue placeholder={dict.fields.maritalStatus.placeholder} />
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
                  <SelectTrigger id="religiousLevel" dir="rtl" className="bg-white">
                    <SelectValue placeholder={dict.fields.religiousLevel.placeholder} />
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
{/* Origin field - updated with Hebrew values and expanded options */}
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
              <FormField>
                <Label htmlFor="height" className="text-sm font-medium flex items-center gap-1.5">
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
            </div>
          </div>

          {/* Section 4: Birth Date */}
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
                  onValueChange={(value: 'date' | 'age') => setBirthDateInputMode(value)}
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

          {/* Section 5: Additional Info */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<FileText className="w-4 h-4" />}
              title="מידע נוסף"
            />

            <div className="space-y-4">
              <FormField>
                <Label htmlFor="referredBy" className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  {dict.fields.referredBy?.label || 'דרך מי הגיע/ה?'}
                </Label>
                <Input
                  id="referredBy"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder={dict.fields.referredBy?.placeholder || 'שם ופרטי התקשרות של איש הקשר'}
                  dir="rtl"
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">
                  {dict.fields.referredBy?.description || 'עם מי להיות בקשר בנוגע למועמד/ת זו'}
                </p>
              </FormField>

              <FormField>
                <Label htmlFor="manualEntryText" className="text-sm font-medium">
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

          {/* Section 6: Photos */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <SectionHeader
              icon={<Camera className="w-4 h-4" />}
              title="תמונות"
            />

            <div>
              <Label className="text-sm font-medium block mb-3">
                {dict.fields.photos.label.replace('{{max}}', String(MAX_IMAGES))}
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
                    {dict.fields.photos.description.replace('{{maxSize}}', String(MAX_IMAGE_SIZE_MB))}
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
                        alt={dict.fields.photos.previewAlt.replace('{{index}}', String(index + 1))}
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
                        <span className="sr-only">{dict.fields.photos.removeLabel}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
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