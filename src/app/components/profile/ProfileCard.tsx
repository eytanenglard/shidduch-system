// src/app/components/profile/ProfileCard.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// UI Components
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  User,
  Heart,
  FileText,
  Image as ImageIcon,
  Info as InfoIcon,
  Eye,
  Phone,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Users,
  BookOpen,
  School,
  Lock,
  Languages,
  Calendar,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Cake,
  Gem,
  Sparkles,
  Users2,
  Award,
  Palette,
  Smile,
  X,
  BookMarked,
  Maximize,
  Minimize,
  GripVertical,
  Search,
  Target,
  UserCheck,
  Link,
  Handshake,
  Edit3,
  ExternalLink,
  Bot,
  ShieldQuestion,
} from "lucide-react";

// Types
import type {
  UserProfile,
  UserImage as UserImageType,
  QuestionnaireResponse,
  FormattedAnswer,
  ServiceType,
  HeadCoveringType,
  KippahType,
} from "@/types/next-auth";
import { languageOptions } from "@/lib/languageOptions"; // Assuming this file exists and exports a Hebrew list

// --- Data & Translation Maps ---
// These maps translate database values (in English) to Hebrew display text.
// They can be moved to a central 'translations.ts' or 'formatters.ts' file for better organization.

const maritalStatusMap: { [key: string]: string } = {
  single: "רווק/ה",
  divorced: "גרוש/ה",
  widowed: "אלמן/ה",
  annulled: "נישואין שבוטלו",
  any: "כל האפשרויות פתוחות",
};

const religiousLevelMap: { [key: string]: string } = {
  charedi: "חרדי/ת",
  charedi_modern: "חרדי/ת מודרני/ת",
  dati_leumi_torani: "דתי/ה לאומי/ת תורני/ת",
  dati_leumi_liberal: "דתי/ה לאומי/ת ליברלי/ת",
  dati_leumi_standard: "דתי/ה לאומי/ת (סטנדרטי)",
  masorti_strong: "מסורתי/ת (קרוב/ה לדת)",
  masorti_light: "מסורתי/ת (קשר קל למסורת)",
  secular_traditional_connection: "חילוני/ת עם זיקה למסורת",
  secular: "חילוני/ת",
  spiritual_not_religious: "רוחני/ת (לאו דווקא דתי/ה)",
  other: "אחר",
  "לא משנה": "ללא העדפה / גמיש",
};

const educationLevelMap: { [key: string]: string } = {
  high_school: "תיכונית",
  vocational: "מקצועית / תעודה",
  academic_student: "סטודנט/ית לתואר",
  academic_ba: "תואר ראשון (BA/BSc)",
  academic_ma: "תואר שני (MA/MSc)",
  academic_phd: "דוקטורט (PhD)",
  yeshiva_seminary: "לימודים תורניים (ישיבה/מדרשה/כולל)",
  other: "אחר",
  "ללא העדפה": "ללא העדפה",
};

const serviceTypeMap: { [key: string]: string } = {
  MILITARY_COMBATANT: "צבאי - לוחם/ת",
  MILITARY_SUPPORT: "צבאי - תומכ/ת לחימה",
  MILITARY_OFFICER: "צבאי - קצונה",
  MILITARY_INTELLIGENCE_CYBER_TECH: "צבאי - מודיעין/סייבר/טכנולוגי",
  NATIONAL_SERVICE_ONE_YEAR: "שירות לאומי - שנה",
  NATIONAL_SERVICE_TWO_YEARS: "שירות לאומי - שנתיים",
  HESDER_YESHIVA: "ישיבת הסדר",
  YESHIVA_ONLY_POST_HS: "ישיבה גבוהה / מדרשה (ללא שירות)",
  PRE_MILITARY_ACADEMY_AND_SERVICE: "מכינה קדם-צבאית ושירות",
  EXEMPTED: "פטור משירות",
  CIVILIAN_SERVICE: "שירות אזרחי",
  OTHER: "אחר / לא רלוונטי",
};

const headCoveringMap: { [key: string]: string } = {
  FULL_COVERAGE: "כיסוי ראש מלא",
  PARTIAL_COVERAGE: "כיסוי ראש חלקי",
  HAT_BERET: "כובע / ברט",
  SCARF_ONLY_SOMETIMES: "מטפחת (רק באירועים/בית כנסת)",
  NONE: "ללא כיסוי ראש",
  any: "כל האפשרויות פתוחות",
};

const kippahTypeMap: { [key: string]: string } = {
  BLACK_VELVET: "קטיפה שחורה",
  KNITTED_SMALL: "סרוגה קטנה",
  KNITTED_LARGE: "סרוגה גדולה",
  CLOTH: "בד",
  BRESLEV: "ברסלב (לבנה גדולה)",
  NONE_AT_WORK_OR_CASUAL: "לא בעבודה / ביומיום",
  NONE_USUALLY: "לרוב לא חובש",
  OTHER: "אחר",
  any: "כל האפשרויות פתוחות",
};

const languageMap = languageOptions.reduce((acc, lang) => {
    acc[lang.value] = lang.label;
    return acc;
}, {} as { [key: string]: string });

const contactPreferenceMap: { [key: string]: string } = {
  direct: "ישירות",
  matchmaker: "דרך השדכן/ית",
  both: "שתי האפשרויות",
};

const aliyaStatusMap: { [key: string]: string } = {
  oleh: "עולה חדש/ה",
  tzabar: "צבר/ית",
  no_preference: "ללא העדפה",
};

const characterTraitMap: { [key: string]: string } = {
  empathetic: "אמפתי/ת",
  driven: "שאפתן/ית",
  optimistic: "אופטימי/ת",
  family_oriented: "משפחתי/ת",
  intellectual: "אינטלקטואל/ית",
  organized: "מאורגנ/ת",
  calm: "רגוע/ה",
  humorous: "בעל/ת חוש הומור",
  sociable: "חברותי/ת",
  sensitive: "רגיש/ה",
  independent: "עצמאי/ת",
  creative: "יצירתי/ת",
  honest: "כן/ה וישר/ה",
  responsible: "אחראי/ת",
  easy_going: "זורם/ת וקליל/ה",
  no_strong_preference: "ללא העדפה חזקה",
};

