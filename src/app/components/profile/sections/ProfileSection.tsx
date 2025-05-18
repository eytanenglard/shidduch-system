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
import { cn } from "@/lib/utils";

const languageOptions = [
  { value: "hebrew", label: "עברית" },
  { value: "english", label: "אנגלית" },
  { value: "yiddish", label: "יידיש" },
  { value: "russian", label: "רוסית" },
  { value: "arabic", label: "ערבית" },
  { value: "french", label: "צרפתית" },
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

// פונקציית עזר להמרת ערך ל-Date אם הוא מחרוזת תאריך תקינה או Date קיים
const ensureDateObject = (
  value: string | number | Date | null | undefined
): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
};

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true); // מתחיל כ-true כי אנחנו תמיד מנסים לאתחל נתונים
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  // אתחול נתונים מה-API
  const fetchProfileAndInitialize = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (data.success && data.profile) {
        const fetchedProfile = data.profile;
        const profileData: Partial<UserProfile> = {
          gender: fetchedProfile.gender || undefined,
          birthDate: ensureDateObject(fetchedProfile.birthDate),
          nativeLanguage: fetchedProfile.nativeLanguage || undefined,
          additionalLanguages: fetchedProfile.additionalLanguages || [],
          height: fetchedProfile.height ?? undefined,
          maritalStatus: fetchedProfile.maritalStatus || undefined,
          occupation: fetchedProfile.occupation || undefined,
          education: fetchedProfile.education || undefined,
          religiousLevel: fetchedProfile.religiousLevel || undefined,
          address: fetchedProfile.address || undefined,
          city: fetchedProfile.city || undefined,
          origin: fetchedProfile.origin || undefined,
          parentStatus: fetchedProfile.parentStatus || undefined,
          siblings: fetchedProfile.siblings ?? undefined,
          position: fetchedProfile.position ?? undefined,
          referenceName1: fetchedProfile.referenceName1 || undefined,
          referencePhone1: fetchedProfile.referencePhone1 || undefined,
          referenceName2: fetchedProfile.referenceName2 || undefined,
          referencePhone2: fetchedProfile.referencePhone2 || undefined,
          isProfileVisible: fetchedProfile.isProfileVisible ?? true,
          preferredMatchmakerGender:
            fetchedProfile.preferredMatchmakerGender || undefined,
          availabilityStatus:
            fetchedProfile.availabilityStatus || AvailabilityStatus.AVAILABLE,
          availabilityNote: fetchedProfile.availabilityNote || undefined,
          availabilityUpdatedAt: ensureDateObject(
            fetchedProfile.availabilityUpdatedAt
          ),
          about: fetchedProfile.about || undefined,
          hobbies: fetchedProfile.hobbies || undefined,
          createdAt: ensureDateObject(fetchedProfile.createdAt),
          updatedAt: ensureDateObject(fetchedProfile.updatedAt),
          lastActive: ensureDateObject(fetchedProfile.lastActive),
        };
        setFormData(profileData);
        setInitialData(profileData);
      } else {
        const emptyProfileData: Partial<UserProfile> = {
          additionalLanguages: [],
          isProfileVisible: true,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
        };
        setFormData(emptyProfileData);
        setInitialData(emptyProfileData);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      const errorProfileData: Partial<UserProfile> = {
        additionalLanguages: [],
        isProfileVisible: true,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      };
      setFormData(errorProfileData);
      setInitialData(errorProfileData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // אם ה-profile prop קיים, הוא מקבל עדיפות על פני fetch.
    // אם ה-profile prop לא קיים, ננסה להביא מה-API.
    if (profile) {
      // console.log("ProfileSection: Initializing from prop 'profile'", profile);
      const profilePropData: Partial<UserProfile> = {
        gender: profile.gender || undefined,
        birthDate: ensureDateObject(profile.birthDate),
        nativeLanguage: profile.nativeLanguage || undefined,
        additionalLanguages: profile.additionalLanguages || [],
        height: profile.height ?? undefined,
        maritalStatus: profile.maritalStatus || undefined,
        occupation: profile.occupation || undefined,
        education: profile.education || undefined,
        religiousLevel: profile.religiousLevel || undefined,
        address: profile.address || undefined,
        city: profile.city || undefined,
        origin: profile.origin || undefined,
        parentStatus: profile.parentStatus || undefined,
        siblings: profile.siblings ?? undefined,
        position: profile.position ?? undefined,
        referenceName1: profile.referenceName1 || undefined,
        referencePhone1: profile.referencePhone1 || undefined,
        referenceName2: profile.referenceName2 || undefined,
        referencePhone2: profile.referencePhone2 || undefined,
        isProfileVisible: profile.isProfileVisible ?? true,
        preferredMatchmakerGender:
          profile.preferredMatchmakerGender || undefined,
        availabilityStatus:
          profile.availabilityStatus || AvailabilityStatus.AVAILABLE,
        availabilityNote: profile.availabilityNote || undefined,
        availabilityUpdatedAt: ensureDateObject(profile.availabilityUpdatedAt),
        about: profile.about || undefined,
        hobbies: profile.hobbies || undefined,
        createdAt: ensureDateObject(profile.createdAt),
        updatedAt: ensureDateObject(profile.updatedAt),
        lastActive: ensureDateObject(profile.lastActive),
      };
      setFormData(profilePropData);
      setInitialData(profilePropData);
      setLoading(false);
    } else {
      // console.log("ProfileSection: 'profile' prop is null, fetching from API.");
      fetchProfileAndInitialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]); // הוספנו את profile כתלות. ה-fetch יקרה רק אם profile הוא null/undefined.

  // אפקט זה ירוץ כאשר ה-profile prop משתנה *לאחר* הטעינה הראשונית,
  // לדוגמה, אם נתונים מתעדכנים ממקור חיצוני.
  useEffect(() => {
    if (profile && !loading) {
      // רק אם לא בטעינה ראשונית וה-profile prop קיים
      // console.log("ProfileSection: Prop 'profile' updated, merging data.", profile);
      setFormData((prevFormData) => {
        const newFormData: Partial<UserProfile> = {
          // שומר על עדיפות ל-profile prop, אך משתמש ב-prevFormData כגיבוי
          // אם שדה מסוים לא קיים ב-profile prop שהתקבל.
          gender: profile.gender ?? prevFormData.gender,
          birthDate:
            ensureDateObject(profile.birthDate) ?? prevFormData.birthDate,
          nativeLanguage: profile.nativeLanguage ?? prevFormData.nativeLanguage,
          additionalLanguages: profile.additionalLanguages?.length
            ? profile.additionalLanguages
            : prevFormData.additionalLanguages || [],
          height: profile.height ?? prevFormData.height,
          maritalStatus: profile.maritalStatus ?? prevFormData.maritalStatus,
          occupation: profile.occupation ?? prevFormData.occupation,
          education: profile.education ?? prevFormData.education,
          religiousLevel: profile.religiousLevel ?? prevFormData.religiousLevel,
          address: profile.address ?? prevFormData.address,
          city: profile.city ?? prevFormData.city,
          origin: profile.origin ?? prevFormData.origin,
          parentStatus: profile.parentStatus ?? prevFormData.parentStatus,
          siblings: profile.siblings ?? prevFormData.siblings,
          position: profile.position ?? prevFormData.position,
          referenceName1: profile.referenceName1 ?? prevFormData.referenceName1,
          referencePhone1:
            profile.referencePhone1 ?? prevFormData.referencePhone1,
          referenceName2: profile.referenceName2 ?? prevFormData.referenceName2,
          referencePhone2:
            profile.referencePhone2 ?? prevFormData.referencePhone2,
          isProfileVisible:
            profile.isProfileVisible ?? prevFormData.isProfileVisible ?? true,
          preferredMatchmakerGender:
            profile.preferredMatchmakerGender ??
            prevFormData.preferredMatchmakerGender,
          availabilityStatus:
            profile.availabilityStatus ??
            prevFormData.availabilityStatus ??
            AvailabilityStatus.AVAILABLE,
          availabilityNote:
            profile.availabilityNote ?? prevFormData.availabilityNote,
          availabilityUpdatedAt:
            ensureDateObject(profile.availabilityUpdatedAt) ??
            prevFormData.availabilityUpdatedAt,
          about: profile.about ?? prevFormData.about,
          hobbies: profile.hobbies ?? prevFormData.hobbies,
          createdAt:
            ensureDateObject(profile.createdAt) ?? prevFormData.createdAt,
          updatedAt:
            ensureDateObject(profile.updatedAt) ?? prevFormData.updatedAt,
          lastActive:
            ensureDateObject(profile.lastActive) ?? prevFormData.lastActive,
        };

        if (JSON.stringify(initialData) !== JSON.stringify(newFormData)) {
          setInitialData(newFormData);
        }
        return newFormData;
      });
    }
  }, [profile, loading, initialData]); // הוספנו loading ו-initialData לתלויות

  const handleChange = (
    field: keyof UserProfile,
    value: UserProfile[keyof UserProfile]
  ) => {
    setFormData((prev) => {
      let finalValue = value;
      if (field === "height" || field === "siblings" || field === "position") {
        const rawValue = value as string;
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          finalValue = undefined;
        } else {
          const parsed = parseInt(rawValue, 10);
          finalValue = !isNaN(parsed) ? parsed : undefined;
        }
      } else if (field === "birthDate") {
        finalValue = ensureDateObject(
          value as string | Date | null | undefined
        ) as UserProfile[keyof UserProfile];
      }

      return {
        ...prev,
        [field]: finalValue,
      };
    });
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    setInitialData(formData);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="text-center p-4">טוען נתוני פרופיל...</div>;
  }

  return (
    <div className="relative" dir="rtl">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
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
                    size="sm"
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

      <div className="container mx-auto py-6 px-4 space-y-6">
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              פרטים אישיים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
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
                    handleChange("birthDate", e.target.value || undefined);
                  }}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  שפת אם
                </Label>
                <Select
                  value={formData.nativeLanguage || ""}
                  onValueChange={(value) =>
                    handleChange("nativeLanguage", value || undefined)
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
                            type="button"
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

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  גובה (סמ)
                </Label>
                <Input
                  type="number"
                  value={formData.height ?? ""}
                  onChange={(e) => handleChange("height", e.target.value)}
                  disabled={!isEditing}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="גובה בסמ"
                  min="100"
                  max="250"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מצב משפחתי
                </Label>
                <Select
                  value={formData.maritalStatus || ""}
                  onValueChange={(value) =>
                    handleChange("maritalStatus", value || undefined)
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

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  תעסוקה
                </Label>
                <Input
                  value={formData.occupation || ""}
                  onChange={(e) =>
                    handleChange("occupation", e.target.value || undefined)
                  }
                  disabled={!isEditing}
                  placeholder="תעסוקה נוכחית"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  השכלה
                </Label>
                <Input
                  value={formData.education || ""}
                  onChange={(e) =>
                    handleChange("education", e.target.value || undefined)
                  }
                  disabled={!isEditing}
                  placeholder="השכלה"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  רמה דתית
                </Label>
                <Select
                  value={formData.religiousLevel || ""}
                  onValueChange={(value) =>
                    handleChange("religiousLevel", value || undefined)
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

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  כתובת
                </Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) =>
                    handleChange("address", e.target.value || undefined)
                  }
                  disabled={!isEditing}
                  placeholder="כתובת מגורים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  עיר
                </Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) =>
                    handleChange("city", e.target.value || undefined)
                  }
                  disabled={!isEditing}
                  placeholder="עיר מגורים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מוצא / עדה
                </Label>
                <Input
                  value={formData.origin || ""}
                  onChange={(e) =>
                    handleChange("origin", e.target.value || undefined)
                  }
                  disabled={!isEditing}
                  placeholder="ארץ מוצא / עדה"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
                  onValueChange={(value) =>
                    handleChange("parentStatus", value || undefined)
                  }
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

        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              ממליצים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-4">
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    שם ממליץ/ה 1
                  </Label>
                  <Input
                    value={formData.referenceName1 || ""}
                    onChange={(e) =>
                      handleChange(
                        "referenceName1",
                        e.target.value || undefined
                      )
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
                    type="tel"
                    value={formData.referencePhone1 || ""}
                    onChange={(e) =>
                      handleChange(
                        "referencePhone1",
                        e.target.value || undefined
                      )
                    }
                    disabled={!isEditing}
                    placeholder="מספר טלפון"
                    className="h-9 text-xs focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    שם ממליץ/ה 2
                  </Label>
                  <Input
                    value={formData.referenceName2 || ""}
                    onChange={(e) =>
                      handleChange(
                        "referenceName2",
                        e.target.value || undefined
                      )
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
                      handleChange(
                        "referencePhone2",
                        e.target.value || undefined
                      )
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

        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              הגדרות פרופיל
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
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

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מגדר שדכן/ית מועדף
                </Label>
                <Select
                  value={formData.preferredMatchmakerGender || ""}
                  onValueChange={(value) =>
                    handleChange(
                      "preferredMatchmakerGender",
                      (value as Gender) || undefined
                    )
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר העדפה (לא חובה)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">משדך</SelectItem>
                    <SelectItem value="FEMALE">שדכנית</SelectItem>
                    <SelectItem value="NONE">ללא העדפה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  סטטוס פניות
                </Label>
                <Select
                  value={
                    formData.availabilityStatus || AvailabilityStatus.AVAILABLE
                  }
                  onValueChange={(value) =>
                    handleChange(
                      "availabilityStatus",
                      (value as AvailabilityStatus) ||
                        AvailabilityStatus.AVAILABLE
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

              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  הערת פניות (אופציונלי)
                </Label>
                <Textarea
                  value={formData.availabilityNote || ""}
                  onChange={(e) =>
                    handleChange(
                      "availabilityNote",
                      e.target.value || undefined
                    )
                  }
                  disabled={!isEditing}
                  placeholder="הערה קצרה לגבי הסטטוס..."
                  className="text-xs focus:ring-cyan-500 min-h-[60px]"
                  rows={2}
                />
              </div>

              <div className="border-t border-gray-200/50 pt-4 space-y-1.5">
                <Label className="block text-sm font-medium text-gray-700">
                  קצת עלי
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.about || ""}
                    onChange={(e) =>
                      handleChange("about", e.target.value || undefined)
                    }
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

              <div className="border-t border-gray-200/50 pt-4 space-y-1.5">
                <Label className="block text-sm font-medium text-gray-700">
                  תחביבים ופנאי
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.hobbies || ""}
                    onChange={(e) =>
                      handleChange("hobbies", e.target.value || undefined)
                    }
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
