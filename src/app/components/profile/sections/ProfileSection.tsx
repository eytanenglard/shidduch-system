"use client";

import React, { useState, useEffect } from "react";
import { Gender, AvailabilityStatus } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Save, X } from "lucide-react";
import { UserProfile } from "@/types/next-auth";
import { cn } from "@/lib/utils"; // הוספת cn לשילוב classNames

const languageOptions = [
  // שפות נפוצות
  { value: "hebrew", label: "עברית" },
  { value: "english", label: "אנגלית" },
  { value: "yiddish", label: "יידיש" },
  { value: "russian", label: "רוסית" },
  { value: "arabic", label: "ערבית" },
  { value: "french", label: "צרפתית" },
  // שאר השפות לפי א-ב
  { value: "amharic", label: "אמהרית" },
  { value: "italian", label: "איטלקית" },
  { value: "ukrainian", label: "אוקראינית" },
  { value: "spanish", label: "ספרדית" },
  { value: "portuguese", label: "פורטוגזית" },
  { value: "persian", label: "פרסית" },
  { value: "polish", label: "פולנית" },
  { value: "chinese", label: "סינית" },
  { value: "german", label: "גרמנית" },
  { value: "georgian", label: "גאורגית" },
  { value: "dutch", label: "הולנדית" },
  { value: "hungarian", label: "הונגרית" },
  { value: "turkish", label: "טורקית" },
  { value: "ladino", label: "לדינו" },
  { value: "romanian", label: "רומנית" },
];

