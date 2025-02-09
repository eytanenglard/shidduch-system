"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gender, UserStatus } from "@prisma/client";

interface AddCandidateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  // Basic Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender: Gender;
  birthDate: string;
  status: UserStatus;
  sendInvitation: boolean;

  // Personal Information
  height?: number;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
  address?: string;
  city?: string;
  origin?: string;
  religiousLevel?: string;

  // Family Information
  parentStatus?: string;
  siblings?: number;
  position?: number;

  // Privacy and Contact Preferences
  contactPreference?: string;
  isProfileVisible?: boolean;
  allowDirectMessages?: boolean;
  preferredMatchmakerGender?: Gender;

  // References and Verification
  referenceName1?: string;
  referencePhone1?: string;
  referenceName2?: string;
  referencePhone2?: string;

  // Additional Information
  about?: string;
  matchingNotes?: string;
}

export default function AddCandidateForm({ onSuccess, onCancel }: AddCandidateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { 
    register, 
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues
  } = useForm<FormData>({
    defaultValues: {
      status: UserStatus.PENDING,
      isProfileVisible: true,
      allowDirectMessages: true,
      sendInvitation: false
    }
  });

  const sendInvitation = watch("sendInvitation");

  const validateAge = (birthDate: string) => {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return age >= 18 && age <= 99;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/matchmaker/candidates/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // אם לא נבחרה אופציית שליחת הזמנה, נשלח null במקום אימייל
          email: data.sendInvitation ? data.email : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add candidate");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add candidate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">פרטים בסיסיים</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">שם פרטי</Label>
            <Input
              id="firstName"
              {...register("firstName", { required: "שדה חובה" })}
              placeholder="שם פרטי"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">שם משפחה</Label>
            <Input
              id="lastName"
              {...register("lastName", { required: "שדה חובה" })}
              placeholder="שם משפחה"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">מגדר</Label>
          <Select
            onValueChange={(value: Gender) => setValue("gender", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מגדר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">זכר</SelectItem>
              <SelectItem value="FEMALE">נקבה</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-red-500 text-sm">{errors.gender.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">תאריך לידה</Label>
          <Input
            id="birthDate"
            type="date"
            {...register("birthDate", {
              required: "שדה חובה",
              validate: validateAge
            })}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm">
              {errors.birthDate.type === "validate" 
                ? "הגיל חייב להיות בין 18 ל-99" 
                : errors.birthDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">פרטים אישיים</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height">גובה (בס"מ)</Label>
            <Input
              id="height"
              type="number"
              {...register("height", {
                min: { value: 140, message: "גובה מינימלי 140 ס\"מ" },
                max: { value: 220, message: "גובה מקסימלי 220 ס\"מ" }
              })}
            />
            {errors.height && (
              <p className="text-red-500 text-sm">{errors.height.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">מצב משפחתי</Label>
            <Select
              onValueChange={(value) => setValue("maritalStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מצב משפחתי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="רווק/ה">רווק/ה</SelectItem>
                <SelectItem value="גרוש/ה">גרוש/ה</SelectItem>
                <SelectItem value="אלמן/ה">אלמן/ה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="religiousLevel">רמת דתיות</Label>
          <Select
            onValueChange={(value) => setValue("religiousLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר רמת דתיות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="חרדי">חרדי</SelectItem>
              <SelectItem value="דתי">דתי</SelectItem>
              <SelectItem value="מסורתי">מסורתי</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupation">עיסוק</Label>
            <Input
              id="occupation"
              {...register("occupation")}
              placeholder="עיסוק נוכחי"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">השכלה</Label>
            <Input
              id="education"
              {...register("education")}
              placeholder="השכלה"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">עיר מגורים</Label>
            <Input
              id="city"
              {...register("city")}
              placeholder="עיר מגורים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin">מוצא</Label>
            <Input
              id="origin"
              {...register("origin")}
              placeholder="מוצא"
            />
          </div>
        </div>
      </div>

      {/* Family Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">פרטי משפחה</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="siblings">מספר אחים ואחיות</Label>
            <Input
              id="siblings"
              type="number"
              {...register("siblings", {
                min: { value: 0, message: "ערך לא תקין" }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">מיקום בין האחים</Label>
            <Input
              id="position"
              type="number"
              {...register("position", {
                min: { value: 1, message: "ערך לא תקין" }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentStatus">מצב הורים</Label>
            <Select
              onValueChange={(value) => setValue("parentStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="נשואים">נשואים</SelectItem>
                <SelectItem value="גרושים">גרושים</SelectItem>
                <SelectItem value="אחר">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Invitation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">שליחת הזמנה</h3>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendInvitation"
            checked={sendInvitation}
            onCheckedChange={(checked) => setValue("sendInvitation", checked as boolean)}
          />
          <Label htmlFor="sendInvitation">שלח הזמנה להרשמה למערכת</Label>
        </div>

        {sendInvitation && (
          <div className="space-y-2">
            <Label htmlFor="email">כתובת אימייל</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: sendInvitation ? "נדרש אימייל לשליחת הזמנה" : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "כתובת אימייל לא תקינה"
                }
              })}
              placeholder="example@domain.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">מידע נוסף</h3>

        <div className="space-y-2">
          <Label htmlFor="about">אודות</Label>
          <Textarea
            id="about"
            {...register("about")}
            placeholder="מידע כללי על המועמד..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matchingNotes">הערות לשידוך</Label>
          <Textarea
            id="matchingNotes"
            {...register("matchingNotes")}
            placeholder="הערות רלוונטיות לשידוך..."
            rows={3}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "שומר..." : "הוספת מועמד"}
        </Button>
      </div>
    </form>
  );
}