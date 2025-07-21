// src/app/(authenticated)/profile/components/dashboard/PreferencesSection.tsx
"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Save,
  X,
  FileText, // Icon for General Description
  SlidersHorizontal, // Icon for Age/Height
  MapPin, // Icon for Location/Religious (expanded)
  GraduationCap, // Icon for Education/Occupation (expanded)
  Users, // Icon for Family/Personal Background (new)
  Sparkles, // Icon for Character/Hobbies (new)
  Heart, // For shomer negiah, children etc.
  Briefcase, // For service type
  Shield, // Could be for traits
  Palette, // Could be for hobbies
  Smile, // Could be for traits
} from "lucide-react";
import { UserProfile } from "@/types/next-auth";
import { cn } from "@/lib/utils";
import {
  Gender,
  ServiceType,
  HeadCoveringType,
  KippahType,
} from "@prisma/client";
interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
}

// --- Options for existing multi-select fields ---
const locationOptions = [
  { value: "צפון", label: "צפון" },
  { value: "מרכז", label: "מרכז" },
  { value: "דרום", label: "דרום" },
  { value: "ירושלים", label: "ירושלים" },
  { value: "יהודה ושומרון", label: "יהודה ושומרון" },
  { value: 'חו"ל', label: 'חו"ל' },
];

// רמות דתיות מתוקנות ל-PreferencesSection.tsx
// החלף את religiousLevelOptions הקיים בזה:

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
  { value: "לא משנה", label: "ללא העדפה / גמיש" }, // האפשרות הייחודית לעדפות
];

const educationPreferenceOptions = [
  { value: "תיכונית", label: "תיכונית" },
  { value: "על תיכונית", label: "על תיכונית" },
  { value: "אקדמית", label: "אקדמית" },
  { value: "תורנית", label: "תורנית" },
  { value: "ללא העדפה", label: "ללא העדפה" },
];

const occupationPreferenceOptions = [
  { value: "עובד/ת", label: "עובד/ת" },
  { value: "סטודנט/ית", label: "סטודנט/ית" },
  { value: "אברך/כולל", label: "אברך/כולל" },
  { value: "עצמאי/ת", label: "עצמאי/ת" },
  { value: "שירות צבאי/לאומי", label: "שירות צבאי/לאומי" },
  { value: "ללא העדפה", label: "ללא העדפה" },
];

// --- Options for NEW fields ---
const preferredShomerNegiahOptions = [
  { value: "yes", label: "כן, חשוב לי" },
  { value: "no", label: "לא, אין העדפה" }, // Or "לא, לא רלוונטי"
  { value: "flexible", label: "גמיש/תלוי באדם" },
];

const preferredPartnerHasChildrenOptions = [
  { value: "yes_ok", label: "כן, זה בסדר גמור" },
  { value: "no_preferred", label: "מעדיפ/ה שלא יהיו" },
  { value: "does_not_matter", label: "לא משנה לי" },
];

const preferredOriginOptions = [
  { value: "ashkenazi", label: "אשכנזי/ה" },
  { value: "sephardi", label: "ספרדי/ה" },
  { value: "mizrachi", label: "מזרחי/ה" },
  { value: "temani", label: "תימני/ה" },
  { value: "mixed", label: "מעורב/ת" },
  { value: "ethiopian", label: "אתיופי/ה" },
  { value: "american", label: "אמריקאי/ה" },
  { value: "european", label: "אירופאי/ה" },
  { value: "russian_speaking", label: "ממדינות דוברות רוסית" },
  { value: "french_speaking", label: "ממדינות דוברות צרפתית" },
  { value: "south_american", label: "דרום אמריקאי/ה" },
  { value: "other", label: "אחר" },
  { value: "no_preference", label: "ללא העדפה מיוחדת" },
];

const preferredAliyaStatusOptions = [
  { value: "oleh", label: "עולה חדש/ה" },
  { value: "tzabar", label: "צבר/ית" },
  { value: "no_preference", label: "ללא העדפה" },
];

