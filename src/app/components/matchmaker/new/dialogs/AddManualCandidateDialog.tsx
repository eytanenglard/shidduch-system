"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UserPlus, X, UploadCloud, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Gender } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

interface AddManualCandidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCandidateAdded: () => void;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

export const AddManualCandidateDialog: React.FC<
  AddManualCandidateDialogProps
> = ({ isOpen, onClose, onCandidateAdded }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [manualEntryText, setManualEntryText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sendInvite, setSendInvite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [birthDateInputMode, setBirthDateInputMode] = useState<"date" | "age">(
    "date"
  );
  const [ageInput, setAgeInput] = useState<string>("");

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setGender(undefined);
    setBirthDate(undefined);
    setManualEntryText("");
    setImages([]);
    setImagePreviews([]);
    setSendInvite(false);
    setIsSaving(false);
    setBirthDateInputMode("date");
    setAgeInput("");
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
              `הקובץ ${file.name} גדול מדי (מקסימום ${MAX_IMAGE_SIZE_MB}MB).`
            );
          }
        } else {
          toast.warning(`ניתן להעלות עד ${MAX_IMAGES} תמונות.`);
        }
      });

      setImages((prev) => [...prev, ...validFiles]);
      setImagePreviews((prev) => [...prev, ...validPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newImagePreviews);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    if (!firstName || !lastName || !gender || !manualEntryText) {
      toast.error(
        "נא למלא את כל שדות החובה: שם פרטי, שם משפחה, מין וטקסט חופשי."
      );
      setIsSaving(false);
      return;
    }

    let finalBirthDate: Date | undefined;
    let isBirthDateApproximate: boolean = false;

    if (birthDateInputMode === "date") {
      if (!birthDate) {
        toast.error("נא לבחור תאריך לידה.");
        setIsSaving(false);
        return;
      }
      finalBirthDate = birthDate;
      isBirthDateApproximate = false;
    } else {
      const ageNum = parseInt(ageInput, 10);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        toast.error("נא להזין גיל תקין (בין 1 ל-120).");
        setIsSaving(false);
        return;
      }
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - ageNum;
      finalBirthDate = new Date(birthYear, 0, 1);
      isBirthDateApproximate = true;
    }

    if (!finalBirthDate) {
        toast.error("שגיאה בקביעת תאריך לידה. נא לבדוק את הקלט.");
        setIsSaving(false);
        return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    if (email) formData.append("email", email);
    formData.append("gender", gender);
    formData.append("birthDate", finalBirthDate.toISOString());
    formData.append("birthDateIsApproximate", String(isBirthDateApproximate));
    formData.append("manualEntryText", manualEntryText);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch("/api/matchmaker/candidates/manual", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (sendInvite && email && result.candidate?.id) {
           const promise = fetch(`/api/matchmaker/candidates/${result.candidate.id}/invite-setup`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ email }),
           }).then(async (inviteResponse) => {
               if (!inviteResponse.ok) {
                   const errorData = await inviteResponse.json().catch(() => ({}));
                   throw new Error(errorData.error || 'שליחת ההזמנה נכשלה.');
               }
               return inviteResponse.json();
           });

           toast.promise(promise, {
               loading: 'מוסיף מועמד ושולח הזמנה...',
               success: 'המועמד נוסף וההזמנה נשלחה בהצלחה!',
               error: (err: Error) => `המועמד נוסף, אך שליחת ההזמנה נכשלה: ${err.message}`,
           });
        } else {
            toast.success("המועמד הידני נוסף בהצלחה!");
        }

        onCandidateAdded();
        handleClose();
      } else {
        throw new Error(result.error || "שגיאה בהוספת המועמד.");
      }
    } catch (error) {
      console.error("Error adding manual candidate:", error);
      toast.error(
        "שגיאה בהוספת המועמד: " +
          (error instanceof Error ? error.message : "שגיאה לא ידועה")
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-1">
            <X className="h-4 w-4" />
            <span className="sr-only">סגור</span>
          </button>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <UserPlus className="w-6 h-6 text-primary" />
            הוספת מועמד ידנית
          </DialogTitle>
          <DialogDescription className="text-right">
            הזן את פרטי המועמד שברצונך להוסיף למערכת באופן ידני.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2 pl-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-right block">
                שם פרטי <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="לדוגמה: ישראל"
                required
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-right block">
                שם משפחה <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="לדוגמה: ישראלי"
                required
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-right block">
              כתובת אימייל (אופציונלי)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="לדוגמה: user@example.com"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              אם לא תסופק כתובת אימייל, תיווצר כתובת פנימית עבור המערכת.
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
              שלח הזמנה למועמד/ת להגדרת חשבון לאחר ההוספה
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender" className="text-right block">
                מין <span className="text-red-500">*</span>
              </Label>
              <Select
                value={gender}
                onValueChange={(value) => setGender(value as Gender)}
              >
                <SelectTrigger id="gender" dir="rtl">
                  <SelectValue placeholder="בחר/י מין" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.MALE}>זכר</SelectItem>
                  <SelectItem value={Gender.FEMALE}>נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div>
                <Label className="text-right block mb-2">
                  אופן הזנת גיל/תאריך לידה <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  dir="rtl"
                  value={birthDateInputMode}
                  onValueChange={(value: "date" | "age") => {
                    setBirthDateInputMode(value);
                    if (value === "date") {
                      setAgeInput("");
                    } else {
                      setBirthDate(undefined);
                    }
                  }}
                  className="flex space-x-4 rtl:space-x-reverse mb-3"
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="date" id="r-date" />
                    <Label htmlFor="r-date" className="cursor-pointer">לפי תאריך לידה</Label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value="age" id="r-age" />
                    <Label htmlFor="r-age" className="cursor-pointer">לפי גיל</Label>
                  </div>
                </RadioGroup>
              </div>

              {birthDateInputMode === "date" ? (
                <div>
                  <Label htmlFor="birthDate" className="text-right block">
                    תאריך לידה <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    value={
                      birthDate ? { from: birthDate, to: undefined } : undefined
                    }
                    onChange={({ from }) => setBirthDate(from)}
                    isRange={false}
                    placeholder="בחר תאריך לידה"
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="ageInput" className="text-right block">
                    גיל (משוער) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ageInput"
                    type="number"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    placeholder="לדוגמה: 25"
                    required={birthDateInputMode === "age"}
                    dir="rtl"
                    min="1"
                    max="120"
                  />
                   <p className="text-xs text-gray-500 mt-1 text-right">
                    יוזן תאריך לידה משוער (1 בינואר של שנת הלידה) בהתאם לגיל שהוזן.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="manualEntryText" className="text-right block">
              טקסט חופשי על המועמד <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="manualEntryText"
              value={manualEntryText}
              onChange={(e) => setManualEntryText(e.target.value)}
              placeholder="ספר על המועמד, רקע, תכונות, מה מחפש/ת וכו'..."
              rows={6}
              required
              className="min-h-[100px]"
              dir="rtl"
            />
          </div>

          <div>
            <Label htmlFor="image-upload" className="text-right block">
              תמונות (עד {MAX_IMAGES})
            </Label>
            <div className="mt-2 flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 text-center">
                    גרור ושחרר תמונות לכאן, או לחץ לבחירה
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP (עד {MAX_IMAGE_SIZE_MB}MB לתמונה)
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
                      alt={`תצוגה מקדימה ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-md object-cover w-full aspect-square"
                      onLoad={() => URL.revokeObjectURL(preview)} // Clean up object URLs
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">הסר תמונה</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 sm:justify-start">
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "שומר..." : "הוסף מועמד"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" type="button" className="w-full sm:w-auto mt-2 sm:mt-0">
                <X className="w-4 h-4 mr-2" />
                ביטול
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};