const hobbiesMap: { [key: string]: string } = {
    travel: "טיולים",
    sports: "ספורט",
    reading: "קריאה",
    cooking_baking: "בישול/אפיה",
    music_playing_instrument: "מוזיקה/נגינה",
    art_crafts: "אומנות/יצירה",
    volunteering: "התנדבות",
    learning_courses: "למידה/קורסים",
    board_games_puzzles: "משחקי קופסא/פאזלים",
    movies_theater: "סרטים/תיאטרון",
    dancing: "ריקוד",
    writing: "כתיבה",
    nature_hiking: "טבע/טיולים רגליים",
    photography: "צילום",
    no_strong_preference: "ללא העדפה חזקה",
};

const WORLDS: {
  [key: string]: { label: string; icon: React.ElementType; color: string };
} = {
  values: { label: "ערכים ועקרונות", icon: BookOpen, color: "blue" },
  personality: { label: "אישיות ותכונות", icon: Smile, color: "green" },
  relationship: { label: "זוגיות ומשפחה", icon: Heart, color: "rose" },
  partner: { label: "ציפיות מבן/בת הזוג", icon: Users, color: "indigo" },
  religion: { label: "דת ואמונה", icon: BookMarked, color: "amber" },
  general: { label: "שאלות כלליות", icon: FileText, color: "slate" },
};

// --- Helper Functions ---

/**
 * Formats an enum or key string into a readable Hebrew string using a mapping object.
 * @param value The key to translate (e.g., "divorced").
 * @param map The translation map (e.g., maritalStatusMap).
 * @param placeholder The text to return if the value is not found.
 * @returns The translated Hebrew string.
 */
const formatEnumValue = (
  value: string | null | undefined,
  map: { [key: string]: string },
  placeholder: string = "לא צוין"
): string => {
  if (!value || !map[value]) {
    return placeholder;
  }
  return map[value];
};

const getInitials = (firstName?: string, lastName?: string): string => {
  let initials = "";
  if (firstName && firstName.length > 0) initials += firstName[0];
  if (lastName && lastName.length > 0) initials += lastName[0];
  if (initials.length === 0 && firstName && firstName.length > 0) {
    initials = firstName.length > 1 ? firstName.substring(0, 2) : firstName[0];
  }
  return initials.toUpperCase() || "?";
};

const calculateAge = (birthDate: Date | string | null | undefined): number => {
  if (!birthDate) return 0;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age > 0 ? age : 0;
  } catch (e) {
    if (process.env.NODE_ENV === "development")
      console.error("Error calculating age:", e);
    return 0;
  }
};

const formatAvailabilityStatus = (
  status: UserProfile["availabilityStatus"] | undefined
) => {
  switch (status) {
    case "AVAILABLE":
      return {
        text: "פנוי/ה להצעות",
        color: "bg-emerald-500",
        icon: CheckCircle,
      };
    case "UNAVAILABLE":
      return { text: "לא פנוי/ה כרגע", color: "bg-red-500", icon: X };
    case "DATING":
      return { text: "בתהליך הכרות", color: "bg-amber-500", icon: Clock };
    case "PAUSED":
      return { text: "בהפסקה מהצעות", color: "bg-sky-500", icon: Clock };
    case "ENGAGED":
      return { text: "מאורס/ת", color: "bg-fuchsia-500", icon: Heart };
    case "MARRIED":
      return { text: "נשוי/אה", color: "bg-rose-500", icon: Heart };
    default:
      return { text: "סטטוס לא ידוע", color: "bg-slate-500", icon: InfoIcon };
  }
};

const formatBooleanPreference = (
  value: boolean | null | undefined,
  yesLabel: string = "כן",
  noLabel: string = "לא",
  notSpecifiedLabel: string = "לא צוין"
): string => {
  if (value === true) return yesLabel;
  if (value === false) return noLabel;
  return notSpecifiedLabel;
};

const formatStringBooleanPreference = (
  value: string | null | undefined,
  options: { [key: string]: string } = {
    yes: "כן",
    no: "לא",
    flexible: "גמיש/ה",
  },
  notSpecifiedLabel: string = "לא צוין"
): string => {
  if (value && options[value.toLowerCase()]) {
    return options[value.toLowerCase()];
  }
  return notSpecifiedLabel;
};


// --- Helper Components ---
const DetailItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
  iconColorClass?: string;
  valueClassName?: string;
  tooltip?: string;
}> = ({
  icon: Icon,
  label,
  value,
  className,
  iconColorClass = "text-gray-500",
  valueClassName,
  tooltip,
}) => {
  const content = (
    <div className={cn("flex items-start gap-1.5 sm:gap-2", className)}>
      <Icon
        className={cn(
          "w-3.5 h-3.5 mt-0.5 sm:mt-1 flex-shrink-0 sm:w-4 sm:h-4",
          iconColorClass
        )}
      />
      <div>
        <p className="text-[11px] sm:text-xs font-medium text-gray-500">
          {label}
        </p>
        <p
          className={cn(
            "text-xs sm:text-sm font-semibold text-gray-800 min-w-0 break-words",
            valueClassName
          )}
        >
          {value || "לא צוין"}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
};

const EmptyState: React.FC<{
  icon: React.ElementType;
  message: string;
  description?: string;
  className?: string;
}> = ({ icon: Icon, message, description, className }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center py-6 sm:py-10 text-center",
      className
    )}
  >
    <Icon className="w-10 h-10 sm:w-12 sm:h-12 mb-2.5 sm:mb-3 text-gray-400/70" />
    <p className="text-sm sm:text-base font-semibold text-gray-600">
      {message}
    </p>
    {description && (
      <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs">
        {description}
      </p>
    )}
  </div>
);