// Options copied/adapted from ProfileSection.tsx (or similar source)
const maritalStatusOptions = [
  // For preferredMaritalStatuses
  { value: "single", label: "רווק/ה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
  { value: "annulled", label: "נישואין שבוטלו" },
  { value: "any", label: "כל האפשרויות פתוחות" },
];

const serviceTypeOptions = [
  // For preferredServiceTypes
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
    label: "ישיבה גבוהה / מדרשה (ללא שירות)",
  },
  {
    value: ServiceType.PRE_MILITARY_ACADEMY_AND_SERVICE,
    label: "מכינה קדם-צבאית ושירות",
  },
  { value: ServiceType.EXEMPTED, label: "פטור משירות" },
  { value: ServiceType.CIVILIAN_SERVICE, label: "שירות אזרחי" },
  { value: ServiceType.OTHER, label: "אחר / לא רלוונטי" },
  { value: "no_preference", label: "ללא העדפה / לא משנה" },
];

const headCoveringOptions = [
  // For preferredHeadCoverings (if user is Male)
  { value: HeadCoveringType.FULL_COVERAGE, label: "כיסוי ראש מלא" },
  { value: HeadCoveringType.PARTIAL_COVERAGE, label: "כיסוי ראש חלקי" },
  { value: HeadCoveringType.HAT_BERET, label: "כובע / ברט" },
  {
    value: HeadCoveringType.SCARF_ONLY_SOMETIMES,
    label: "מטפחת (רק באירועים/בית כנסת)",
  },
  { value: HeadCoveringType.NONE, label: "ללא כיסוי ראש" },
  { value: "any", label: "כל האפשרויות פתוחות" },
];

const kippahTypeOptions = [
  // For preferredKippahTypes (if user is Female)
  { value: KippahType.BLACK_VELVET, label: "קטיפה שחורה" },
  { value: KippahType.KNITTED_SMALL, label: "סרוגה קטנה" },
  { value: KippahType.KNITTED_LARGE, label: "סרוגה גדולה" },
  { value: KippahType.CLOTH, label: "בד" },
  { value: KippahType.BRESLEV, label: "ברסלב (לבנה גדולה)" },
  { value: KippahType.NONE_AT_WORK_OR_CASUAL, label: "לא בעבודה / ביומיום" },
  { value: KippahType.NONE_USUALLY, label: "לרוב לא חובש" },
  { value: KippahType.OTHER, label: "אחר" },
  { value: "any", label: "כל האפשרויות פתוחות" },
];

const characterTraitsOptions = [
  // For preferredCharacterTraits
  { value: "empathetic", label: "אמפתי/ת", icon: Heart },
  { value: "driven", label: "שאפתן/ית", icon: Briefcase },
  { value: "optimistic", label: "אופטימי/ת", icon: Smile },
  { value: "family_oriented", label: "משפחתי/ת", icon: Users },
  { value: "intellectual", label: "אינטלקטואל/ית", icon: GraduationCap },
  { value: "organized", label: "מאורגנ/ת", icon: Palette },
  { value: "calm", label: "רגוע/ה", icon: Heart },
  { value: "humorous", label: "בעל/ת חוש הומור", icon: Smile },
  { value: "sociable", label: "חברותי/ת", icon: Users },
  { value: "sensitive", label: "רגיש/ה", icon: Heart },
  { value: "independent", label: "עצמאי/ת", icon: MapPin }, // Icon might need adjustment
  { value: "creative", label: "יצירתי/ת", icon: Palette },
  { value: "honest", label: "כן/ה וישר/ה", icon: Shield },
  { value: "responsible", label: "אחראי/ת", icon: Shield },
  { value: "easy_going", label: "זורם/ת וקליל/ה", icon: Smile },
  { value: "no_strong_preference", label: "ללא העדפה חזקה", icon: Sparkles },
];

