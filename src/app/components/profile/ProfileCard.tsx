// src/app/components/profile/ProfileCard.tsx
"use client";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  User, Heart, FileText, Image as ImageIcon, Info as InfoIcon, Eye, Phone, ChevronLeft, ChevronRight, Briefcase,
  GraduationCap, Users, BookOpen, School, Lock, Languages, Calendar, Star, MapPin, CheckCircle, Clock, Cake, Gem,
  Sparkles, Users2, Award, Palette, Smile, X, BookMarked, Maximize, Minimize, GripVertical, Search, Target, UserCheck,
  Link as LinkIcon, Handshake, Edit3, ExternalLink, Bot, ShieldQuestion, MessageSquareQuote, Rows3, AppWindow,
  Coffee, Camera, Music, Globe, Compass, Telescope, Crown, Zap, Gift, ArrowRight, Quote, ChevronDown, Moon, Sun,
  Baby, Home, Flame, MessageCircle, Play, Plus, Lightbulb, Mountain
} from "lucide-react";

// Types
import type {
  UserProfile, UserImage as UserImageType, QuestionnaireResponse, FormattedAnswer,
  ServiceType, HeadCoveringType, KippahType
} from "@/types/next-auth";
import { languageOptions } from "@/lib/languageOptions";
import type { Candidate } from "@/app/components/matchmaker/new/types/candidates";

import NewSuggestionForm from "@/app/components/matchmaker/suggestions/NewSuggestionForm";

interface CreateSuggestionData {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  firstPartyId: string;
  secondPartyId: string;
  status:
    | "DRAFT"
    | "PENDING_FIRST_PARTY"
    | "FIRST_PARTY_APPROVED"
    | "FIRST_PARTY_DECLINED"
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

// --- Enhanced Data & Translation Maps ---
const maritalStatusMap: { [key: string]: string } = { 
  single: "רווק/ה 💙", 
  divorced: "גרוש/ה 🌟", 
  widowed: "אלמן/ה 💎", 
  annulled: "מוכן/ה לאהבה חדשה 💫", 
  any: "פתוח/ה לכל האפשרויות ✨" 
};

const religiousLevelMap: { [key: string]: string } = { 
  charedi: "חרדי/ת", 
  charedi_modern: "חרדי/ת מודרני/ת", 
  dati_leumi_torani: "דתי/ה לאומי/ת תורני/ת", 
  dati_leumi_liberal: "דתי/ה לאומי/ת ליברלי/ת", 
  dati_leumi_standard: "דתי/ה לאומי/ת", 
  masorti_strong: "מסורתי/ת (חזק)", 
  masorti_light: "מסורתי/ת (קל)", 
  secular_traditional_connection: "חילוני/ת עם זיקה למסורת", 
  secular: "חילוני/ת", 
  spiritual_not_religious: "רוחני/ת", 
  other: "ייחודי/ת 🌈", 
  "לא משנה": "פתוח/ה לכל השקפה 🌟" 
};

const educationLevelMap: { [key: string]: string } = { 
  high_school: "תיכונית", 
  vocational: "מקצועית", 
  academic_student: "במהלך לימודים", 
  academic_ba: "בוגר/ת תואר ראשון", 
  academic_ma: "בוגר/ת תואר שני", 
  academic_phd: "דוקטור/ת", 
  yeshiva_seminary: "לימודים תורניים", 
  other: "ייחודי/ת", 
  "ללא העדפה": "הכל פתוח 🌟" 
};

const serviceTypeMap: { [key: string]: string } = { 
  MILITARY_COMBATANT: "לוחם/ת צבא", 
  MILITARY_SUPPORT: "תומך/ת לחימה", 
  MILITARY_OFFICER: "קצין/ה", 
  MILITARY_INTELLIGENCE_CYBER_TECH: "טכנולוגיה ומודיעין", 
  NATIONAL_SERVICE_ONE_YEAR: "שירות לאומי", 
  NATIONAL_SERVICE_TWO_YEARS: "שירות לאומי מורחב", 
  HESDER_YESHIVA: "ישיבת הסדר", 
  YESHIVA_ONLY_POST_HS: "לימודים תורניים", 
  PRE_MILITARY_ACADEMY_AND_SERVICE: "מכינה ושירות", 
  EXEMPTED: "פטור", 
  CIVILIAN_SERVICE: "שירות אזרחי", 
  OTHER: "ייחודי 🌟" 
};

const headCoveringMap: { [key: string]: string } = { 
  FULL_COVERAGE: "כיסוי מלא", 
  PARTIAL_COVERAGE: "כיסוי חלקי", 
  HAT_BERET: "כובע/ברט", 
  SCARF_ONLY_SOMETIMES: "מטפחת לאירועים", 
  NONE: "ללא כיסוי", 
  any: "גמיש/ה 🌟" 
};

const kippahTypeMap: { [key: string]: string } = { 
  BLACK_VELVET: "קטיפה שחורה", 
  KNITTED_SMALL: "סרוגה קטנה", 
  KNITTED_LARGE: "סרוגה גדולה", 
  CLOTH: "בד", 
  BRESLEV: "ברסלב", 
  NONE_AT_WORK_OR_CASUAL: "לא בעבודה", 
  NONE_USUALLY: "לרוב לא", 
  OTHER: "ייחודי", 
  any: "גמיש 🌟" 
};

const languageMap = languageOptions.reduce((acc, lang) => { 
  acc[lang.value] = lang.label; 
  return acc; 
}, {} as { [key: string]: string });

const contactPreferenceMap: { [key: string]: string } = { 
  direct: "ישירות 📞", 
  matchmaker: "דרך השדכן/ית 💬", 
  both: "גמיש/ה ✨" 
};

const characterTraitMap: { [key: string]: string } = { 
  empathetic: "אמפתי/ת 💝", 
  driven: "שאפתן/ית 🚀", 
  optimistic: "אופטימי/ת ☀️", 
  family_oriented: "משפחתי/ת 👨‍👩‍👧‍👦", 
  intellectual: "אינטלקטואל/ית 🧠", 
  organized: "מאורגנ/ת 📋", 
  calm: "רגוע/ה 🧘", 
  humorous: "מצחיק/ה 😄", 
  sociable: "חברותי/ת 🤝", 
  sensitive: "רגיש/ה 💙", 
  independent: "עצמאי/ת 💪", 
  creative: "יצירתי/ת 🎨", 
  honest: "כן/ה וישר/ה 💎", 
  responsible: "אחראי/ת 🛡️", 
  easy_going: "זורם/ת וקליל/ה 🌊", 
  no_strong_preference: "פתוח/ה לגילוי 🌟" 
};

const hobbiesMap: { [key: string]: string } = { 
  travel: "טיולים 🗺️", 
  sports: "ספורט 🏃", 
  reading: "קריאה 📚", 
  cooking_baking: "בישול ואפיה 👨‍🍳", 
  music_playing_instrument: "מוזיקה 🎵", 
  art_crafts: "אומנות ויצירה 🎨", 
  volunteering: "התנדבות 🤝", 
  learning_courses: "למידה 📖", 
  board_games_puzzles: "משחקים 🎲", 
  movies_theater: "סרטים ותיאטרון 🎬", 
  dancing: "ריקוד 💃", 
  writing: "כתיבה ✍️", 
  nature_hiking: "טבע וטיולים 🥾", 
  photography: "צילום 📸", 
  no_strong_preference: "פתוח/ה לגילוי יחד 🌟" 
};

// Enhanced World Configuration
const WORLDS: { [key: string]: { label: string; icon: React.ElementType; color: string; description: string } } = { 
  values: { label: "ערכים ועקרונות", icon: BookOpen, color: "emerald", description: "מה מנחה אותי בחיים" }, 
  personality: { label: "אישיות ותכונות", icon: Smile, color: "purple", description: "איך אני באמת" }, 
  relationship: { label: "זוגיות ומשפחה", icon: Heart, color: "rose", description: "מה אני מחפש/ת ברומנטיקה" }, 
  partner: { label: "ציפיות מבן/בת הזוג", icon: Users, color: "blue", description: "תכונות שחשובות לי בפרטנר" }, 
  religion: { label: "דת ורוחניות", icon: BookMarked, color: "amber", description: "המקום של הדת בחיי" },
  general: { label: "שאלות כלליות", icon: FileText, color: "slate", description: "עוד דברים שחשוב לדעת" } 
};

// --- Enhanced Helper Functions ---
const formatEnumValue = (value: string | null | undefined, map: { [key: string]: string }, placeholder: string = "🔍 עוד נגלה יחד..."): string => { 
  if (!value || !map[value]) return placeholder; 
  return map[value]; 
};

const getInitials = (firstName?: string, lastName?: string): string => { 
  let initials = ""; 
  if (firstName && firstName.length > 0) initials += firstName[0]; 
  if (lastName && lastName.length > 0) initials += lastName[0]; 
  if (initials.length === 0 && firstName && firstName.length > 0) { 
    initials = firstName.length > 1 ? firstName.substring(0, 2) : firstName[0]; 
  } 
  return initials.toUpperCase() || "❤️"; 
};

const calculateAge = (birthDate: Date | string | null | undefined): number => { 
  if (!birthDate) return 0; 
  try { 
    const today = new Date(); 
    const birth = new Date(birthDate); 
    if (isNaN(birth.getTime())) return 0; 
    let age = today.getFullYear() - birth.getFullYear(); 
    const monthDiff = today.getMonth() - birth.getMonth(); 
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) { 
      age--; 
    } 
    return age > 0 ? age : 0; 
  } catch (e) { 
    return 0; 
  } 
};

