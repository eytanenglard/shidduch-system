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
import { Loader2, UserPlus, X, UploadCloud, Trash2 } from 'lucide-react';
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

export const AddManualCandidateDialog: React.FC<
  AddManualCandidateDialogProps
> = ({ isOpen, onClose, onCandidateAdded, dict }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [religiousLevel, setReligiousLevel] = useState<string>(''); // Added Religious Level State
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [manualEntryText, setManualEntryText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sendInvite, setSendInvite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [birthDateInputMode, setBirthDateInputMode] = useState<'date' | 'age'>(
    'date'
  );
  const [ageInput, setAgeInput] = useState<string>('');

  const resetForm = useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender(undefined);
    setReligiousLevel(''); // Reset Religious Level
    setHeight('');
    setBirthDate(undefined);
    setManualEntryText('');
    setImages([]);
    setImagePreviews([]);
    setSendInvite(false);
    setIsSaving(false);
    setBirthDateInputMode('date');
    setAgeInput('');
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
    formData.append('gender', gender);
    formData.append('religiousLevel', religiousLevel); // Append Religious Level
    if (height) formData.append('height', height);
    formData.append('birthDate', finalBirthDate.toISOString());
    formData.append('birthDateIsApproximate', String(isBirthDateApproximate));
    formData.append('manualEntryText', manualEntryText);
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
      console.error('Error adding manual candidate:', error);
      toast.error(
        `${dict.toasts.error.general}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogClose asChild>
          <button className="absolute right-4 top-4 p-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">{dict.close}</span>
          </button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="w-6 h-6 text-primary" />
            {dict.title}
          </DialogTitle>
          <DialogDescription className="text-right">
            {dict.description}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2 pl-1"
        >
          {/* Row 1: First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-right block">
                {dict.fields.firstName.label}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={dict.fields.firstName.placeholder}
                required
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-right block">
                {dict.fields.lastName.label}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={dict.fields.lastName.placeholder}
                required
                dir="rtl"
              />
            </div>
          </div>

          {/* Row 2: Email & Invite */}
          <div>
            <Label htmlFor="email" className="text-right block">
              {dict.fields.email.label}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dict.fields.email.placeholder}
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {dict.fields.email.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2">
            <Checkbox
              id="sendInvite"
              checked={sendInvite}
              onCheckedChange={(checked) => setSendInvite(Boolean(checked))}
              disabled={!email || isSaving}
            />
            <Label
              htmlFor="sendInvite"
              className={`cursor-pointer transition-colors ${!email ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}`}
            >
              {dict.fields.sendInvite.label}
            </Label>
          </div>

          {/* Row 3: Gender, Religious Level, Height & BirthDate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Gender, Religious Level & Height */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="gender" className="text-right block">
                  {dict.fields.gender.label}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={gender}
                  onValueChange={(value) => setGender(value as Gender)}
                >
                  <SelectTrigger id="gender" dir="rtl">
                    <SelectValue placeholder={dict.fields.gender.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Gender.MALE}>
                      {dict.fields.gender.male}
                    </SelectItem>
                    <SelectItem value={Gender.FEMALE}>
                      {dict.fields.gender.female}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- Religious Level Input --- */}
              <div>
                <Label htmlFor="religiousLevel" className="text-right block">
                  {dict.fields.religiousLevel.label}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={religiousLevel}
                  onValueChange={setReligiousLevel}
                >
                  <SelectTrigger id="religiousLevel" dir="rtl">
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
              </div>

              {/* Height Input */}
              <div>
                <Label htmlFor="height" className="text-right block">
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
                />
              </div>
            </div>

            {/* Column 2: Birth Date */}
            <div>
              <div>
                <Label className="text-right block mb-2">
                  {dict.fields.birthDate.modeLabel}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  dir="rtl"
                  value={birthDateInputMode}
                  onValueChange={(value: 'date' | 'age') =>
                    setBirthDateInputMode(value)
                  }
                  className="flex space-x-4 rtl:space-x-reverse mb-3"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="date" id="r-date" />
                    <Label htmlFor="r-date" className="cursor-pointer">
                      {dict.fields.birthDate.dateMode}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="age" id="r-age" />
                    <Label htmlFor="r-age" className="cursor-pointer">
                      {dict.fields.birthDate.ageMode}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {birthDateInputMode === 'date' ? (
                <div>
                  <Label htmlFor="birthDate" className="text-right block">
                    {dict.fields.birthDate.dateLabel}{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    value={birthDate ? { from: birthDate } : undefined}
                    onChange={({ from }) => setBirthDate(from)}
                    isRange={false}
                    placeholder={dict.fields.birthDate.datePlaceholder}
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="ageInput" className="text-right block">
                    {dict.fields.birthDate.ageLabel}{' '}
                    <span className="text-red-500">*</span>
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
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {dict.fields.birthDate.ageDescription}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="manualEntryText" className="text-right block">
              {dict.fields.notes.label} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="manualEntryText"
              value={manualEntryText}
              onChange={(e) => setManualEntryText(e.target.value)}
              placeholder={dict.fields.notes.placeholder}
              rows={6}
              required
              className="min-h-[100px]"
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="image-upload" className="text-right block">
              {dict.fields.photos.label.replace('{{max}}', String(MAX_IMAGES))}
            </Label>
            <div className="mt-2 flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 text-center">
                    {dict.fields.photos.cta}
                  </p>
                  <p className="text-xs text-gray-500">
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
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={preview}
                      alt={dict.fields.photos.previewAlt.replace(
                        '{{index}}',
                        String(index + 1)
                      )}
                      width={100}
                      height={100}
                      className="rounded-md object-cover w-full aspect-square"
                      onLoad={() => URL.revokeObjectURL(preview)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
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
          <DialogFooter className="pt-4 sm:justify-start">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isSaving ? dict.buttons.adding : dict.buttons.add}
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                <X className="w-4 h-4 mr-2" />
                {dict.buttons.cancel}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