const hobbiesOptions = [
  // For preferredHobbies
  { value: "travel", label: "טיולים", icon: MapPin },
  { value: "sports", label: "ספורט", icon: Briefcase }, // Icon might need adjustment
  { value: "reading", label: "קריאה", icon: GraduationCap },
  { value: "cooking_baking", label: "בישול/אפיה", icon: Palette },
  { value: "music_playing_instrument", label: "מוזיקה/נגינה", icon: Palette }, // Icon might need adjustment
  { value: "art_crafts", label: "אומנות/יצירה", icon: Palette },
  { value: "volunteering", label: "התנדבות", icon: Heart },
  { value: "learning_courses", label: "למידה/קורסים", icon: GraduationCap },
  { value: "board_games_puzzles", label: "משחקי קופסא/פאזלים", icon: Smile },
  { value: "movies_theater", label: "סרטים/תיאטרון", icon: Smile },
  { value: "dancing", label: "ריקוד", icon: Users },
  { value: "writing", label: "כתיבה", icon: GraduationCap },
  { value: "nature_hiking", label: "טבע/טיולים רגליים", icon: MapPin },
  { value: "photography", label: "צילום", icon: Palette },
  { value: "no_strong_preference", label: "ללא העדפה חזקה", icon: Sparkles },
];

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  profile,
  isEditing,
  viewOnly = false,
  setIsEditing,
  onChange,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (profile) {
      const nullToUndefined = <T,>(value: T | null): T | undefined =>
        value === null ? undefined : value;

      const newFormData: Partial<UserProfile> = {
        ...profile,
        // Numeric fields
        preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
        preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
        preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
        preferredHeightMax: nullToUndefined(profile.preferredHeightMax),

        // String fields
        matchingNotes: profile.matchingNotes ?? "",
        contactPreference: nullToUndefined(profile.contactPreference),
        preferredShomerNegiah: nullToUndefined(profile.preferredShomerNegiah),
        preferredPartnerHasChildren: nullToUndefined(
          profile.preferredPartnerHasChildren
        ),
        preferredAliyaStatus: nullToUndefined(profile.preferredAliyaStatus),

        // Array fields
        preferredLocations: profile.preferredLocations ?? [],
        preferredReligiousLevels: profile.preferredReligiousLevels ?? [],
        preferredEducation: profile.preferredEducation ?? [],
        preferredOccupations: profile.preferredOccupations ?? [],
        preferredMaritalStatuses: profile.preferredMaritalStatuses ?? [],
        preferredOrigins: profile.preferredOrigins ?? [],
        preferredServiceTypes: profile.preferredServiceTypes ?? [],
        preferredHeadCoverings: profile.preferredHeadCoverings ?? [],
        preferredKippahTypes: profile.preferredKippahTypes ?? [],
        preferredCharacterTraits: profile.preferredCharacterTraits ?? [],
        preferredHobbies: profile.preferredHobbies ?? [],
      };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [profile]);

  useEffect(() => {
    if (!isEditing && initialData) {
      // Check initialData to prevent reset before it's set
      setFormData(initialData);
    }
  }, [isEditing, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const field = name as keyof UserProfile;

    setFormData((prev) => {
      let processedValue: string | number | undefined;
      if (type === "number") {
        const num = parseInt(value, 10);
        processedValue = isNaN(num) ? undefined : num;
      } else {
        processedValue = value === "" ? undefined : value; // Treat empty string as undefined for optional fields
      }
      return { ...prev, [field]: processedValue };
    });
  };

  const handleSelectChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        value === "" ||
        value === "לא_משנה" ||
        value === "any" ||
        value === "no_preference"
          ? undefined
          : (value as UserProfile[typeof field]),
    }));
  };

  const handleMultiSelectChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => {
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      let newValues;
      if (
        value === "any" ||
        value === "no_preference" ||
        value === "לא_משנה" ||
        value === "no_strong_preference"
      ) {
        newValues = currentValues.includes(value) ? [] : [value]; // Select "any" deselects others, or selects only "any"
      } else {
        // Remove "any" or "no_preference" if another specific option is selected
        const filteredValues = currentValues.filter(
          (v) =>
            v !== "any" &&
            v !== "no_preference" &&
            v !== "לא_משנה" &&
            v !== "no_strong_preference"
        );
        newValues = filteredValues.includes(value)
          ? filteredValues.filter((v) => v !== value)
          : [...filteredValues, value];
      }
      return { ...prev, [field]: newValues };
    });
  };

  const handleSave = () => {
    // Filter out empty strings from array fields before saving, if desired
    const dataToSave = { ...formData };
    // Example: dataToSave.preferredLocations = dataToSave.preferredLocations?.filter(loc => loc !== "");
    onChange(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  const renderMultiSelectBadges = (
    fieldValues: string[] | undefined | null,
    options: { value: string; label: string; icon?: React.ElementType }[],
    badgeClass: string = "bg-sky-100 text-sky-700",
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
          className={cn(
            "mr-1 mb-1 text-xs px-2 py-0.5 rounded-full flex items-center",
            badgeClass
          )}
        >
          {option.icon && <option.icon className="w-3 h-3 rtl:ml-1 mr-1" />}
          {option.label}
        </Badge>
      ) : null;
    });
  };

  const getSelectDisplayValue = (
    value: string | undefined | null,
    options: { value: string; label: string }[],
    placeholder: string = "לא צוין."
  ) => {
    if (!value)
      return <span className="text-gray-500 italic">{placeholder}</span>;
    const option = options.find((opt) => opt.value === value);
    return option ? (
      option.label
    ) : (
      <span className="text-gray-500 italic">{placeholder}</span>
    );
  };

  return (
    <div className="relative" dir="rtl">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                העדפות התאמה
              </h1>
              <p className="text-sm text-slate-500">
                {isEditing && !viewOnly
                  ? "ערוך/י את העדפותיך למציאת התאמה."
                  : "העדפות שהוגדרו לחיפוש התאמה."}
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

      <div className="container mx-auto max-w-screen-xl py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- Column 1 --- */}
          <div className="space-y-6">
            {/* Card: General Description & Contact Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50/40 to-gray-100/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <FileText className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  תיאור כללי והעדפות קשר
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-5">
                <div>
              <div className="flex items-center gap-1.5">
    <Label htmlFor="matchingNotes" className="text-sm font-medium text-gray-700">
        תיאור כללי על המועמד/ת המבוקש/ת
    </Label>
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger type="button"><Info className="w-4 h-4 text-gray-400 hover:text-gray-600" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
                <p>זהו אחד השדות החשובים ביותר! תאר/י במילים שלך את סוג האדם שאת/ה מחפש/ת. התיאור הזה יעזור לשדכנים להבין את הראש שלך מעבר לנתונים היבשים.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</div>
                  {isEditing ? (
                    <Textarea
                      id="matchingNotes"
                      name="matchingNotes"
                      value={formData.matchingNotes || ""}
                      onChange={handleInputChange}
                      placeholder="פרט/י על סוג האדם שאת/ה מחפש/ת, תכונות חשובות, ציפיות וכו'..."
                      className="text-sm focus:ring-cyan-500 min-h-[100px] rounded-lg"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                      {formData.matchingNotes || (
                        <span className="text-gray-500 italic">
                          לא הוזן תיאור.
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="contactPreference"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    אופן יצירת קשר מועדף (לאחר אישור הצעה)
                  </Label>
                  {isEditing ? (
                    <Select
                      name="contactPreference"
                      value={formData.contactPreference || ""}
                      onValueChange={(value: string) =>
                        handleSelectChange("contactPreference", value)
                      }
                    >
                      <SelectTrigger
                        id="contactPreference"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue placeholder="בחר/י אפשרות..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">ישירות</SelectItem>
                        <SelectItem value="matchmaker">דרך השדכן/ית</SelectItem>
                        <SelectItem value="both">שתי האפשרויות</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.contactPreference,
                        [
                          { value: "direct", label: "ישירות" },
                          { value: "matchmaker", label: "דרך השדכן/ית" },
                          { value: "both", label: "שתי האפשרויות" },
                        ],
                        "לא צוין"
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Age & Height Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/40 to-purple-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <SlidersHorizontal className="w-5 h-5 text-indigo-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  העדפות גיל וגובה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                <div className="flex items-center gap-1.5">
    <Label className="text-xs font-medium text-gray-600">
      טווח גילאים מועדף
    </Label>
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger type="button"><Info className="w-4 h-4 text-gray-400 hover:text-gray-600" /></TooltipTrigger>
            <TooltipContent side="top">
                <p>הגדרת טווח גילאים רחב יותר תגדיל את כמות ההצעות שתקבל/י.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        name="preferredAgeMin"
                        placeholder="מגיל"
                        aria-label="גיל מינימלי מועדף"
                        value={formData.preferredAgeMin ?? ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="number"
                        name="preferredAgeMax"
                        placeholder="עד גיל"
                        aria-label="גיל מקסימלי מועדף"
                        value={formData.preferredAgeMax ?? ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                    </div>
                    {!isEditing &&
                      !formData.preferredAgeMin &&
                      !formData.preferredAgeMax && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          לא הוגדר טווח גילאים.
                        </p>
                      )}
                  </div>
                  <div>
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      טווח גבהים מועדף (סמ)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        name="preferredHeightMin"
                        placeholder="מ-"
                        aria-label="גובה מינימלי מועדף בסנטימטרים"
                        value={formData.preferredHeightMin ?? ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="number"
                        name="preferredHeightMax"
                        placeholder="עד-"
                        aria-label="גובה מקסימלי מועדף בסנטימטרים"
                        value={formData.preferredHeightMax ?? ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                    </div>
                    {!isEditing &&
                      !formData.preferredHeightMin &&
                      !formData.preferredHeightMax && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          לא הוגדר טווח גבהים.
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Column 2 --- */}
          <div className="space-y-6">
            {/* Card: Location, Religious & Lifestyle Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/40 to-blue-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-5 h-5 text-sky-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  מיקום, רמה דתית ואורח חיים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    אזורי מגורים מועדפים
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {locationOptions.map((loc) => (
                        <Button
                          key={loc.value}
                          type="button"
                          variant={
                            (formData.preferredLocations || []).includes(
                              loc.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredLocations",
                              loc.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredLocations || []).includes(
                              loc.value
                            )
                              ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {loc.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredLocations,
                        locationOptions,
                        "bg-sky-100 text-sky-700",
                        "לא נבחרו אזורי מגורים."
                      )}
                    </div>
                  )}
                </div>
                <div>
                 <div className="flex items-center gap-1.5">
    <Label className="text-xs font-medium text-gray-600">
      רמות דתיות מועדפות
    </Label>
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger type="button"><Info className="w-4 h-4 text-gray-400 hover:text-gray-600" /></TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
                <p>מומלץ לבחור 1-3 רמות שמתאימות לך. בחירה רחבה מדי עלולה להוביל להצעות פחות מדויקות.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</div>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {religiousLevelOptions.map((level) => (
                        <Button
                          key={level.value}
                          type="button"
                          variant={
                            (formData.preferredReligiousLevels || []).includes(
                              level.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredReligiousLevels",
                              level.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredReligiousLevels || []).includes(
                              level.value
                            )
                              ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredReligiousLevels,
                        religiousLevelOptions,
                        "bg-pink-100 text-pink-700",
                        "לא נבחרו רמות דתיות."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="preferredShomerNegiah"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    שמירת נגיעה אצל הצד השני
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredShomerNegiah"
                      value={formData.preferredShomerNegiah || ""}
                      onValueChange={(value) =>
                        handleSelectChange("preferredShomerNegiah", value)
                      }
                    >
                      <SelectTrigger
                        id="preferredShomerNegiah"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue placeholder="בחר/י העדפה..." />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredShomerNegiahOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredShomerNegiah,
                        preferredShomerNegiahOptions
                      )}
                    </p>
                  )}
                </div>
                {/* Conditional rendering for preferredHeadCoverings / preferredKippahTypes */}
                {profile?.gender === Gender.MALE && (
                  <div>
                    <Label className="block mb-2 text-xs font-medium text-gray-600">
                      העדפת כיסוי ראש לבת הזוג
                    </Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {headCoveringOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={
                              (formData.preferredHeadCoverings || []).includes(
                                opt.value as HeadCoveringType
                              )
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleMultiSelectChange(
                                "preferredHeadCoverings",
                                opt.value as HeadCoveringType
                              )
                            }
                            className={cn(
                              "rounded-full text-xs px-3 py-1.5 transition-all",
                              (formData.preferredHeadCoverings || []).includes(
                                opt.value as HeadCoveringType
                              )
                                ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                                : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {renderMultiSelectBadges(
                          formData.preferredHeadCoverings as string[],
                          headCoveringOptions,
                          "bg-purple-100 text-purple-700",
                          "לא נבחרו העדפות כיסוי ראש."
                        )}
                      </div>
                    )}
                  </div>
                )}
                {profile?.gender === Gender.FEMALE && (
                  <div>
                    <Label className="block mb-2 text-xs font-medium text-gray-600">
                      העדפת סוג כיפה לבן הזוג
                    </Label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {kippahTypeOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={
                              (formData.preferredKippahTypes || []).includes(
                                opt.value as KippahType
                              )
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleMultiSelectChange(
                                "preferredKippahTypes",
                                opt.value as KippahType
                              )
                            }
                            className={cn(
                              "rounded-full text-xs px-3 py-1.5 transition-all",
                              (formData.preferredKippahTypes || []).includes(
                                opt.value as KippahType
                              )
                                ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {renderMultiSelectBadges(
                          formData.preferredKippahTypes as string[],
                          kippahTypeOptions,
                          "bg-orange-100 text-orange-700",
                          "לא נבחרו העדפות סוג כיפה."
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card: Education, Occupation & Service Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50/40 to-green-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <GraduationCap className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  השכלה, תעסוקה ושירות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    רמות השכלה מועדפות
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {educationPreferenceOptions.map((edu) => (
                        <Button
                          key={edu.value}
                          type="button"
                          variant={
                            (formData.preferredEducation || []).includes(
                              edu.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredEducation",
                              edu.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredEducation || []).includes(
                              edu.value
                            )
                              ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {edu.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredEducation,
                        educationPreferenceOptions,
                        "bg-teal-100 text-teal-700",
                        "לא נבחרו רמות השכלה."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    תחומי עיסוק מועדפים
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {occupationPreferenceOptions.map((occ) => (
                        <Button
                          key={occ.value}
                          type="button"
                          variant={
                            (formData.preferredOccupations || []).includes(
                              occ.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredOccupations",
                              occ.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredOccupations || []).includes(
                              occ.value
                            )
                              ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {occ.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredOccupations,
                        occupationPreferenceOptions,
                        "bg-green-100 text-green-700",
                        "לא נבחרו תחומי עיסוק."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    סוג שירות מועדף (צבאי/לאומי)
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {serviceTypeOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredServiceTypes || []).includes(
                              opt.value as ServiceType
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredServiceTypes",
                              opt.value as ServiceType
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredServiceTypes || []).includes(
                              opt.value as ServiceType
                            )
                              ? "bg-lime-500 hover:bg-lime-600 text-white border-lime-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredServiceTypes as string[],
                        serviceTypeOptions,
                        "bg-lime-100 text-lime-700",
                        "לא נבחרו העדפות שירות."
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Column 3 --- */}
          <div className="space-y-6">
            {/* Card: Personal & Family Background Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-50/40 to-fuchsia-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-rose-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  רקע אישי ומשפחתי
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    מצב משפחתי מועדף
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {maritalStatusOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredMaritalStatuses || []).includes(
                              opt.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredMaritalStatuses",
                              opt.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredMaritalStatuses || []).includes(
                              opt.value
                            )
                              ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredMaritalStatuses,
                        maritalStatusOptions,
                        "bg-rose-100 text-rose-700",
                        "לא נבחרו העדפות למצב משפחתי."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="preferredPartnerHasChildren"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    העדפה לגבי ילדים מקשר קודם
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredPartnerHasChildren"
                      value={formData.preferredPartnerHasChildren || ""}
                      onValueChange={(value) =>
                        handleSelectChange("preferredPartnerHasChildren", value)
                      }
                    >
                      <SelectTrigger
                        id="preferredPartnerHasChildren"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue placeholder="בחר/י העדפה..." />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredPartnerHasChildrenOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredPartnerHasChildren,
                        preferredPartnerHasChildrenOptions
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    מוצא/עדה מועדפים
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {preferredOriginOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredOrigins || []).includes(
                              opt.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredOrigins",
                              opt.value
                            )
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all",
                            (formData.preferredOrigins || []).includes(
                              opt.value
                            )
                              ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-fuchsia-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredOrigins,
                        preferredOriginOptions,
                        "bg-fuchsia-100 text-fuchsia-700",
                        "לא נבחרו העדפות מוצא/עדה."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="preferredAliyaStatus"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    העדפת סטטוס עליה
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredAliyaStatus"
                      value={formData.preferredAliyaStatus || ""}
                      onValueChange={(value) =>
                        handleSelectChange("preferredAliyaStatus", value)
                      }
                    >
                      <SelectTrigger
                        id="preferredAliyaStatus"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue placeholder="בחר/י העדפה..." />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredAliyaStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredAliyaStatus,
                        preferredAliyaStatusOptions
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Character & Hobbies Preferences */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50/40 to-yellow-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  אופי ותחומי עניין
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    תכונות אופי מועדפות (עד 3)
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {characterTraitsOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredCharacterTraits || []).includes(
                              opt.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredCharacterTraits",
                              opt.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.preferredCharacterTraits || []).length >=
                              3 &&
                            !(formData.preferredCharacterTraits || []).includes(
                              opt.value
                            ) &&
                            opt.value !== "no_strong_preference"
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all flex items-center",
                            (formData.preferredCharacterTraits || []).includes(
                              opt.value
                            )
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {opt.icon && (
                            <opt.icon className="w-3.5 h-3.5 rtl:ml-1.5 mr-1.5" />
                          )}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredCharacterTraits,
                        characterTraitsOptions,
                        "bg-yellow-100 text-yellow-700",
                        "לא נבחרו תכונות אופי מועדפות."
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    תחביבים מועדפים (עד 3)
                  </Label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {hobbiesOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredHobbies || []).includes(
                              opt.value
                            )
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              "preferredHobbies",
                              opt.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.preferredHobbies || []).length >= 3 &&
                            !(formData.preferredHobbies || []).includes(
                              opt.value
                            ) &&
                            opt.value !== "no_strong_preference"
                          }
                          className={cn(
                            "rounded-full text-xs px-3 py-1.5 transition-all flex items-center",
                            (formData.preferredHobbies || []).includes(
                              opt.value
                            )
                              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                          )}
                        >
                          {opt.icon && (
                            <opt.icon className="w-3.5 h-3.5 rtl:ml-1.5 mr-1.5" />
                          )}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredHobbies,
                        hobbiesOptions,
                        "bg-amber-100 text-amber-700",
                        "לא נבחרו תחביבים מועדפים."
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;