const formatAvailabilityStatus = (status: UserProfile["availabilityStatus"] | undefined) => { 
  switch (status) { 
    case "AVAILABLE": return { text: "זמין/ה להכרות מרגשות 💫", color: "bg-gradient-to-r from-emerald-500 to-green-500", icon: Heart, pulse: true }; 
    case "UNAVAILABLE": return { text: "לא זמין/ה כרגע", color: "bg-gradient-to-r from-gray-400 to-gray-500", icon: Clock, pulse: false }; 
    case "DATING": return { text: "בתהליך היכרות", color: "bg-gradient-to-r from-amber-500 to-orange-500", icon: Coffee, pulse: false }; 
    case "PAUSED": return { text: "בהפסקה זמנית", color: "bg-gradient-to-r from-blue-500 to-cyan-500", icon: Moon, pulse: false }; 
    case "ENGAGED": return { text: "מאורס/ת 💍", color: "bg-gradient-to-r from-pink-500 to-rose-500", icon: Star, pulse: false }; 
    case "MARRIED": return { text: "נשוי/אה 💕", color: "bg-gradient-to-r from-rose-500 to-pink-500", icon: Heart, pulse: false }; 
    default: return { text: "מסתורי/ת... 🌟", color: "bg-gradient-to-r from-purple-500 to-indigo-500", icon: Sparkles, pulse: true }; 
  } 
};

const formatBooleanPreference = (value: boolean | null | undefined, yesLabel: string = "כן ✨", noLabel: string = "לא", notSpecifiedLabel: string = "🔍 נגלה יחד"): string => { 
  if (value === true) return yesLabel; 
  if (value === false) return noLabel; 
  return notSpecifiedLabel; 
};

const formatStringBooleanPreference = (value: string | null | undefined, options: { [key: string]: string } = { yes: "כן ✨", no: "לא", flexible: "גמיש/ה 🌟" }, notSpecifiedLabel: string = "🔍 נגלה יחד"): string => { 
  if (value && options[value.toLowerCase()]) { 
    return options[value.toLowerCase()]; 
  } 
  return notSpecifiedLabel; 
};

// --- Enhanced Helper Components ---

const DetailItem: React.FC<{ 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode; 
  className?: string; 
  iconColorClass?: string; 
  valueClassName?: string; 
  tooltip?: string; 
  highlight?: boolean;
  decorative?: boolean;
}> = ({ icon: Icon, label, value, className, iconColorClass = "text-gray-500", valueClassName, tooltip, highlight = false, decorative = false }) => { 
  const content = ( 
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:shadow-md",
      highlight && "bg-gradient-to-r from-cyan-50 to-purple-50 border border-cyan-200/50",
      decorative && "bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 shadow-sm",
      className
    )}> 
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0 shadow-sm",
        highlight ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white" : "bg-gray-100",
        !highlight && iconColorClass
      )}>
        <Icon className="w-4 h-4" /> 
      </div>
      <div className="min-w-0 flex-1"> 
        <p className={cn(
          "text-xs font-medium mb-1",
          highlight ? "text-cyan-700" : "text-gray-600"
        )}>{label}</p> 
        <p className={cn(
          "text-sm font-semibold break-words leading-relaxed",
          highlight ? "text-purple-800" : "text-gray-800", 
          valueClassName
        )}>{value || "🔍 עוד נגלה יחד..."}</p> 
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
  action?: React.ReactNode; 
  style?: "mystery" | "adventure" | "discovery";
}> = ({ icon: Icon, message, description, className, action, style = "discovery" }) => {
  const styleConfig = {
    mystery: {
      bg: "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50",
      border: "border-purple-200/50",
      iconBg: "bg-gradient-to-r from-purple-400 to-pink-400",
      textColor: "text-purple-700"
    },
    adventure: {
      bg: "bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50",
      border: "border-emerald-200/50",
      iconBg: "bg-gradient-to-r from-emerald-400 to-cyan-400",
      textColor: "text-emerald-700"
    },
    discovery: {
      bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
      border: "border-amber-200/50",
      iconBg: "bg-gradient-to-r from-amber-400 to-orange-400",
      textColor: "text-amber-700"
    }
  };

  const config = styleConfig[style];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed",
      config.bg,
      config.border,
      className
    )}> 
      <div className={cn("p-4 rounded-full mb-4 shadow-lg", config.iconBg)}>
        <Icon className="w-8 h-8 text-white" /> 
      </div>
      <p className={cn("text-base font-bold mb-2", config.textColor)}>{message}</p> 
      {description && <p className="text-sm text-gray-600 mt-1.5 max-w-xs leading-relaxed">{description}</p>} 
      {action && <div className="mt-6">{action}</div>} 
    </div>
  );
};

const SectionCard: React.FC<{ 
  title: string; 
  icon?: React.ElementType; 
  children: React.ReactNode; 
  className?: string; 
  contentClassName?: string; 
  titleClassName?: string; 
  action?: React.ReactNode; 
  description?: string;
  gradient?: boolean;
  highlight?: boolean;
}> = ({ title, icon: Icon, children, className, contentClassName, titleClassName, action, description, gradient = false, highlight = false }) => ( 
  <div className={cn(
    "bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl",
    gradient && "bg-gradient-to-br from-white via-gray-50/30 to-white",
    highlight && "ring-2 ring-cyan-200 ring-opacity-50",
    "border-gray-200/60",
    className
  )}> 
    <div className={cn(
      "flex items-center justify-between gap-3 p-4 border-b bg-gradient-to-r",
      highlight ? "from-cyan-50 via-white to-purple-50 border-cyan-200/50" : "from-gray-50/80 to-white border-gray-200/70",
      titleClassName
    )}> 
      <div className="flex items-center gap-3 min-w-0"> 
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg shadow-sm",
            highlight ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white" : "bg-white border border-gray-200"
          )}>
            <Icon className={cn("w-5 h-5", highlight ? "text-white" : "text-cyan-600")} />
          </div>
        )} 
        <div className="min-w-0"> 
          <h3 className={cn(
            "text-base font-bold truncate",
            highlight ? "text-purple-800" : "text-gray-800"
          )}>{title}</h3> 
          {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>} 
        </div> 
      </div> 
      {action && <div className="ml-auto flex-shrink-0">{action}</div>} 
    </div> 
    <div className={cn("p-4", contentClassName)}>{children}</div> 
  </div> 
);

