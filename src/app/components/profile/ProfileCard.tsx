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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

// Icons
import {
  User, Heart, FileText, Image as ImageIcon, Info as InfoIcon, Eye, Phone, 
  ChevronLeft, ChevronRight, Briefcase, GraduationCap, Users, BookOpen, 
  School, Lock, Languages, Calendar, Star, MapPin, CheckCircle, Clock, 
  Cake, Gem, Sparkles, Users2, Award, Palette, Smile, X, BookMarked, 
  Search, Target, UserCheck, Link as LinkIcon, Handshake, Edit3, 
  ExternalLink, Bot, Coffee, Camera, Music, Globe, Compass, Telescope, 
  Crown, Zap, Gift, ArrowRight, Quote, ChevronDown, Moon, Sun, Baby, 
  Home, Flame, MessageCircle, Play, Plus, Lightbulb, Mountain, Share2,
  Download, Printer, Bookmark, Search as SearchIcon, Filter, SortDesc,
  MessageSquare, Phone as PhoneIcon, Mail, Send, Stars,
  Sparkle, Sunrise, Sunset, TreePine, Flower, Rainbow, Waves, Wind, Shield,
  Maximize, Minimize
} from "lucide-react";

// Types and Interfaces
import type {
  UserProfile, UserImage as UserImageType, QuestionnaireResponse, FormattedAnswer,
  ServiceType, HeadCoveringType, KippahType
} from "@/types/next-auth";
import { languageOptions } from "@/lib/languageOptions";
import type { Candidate } from "@/app/components/matchmaker/new/types/candidates";

import NewSuggestionForm from "@/app/components/matchmaker/suggestions/NewSuggestionForm";

// Define interfaces
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

interface ExcitementFactor {
  icon: React.ElementType;
  text: string;
  gradient: string;
}

// --- Color Palette & Theme ---
const COLOR_PALETTES = {
  professional: {
    name: "מקצועי",
    colors: {
      primary: {
        main: "from-gray-700 via-gray-800 to-gray-900",
        accent: "from-blue-600 via-blue-700 to-blue-800",
        light: "from-gray-100 via-gray-200 to-gray-300",
        romantic: "from-blue-600 via-blue-700 to-blue-800",
        rose: "from-blue-500 via-blue-600 to-blue-700",
        gold: "from-gray-400 via-gray-500 to-gray-600",
        elegant: "from-gray-700 via-gray-800 to-gray-900",
      },
      secondary: {
        sage: "from-gray-300 via-gray-400 to-gray-500",
        sky: "from-blue-100 via-blue-200 to-blue-300",
        lavender: "from-gray-200 via-gray-300 to-gray-400",
        peach: "from-orange-100 via-amber-100 to-yellow-200"
      },
      neutral: {
        warm: "from-gray-50 via-white to-gray-100",
        cool: "from-slate-50 via-gray-50 to-zinc-50",
        elegant: "from-white via-gray-50 to-neutral-100"
      }
    },
    shadows: {
      elegant: "shadow-xl shadow-gray-200/25",
      warm: "shadow-lg shadow-gray-200/30",
      soft: "shadow-md shadow-gray-100/40"
    }
  },
  feminine: {
    name: "נשי",
    colors: {
      primary: {
        main: "from-rose-400 via-pink-400 to-rose-500",
        accent: "from-pink-500 via-rose-500 to-red-400",
        light: "from-pink-100 via-rose-100 to-red-100",
        romantic: "from-rose-400 via-pink-400 to-rose-500",
        rose: "from-rose-400 via-pink-400 to-rose-500",
        gold: "from-amber-200 via-yellow-200 to-orange-300",
        elegant: "from-pink-500 via-rose-500 to-red-400",
      },
      secondary: {
        sage: "from-pink-200 via-rose-200 to-red-200",
        sky: "from-purple-200 via-pink-200 to-rose-300",
        lavender: "from-purple-200 via-violet-200 to-purple-300",
        peach: "from-pink-200 via-rose-200 to-orange-300"
      },
      neutral: {
        warm: "from-rose-50 via-pink-50 to-orange-50",
        cool: "from-purple-50 via-pink-50 to-rose-50",
        elegant: "from-pink-50 via-rose-50 to-neutral-100"
      }
    },
    shadows: {
      elegant: "shadow-xl shadow-pink-200/25",
      warm: "shadow-lg shadow-rose-200/30",
      soft: "shadow-md shadow-pink-100/40"
    }
  },
  masculine: {
    name: "גברי",
    colors: {
      primary: {
        main: "from-blue-600 via-indigo-600 to-blue-700",
        accent: "from-cyan-500 via-blue-500 to-indigo-600",
        light: "from-blue-100 via-indigo-100 to-cyan-100",
        romantic: "from-cyan-500 via-blue-500 to-indigo-600",
        rose: "from-cyan-500 via-blue-500 to-indigo-600",
        gold: "from-blue-200 via-cyan-200 to-teal-300",
        elegant: "from-blue-600 via-indigo-600 to-blue-700",
      },
      secondary: {
        sage: "from-emerald-300 via-teal-300 to-cyan-400",
        sky: "from-blue-200 via-sky-200 to-indigo-300",
        lavender: "from-indigo-200 via-blue-200 to-cyan-300",
        peach: "from-blue-200 via-cyan-200 to-teal-300"
      },
      neutral: {
        warm: "from-blue-50 via-indigo-50 to-cyan-50",
        cool: "from-slate-50 via-blue-50 to-indigo-50",
        elegant: "from-gray-50 via-blue-50 to-neutral-100"
      }
    },
    shadows: {
      elegant: "shadow-xl shadow-blue-200/25",
      warm: "shadow-lg shadow-indigo-200/30",
      soft: "shadow-md shadow-blue-100/40"
    }
  },
  luxury: {
    name: "יוקרתי",
    colors: {
      primary: {
        main: "from-amber-500 via-yellow-500 to-amber-600",
        accent: "from-purple-600 via-indigo-600 to-purple-700",
        light: "from-amber-100 via-yellow-100 to-gold-100",
        romantic: "from-purple-600 via-indigo-600 to-purple-700",
        rose: "from-purple-600 via-indigo-600 to-purple-700",
        gold: "from-amber-500 via-yellow-500 to-amber-600",
        elegant: "from-amber-500 via-yellow-500 to-amber-600",
      },
      secondary: {
        sage: "from-emerald-400 via-teal-400 to-cyan-500",
        sky: "from-indigo-300 via-purple-300 to-violet-400",
        lavender: "from-purple-300 via-violet-300 to-indigo-400",
        peach: "from-amber-300 via-yellow-300 to-orange-400"
      },
      neutral: {
        warm: "from-amber-50 via-yellow-50 to-orange-50",
        cool: "from-purple-50 via-indigo-50 to-violet-50",
        elegant: "from-gray-50 via-amber-50 to-neutral-100"
      }
    },
    shadows: {
      elegant: "shadow-xl shadow-amber-200/25",
      warm: "shadow-lg shadow-yellow-200/30",
      soft: "shadow-md shadow-amber-100/40"
    }
  }
} as const;

type ColorPaletteName = keyof typeof COLOR_PALETTES;

// --- Enhanced Data & Translation Maps ---
const maritalStatusMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  single: { label: "רווק/ה", icon: Heart, color: "text-rose-600" },
  divorced: { label: "גרוש/ה", icon: Sunrise, color: "text-amber-600" },
  widowed: { label: "אלמן/ה", icon: Stars, color: "text-purple-600" },
  annulled: { label: "מוכן/ה לאהבה חדשה", icon: Rainbow, color: "text-pink-600" },
  any: { label: "פתוח/ה לכל האפשרויות", icon: Sparkles, color: "text-indigo-600" }
};

const religiousLevelMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  charedi: { label: "חרדי/ת", icon: BookMarked, color: "text-indigo-700" },
  charedi_modern: { label: "חרדי/ת מודרני/ת", icon: BookOpen, color: "text-indigo-600" },
  dati_leumi_torani: { label: "דתי/ה לאומי/ת תורני/ת", icon: Star, color: "text-blue-700" },
  dati_leumi_liberal: { label: "דתי/ה לאומי/ת ליברלי/ת", icon: Flower, color: "text-blue-600" },
  dati_leumi_standard: { label: "דתי/ה לאומי/ת", icon: Crown, color: "text-blue-600" },
  masorti_strong: { label: "מסורתי/ת (חזק)", icon: TreePine, color: "text-emerald-700" },
  masorti_light: { label: "מסורתי/ת (קל)", icon: Wind, color: "text-emerald-600" },
  secular_traditional_connection: { label: "חילוני/ת עם זיקה", icon: Waves, color: "text-cyan-600" },
  secular: { label: "חילוני/ת", icon: Sunrise, color: "text-orange-600" },
  spiritual_not_religious: { label: "רוחני/ת", icon: Sparkle, color: "text-purple-600" },
  other: { label: "ייחודי/ת", icon: Rainbow, color: "text-pink-600" },
  "לא משנה": { label: "פתוח/ה לכל השקפה", icon: Globe, color: "text-gray-600" }
};

const educationLevelMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  high_school: { label: "תיכונית", icon: School, color: "text-blue-600" },
  vocational: { label: "מקצועית", icon: Award, color: "text-green-600" },
  academic_student: { label: "במהלך לימודים", icon: BookOpen, color: "text-orange-600" },
  academic_ba: { label: "בוגר/ת תואר ראשון", icon: GraduationCap, color: "text-purple-600" },
  academic_ma: { label: "בוגר/ת תואר שני", icon: Star, color: "text-indigo-600" },
  academic_phd: { label: "דוקטור/ת", icon: Crown, color: "text-rose-600" },
  yeshiva_seminary: { label: "לימודים תורניים", icon: BookMarked, color: "text-amber-600" },
  other: { label: "ייחודי/ת", icon: Sparkles, color: "text-pink-600" },
  "ללא העדפה": { label: "הכל פתוח", icon: Globe, color: "text-gray-600" }
};

const serviceTypeMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  MILITARY_COMBATANT: { label: "לוחם/ת", icon: Award, color: "text-red-600" },
  MILITARY_SUPPORT: { label: "תומך/ת לחימה", icon: Users, color: "text-orange-600" },
  MILITARY_OFFICER: { label: "קצין/ה", icon: Crown, color: "text-purple-600" },
  MILITARY_INTELLIGENCE_CYBER_TECH: { label: "טכנולוגיה ומודיעין", icon: Zap, color: "text-blue-600" },
  NATIONAL_SERVICE_ONE_YEAR: { label: "שירות לאומי", icon: Heart, color: "text-pink-600" },
  NATIONAL_SERVICE_TWO_YEARS: { label: "שירות לאומי מורחב", icon: Stars, color: "text-rose-600" },
  HESDER_YESHIVA: { label: "ישיבת הסדר", icon: BookMarked, color: "text-indigo-600" },
  YESHIVA_ONLY_POST_HS: { label: "לימודים תורניים", icon: BookOpen, color: "text-amber-600" },
  PRE_MILITARY_ACADEMY_AND_SERVICE: { label: "מכינה ושירות", icon: GraduationCap, color: "text-green-600" },
  EXEMPTED: { label: "פטור", icon: Shield, color: "text-gray-600" },
  CIVILIAN_SERVICE: { label: "שירות אזרחי", icon: Users2, color: "text-teal-600" },
  OTHER: { label: "ייחודי", icon: Sparkles, color: "text-purple-600" }
};

const headCoveringMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  FULL_COVERAGE: { label: "כיסוי מלא", icon: Crown, color: "text-purple-600" },
  PARTIAL_COVERAGE: { label: "כיסוי חלקי", icon: Flower, color: "text-pink-600" },
  HAT_BERET: { label: "כובע/ברט", icon: Sun, color: "text-orange-600" },
  SCARF_ONLY_SOMETIMES: { label: "מטפחת לאירועים", icon: Sparkle, color: "text-rose-600" },
  NONE: { label: "ללא כיסוי", icon: Wind, color: "text-blue-600" },
  any: { label: "גמיש/ה", icon: Rainbow, color: "text-indigo-600" }
};

const kippahTypeMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  BLACK_VELVET: { label: "קטיפה שחורה", icon: Crown, color: "text-indigo-700" },
  KNITTED_SMALL: { label: "סרוגה קטנה", icon: Star, color: "text-blue-600" },
  KNITTED_LARGE: { label: "סרוגה גדולה", icon: Stars, color: "text-blue-700" },
  CLOTH: { label: "בד", icon: Flower, color: "text-green-600" },
  BRESLEV: { label: "ברסלב", icon: Sparkle, color: "text-purple-600" },
  NONE_AT_WORK_OR_CASUAL: { label: "לא בעבודה", icon: Briefcase, color: "text-gray-600" },
  NONE_USUALLY: { label: "לרוב לא", icon: Wind, color: "text-gray-500" },
  OTHER: { label: "ייחודי", icon: Rainbow, color: "text-pink-600" },
  any: { label: "גמיש", icon: Globe, color: "text-teal-600" }
};

const languageMap = languageOptions.reduce((acc, lang) => {
  acc[lang.value] = { label: lang.label, icon: Globe, color: "text-blue-600" };
  return acc;
}, {} as { [key: string]: { label: string; icon: React.ElementType; color: string } });

const contactPreferenceMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  direct: { label: "ישירות", icon: PhoneIcon, color: "text-green-600" },
  matchmaker: { label: "דרך השדכן/ית", icon: Users, color: "text-purple-600" },
  both: { label: "גמיש/ה", icon: MessageSquare, color: "text-blue-600" }
};

const characterTraitMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  empathetic: { label: "אמפתי/ת", icon: Heart, color: "text-rose-600" },
  driven: { label: "שאפתן/ית", icon: Zap, color: "text-orange-600" },
  optimistic: { label: "אופטימי/ת", icon: Sunrise, color: "text-yellow-600" },
  family_oriented: { label: "משפחתי/ת", icon: Users2, color: "text-pink-600" },
  intellectual: { label: "אינטלקטואל/ית", icon: BookOpen, color: "text-indigo-600" },
  organized: { label: "מאורגנ/ת", icon: CheckCircle, color: "text-green-600" },
  calm: { label: "רגוע/ה", icon: Waves, color: "text-blue-600" },
  humorous: { label: "מצחיק/ה", icon: Smile, color: "text-purple-600" },
  sociable: { label: "חברותי/ת", icon: Users, color: "text-cyan-600" },
  sensitive: { label: "רגיש/ה", icon: Flower, color: "text-pink-600" },
  independent: { label: "עצמאי/ת", icon: Crown, color: "text-amber-600" },
  creative: { label: "יצירתי/ת", icon: Palette, color: "text-rose-600" },
  honest: { label: "כן/ה וישר/ה", icon: Star, color: "text-blue-600" },
  responsible: { label: "אחראי/ת", icon: Award, color: "text-green-600" },
  easy_going: { label: "זורם/ת וקליל/ה", icon: Wind, color: "text-teal-600" },
  no_strong_preference: { label: "פתוח/ה לגילוי", icon: Compass, color: "text-gray-600" }
};

const hobbiesMap: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
  travel: { label: "טיולים", icon: Compass, color: "text-green-600" },
  sports: { label: "ספורט", icon: Zap, color: "text-orange-600" },
  reading: { label: "קריאה", icon: BookOpen, color: "text-indigo-600" },
  cooking_baking: { label: "בישול ואפיה", icon: Coffee, color: "text-amber-600" },
  music_playing_instrument: { label: "מוזיקה", icon: Music, color: "text-purple-600" },
  art_crafts: { label: "אומנות ויצירה", icon: Palette, color: "text-pink-600" },
  volunteering: { label: "התנדבות", icon: Heart, color: "text-rose-600" },
  learning_courses: { label: "למידה", icon: GraduationCap, color: "text-blue-600" },
  board_games_puzzles: { label: "משחקים", icon: Play, color: "text-cyan-600" },
  movies_theater: { label: "סרטים ותיאטרון", icon: Camera, color: "text-red-600" },
  dancing: { label: "ריקוד", icon: Sparkle, color: "text-pink-600" },
  writing: { label: "כתיבה", icon: Edit3, color: "text-gray-600" },
  nature_hiking: { label: "טבע וטיולים", icon: TreePine, color: "text-green-600" },
  photography: { label: "צילום", icon: Camera, color: "text-blue-600" },
  no_strong_preference: { label: "פתוח/ה לגילוי יחד", icon: Rainbow, color: "text-gray-600" }
};

