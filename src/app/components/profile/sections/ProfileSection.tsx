"use client";

import React, { useState, useEffect } from "react";
import {
  Gender,
  AvailabilityStatus,
  ServiceType,
  HeadCoveringType,
  KippahType,
} from "@prisma/client"; // הוספת Enums חדשים
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
import { Checkbox } from "@/components/ui/checkbox"; // לשימוש עבור שדות boolean
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
} from "lucide-react";
import { UserProfile } from "@/types/next-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // לשימוש בתצוגת מערכים

const languageOptions = [
  { value: "hebrew", label: "עברית" },
  { value: "english", label: "אנגלית" },
  // ... (שאר השפות נשארו כפי שהיו)
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

const maritalStatusOptions = [
  { value: "single", label: "רווק/ה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
  { value: "annulled", label: "נישואין שבוטלו" }, // אופציה נוספת אם רלוונטי
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
  // לנשים
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
  // לגברים
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
  { value: "organized", label: "מאורגנ/ת", icon: Palette }, // שיניתי אייקון
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
  { value: "sports", label: "ספורט", icon: Briefcase }, // אייקון גנרי
  { value: "reading", label: "קריאה", icon: BookOpen },
  { value: "cooking_baking", label: "בישול/אפיה", icon: Palette },
  { value: "music_playing_instrument", label: "מוזיקה/נגינה", icon: Languages }, // אייקון שונה
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
  profile: profileProp, // שינוי שם כדי למנוע התנגשות עם משתנה פנימי
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
}) => {
  console.log(
    "ProfileSection received profileProp:",
    JSON.stringify(profileProp, null, 2)
  ); // <--- בדוק כאן

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
      occupation: profileData?.occupation || "", // ברירת מחדל למחרוזת ריקה אם null
      education: profileData?.education || "", // ברירת מחדל למחרוזת ריקה
      educationLevel: profileData?.educationLevel || undefined,
      city: profileData?.city || "", // ברירת מחדל למחרוזת ריקה
      origin: profileData?.origin || "", // ברירת מחדל למחרוזת ריקה
      religiousLevel: profileData?.religiousLevel || undefined,
      about: profileData?.about || "", // ברירת מחדל למחרוזת ריקה
      parentStatus: profileData?.parentStatus || undefined,
      siblings: profileData?.siblings ?? undefined,
      position: profileData?.position ?? undefined,
      isProfileVisible: profileData?.isProfileVisible ?? true,
      preferredMatchmakerGender:
        profileData?.preferredMatchmakerGender || undefined,
      availabilityStatus:
        profileData?.availabilityStatus || AvailabilityStatus.AVAILABLE,
      availabilityNote: profileData?.availabilityNote || "", // ברירת מחדル למחרוזת ריקה
      availabilityUpdatedAt: ensureDateObject(
        profileData?.availabilityUpdatedAt
      ),
      matchingNotes: profileData?.matchingNotes || "", // ברירת מחדל למחרוזת ריקה

      // שדות חדשים
      shomerNegiah: profileData?.shomerNegiah ?? undefined, // חשוב לטפל ב-undefined
      serviceType: profileData?.serviceType || undefined,
      serviceDetails: profileData?.serviceDetails || "", // ברירת מחדל למחרוזת ריקה
      headCovering: profileData?.headCovering || undefined,
      kippahType: profileData?.kippahType || undefined,
      hasChildrenFromPrevious:
        profileData?.hasChildrenFromPrevious ?? undefined,
      profileCharacterTraits: profileData?.profileCharacterTraits || [],
      profileHobbies: profileData?.profileHobbies || [],
      aliyaCountry: profileData?.aliyaCountry || "", // ברירת מחדל למחרוזת ריקה
      aliyaYear: profileData?.aliyaYear ?? undefined,

      // שדות קיימים שערכי ברירת מחדל שלהם צריכים להיות מוגדרים
      preferredAgeMin: profileData?.preferredAgeMin ?? undefined,
      preferredAgeMax: profileData?.preferredAgeMax ?? undefined,
      preferredHeightMin: profileData?.preferredHeightMin ?? undefined,
      preferredHeightMax: profileData?.preferredHeightMax ?? undefined,
      preferredReligiousLevels: profileData?.preferredReligiousLevels || [],
      preferredLocations: profileData?.preferredLocations || [],
      preferredEducation: profileData?.preferredEducation || [],
      preferredOccupations: profileData?.preferredOccupations || [],
      contactPreference: profileData?.contactPreference || undefined,

      // שדות טכניים שאינם נערכים ישירות אך נשמרים
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
      // אם אין profileProp, אולי תרצה לקרוא מה-API כפי שעשית קודם
      // לצורך הדוגמה כאן, אם אין profileProp, נאתחל עם אובייקט ריק יותר
      const fetchProfileAndInitialize = async () => {
        try {
          const response = await fetch("/api/profile"); // ודא שהנתיב נכון
          if (!response.ok) throw new Error("Failed to fetch profile");
          const data = await response.json();
          if (data.success && data.profile) {
            console.log(
              "Fetched profile data:",
              JSON.stringify(data.profile, null, 2)
            ); // <--- בדוק כאן

            initializeFormData(data.profile);
          } else {
            initializeFormData(null); // או אובייקט ריק עם ברירות מחדל
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileProp]);

  useEffect(() => {
    // אפקט זה נועד לאתחל מחדש את הטופס אם המצב עריכה מתבטל מבחוץ
    // והנתונים בפרופ המקורי (profileProp) השתנו מאז הכניסה למצב עריכה.
    // זה יכול לקרות פחות במבנה הנוכחי אבל טוב שיהיה.
    if (!isEditing && profileProp) {
      // משווה את ה-formData הנוכחי עם מה שהיה אמור להיות ה-initialData
      // אם הם שונים, זה אומר שהיו שינויים שלא נשמרו והמשתמש יצא ממצב עריכה
      // ואז כדאי לאפס ל-profileProp המעודכן.
      // עם זאת, הלוגיקה ב-handleCancel כבר עושה זאת ל-initialData.
      // השארתי את הלוגיקה של אתחול כאן למקרה שה-profileProp משתנה באופן אסינכרוני
      // בזמן שהמשתמש לא במצב עריכה.
      // כאן אפשר לבצע את ההמרות כמו ב-initializeFormData אם יש צורך
      // ולהשוות עם ה-formData. אם שונה, לאפס.
      // כרגע, הלוגיקה של initializeFormData תטפל בזה ב-useEffect הראשון.
    }
  }, [isEditing, profileProp]);

  const handleChange = (
    field: keyof UserProfile,
    value:
      | UserProfile[keyof UserProfile]
      | string
      | number
      | boolean
      | Date
      | string[]
      | null // מכסה את רוב הערכים הישירים
  ) => {
    setFormData((prev) => {
      let finalValue: UserProfile[keyof UserProfile] | undefined = undefined;

      // טיפול מיוחד לשדות מספריים
      if (
        field === "height" ||
        field === "siblings" ||
        field === "position" ||
        field === "aliyaYear"
      ) {
        const rawValue = value as string | number; // יכול להגיע כמספר או כמחרוזת מ-input
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          finalValue = undefined;
        } else {
          const parsed = parseInt(String(rawValue), 10); // המר למחרוזת לפני parseInt לבטיחות
          finalValue = !isNaN(parsed)
            ? (parsed as UserProfile[typeof field])
            : undefined;
        }
      } else if (field === "birthDate") {
        finalValue = ensureDateObject(
          value as string | Date | null | undefined
        ) as UserProfile[typeof field];
      } else if (typeof prev[field] === "boolean") {
        // טיפול ב-checkbox
        finalValue = value as boolean as UserProfile[typeof field];
      } else if (Array.isArray(prev[field])) {
        finalValue = value as string[] as UserProfile[typeof field]; // אם זה מערך ישירות
      } else if (value === "" || value === null) {
        // עבור שדות טקסט, אם הריק הוא undefined או null
        const nullableStringFields: (keyof UserProfile)[] = [
          "nativeLanguage",
          "occupation",
          "education",
          "city",
          "origin",
          "religiousLevel",
          "about",
          "parentStatus",
          "serviceDetails",
          "aliyaCountry",
          "availabilityNote",
          "matchingNotes",
          "educationLevel",
          "maritalStatus",
          "serviceType", // שדות Select יכולים להגיע כ-""
          "headCovering",
          "kippahType",
          "preferredMatchmakerGender",
          "contactPreference",
        ];
        if (nullableStringFields.includes(field as keyof UserProfile)) {
          finalValue = undefined;
        } else {
          finalValue = value as UserProfile[typeof field]; // אם זה לא nullable string, נשאר ""
        }
      } else {
        // לשאר המקרים, הערך כפי שהוא (או המרה קלה אם צריך)
        finalValue = value as UserProfile[typeof field];
      }

      return {
        ...prev,
        [field]: finalValue,
      };
    });
  };

  // בקוד ה-JSX:
  // <Input onChange={handleDomInputChange} name="occupation" ... />
  // <Select onValueChange={(val) => handleChange("gender", val as Gender)} ... />
  // <Checkbox onCheckedChange={(checked) => handleChange("shomerNegiah", checked as boolean)} ... />
  // <Input type="date" onChange={(e) => handleChange("birthDate", e.target.value)} ... />

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
    // כאן אפשר להוסיף לוגיקה להמרת ערכים ריקים ל-null אם השרת דורש זאת
    const dataToSave = { ...formData };
    // לדוגמה:
    // Object.keys(dataToSave).forEach(key => {
    //   if (dataToSave[key as keyof UserProfile] === "") {
    //     dataToSave[key as keyof UserProfile] = null;
    //   }
    // });
    onSave(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave); // עדכון ה-initialData למצב השמור
  };

  const handleCancel = () => {
    setFormData(initialData); // חזרה לנתונים ההתחלתיים של העריכה הנוכחית או לנתונים המקוריים
    setIsEditing(false);
  };

  if (loading) {
    return <div className="text-center p-4">טוען נתוני פרופיל...</div>;
  }

  const renderMultiSelectBadges = (
    fieldValues: string[] | undefined,
    options: { value: string; label: string; icon?: React.ElementType }[]
  ) => {
    if (!fieldValues || fieldValues.length === 0) return null;
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
      {/* Header and Edit/Save Buttons - copied from your original with minor adjustments */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-800">
                פרופיל אישי
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                כאן תוכל/י לערוך את פרטי הפרופיל שלך.
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
        {/* --- כרטיס פרטים אישיים ודמוגרפיים --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50/30 to-pink-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              פרטים אישיים ודמוגרפיים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מגדר
                </Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) =>
                    handleChange("gender", value as Gender)
                  }
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר/י מגדר" />
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
                  onChange={(e) =>
                    handleChange("birthDate", e.target.value || undefined)
                  }
                  disabled={!isEditing || viewOnly}
                  className="h-9 text-xs focus:ring-cyan-500"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  גובה (סמ)
                </Label>
                <Input
                  type="number"
                  value={formData.height ?? ""}
                  onChange={(e) => handleChange("height", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="גובה בסמ"
                  min="100"
                  max="250"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  עיר מגורים
                </Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: ירושלים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מוצא / עדה
                </Label>
                <Input
                  value={formData.origin || ""}
                  onChange={(e) => handleChange("origin", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: אשכנזי, ספרדי, מעורב"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  עלה/תה לארץ
                </Label>
                <Input
                  value={formData.aliyaCountry || ""}
                  onChange={(e) => handleChange("aliyaCountry", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="אם רלוונטי, מאיזו מדינה?"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  שנת עליה
                </Label>
                <Input
                  type="number"
                  value={formData.aliyaYear ?? ""}
                  onChange={(e) => handleChange("aliyaYear", e.target.value)}
                  disabled={!isEditing || viewOnly || !formData.aliyaCountry}
                  placeholder="אם רלוונטי"
                  className="h-9 text-xs focus:ring-cyan-500"
                  min="1900"
                  max={new Date().getFullYear()}
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
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
                    <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                      <SelectValue placeholder="הוסף/י שפה..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {languageOptions
                        .filter(
                          (lang) =>
                            !(formData.additionalLanguages || []).includes(
                              lang.value
                            )
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
                        className="bg-cyan-100/60 text-cyan-800 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center"
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
                  {!isEditing &&
                    (!formData.additionalLanguages ||
                      formData.additionalLanguages.length === 0) && (
                      <p className="text-xs text-gray-500 italic">
                        לא צוינו שפות נוספות.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- כרטיס מצב משפחתי ורקע --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50/30 to-indigo-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              מצב משפחתי ורקע
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מצב משפחתי
                </Label>
                <Select
                  value={formData.maritalStatus || ""}
                  onValueChange={(value) =>
                    handleChange("maritalStatus", value || undefined)
                  }
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
              </div>
              {(formData.maritalStatus === "divorced" ||
                formData.maritalStatus === "widowed" ||
                formData.maritalStatus === "annulled") && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-4">
                  <Checkbox
                    id="hasChildrenFromPrevious"
                    checked={formData.hasChildrenFromPrevious || false}
                    onCheckedChange={(checked) =>
                      handleChange(
                        "hasChildrenFromPrevious",
                        checked as boolean
                      )
                    }
                    disabled={!isEditing || viewOnly}
                  />
                  <Label
                    htmlFor="hasChildrenFromPrevious"
                    className="text-xs font-medium text-gray-600 whitespace-nowrap"
                  >
                    יש ילדים מקשר קודם?
                  </Label>
                </div>
              )}
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מצב הורים
                </Label>
                <Input
                  value={formData.parentStatus || ""}
                  onChange={(e) => handleChange("parentStatus", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: נשואים, גרושים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מספר אחים/אחיות
                </Label>
                <Input
                  type="number"
                  value={formData.siblings ?? ""}
                  onChange={(e) => handleChange("siblings", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="כולל אותך"
                  min="0"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  מיקום במשפחה (מתוך האחים)
                </Label>
                <Input
                  type="number"
                  value={formData.position ?? ""}
                  onChange={(e) => handleChange("position", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  className="h-9 text-xs focus:ring-cyan-500"
                  placeholder="לדוגמה: 1 (בכור/ה)"
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- כרטיס השכלה, עיסוק ושירות --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50/30 to-green-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              השכלה, עיסוק ושירות
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  רמת השכלה
                </Label>
                <Select
                  value={formData.educationLevel || ""}
                  onValueChange={(value) =>
                    handleChange("educationLevel", value || undefined)
                  }
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
              </div>
              <div className="sm:col-span-2">
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  פירוט השכלה (מוסד, תחום)
                </Label>
                <Input
                  value={formData.education || ""}
                  onChange={(e) => handleChange("education", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: אוני' בר אילן, משפטים"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div className="lg:col-span-3">
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  עיסוק נוכחי
                </Label>
                <Input
                  value={formData.occupation || ""}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: מורה, מהנדס תוכנה"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  שירות (צבאי/לאומי/אחר)
                </Label>
                <Select
                  value={formData.serviceType || ""}
                  onValueChange={(value) =>
                    handleChange(
                      "serviceType",
                      (value as ServiceType) || undefined
                    )
                  }
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
              </div>
              <div className="sm:col-span-2">
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  פירוט על השירות (חיל, יחידה, תפקיד, שם ישיבה/מכינה)
                </Label>
                <Input
                  value={formData.serviceDetails || ""}
                  onChange={(e) =>
                    handleChange("serviceDetails", e.target.value)
                  }
                  disabled={!isEditing || viewOnly}
                  placeholder="לדוגמה: גולני, מורה חיילת, ישיבת הר עציון"
                  className="h-9 text-xs focus:ring-cyan-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- כרטיס דת ואורח חיים --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50/30 to-amber-50/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              דת ואורח חיים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                  רמה דתית
                </Label>
                <Select
                  value={formData.religiousLevel || ""}
                  onValueChange={(value) =>
                    handleChange("religiousLevel", value || undefined)
                  }
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-4">
                <Checkbox
                  id="shomerNegiah"
                  checked={formData.shomerNegiah || false}
                  onCheckedChange={(checked) =>
                    handleChange("shomerNegiah", checked as boolean)
                  }
                  disabled={!isEditing || viewOnly}
                />
                <Label
                  htmlFor="shomerNegiah"
                  className="text-xs font-medium text-gray-600 whitespace-nowrap"
                >
                  שומר/ת נגיעה?
                </Label>
              </div>
              {formData.gender === Gender.FEMALE && (
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    כיסוי ראש
                  </Label>
                  <Select
                    value={formData.headCovering || ""}
                    onValueChange={(value) =>
                      handleChange(
                        "headCovering",
                        (value as HeadCoveringType) || undefined
                      )
                    }
                    disabled={!isEditing || viewOnly}
                  >
                    <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
                </div>
              )}
              {formData.gender === Gender.MALE && (
                <div>
                  <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                    סוג כיפה
                  </Label>
                  <Select
                    value={formData.kippahType || ""}
                    onValueChange={(value) =>
                      handleChange(
                        "kippahType",
                        (value as KippahType) || undefined
                      )
                    }
                    disabled={!isEditing || viewOnly}
                  >
                    <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
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
                </div>
              )}
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
                  disabled={!isEditing || viewOnly}
                >
                  <SelectTrigger className="h-9 text-xs focus:ring-cyan-500">
                    <SelectValue placeholder="בחר/י העדפה (לא חובה)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">משדך</SelectItem>
                    <SelectItem value="FEMALE">שדכנית</SelectItem>
                    <SelectItem value="NONE">ללא העדפה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- כרטיס תכונות אופי ותחביבים --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-50/30 to-rose-50/30 border-b border-gray-200/50 p-4">
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
                        (formData.profileCharacterTraits || []).length >= 3 &&
                        !(formData.profileCharacterTraits || []).includes(
                          trait.value
                        )
                      }
                      className={cn(
                        "rounded-full text-xs px-3 py-1 transition-all",
                        (formData.profileCharacterTraits || []).includes(
                          trait.value
                        )
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
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
                    characterTraitsOptions
                  )}
                  {(!formData.profileCharacterTraits ||
                    formData.profileCharacterTraits.length === 0) && (
                    <p className="text-xs text-gray-500 italic">
                      לא נבחרו תכונות אופי.
                    </p>
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
                        (formData.profileHobbies || []).includes(hobby.value)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleMultiSelectToggle("profileHobbies", hobby.value)
                      }
                      disabled={
                        (formData.profileHobbies || []).length >= 3 &&
                        !(formData.profileHobbies || []).includes(hobby.value)
                      }
                      className={cn(
                        "rounded-full text-xs px-3 py-1 transition-all",
                        (formData.profileHobbies || []).includes(hobby.value)
                          ? "bg-sky-500 hover:bg-sky-600 text-white"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
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
                    hobbiesOptions
                  )}
                  {(!formData.profileHobbies ||
                    formData.profileHobbies.length === 0) && (
                    <p className="text-xs text-gray-500 italic">
                      לא נבחרו תחביבים.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- כרטיס אודות ומידע נוסף --- */}
        <Card className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50/30 to-gray-100/30 border-b border-gray-200/50 p-4">
            <CardTitle className="text-base font-semibold text-gray-700">
              קצת עלי ומידע נוסף
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-5">
              <div>
                <Label className="block mb-1.5 text-sm font-medium text-gray-700">
                  ספר/י קצת על עצמך (תיאור חופשי)
                </Label>
                {isEditing && !viewOnly ? (
                  <Textarea
                    value={formData.about || ""}
                    onChange={(e) => handleChange("about", e.target.value)}
                    className="text-xs focus:ring-cyan-500 min-h-[100px] rounded-lg"
                    placeholder="תאר/י את עצמך, מה מאפיין אותך, מה חשוב לך..."
                    rows={4}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[40px] bg-gray-50/50 p-3 rounded-lg">
                    {formData.about || (
                      <span className="text-gray-400 italic">
                        לא הוזן תיאור אישי.
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <Label className="block mb-1.5 text-sm font-medium text-gray-700">
                  הערות נוספות לשדכן/ית (לא יוצג לצד השני)
                </Label>
                {isEditing && !viewOnly ? (
                  <Textarea
                    value={formData.matchingNotes || ""}
                    onChange={(e) =>
                      handleChange("matchingNotes", e.target.value)
                    }
                    className="text-xs focus:ring-cyan-500 min-h-[80px] rounded-lg"
                    placeholder="דברים נוספים שחשוב שהשדכן/ית יידעו עליך..."
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[40px] bg-gray-50/50 p-3 rounded-lg">
                    {formData.matchingNotes || (
                      <span className="text-gray-400 italic">
                        אין הערות נוספות לשדכן/ית.
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