const SectionCard: React.FC<{
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  action?: React.ReactNode;
  description?: string;
}> = ({
  title,
  icon: Icon,
  children,
  className,
  contentClassName,
  titleClassName,
  action,
  description,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200/60 overflow-hidden flex flex-col min-w-0",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 p-2.5 sm:p-3 md:p-3.5 border-b border-gray-200/70 bg-slate-50/80 min-w-0",
          titleClassName
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {Icon && (
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-700 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="ml-auto flex-shrink-0">{action}</div>}
      </div>
      <div className={cn("p-2.5 sm:p-3 md:p-4 min-w-0", contentClassName)}>
        {children}
      </div>
    </div>
  );
};


// --- Profile Header Component ---
const ProfileHeader: React.FC<{
  profile: UserProfile;
  age: number;
  userInitials: string;
  mainImageToDisplay: UserImageType | null;
  availability: ReturnType<typeof formatAvailabilityStatus>;
  viewMode: "matchmaker" | "candidate";
}> = ({
  profile,
  age,
  userInitials,
  mainImageToDisplay,
  availability,
  viewMode,
}) => {
  const allProfileDetails = useMemo(() => {
    return [
      {
        label: "גיל",
        value: (() => {
          if (age > 0) {
            return (
              <>
                {age}
                {profile.birthDateIsApproximate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-500 cursor-help"> (משוער)</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs max-w-xs text-center">
                        הגיל הוזן על ידי השדכן והוא משקף את הגיל בקירוב
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            );
          }
          if (profile.birthDateIsApproximate === true) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>משוער (לא צוין ערך)</span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs max-w-xs text-center">
                    צוין שהגיל הוא הערכה, אך לא הוזן תאריך לידה ספציפי.
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return "-";
        })(),
        icon: Cake,
        color: "pink-600",
        condition: age > 0 || profile.birthDateIsApproximate === true,
      },
      {
        label: "מצב משפחתי",
        value: formatEnumValue(profile.maritalStatus, maritalStatusMap, "-"),
        icon: Heart,
        color: "rose-600",
        condition: !!profile.maritalStatus,
      },
      {
        label: "סטטוס",
        value: availability.text,
        icon: availability.icon,
        color: availability.color.replace("bg-", ""),
        isBadge: true,
        badgeColor: availability.color,
        badgeTextColor: "text-white",
      },
      {
        label: "עיר",
        value: profile.city,
        icon: MapPin,
        color: "teal-600",
        condition: !!profile.city,
      },
      {
        label: "מוצא",
        value: profile.origin,
        icon: Gem,
        color: "purple-600",
        condition: !!profile.origin,
      },
      {
        label: "רמה דתית",
        value: formatEnumValue(profile.religiousLevel, religiousLevelMap, "-"),
        icon: BookMarked,
        color: "indigo-600",
        condition: !!profile.religiousLevel,
      },
      {
        label: "עיסוק",
        value: profile.occupation,
        icon: Briefcase,
        color: "emerald-600",
        condition: !!profile.occupation,
      },
      {
        label: "השכלה",
        value: formatEnumValue(profile.educationLevel, educationLevelMap, profile.education || "-"),
        icon: GraduationCap,
        color: "sky-600",
        condition: !!(profile.educationLevel || profile.education),
      },
      {
        label: "גובה",
        value: profile.height ? `${profile.height} ס״מ` : "-",
        icon: User,
        color: "slate-600",
        condition: !!profile.height,
      },
      {
        label: "שומר/ת נגיעה",
        value: formatBooleanPreference(profile.shomerNegiah),
        icon: Sparkles,
        color: "pink-600",
        condition:
          typeof profile.shomerNegiah === "boolean" ||
          profile.shomerNegiah === null,
      },
      ...(profile.gender === "FEMALE"
        ? [
            {
              label: "כיסוי ראש",
              value: formatEnumValue(profile.headCovering, headCoveringMap, "-"),
              icon: UserCheck,
              color: "slate-600",
              condition: !!profile.headCovering,
            },
          ]
        : []),
      ...(profile.gender === "MALE"
        ? [
            {
              label: "סוג כיפה",
              value: formatEnumValue(profile.kippahType, kippahTypeMap, "-"),
              icon: UserCheck,
              color: "slate-600",
              condition: !!profile.kippahType,
            },
          ]
        : []),
      {
        label: "שפת אם",
        value: formatEnumValue(profile.nativeLanguage, languageMap, "-"),
        icon: Languages,
        color: "emerald-600",
        condition: !!profile.nativeLanguage,
      },
    ].filter(
      (detail) =>
        detail.condition !== false && detail.value && detail.value !== "-"
    );
  }, [profile, age, availability]);

  return (
    <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-slate-100 via-white to-sky-100/30 border-b border-slate-200/80">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-6">
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-white shadow-xl ring-2 ring-cyan-500/60 flex-shrink-0">
          {mainImageToDisplay && mainImageToDisplay.url ? (
            <Image
              src={mainImageToDisplay.url}
              alt={`תמונת פרופיל ראשית של ${
                profile.user?.firstName || "מועמד"
              }`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 128px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <span className="text-3xl sm:text-4xl md:text-5xl font-medium text-slate-500">
                {userInitials}
              </span>
            </div>
          )}
        </div>
        <div className="flex-grow text-center sm:text-right space-y-2 sm:space-y-2.5">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">
              {profile.user?.firstName || "שם פרטי"}{" "}
              {profile.user?.lastName || "שם משפחה"}
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-2 md:grid-cols-3 lg:grid-cols-4">
            {allProfileDetails.map((detail, index) => {
              const IconComponent = detail.icon;
              const valueContent =
                typeof detail.value === "string"
                  ? detail.value
                  : React.isValidElement(detail.value)
                  ? detail.value
                  : "-";

              if (detail.isBadge) {
                return (
                  <div key={index} className="flex items-center gap-1">
                    <IconComponent
                      className={cn(
                        "w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0",
                        detail.badgeTextColor
                          ? detail.badgeTextColor
                          : `text-${detail.color}`
                      )}
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                        {detail.label}:
                      </span>
                      <Badge
                        className={cn(
                          "text-[9px] sm:text-[10px] px-1 py-px sm:px-1.5 sm:py-0.5 font-medium ml-0.5 sm:ml-1",
                          detail.badgeColor,
                          detail.badgeTextColor
                        )}
                      >
                        {valueContent}
                      </Badge>
                    </div>
                  </div>
                );
              }
              return (
                <div key={index} className="flex items-center gap-1 min-w-0">
                  <IconComponent
                    className={cn(
                      "w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0",
                      `text-${detail.color}`
                    )}
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                        {detail.label}:
                    </span>
                    <span
                      className="ml-0.5 sm:ml-1 text-xs sm:text-sm font-medium text-slate-700 truncate"
                      title={
                        typeof valueContent === "string" && valueContent.length > 20
                          ? valueContent
                          : undefined
                      }
                    >
                      {valueContent}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {profile.lastActive && viewMode === "matchmaker" && (
            <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1 pt-1 sm:pt-1.5 justify-center sm:justify-start">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              נצפה לאחרונה:{" "}
              {new Date(profile.lastActive).toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })}
            </p>
          )}
          {viewMode === "matchmaker" && (
            <div className="pt-1 sm:pt-2 flex justify-center sm:justify-start">
              <Button
                variant="outline"
                size="xs"
                className="text-cyan-600 border-cyan-500 hover:bg-cyan-50 text-[10px] sm:text-xs px-2 py-1"
              >
                <Link className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-1.5" />
                הצע התאמה
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ProfileCard.tsx - QuestionnaireItem component
const QuestionnaireItem: React.FC<{
  answer: FormattedAnswer;
  worldColor?: string;
}> = ({ answer, worldColor = "slate" }) => {
  return (
    <div
      className={cn(
        "p-2.5 sm:p-3.5 rounded-md sm:rounded-lg border hover:shadow-md transition-shadow",
        `bg-${worldColor}-50/50 border-${worldColor}-200/70`,
        "flex flex-col min-w-0"
      )}
    >
      <p
        className={cn(
          "text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 min-w-0 break-words",
          `text-${worldColor}-700`
        )}
      >
        {answer.question}
      </p>
      <p
        className={cn(
          "text-sm sm:text-base font-semibold text-slate-800 whitespace-pre-wrap min-w-0",
          "break-all"
        )}
      >
        {answer.displayText || answer.answer}
      </p>
    </div>
  );
};

interface ProfileCardProps {
  profile: UserProfile;
  images?: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: "matchmaker" | "candidate";
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  images = [],
  questionnaire,
  viewMode = "candidate",
  className,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const [selectedImageForDialog, setSelectedImageForDialog] =
    useState<UserImageType | null>(null);
  const orderedImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    const validImages = images.filter((img) => img.url);
    const mainImg = validImages.find((img) => img.isMain);
    const otherImages = validImages.filter((img) => !img.isMain);
    return mainImg ? [mainImg, ...otherImages] : otherImages;
  }, [images]);

  const [activeMainImageIndex, setActiveMainImageIndex] = useState<number>(
    () => {
      const mainIndex = orderedImages.findIndex((img) => img.isMain);
      return mainIndex !== -1 ? mainIndex : orderedImages.length > 0 ? 0 : -1;
    }
  );

  const [activeTab, setActiveTab] = useState("about_me");

  const [mainContentPanelSize, setMainContentPanelSize] = useState(65);
  const [sidePhotosPanelSize, setSidePhotosPanelSize] = useState(35);

  const age = useMemo(
    () => calculateAge(profile.birthDate),
    [profile.birthDate]
  );
  const userInitials = useMemo(
    () => getInitials(profile.user?.firstName, profile.user?.lastName),
    [profile.user?.firstName, profile.user?.lastName]
  );

  const mainImageToDisplay = useMemo(() => {
    if (activeMainImageIndex !== -1 && orderedImages[activeMainImageIndex]) {
      return orderedImages[activeMainImageIndex];
    }
    return null;
  }, [orderedImages, activeMainImageIndex]);

  const availability = useMemo(
    () => formatAvailabilityStatus(profile.availabilityStatus),
    [profile.availabilityStatus]
  );

  const handleOpenImageDialog = (image: UserImageType) =>
    image.url && setSelectedImageForDialog(image);
  const handleCloseImageDialog = () => setSelectedImageForDialog(null);

  const currentDialogImageIndex = useMemo(() => {
    if (!selectedImageForDialog || !selectedImageForDialog.url) return -1;
    return orderedImages.findIndex(
      (img) => img.id === selectedImageForDialog.id
    );
  }, [selectedImageForDialog, orderedImages]);

  const handleDialogNav = (direction: "next" | "prev") => {
    if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
    let newIndex =
      direction === "next"
        ? currentDialogImageIndex + 1
        : currentDialogImageIndex - 1;
    newIndex = (newIndex + orderedImages.length) % orderedImages.length;
    setSelectedImageForDialog(orderedImages[newIndex]);
  };

  const hasDisplayableQuestionnaireAnswers = useMemo(
    () =>
      questionnaire &&
      questionnaire.formattedAnswers &&
      Object.values(questionnaire.formattedAnswers).some((answers) => {
        const typedAnswers = (answers || []) as FormattedAnswer[];
        return typedAnswers.some(
          (a) => a.isVisible !== false && (a.answer || a.displayText)
        );
      }),
    [questionnaire]
  );

  const tabItems = useMemo(
    () => [
      { value: "about_me", label: "קצת עליי", icon: User, activeColor: "cyan" },
      {
        value: "background_worldview",
        label: "רקע והשקפה",
        icon: BookOpen,
        activeColor: "indigo",
      },
      {
        value: "looking_for",
        label: "מה הם מחפשים?",
        icon: Target,
        activeColor: "green",
      },
      ...(questionnaire
        ? [
            {
              value: "questionnaire",
              label: "מהשאלון",
              icon: FileText,
              activeColor: "pink",
            },
          ]
        : []),
      {
        value: "photos_tab",
        label: "תמונות",
        icon: ImageIcon,
        activeColor: "slate",
        count: orderedImages.length,
      },
      ...(viewMode === "matchmaker"
        ? [
            {
              value: "matchmaker_info",
              label: "מידע לשדכן",
              icon: Lock,
              activeColor: "amber",
            },
          ]
        : []),
    ],
    [orderedImages.length, questionnaire, viewMode]
  );

  const togglePanels = useCallback(() => {
    if (mainContentPanelSize > 50) {
      setMainContentPanelSize(30);
      setSidePhotosPanelSize(70);
    } else {
      setMainContentPanelSize(65);
      setSidePhotosPanelSize(35);
    }
  }, [mainContentPanelSize]);

  const renderPreferenceBadges = (
    label: string,
    icon: React.ElementType,
    iconColorClass: string,
    values: string[] | undefined,
    badgeColorClass: string,
    translationMap: { [key: string]: string }
  ) => {
    if (!values || values.length === 0) return null;
    const IconComponent = icon;
    return (
      <div>
        <p
          className={cn(
            "text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5",
            iconColorClass
          )}
        >
          <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {label}
        </p>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {(values as string[]).map((val) => (
            <Badge
              key={val}
              variant="outline"
              className={cn(
                "text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2",
                badgeColorClass
              )}
            >
              {formatEnumValue(val, translationMap)}
            </Badge>
          ))}
        </div>
      </div>
    );
  };
  
  const MainContentTabs = ({
    inScrollArea = false,
  }: {
    inScrollArea?: boolean;
  }) => (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex flex-col flex-grow min-h-0"
    >
      <div
        className={cn(
          "bg-white/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-md sm:rounded-lg mb-2.5 sm:mb-3 shadow-md border border-gray-200/80 flex-shrink-0",
          inScrollArea ? "sticky top-0 z-20" : ""
        )}
      >
        <ScrollArea dir="rtl" className="w-full">
          <TabsList className="h-auto inline-flex bg-transparent flex-nowrap justify-start p-0.5 sm:p-1">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center gap-0.5 px-1 py-0.5 text-[9px] rounded-sm",
                  "sm:gap-1 sm:px-1.5 sm:py-1 sm:text-[10px] sm:rounded-md",
                  "md:gap-1.5 md:px-2 md:py-1.5 md:text-xs",
                  "whitespace-nowrap transition-all duration-200 border-b-2",
                  "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                  activeTab === tab.value
                    ? cn(
                        `font-semibold border-${tab.activeColor}-500 text-${tab.activeColor}-600 bg-white shadow-sm`,
                        `hover:text-${tab.activeColor}-700 hover:bg-${tab.activeColor}-50/50`
                      )
                    : "border-transparent"
                )}
              >
                <tab.icon
                  className={cn(
                    "w-2.5 h-2.5 sm:w-3 sm:h-3",
                    activeTab === tab.value
                      ? `text-${tab.activeColor}-500`
                      : "text-slate-400"
                  )}
                />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      `text-[8px] sm:text-[9px] rounded-full px-1 py-px ml-0.5 hidden sm:inline-block font-mono`,
                      activeTab === tab.value
                        ? `bg-${tab.activeColor}-100 text-${tab.activeColor}-700`
                        : `bg-slate-200 text-slate-600`
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div
        className={cn(
          "space-y-2.5 sm:space-y-3 focus:outline-none",
          !inScrollArea && "flex-grow min-h-0 overflow-y-auto overflow-x-hidden"
        )}
      >
        <TabsContent value="about_me" className="min-h-0 w-full">
          <SectionCard
            title="אודותיי"
            icon={InfoIcon}
            contentClassName="space-y-2.5 sm:space-y-3"
          >
            {profile.about ? (
              <p className="text-slate-700 whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed p-1.5 sm:p-2 bg-slate-50 rounded-md min-w-0">
                {profile.about}
              </p>
            ) : (
              <EmptyState
                icon={InfoIcon}
                message="לא הוזן תיאור אישי"
                className="py-4 sm:py-6"
              />
            )}
          </SectionCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
            <SectionCard title="תכונות אופי (שלי)" icon={Smile}>
              {profile.profileCharacterTraits &&
              profile.profileCharacterTraits.length > 0 ? (
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {profile.profileCharacterTraits.map((trait, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-100 text-purple-700 border border-purple-200/70 shadow-xs text-[10px] sm:text-xs"
                    >
                      {formatEnumValue(trait, characterTraitMap, trait)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Smile}
                  message="לא צוינו תכונות"
                  className="py-4 sm:py-6"
                />
              )}
            </SectionCard>
            <SectionCard title="תחביבים (שלי)" icon={Palette}>
              {profile.profileHobbies && profile.profileHobbies.length > 0 ? (
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {profile.profileHobbies.map((hobby, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-teal-100 text-teal-700 border border-teal-200/70 shadow-xs text-[10px] sm:text-xs"
                    >
                      {formatEnumValue(hobby, hobbiesMap, hobby)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Palette}
                  message="לא צוינו תחביבים"
                  className="py-4 sm:py-6"
                />
              )}
            </SectionCard>
          </div>
          <SectionCard
            title="רקע משפחתי ואישי"
            icon={Users2}
            contentClassName="space-y-2.5 sm:space-y-3"
            className="mt-2.5 sm:mt-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2.5 sm:gap-x-3 gap-y-2 sm:gap-y-2.5">
              <DetailItem
                icon={Users2}
                label="מצב הורים"
                value={profile.parentStatus}
                iconColorClass="text-purple-600"
              />
              <DetailItem
                icon={Users}
                label="מספר אחים/אחיות"
                value={profile.siblings?.toString()}
                iconColorClass="text-purple-600"
              />
              <DetailItem
                icon={User}
                label="מיקום במשפחה"
                value={profile.position?.toString()}
                iconColorClass="text-purple-600"
              />
              {(profile.maritalStatus?.toLowerCase() === "divorced" ||
                profile.maritalStatus?.toLowerCase() === "widowed") && (
                <DetailItem
                  icon={Users2}
                  label="ילדים מקשר קודם (שלי)"
                  value={formatBooleanPreference(
                    profile.hasChildrenFromPrevious
                  )}
                  iconColorClass="text-purple-600"
                />
              )}
              {profile.aliyaCountry && (
                <DetailItem
                  icon={MapPin}
                  label="ארץ עלייה"
                  value={profile.aliyaCountry}
                  iconColorClass="text-cyan-600"
                />
              )}
              {profile.aliyaYear && (
                <DetailItem
                  icon={Calendar}
                  label="שנת עלייה"
                  value={profile.aliyaYear.toString()}
                  iconColorClass="text-cyan-600"
                />
              )}
            </div>
            {profile.additionalLanguages &&
              profile.additionalLanguages.length > 0 && (
                <div className="pt-2 sm:pt-2.5 border-t border-slate-200/60 mt-2 sm:mt-2.5">
                  <p className="text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                    <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />{" "}
                    שפות נוספות
                  </p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {profile.additionalLanguages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] sm:text-xs shadow-xs"
                      >
                        {formatEnumValue(lang, languageMap)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="background_worldview" className="min-h-0 w-full">
          <SectionCard
            title="דת ואמונה"
            icon={BookMarked}
            contentClassName="space-y-2.5 sm:space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2.5 sm:gap-x-3 gap-y-2 sm:gap-y-2.5">
              <DetailItem
                icon={BookMarked}
                label="רמה דתית"
                value={formatEnumValue(profile.religiousLevel, religiousLevelMap)}
                iconColorClass="text-indigo-600"
              />
              <DetailItem
                icon={Sparkles}
                label="שמירת נגיעה"
                value={formatBooleanPreference(profile.shomerNegiah)}
                iconColorClass="text-pink-600"
              />
              {profile.gender === "FEMALE" && (
                <DetailItem
                  icon={UserCheck}
                  label="כיסוי ראש"
                  value={formatEnumValue(profile.headCovering, headCoveringMap)}
                  iconColorClass="text-slate-600"
                />
              )}
              {profile.gender === "MALE" && (
                <DetailItem
                  icon={UserCheck}
                  label="סוג כיפה"
                  value={formatEnumValue(profile.kippahType, kippahTypeMap)}
                  iconColorClass="text-slate-600"
                />
              )}
            </div>
          </SectionCard>
          <SectionCard
            title="השכלה ותעסוקה"
            icon={GraduationCap}
            contentClassName="space-y-2.5 sm:space-y-3 mt-2.5 sm:mt-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-2 sm:gap-y-2.5">
              <DetailItem
                icon={GraduationCap}
                label="רמת השכלה"
                value={formatEnumValue(profile.educationLevel, educationLevelMap)}
                iconColorClass="text-sky-600"
              />
              <DetailItem
                icon={School}
                label="פירוט השכלה"
                value={profile.education}
                iconColorClass="text-sky-600"
                valueClassName="whitespace-pre-wrap break-words"
              />
              <DetailItem
                icon={Briefcase}
                label="עיסוק"
                value={profile.occupation}
                iconColorClass="text-emerald-600"
              />
              <DetailItem
                icon={Award}
                label="שירות צבאי/לאומי"
                value={formatEnumValue(profile.serviceType, serviceTypeMap)}
                iconColorClass="text-amber-600"
              />
              {profile.serviceDetails && (
                <DetailItem
                  icon={InfoIcon}
                  label="פרטי שירות"
                  value={profile.serviceDetails}
                  iconColorClass="text-amber-600"
                  valueClassName="whitespace-pre-wrap break-words"
                />
              )}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="looking_for" className="min-h-0 w-full">
          <SectionCard
            title="העדפות לבן/בת הזוג"
            icon={Target}
            contentClassName="space-y-3 sm:space-y-4"
            description="מה המועמד/ת מחפש/ת בהתאמה"
          >
            {profile.matchingNotes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />{" "}
                  תיאור כללי על המבוקש/ת:
                </p>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words bg-slate-100 p-2 sm:p-2.5 rounded-md border border-slate-200">
                  {profile.matchingNotes}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 sm:gap-x-3 gap-y-2.5 sm:gap-y-3">
              {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                <DetailItem
                  icon={Calendar}
                  label="טווח גילאים"
                  value={`${profile.preferredAgeMin || "?"} - ${
                    profile.preferredAgeMax || "?"
                  } שנים`}
                  iconColorClass="text-blue-600"
                />
              )}
              {(profile.preferredHeightMin || profile.preferredHeightMax) && (
                <DetailItem
                  icon={User}
                  label="טווח גבהים"
                  value={`${profile.preferredHeightMin || "?"} - ${
                    profile.preferredHeightMax || "?"
                  } ס״מ`}
                  iconColorClass="text-blue-600"
                />
              )}
              <DetailItem
                icon={ShieldQuestion}
                label="שמירת נגיעה"
                value={formatStringBooleanPreference(
                  profile.preferredShomerNegiah
                )}
                iconColorClass="text-pink-600"
                tooltip="העדפה לגבי שמירת נגיעה של בן/בת הזוג"
              />
              <DetailItem
                icon={Users2}
                label="ילדים מקשר קודם"
                value={formatBooleanPreference(
                  profile.preferredHasChildrenFromPrevious
                )}
                iconColorClass="text-purple-600"
                tooltip="העדפה לגבי ילדים מקשר קודם של בן/בת הזוג"
              />
              {renderPreferenceBadges(
                "סטטוסים משפחתיים מועדפים",
                Heart,
                "text-rose-600",
                profile.preferredMaritalStatuses,
                "bg-rose-50 text-rose-700 border-rose-200",
                maritalStatusMap
              )}
              {renderPreferenceBadges(
                "מוצאים מועדפים", // Origin is a free text, so we can't map it. This will show the raw text.
                Gem,
                "text-purple-600",
                profile.preferredOrigins,
                "bg-purple-50 text-purple-700 border-purple-200",
                {} // Pass empty map to just show the value
              )}
              {renderPreferenceBadges(
                "רמות דתיות מועדפות",
                BookMarked,
                "text-indigo-600",
                profile.preferredReligiousLevels,
                "bg-indigo-50 text-indigo-700 border-indigo-200",
                religiousLevelMap
              )}
              {profile.preferredAliyaStatus && (
                <DetailItem
                  icon={MapPin}
                  label="סטטוס עלייה מועדף"
                  value={formatEnumValue(profile.preferredAliyaStatus, aliyaStatusMap)}
                  iconColorClass="text-cyan-600"
                />
              )}
            </div>
            {!profile.matchingNotes &&
              !profile.preferredAgeMin &&
              !profile.preferredAgeMax &&
              !profile.preferredHeightMin &&
              !profile.preferredHeightMax &&
              !profile.preferredShomerNegiah &&
              typeof profile.preferredHasChildrenFromPrevious !== "boolean" &&
              (!profile.preferredMaritalStatuses ||
                profile.preferredMaritalStatuses.length === 0) &&
              (!profile.preferredOrigins ||
                profile.preferredOrigins.length === 0) &&
              (!profile.preferredReligiousLevels ||
                profile.preferredReligiousLevels.length === 0) &&
              !profile.preferredAliyaStatus && (
                <EmptyState
                  icon={Search}
                  message="לא צוינו העדפות ספציפיות לחיפוש"
                  className="py-4 sm:py-6"
                />
              )}
          </SectionCard>
        </TabsContent>

        {tabItems.find((tab) => tab.value === "questionnaire") && (
          <TabsContent
            value="questionnaire"
            className="focus:outline-none min-h-0 w-full"
          >
            {hasDisplayableQuestionnaireAnswers ? (
              <div className="space-y-2.5 sm:space-y-3">
                {Object.entries(questionnaire?.formattedAnswers || {}).map(
                  ([worldKey, answers]) => {
                    const worldConfig = WORLDS[worldKey] ||
                      WORLDS.general || {
                        label: 'שאלות נוספות',
                        icon: FileText,
                        color: "slate",
                      };
                    const typedAnswers = (answers || []) as FormattedAnswer[];
                    const visibleAnswers = typedAnswers.filter(
                      (a) =>
                        a.isVisible !== false && (a.answer || a.displayText)
                    );
                    if (visibleAnswers.length === 0) return null;
                    return (
                      <SectionCard
                        key={worldKey}
                        title={worldConfig.label}
                        icon={worldConfig.icon}
                        contentClassName="space-y-2 sm:space-y-2.5"
                      >
                        {visibleAnswers.map((answer) => (
                          <QuestionnaireItem
                            key={answer.questionId}
                            answer={answer}
                            worldColor={worldConfig.color}
                          />
                        ))}
                      </SectionCard>
                    );
                  }
                )}
              </div>
            ) : (
              <SectionCard title="מהשאלון" icon={FileText}>
                <EmptyState
                  icon={FileText}
                  message="שאלון אינו זמין לצפייה כעת"
                  description={
                    questionnaire?.completed
                      ? "המועמד בחר לא להציג את תשובות השאלון, או שאין תשובות זמינות כעת."
                      : "המועמד טרם מילא את השאלון במלואו."
                  }
                  className="py-6 sm:py-8"
                />
              </SectionCard>
            )}
          </TabsContent>
        )}

        <TabsContent value="photos_tab" className="min-h-0 w-full">
          <SectionCard title="גלריית תמונות" icon={ImageIcon}>
            {orderedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                {orderedImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-[4/5] rounded-md sm:rounded-lg overflow-hidden cursor-pointer group shadow-md border border-gray-200/80 hover:shadow-xl transition-all duration-300"
                    onClick={() => handleOpenImageDialog(image)}
                  >
                    <Image
                      src={image.url!}
                      alt={`תמונה של ${profile.user?.firstName || "משתמש"}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 sm:p-2">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />
                    </div>
                    {image.isMain && (
                      <Badge className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-yellow-400 text-black border-0 shadow-lg text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-black" />{" "}
                        ראשי
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ImageIcon}
                message="לא הועלו תמונות"
                description="מומלץ להעלות מספר תמונות ברורות."
                className="py-6 sm:py-8"
              />
            )}
          </SectionCard>
        </TabsContent>

        {viewMode === "matchmaker" && (
          <TabsContent value="matchmaker_info" className="min-h-0 w-full">
            <div className="bg-amber-50 border-2 border-amber-300/70 rounded-lg sm:rounded-xl shadow-lg p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-amber-700">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="font-semibold text-base sm:text-lg">
                  מידע רגיש לשדכנים בלבד
                </h3>
              </div>
              <DetailItem
                icon={Phone}
                label="העדפת יצירת קשר"
                value={formatEnumValue(profile.contactPreference, contactPreferenceMap, "-")}
                iconColorClass="text-amber-600"
              />
              <DetailItem
                icon={Handshake}
                label="העדפת מגדר שדכן/ית"
                value={
                  profile.preferredMatchmakerGender
                    ? profile.preferredMatchmakerGender === "MALE"
                      ? "גבר"
                      : "אישה"
                    : "אין העדפה / לא צוין"
                }
                iconColorClass="text-amber-600"
              />
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> הערות לשדכנים:
                </p>
                {profile.matchingNotes ? ( 
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words bg-amber-100/70 p-2 sm:p-2.5 rounded-md border border-amber-200/80">
                    {profile.matchingNotes}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 italic">
                    לא הוזנו הערות.
                  </p>
                )}
              </div>
              {profile.availabilityNote && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> הערת זמינות:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words bg-amber-100/70 p-2 sm:p-2.5 rounded-md border border-amber-200/80">
                    {profile.availabilityNote}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </div>
    </Tabs>
  );

  if (!isClient) {
    return (
      <Card
        dir="rtl"
        className={cn(
          "w-full bg-slate-50 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border-0 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] h-full",
          className
        )}
      >
        <div className="p-4 animate-pulse bg-gray-200 h-40 sm:h-48 w-full"></div>
        <div className="p-4 animate-pulse bg-gray-100 flex-grow"></div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card
        dir="rtl"
        id="profile-card-container"
        className={cn(
          "w-full bg-slate-50 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border-0 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] h-full",
          className
        )}
      >
        <ProfileHeader
          profile={profile}
          age={age}
          userInitials={userInitials}
          mainImageToDisplay={mainImageToDisplay}
          availability={availability}
          viewMode={viewMode}
        />

        {isDesktop ? (
          <ResizablePanelGroup
            direction="horizontal"
            dir="rtl"
            className="flex-grow min-h-0 border-t border-slate-200/80"
            onLayout={(sizes: number[]) => {
              setMainContentPanelSize(sizes[0]);
              setSidePhotosPanelSize(sizes[1]);
            }}
          >
            <ResizablePanel
              defaultSize={mainContentPanelSize}
              minSize={25}
              maxSize={75}
              id="main-content-panel"
              order={1}
              className="min-w-0 bg-slate-100/40 flex flex-col"
            >
              <ScrollArea className="h-full focus-visible:outline-none focus-visible:ring-0 flex-grow min-h-0">
                <div className="p-3 md:p-4 h-full flex flex-col">
                  <MainContentTabs inScrollArea={true} />
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="bg-slate-200 hover:bg-slate-300 transition-colors hidden md:flex"
            >
              <GripVertical className="w-2.5 h-2.5 text-slate-500" />
            </ResizableHandle>
            <ResizablePanel
              defaultSize={sidePhotosPanelSize}
              minSize={25}
              maxSize={75}
              id="side-photos-panel"
              order={2}
              className="min-w-0 bg-white hidden md:block"
            >
              <div className="h-full flex flex-col">
                <div className="p-3 md:p-4 flex-grow flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-2.5 sm:mb-3 flex-shrink-0">
                    <h3 className="text-base md:text-md font-semibold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                      <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-cyan-600" />{" "}
                      תמונות ({orderedImages.length})
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={togglePanels}
                          className="text-slate-500 hover:text-cyan-600 w-7 h-7 sm:w-8 sm:h-8"
                        >
                          {sidePhotosPanelSize > 50 ? (
                            <Minimize className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          ) : (
                            <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>
                          {sidePhotosPanelSize > 50
                            ? "צמצם גלריה צדדית"
                            : "הרחב גלריה צדדית"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {orderedImages.length > 0 ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mb-2.5 sm:mb-3 text-cyan-600 border-cyan-400/70 hover:bg-cyan-50 hover:text-cyan-700 flex-shrink-0 text-xs md:text-sm"
                        onClick={() => {
                          setActiveTab("photos_tab");
                          if (sidePhotosPanelSize > 50) togglePanels();
                        }}
                      >
                        <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1.5" />{" "}
                        הצג את כל {orderedImages.length} התמונות בגלריה הראשית
                      </Button>
                      <div className="flex-grow flex flex-col gap-2.5 sm:gap-3 min-h-0">
                        {mainImageToDisplay && (
                          <div
                            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group shadow-lg border border-gray-200/70 hover:shadow-xl transition-all flex-shrink-0"
                            onClick={() =>
                              handleOpenImageDialog(mainImageToDisplay)
                            }
                          >
                            <Image
                              src={mainImageToDisplay.url}
                              alt={`תמונה ראשית של ${
                                profile.user?.firstName || "מועמד"
                              }`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 1024px) 40vw, 30vw"
                              priority={
                                activeMainImageIndex ===
                                orderedImages.findIndex((img) => img.isMain)
                              }
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <Eye className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-lg" />
                            </div>
                            {mainImageToDisplay.isMain && (
                              <Badge className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-yellow-400 text-black border-0 shadow-md text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-black" />{" "}
                                ראשי
                              </Badge>
                            )}
                          </div>
                        )}
                        {orderedImages.length > 1 && (
                          <ScrollArea
                            dir="rtl"
                            className="w-full flex-shrink-0"
                          >
                            <div className="flex gap-1.5 sm:gap-2 pb-1.5">
                              {orderedImages.map((image, index) => (
                                <div
                                  key={image.id}
                                  className={cn(
                                    "relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 shadow-sm hover:shadow-md",
                                    activeMainImageIndex === index
                                      ? "border-cyan-500 ring-2 ring-cyan-500/30 scale-105"
                                      : "border-slate-200 hover:border-cyan-400 opacity-80 hover:opacity-100"
                                  )}
                                  onClick={() => setActiveMainImageIndex(index)}
                                  onDoubleClick={() =>
                                    handleOpenImageDialog(image)
                                  }
                                >
                                  <Image
                                    src={image.url}
                                    alt={`תמונת פרופיל ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </div>
                              ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <EmptyState
                        icon={ImageIcon}
                        message="אין תמונות להצגה"
                        className="py-6 w-full bg-slate-50 rounded-lg border border-slate-200/70"
                      />
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-2.5 border-t border-slate-200/80 bg-slate-50/70 flex-shrink-0">
                  <SectionCard
                    title="ניתוח AI"
                    icon={Bot}
                    titleClassName="p-1.5 sm:p-2 md:p-2.5 bg-slate-100/80 text-sm"
                    contentClassName="p-1.5 sm:p-2 md:p-2.5"
                    className="shadow-md"
                  >
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 opacity-70 mb-0.5" />
                      <p className="text-[10px] sm:text-xs text-slate-600 max-w-md leading-tight">
                        קבל/י סיכום ותובנות מה-AI ונהל/י שיחת התייעצות.
                      </p>
                      <Button
                        size="xs"
                        className="mt-1 w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-1 px-1.5 rounded text-[10px] sm:text-xs shadow-sm hover:shadow-md transition-all"
                      >
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3.5 ml-1 sm:ml-1.5" />{" "}
                        התחל התייעצות
                      </Button>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Mobile Layout
          <ScrollArea className="flex-grow min-h-0 w-full">
            <div className="p-2 sm:p-2.5">
              <MainContentTabs />
            </div>
          </ScrollArea>
        )}

        {selectedImageForDialog && selectedImageForDialog.url && (
          <Dialog
            open={!!selectedImageForDialog}
            onOpenChange={(isOpen) => !isOpen && handleCloseImageDialog()}
          >
            <DialogContent
              className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 backdrop-blur-md border-none shadow-2xl overflow-hidden rounded-lg flex flex-col"
              dir="rtl"
            >
              <DialogHeader className="p-2 sm:p-3 text-white flex flex-row justify-between items-center border-b border-slate-700/50 flex-shrink-0">
                <DialogTitle className="text-center text-sm sm:text-base md:text-lg font-semibold flex-grow truncate px-2">
                  תמונה {currentDialogImageIndex + 1} מתוך{" "}
                  {orderedImages.length}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full mr-auto w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0"
                  onClick={handleCloseImageDialog}
                  aria-label="סגור"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DialogHeader>
              <div className="relative flex-1 w-full min-h-0 flex items-center justify-center bg-black/80">
                <Image
                  key={selectedImageForDialog.id}
                  src={selectedImageForDialog.url}
                  alt={`תמונה מוגדלת ${currentDialogImageIndex + 1} של ${
                    profile.user?.firstName || "מועמד"
                  }`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
                {orderedImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12"
                      onClick={() => handleDialogNav("prev")}
                      aria-label="הקודם"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12"
                      onClick={() => handleDialogNav("next")}
                      aria-label="הבא"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </>
                )}
              </div>
              {orderedImages.length > 1 && (
                <DialogFooter className="border-t border-slate-700/50 bg-black/70 p-0 flex-shrink-0">
                  <ScrollArea dir="rtl" className="w-full">
                    <div className="flex gap-1 sm:gap-1.5 p-1.5 sm:p-2 justify-center">
                      {orderedImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className={cn(
                            "relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded overflow-hidden cursor-pointer border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black",
                            img.id === selectedImageForDialog.id
                              ? "border-cyan-400 scale-105 opacity-100 shadow-lg"
                              : "border-transparent hover:border-slate-400 opacity-60 hover:opacity-100"
                          )}
                          onClick={() => setSelectedImageForDialog(img)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setSelectedImageForDialog(img)
                          }
                          tabIndex={0}
                          role="button"
                          aria-label={`הצג תמונה ${idx + 1}`}
                        >
                          <Image
                            src={img.url}
                            alt={`תמונה קטנה ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </TooltipProvider>
  );
};

export default ProfileCard;