// --- Main Profile Card Component ---
interface ProfileCardProps {
  profile: Omit<UserProfile, 'isProfileComplete'>; // 1. המידע מה-DB
  isProfileComplete: boolean; // 2. המידע מגיע בנפרד
  images?: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: "matchmaker" | "candidate";
  className?: string;
  candidate?: Candidate;
  allCandidates?: Candidate[];
  onCreateSuggestion?: (data: CreateSuggestionData) => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile: profileData, // שנה שם כדי למנוע התנגשות
  isProfileComplete, // קבל את הערך החדש
  candidate,
  images = [],
  questionnaire,
  viewMode = "candidate",
  className,
  allCandidates = [],
  onCreateSuggestion
}) => {
    const profile: UserProfile = {
    ...profileData,
    isProfileComplete,
  };
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedImageForDialog, setSelectedImageForDialog] = useState<UserImageType | null>(null);
  const [activeTab, setActiveTab] = useState("essence");
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [mobileViewLayout, setMobileViewLayout] = useState<'focus' | 'detailed'>('focus');
  const [selectedPalette, setSelectedPalette] = useState<ColorPaletteName>('feminine');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get current theme based on selected palette
  const THEME = useMemo(() => COLOR_PALETTES[selectedPalette], [selectedPalette]);
    
    const WORLDS: { [key: string]: { 
      label: string; 
      icon: React.ElementType; 
      gradient: string; 
      description: string;
      accentColor: string;
    } } = useMemo(() => ({
      values: { 
        label: "הערכים והעקרונות שמנחים אותי", 
        icon: BookMarked, 
        gradient: THEME.colors.primary.accent,
        description: "מה חשוב לי בחיים ומה מוביל אותי",
        accentColor: "blue"
      },
      personality: { 
        label: "האישיות והתכונות הייחודיות שלי", 
        icon: Sparkles, 
        gradient: THEME.colors.primary.light,
        description: "איך אני באמת ומה מאפיין אותי",
        accentColor: "purple"
      },
      relationship: { 
        label: "החזון שלי לזוגיות ומשפחה", 
        icon: Heart, 
        gradient: THEME.colors.primary.main,
        description: "איך אני רואה את עתיד הזוגיות שלי",
        accentColor: "rose"
      },
      partner: { 
        label: "מה אני מחפש/ת בבן/בת הזוג", 
        icon: Users, 
        gradient: THEME.colors.secondary.sky,
        description: "התכונות והערכים שחשובים לי בפרטנר",
        accentColor: "blue"
      },
      religion: { 
        label: "הדת והרוחניות בחיי", 
        icon: Star, 
        gradient: THEME.colors.secondary.peach,
        description: "המקום של האמונה והמסורת בעולמי",
        accentColor: "amber"
      },
      general: { 
        label: "עוד דברים חשובים שכדאי לדעת עליי", 
        icon: FileText, 
        gradient: THEME.colors.secondary.lavender,
        description: "פרטים נוספים שמשלימים את התמונה",
        accentColor: "purple"
      }
    }), [THEME]);

  // --- Enhanced Helper Functions ---
  const formatEnumValue = (
    value: string | null | undefined, 
    map: { [key: string]: { label: string; icon: React.ElementType; color: string } }, 
    placeholder: string = "עוד נגלה יחד..."
  ): { label: string; icon: React.ElementType; color: string } => {
    if (!value || !map[value]) return { 
      label: placeholder, 
      icon: Telescope, 
      color: "text-gray-500" 
    };
    return map[value];
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    let initials = "";
    if (firstName && firstName.length > 0) initials += firstName[0];
    if (lastName && lastName.length > 0) initials += lastName[0];
    if (initials.length === 0 && firstName && firstName.length > 0) {
      initials = firstName.length > 1 ? firstName.substring(0, 2) : firstName[0];
    }
    return initials.toUpperCase() || "♥";
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

  const formatAvailabilityStatus = useCallback((status: UserProfile["availabilityStatus"] | undefined) => {
    const statusMap = {
      AVAILABLE: { 
        text: "זמין/ה להכרות מרגשות", 
        gradient: THEME.colors.primary.main, 
        icon: Heart, 
        pulse: true,
        bgColor: "bg-gradient-to-r from-emerald-500 to-green-500"
      },
      UNAVAILABLE: { 
        text: "לא זמין/ה כרגע", 
        gradient: "from-gray-400 to-gray-500", 
        icon: Clock, 
        pulse: false,
        bgColor: "bg-gradient-to-r from-gray-400 to-gray-500"
      },
      DATING: { 
        text: "בתהליך היכרות", 
        gradient: THEME.colors.primary.accent, 
        icon: Coffee, 
        pulse: false,
        bgColor: "bg-gradient-to-r from-amber-500 to-orange-500"
      },
      PAUSED: { 
        text: "בהפסקה זמנית", 
        gradient: THEME.colors.secondary.sky, 
        icon: Moon, 
        pulse: false,
        bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500"
      },
      ENGAGED: { 
        text: "מאורס/ת", 
        gradient: THEME.colors.primary.light, 
        icon: Star, 
        pulse: false,
        bgColor: "bg-gradient-to-r from-pink-500 to-rose-500"
      },
      MARRIED: { 
        text: "נשוי/אה", 
        gradient: THEME.colors.primary.main, 
        icon: Heart, 
        pulse: false,
        bgColor: "bg-gradient-to-r from-rose-500 to-pink-500"
      }
    };
    
    return statusMap[status as keyof typeof statusMap] || {
      text: "מסתורי/ת...", 
      gradient: THEME.colors.secondary.lavender, 
      icon: Sparkles, 
      pulse: true,
      bgColor: "bg-gradient-to-r from-purple-500 to-indigo-500"
    };
  }, [THEME]);

  const formatBooleanPreference = (
    value: boolean | null | undefined, 
    yesLabel: string = "כן", 
    noLabel: string = "לא", 
    notSpecifiedLabel: string = "נגלה יחד"
  ): { label: string; icon: React.ElementType; color: string } => {
    if (value === true) return { label: yesLabel, icon: CheckCircle, color: "text-green-600" };
    if (value === false) return { label: noLabel, icon: X, color: "text-red-500" };
    return { label: notSpecifiedLabel, icon: Telescope, color: "text-gray-500" };
  };

  const formatStringBooleanPreference = (
    value: string | null | undefined, 
    options: { [key: string]: { label: string; icon: React.ElementType; color: string } } = {
      yes: { label: "כן", icon: CheckCircle, color: "text-green-600" },
      no: { label: "לא", icon: X, color: "text-red-500" },
      flexible: { label: "גמיש/ה", icon: Rainbow, color: "text-indigo-600" }
    }, 
    notSpecifiedLabel: { label: string; icon: React.ElementType; color: string } = {
      label: "נגלה יחד", icon: Telescope, color: "text-gray-500"
    }
  ): { label: string; icon: React.ElementType; color: string } => {
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
    variant?: "default" | "highlight" | "elegant" | "romantic";
    size?: "sm" | "md" | "lg";
  }> = ({ 
    icon: Icon, 
    label, 
    value, 
    className, 
    iconColorClass = "text-rose-500", 
    valueClassName, 
    tooltip, 
    variant = "default",
    size = "md"
  }) => {
    const variants = {
      default: "bg-white border border-gray-200 hover:border-rose-300 hover:shadow-md",
      highlight: `bg-gradient-to-r ${THEME.colors.neutral.warm} border border-rose-200 shadow-sm`,
      elegant: `bg-gradient-to-br ${THEME.colors.neutral.elegant} border border-amber-200 ${THEME.shadows.elegant}`,
      romantic: `bg-gradient-to-r ${THEME.colors.neutral.warm} border border-pink-200 ${THEME.shadows.soft}`
    };

    const sizes = {
      sm: "p-3 gap-2",
      md: "p-4 gap-3", 
      lg: "p-5 gap-4"
    };

    const content = (
      <div className={cn(
        "flex items-start rounded-xl transition-all duration-300",
        variants[variant],
        sizes[size],
        className
      )}>
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0 shadow-sm",
          variant === "highlight" || variant === "elegant" 
            ? `bg-gradient-to-r ${THEME.colors.primary.rose} text-white` 
            : "bg-rose-50 border border-rose-200",
          !variant && iconColorClass
        )}>
          <Icon className={cn(
            "w-4 h-4",
            variant === "highlight" || variant === "elegant" ? "text-white" : iconColorClass
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-xs font-semibold mb-1 tracking-wide",
            variant === "highlight" || variant === "elegant" 
              ? "text-rose-700" 
              : "text-gray-600"
          )}>{label}</p>
          <div className={cn(
            "text-sm font-medium break-words leading-relaxed",
            variant === "highlight" || variant === "elegant" 
              ? "text-gray-800" 
              : "text-gray-700",
            valueClassName
          )}>
            {value || "עוד נגלה יחד..."}
          </div>
        </div>
      </div>
    );

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-center bg-white border border-rose-200 shadow-lg">
            <p className="text-gray-700">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  const EmptyState: React.FC<{
    icon: React.ElementType;
    title: string;
    description?: string;
    className?: string;
    action?: React.ReactNode;
    variant?: "mystery" | "adventure" | "discovery" | "romantic";
  }> = ({ icon: Icon, title, description, className, action, variant = "discovery" }) => {
    const variants = {
      mystery: {
        bg: `bg-gradient-to-br ${THEME.colors.secondary.lavender}`,
        border: "border-purple-200",
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.romantic}`,
        textColor: "text-purple-700",
        titleColor: "text-purple-800"
      },
      adventure: {
        bg: `bg-gradient-to-br ${THEME.colors.secondary.sage}`,
        border: "border-emerald-200",
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.rose}`,
        textColor: "text-emerald-700",
        titleColor: "text-emerald-800"
      },
      discovery: {
        bg: `bg-gradient-to-br ${THEME.colors.secondary.peach}`,
        border: "border-amber-200",
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.gold}`,
        textColor: "text-amber-700",
        titleColor: "text-amber-800"
      },
      romantic: {
        bg: `bg-gradient-to-br ${THEME.colors.neutral.warm}`,
        border: "border-rose-200",
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.rose}`,
        textColor: "text-rose-700",
        titleColor: "text-rose-800"
      }
    };

    const config = variants[variant];

    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed",
        config.bg,
        config.border,
        THEME.shadows.soft,
        className
      )}>
        <div className={cn("p-4 rounded-full mb-4", config.iconBg, THEME.shadows.warm)}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className={cn("text-lg font-bold mb-2", config.titleColor)}>{title}</h3>
        {description && (
          <p className={cn("text-sm mt-1 max-w-xs leading-relaxed", config.textColor)}>
            {description}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  };

  const SectionCard: React.FC<{
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    headerClassName?: string;
    action?: React.ReactNode;
    variant?: "default" | "elegant" | "romantic" | "highlight";
    gradient?: string;
  }> = ({ 
    title, 
    subtitle,
    icon: Icon, 
    children, 
    className, 
    contentClassName, 
    headerClassName, 
    action, 
    variant = "default",
    gradient
  }) => {
    const variants = {
      default: {
        card: "bg-white border-gray-200 shadow-lg hover:shadow-xl",
        header: "bg-gradient-to-r from-gray-50 to-white border-gray-200",
        iconBg: "bg-gray-100 border border-gray-200",
        iconColor: "text-gray-600"
      },
      elegant: {
        card: `bg-white border-amber-200 ${THEME.shadows.elegant}`,
        header: `bg-gradient-to-r ${gradient || THEME.colors.neutral.warm} border-amber-200`,
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.gold} text-white`,
        iconColor: "text-white"
      },
      romantic: {
        card: `bg-white border-rose-200 ${THEME.shadows.soft}`,
        header: `bg-gradient-to-r ${gradient || THEME.colors.neutral.warm} border-rose-200`,
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.rose} text-white`,
        iconColor: "text-white"
      },
      highlight: {
        card: `bg-white border-pink-200 ${THEME.shadows.soft} ring-1 ring-pink-100`,
        header: `bg-gradient-to-r ${gradient || THEME.colors.primary.romantic} border-pink-200`,
        iconBg: `bg-gradient-to-r ${THEME.colors.primary.elegant} text-white`,
        iconColor: "text-white"
      }
    };

    const config = variants[variant];

    return (
      <div className={cn(
        "rounded-2xl border overflow-hidden flex flex-col transition-all duration-300",
        config.card,
        className
      )}>
        <div className={cn(
          "flex items-center justify-between gap-3 p-4 border-b",
          config.header,
          headerClassName
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={cn("p-2 rounded-lg shadow-sm", config.iconBg)}>
                <Icon className={cn("w-5 h-5", config.iconColor)} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className={cn(
                "text-base font-bold truncate",
                variant === "default" ? "text-gray-800" : "text-gray-800"
              )}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="ml-auto flex-shrink-0">{action}</div>}
        </div>
        <div className={cn("p-4", contentClassName)}>{children}</div>
      </div>
    );
  };
  
  // Color Palette Selector Component
  const ColorPaletteSelector = () => (
    <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
      <Palette className="w-4 h-4 text-gray-500" />
      <select 
        value={selectedPalette}
        onChange={(e) => setSelectedPalette(e.target.value as ColorPaletteName)}
        className="text-xs bg-transparent border-none outline-none font-medium text-gray-600"
      >
        {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
          <option key={key} value={key}>{palette.name}</option>
        ))}
      </select>
    </div>
  );

  // --- Enhanced Profile Header ---
  const ProfileHeader: React.FC<{
    profile: UserProfile;
    age: number;
    mainImageToDisplay: UserImageType | null;
    availability: ReturnType<typeof formatAvailabilityStatus>;
    viewMode: "matchmaker" | "candidate";
    onSuggestClick: () => void;
    isMobile?: boolean;
    selectedPalette: ColorPaletteName;
  }> = ({ profile, age, mainImageToDisplay, availability, viewMode, onSuggestClick, isMobile = false, selectedPalette }) => {
    
    // **בעיה 3: תיקון באג לוגי**
    // הוספנו את `selectedPalette` למערך התלויות של `useMemo`.
    // בלעדיו, הדגשים לא היו מתעדכנים עם שינוי ערכת הצבעים.
    const personalityHighlights = useMemo(() => {
      const currentTheme = COLOR_PALETTES[selectedPalette];
      const highlights: ExcitementFactor[] = [];
      
      if (profile.profileCharacterTraits?.length > 0) {
        const trait = profile.profileCharacterTraits[0];
        const traitData = formatEnumValue(trait, characterTraitMap, trait);
        highlights.push({
          icon: traitData.icon,
          text: traitData.label,
          gradient: currentTheme.colors.primary.light
        });
      }

      if (profile.profileHobbies?.length > 0) {
        const hobby = profile.profileHobbies[0];
        const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby);
        highlights.push({
          icon: hobbyData.icon,
          text: hobbyData.label,
          gradient: currentTheme.colors.secondary.sage
        });
      }

      if (profile.city) {
        highlights.push({
          icon: MapPin,
          text: `גר/ה ב${profile.city}`,
          gradient: currentTheme.colors.secondary.sky
        });
      }

      return highlights.slice(0, 3);
    }, [profile, selectedPalette]);

    return (
      <div className="relative overflow-hidden">
        {/* Elegant Background */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", THEME.colors.neutral.warm)}>
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 p-6">
          <div className={cn("flex gap-6", isMobile ? "flex-col items-center text-center" : "flex-row items-start")}>
            
            {/* Enhanced Profile Image */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "relative h-36 w-36 rounded-full overflow-hidden border-4 border-white shadow-2xl",
                "ring-4 ring-rose-200/50",
                THEME.shadows.elegant
              )}>
                {mainImageToDisplay?.url ? (
                  <Image
                    src={mainImageToDisplay.url}
                    alt={`תמונת פרופיל של ${profile.user?.firstName || 'מועמד יקר'}`}
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                ) : (
                  <div className={cn(
                    "w-full h-full flex items-center justify-center",
                    `bg-gradient-to-br ${THEME.colors.primary.romantic}`
                  )}>
                    <span className="text-5xl font-bold text-white">
                      {getInitials(profile.user?.firstName, profile.user?.lastName)}
                    </span>
                  </div>
                )}
              </div>

              {/* Elegant Status Badge */}
              <div className="absolute -bottom-2 -right-2">
                <Badge className={cn(
                  "text-xs px-3 py-2 text-white border-0 font-bold",
                  availability.bgColor,
                  availability.pulse && "animate-pulse",
                  THEME.shadows.warm
                )}>
                  <availability.icon className="w-3 h-3 ml-1" />
                  {availability.text}
                </Badge>
              </div>
            </div>

            {/* **בעיה 1: פתרון** */}
            {/* המבנה של ה-div הזה שונה כדי להבטיח זרימה אנכית נכונה ולמנוע חפיפה של תוכן. */}
            <div className="flex-1 min-w-0 flex flex-col justify-start items-start">
              <div className="w-full">
                 {!isMobile && (
                  <div className="flex justify-end mb-2">
                    <ColorPaletteSelector />
                  </div>
                )}
                
                {/* Name and Age */}
                <div className={cn("mb-4 w-full", isMobile && "text-center")}>
                    <h1 className={cn(
                      "text-4xl md:text-5xl font-extrabold leading-tight mb-2",
                      "bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent",
                       isMobile && "mx-auto" // Center title on mobile
                    )}>
                      {profile.user?.firstName ? (
                        <>
                          הכירו את {profile.user.firstName}
                          {profile.user.lastName && ` ${profile.user.lastName}`}
                        </>
                      ) : (
                        "מישהו מיוחד מחכה להכרות"
                      )}
                    </h1>

                    {age > 0 && (
                      <div className="mt-3">
                        <p className="text-xl text-gray-700 font-semibold flex items-center justify-center lg:justify-start gap-2">
                          <Cake className="w-5 h-5 text-blue-500" />
                          {/* שיפור UX: טקסט גיל ניטרלי */}
                          גיל: {age}
                        </p>
                      </div>
                    )}
                </div>

                {/* Personality Highlights */}
                {personalityHighlights.length > 0 && (
                  <div className={cn("flex gap-3 flex-wrap mt-4 w-full", isMobile ? "justify-center" : "justify-start")}>
                    {personalityHighlights.map((highlight, index) => (
                      <div
                        key={index}
                        className={cn(
"flex items-center gap-2 px-4 py-2 rounded-full text-gray-700 font-semibold text-sm",                          THEME.shadows.soft
                        )}
                      >
                        <highlight.icon className="w-4 h-4" />
                        <span>{highlight.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Facts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 w-full">
                {profile.city && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl",
                    "border border-rose-200/50 shadow-sm hover:shadow-md transition-all"
                  )}>
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">מיקום</p>
                      <p className="text-sm font-semibold text-gray-800">{profile.city}</p>
                    </div>
                  </div>
                )}

                {profile.occupation && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl",
                    "border border-amber-200/50 shadow-sm hover:shadow-md transition-all"
                  )}>
                    <Briefcase className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">עיסוק</p>
                      <p className="text-sm font-semibold text-gray-800">{profile.occupation}</p>
                    </div>
                  </div>
                )}

                {profile.religiousLevel && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl",
                    "border border-purple-200/50 shadow-sm hover:shadow-md transition-all"
                  )}>
                    <BookMarked className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">השקפה</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatEnumValue(profile.religiousLevel, religiousLevelMap).label}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button for Matchmakers */}
              {viewMode === 'matchmaker' && (
                <div className={cn("pt-6 w-full flex", isMobile ? "justify-center" : "justify-end")}>
                  <Button
                    size="lg"
                    className={cn(
                      "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600",
                      "hover:from-rose-600 hover:via-pink-600 hover:to-rose-700",
                      "text-white font-bold rounded-full px-8 py-3",
                      "shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    )}
                    onClick={onSuggestClick}
                  >
                    <Heart className="w-5 h-5 ml-2" />
                    הצע התאמה מושלמת
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Inspirational Quote */}
          <div className="mt-8 text-center">
            <div className={cn(
              "inline-flex items-center gap-3 px-6 py-3 rounded-full",
              `bg-gradient-to-r ${THEME.colors.primary.romantic}`,
              "text-white shadow-lg"
            )}>
              <Quote className="w-5 h-5" />
              <p className="text-lg font-medium italic">
                כל סיפור אהבה מתחיל בהכרות אחת מיוחדת...
              </p>
              <Quote className="w-5 h-5 transform rotate-180" />
            </div>
          </div>
        </div>
      </div>
    );
  };


  // --- Enhanced Questionnaire Item ---
  const QuestionnaireItem: React.FC<{
    answer: FormattedAnswer;
    worldColor?: string;
    worldGradient?: string;
  }> = ({ answer, worldColor = "rose", worldGradient }) => {
    return (
      <div className={cn(
        "p-5 rounded-xl border transition-all duration-300 hover:shadow-lg",
        "bg-gradient-to-br from-white to-gray-50/30",
        `border-${worldColor}-200 hover:border-${worldColor}-300`
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-lg flex-shrink-0 text-white shadow-md",
            worldGradient ? `bg-gradient-to-r ${worldGradient}` : `bg-gradient-to-r from-${worldColor}-400 to-${worldColor}-500`
          )}>
            <Quote className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold mb-3 text-gray-800 leading-relaxed">
              {answer.question}
            </h4>
            <div className={cn(
              "p-4 rounded-lg border-r-4 bg-white/60",
              `border-${worldColor}-400`
            )}>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                <Quote className="w-4 h-4 inline ml-1 text-gray-400" />
                {answer.displayText || answer.answer}
                <Quote className="w-4 h-4 inline mr-1 text-gray-400 transform rotate-180" />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
        window.removeEventListener("resize", checkScreenSize);
        document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);
  
  const hasAnyPreferences = useMemo(() => {
    return (
      (profile.preferredMaritalStatuses && profile.preferredMaritalStatuses.length > 0) ||
      (profile.preferredReligiousLevels && profile.preferredReligiousLevels.length > 0) ||
      (profile.preferredEducation && profile.preferredEducation.length > 0) ||
      (profile.preferredOccupations && profile.preferredOccupations.length > 0) ||
      (profile.preferredLocations && profile.preferredLocations.length > 0) ||
      (profile.preferredCharacterTraits && profile.preferredCharacterTraits.length > 0) ||
      (profile.preferredHobbies && profile.preferredHobbies.length > 0)
    );
  }, [profile]);

  const orderedImages = useMemo(() => {
    const validImages = (images || []).filter(img => img.url);
    const mainImg = validImages.find(img => img.isMain);
    const otherImages = validImages.filter(img => !img.isMain);
    return mainImg ? [mainImg, ...otherImages] : validImages;
  }, [images]);

  const mainImageToDisplay = useMemo(() => orderedImages.length > 0 ? orderedImages[0] : null, [orderedImages]);
  const age = useMemo(() => calculateAge(profile.birthDate), [profile.birthDate]);
  const availability = useMemo(() => formatAvailabilityStatus(profile.availabilityStatus), [profile.availabilityStatus, formatAvailabilityStatus]);

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
  
  const handleToggleFullscreen = () => {
    const elem = document.getElementById('profile-card-container');
    if (!elem) return;
    
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Enhanced tab configuration with THEME dependency
  const tabItems = useMemo(() => [
    { 
      value: "essence", 
      label: "המהות", 
      icon: Sparkles, 
      gradient: THEME.colors.primary.light, 
      description: "מי זה האדם הזה באמת" 
    },
    { 
      value: "story", 
      label: "הסיפור", 
      icon: BookOpen, 
      gradient: THEME.colors.primary.accent, 
      description: "הרקע והדרך שהובילה לכאן" 
    },
    { 
      value: "vision", 
      label: "החזון", 
      icon: Heart, 
      gradient: THEME.colors.primary.main, 
      description: "החלום לזוגיות ומשפחה" 
    },
    { 
      value: "search", 
      label: "החיפוש", 
      icon: Target, 
      gradient: THEME.colors.secondary.sky, 
      description: "מה מחפש בבן/בת הזוג" 
    },
    ...(hasDisplayableQuestionnaireAnswers ? [{
      value: "deeper",
      label: "עומק",
      icon: Telescope,
      gradient: THEME.colors.secondary.peach,
      description: "תשובות מעמיקות מהלב"
    }] : []),
    ...(viewMode === "matchmaker" ? [{
      value: "professional",
      label: "מקצועי",
      icon: Lock,
      gradient: THEME.colors.secondary.lavender,
      description: "מידע לשדכן בלבד"
    }] : []),
  ], [hasDisplayableQuestionnaireAnswers, viewMode, THEME]);

  const renderPreferenceBadges = (
    title: string,
    icon: React.ElementType,
    values: string[] | undefined,
    translationMap: { [key: string]: { label: string; icon: React.ElementType; color: string } },
    gradientClass: string = THEME.colors.secondary.sky
  ) => {
    if (!values || values.length === 0) {
      // לא נציג כלום כאן אם אין ערכים, כדי למנוע כפילויות.
      // הבדיקה הראשית נעשית בלשונית החיפוש.
      return null;
    }

    const IconComponent = icon;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-gradient-to-r", gradientClass)}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-base font-bold text-gray-800">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-3">
          {values.map((val) => {
            const itemData = translationMap[val] || { label: val, icon: Sparkles, color: "text-gray-600" };
            return (
              <Badge
                key={val}
                variant="outline"
                className={cn(
                  "flex items-center gap-2 text-sm px-4 py-2 font-semibold border-2",
                  "bg-white hover:bg-gray-50 transition-all hover:scale-105",
                  "border-gray-200 hover:border-rose-300",
                  THEME.shadows.soft
                )}
              >
                <itemData.icon className={cn("w-4 h-4", itemData.color)} />
                {itemData.label}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced Main Content Tabs
  const MainContentTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow min-h-0">
      <div className={cn(
        "bg-white/95 backdrop-blur-md p-3 rounded-2xl mb-6 border border-gray-200/50",
        THEME.shadows.elegant,
        "sticky top-0 z-20"
      )}>
        <ScrollArea dir="rtl" className="w-full">
          <TabsList className="h-auto inline-flex bg-transparent p-2 gap-2">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex flex-col items-center gap-2 px-4 py-4 text-xs rounded-xl",
                  "whitespace-nowrap transition-all duration-300",
                  "text-gray-600 hover:text-gray-800 hover:bg-rose-50",
                  "min-w-[90px] border border-transparent",
                  activeTab === tab.value && cn(
                    "font-bold text-white shadow-lg border-white/20",
                    `bg-gradient-to-r ${tab.gradient}`
                  )
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-semibold">{tab.label}</span>
                {tab.description && activeTab === tab.value && (
                  <span className="text-[10px] text-white/90 leading-tight text-center max-w-[80px] font-normal">
                    {tab.description}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="space-y-8 focus:outline-none flex-grow min-h-0">
        
        {/* Essence Tab - The Heart of the Person */}
        <TabsContent value="essence" className="mt-0">
          <div className="space-y-8">
            
            <SectionCard
              title="הנשמה והמהות"
              subtitle="מי זה האדם הזה באמת"
              icon={Heart}
              variant="romantic"
              gradient={THEME.colors.primary.main}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                <div className="relative">
                  <div className={cn(
                    "relative aspect-[3/4] rounded-2xl overflow-hidden",
                    "border-4 border-white shadow-2xl ring-4 ring-rose-200/50"
                  )}>
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
                      <div className={cn(
                        "w-full h-full flex items-center justify-center",
                        `bg-gradient-to-br ${THEME.colors.primary.romantic}`
                      )}>
                        <div className="text-center text-white">
                          <User className="w-24 h-24 mx-auto mb-4 opacity-80" />
                          <p className="text-xl font-bold">התמונה המושלמת</p>
                          <p className="text-sm opacity-80">מחכה להיחשף</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      {profile.gender === "FEMALE" && (
                        <Badge className={cn(
                          "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0",
                          THEME.shadows.warm
                        )}>
                          <Crown className="w-3 h-3 ml-1" />
                          נסיכה
                        </Badge>
                      )}
                      {profile.gender === "MALE" && (
                        <Badge className={cn(
                          "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0",
                          THEME.shadows.warm
                        )}>
                          <Zap className="w-3 h-3 ml-1" />
                          נסיך
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center lg:text-right">
                    <h2 className={cn(
                      "text-3xl md:text-4xl font-extrabold mb-4 leading-tight",
                      "bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent"
                    )}>
                      {profile.user?.firstName || "מישהו מדהים"}
                    </h2>

                    {age > 0 && (
                      <p className="text-xl text-gray-700 font-bold mb-6 flex items-center justify-center lg:justify-start gap-2">
                        <Cake className="w-5 h-5 text-rose-500" />
                        גיל: {age}
                      </p>
                    )}

                    {profile.about ? (
                      <div className={cn(
                        "relative p-6 rounded-2xl border border-rose-200/50",
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                        THEME.shadows.soft
                      )}>
                        <Quote className="absolute top-3 right-3 w-8 h-8 text-rose-300" />
                        <p className="text-lg text-gray-800 leading-relaxed italic font-medium text-center lg:text-right">
                          {profile.about}
                        </p>
                        <Quote className="absolute bottom-3 left-3 w-8 h-8 text-rose-300 transform rotate-180" />
                      </div>
                    ) : (
                      <EmptyState
                        icon={Telescope}
                        title="הסיפור האישי מחכה להיכתב"
                        description="יש כאן אדם מעניין שמחכה לגילוי יחד איתך"
                        variant="romantic"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {profile.city && (
                      <DetailItem
                        icon={MapPin}
                        label="הבית שבלב"
                        value={`${profile.city} - המקום שקורא לי בית`}
                        variant="highlight"
                        size="md"
                      />
                    )}

                    {profile.occupation && (
                      <DetailItem
                        icon={Briefcase}
                        label="התחום שמלהיב אותי"
                        value={`${profile.occupation} - כאן אני נותן/ת את הלב`}
                        variant="highlight"
                        size="md"
                      />
                    )}

                    {profile.religiousLevel && (
                      <DetailItem
                        icon={BookMarked}
                        label="השקפת העולם שמנחה אותי"
                        value={formatEnumValue(profile.religiousLevel, religiousLevelMap).label}
                        variant="highlight"
                        size="md"
                      />
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <SectionCard
                title="תכונות הזהב שלי"
                subtitle="מה שעושה אותי מיוחד/ת"
                icon={Sparkles}
                variant="elegant"
                gradient={THEME.colors.primary.light}
              >
                <div className="space-y-4">
                  {profile.profileCharacterTraits?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {profile.profileCharacterTraits.map(trait => {
                        const traitData = formatEnumValue(trait, characterTraitMap, trait);
                        return (
                          <Badge
                            key={trait}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 font-semibold text-sm",
                              "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800",
                              "border border-purple-200 rounded-full",
                              "hover:scale-105 transition-transform",
                              THEME.shadows.soft
                            )}
                          >
                            <traitData.icon className={cn("w-4 h-4", traitData.color)} />
                            {traitData.label}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Sparkles}
                      title="תכונות מיוחדות מחכות לגילוי"
                      description="האישיות הייחודית תתגלה בהכרות"
                      variant="mystery"
                    />
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="מה שאני אוהב/ת לעשות"
                subtitle="התחביבים והתשוקות שלי"
                icon={Heart}
                variant="elegant"
                gradient={THEME.colors.secondary.sage}
              >
                <div className="space-y-4">
                  {profile.profileHobbies?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {profile.profileHobbies.map(hobby => {
                        const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby);
                        return (
                          <Badge
                            key={hobby}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 font-semibold text-sm",
                              "bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800",
                              "border border-emerald-200 rounded-full",
                              "hover:scale-105 transition-transform",
                              THEME.shadows.soft
                            )}
                          >
                            <hobbyData.icon className={cn("w-4 h-4", hobbyData.color)} />
                            {hobbyData.label}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Mountain}
                      title="הרפתקאות מחכות לנו יחד"
                      description="נגלה ביחד מה אנחנו אוהבים לעשות"
                      variant="adventure"
                    />
                  )}
                </div>
              </SectionCard>
            </div>

            <div className={cn(
              "text-center p-8 rounded-2xl text-white",
              `bg-gradient-to-r ${THEME.colors.primary.main}`,
              THEME.shadows.elegant
            )}>
              <h3 className="text-2xl font-bold mb-4">
                מוכנים להכיר את {profile.user?.firstName || "המועמד המושלם"}?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                עוד המון דברים מעניינים מחכים לגילוי...
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => setActiveTab('story')}
                  className={cn(
                    "bg-white text-gray-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-full",
                    THEME.shadows.warm
                  )}
                >
                  <BookOpen className="w-5 h-5 ml-2" />
                  בואו נכיר את הסיפור
                </Button>
                <Button
                  onClick={() => setActiveTab('vision')}
                  variant="outline"
className="bg-white/20 hover:bg-white border border-white/30 text-white hover:text-rose-600 font-bold px-6 py-3 rounded-full backdrop-blur-sm transition-all"                >
                  <Heart className="w-5 h-5 ml-2" />
                  מה החלום לזוגיות
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Story Tab - Background & Journey */}
        <TabsContent value="story" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold mb-4",
              "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            )}>
              הסיפור והמסע של {profile.user?.firstName || "המועמד"}
            </h2>
            <p className="text-gray-600 text-lg">השורשים, הדרך והערכים שעיצבו את האדם הזה</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <SectionCard
              title="הזהות הדתית והרוחנית"
              subtitle="המקום של האמונה והמסורת בחיי"
              icon={BookMarked}
              variant="elegant"
              gradient={THEME.colors.primary.gold}
            >
              <div className="space-y-5">
                <DetailItem
                  icon={BookMarked}
                  label="השקפת העולם שמנחה אותי"
                  value={formatEnumValue(profile.religiousLevel, religiousLevelMap).label}
                  variant="highlight"
                />
                
                <DetailItem
                  icon={Heart}
                  label="שמירת נגיעה"
                  value={formatBooleanPreference(profile.shomerNegiah, "כן, זה חשוב לי", "לא").label}
                  variant="elegant"
                />

                {profile.gender === "FEMALE" && profile.headCovering && (
                  <DetailItem
                    icon={Crown}
                    label="כיסוי ראש"
                    value={formatEnumValue(profile.headCovering, headCoveringMap).label}
                    variant="elegant"
                  />
                )}

                {profile.gender === "MALE" && profile.kippahType && (
                  <DetailItem
                    icon={Crown}
                    label="סוג כיפה"
                    value={formatEnumValue(profile.kippahType, kippahTypeMap).label}
                    variant="elegant"
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="השכלה ועולם המקצוע"
              subtitle="הדרך האקדמית והמקצועית שלי"
              icon={GraduationCap}
              variant="elegant"
              gradient={THEME.colors.secondary.sky}
            >
              <div className="space-y-5">
                <DetailItem
                  icon={GraduationCap}
                  label="רמת ההשכלה"
                  value={formatEnumValue(profile.educationLevel, educationLevelMap).label}
                  variant="highlight"
                />

                {profile.education && (
                  <DetailItem
                    icon={BookOpen}
                    label="פירוט הלימודים"
                    value={profile.education}
                    variant="elegant"
                    valueClassName="whitespace-pre-wrap"
                  />
                )}

                <DetailItem
                  icon={Briefcase}
                  label="התחום המקצועי"
                  value={profile.occupation || "מקצוע מעניין מחכה לגילוי"}
                  variant="elegant"
                />

                <DetailItem
                  icon={Award}
                  label="השירות הצבאי/לאומי"
                  value={formatEnumValue(profile.serviceType, serviceTypeMap).label}
                  variant="elegant"
                />

                {profile.serviceDetails && (
                  <DetailItem
                    icon={InfoIcon}
                    label="פרטי השירות"
                    value={profile.serviceDetails}
                    variant="elegant"
                    valueClassName="whitespace-pre-wrap"
                  />
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="הרקע המשפחתי והתרבותי"
            subtitle="המשפחה והמקורות שעיצבו אותי"
            icon={Users2}
            variant="romantic"
            gradient={THEME.colors.primary.accent}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <DetailItem
                icon={Users2}
                label="סטטוס ההורים"
                value={profile.parentStatus || "נגלה יחד"}
                variant="elegant"
              />
              
              <DetailItem
                icon={Users}
                label="אחים ואחיות"
                value={profile.siblings ? `${profile.siblings} אחים/אחיות` : "נגלה יחד"}
                variant="elegant"
              />
              
              <DetailItem
                icon={Crown}
                label="המקום במשפחה"
                value={profile.position ? `מקום ${profile.position}` : "נגלה יחד"}
                variant="elegant"
              />

              {profile.aliyaCountry && (
                <DetailItem
                  icon={Globe}
                  label="ארץ המוצא"
                  value={`${profile.aliyaCountry} - השורשים שלי`}
                  variant="elegant"
                />
              )}

              {profile.aliyaYear && (
                <DetailItem
                  icon={Calendar}
                  label="שנת העלייה"
                  value={`${profile.aliyaYear} - הגעתי הביתה`}
                  variant="elegant"
                />
              )}

              {profile.nativeLanguage && (
                <DetailItem
                  icon={Languages}
                  label="השפה הראשונה"
                  value={formatEnumValue(profile.nativeLanguage, languageMap).label}
                  variant="elegant"
                />
              )}
            </div>

            {profile.additionalLanguages && profile.additionalLanguages.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Languages className="w-5 h-5 text-blue-500" />
                  שפות נוספות שאני מדבר/ת
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile.additionalLanguages.map(lang => {
                    const langData = formatEnumValue(lang, languageMap);
                    return (
                      <Badge
                        key={lang}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 font-semibold text-sm",
                          "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800",
                          "border border-blue-200 rounded-full",
                          THEME.shadows.soft
                        )}
                      >
                        <langData.icon className={cn("w-4 h-4", langData.color)} />
                        {langData.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Vision Tab - Dreams & Aspirations */}
        <TabsContent value="vision" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold mb-4",
              "bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent"
            )}>
              החזון והחלום לזוגיות של {profile.user?.firstName || "המועמד"}
            </h2>
            <p className="text-gray-600 text-lg">איך אני רואה את העתיד שלנו יחד</p>
          </div>

          <SectionCard
            title="הזוגיות שאני חולם/ת עליה"
            subtitle="המחשבות והרגשות שלי על אהבה ומשפחה"
            icon={Heart}
            variant="romantic"
            gradient={THEME.colors.primary.main}
          >
            {profile.matchingNotes ? (
              <div className={cn(
                "p-6 rounded-2xl border border-rose-200",
                `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                THEME.shadows.soft
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-full bg-gradient-to-r",
                    THEME.colors.primary.rose
                  )}>
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-800 mb-3 text-lg">
                      המחשבות שלי על הזוגיות המושלמת:
                    </h4>
                    <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic text-lg">
                      <Quote className="w-5 h-5 inline ml-1 text-rose-400" />
                      {profile.matchingNotes}
                      <Quote className="w-5 h-5 inline mr-1 text-rose-400 transform rotate-180" />
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // שיפור UX: טקסט משופר למצב ריק
              <EmptyState
                icon={Heart}
                title="החזון לזוגיות טרם פורט"
                description="זו הזדמנות מצוינת להתחיל שיחה ולגלות יחד!"
                variant="romantic"
              />
            )}

            <div className="mt-8 space-y-6">
              <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Baby className="w-6 h-6 text-pink-500" />
                החזון למשפחה
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {profile.maritalStatus && ["divorced", "widowed", "annulled"].includes(profile.maritalStatus) && (
                  <DetailItem
                    icon={Baby}
                    label="ילדים מקשר קודם"
                    value={formatBooleanPreference(
                      profile.hasChildrenFromPrevious, 
                      "יש ילדים יקרים", 
                      "אין ילדים", 
                      "נגלה יחד"
                    ).label}
                    variant="elegant"
                  />
                )}

                {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                  <DetailItem
                    icon={Calendar}
                    label="הגיל המועדף עליי"
                    value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                    variant="highlight"
                  />
                )}

                {(profile.preferredHeightMin || profile.preferredHeightMax) && (
                  <DetailItem
                    icon={User}
                    label="הגובה המועדף"
                    value={`${profile.preferredHeightMin || '?'} - ${profile.preferredHeightMax || '?'} ס״מ`}
                    variant="highlight"
                  />
                )}

                <DetailItem
                  icon={Heart}
                  label="שמירת נגיעה בזוגיות"
                  value={formatStringBooleanPreference(profile.preferredShomerNegiah).label}
                  variant="elegant"
                />
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* **בעיה 2: פתרון** */}
        {/* החלפנו את הלוגיקה כדי להציג הודעה אחת כללית אם אין העדפות כלל */}
        <TabsContent value="search" className="mt-0 space-y-6">
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold mb-4",
              "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
            )}>
              מה {profile.user?.firstName || "המועמד"} מחפש/ת בבן/בת הזוג
            </h2>
            <p className="text-gray-600 text-lg">התכונות והערכים שחשובים בהתאמה</p>
          </div>

          {hasAnyPreferences ? (
            <div className="space-y-8">
              {renderPreferenceBadges(
                "סטטוסים משפחתיים מועדפים",
                Heart,
                profile.preferredMaritalStatuses,
                maritalStatusMap,
                THEME.colors.primary.main
              )}

              {renderPreferenceBadges(
                "רמות דתיות מועדפות",
                BookMarked,
                profile.preferredReligiousLevels,
                religiousLevelMap,
                THEME.colors.secondary.peach
              )}

              {renderPreferenceBadges(
                "רמות השכלה מועדפות",
                GraduationCap,
                profile.preferredEducation,
                educationLevelMap,
                THEME.colors.secondary.sky
              )}
              
              {/* החלקים הבאים יוצגו רק אם יש להם ערכים */}
              {profile.preferredOccupations && profile.preferredOccupations.length > 0 && renderPreferenceBadges(
                "תחומי עיסוק מועדפים",
                Briefcase,
                profile.preferredOccupations,
                {},
                THEME.colors.secondary.sage
              )}

              {profile.preferredLocations && profile.preferredLocations.length > 0 && renderPreferenceBadges(
                "מקומות מגורים מועדפים",
                MapPin,
                profile.preferredLocations,
                {},
                THEME.colors.secondary.peach
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.preferredCharacterTraits && profile.preferredCharacterTraits.length > 0 && (
                  <SectionCard
                    title="תכונות אופי מועדפות"
                    subtitle="איך אני רואה את בן/בת הזוג שלי"
                    icon={Sparkles}
                    variant="elegant"
                    gradient={THEME.colors.primary.light}
                  >
                    <div className="flex flex-wrap gap-3">
                      {profile.preferredCharacterTraits.map(trait => {
                        const traitData = formatEnumValue(trait, characterTraitMap, trait);
                        return (
                          <Badge
                            key={trait}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 font-semibold text-sm",
                              "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800",
                              "border border-purple-200 rounded-full",
                              THEME.shadows.soft
                            )}
                          >
                            <traitData.icon className={cn("w-4 h-4", traitData.color)} />
                            {traitData.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                {profile.preferredHobbies && profile.preferredHobbies.length > 0 && (
                  <SectionCard
                    title="תחביבים מועדפים"
                    subtitle="מה נעשה יחד בזמן הפנוי"
                    icon={Heart}
                    variant="elegant"
                    gradient={THEME.colors.secondary.sage}
                  >
                    <div className="flex flex-wrap gap-3">
                      {profile.preferredHobbies.map(hobby => {
                        const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby);
                        return (
                          <Badge
                            key={hobby}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 font-semibold text-sm",
                              "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800",
                              "border border-emerald-200 rounded-full",
                              THEME.shadows.soft
                            )}
                          >
                            <hobbyData.icon className={cn("w-4 h-4", hobbyData.color)} />
                            {hobbyData.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Compass}
              title="פתוח/ה לכל האפשרויות"
              description="הלב פתוח להכיר אדם מיוחד, ללא דרישות מוקדמות. יש כאן מקום לגילויים מרגשים יחד."
              variant="discovery"
            />
          )}
        </TabsContent>

        {/* Deeper Tab - Questionnaire Answers */}
        {hasDisplayableQuestionnaireAnswers && (
          <TabsContent value="deeper" className="mt-0 space-y-6">
            <div className="text-center mb-8">
              <h2 className={cn(
                "text-3xl font-bold mb-4",
                "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
              )}>
                התשובות העמוקות מהלב של {profile.user?.firstName || "המועמד"}
              </h2>
              <p className="text-gray-600 text-lg">מחשבות אישיות ותובנות על החיים והאהבה</p>
            </div>

            {Object.entries(WORLDS).map(([worldKey, worldConfig]) => {
              const answersForWorld = (questionnaire?.formattedAnswers?.[worldKey as keyof typeof questionnaire.formattedAnswers] ?? [])
                .filter(answer => answer.isVisible !== false && (answer.answer || answer.displayText));

              if (answersForWorld.length === 0) return null;

              return (
                <SectionCard
                  key={worldKey}
                  title={worldConfig.label}
                  subtitle={worldConfig.description}
                  icon={worldConfig.icon}
                  variant="elegant"
                  gradient={worldConfig.gradient}
                >
                  <div className="grid grid-cols-1 gap-6">
                    {answersForWorld.map(answer => (
                      <QuestionnaireItem
                        key={answer.questionId}
                        answer={answer}
                        worldColor={worldConfig.accentColor}
                        worldGradient={worldConfig.gradient}
                      />
                    ))}
                  </div>
                </SectionCard>
              );
            })}
          </TabsContent>
        )}

        {/* Professional Tab - Matchmaker Info */}
        {viewMode === "matchmaker" && (
          <TabsContent value="professional" className="mt-0">
            <div className="text-center mb-8">
              <h2 className={cn(
                "text-3xl font-bold mb-4",
                "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              )}>
                מידע מקצועי לשדכן
              </h2>
              <p className="text-gray-600 text-lg">פרטים רגישים וחשובים לתהליך השידוך</p>
            </div>

            <SectionCard
              title="מידע סודי לשדכנים בלבד"
              subtitle="פרטים מקצועיים לתהליך השידוך"
              icon={Lock}
              variant="elegant"
              gradient={THEME.colors.primary.gold}
            >
              <div className={cn(
                "p-6 rounded-2xl border-2 border-amber-300/70",
                `bg-gradient-to-br ${THEME.colors.secondary.peach}`,
                THEME.shadows.elegant
              )}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <DetailItem
                    icon={Phone}
                    label="העדפת יצירת קשר"
                    value={formatEnumValue(profile.contactPreference, contactPreferenceMap, "נגלה יחד").label}
                    variant="elegant"
                  />

                  <DetailItem
                    icon={Users}
                    label="העדפת מגדר שדכן/ית"
                    value={profile.preferredMatchmakerGender ?
                      (profile.preferredMatchmakerGender === "MALE" ? "שדכן גבר" : "שדכנית אישה") :
                      "אין העדפה מיוחדת"
                    }
                    variant="elegant"
                  />
                </div>

                {profile.matchingNotes && (
                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                      <Edit3 className="w-5 h-5" />
                      הערות מיוחדות לשדכנים:
                    </h4>
                    <div className={cn(
                      "p-4 rounded-xl border border-amber-200/80",
                      "bg-amber-100/70 shadow-inner"
                    )}>
                      <p className="text-amber-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {profile.matchingNotes}
                      </p>
                    </div>
                  </div>
                )}

                <div className={cn(
                  "mt-6 p-4 rounded-xl border border-indigo-200",
                  "bg-gradient-to-r from-indigo-100 to-purple-100"
                )}>
                  <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    תובנות מקצועיות:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-indigo-700 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>פרופיל נוצר: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('he-IL') : 'לא ידוע'}</span>
                    </div>
                    {profile.lastActive && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>פעילות אחרונה: {new Date(profile.lastActive).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>השלמת פרופיל: {profile.isProfileComplete ? 'מושלם ✅' : 'דורש השלמה ⚠️'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span>סטטוס זמינות: {availability.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        )}
      </div>
    </Tabs>
  );

  // Enhanced Image Gallery for Mobile
  const MobileImageGallery = () => (
    orderedImages.length > 0 && (
      <div className={cn(
        "px-4 pt-4 pb-3",
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}>
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            הגלריה של {profile.user?.firstName || "המועמד"}
          </h3>
          <p className="text-sm text-gray-600">לחץ על תמונה להגדלה</p>
        </div>
        <ScrollArea dir="rtl" className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-3">
            {orderedImages.map((image, idx) => (
              <div
                key={image.id}
                className={cn(
                  "relative w-36 h-48 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group",
                  "border-3 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                )}
                onClick={() => handleOpenImageDialog(image)}
              >
                <Image
                  src={image.url}
                  alt={`תמונה מדהימה ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="144px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {image.isMain && (
                  <Badge className={cn(
                    "absolute top-2 right-2 text-[10px] font-bold gap-1 px-2 py-1",
                    "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
                    THEME.shadows.warm
                  )}>
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

  // Mobile Header with Enhanced Toggle
  const MobileHeader = () => (
    <div className={cn(
      "p-3 flex-shrink-0 flex justify-center items-center border-b border-rose-200/50",
      `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
      "sticky top-0 z-30 backdrop-blur-md"
    )}>
      <ToggleGroup
        type="single"
        value={mobileViewLayout}
        onValueChange={(value: 'focus' | 'detailed') => { if (value) setMobileViewLayout(value); }}
        className={cn(
          "bg-white/95 backdrop-blur-sm rounded-2xl border border-rose-200/50 p-1",
          THEME.shadows.soft
        )}
      >
        <ToggleGroupItem
          value="focus"
          aria-label="Focus view"
          className={cn(
            "rounded-xl px-4 py-2 transition-all duration-300",
            "data-[state=on]:bg-gradient-to-r data-[state=on]:from-rose-500 data-[state=on]:to-pink-500",
            "data-[state=on]:text-white data-[state=on]:shadow-md"
          )}
        >
          <Heart className="h-4 w-4" />
          <span className="mr-2 text-sm font-medium">היכרות</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="detailed"
          aria-label="Detailed view"
          className={cn(
            "rounded-xl px-4 py-2 transition-all duration-300",
            "data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-indigo-500",
            "data-[state=on]:text-white data-[state=on]:shadow-md"
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="mr-2 text-sm font-medium">מפורט</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  // Enhanced Mobile Layouts
  const DetailedMobileLayout = () => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <ProfileHeader
        profile={profile}
        age={age}
        mainImageToDisplay={mainImageToDisplay}
        availability={availability}
        viewMode={viewMode}
        onSuggestClick={() => setIsSuggestDialogOpen(true)}
        isMobile={true}
          selectedPalette={selectedPalette}
      />
      <MobileImageGallery />
      <div className={cn("p-4", `bg-gradient-to-br ${THEME.colors.neutral.cool}`)}>
        <MainContentTabs />
      </div>
    </div>
  );

  const FocusMobileLayout = () => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <ProfileHeader
        profile={profile}
        age={age}
        mainImageToDisplay={mainImageToDisplay}
        availability={availability}
        viewMode={viewMode}
        onSuggestClick={() => setIsSuggestDialogOpen(true)}
        isMobile={true}
          selectedPalette={selectedPalette}
      />
      <MobileImageGallery />

      <div className={cn("p-4 space-y-6", `bg-gradient-to-br ${THEME.colors.neutral.warm}`)}>
        
        {profile.about ? (
          <SectionCard 
            title="קצת עליי" 
            icon={Heart} 
            variant="romantic"
            gradient={THEME.colors.primary.main}
          >
            <div className={cn(
              "p-4 rounded-xl border border-rose-200/50",
              `bg-gradient-to-r ${THEME.colors.neutral.warm}`
            )}>
              <p className="text-gray-800 leading-relaxed italic font-medium">
                <Quote className="w-4 h-4 inline ml-1 text-rose-400" />
                {profile.about}
                <Quote className="w-4 h-4 inline mr-1 text-rose-400 transform rotate-180" />
              </p>
            </div>
          </SectionCard>
        ) : (
          <SectionCard 
            title="הסיפור שלי" 
            icon={Telescope} 
            variant="romantic"
          >
            <EmptyState
              icon={Telescope}
              title="יש כאן הרבה לגלות!"
              description="הסיפור האישי מחכה להיכתב יחד איתך..."
              variant="romantic"
            />
          </SectionCard>
        )}

        <SectionCard 
          title="תמצית מהירה" 
          icon={Zap} 
          variant="elegant"
          gradient={THEME.colors.primary.gold}
        >
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={BookMarked}
              label="השקפה"
              value={formatEnumValue(profile.religiousLevel, religiousLevelMap).label}
              variant="elegant"
              size="sm"
            />
            <DetailItem
              icon={Heart}
              label="שמירת נגיעה"
              value={formatBooleanPreference(profile.shomerNegiah).label}
              variant="elegant"
              size="sm"
            />
            <DetailItem
              icon={Briefcase}
              label="עיסוק"
              value={profile.occupation || "נגלה יחד"}
              variant="elegant"
              size="sm"
            />
            <DetailItem
              icon={GraduationCap}
              label="השכלה"
              value={formatEnumValue(profile.educationLevel, educationLevelMap).label}
              variant="elegant"
              size="sm"
            />
          </div>
        </SectionCard>

        {(profile.profileCharacterTraits?.length > 0 || profile.profileHobbies?.length > 0) && (
          <SectionCard 
            title="מה מיוחד בי" 
            icon={Sparkles} 
            variant="romantic"
            gradient={THEME.colors.primary.romantic}
          >
            <div className="space-y-5">
              {profile.profileCharacterTraits?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    התכונות שלי:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileCharacterTraits.slice(0, 4).map(trait => {
                      const traitData = formatEnumValue(trait, characterTraitMap, trait);
                      return (
                        <Badge
                          key={trait}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1 text-xs font-semibold",
                            "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800",
                            "border border-purple-200 rounded-full"
                          )}
                        >
                          <traitData.icon className="w-3 h-3" />
                          {traitData.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.profileHobbies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    מה אני אוהב/ת:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileHobbies.slice(0, 4).map(hobby => {
                      const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby);
                      return (
                        <Badge
                          key={hobby}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1 text-xs font-semibold",
                            "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800",
                            "border border-emerald-200 rounded-full"
                          )}
                        >
                          <hobbyData.icon className="w-3 h-3" />
                          {hobbyData.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        <SectionCard 
          title="מה אני מחפש/ת" 
          icon={Target} 
          variant="highlight"
          gradient={THEME.colors.secondary.sky}
        >
          {profile.matchingNotes ? (
            <div className={cn(
              "p-4 rounded-xl border border-blue-200/50",
              "bg-gradient-to-r from-blue-50 to-cyan-50"
            )}>
              <p className="text-blue-700 leading-relaxed italic font-medium">
                <Quote className="w-4 h-4 inline ml-1 text-blue-400" />
                {profile.matchingNotes}
                <Quote className="w-4 h-4 inline mr-1 text-blue-400 transform rotate-180" />
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="החלום שלי לזוגיות עדיין נכתב..."
              description="אבל בטוח שנגלה יחד מה מתאים לנו!"
              variant="adventure"
            />
          )}

          {(profile.preferredAgeMin || profile.preferredAgeMax) && (
            <div className="mt-5">
              <DetailItem
                icon={Calendar}
                label="טווח גילאים מועדף"
                value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                variant="elegant"
                size="sm"
              />
            </div>
          )}
        </SectionCard>

        <div className={cn(
          "text-center p-6 rounded-2xl text-white",
          `bg-gradient-to-r ${THEME.colors.primary.main}`,
          THEME.shadows.elegant
        )}>
          <h3 className="text-xl font-bold mb-3">רוצים לדעת עוד?</h3>
          <p className="mb-4 opacity-90">עוד המון דברים מעניינים מחכים לגילוי...</p>
          <Button
            onClick={() => setMobileViewLayout('detailed')}
            className={cn(
              "bg-white text-gray-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-full",
              THEME.shadows.warm
            )}
          >
            <Eye className="w-5 h-5 ml-2" />
            בואו נכיר לעומק
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isClient) {
    return (
      <Card dir="rtl" className={cn(
        "w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col h-full",
        className
      )}>
        <div className={cn(
          "p-6 border-b border-gray-200/80",
          `bg-gradient-to-r ${THEME.colors.neutral.warm}`
        )}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="h-36 w-36 rounded-full flex-shrink-0" />
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
          `bg-gradient-to-br ${THEME.colors.neutral.elegant}`,
          THEME.shadows.elegant,
          className
        )}
      >
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 z-50 text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-full"
                    onClick={handleToggleFullscreen}
                >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isFullscreen ? 'צא ממסך מלא' : 'הצג במסך מלא'}</p>
            </TooltipContent>
        </Tooltip>

        {isDesktop ? (
          <ResizablePanelGroup direction="horizontal" dir="rtl" className="flex-grow min-h-0">
            <ResizablePanel defaultSize={60} minSize={40} className="min-w-0 flex flex-col">
              <ProfileHeader
                profile={profile}
                age={age}
                mainImageToDisplay={mainImageToDisplay}
                availability={availability}
                viewMode={viewMode}
                onSuggestClick={() => setIsSuggestDialogOpen(true)}
                selectedPalette={selectedPalette}
              />
              <ScrollArea className="flex-grow min-h-0">
                <div className="p-6">
                  <MainContentTabs />
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle className={cn(
              "bg-gradient-to-b from-rose-200 to-pink-200 hover:from-rose-300 hover:to-pink-300",
              "transition-all duration-300"
            )} />

            <ResizablePanel defaultSize={40} minSize={25} className="min-w-0 flex flex-col">
              <ScrollArea className="flex-grow min-h-0">
                <div className="p-6 space-y-6">
                  
                  <SectionCard
                    title="הגלריה האישית"
                    subtitle="התמונות שמספרות את הסיפור"
                    icon={Camera}
                    variant="romantic"
                    gradient={THEME.colors.primary.rose}
                  >
                    {orderedImages.length > 0 ? (
                      <div className="space-y-4">
                        <div
                          className={cn(
                            "relative aspect-video rounded-2xl overflow-hidden cursor-pointer group",
                            "border-3 border-white shadow-lg hover:shadow-xl transition-all duration-300"
                          )}
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
                                className={cn(
                                  "relative aspect-square rounded-xl overflow-hidden cursor-pointer",
                                  "border-2 border-transparent hover:border-rose-400 transition-all duration-300",
                                  "shadow-md hover:shadow-lg"
                                )}
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
                        title="התמונות בדרך אלינו..."
                        description="הגלריה האישית מחכה להיחשף"
                        variant="romantic"
                      />
                    )}
                  </SectionCard>

                  <SectionCard
                    title="הנקודות החמות"
                    subtitle="מה שחשוב לדעת ברגע הראשון"
                    icon={Flame}
                    variant="highlight"
                    gradient={THEME.colors.primary.gold}
                  >
                    <div className="space-y-4">
                      <DetailItem
                        icon={BookMarked}
                        label="השקפת עולם"
                        value={formatEnumValue(profile.religiousLevel, religiousLevelMap).label}
                        variant="highlight"
                      />
                      <DetailItem
                        icon={Heart}
                        label="שמירת נגיעה"
                        value={formatBooleanPreference(profile.shomerNegiah).label}
                        variant="elegant"
                      />
                      <DetailItem
                        icon={Briefcase}
                        label="התחום המקצועי"
                        value={profile.occupation || "מקצוע מעניין מחכה לגילוי"}
                        variant="elegant"
                      />
                      <DetailItem
                        icon={GraduationCap}
                        label="רמת השכלה"
                        value={formatEnumValue(profile.educationLevel, educationLevelMap).label}
                        variant="elegant"
                      />
                      <DetailItem
                        icon={MapPin}
                        label="מיקום"
                        value={profile.city || "איפה שהלב נמצא"}
                        variant="elegant"
                      />

                      {profile.maritalStatus && ["divorced", "widowed", "annulled"].includes(profile.maritalStatus) && (
                        <DetailItem
                          icon={Baby}
                          label="ילדים מקשר קודם"
                          value={formatBooleanPreference(
                            profile.hasChildrenFromPrevious, 
                            "יש ילדים יקרים", 
                            "אין ילדים", 
                            "נגלה יחד"
                          ).label}
                          variant="elegant"
                        />
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="הסיפור שמאחורי הפרופיל"
                    subtitle="מילים מהלב"
                    icon={Quote}
                    variant="romantic"
                    gradient={THEME.colors.primary.romantic}
                  >
                    {profile.about ? (
                      <div className={cn(
                        "p-4 rounded-xl border border-rose-200/50 shadow-inner",
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                      )}>
                        <Quote className="w-6 h-6 text-rose-400 mb-2" />
                        <p className="text-gray-800 leading-relaxed italic font-medium">
                          {profile.about}
                        </p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Telescope}
                        title="הסיפור מחכה להיכתב..."
                        description="יש כאן אדם מעניין שמחכה לגילוי!"
                        variant="discovery"
                      />
                    )}
                  </SectionCard>

                  <SectionCard
                    title="החלום לזוגיות"
                    subtitle="מה מחכה למי שיבוא"
                    icon={Target}
                    variant="highlight"
                    gradient={THEME.colors.secondary.sky}
                  >
                    {profile.matchingNotes ? (
                      <div className={cn(
                        "p-4 rounded-xl border border-blue-200/50 shadow-inner",
                        "bg-gradient-to-r from-blue-50 to-cyan-50"
                      )}>
                        <Heart className="w-6 h-6 text-blue-400 mb-2" />
                        <p className="text-blue-700 leading-relaxed italic font-medium">
                          {profile.matchingNotes}
                        </p>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Heart}
                        title="החלום עדיין לא נכתב..."
                        description="אבל בטוח שזה יהיה משהו יפה!"
                        variant="adventure"
                      />
                    )}

                    <div className="mt-4 space-y-3">
                      {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                        <DetailItem
                          icon={Calendar}
                          label="טווח גילאים מועדף"
                          value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                          variant="elegant"
                        />
                      )}

                      {profile.preferredReligiousLevels && profile.preferredReligiousLevels.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                            <BookMarked className="w-4 h-4" />
                            רמות דתיות מועדפות:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferredReligiousLevels.slice(0, 3).map(level => {
                              const levelData = formatEnumValue(level, religiousLevelMap, level);
                              return (
                                <Badge
                                  key={level}
                                  className={cn(
                                    "flex items-center gap-1 text-xs px-2 py-1 font-semibold rounded-full",
                                    "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800",
                                    "border border-indigo-200"
                                  )}
                                >
                                  <levelData.icon className="w-3 h-3" />
                                  {levelData.label}
                                </Badge>
                              );
                            })}
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
            <MobileHeader />
            {mobileViewLayout === 'detailed' ? <DetailedMobileLayout /> : <FocusMobileLayout />}
          </div>
        )}

        {selectedImageForDialog && (
          <Dialog open={!!selectedImageForDialog} onOpenChange={isOpen => !isOpen && handleCloseImageDialog()}>
            <DialogContent className={cn(
              "max-w-5xl w-[95vw] h-[90vh] p-0 border-none rounded-2xl flex flex-col",
              "bg-black/95 backdrop-blur-md"
            )} dir="rtl">
              <DialogHeader className={cn(
                "p-4 text-white flex-row justify-between items-center border-b border-gray-700/50",
                "bg-black/80 backdrop-blur-sm"
              )}>
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
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full",
                        "bg-black/50 hover:bg-black/70 text-white border border-white/20",
                        "backdrop-blur-sm transition-all hover:scale-110"
                      )}
                      onClick={() => handleDialogNav("prev")}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full",
                        "bg-black/50 hover:bg-black/70 text-white border border-white/20",
                        "backdrop-blur-sm transition-all hover:scale-110"
                      )}
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
                            "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer",
                            "border-2 transition-all hover:scale-105",
                            img.id === selectedImageForDialog.id
                              ? "border-rose-400 ring-2 ring-rose-400/50"
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