// --- Enhanced Profile Header ---
const EnhancedProfileHeader: React.FC<{ 
  profile: UserProfile; 
  age: number; 
  mainImageToDisplay: UserImageType | null; 
  availability: ReturnType<typeof formatAvailabilityStatus>;
  viewMode: "matchmaker" | "candidate";
  onSuggestClick: () => void;
  isMobile?: boolean;
}> = ({ profile, age, mainImageToDisplay, availability, viewMode, onSuggestClick, isMobile = false }) => {
  // Generate excitement factors based on profile data
  const excitementFactors = useMemo(() => {
    const factors = [];
    
    if (profile.profileCharacterTraits?.length > 0) {
      const trait = profile.profileCharacterTraits[0];
      factors.push({
        icon: Sparkles,
        text: formatEnumValue(trait, characterTraitMap, trait),
        color: "from-purple-500 to-pink-500"
      });
    }
    
    if (profile.profileHobbies?.length > 0) {
      const hobby = profile.profileHobbies[0];
      factors.push({
        icon: Heart,
        text: formatEnumValue(hobby, hobbiesMap, hobby),
        color: "from-emerald-500 to-cyan-500"
      });
    }
    
    if (profile.city) {
      factors.push({
        icon: MapPin,
        text: `גר/ה ב${profile.city}`,
        color: "from-blue-500 to-indigo-500"
      });
    }
    
    return factors.slice(0, 3);
  }, [profile]);

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-purple-50/30 to-pink-50/20">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative z-10 p-6">
        <div className={cn("flex gap-6", isMobile ? "flex-col items-center text-center" : "flex-row items-start")}>
          {/* Enhanced Profile Image */}
          <div className="relative flex-shrink-0">
            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-cyan-200/50">
              {mainImageToDisplay?.url ? (
                <Image 
                  src={mainImageToDisplay.url} 
                  alt={`תמונת פרופיל של ${profile.user?.firstName || 'מועמד'}`} 
                  fill 
                  className="object-cover" 
                  sizes="128px" 
                  priority 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-200 to-purple-300">
                  <span className="text-4xl font-bold text-white">
                    {getInitials(profile.user?.firstName, profile.user?.lastName)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Status Badge */}
            <div className="absolute -bottom-2 -right-2">
              <Badge className={cn(
                "text-xs px-3 py-1.5 text-white border-0 shadow-lg font-bold",
                availability.color,
                availability.pulse && "animate-pulse"
              )}>
                <availability.icon className="w-3 h-3 ml-1" />
                {availability.text}
              </Badge>
            </div>
          </div>

          {/* Enhanced Profile Info */}
          <div className="flex-grow space-y-4">
            {/* Name and Introduction */}
            <div className={cn(isMobile && "text-center")}>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text tracking-tight mb-2">
                הכירו את {profile.user?.firstName || "מישהו מיוחד"} 
                {profile.user?.lastName && ` ${profile.user.lastName}`}
              </h1>
              
              {age > 0 && (
                <p className="text-xl text-gray-700 font-semibold mb-3">
                  {age} שנים של חיים מלאי הפתעות ✨
                </p>
              )}

              {/* Excitement Factors */}
              {excitementFactors.length > 0 && (
                <div className={cn("flex gap-3 flex-wrap", isMobile ? "justify-center" : "justify-start")}>
                  {excitementFactors.map((factor, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full text-white font-semibold text-sm shadow-lg bg-gradient-to-r",
                        factor.color
                      )}
                    >
                      <factor.icon className="w-4 h-4" />
                      <span>{factor.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.city && (
                <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-cyan-200/50 shadow-sm">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">מיקום</p>
                    <p className="text-sm font-semibold text-gray-800">{profile.city}</p>
                  </div>
                </div>
              )}
              
              {profile.occupation && (
                <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-200/50 shadow-sm">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">עיסוק</p>
                    <p className="text-sm font-semibold text-gray-800">{profile.occupation}</p>
                  </div>
                </div>
              )}
              
              {profile.religiousLevel && (
                <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-purple-200/50 shadow-sm">
                  <BookMarked className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">השקפה</p>
                    <p className="text-sm font-semibold text-gray-800">{formatEnumValue(profile.religiousLevel, religiousLevelMap)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            {viewMode === 'matchmaker' && (
              <div className={cn("pt-2", isMobile ? "text-center" : "text-right")}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-full px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  onClick={onSuggestClick}
                >
                  <Sparkles className="w-5 h-5 ml-2" />
                  הצע התאמה מושלמת
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Inspirational Message */}
        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-gray-700 italic">
            "כל סיפור אהבה מתחיל בהכרות אחת מיוחדת... 💫"
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Enhanced Questionnaire Item ---
const EnhancedQuestionnaireItem: React.FC<{ 
  answer: FormattedAnswer; 
  worldColor?: string; 
}> = ({ answer, worldColor = "slate" }) => {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all duration-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50/30",
      `border-${worldColor}-200/60 hover:border-${worldColor}-300/80`
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0 bg-gradient-to-r text-white",
          worldColor === "emerald" && "from-emerald-400 to-green-500",
          worldColor === "purple" && "from-purple-400 to-violet-500",
          worldColor === "rose" && "from-rose-400 to-pink-500",
          worldColor === "blue" && "from-blue-400 to-cyan-500",
          worldColor === "amber" && "from-amber-400 to-orange-500",
          worldColor === "slate" && "from-slate-400 to-gray-500"
        )}>
          <Quote className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-2 text-gray-800 leading-relaxed">{answer.question}</p>
          <div className={cn(
            "p-3 rounded-lg border-r-4",
            `bg-${worldColor}-50/50 border-${worldColor}-400`
          )}>
            <p className="text-sm text-gray-700 leading-relaxed italic">
              "{answer.displayText || answer.answer}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Profile Card Component ---
interface ProfileCardProps {
  profile: UserProfile;
  images?: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: "matchmaker" | "candidate";
  className?: string;
  candidate?: Candidate;
  allCandidates?: Candidate[];
  onCreateSuggestion?: (data: CreateSuggestionData) => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  candidate,
  images = [], 
  questionnaire, 
  viewMode = "candidate", 
  className,
  allCandidates = [],
  onCreateSuggestion
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedImageForDialog, setSelectedImageForDialog] = useState<UserImageType | null>(null);
  const [activeTab, setActiveTab] = useState("hero");
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [mobileViewLayout, setMobileViewLayout] = useState<'classic' | 'focus'>('focus');
  
  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const orderedImages = useMemo(() => {
    const validImages = (images || []).filter(img => img.url);
    const mainImg = validImages.find(img => img.isMain);
    const otherImages = validImages.filter(img => !img.isMain);
    return mainImg ? [mainImg, ...otherImages] : validImages;
  }, [images]);

  const mainImageToDisplay = useMemo(() => orderedImages.length > 0 ? orderedImages[0] : null, [orderedImages]);
  const age = useMemo(() => calculateAge(profile.birthDate), [profile.birthDate]);
  const availability = useMemo(() => formatAvailabilityStatus(profile.availabilityStatus), [profile.availabilityStatus]);

  const hasDisplayableQuestionnaireAnswers = useMemo(() =>
    questionnaire &&
    questionnaire.formattedAnswers &&
    Object.values(questionnaire.formattedAnswers)
      .flat()
      .some((a) => a.isVisible !== false && (a.answer || a.displayText)),
    [questionnaire]
  );

  const currentDialogImageIndex = useMemo(() => 
    selectedImageForDialog ? orderedImages.findIndex(img => img.id === selectedImageForDialog.id) : -1, 
    [selectedImageForDialog, orderedImages]
  );

  const handleOpenImageDialog = (image: UserImageType) => image.url && setSelectedImageForDialog(image);
  const handleCloseImageDialog = () => setSelectedImageForDialog(null);

  const handleDialogNav = (direction: "next" | "prev") => {
    if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
    const newIndex = (currentDialogImageIndex + (direction === 'next' ? 1 : -1) + orderedImages.length) % orderedImages.length;
    setSelectedImageForDialog(orderedImages[newIndex]);
  };

  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    if (onCreateSuggestion) {
      await onCreateSuggestion(data);
    }
    setIsSuggestDialogOpen(false);
  };

  // Enhanced tab configuration
  const tabItems = useMemo(() => [
    { value: "hero", label: "היכרות ראשונה", icon: Sparkles, activeColor: "cyan", description: "הרושם הראשון הכי חשוב" },
    { value: "about_me", label: "מי אני באמת", icon: User, activeColor: "purple", description: "הסיפור האישי שלי" },
    { value: "background", label: "הרקע שלי", icon: BookOpen, activeColor: "emerald", description: "מאיפה אני בא/ה" },
    { value: "looking_for", label: "מה אני מחפש/ת", icon: Target, activeColor: "rose", description: "החלום שלי לזוגיות" },
    ...(hasDisplayableQuestionnaireAnswers ? [{ 
      value: "questionnaire", 
      label: "עמוק יותר", 
      icon: FileText, 
      activeColor: "amber", 
      description: "תשובות מהלב" 
    }] : []),
    ...(viewMode === "matchmaker" ? [{ 
      value: "matchmaker_info", 
      label: "מידע מקצועי", 
      icon: Lock, 
      activeColor: "indigo", 
      description: "פרטים לשדכן" 
    }] : []),
  ], [hasDisplayableQuestionnaireAnswers, viewMode]);

  const renderPreferenceBadges = (
    label: string, 
    icon: React.ElementType, 
    iconColorClass: string, 
    values: string[] | undefined, 
    badgeColorClass: string, 
    translationMap: { [key: string]: string }
  ) => {
    if (!values || values.length === 0) {
      return (
        <EmptyState
          icon={icon}
          message="פתוח/ה לכל האפשרויות 🌟"
          description="יש כאן מקום לגילויים מרגשים יחד"
          style="adventure"
        />
      );
    }

    const IconComponent = icon;
    return (
      <div className="space-y-3">
        <p className={cn("text-sm font-bold flex items-center gap-2", iconColorClass)}>
          <IconComponent className="w-4 h-4" /> 
          {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {values.map((val) => (
            <Badge 
              key={val} 
              variant="outline" 
              className={cn("text-xs px-3 py-1.5 font-semibold border-2 transition-all hover:scale-105", badgeColorClass)}
            >
              {translationMap[val] || val}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced Main Content Tabs
  const MainContentTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow min-h-0">
      <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl mb-6 shadow-lg border border-gray-200/80 sticky top-0 z-20">
        <ScrollArea dir="rtl" className="w-full">
          <TabsList className="h-auto inline-flex bg-transparent p-1 gap-1">
            {tabItems.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-3 text-xs rounded-xl",
                  "whitespace-nowrap transition-all duration-300",
                  "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50",
                  "min-w-[80px]",
                  activeTab === tab.value && `font-bold text-${tab.activeColor}-600 bg-gradient-to-r from-${tab.activeColor}-50 to-${tab.activeColor}-100 shadow-md ring-2 ring-${tab.activeColor}-200/50`
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {tab.description && activeTab === tab.value && (
                  <span className="text-[10px] text-gray-500 leading-tight text-center max-w-[70px]">
                    {tab.description}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="space-y-6 focus:outline-none flex-grow min-h-0">
        {/* Hero Tab - The main attraction */}
        <TabsContent value="hero" className="mt-0">
          <div className="space-y-8">
            {/* Main Hero Section */}
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
              <div className="relative p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Image Section */}
                  <div className="relative">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/50">
                      {mainImageToDisplay?.url ? (
                        <Image 
                          src={mainImageToDisplay.url} 
                          alt={`${profile.user?.firstName || 'מועמד'} נראה/ת מדהים/ה`}
                          fill 
                          className="object-cover transition-transform duration-700 hover:scale-105" 
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-200 via-purple-300 to-pink-200 flex items-center justify-center">
                          <div className="text-center text-white">
                            <User className="w-24 h-24 mx-auto mb-4 opacity-80" />
                            <p className="text-xl font-bold">התמונה המושלמת</p>
                            <p className="text-sm opacity-80">מחכה להיחשף 📸</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Floating badges */}
                      <div className="absolute top-4 right-4 space-y-2">
                        {profile.gender === "FEMALE" && (
                          <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
                            <Crown className="w-3 h-3 ml-1" />
                            נסיכה
                          </Badge>
                        )}
                        {profile.gender === "MALE" && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
                            <Zap className="w-3 h-3 ml-1" />
                            נסיך
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-6">
                    <div className="text-center lg:text-right">
                      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text leading-tight">
                        {profile.user?.firstName || "מישהו מדהים"} ✨
                      </h1>
                      
                      {age > 0 && (
                        <p className="text-2xl text-gray-700 font-bold mb-6">
                          {age} שנים של חיים מלאי הפתעות והרפתקאות 🌟
                        </p>
                      )}

                      {profile.about ? (
                        <div className="relative p-6 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl border border-cyan-200/50 shadow-lg">
                          <Quote className="absolute top-2 right-2 w-8 h-8 text-cyan-300" />
                          <p className="text-lg text-gray-800 leading-relaxed italic font-medium">
                            "{profile.about}"
                          </p>
                          <Quote className="absolute bottom-2 left-2 w-8 h-8 text-purple-300 transform rotate-180" />
                        </div>
                      ) : (
                        <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
                          <Telescope className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                          <p className="text-lg font-bold text-amber-800 mb-2">יש כאן הרבה לגלות! 🔍</p>
                          <p className="text-amber-700">הסיפור האישי מחכה להיכתב יחד איתך...</p>
                        </div>
                      )}
                    </div>

                    {/* Quick highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.city && (
                        <DetailItem
                          icon={MapPin}
                          label="המקום הכי טוב בעולם"
                          value={`${profile.city} 🏠`}
                          highlight={true}
                          decorative={true}
                        />
                      )}
                      
                      {profile.occupation && (
                        <DetailItem
                          icon={Briefcase}
                          label="התחום המרגש"
                          value={`${profile.occupation} 💼`}
                          highlight={true}
                          decorative={true}
                        />
                      )}
                      
                      {profile.religiousLevel && (
                        <DetailItem
                          icon={BookMarked}
                          label="השקפת עולם"
                          value={formatEnumValue(profile.religiousLevel, religiousLevelMap)}
                          highlight={true}
                          decorative={true}
                        />
                      )}
                      
                      {profile.education && (
                        <DetailItem
                          icon={GraduationCap}
                          label="הרקע האקדמי"
                          value={profile.education}
                          highlight={true}
                          decorative={true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Character traits and hobbies showcase */}
            {(profile.profileCharacterTraits?.length > 0 || profile.profileHobbies?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard 
                  title="תכונות הזהב שלי" 
                  icon={Sparkles}
                  gradient={true}
                  highlight={true}
                >
                  <div className="flex flex-wrap gap-3">
                    {profile.profileCharacterTraits?.length > 0 ? 
                      profile.profileCharacterTraits.map(trait => (
                        <Badge 
                          key={trait} 
                          className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 font-semibold text-sm hover:scale-105 transition-transform shadow-sm"
                        >
                          {formatEnumValue(trait, characterTraitMap, trait)}
                        </Badge>
                      )) : 
                      <EmptyState 
                        icon={Sparkles} 
                        message="תכונות מיוחדות מחכות לגילוי" 
                        style="mystery"
                        className="py-8" 
                      />
                    }
                  </div>
                </SectionCard>

                <SectionCard 
                  title="מה אני אוהב/ת לעשות" 
                  icon={Heart}
                  gradient={true}
                  highlight={true}
                >
                  <div className="flex flex-wrap gap-3">
                    {profile.profileHobbies?.length > 0 ? 
                      profile.profileHobbies.map(hobby => (
                        <Badge 
                          key={hobby} 
                          className="px-3 py-2 bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800 border border-emerald-200 font-semibold text-sm hover:scale-105 transition-transform shadow-sm"
                        >
                          {formatEnumValue(hobby, hobbiesMap, hobby)}
                        </Badge>
                      )) : 
                      <EmptyState 
                        icon={Heart} 
                        message="הרפתקאות מחכות לנו יחד" 
                        style="adventure"
                        className="py-8" 
                      />
                    }
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Call to action */}
            <div className="text-center p-8 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-4">מוכנים להכיר את {profile.user?.firstName || "המועמד המושלם"}? 💫</h3>
              <p className="text-lg mb-6 opacity-90">עוד המון דברים מעניינים מחכים לגילוי...</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => setActiveTab('about_me')}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <User className="w-5 h-5 ml-2" />
                  בואו נכיר לעומק
                </Button>
                <Button 
                  onClick={() => setActiveTab('looking_for')}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-purple-600 font-bold px-6 py-3 rounded-full"
                >
                  <Target className="w-5 h-5 ml-2" />
                  מה הם מחפשים
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* About Me Tab */}
        <TabsContent value="about_me" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-4">
              הסיפור האמיתי של {profile.user?.firstName || "המועמד"} 📖
            </h2>
            <p className="text-gray-600 text-lg">הכירו את האדם שמאחורי הפרופיל</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard 
              title="התכונות המיוחדות שלי" 
              icon={Sparkles}
              description="מה שעושה אותי אותי"
              highlight={true}
            >
              <div className="flex flex-wrap gap-3">
                {profile.profileCharacterTraits?.length > 0 ? 
                  profile.profileCharacterTraits.map(trait => (
                    <Badge 
                      key={trait} 
                      className="px-3 py-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200 font-semibold"
                    >
                      {formatEnumValue(trait, characterTraitMap, trait)}
                    </Badge>
                  )) : 
                  <EmptyState 
                    icon={Sparkles} 
                    message="יש בי עוד הרבה לגלות..." 
                    description="התכונות המיוחדות שלי יתגלו בהכרות 💎"
                    style="mystery"
                  />
                }
              </div>
            </SectionCard>

            <SectionCard 
              title="מה שאני אוהב/ת לעשות" 
              icon={Palette}
              description="התחביבים והתשוקות שלי"
              highlight={true}
            >
              <div className="flex flex-wrap gap-3">
                {profile.profileHobbies?.length > 0 ? 
                  profile.profileHobbies.map(hobby => (
                    <Badge 
                      key={hobby} 
                      className="px-3 py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 font-semibold"
                    >
                      {formatEnumValue(hobby, hobbiesMap, hobby)}
                    </Badge>
                  )) : 
                  <EmptyState 
                    icon={Mountain} 
                    message="הרפתקאות מחכות לנו יחד!" 
                    description="נגלה ביחד מה אנחנו אוהבים לעשות 🌟"
                    style="adventure"
                  />
                }
              </div>
            </SectionCard>
          </div>

          <SectionCard 
            title="הרקע המשפחתי שלי" 
            icon={Users2}
            description="המשפחה המדהימה שמאחוריי"
            className="col-span-full"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem 
                icon={Users2} 
                label="סטטוס ההורים" 
                value={profile.parentStatus || "🔍 נגלה יחד"} 
                decorative={true}
              />
              <DetailItem 
                icon={Users} 
                label="אחים ואחיות" 
                value={profile.siblings ? `${profile.siblings} אחים/אחיות 👨‍👩‍👧‍👦` : "🔍 נגלה יחד"} 
                decorative={true}
              />
              <DetailItem 
                icon={Crown} 
                label="המקום במשפחה" 
                value={profile.position ? `מקום ${profile.position} 👑` : "🔍 נגלה יחד"} 
                decorative={true}
              />
              
              {profile.aliyaCountry && (
                <DetailItem 
                  icon={Globe} 
                  label="ארץ המוצא" 
                  value={`${profile.aliyaCountry} 🌍`} 
                  decorative={true}
                />
              )}
              
              {profile.aliyaYear && (
                <DetailItem 
                  icon={Calendar} 
                  label="שנת העלייה" 
                  value={`${profile.aliyaYear} ✈️`} 
                  decorative={true}
                />
              )}
              
              {profile.additionalLanguages && profile.additionalLanguages.length > 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <DetailItem 
                    icon={Languages} 
                    label="שפות שאני מדבר/ת" 
                    value={
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.additionalLanguages.map(lang => (
                          <Badge 
                            key={lang} 
                            className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200"
                          >
                            {formatEnumValue(lang, languageMap)} 🗣️
                          </Badge>
                        ))}
                      </div>
                    } 
                    decorative={true}
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Background Tab */}
        <TabsContent value="background" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text mb-4">
              הרקע והדרך של {profile.user?.firstName || "המועמד"} 🎓
            </h2>
            <p className="text-gray-600 text-lg">השורשים והערכים שעיצבו אותי</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard 
              title="דת ורוחניות" 
              icon={BookMarked}
              description="המקום של האמונה בחיי"
              highlight={true}
            >
              <div className="space-y-4">
                <DetailItem 
                  icon={BookMarked} 
                  label="השקפת העולם שלי" 
                  value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} 
                  highlight={true}
                />
                <DetailItem 
                  icon={Heart} 
                  label="שמירת נגיעה" 
                  value={formatBooleanPreference(profile.shomerNegiah)} 
                  decorative={true}
                />
                
                {profile.gender === "FEMALE" && (
                  <DetailItem 
                    icon={Crown} 
                    label="כיסוי ראש" 
                    value={formatEnumValue(profile.headCovering, headCoveringMap)} 
                    decorative={true}
                  />
                )}
                
                {profile.gender === "MALE" && (
                  <DetailItem 
                    icon={Crown} 
                    label="סוג כיפה" 
                    value={formatEnumValue(profile.kippahType, kippahTypeMap)} 
                    decorative={true}
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard 
              title="השכלה ותעסוקה" 
              icon={GraduationCap}
              description="הדרך המקצועית והאקדמית"
              highlight={true}
            >
              <div className="space-y-4">
                <DetailItem 
                  icon={GraduationCap} 
                  label="רמת ההשכלה" 
                  value={formatEnumValue(profile.educationLevel, educationLevelMap)} 
                  highlight={true}
                />
                
                {profile.education && (
                  <DetailItem 
                    icon={BookOpen} 
                    label="פירוט הלימודים" 
                    value={profile.education} 
                    decorative={true}
                    valueClassName="whitespace-pre-wrap"
                  />
                )}
                
                <DetailItem 
                  icon={Briefcase} 
                  label="התחום המקצועי" 
                  value={profile.occupation || "🔍 מקצוע מעניין מחכה לגילוי"} 
                  decorative={true}
                />
                
                <DetailItem 
                  icon={Award} 
                  label="השירות הצבאי/לאומי" 
                  value={formatEnumValue(profile.serviceType, serviceTypeMap)} 
                  decorative={true}
                />
                
                {profile.serviceDetails && (
                  <DetailItem 
                    icon={InfoIcon} 
                    label="פרטי השירות" 
                    value={profile.serviceDetails} 
                    decorative={true}
                    valueClassName="whitespace-pre-wrap"
                  />
                )}
              </div>
            </SectionCard>
          </div>

          {/* Native language highlight if available */}
          {profile.nativeLanguage && (
            <SectionCard 
              title="השפה הראשונה שלי" 
              icon={Languages}
              className="text-center"
            >
              <div className="flex justify-center">
                <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
                  {formatEnumValue(profile.nativeLanguage, languageMap)} 🗣️
                </Badge>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* Looking For Tab */}
        <TabsContent value="looking_for" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text mb-4">
              החלום שלי לזוגיות 💕
            </h2>
            <p className="text-gray-600 text-lg">מה אני מחפש/ת בבן/בת הזוג המושלמ/ת</p>
          </div>

          <SectionCard 
            title="הציפיות שלי מבן/בת הזוג" 
            icon={Target}
            description="התכונות והערכים שחשובים לי"
            highlight={true}
          >
            <div className="space-y-6">
              {/* Age and Height Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                  <DetailItem 
                    icon={Calendar} 
                    label="טווח הגילאים המועדף" 
                    value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים 🎂`} 
                    highlight={true}
                  />
                )}
                
                {(profile.preferredHeightMin || profile.preferredHeightMax) && (
                  <DetailItem 
                    icon={User} 
                    label="טווח הגבהים המועדף" 
                    value={`${profile.preferredHeightMin || '?'} - ${profile.preferredHeightMax || '?'} ס״מ 📏`} 
                    highlight={true}
                  />
                )}
                
                <DetailItem 
                  icon={Heart} 
                  label="שמירת נגיעה" 
                  value={formatStringBooleanPreference(profile.preferredShomerNegiah)} 
                  decorative={true}
                  tooltip="העדפה לגבי שמירת נגיעה"
                />
                
                <DetailItem 
                  icon={Baby} 
                  label="ילדים מקשר קודם" 
                  value={formatBooleanPreference(profile.preferredHasChildrenFromPrevious, "מקבל/ת בברכה 👶", "מעדיף/ה בלי", "🔍 נגלה יחד")} 
                  decorative={true}
                  tooltip="העדפה לגבי ילדים מקשר קודם"
                />
              </div>

              {/* Preference Categories */}
              <div className="space-y-6">
                {renderPreferenceBadges(
                  "סטטוסים משפחתיים מועדפים 💑", 
                  Heart, 
                  "text-rose-600", 
                  profile.preferredMaritalStatuses, 
                  "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border-rose-300", 
                  maritalStatusMap
                )}
                
                {renderPreferenceBadges(
                  "רמות דתיות מועדפות 📿", 
                  BookMarked, 
                  "text-indigo-600", 
                  profile.preferredReligiousLevels, 
                  "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-300", 
                  religiousLevelMap
                )}
                
                {renderPreferenceBadges(
                  "רמות השכלה מועדפות 🎓", 
                  GraduationCap, 
                  "text-blue-600", 
                  profile.preferredEducation, 
                  "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300", 
                  educationLevelMap
                )}
                
                {renderPreferenceBadges(
                  "תחומי עיסוק מועדפים 💼", 
                  Briefcase, 
                  "text-emerald-600", 
                  profile.preferredOccupations, 
                  "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300", 
                  {}
                )}
                
                {renderPreferenceBadges(
                  "מקומות מגורים מועדפים 🏠", 
                  MapPin, 
                  "text-cyan-600", 
                  profile.preferredLocations, 
                  "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-cyan-300", 
                  {}
                )}
              </div>

              {/* Personal message about preferences */}
              {profile.matchingNotes ? (
                <div className="mt-6 p-6 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
                  <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    המחשבות שלי על ההתאמה המושלמת:
                  </h4>
                  <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic">
                    "{profile.matchingNotes}"
                  </p>
                </div>
              ) : (
                <EmptyState
                  icon={Lightbulb}
                  message="החלום שלי לזוגיות עדיין נכתב..."
                  description="אבל אני בטוח/ה שנגלה יחד מה מתאים לנו בדיוק! 💫"
                  style="mystery"
                />
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Enhanced Questionnaire Tab */}
        {hasDisplayableQuestionnaireAnswers && (
          <TabsContent value="questionnaire" className="mt-0 space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text mb-4">
                התשובות מהלב של {profile.user?.firstName || "המועמד"} 💭
              </h2>
              <p className="text-gray-600 text-lg">מחשבות עמוקות ותובנות אישיות</p>
            </div>

            {Object.entries(WORLDS).map(([worldKey, worldConfig]) => {
              const answersForWorld = (questionnaire?.formattedAnswers?.[worldKey as keyof typeof questionnaire.formattedAnswers] ?? [])
                .filter(answer => answer.isVisible !== false && (answer.answer || answer.displayText));

              if (answersForWorld.length === 0) return null;

              return (
                <SectionCard
                  key={worldKey}
                  title={worldConfig.label}
                  icon={worldConfig.icon}
                  description={worldConfig.description}
                  titleClassName={cn(`bg-gradient-to-r from-${worldConfig.color}-50 to-${worldConfig.color}-100 border-${worldConfig.color}-200`)}
                  className="overflow-hidden"
                  highlight={true}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {answersForWorld.map(answer => (
                      <EnhancedQuestionnaireItem 
                        key={answer.questionId} 
                        answer={answer} 
                        worldColor={worldConfig.color} 
                      />
                    ))}
                  </div>
                </SectionCard>
              );
            })}
          </TabsContent>
        )}

        {/* Matchmaker Info Tab */}
        {viewMode === "matchmaker" && (
          <TabsContent value="matchmaker_info" className="mt-0">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-4">
                מידע מקצועי לשדכן 🔒
              </h2>
              <p className="text-gray-600 text-lg">פרטים רגישים וחשובים לתהליך השידוך</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300/70 rounded-2xl shadow-xl p-6 space-y-6">
              <div className="flex items-center gap-3 text-amber-800 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">מידע סודי לשדכנים בלבד</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem 
                  icon={Phone} 
                  label="העדפת יצירת קשר" 
                  value={formatEnumValue(profile.contactPreference, contactPreferenceMap, "🔍 נגלה יחד")} 
                  decorative={true}
                  iconColorClass="text-amber-600" 
                />
                
                <DetailItem 
                  icon={Users} 
                  label="העדפת מגדר שדכן/ית" 
                  value={profile.preferredMatchmakerGender ? 
                    (profile.preferredMatchmakerGender === "MALE" ? "שדכן גבר 👨" : "שדכנית אישה 👩") : 
                    "🔍 אין העדפה מיוחדת"
                  } 
                  decorative={true}
                  iconColorClass="text-amber-600" 
                />
              </div>

              {profile.matchingNotes && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                    <Edit3 className="w-5 h-5" /> 
                    הערות מיוחדות לשדכנים:
                  </h4>
                  <div className="p-4 bg-amber-100/70 rounded-xl border border-amber-200/80 shadow-inner">
                    <p className="text-amber-800 whitespace-pre-wrap leading-relaxed font-medium">
                      {profile.matchingNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional professional insights */}
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  תובנות מקצועיות:
                </h4>
                <ul className="text-indigo-700 space-y-1 text-sm">
                  <li>• פרופיל מולא ב-{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('he-IL') : 'תאריך לא ידוע'}</li>
                  {profile.lastActive && (
                    <li>• פעילות אחרונה: {new Date(profile.lastActive).toLocaleDateString('he-IL')}</li>
                  )}
                  <li>• רמת השלמת פרופיל: {profile.isProfileComplete ? 'מושלם ✅' : 'דורש השלמה ⚠️'}</li>
                  <li>• סטטוס זמינות: {availability.text}</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        )}
      </div>
    </Tabs>
  );

  // Enhanced Image Gallery for Mobile
  const EnhancedMobileImageGallery = () => (
    orderedImages.length > 0 && (
      <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-cyan-50/50 via-purple-50/30 to-pink-50/50">
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            הגלריה של {profile.user?.firstName || "המועמד"} 📸
          </h3>
          <p className="text-sm text-gray-600">לחץ על תמונה להגדלה</p>
        </div>
        <ScrollArea dir="rtl" className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {orderedImages.map((image, idx) => (
              <div 
                key={image.id} 
                className="relative w-32 h-44 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                onClick={() => handleOpenImageDialog(image)}
              >
                <Image 
                  src={image.url} 
                  alt={`תמונה מדהימה ${idx+1}`} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  sizes="128px" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {image.isMain && (
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold gap-1 px-2 py-1 shadow-lg">
                    <Star className="w-2.5 h-2.5 fill-current" /> 
                    ראשי
                  </Badge>
                )}
                
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <p className="text-white text-xs font-medium drop-shadow-lg">
                    תמונה {idx + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  );

  // Mobile Header with enhanced toggle
  const EnhancedMobileHeader = () => (
    <div className="p-3 flex-shrink-0 flex justify-center items-center bg-gradient-to-r from-cyan-50/80 via-purple-50/50 to-pink-50/80 border-b border-gray-200 sticky top-0 z-30 backdrop-blur-md">
      <ToggleGroup 
        type="single" 
        value={mobileViewLayout} 
        onValueChange={(value: 'classic' | 'focus') => { if (value) setMobileViewLayout(value); }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-1"
      >
        <ToggleGroupItem 
          value="focus" 
          aria-label="Focus view" 
          className="rounded-xl px-4 py-2 data-[state=on]:bg-gradient-to-r data-[state=on]:from-cyan-500 data-[state=on]:to-purple-500 data-[state=on]:text-white transition-all duration-300"
        >
          <Sparkles className="h-4 w-4" /> 
          <span className="mr-2 text-sm font-medium">היכרות</span> 
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="classic" 
          aria-label="Classic view" 
          className="rounded-xl px-4 py-2 data-[state=on]:bg-gradient-to-r data-[state=on]:from-emerald-500 data-[state=on]:to-cyan-500 data-[state=on]:text-white transition-all duration-300"
        >
          <FileText className="h-4 w-4" /> 
          <span className="mr-2 text-sm font-medium">מפורט</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  // Enhanced Mobile Layouts
  const ClassicMobileLayout = () => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <EnhancedProfileHeader 
        profile={profile} 
        age={age} 
        mainImageToDisplay={mainImageToDisplay} 
        availability={availability}
        viewMode={viewMode}
        onSuggestClick={() => setIsSuggestDialogOpen(true)}
        isMobile={true}
      />
      <EnhancedMobileImageGallery />
      <div className="p-4 bg-gradient-to-br from-gray-50/50 to-white">
        <MainContentTabs />
      </div>
    </div>
  );

  const FocusMobileLayout = () => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <EnhancedProfileHeader 
        profile={profile} 
        age={age} 
        mainImageToDisplay={mainImageToDisplay} 
        availability={availability}
        viewMode={viewMode}
        onSuggestClick={() => setIsSuggestDialogOpen(true)}
        isMobile={true}
      />
      <EnhancedMobileImageGallery />
      
      {/* Focus content - simplified but beautiful */}
      <div className="p-4 space-y-6 bg-gradient-to-br from-gray-50/50 to-white">
        {/* About section */}
        {profile.about ? (
          <SectionCard title="קצת עליי" icon={Heart} highlight={true}>
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-xl border border-cyan-200/50">
              <p className="text-gray-800 leading-relaxed italic font-medium">
                "{profile.about}"
              </p>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="הסיפור שלי" icon={Telescope} highlight={true}>
            <EmptyState
              icon={Telescope}
              message="יש כאן הרבה לגלות! 🔍"
              description="הסיפור האישי מחכה להיכתב יחד איתך..."
              style="mystery"
            />
          </SectionCard>
        )}

        {/* Quick summary */}
        <SectionCard title="תמצית מהירה" icon={Zap} highlight={true}>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem 
              icon={BookMarked} 
              label="השקפה" 
              value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} 
              decorative={true}
            />
            <DetailItem 
              icon={Heart} 
              label="שמירת נגיעה" 
              value={formatBooleanPreference(profile.shomerNegiah)} 
              decorative={true}
            />
            <DetailItem 
              icon={Briefcase} 
              label="עיסוק" 
              value={profile.occupation || "🔍 נגלה יחד"} 
              decorative={true}
            />
            <DetailItem 
              icon={GraduationCap} 
              label="השכלה" 
              value={formatEnumValue(profile.educationLevel, educationLevelMap)} 
              decorative={true}
            />
          </div>
        </SectionCard>

        {/* Traits and hobbies */}
        {(profile.profileCharacterTraits?.length > 0 || profile.profileHobbies?.length > 0) && (
          <SectionCard title="מה מיוחד בי" icon={Sparkles} highlight={true}>
            <div className="space-y-4">
              {profile.profileCharacterTraits?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-purple-700 mb-2">התכונות שלי:</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileCharacterTraits.slice(0, 4).map(trait => (
                      <Badge 
                        key={trait} 
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200 text-xs"
                      >
                        {formatEnumValue(trait, characterTraitMap, trait)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.profileHobbies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-700 mb-2">מה אני אוהב/ת:</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileHobbies.slice(0, 4).map(hobby => (
                      <Badge 
                        key={hobby} 
                        className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 text-xs"
                      >
                        {formatEnumValue(hobby, hobbiesMap, hobby)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* What they're looking for */}
        <SectionCard title="מה אני מחפש/ת" icon={Target} highlight={true}>
          {profile.matchingNotes ? (
            <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50">
              <p className="text-rose-700 leading-relaxed italic font-medium">
                "{profile.matchingNotes}"
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              message="החלום שלי לזוגיות עדיין נכתב..."
              description="אבל בטוח שנגלה יחד מה מתאים לנו! 💫"
              style="adventure"
            />
          )}
          
          {/* Age preference */}
          {(profile.preferredAgeMin || profile.preferredAgeMax) && (
            <div className="mt-4">
              <DetailItem 
                icon={Calendar} 
                label="טווח גילאים מועדף" 
                value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים 🎂`} 
                decorative={true}
              />
            </div>
          )}
        </SectionCard>

        {/* Call to action */}
        <div className="text-center p-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-xl">
          <h3 className="text-xl font-bold mb-3">רוצים לדעת עוד? 💫</h3>
          <p className="mb-4 opacity-90">עוד המון דברים מעניינים מחכים לגילוי...</p>
          <Button 
            onClick={() => setMobileViewLayout('classic')}
            className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-6 py-3 rounded-full shadow-lg"
          >
            <Eye className="w-5 h-5 ml-2" />
            בואו נכיר לעומק
          </Button>
        </div>
      </div>
    </div>
  );

  // Loading state with enhanced skeleton
  if (!isClient) {
    return (
      <Card dir="rtl" className={cn("w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col h-full", className)}>
        <div className="p-6 bg-gradient-to-r from-cyan-50 to-purple-50 border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
            <div className="flex-grow w-full space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 flex-grow">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
      <Card 
        dir="rtl" 
        id="profile-card-container" 
        className={cn(
          "w-full shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col max-h-[calc(100vh-2rem)] h-full relative",
          "bg-gradient-to-br from-white via-gray-50/30 to-white",
          className
        )}
      >
        {isDesktop ? (
          <ResizablePanelGroup direction="horizontal" dir="rtl" className="flex-grow min-h-0">
            <ResizablePanel defaultSize={60} minSize={40} className="min-w-0 flex flex-col">
              <EnhancedProfileHeader 
                profile={profile} 
                age={age} 
                mainImageToDisplay={mainImageToDisplay} 
                availability={availability} 
                viewMode={viewMode}
                onSuggestClick={() => setIsSuggestDialogOpen(true)}
              />
              <ScrollArea className="flex-grow min-h-0">
                <div className="p-6">
                  <MainContentTabs />
                </div>
              </ScrollArea>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-gradient-to-b from-cyan-200 to-purple-200 hover:from-cyan-300 hover:to-purple-300 transition-all duration-300" />
            
            <ResizablePanel defaultSize={40} minSize={25} className="min-w-0 flex flex-col">
              <ScrollArea className="flex-grow min-h-0">
                <div className="p-6 space-y-6">
                  {/* Enhanced Images Section */}
                  <SectionCard 
                    title="הגלריה האישית" 
                    icon={Camera}
                    description="התמונות שמספרות את הסיפור"
                    highlight={true}
                  >
                    {orderedImages.length > 0 ? (
                      <div className="space-y-4">
                        <div 
                          className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300" 
                          onClick={() => handleOpenImageDialog(orderedImages[0])}
                        >
                          <Image 
                            src={orderedImages[0].url} 
                            alt="תמונה ראשית מדהימה" 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-105" 
                            sizes="35vw" 
                            priority 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <Eye className="w-8 h-8 mx-auto mb-2" />
                              <p className="font-bold">לחץ להגדלה</p>
                            </div>
                          </div>
                        </div>
                        
                        {orderedImages.length > 1 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {orderedImages.slice(1, 7).map(img => (
                              <div 
                                key={img.id} 
                                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-cyan-400 transition-all duration-300 shadow-md hover:shadow-lg" 
                                onClick={() => handleOpenImageDialog(img)}
                              >
                                <Image 
                                  src={img.url} 
                                  alt="תמונת פרופיל נוספת" 
                                  fill 
                                  className="object-cover hover:scale-110 transition-transform duration-300" 
                                  sizes="15vw" 
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Camera} 
                        message="התמונות בדרך אלינו..." 
                        description="הגלריה האישית מחכה להיחשף 📸"
                        style="mystery"
                      />
                    )}
                  </SectionCard>

                  {/* Enhanced Quick Summary */}
                  <SectionCard 
                    title="הנקודות החמות" 
                    icon={Flame}
                    description="מה שחשוב לדעת ברגע הראשון"
                    highlight={true}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <DetailItem 
                        icon={BookMarked} 
                        label="השקפת עולם" 
                        value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} 
                        highlight={true}
                      />
                      <DetailItem 
                        icon={Heart} 
                        label="שמירת נגיעה" 
                        value={formatBooleanPreference(profile.shomerNegiah)} 
                        decorative={true}
                      />
                      <DetailItem 
                        icon={Briefcase} 
                        label="התחום המקצועי" 
                        value={profile.occupation || "🔍 מקצוע מעניין מחכה לגילוי"} 
                        decorative={true}
                      />
                      <DetailItem 
                        icon={GraduationCap} 
                        label="רמת השכלה" 
                        value={formatEnumValue(profile.educationLevel, educationLevelMap)} 
                        decorative={true}
                      />
                      <DetailItem 
                        icon={MapPin} 
                        label="מיקום" 
                        value={profile.city || "🔍 איפה שהלב נמצא"} 
                        decorative={true}
                      />
                      
                      {profile.maritalStatus && ["divorced", "widowed", "annulled"].includes(profile.maritalStatus) && (
                        <DetailItem 
                          icon={Baby} 
                          label="ילדים מקשר קודם" 
                          value={formatBooleanPreference(profile.hasChildrenFromPrevious, "יש ילדים 👶", "אין ילדים", "🔍 נגלה יחד")} 
                          decorative={true}
                        />
                      )}
                    </div>
                  </SectionCard>

                  {/* Enhanced About Section */}
                  <SectionCard 
                    title="הסיפור שמאחורי הפרופיל" 
                    icon={Quote}
                    description="מילים מהלב"
                    highlight={true}
                  >
                    {profile.about ? (
                      <div className="p-4 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-xl border border-cyan-200/50 shadow-inner">
                        <Quote className="w-6 h-6 text-cyan-400 mb-2" />
                        <p className="text-gray-800 leading-relaxed italic font-medium">
                          {profile.about}
                        </p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Telescope}
                        message="הסיפור מחכה להיכתב..."
                        description="יש כאן אדם מעניין שמחכה לגילוי! 🌟"
                        style="discovery"
                      />
                    )}
                  </SectionCard>
                  
                  {/* Enhanced Looking For Section */}
                  <SectionCard 
                    title="החלום לזוגיות" 
                    icon={Target}
                    description="מה מחכה למי שיבוא"
                    highlight={true}
                  >
                    {profile.matchingNotes ? (
                      <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50 shadow-inner">
                        <Heart className="w-6 h-6 text-rose-400 mb-2" />
                        <p className="text-rose-700 leading-relaxed italic font-medium">
                          {profile.matchingNotes}
                        </p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Heart}
                        message="החלום עדיין נכתב..."
                        description="אבל בטוח שזה יהיה משהו יפה! 💕"
                        style="adventure"
                      />
                    )}
                    
                    <div className="mt-4 space-y-3">
                      {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                        <DetailItem 
                          icon={Calendar} 
                          label="טווח גילאים מועדף" 
                          value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים 🎂`} 
                          decorative={true}
                        />
                      )}
                      
                      {profile.preferredReligiousLevels && profile.preferredReligiousLevels.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                            <BookMarked className="w-4 h-4" />
                            רמות דתיות מועדפות:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferredReligiousLevels.slice(0, 3).map(level => (
                              <Badge 
                                key={level} 
                                className="text-xs px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200"
                              >
                                {formatEnumValue(level, religiousLevelMap, level)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex flex-col h-full w-full">
            <EnhancedMobileHeader />
            {mobileViewLayout === 'classic' ? <ClassicMobileLayout /> : <FocusMobileLayout />}
          </div>
        )}

        {/* Enhanced Image Dialog */}
        {selectedImageForDialog && (
          <Dialog open={!!selectedImageForDialog} onOpenChange={isOpen => !isOpen && handleCloseImageDialog()}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 backdrop-blur-md border-none rounded-2xl flex flex-col" dir="rtl">
              <DialogHeader className="p-4 text-white flex-row justify-between items-center border-b border-gray-700/50 bg-black/80 backdrop-blur-sm">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  תמונה {currentDialogImageIndex + 1} מתוך {orderedImages.length}
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all" 
                  onClick={handleCloseImageDialog}
                >
                  <X className="w-5 h-5" />
                </Button>
              </DialogHeader>
              
              <div className="relative flex-1 w-full min-h-0">
                <Image 
                  key={selectedImageForDialog.id} 
                  src={selectedImageForDialog.url} 
                  alt={`תמונה מוגדלת ${currentDialogImageIndex + 1}`} 
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-14 w-14 rounded-full border border-white/20 backdrop-blur-sm transition-all hover:scale-110" 
                      onClick={() => handleDialogNav("prev")}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-14 w-14 rounded-full border border-white/20 backdrop-blur-sm transition-all hover:scale-110" 
                      onClick={() => handleDialogNav("next")}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
              
              {orderedImages.length > 1 && (
                <DialogFooter className="border-t border-gray-700/50 bg-black/80 backdrop-blur-sm p-0">
                  <ScrollArea dir="rtl" className="w-full">
                    <div className="flex gap-2 p-3 justify-center">
                      {orderedImages.map(img => (
                        <div 
                          key={img.id} 
                          className={cn(
                            "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105", 
                            img.id === selectedImageForDialog.id 
                              ? "border-cyan-400 ring-2 ring-cyan-400/50" 
                              : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/40"
                          )} 
                          onClick={() => setSelectedImageForDialog(img)}
                        >
                          <Image 
                            src={img.url} 
                            alt="תמונה קטנה" 
                            fill 
                            className="object-cover" 
                            sizes="64px" 
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
        
        {/* Suggestion Form Dialog */}
        {viewMode === 'matchmaker' && candidate && (
          <NewSuggestionForm
            isOpen={isSuggestDialogOpen}
            onClose={() => setIsSuggestDialogOpen(false)}
            candidates={allCandidates}
            selectedCandidate={candidate} 
            onSubmit={handleCreateSuggestion}
          />
        )}
      </Card>
    </TooltipProvider>
  );
};

export default ProfileCard;