interface ProfileSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  viewOnly?: boolean;
  onSave: (data: Partial<UserProfile>) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  // ---- לוגיקת טעינה ועדכון נתונים (עם תיקון number | undefined) ----
  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.success && data.profile) {
        const profileData = {
          gender: data.profile.gender || undefined,
          birthDate: data.profile.birthDate || undefined,
          nativeLanguage: data.profile.nativeLanguage || undefined,
          additionalLanguages: data.profile.additionalLanguages || [],
          height: data.profile.height ?? undefined, // תוקן ל-undefined
          maritalStatus: data.profile.maritalStatus || undefined,
          occupation: data.profile.occupation || undefined,
          education: data.profile.education || undefined,
          religiousLevel: data.profile.religiousLevel || undefined,
          address: data.profile.address || undefined,
          city: data.profile.city || undefined,
          origin: data.profile.origin || undefined,
          parentStatus: data.profile.parentStatus || undefined,
          siblings: data.profile.siblings ?? undefined, // תוקן ל-undefined
          position: data.profile.position ?? undefined, // תוקן ל-undefined
          referenceName1: data.profile.referenceName1 || undefined,
          referencePhone1: data.profile.referencePhone1 || undefined,
          referenceName2: data.profile.referenceName2 || undefined,
          referencePhone2: data.profile.referencePhone2 || undefined,
          isProfileVisible: data.profile.isProfileVisible ?? true,
          preferredMatchmakerGender:
            data.profile.preferredMatchmakerGender || undefined,
          availabilityStatus: data.profile.availabilityStatus || "AVAILABLE",
          availabilityNote: data.profile.availabilityNote || undefined,
          about: data.profile.about || undefined,
          hobbies: data.profile.hobbies || undefined,
        };
        setFormData(profileData);
        setInitialData(profileData);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData((prevFormData: Partial<UserProfile>) => {
        const mergedData: Partial<UserProfile> = {
          ...prevFormData, // Start with existing form data
          ...profile, // Override with incoming profile prop values
          gender: profile.gender || prevFormData.gender || undefined,
          birthDate: profile.birthDate || prevFormData.birthDate || undefined,
          nativeLanguage:
            profile.nativeLanguage || prevFormData.nativeLanguage || undefined,
          additionalLanguages:
            profile.additionalLanguages ||
            prevFormData.additionalLanguages ||
            [],
          // Ensure numeric fields use ?? and end with undefined
          height: profile.height ?? prevFormData.height ?? undefined,
          maritalStatus:
            profile.maritalStatus || prevFormData.maritalStatus || undefined,
          occupation:
            profile.occupation || prevFormData.occupation || undefined,
          education: profile.education || prevFormData.education || undefined,
          religiousLevel:
            profile.religiousLevel || prevFormData.religiousLevel || undefined,
          address: profile.address || prevFormData.address || undefined,
          city: profile.city || prevFormData.city || undefined,
          origin: profile.origin || prevFormData.origin || undefined,
          parentStatus:
            profile.parentStatus || prevFormData.parentStatus || undefined,
          // Ensure numeric fields use ?? and end with undefined
          siblings: profile.siblings ?? prevFormData.siblings ?? undefined,
          position: profile.position ?? prevFormData.position ?? undefined,
          referenceName1:
            profile.referenceName1 || prevFormData.referenceName1 || undefined,
          referencePhone1:
            profile.referencePhone1 ||
            prevFormData.referencePhone1 ||
            undefined,
          referenceName2:
            profile.referenceName2 || prevFormData.referenceName2 || undefined,
          referencePhone2:
            profile.referencePhone2 ||
            prevFormData.referencePhone2 ||
            undefined,
          isProfileVisible:
            profile.isProfileVisible ?? prevFormData.isProfileVisible ?? true,
          preferredMatchmakerGender:
            profile.preferredMatchmakerGender ||
            prevFormData.preferredMatchmakerGender ||
            undefined,
          availabilityStatus:
            profile.availabilityStatus ||
            prevFormData.availabilityStatus ||
            "AVAILABLE",
          availabilityNote:
            profile.availabilityNote ||
            prevFormData.availabilityNote ||
            undefined,
          about: profile.about || prevFormData.about || undefined,
          hobbies: profile.hobbies || prevFormData.hobbies || undefined,
        };
        // Update initialData only if mergedData is different
        setInitialData((prevInitial) => {
          if (JSON.stringify(prevInitial) !== JSON.stringify(mergedData)) {
            return mergedData;
          }
          return prevInitial;
        });
        return mergedData;
      });
    }
  }, [profile]);

  // --- לוגיקת שינוי ערכים (עם תיקון number | undefined), שמירה וביטול ---
  const handleChange = (
    field: keyof UserProfile,
    value: UserProfile[keyof UserProfile]
  ) => {
    if (field === "height" || field === "siblings" || field === "position") {
      const rawValue = value as string; // Input value is always string
      let finalValue: number | undefined = undefined; // Default to undefined

      // Try parsing only if the string is not empty
      if (rawValue && rawValue.trim() !== "") {
        const parsed = parseInt(rawValue, 10);
        // Assign the number only if parsing was successful (not NaN)
        if (!isNaN(parsed)) {
          finalValue = parsed;
        }
        // If parsing failed (NaN), finalValue remains undefined
      }
      // If the string was empty, finalValue remains undefined

      setFormData((prev) => ({
        ...prev,
        [field]: finalValue, // Assign the number or undefined
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    setInitialData(formData); // Update initialData after successful save
  };

  const handleCancel = () => {
    setFormData(initialData); // Revert to the initial data before editing started
    setIsEditing(false);
  };

  if (loading) {
    return <div className="text-center p-4">טוען...</div>;
  }

  // --- רנדור הקומפוננטה עם העיצוב המעודכן ---
  return (
    <div className="relative" dir="rtl">
      {/* כותרת דביקה מעוצבת */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        {/* הוספתי z-40 כדי שיהיה מתחת ל-z-50 פוטנציאלי */}
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-800">
                פרופיל משתמש
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                נהל את פרטי הפרופיל שלך
              </p>
            </div>
            {!viewOnly && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm" // הקטנת כפתורים להתאמה
                    onClick={() => setIsEditing(true)}
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                  >
                    <Pencil className="w-3.5 h-3.5 ml-1.5" />
                    עריכה
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-3.5 h-3.5 ml-1.5" />
                      ביטול
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Save className="w-3.5 h-3.5 ml-1.5" />
                      שמירה
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* קונטיינר ראשי עם ריווח */}
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* --- פרטים אישיים --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              פרטים אישיים
            </CardTitle>
            {/* <CardDescription className="text-xs text-gray-500">מידע בסיסי</CardDescription> */}
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
              {/* מגדר */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מגדר
                </Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) =>
                    handleChange("gender", value as Gender)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר מגדר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">זכר</SelectItem>
                    <SelectItem value="FEMALE">נקבה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* תאריך לידה */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  תאריך לידה
                </Label>
                <Input
                  type="date"
                  value={
                    formData.birthDate instanceof Date &&
                    !isNaN(formData.birthDate.getTime())
                      ? formData.birthDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    handleChange(
                      "birthDate",
                      !isNaN(date.getTime()) ? date : undefined
                    );
                  }}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
              </div>

              {/* שפת אם */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  שפת אם
                </Label>
                <Select
                  value={formData.nativeLanguage || ""}
                  onValueChange={(value) =>
                    handleChange("nativeLanguage", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר שפת אם" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* שפות נוספות */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  שפות נוספות
                </Label>
                <Select
                  onValueChange={(value) => {
                    const currentLanguages = formData.additionalLanguages || [];
                    const newLanguages = currentLanguages.includes(value)
                      ? currentLanguages.filter((lang) => lang !== value)
                      : [...currentLanguages, value];
                    handleChange("additionalLanguages", newLanguages);
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר / הסר שפות" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] overflow-y-auto">
                    {languageOptions.map((lang) => (
                      <SelectItem
                        key={lang.value}
                        value={lang.value}
                        className={cn(
                          "cursor-pointer text-xs",
                          formData.additionalLanguages?.includes(lang.value)
                            ? "bg-cyan-50 font-medium"
                            : ""
                        )}
                      >
                        {lang.label}
                        {formData.additionalLanguages?.includes(lang.value) && (
                          <span className="mr-2">✓</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(formData.additionalLanguages || []).map((langValue) => {
                    const lang = languageOptions.find(
                      (l) => l.value === langValue
                    );
                    return lang ? (
                      <span
                        key={lang.value}
                        className="bg-cyan-100/60 text-cyan-800 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center"
                      >
                        {lang.label}
                        {isEditing && (
                          <button
                            type="button" // Prevent form submission if inside a form
                            onClick={() => {
                              const newLanguages =
                                formData.additionalLanguages?.filter(
                                  (l) => l !== langValue
                                ) || [];
                              handleChange("additionalLanguages", newLanguages);
                            }}
                            className="mr-1 text-cyan-600 hover:text-cyan-800 text-xs"
                            aria-label={`הסר ${lang.label}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* גובה */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  גובה (סמ)
                </Label>
                <Input
                  type="number"
                  value={formData.height ?? ""} // Use ?? for undefined as well
                  onChange={(e) => handleChange("height", e.target.value)}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="גובה בסמ"
                  min="100"
                  max="250"
                />
              </div>

              {/* מצב משפחתי */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מצב משפחתי
                </Label>
                <Select
                  value={formData.maritalStatus || ""}
                  onValueChange={(value) =>
                    handleChange("maritalStatus", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר מצב" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">רווק/ה</SelectItem>
                    <SelectItem value="divorced">גרוש/ה</SelectItem>
                    <SelectItem value="widowed">אלמן/ה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* תעסוקה */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  תעסוקה
                </Label>
                <Input
                  value={formData.occupation || ""}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  disabled={!isEditing}
                  placeholder="תעסוקה נוכחית"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              {/* השכלה */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  השכלה
                </Label>
                <Input
                  value={formData.education || ""}
                  onChange={(e) => handleChange("education", e.target.value)}
                  disabled={!isEditing}
                  placeholder="השכלה"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              {/* רמת דתיות */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  רמה דתית
                </Label>
                <Select
                  value={formData.religiousLevel || ""}
                  onValueChange={(value) =>
                    handleChange("religiousLevel", value)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר רמה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="חרדי">חרדי</SelectItem>
                    <SelectItem value="חרדי מודרני">חרדי מודרני</SelectItem>
                    <SelectItem value="דתי">דתי</SelectItem>
                    <SelectItem value="דתי-לייט">דתי-לייט</SelectItem>
                    <SelectItem value="מסורתי">מסורתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* כתובת */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  כתובת
                </Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={!isEditing}
                  placeholder="כתובת מגורים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              {/* עיר */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  עיר
                </Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={!isEditing}
                  placeholder="עיר מגורים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              {/* מוצא */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מוצא / עדה
                </Label>
                <Input
                  value={formData.origin || ""}
                  onChange={(e) => handleChange("origin", e.target.value)}
                  disabled={!isEditing}
                  placeholder="ארץ מוצא / עדה"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- מידע משפחתי --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              מידע משפחתי
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מצב הורים
                </Label>
                <Select
                  value={formData.parentStatus || ""}
                  onValueChange={(value) => handleChange("parentStatus", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר מצב" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="נשואים">נשואים</SelectItem>
                    <SelectItem value="גרושים">גרושים</SelectItem>
                    <SelectItem value="אלמן">אלמן</SelectItem>
                    <SelectItem value="אלמנה">אלמנה</SelectItem>
                    {/* אפשר להוסיף עוד אופציות לפי הצורך */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מספר אחים/יות
                </Label>
                <Input
                  type="number"
                  value={formData.siblings ?? ""}
                  onChange={(e) => handleChange("siblings", e.target.value)}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="מספר כולל"
                  min="0"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מיקום במשפחה
                </Label>
                <Input
                  type="number"
                  value={formData.position ?? ""}
                  onChange={(e) => handleChange("position", e.target.value)}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="מיקום (1 = בכור)"
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- ממליצים --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              ממליצים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* ממליץ 1 */}
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    שם ממליץ/ה 1
                  </Label>
                  <Input
                    value={formData.referenceName1 || ""}
                    onChange={(e) =>
                      handleChange("referenceName1", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="שם מלא"
                    className="h-9 text-xs focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    טלפון ממליץ/ה 1
                  </Label>
                  <Input
                    type="tel" // Use type="tel" for phone numbers
                    value={formData.referencePhone1 || ""}
                    onChange={(e) =>
                      handleChange("referencePhone1", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="מספר טלפון"
                    className="h-9 text-xs focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* ממליץ 2 */}
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    שם ממליץ/ה 2
                  </Label>
                  <Input
                    value={formData.referenceName2 || ""}
                    onChange={(e) =>
                      handleChange("referenceName2", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="שם מלא"
                    className="h-9 text-xs focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    טלפון ממליץ/ה 2
                  </Label>
                  <Input
                    type="tel"
                    value={formData.referencePhone2 || ""}
                    onChange={(e) =>
                      handleChange("referencePhone2", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="מספר טלפון"
                    className="h-9 text-xs focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- הגדרות פרופיל --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              הגדרות פרופיל
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              {/* נראות פרופיל */}
              <div className="flex items-center justify-between gap-4 border-b border-gray-200/50 pb-4">
                <div>
                  <Label className="font-medium text-sm text-gray-700">
                    הצג פרופיל למשדכים
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    האם לאפשר למשדכים לצפות בפרופיל שלך
                  </p>
                </div>
                <Switch
                  checked={formData.isProfileVisible ?? true}
                  onCheckedChange={(checked) =>
                    handleChange("isProfileVisible", checked)
                  }
                  disabled={!isEditing}
                />
              </div>

              {/* מגדר שדכן מועדף */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מגדר שדכן/ית מועדף
                </Label>
                <Select
                  value={formData.preferredMatchmakerGender || ""}
                  onValueChange={(value) =>
                    handleChange("preferredMatchmakerGender", value as Gender)
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר העדפה (לא חובה)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">משדך</SelectItem>
                    <SelectItem value="FEMALE">שדכנית</SelectItem>
                    <SelectItem value="NONE">ללא העדפה</SelectItem>{" "}
                  </SelectContent>
                </Select>
              </div>

              {/* סטטוס זמינות */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  סטטוס פניות
                </Label>
                <Select
                  value={formData.availabilityStatus || "AVAILABLE"}
                  onValueChange={(value) =>
                    handleChange(
                      "availabilityStatus",
                      value as AvailabilityStatus
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">פנוי/ה</SelectItem>
                    <SelectItem value="UNAVAILABLE">לא פנוי/ה</SelectItem>
                    <SelectItem value="DATING">בתהליך היכרות</SelectItem>
                    <SelectItem value="ENGAGED">מאורס/ת</SelectItem>
                    <SelectItem value="MARRIED">נשוי/אה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* הערת זמינות */}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  הערת פניות (אופציונלי)
                </Label>
                <Textarea
                  value={formData.availabilityNote || ""}
                  onChange={(e) =>
                    handleChange("availabilityNote", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="הערה קצרה לגבי הסטטוס..."
                  className="text-xs focus:ring-cyan-500 min-h-[60px]"
                  rows={2}
                />
              </div>

              {/* תיאור אישי */}
              <div className="border-t border-gray-200/50 pt-4 space-y-1.5">
                <Label className="block text-sm font-medium text-gray-700">
                  קצת עלי
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.about || ""}
                    onChange={(e) => handleChange("about", e.target.value)}
                    className="text-xs focus:ring-cyan-500 min-h-[100px]"
                    placeholder="ספר/י קצת על עצמך, השקפה, תכונות..."
                    rows={4}
                  />
                ) : (
                  <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap min-h-[40px]">
                    {formData.about || (
                      <span className="text-gray-400 italic">
                        אין תיאור אישי
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* תחביבים */}
              <div className="border-t border-gray-200/50 pt-4 space-y-1.5">
                <Label className="block text-sm font-medium text-gray-700">
                  תחביבים ופנאי
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.hobbies || ""}
                    onChange={(e) => handleChange("hobbies", e.target.value)}
                    className="text-xs focus:ring-cyan-500 min-h-[80px]"
                    placeholder="מה את/ה אוהב/ת לעשות בזמן הפנוי?"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap min-h-[40px]">
                    {formData.hobbies || (
                      <span className="text-gray-400 italic">
                        לא צוינו תחביבים
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSection;
