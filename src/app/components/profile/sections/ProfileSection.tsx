// src/app/components/profile/sections/ProfileSection.tsx
"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React, { useState, useEffect } from "react";
import {
  Gender,
  AvailabilityStatus,
  ServiceType,
  HeadCoveringType,
  KippahType,
  ReligiousJourney,
  
} from "@prisma/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Save,
  X,
  Users,
  BookOpen,
  Briefcase,
  Shield,
  Heart,
  MapPin,
  Languages,
  Palette,
  Smile,
  UserCircle,
  Info,
} from "lucide-react";
import { UserProfile } from "@/types/next-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { languageOptions } from "@/lib/languageOptions";
import { toast } from "sonner";

const maritalStatusOptions = [
  { value: "single", label: "רווק/ה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
  { value: "annulled", label: "נישואין שבוטלו" },
];

const religiousLevelOptions = [
  { value: "charedi", label: "חרדי/ת" },
  { value: "charedi_modern", label: "חרדי/ת מודרני/ת" },
  { value: "dati_leumi_torani", label: "דתי/ה לאומי/ת תורני/ת" },
  { value: "dati_leumi_liberal", label: "דתי/ה לאומי/ת ליברלי/ת" },
  { value: "dati_leumi_standard", label: "דתי/ה לאומי/ת (סטנדרטי)" },
  { value: "masorti_strong", label: "מסורתי/ת (קרוב/ה לדת)" },
  { value: "masorti_light", label: "מסורתי/ת (קשר קל למסורת)" },
  { value: "secular_traditional_connection", label: "חילוני/ת עם זיקה למסורת" },
  { value: "secular", label: "חילוני/ת" },
  { value: "spiritual_not_religious", label: "רוחני/ת (לאו דווקא דתי/ה)" },
  { value: "other", label: "אחר (נא לפרט ב'אודות')" },
];
const religiousJourneyOptions = [
    { value: "BORN_INTO_CURRENT_LIFESTYLE", label: "גדלתי בסביבה דומה להגדרתי כיום" },
    { value: "BORN_SECULAR", label: "גדלתי בסביבה חילונית" },
    { value: "BAAL_TESHUVA", label: "חזרתי בתשובה" },
    { value: "DATLASH", label: "יצאתי בשאלה (דתל\"ש)" },
    { value: "CONVERT", label: "גר/ה / גיורת" },
    { value: "IN_PROCESS", label: "בתהליך של שינוי / התלבטות" },
    { value: "OTHER", label: "אחר (נא לפרט בהערות)" },
];

const educationLevelOptions = [
  { value: "high_school", label: "תיכונית" },
  { value: "vocational", label: "מקצועית / תעודה" },
  { value: "academic_student", label: "סטודנט/ית לתואר" },
  { value: "academic_ba", label: "תואר ראשון (BA/BSc)" },
  { value: "academic_ma", label: "תואר שני (MA/MSc)" },
  { value: "academic_phd", label: "דוקטורט (PhD)" },
  { value: "yeshiva_seminary", label: "לימודים תורניים (ישיבה/מדרשה/כולל)" },
  { value: "other", label: "אחר" },
];

const serviceTypeOptions = [
  { value: ServiceType.MILITARY_COMBATANT, label: "צבאי - לוחם/ת" },
  { value: ServiceType.MILITARY_SUPPORT, label: "צבאי - תומכ/ת לחימה" },
  { value: ServiceType.MILITARY_OFFICER, label: "צבאי - קצונה" },
  {
    value: ServiceType.MILITARY_INTELLIGENCE_CYBER_TECH,
    label: "צבאי - מודיעין/סייבר/טכנולוגי",
  },
  { value: ServiceType.NATIONAL_SERVICE_ONE_YEAR, label: "שירות לאומי - שנה" },
  {
    value: ServiceType.NATIONAL_SERVICE_TWO_YEARS,
    label: "שירות לאומי - שנתיים",
  },
  { value: ServiceType.HESDER_YESHIVA, label: "ישיבת הסדר" },
  {
    value: ServiceType.YESHIVA_ONLY_POST_HS,
    label: "ישיבה גבוהה / מדרשה (ללא שירות צבאי/לאומי)",
  },
  {
    value: ServiceType.PRE_MILITARY_ACADEMY_AND_SERVICE,
    label: "מכינה קדם-צבאית ושירות",
  },
  { value: ServiceType.EXEMPTED, label: "פטור משירות" },
  { value: ServiceType.CIVILIAN_SERVICE, label: "שירות אזרחי" },
  { value: ServiceType.OTHER, label: "אחר / לא רלוונטי" },
];

const headCoveringOptions = [
  { value: HeadCoveringType.FULL_COVERAGE, label: "כיסוי ראש מלא" },
  { value: HeadCoveringType.PARTIAL_COVERAGE, label: "כיסוי ראש חלקי" },
  { value: HeadCoveringType.HAT_BERET, label: "כובע / ברט" },
  {
    value: HeadCoveringType.SCARF_ONLY_SOMETIMES,
    label: "מטפחת (רק באירועים/בית כנסת)",
  },
  { value: HeadCoveringType.NONE, label: "ללא כיסוי ראש" },
];

const kippahTypeOptions = [
  { value: KippahType.BLACK_VELVET, label: "קטיפה שחורה" },
  { value: KippahType.KNITTED_SMALL, label: "סרוגה קטנה" },
  { value: KippahType.KNITTED_LARGE, label: "סרוגה גדולה" },
  { value: KippahType.CLOTH, label: "בד" },
  { value: KippahType.BRESLEV, label: "ברסלב (לבנה גדולה)" },
  { value: KippahType.NONE_AT_WORK_OR_CASUAL, label: "לא בעבודה / ביומיום" },
  { value: KippahType.NONE_USUALLY, label: "לרוב לא חובש" },
  { value: KippahType.OTHER, label: "אחר" },
];

const characterTraitsOptions = [
  { value: "empathetic", label: "אמפתי/ת", icon: Heart },
  { value: "driven", label: "שאפתן/ית", icon: Briefcase },
  { value: "optimistic", label: "אופטימי/ת", icon: Smile },
  { value: "family_oriented", label: "משפחתי/ת", icon: Users },
  { value: "intellectual", label: "אינטלקטואל/ית", icon: BookOpen },
  { value: "organized", label: "מאורגנ/ת", icon: Palette },
  { value: "calm", label: "רגוע/ה", icon: Heart },
  { value: "humorous", label: "בעל/ת חוש הומור", icon: Smile },
  { value: "sociable", label: "חברותי/ת", icon: Users },
  { value: "sensitive", label: "רגיש/ה", icon: Heart },
  { value: "independent", label: "עצמאי/ת", icon: MapPin },
  { value: "creative", label: "יצירתי/ת", icon: Palette },
  { value: "honest", label: "כן/ה וישר/ה", icon: Shield },
  { value: "responsible", label: "אחראי/ת", icon: Shield },
  { value: "easy_going", label: "זורם/ת וקליל/ה", icon: Smile },
];

const hobbiesOptions = [
  { value: "travel", label: "טיולים", icon: MapPin },
  { value: "sports", label: "ספורט", icon: Briefcase },
  { value: "reading", label: "קריאה", icon: BookOpen },
  { value: "cooking_baking", label: "בישול/אפיה", icon: Palette },
  { value: "music_playing_instrument", label: "מוזיקה/נגינה", icon: Languages },
  { value: "art_crafts", label: "אומנות/יצירה", icon: Palette },
  { value: "volunteering", label: "התנדבות", icon: Heart },
  { value: "learning_courses", label: "למידה/קורסים", icon: BookOpen },
  { value: "board_games_puzzles", label: "משחקי קופסא/פאזלים", icon: Smile },
  { value: "movies_theater", label: "סרטים/תיאטרון", icon: Smile },
  { value: "dancing", label: "ריקוד", icon: Users },
  { value: "writing", label: "כתיבה", icon: BookOpen },
  { value: "nature_hiking", label: "טבע/טיולים רגליים", icon: MapPin },
  { value: "photography", label: "צילום", icon: Palette },
];

const preferredMatchmakerGenderOptions = [
  { value: "MALE", label: "משדך" },
  { value: "FEMALE", label: "שדכנית" },
  { value: "NONE", label: "ללא העדפה" },
];

interface ProfileSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  viewOnly?: boolean;
  onSave: (data: Partial<UserProfile>) => void;
}

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
  profile: profileProp,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  const initializeFormData = (profileData: UserProfile | null) => {
    const dataToSet: Partial<UserProfile> = {
      gender: profileData?.gender || undefined,
      birthDate: ensureDateObject(profileData?.birthDate),
      nativeLanguage: profileData?.nativeLanguage || undefined,
      additionalLanguages: profileData?.additionalLanguages || [],
      height: profileData?.height ?? undefined,
      maritalStatus: profileData?.maritalStatus || undefined,
      occupation: profileData?.occupation || "",
      education: profileData?.education || "",
      educationLevel: profileData?.educationLevel || undefined,
      city: profileData?.city || "",
      origin: profileData?.origin || "",
            religiousJourney: profileData?.religiousJourney || undefined, // START OF CHANGE

      religiousLevel: profileData?.religiousLevel || undefined,
      about: profileData?.about || "",
      parentStatus: profileData?.parentStatus || undefined,
      siblings: profileData?.siblings ?? undefined,
      position: profileData?.position ?? undefined,
      isProfileVisible: profileData?.isProfileVisible ?? true,
      preferredMatchmakerGender:
        profileData?.preferredMatchmakerGender || undefined,
      availabilityStatus:
        profileData?.availabilityStatus || AvailabilityStatus.AVAILABLE,
      availabilityNote: profileData?.availabilityNote || "",
      availabilityUpdatedAt: ensureDateObject(
        profileData?.availabilityUpdatedAt
      ),
      matchingNotes: profileData?.matchingNotes || "",
      shomerNegiah: profileData?.shomerNegiah ?? undefined,
      serviceType: profileData?.serviceType || undefined,
      serviceDetails: profileData?.serviceDetails || "",
      headCovering: profileData?.headCovering || undefined,
      kippahType: profileData?.kippahType || undefined,
      hasChildrenFromPrevious:
        profileData?.hasChildrenFromPrevious ?? undefined,
      profileCharacterTraits: profileData?.profileCharacterTraits || [],
      profileHobbies: profileData?.profileHobbies || [],
      aliyaCountry: profileData?.aliyaCountry || "",
      aliyaYear: profileData?.aliyaYear ?? undefined,
      preferredAgeMin: profileData?.preferredAgeMin ?? undefined,
      preferredAgeMax: profileData?.preferredAgeMax ?? undefined,
      preferredHeightMin: profileData?.preferredHeightMin ?? undefined,
      preferredHeightMax: profileData?.preferredHeightMax ?? undefined,
      preferredReligiousLevels: profileData?.preferredReligiousLevels || [],
      preferredLocations: profileData?.preferredLocations || [],
      preferredEducation: profileData?.preferredEducation || [],
      preferredOccupations: profileData?.preferredOccupations || [],
      contactPreference: profileData?.contactPreference || undefined,
      id: profileData?.id,
      userId: profileData?.userId,
      createdAt: ensureDateObject(profileData?.createdAt),
      updatedAt: ensureDateObject(profileData?.updatedAt),
      lastActive: ensureDateObject(profileData?.lastActive),
    };
    setFormData(dataToSet);
    setInitialData(dataToSet);
  };

  useEffect(() => {
    setLoading(true);
    if (profileProp) {
      initializeFormData(profileProp);
      setLoading(false);
    } else {
      const fetchProfileAndInitialize = async () => {
        try {
          const response = await fetch("/api/profile");
          if (!response.ok) throw new Error("Failed to fetch profile");
          const data = await response.json();
          if (data.success && data.profile) {
            initializeFormData(data.profile);
          } else {
            initializeFormData(null);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          initializeFormData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfileAndInitialize();
    }
  }, [profileProp]);

  const handleChange = (
    field: keyof UserProfile,
    value:
      | UserProfile[keyof UserProfile]
      | string
      | number
      | boolean
      | Date
      | string[]
      | null
  ) => {
    setFormData((prev) => {
      let finalValue: UserProfile[keyof UserProfile] | undefined = undefined;

      if (
        field === "height" ||
        field === "siblings" ||
        field === "position" ||
        field === "aliyaYear" ||
        field === "preferredAgeMin" ||
        field === "preferredAgeMax" ||
        field === "preferredHeightMin" ||
        field === "preferredHeightMax"
      ) {
        const rawValue = value as string | number;
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          finalValue = undefined;
        } else {
          const parsed = parseInt(String(rawValue), 10);
          finalValue = !isNaN(parsed)
            ? (parsed as UserProfile[typeof field])
            : undefined;
        }
      } else if (field === "birthDate") {
        finalValue = ensureDateObject(
          value as string | Date | null | undefined
        ) as UserProfile[typeof field];
      } else if (
        typeof prev[field] === "boolean" ||
        field === "shomerNegiah" ||
        field === "hasChildrenFromPrevious" ||
        field === "isProfileVisible"
      ) {
        finalValue = value as boolean as UserProfile[typeof field];
      } else if (Array.isArray(prev[field])) {
        finalValue = value as string[] as UserProfile[typeof field];
      } else if (value === "" || value === null) {
        const nullableStringFields: (keyof UserProfile)[] = [
          "nativeLanguage",
          "occupation",
          "education",
          "city",
          "origin",
          "religiousLevel",
          "religiousJourney",
          "about",
          "parentStatus",
          "serviceDetails",
          "aliyaCountry",
          "availabilityNote",
          "matchingNotes",
          "educationLevel",
          "maritalStatus",
          "serviceType",
          "headCovering",
          "kippahType",
          "preferredMatchmakerGender",
          "contactPreference",
        ];
        if (nullableStringFields.includes(field as keyof UserProfile)) {
          finalValue = undefined;
        } else {
          finalValue = value as UserProfile[typeof field];
        }
      } else {
        finalValue = value as UserProfile[typeof field];
      }

      return {
        ...prev,
        [field]: finalValue,
      };
    });
  };

  const handleMultiSelectToggle = (
    field: keyof UserProfile,
    optionValue: string
  ) => {
    setFormData((prev) => {
      const currentValues = (prev[field] as string[]) || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      return { ...prev, [field]: newValues };
    });
  };

  const handleSave = () => {
    if (formData.about && formData.about.trim().length < 100) {
      toast.error("שגיאת ולידציה", {
        description: 'השדה "קצת עליי" חייב להכיל לפחות 100 תווים.',
        duration: 5000,
      });
      return;
    }
    const dataToSave = { ...formData };
    onSave(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  const renderDisplayValue = (
    value: string | number | Date | undefined | null,
    placeholder: string = "לא צוין"
  ) => {
    if (value === undefined || value === null || value === "") {
      return <span className="italic text-gray-500">{placeholder}</span>;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Intl.DateTimeFormat("he-IL").format(value);
    }
    return String(value);
  };

  const renderSelectDisplayValue = (
    value: string | undefined | null,
    options: { value: string; label: string }[],
    placeholder: string = "לא צוין"
  ) => {
    if (!value) {
      return <span className="italic text-gray-500">{placeholder}</span>;
    }
    const option = options.find((opt) => opt.value === value);
    return option ? (
      option.label
    ) : (
      <span className="italic text-gray-500">{placeholder}</span>
    );
  };

  const renderBooleanDisplayValue = (
    value: boolean | undefined | null,
    trueLabel: string = "כן",
    falseLabel: string = "לא",
    placeholder: string = "לא צוין"
  ) => {
    if (value === undefined || value === null) {
      return <span className="italic text-gray-500">{placeholder}</span>;
    }
    return value ? trueLabel : falseLabel;
  };

  if (loading) {
    return <div className="text-center p-4">טוען נתוני פרופיל...</div>;
  }

  const renderMultiSelectBadges = (
    fieldValues: string[] | undefined,
    options: { value: string; label: string; icon?: React.ElementType }[],
    emptyPlaceholder: string = "לא נבחרו פריטים."
  ) => {
    if (!fieldValues || fieldValues.length === 0) {
      return <p className="text-sm text-gray-500 italic">{emptyPlaceholder}</p>;
    }
    return fieldValues.map((value) => {
      const option = options.find((opt) => opt.value === value);
      return option ? (
        <Badge
          key={value}
          variant="secondary"
          className="mr-1 mb-1 bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full"
        >
          {option.icon && <option.icon className="w-3 h-3 mr-1" />}
          {option.label}
        </Badge>
      ) : null;
    });
  };

  return (
    <div className="relative" dir="rtl">
      {/* Sticky Header with Buttons */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                פרופיל אישי
              </h1>
              <p className="text-sm text-slate-500">
                {isEditing && !viewOnly
                  ? "ערוך/י את פרטי הפרופיל שלך."
                  : "פרטי הפרופיל של המועמד/ת."}
              </p>
            </div>
            {!viewOnly && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-cyan-400 text-cyan-700 hover:bg-cyan-50"
                  >
                    <Pencil className="w-3.5 h-3.5 ml-1.5" />
                    עריכה
                  </Button>
                ) : (
                  <>
                    {/* Desktop buttons - visible on larger screens */}
                    <div className="hidden sm:flex gap-2">
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
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-screen-xl py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50/40 to-pink-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <UserCircle className="w-5 h-5 text-cyan-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  פרטים אישיים ודמוגרפיים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מגדר
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.gender || ""}
                        onValueChange={(value) =>
                          handleChange("gender", value as Gender)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י מגדר" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">זכר</SelectItem>
                          <SelectItem value="FEMALE">נקבה</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.gender === "MALE"
                            ? "זכר"
                            : formData.gender === "FEMALE"
                            ? "נקבה"
                            : undefined
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      תאריך לידה
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        type="date"
                        value={
                          formData.birthDate instanceof Date &&
                          !isNaN(formData.birthDate.getTime())
                            ? formData.birthDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          handleChange("birthDate", e.target.value || undefined)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        max={new Date().toISOString().split("T")[0]}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.birthDate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      גובה (סמ)
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        type="number"
                        value={formData.height ?? ""}
                        onChange={(e) => handleChange("height", e.target.value)}
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder="גובה בסמ"
                        min="100"
                        max="250"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.height ? `${formData.height} ס"מ` : undefined
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      עיר מגורים
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.city || ""}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="לדוגמה: ירושלים"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.city)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מוצא / עדה
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.origin || ""}
                        onChange={(e) => handleChange("origin", e.target.value)}
                        placeholder="לדוגמה: אשכנזי, ספרדי"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.origin)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      עלה/תה לארץ
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.aliyaCountry || ""}
                        onChange={(e) =>
                          handleChange("aliyaCountry", e.target.value)
                        }
                        placeholder="אם רלוונטי, מאיזו מדינה?"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.aliyaCountry,
                          "לא רלוונטי"
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      שנת עליה
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        type="number"
                        value={formData.aliyaYear ?? ""}
                        onChange={(e) =>
                          handleChange("aliyaYear", e.target.value)
                        }
                        disabled={!formData.aliyaCountry}
                        placeholder="אם רלוונטי"
                        className="h-9 text-sm focus:ring-cyan-500"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.aliyaYear,
                          formData.aliyaCountry ? "לא צוינה שנה" : "לא רלוונטי"
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      שפת אם
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.nativeLanguage || ""}
                        onValueChange={(value) =>
                          handleChange("nativeLanguage", value || undefined)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י שפת אם" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {languageOptions.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.nativeLanguage,
                          languageOptions
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      שפות נוספות
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        onValueChange={(value) => {
                          const currentLanguages =
                            formData.additionalLanguages || [];
                          if (!currentLanguages.includes(value)) {
                            handleChange("additionalLanguages", [
                              ...currentLanguages,
                              value,
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="הוסף/י שפה..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {languageOptions
                            .filter(
                              (lang) =>
                                !(formData.additionalLanguages || []).includes(
                                  lang.value
                                ) && lang.value !== formData.nativeLanguage
                            )
                            .map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(formData.additionalLanguages || []).map((langValue) => {
                        const lang = languageOptions.find(
                          (l) => l.value === langValue
                        );
                        return lang ? (
                          <Badge
                            key={lang.value}
                            variant="secondary"
                            className="bg-cyan-100/70 text-cyan-800 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center"
                          >
                            {lang.label}
                            {isEditing && !viewOnly && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChange(
                                    "additionalLanguages",
                                    (formData.additionalLanguages || []).filter(
                                      (l) => l !== langValue
                                    )
                                  )
                                }
                                className="mr-1.5 text-cyan-600 hover:text-cyan-800 text-xs"
                                aria-label={`הסר ${lang.label}`}
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ) : null;
                      })}
                      {(!isEditing || viewOnly) &&
                        (!formData.additionalLanguages ||
                          formData.additionalLanguages.length === 0) && (
                          <p className="text-sm text-gray-500 italic">
                            לא צוינו שפות נוספות.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50/40 to-indigo-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-purple-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  מצב משפחתי ורקע
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 items-start">
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מצב משפחתי
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.maritalStatus || ""}
                        onValueChange={(value) =>
                          handleChange("maritalStatus", value || undefined)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י מצב" />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.maritalStatus,
                          maritalStatusOptions
                        )}
                      </p>
                    )}
                  </div>
                  {(formData.maritalStatus === "divorced" ||
                    formData.maritalStatus === "widowed" ||
                    formData.maritalStatus === "annulled") && (
                    <div
                      className={cn(
                        "pt-1 sm:pt-0",
                        isEditing && !viewOnly ? "sm:pt-5" : "sm:pt-0"
                      )}
                    >
                      <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                        ילדים מקשר קודם?
                      </Label>
                      {isEditing && !viewOnly ? (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                          <Checkbox
                            id="hasChildrenFromPrevious"
                            checked={formData.hasChildrenFromPrevious || false}
                            onCheckedChange={(checked) =>
                              handleChange(
                                "hasChildrenFromPrevious",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="hasChildrenFromPrevious"
                            className="text-sm font-normal text-gray-700"
                          >
                            יש ילדים
                          </Label>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderBooleanDisplayValue(
                            formData.hasChildrenFromPrevious
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מצב הורים
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.parentStatus || ""}
                        onChange={(e) =>
                          handleChange("parentStatus", e.target.value)
                        }
                        placeholder="לדוגמה: נשואים, גרושים"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.parentStatus)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מספר אחים/אחיות
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        type="number"
                        value={formData.siblings ?? ""}
                        onChange={(e) =>
                          handleChange("siblings", e.target.value)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder="כולל אותך"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.siblings)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מיקום במשפחה
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        type="number"
                        value={formData.position ?? ""}
                        onChange={(e) =>
                          handleChange("position", e.target.value)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder="לדוגמה: 1 (בכור/ה)"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.position)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-50/40 to-amber-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  דת ואורח חיים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 items-start">
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      רמה דתית
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.religiousLevel || ""}
                        onValueChange={(value) =>
                          handleChange("religiousLevel", value || undefined)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י רמה" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {religiousLevelOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.religiousLevel,
                          religiousLevelOptions
                        )}
                      </p>
                    )}
                  </div>
                     {/* START OF CHANGE: New Religious Journey field */}
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מסע דתי
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.religiousJourney || ""}
                        onValueChange={(value) =>
                          handleChange("religiousJourney", (value as ReligiousJourney) || undefined)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י רקע דתי" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {religiousJourneyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.religiousJourney,
                          religiousJourneyOptions,
                          "לא צוין"
                        )}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      "pt-1 sm:pt-0",
                      isEditing && !viewOnly ? "sm:pt-5" : "sm:pt-0"
                    )}
                  >
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      שומר/ת נגיעה?
                    </Label>
                    {isEditing && !viewOnly ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                        <Checkbox
                          id="shomerNegiah"
                          checked={formData.shomerNegiah || false}
                          onCheckedChange={(checked) =>
                            handleChange("shomerNegiah", checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="shomerNegiah"
                          className="text-sm font-normal text-gray-700"
                        >
                          כן
                        </Label>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderBooleanDisplayValue(formData.shomerNegiah)}
                      </p>
                    )}
                  </div>
                  {formData.gender === Gender.FEMALE && (
                    <div>
                      <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                        כיסוי ראש
                      </Label>
                      {isEditing && !viewOnly ? (
                        <Select
                          value={formData.headCovering || ""}
                          onValueChange={(value) =>
                            handleChange(
                              "headCovering",
                              (value as HeadCoveringType) || undefined
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                            <SelectValue placeholder="בחר/י סוג כיסוי" />
                          </SelectTrigger>
                          <SelectContent>
                            {headCoveringOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderSelectDisplayValue(
                            formData.headCovering,
                            headCoveringOptions,
                            "ללא"
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  {formData.gender === Gender.MALE && (
                    <div>
                      <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                        סוג כיפה
                      </Label>
                      {isEditing && !viewOnly ? (
                        <Select
                          value={formData.kippahType || ""}
                          onValueChange={(value) =>
                            handleChange(
                              "kippahType",
                              (value as KippahType) || undefined
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                            <SelectValue placeholder="בחר/י סוג כיפה" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {kippahTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderSelectDisplayValue(
                            formData.kippahType,
                            kippahTypeOptions,
                            "ללא"
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      מגדר שדכן/ית מועדף
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.preferredMatchmakerGender || ""}
                        onValueChange={(value) =>
                          handleChange(
                            "preferredMatchmakerGender",
                            (value as Gender) || undefined
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י העדפה (לא חובה)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">משדך</SelectItem>
                          <SelectItem value="FEMALE">שדכנית</SelectItem>
                          <SelectItem value="NONE">ללא העדפה</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.preferredMatchmakerGender,
                          preferredMatchmakerGenderOptions,
                          "ללא העדפה"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50/40 to-gray-100/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Info className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  קצת עלי ומידע נוסף
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Label htmlFor="about" className="text-sm font-medium text-gray-700">
                        ספר/י קצת על עצמך (תיאור חופשי)
                      </Label>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger type="button" className="text-gray-400 hover:text-gray-600">
                            <Info className="w-4 h-4" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-center">
                            <p>כאן המקום שלך לבלוט! ספר/י על התשוקות שלך, מה מצחיק אותך, ומה את/ה מחפש/ת.
                              <br />
                              <strong className="text-cyan-600">שים/י לב: נדרשים לפחות 100 תווים.</strong></p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {isEditing && !viewOnly ? (
                      <div>
                        <Textarea
                          id="about"
                          value={formData.about || ""}
                          onChange={(e) => handleChange("about", e.target.value)}
                          className={cn(
                            "text-sm focus:ring-cyan-500 min-h-[120px] rounded-lg",
                            formData.about && formData.about.trim().length < 100 ? "border-red-400 focus:ring-red-300" : ""
                          )}
                          placeholder="תאר/י את עצמך, מה מאפיין אותך, מה חשוב לך..."
                          rows={5}
                        />
                        {formData.about && (
                          <div className={cn(
                            "text-xs mt-1 text-right",
                            formData.about.trim().length < 100 ? "text-red-600" : "text-gray-500"
                          )}>
                            {formData.about.trim().length} / 100+ תווים
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                        {formData.about || (
                          <span className="text-gray-500 italic">
                            לא הוזן תיאור אישי.
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Label className="text-sm font-medium text-gray-700">
                        הערות נוספות לשדכן/ית (לא יוצג לצד השני)
                      </Label>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger type="button" className="text-gray-400 hover:text-gray-600">
                            <Info className="w-4 h-4" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-center">
                            <p>מידע שחשוב לנו לדעת כדי למצוא התאמה טובה, אך לא תרצה/י שיופיע בפרופיל הגלוי. למשל: נושאים רגישים, העדפות ספציפיות מאוד, או רקע נוסף.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {isEditing && !viewOnly ? (
                      <Textarea
                        value={formData.matchingNotes || ""}
                        onChange={(e) =>
                          handleChange("matchingNotes", e.target.value)
                        }
                        className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                        placeholder="דברים נוספים שחשוב שהשדכן/ית יידעו עליך..."
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                        {formData.matchingNotes || (
                          <span className="text-gray-500 italic">
                            אין הערות נוספות לשדכן/ית.
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50/40 to-green-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Briefcase className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  השכלה, עיסוק ושירות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      רמת השכלה
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.educationLevel || ""}
                        onValueChange={(value) =>
                          handleChange("educationLevel", value || undefined)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י רמה" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevelOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.educationLevel,
                          educationLevelOptions
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      פירוט השכלה (מוסד, תחום)
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.education || ""}
                        onChange={(e) =>
                          handleChange("education", e.target.value)
                        }
                        placeholder="לדוגמה: אוני' בר אילן, משפטים"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.education)}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      עיסוק נוכחי
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.occupation || ""}
                        onChange={(e) =>
                          handleChange("occupation", e.target.value)
                        }
                        placeholder="לדוגמה: מורה, מהנדס תוכנה"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.occupation)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      שירות (צבאי/לאומי/אחר)
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        value={formData.serviceType || ""}
                        onValueChange={(value) =>
                          handleChange(
                            "serviceType",
                            (value as ServiceType) || undefined
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                          <SelectValue placeholder="בחר/י סוג שירות" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {serviceTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
<p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.serviceType,
                          serviceTypeOptions
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      פירוט על השירות
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        value={formData.serviceDetails || ""}
                        onChange={(e) =>
                          handleChange("serviceDetails", e.target.value)
                        }
                        placeholder="חיל, יחידה, תפקיד, שם ישיבה/מכינה"
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.serviceDetails)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50/40 to-yellow-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Smile className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  תכונות אופי ותחביבים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label className="block mb-2 text-sm font-medium text-gray-700">
                    תכונות אופי בולטות (עד 3)
                  </Label>
                  {isEditing && !viewOnly ? (
                    <div className="flex flex-wrap gap-2">
                      {characterTraitsOptions.map((trait) => (
                        <Button
                          key={trait.value}
                          type="button"
                          variant={
                            (formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectToggle(
                              "profileCharacterTraits",
                              trait.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.profileCharacterTraits || []).length >=
                            3 &&
                            !(formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {trait.icon && (
                            <trait.icon className="w-3.5 h-3.5 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                          )}
                          {trait.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.profileCharacterTraits,
                        characterTraitsOptions,
                        "לא נבחרו תכונות אופי."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-sm font-medium text-gray-700">
                    תחביבים עיקריים (עד 3)
                  </Label>
                  {isEditing && !viewOnly ? (
                    <div className="flex flex-wrap gap-2">
                      {hobbiesOptions.map((hobby) => (
                        <Button
                          key={hobby.value}
                          type="button"
                          variant={
                            (formData.profileHobbies || []).includes(
                              hobby.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectToggle(
                              "profileHobbies",
                              hobby.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.profileHobbies || []).length >= 3 &&
                            !(formData.profileHobbies || []).includes(
                              hobby.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.profileHobbies || []).includes(
                              hobby.value
                            )
                              ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {hobby.icon && (
                            <hobby.icon className="w-3.5 h-3.5 ml-1.5 rtl:mr-1.5 rtl:ml-0" />
                          )}
                          {hobby.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.profileHobbies,
                        hobbiesOptions,
                        "לא נבחרו תחביבים."
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buttons - only show on mobile when editing */}
      {isEditing && !viewOnly && (
        <div className="sticky bottom-0 z-20 mt-4 border-t border-gray-200 bg-white/90 p-4 backdrop-blur-md shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.15)] sm:hidden">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              <X className="w-4 h-4 ml-1.5" />
              ביטול
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
            >
              <Save className="w-4 h-4 ml-1.5" />
              שמירת שינויים
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;