'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Image from 'next/image';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
  Search,
  Target,
  UserCheck,
  Link as LinkIcon,
  Handshake,
  Edit3,
  ExternalLink,
  Bot,
  Coffee,
  Camera,
  Music,
  Globe,
  Compass,
  Telescope,
  Crown,
  Zap,
  Gift,
  ArrowRight,
  Quote,
  ChevronDown,
  Moon,
  Sun,
  Baby,
  Home,
  Flame,
  MessageCircle,
  Play,
  Plus,
  Lightbulb,
  Mountain,
  Share2,
  Download,
  Printer,
  Bookmark,
  Search as SearchIcon,
  Filter,
  SortDesc,
  MessageSquare,
  Phone as PhoneIcon,
  Mail,
  Send,
  Stars,
  Sparkle,
  Sunrise,
  Sunset,
  TreePine,
  Flower,
  Rainbow,
  Waves,
  Wind,
  Shield,
  ArrowLeft,
} from 'lucide-react';

// Types and Interfaces
import type {
  UserProfile,
  UserImage as UserImageType,
  QuestionnaireResponse,
  FormattedAnswer,
  ServiceType,
  HeadCoveringType,
  KippahType,
} from '@/types/next-auth';
import { languageOptions } from '@/lib/languageOptions';
import type { Candidate } from '@/app/components/matchmaker/new/types/candidates';

import NewSuggestionForm from '@/app/components/matchmaker/suggestions/NewSuggestionForm';

// Enhanced Interfaces with Responsive Support
interface CreateSuggestionData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  firstPartyId: string;
  secondPartyId: string;
  status:
    | 'DRAFT'
    | 'PENDING_FIRST_PARTY'
    | 'FIRST_PARTY_APPROVED'
    | 'FIRST_PARTY_DECLINED'
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

interface ExcitementFactor {
  icon: React.ElementType;
  text: string;
  gradient: string;
  shortText?: string; // הוספה למובייל
}

// Enhanced Color Palette & Theme with Responsive Support
const COLOR_PALETTES = {
  professional: {
    name: 'כחול-אפור',
    colors: {
      primary: {
        main: 'from-gray-700 via-gray-800 to-gray-900',
        mainSm: 'from-gray-600 via-gray-700 to-gray-800', // גרסה קלה יותר למובייל
        accent: 'from-blue-600 via-blue-700 to-blue-800',
        accentSm: 'from-blue-500 via-blue-600 to-blue-700',
        light: 'from-gray-100 via-gray-200 to-gray-300',
        lightSm: 'from-gray-50 via-gray-100 to-gray-200',
        romantic: 'from-blue-600 via-blue-700 to-blue-800',
        romanticSm: 'from-blue-500 via-blue-600 to-blue-700',
        rose: 'from-blue-500 via-blue-600 to-blue-700',
        roseSm: 'from-blue-400 via-blue-500 to-blue-600',
        gold: 'from-gray-400 via-gray-500 to-gray-600',
        goldSm: 'from-gray-300 via-gray-400 to-gray-500',
        elegant: 'from-gray-700 via-gray-800 to-gray-900',
        elegantSm: 'from-gray-600 via-gray-700 to-gray-800',
      },
      secondary: {
        sage: 'from-gray-300 via-gray-400 to-gray-500',
        sageSm: 'from-gray-200 via-gray-300 to-gray-400',
        sky: 'from-blue-100 via-blue-200 to-blue-300',
        skySm: 'from-blue-50 via-blue-100 to-blue-200',
        lavender: 'from-gray-200 via-gray-300 to-gray-400',
        lavenderSm: 'from-gray-100 via-gray-200 to-gray-300',
        peach: 'from-orange-100 via-amber-100 to-yellow-200',
        peachSm: 'from-orange-50 via-amber-50 to-yellow-100',
      },
      neutral: {
        warm: 'from-gray-50 via-white to-gray-100',
        warmSm: 'from-gray-25 via-white to-gray-50',
        cool: 'from-slate-50 via-gray-50 to-zinc-50',
        coolSm: 'from-slate-25 via-gray-25 to-zinc-25',
        elegant: 'from-white via-gray-50 to-neutral-100',
        elegantSm: 'from-white via-gray-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-gray-200/25',
      elegantSm: 'shadow-md shadow-gray-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-gray-200/30',
      warmSm: 'shadow-sm shadow-gray-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-gray-100/40',
      softSm: 'shadow-xs shadow-gray-100/30',
    },
  },
  feminine: {
    name: 'ורוד-אדום',
    colors: {
      primary: {
        main: 'from-rose-400 via-pink-400 to-rose-500',
        mainSm: 'from-rose-300 via-pink-300 to-rose-400',
        accent: 'from-pink-500 via-rose-500 to-red-400',
        accentSm: 'from-pink-400 via-rose-400 to-red-300',
        light: 'from-pink-100 via-rose-100 to-red-100',
        lightSm: 'from-pink-50 via-rose-50 to-red-50',
        romantic: 'from-rose-400 via-pink-400 to-rose-500',
        romanticSm: 'from-rose-300 via-pink-300 to-rose-400',
        rose: 'from-rose-400 via-pink-400 to-rose-500',
        roseSm: 'from-rose-300 via-pink-300 to-rose-400',
        gold: 'from-amber-200 via-yellow-200 to-orange-300',
        goldSm: 'from-amber-100 via-yellow-100 to-orange-200',
        elegant: 'from-pink-500 via-rose-500 to-red-400',
        elegantSm: 'from-pink-400 via-rose-400 to-red-300',
      },
      secondary: {
        sage: 'from-pink-200 via-rose-200 to-red-200',
        sageSm: 'from-pink-100 via-rose-100 to-red-100',
        sky: 'from-purple-200 via-pink-200 to-rose-300',
        skySm: 'from-purple-100 via-pink-100 to-rose-200',
        lavender: 'from-purple-200 via-violet-200 to-purple-300',
        lavenderSm: 'from-purple-100 via-violet-100 to-purple-200',
        peach: 'from-pink-200 via-rose-200 to-orange-300',
        peachSm: 'from-pink-100 via-rose-100 to-orange-200',
      },
      neutral: {
        warm: 'from-rose-50 via-pink-50 to-orange-50',
        warmSm: 'from-rose-25 via-pink-25 to-orange-25',
        cool: 'from-purple-50 via-pink-50 to-rose-50',
        coolSm: 'from-purple-25 via-pink-25 to-rose-25',
        elegant: 'from-pink-50 via-rose-50 to-neutral-100',
        elegantSm: 'from-pink-25 via-rose-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-pink-200/25',
      elegantSm: 'shadow-md shadow-pink-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-rose-200/30',
      warmSm: 'shadow-sm shadow-rose-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-pink-100/40',
      softSm: 'shadow-xs shadow-pink-100/30',
    },
  },
  masculine: {
    name: 'כחול-ירוק',
    colors: {
      primary: {
        main: 'from-blue-600 via-indigo-600 to-blue-700',
        mainSm: 'from-blue-500 via-indigo-500 to-blue-600',
        accent: 'from-cyan-500 via-blue-500 to-indigo-600',
        accentSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        light: 'from-blue-100 via-indigo-100 to-cyan-100',
        lightSm: 'from-blue-50 via-indigo-50 to-cyan-50',
        romantic: 'from-cyan-500 via-blue-500 to-indigo-600',
        romanticSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        rose: 'from-cyan-500 via-blue-500 to-indigo-600',
        roseSm: 'from-cyan-400 via-blue-400 to-indigo-500',
        gold: 'from-blue-200 via-cyan-200 to-teal-300',
        goldSm: 'from-blue-100 via-cyan-100 to-teal-200',
        elegant: 'from-blue-600 via-indigo-600 to-blue-700',
        elegantSm: 'from-blue-500 via-indigo-500 to-blue-600',
      },
      secondary: {
        sage: 'from-emerald-300 via-teal-300 to-cyan-400',
        sageSm: 'from-emerald-200 via-teal-200 to-cyan-300',
        sky: 'from-blue-200 via-sky-200 to-indigo-300',
        skySm: 'from-blue-100 via-sky-100 to-indigo-200',
        lavender: 'from-indigo-200 via-blue-200 to-cyan-300',
        lavenderSm: 'from-indigo-100 via-blue-100 to-cyan-200',
        peach: 'from-blue-200 via-cyan-200 to-teal-300',
        peachSm: 'from-blue-100 via-cyan-100 to-teal-200',
      },
      neutral: {
        warm: 'from-blue-50 via-indigo-50 to-cyan-50',
        warmSm: 'from-blue-25 via-indigo-25 to-cyan-25',
        cool: 'from-slate-50 via-blue-50 to-indigo-50',
        coolSm: 'from-slate-25 via-blue-25 to-indigo-25',
        elegant: 'from-gray-50 via-blue-50 to-neutral-100',
        elegantSm: 'from-gray-25 via-blue-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-blue-200/25',
      elegantSm: 'shadow-md shadow-blue-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-indigo-200/30',
      warmSm: 'shadow-sm shadow-indigo-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-blue-100/40',
      softSm: 'shadow-xs shadow-blue-100/30',
    },
  },
  luxury: {
    name: 'זהב-סגול',
    colors: {
      primary: {
        main: 'from-amber-500 via-yellow-500 to-amber-600',
        mainSm: 'from-amber-400 via-yellow-400 to-amber-500',
        accent: 'from-purple-600 via-indigo-600 to-purple-700',
        accentSm: 'from-purple-500 via-indigo-500 to-purple-600',
        light: 'from-amber-100 via-yellow-100 to-gold-100',
        lightSm: 'from-amber-50 via-yellow-50 to-gold-50',
        romantic: 'from-purple-600 via-indigo-600 to-purple-700',
        romanticSm: 'from-purple-500 via-indigo-500 to-purple-600',
        rose: 'from-purple-600 via-indigo-600 to-purple-700',
        roseSm: 'from-purple-500 via-indigo-500 to-purple-600',
        gold: 'from-amber-500 via-yellow-500 to-amber-600',
        goldSm: 'from-amber-400 via-yellow-400 to-amber-500',
        elegant: 'from-amber-500 via-yellow-500 to-amber-600',
        elegantSm: 'from-amber-400 via-yellow-400 to-amber-500',
      },
      secondary: {
        sage: 'from-emerald-400 via-teal-400 to-cyan-500',
        sageSm: 'from-emerald-300 via-teal-300 to-cyan-400',
        sky: 'from-indigo-300 via-purple-300 to-violet-400',
        skySm: 'from-indigo-200 via-purple-200 to-violet-300',
        lavender: 'from-purple-300 via-violet-300 to-indigo-400',
        lavenderSm: 'from-purple-200 via-violet-200 to-indigo-300',
        peach: 'from-amber-300 via-yellow-300 to-orange-400',
        peachSm: 'from-amber-200 via-yellow-200 to-orange-300',
      },
      neutral: {
        warm: 'from-amber-50 via-yellow-50 to-orange-50',
        warmSm: 'from-amber-25 via-yellow-25 to-orange-25',
        cool: 'from-purple-50 via-indigo-50 to-violet-50',
        coolSm: 'from-purple-25 via-indigo-25 to-violet-25',
        elegant: 'from-gray-50 via-amber-50 to-neutral-100',
        elegantSm: 'from-gray-25 via-amber-25 to-neutral-50',
      },
    },
    shadows: {
      elegant: 'shadow-lg sm:shadow-xl shadow-amber-200/25',
      elegantSm: 'shadow-md shadow-amber-200/20',
      warm: 'shadow-md sm:shadow-lg shadow-yellow-200/30',
      warmSm: 'shadow-sm shadow-yellow-200/25',
      soft: 'shadow-sm sm:shadow-md shadow-amber-100/40',
      softSm: 'shadow-xs shadow-amber-100/30',
    },
  },
} as const;

type ColorPaletteName = keyof typeof COLOR_PALETTES;

// Enhanced Type for Theme
type ThemeType = {
  colors: {
    primary: {
      main: string;
      mainSm: string;
      accent: string;
      accentSm: string;
      light: string;
      lightSm: string;
      romantic: string;
      romanticSm: string;
      rose: string;
      roseSm: string;
      gold: string;
      goldSm: string;
      elegant: string;
      elegantSm: string;
    };
    secondary: {
      sage: string;
      sageSm: string;
      sky: string;
      skySm: string;
      lavender: string;
      lavenderSm: string;
      peach: string;
      peachSm: string;
    };
    neutral: {
      warm: string;
      warmSm: string;
      cool: string;
      coolSm: string;
      elegant: string;
      elegantSm: string;
    };
  };
  shadows: {
    elegant: string;
    elegantSm: string;
    warm: string;
    warmSm: string;
    soft: string;
    softSm: string;
  };
};

// Enhanced Data & Translation Maps with Responsive Support
const maritalStatusMap: {
  [key: string]: {
    label: string;
    shortLabel?: string; // הוספה למובייל
    icon: React.ElementType;
    color: string;
    mobileClasses?: string; // כיתות CSS מותאמות למובייל
  };
} = {
  single: {
    label: 'רווק/ה',
    shortLabel: 'רווק',
    icon: Heart,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  divorced: {
    label: 'גרוש/ה',
    shortLabel: 'גרוש',
    icon: Sunrise,
    color: 'text-amber-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  widowed: {
    label: 'אלמן/ה',
    shortLabel: 'אלמן',
    icon: Stars,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  annulled: {
    label: 'מוכן/ה לאהבה חדשה',
    shortLabel: 'מוכן לאהבה',
    icon: Rainbow,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  any: {
    label: 'פתוח/ה לכל האפשרויות',
    shortLabel: 'פתוח',
    icon: Sparkles,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const religiousLevelMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  charedi: {
    label: 'חרדי/ת',
    shortLabel: 'חרדי',
    icon: BookMarked,
    color: 'text-indigo-700',
    mobileClasses: 'text-xs sm:text-sm',
  },
  charedi_modern: {
    label: 'חרדי/ת מודרני/ת',
    shortLabel: 'חרדי מודרני',
    icon: BookOpen,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  dati_leumi_torani: {
    label: 'דתי/ה לאומי/ת תורני/ת',
    shortLabel: 'דתי תורני',
    icon: Star,
    color: 'text-blue-700',
    mobileClasses: 'text-xs sm:text-sm',
  },
  dati_leumi_liberal: {
    label: 'דתי/ה לאומי/ת ליברלי/ת',
    shortLabel: 'דתי ליברלי',
    icon: Flower,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  dati_leumi_standard: {
    label: 'דתי/ה לאומי/ת',
    shortLabel: 'דתי לאומי',
    icon: Crown,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  masorti_strong: {
    label: 'מסורתי/ת (חזק)',
    shortLabel: 'מסורתי חזק',
    icon: TreePine,
    color: 'text-emerald-700',
    mobileClasses: 'text-xs sm:text-sm',
  },
  masorti_light: {
    label: 'מסורתי/ת (קל)',
    shortLabel: 'מסורתי קל',
    icon: Wind,
    color: 'text-emerald-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  secular_traditional_connection: {
    label: 'חילוני/ת עם זיקה',
    shortLabel: 'חילוני עם זיקה',
    icon: Waves,
    color: 'text-cyan-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  secular: {
    label: 'חילוני/ת',
    shortLabel: 'חילוני',
    icon: Sunrise,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  spiritual_not_religious: {
    label: 'רוחני/ת',
    shortLabel: 'רוחני',
    icon: Sparkle,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  other: {
    label: 'ייחודי/ת',
    shortLabel: 'ייחודי',
    icon: Rainbow,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  'לא משנה': {
    label: 'פתוח/ה לכל השקפה',
    shortLabel: 'פתוח',
    icon: Globe,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const educationLevelMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  high_school: {
    label: 'תיכונית',
    shortLabel: 'תיכון',
    icon: School,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  vocational: {
    label: 'מקצועית',
    shortLabel: 'מקצועי',
    icon: Award,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  academic_student: {
    label: 'במהלך לימודים',
    shortLabel: 'סטודנט',
    icon: BookOpen,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  academic_ba: {
    label: 'בוגר/ת תואר ראשון',
    shortLabel: 'ב.א',
    icon: GraduationCap,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  academic_ma: {
    label: 'בוגר/ת תואר שני',
    shortLabel: 'מ.א',
    icon: Star,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  academic_phd: {
    label: 'דוקטור/ת',
    shortLabel: 'דוקטור',
    icon: Crown,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  yeshiva_seminary: {
    label: 'לימודים תורניים',
    shortLabel: 'תורני',
    icon: BookMarked,
    color: 'text-amber-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  other: {
    label: 'ייחודי/ת',
    shortLabel: 'ייחודי',
    icon: Sparkles,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  'ללא העדפה': {
    label: 'הכל פתוח',
    shortLabel: 'פתוח',
    icon: Globe,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const serviceTypeMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  MILITARY_COMBATANT: {
    label: 'לוחם/ת',
    shortLabel: 'לוחם',
    icon: Award,
    color: 'text-red-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  MILITARY_SUPPORT: {
    label: 'תומך/ת לחימה',
    shortLabel: 'תומך',
    icon: Users,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  MILITARY_OFFICER: {
    label: 'קצין/ה',
    shortLabel: 'קצין',
    icon: Crown,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  MILITARY_INTELLIGENCE_CYBER_TECH: {
    label: 'טכנולוגיה ומודיעין',
    shortLabel: 'טכנולוגיה',
    icon: Zap,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  NATIONAL_SERVICE_ONE_YEAR: {
    label: 'שירות לאומי',
    shortLabel: 'שירות לאומי',
    icon: Heart,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  NATIONAL_SERVICE_TWO_YEARS: {
    label: 'שירות לאומי מורחב',
    shortLabel: 'שירות מורחב',
    icon: Stars,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  HESDER_YESHIVA: {
    label: 'ישיבת הסדר',
    shortLabel: 'הסדר',
    icon: BookMarked,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  YESHIVA_ONLY_POST_HS: {
    label: 'לימודים תורניים',
    shortLabel: 'תורני',
    icon: BookOpen,
    color: 'text-amber-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  PRE_MILITARY_ACADEMY_AND_SERVICE: {
    label: 'מכינה ושירות',
    shortLabel: 'מכינה',
    icon: GraduationCap,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  EXEMPTED: {
    label: 'פטור',
    shortLabel: 'פטור',
    icon: Shield,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  CIVILIAN_SERVICE: {
    label: 'שירות אזרחי',
    shortLabel: 'אזרחי',
    icon: Users2,
    color: 'text-teal-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  OTHER: {
    label: 'ייחודי',
    shortLabel: 'ייחודי',
    icon: Sparkles,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const headCoveringMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  FULL_COVERAGE: {
    label: 'כיסוי מלא',
    shortLabel: 'מלא',
    icon: Crown,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  PARTIAL_COVERAGE: {
    label: 'כיסוי חלקי',
    shortLabel: 'חלקי',
    icon: Flower,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  HAT_BERET: {
    label: 'כובע/ברט',
    shortLabel: 'כובע',
    icon: Sun,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  SCARF_ONLY_SOMETIMES: {
    label: 'מטפחת לאירועים',
    shortLabel: 'לאירועים',
    icon: Sparkle,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  NONE: {
    label: 'ללא כיסוי',
    shortLabel: 'ללא',
    icon: Wind,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  any: {
    label: 'גמיש/ה',
    shortLabel: 'גמיש',
    icon: Rainbow,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const kippahTypeMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  BLACK_VELVET: {
    label: 'קטיפה שחורה',
    shortLabel: 'קטיפה',
    icon: Crown,
    color: 'text-indigo-700',
    mobileClasses: 'text-xs sm:text-sm',
  },
  KNITTED_SMALL: {
    label: 'סרוגה קטנה',
    shortLabel: 'סרוגה קטנה',
    icon: Star,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  KNITTED_LARGE: {
    label: 'סרוגה גדולה',
    shortLabel: 'סרוגה גדולה',
    icon: Stars,
    color: 'text-blue-700',
    mobileClasses: 'text-xs sm:text-sm',
  },
  CLOTH: {
    label: 'בד',
    shortLabel: 'בד',
    icon: Flower,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  BRESLEV: {
    label: 'ברסלב',
    shortLabel: 'ברסלב',
    icon: Sparkle,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  NONE_AT_WORK_OR_CASUAL: {
    label: 'לא בעבודה',
    shortLabel: 'לא בעבודה',
    icon: Briefcase,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  NONE_USUALLY: {
    label: 'לרוב לא',
    shortLabel: 'לרוב לא',
    icon: Wind,
    color: 'text-gray-500',
    mobileClasses: 'text-xs sm:text-sm',
  },
  OTHER: {
    label: 'ייחודי',
    shortLabel: 'ייחודי',
    icon: Rainbow,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  any: {
    label: 'גמיש',
    shortLabel: 'גמיש',
    icon: Globe,
    color: 'text-teal-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const languageMap = languageOptions.reduce(
  (acc, lang) => {
    acc[lang.value] = {
      label: lang.label,
      shortLabel:
        lang.label.length > 8 ? lang.label.substring(0, 8) + '...' : lang.label,
      icon: Globe,
      color: 'text-blue-600',
      mobileClasses: 'text-xs sm:text-sm',
    };
    return acc;
  },
  {} as {
    [key: string]: {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      color: string;
      mobileClasses?: string;
    };
  }
);

const contactPreferenceMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  direct: {
    label: 'ישירות',
    shortLabel: 'ישירות',
    icon: PhoneIcon,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  matchmaker: {
    label: 'דרך השדכן/ית',
    shortLabel: 'דרך שדכן',
    icon: Users,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  both: {
    label: 'גמיש/ה',
    shortLabel: 'גמיש',
    icon: MessageSquare,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const characterTraitMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  empathetic: {
    label: 'אמפתי/ת',
    shortLabel: 'אמפתי',
    icon: Heart,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  driven: {
    label: 'שאפתן/ית',
    shortLabel: 'שאפתן',
    icon: Zap,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  optimistic: {
    label: 'אופטימי/ת',
    shortLabel: 'אופטימי',
    icon: Sunrise,
    color: 'text-yellow-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  family_oriented: {
    label: 'משפחתי/ת',
    shortLabel: 'משפחתי',
    icon: Users2,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  intellectual: {
    label: 'אינטלקטואל/ית',
    shortLabel: 'אינטלקטואל',
    icon: BookOpen,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  organized: {
    label: 'מאורגנ/ת',
    shortLabel: 'מאורגן',
    icon: CheckCircle,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  calm: {
    label: 'רגוע/ה',
    shortLabel: 'רגוע',
    icon: Waves,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  humorous: {
    label: 'מצחיק/ה',
    shortLabel: 'מצחיק',
    icon: Smile,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  sociable: {
    label: 'חברותי/ת',
    shortLabel: 'חברותי',
    icon: Users,
    color: 'text-cyan-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  sensitive: {
    label: 'רגיש/ה',
    shortLabel: 'רגיש',
    icon: Flower,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  independent: {
    label: 'עצמאי/ת',
    shortLabel: 'עצמאי',
    icon: Crown,
    color: 'text-amber-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  creative: {
    label: 'יצירתי/ת',
    shortLabel: 'יצירתי',
    icon: Palette,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  honest: {
    label: 'כן/ה וישר/ה',
    shortLabel: 'כן וישר',
    icon: Star,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  responsible: {
    label: 'אחראי/ת',
    shortLabel: 'אחראי',
    icon: Award,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  easy_going: {
    label: 'זורם/ת וקליל/ה',
    shortLabel: 'זורם',
    icon: Wind,
    color: 'text-teal-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  no_strong_preference: {
    label: 'פתוח/ה לגילוי',
    shortLabel: 'פתוח',
    icon: Compass,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

const hobbiesMap: {
  [key: string]: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
    mobileClasses?: string;
  };
} = {
  travel: {
    label: 'טיולים',
    shortLabel: 'טיולים',
    icon: Compass,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  sports: {
    label: 'ספורט',
    shortLabel: 'ספורט',
    icon: Zap,
    color: 'text-orange-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  reading: {
    label: 'קריאה',
    shortLabel: 'קריאה',
    icon: BookOpen,
    color: 'text-indigo-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  cooking_baking: {
    label: 'בישול ואפיה',
    shortLabel: 'בישול',
    icon: Coffee,
    color: 'text-amber-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  music_playing_instrument: {
    label: 'מוזיקה',
    shortLabel: 'מוזיקה',
    icon: Music,
    color: 'text-purple-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  art_crafts: {
    label: 'אומנות ויצירה',
    shortLabel: 'אומנות',
    icon: Palette,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  volunteering: {
    label: 'התנדבות',
    shortLabel: 'התנדבות',
    icon: Heart,
    color: 'text-rose-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  learning_courses: {
    label: 'למידה',
    shortLabel: 'למידה',
    icon: GraduationCap,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  board_games_puzzles: {
    label: 'משחקים',
    shortLabel: 'משחקים',
    icon: Play,
    color: 'text-cyan-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  movies_theater: {
    label: 'סרטים ותיאטרון',
    shortLabel: 'סרטים',
    icon: Camera,
    color: 'text-red-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  dancing: {
    label: 'ריקוד',
    shortLabel: 'ריקוד',
    icon: Sparkle,
    color: 'text-pink-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  writing: {
    label: 'כתיבה',
    shortLabel: 'כתיבה',
    icon: Edit3,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  nature_hiking: {
    label: 'טבע וטיולים',
    shortLabel: 'טבע',
    icon: TreePine,
    color: 'text-green-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  photography: {
    label: 'צילום',
    shortLabel: 'צילום',
    icon: Camera,
    color: 'text-blue-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
  no_strong_preference: {
    label: 'פתוח/ה לגילוי יחד',
    shortLabel: 'פתוח',
    icon: Rainbow,
    color: 'text-gray-600',
    mobileClasses: 'text-xs sm:text-sm',
  },
};

// --- Enhanced Helper Functions with Responsive Support ---

/**
 * פונקציית עזר לעיצוב ערכי enum עם תמיכה רספונסיבית
 */
const formatEnumValue = (
  value: string | null | undefined,
  map: {
    [key: string]: {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      color: string;
      mobileClasses?: string;
    };
  },
  placeholder: string = 'עוד נגלה יחד...',
  useMobile: boolean = false // פרמטר חדש למובייל
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  if (!value || !map[value]) {
    return {
      label: placeholder,
      shortLabel:
        useMobile && placeholder.length > 10
          ? placeholder.substring(0, 10) + '...'
          : placeholder,
      icon: Telescope,
      color: 'text-gray-500',
      mobileClasses: 'text-xs sm:text-sm',
    };
  }

  const result = map[value];
  return {
    ...result,
    shortLabel:
      result.shortLabel ||
      (useMobile && result.label.length > 10
        ? result.label.substring(0, 10) + '...'
        : result.label),
  };
};

/**
 * פונקציית יצירת ראשי תיבות מותאמת לרספונסיביות
 */
const getInitials = (
  firstName?: string,
  lastName?: string,
  maxLength: number = 2
): string => {
  let initials = '';
  if (firstName && firstName.length > 0) initials += firstName[0];
  if (lastName && lastName.length > 0) initials += lastName[0];

  if (initials.length === 0 && firstName && firstName.length > 0) {
    initials =
      firstName.length > 1
        ? firstName.substring(0, Math.min(maxLength, firstName.length))
        : firstName[0];
  }

  return initials.toUpperCase() || '♥';
};

/**
 * חישוב גיל - ללא שינוי
 */
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
    return 0;
  }
};

/**
 * עיצוב סטטוס זמינות עם responsive badge styles
 */
const formatAvailabilityStatus = (
  status: UserProfile['availabilityStatus'] | undefined,
  THEME: ThemeType
) => {
  const statusMap = {
    AVAILABLE: {
      text: 'זמין/ה להכרות מרגשות',
      shortText: 'זמין', // הוספה למובייל
      gradient: THEME.colors.primary.main,
      gradientSm: THEME.colors.primary.mainSm, // גרדיאנט קל יותר למובייל
      icon: Heart,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
      bgColorSm: 'bg-gradient-to-r from-emerald-400 to-green-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    UNAVAILABLE: {
      text: 'לא זמין/ה כרגע',
      shortText: 'לא זמין',
      gradient: 'from-gray-400 to-gray-500',
      gradientSm: 'from-gray-300 to-gray-400',
      icon: Clock,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
      bgColorSm: 'bg-gradient-to-r from-gray-300 to-gray-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    DATING: {
      text: 'בתהליך היכרות',
      shortText: 'בהיכרות',
      gradient: THEME.colors.primary.accent,
      gradientSm: THEME.colors.primary.accentSm,
      icon: Coffee,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      bgColorSm: 'bg-gradient-to-r from-amber-400 to-orange-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    PAUSED: {
      text: 'בהפסקה זמנית',
      shortText: 'בהפסקה',
      gradient: THEME.colors.secondary.sky,
      gradientSm: THEME.colors.secondary.skySm,
      icon: Moon,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      bgColorSm: 'bg-gradient-to-r from-blue-400 to-cyan-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    ENGAGED: {
      text: 'מאורס/ת',
      shortText: 'מאורס',
      gradient: THEME.colors.primary.light,
      gradientSm: THEME.colors.primary.lightSm,
      icon: Star,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
      bgColorSm: 'bg-gradient-to-r from-pink-400 to-rose-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    MARRIED: {
      text: 'נשוי/אה',
      shortText: 'נשוי',
      gradient: THEME.colors.primary.main,
      gradientSm: THEME.colors.primary.mainSm,
      icon: Heart,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
      bgColorSm: 'bg-gradient-to-r from-rose-400 to-pink-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
  };

  return (
    statusMap[status as keyof typeof statusMap] || {
      text: 'מסתורי/ת...',
      shortText: 'מסתורי',
      gradient: THEME.colors.secondary.lavender,
      gradientSm: THEME.colors.secondary.lavenderSm,
      icon: Sparkles,
      pulse: true,
      bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      bgColorSm: 'bg-gradient-to-r from-purple-400 to-indigo-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    }
  );
};

/**
 * עיצוב העדפות בוליאניות עם תמיכה רספונסיבית
 */
const formatBooleanPreference = (
  value: boolean | null | undefined,
  yesLabel: string = 'כן',
  noLabel: string = 'לא',
  notSpecifiedLabel: string = 'נגלה יחד',
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  const baseResponse = {
    mobileClasses: 'text-xs sm:text-sm',
  };

  if (value === true) {
    return {
      label: yesLabel,
      shortLabel:
        useMobile && yesLabel.length > 8
          ? yesLabel.substring(0, 8) + '...'
          : yesLabel,
      icon: CheckCircle,
      color: 'text-green-600',
      ...baseResponse,
    };
  }

  if (value === false) {
    return {
      label: noLabel,
      shortLabel:
        useMobile && noLabel.length > 8
          ? noLabel.substring(0, 8) + '...'
          : noLabel,
      icon: X,
      color: 'text-red-500',
      ...baseResponse,
    };
  }

  return {
    label: notSpecifiedLabel,
    shortLabel:
      useMobile && notSpecifiedLabel.length > 8
        ? notSpecifiedLabel.substring(0, 8) + '...'
        : notSpecifiedLabel,
    icon: Telescope,
    color: 'text-gray-500',
    ...baseResponse,
  };
};

/**
 * עיצוב העדפות מחרוזת בוליאנית עם תמיכה רספונסיבית
 */
const formatStringBooleanPreference = (
  value: string | null | undefined,
  options: {
    [key: string]: {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      color: string;
    };
  } = {
    yes: {
      label: 'כן',
      shortLabel: 'כן',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    no: { label: 'לא', shortLabel: 'לא', icon: X, color: 'text-red-500' },
    flexible: {
      label: 'גמיש/ה',
      shortLabel: 'גמיש',
      icon: Rainbow,
      color: 'text-indigo-600',
    },
  },
  notSpecifiedLabel: {
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    color: string;
  } = {
    label: 'נגלה יחד',
    shortLabel: 'נגלה',
    icon: Telescope,
    color: 'text-gray-500',
  },
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  const baseResponse = {
    mobileClasses: 'text-xs sm:text-sm',
  };

  if (value && options[value.toLowerCase()]) {
    const result = options[value.toLowerCase()];
    return {
      ...result,
      shortLabel:
        result.shortLabel ||
        (useMobile && result.label.length > 8
          ? result.label.substring(0, 8) + '...'
          : result.label),
      ...baseResponse,
    };
  }

  return {
    ...notSpecifiedLabel,
    shortLabel:
      notSpecifiedLabel.shortLabel ||
      (useMobile && notSpecifiedLabel.label.length > 8
        ? notSpecifiedLabel.label.substring(0, 8) + '...'
        : notSpecifiedLabel.label),
    ...baseResponse,
  };
};

// --- Enhanced Helper Components with Full Responsive Support ---

// 1. DetailItem - רכיב בסיסי עם תיקוני רספונסיביות מלאים
const DetailItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
  iconColorClass?: string;
  valueClassName?: string;
  tooltip?: string;
  variant?: 'default' | 'highlight' | 'elegant' | 'romantic';
  size?: 'sm' | 'md' | 'lg';
  textAlign?: 'center' | 'right' | 'left';
  responsive?: boolean; // פרמטר חדש לקביעת רמת רספונסיביות
  useMobileLayout?: boolean; // האם להשתמש בפריסה מותאמת למובייל
}> = ({
  icon: Icon,
  label,
  value,
  className,
  iconColorClass = 'text-rose-500',
  valueClassName,
  tooltip,
  variant = 'default',
  size = 'md',
  textAlign = 'center',
  responsive = true,
  useMobileLayout = false,
}) => {
  // גדלי פריטים רספונסיביים
  const sizes = {
    sm: {
      container: 'p-2 gap-2 sm:p-3 sm:gap-3',
      icon: 'w-6 h-6 sm:w-8 sm:h-8',
      iconPadding: 'p-1 sm:p-1.5',
      text: 'text-xs sm:text-sm',
      label: 'text-xs sm:text-sm',
      value: 'text-xs sm:text-sm',
    },
    md: {
      container: 'p-2 gap-2 sm:p-3 sm:gap-3 md:p-4 md:gap-4',
      icon: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
      iconPadding: 'p-1.5 sm:p-2 md:p-2.5',
      text: 'text-xs sm:text-sm md:text-base',
      label: 'text-xs sm:text-sm md:text-base',
      value: 'text-xs sm:text-sm md:text-base',
    },
    lg: {
      container: 'p-3 gap-3 sm:p-4 sm:gap-4 md:p-5 md:gap-5',
      icon: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',
      iconPadding: 'p-2 sm:p-2.5 md:p-3',
      text: 'text-sm sm:text-base md:text-lg',
      label: 'text-sm sm:text-base md:text-lg',
      value: 'text-sm sm:text-base md:text-lg',
    },
  };

  const variants = {
    default: {
      card: 'bg-white border border-gray-200 hover:border-rose-300 hover:shadow-md',
      icon: 'bg-rose-50 border border-rose-200',
      iconColor: iconColorClass || 'text-rose-500',
    },
    highlight: {
      card: `bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200 shadow-sm hover:shadow-md`,
      icon: `bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-sm`,
      iconColor: 'text-white',
    },
    elegant: {
      card: `bg-gradient-to-br from-white via-gray-50 to-neutral-100 border border-amber-200 shadow-md hover:shadow-lg`,
      icon: `bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    romantic: {
      card: `bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 border border-pink-200 shadow-sm hover:shadow-lg`,
      icon: `bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white shadow-sm`,
      iconColor: 'text-white',
    },
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  const content = (
    <div
      className={cn(
        'flex rounded-xl transition-all duration-300',
        // Mobile-first approach עם מניעת חריגות
        'min-w-0 w-full max-w-full overflow-hidden',
        // פריסה רספונסיבית
        useMobileLayout
          ? 'flex-col items-center text-center gap-2 sm:gap-3'
          : 'items-start',
        // גדלים וספייסינג
        currentSize.container,
        // עיצוב הקארד
        currentVariant.card,
        // responsive enhancements
        responsive && 'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      {/* Content Container */}
      <div
        className={cn(
          'flex-1 overflow-hidden',
          useMobileLayout ? 'text-center w-full' : 'min-w-0'
        )}
      >
        {/* Header with Icon - יחס כמו בחלק המפורט */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <div
            className={cn(
              'flex-shrink-0 rounded-lg transition-all duration-300',
              currentSize.iconPadding,
              currentVariant.icon,
              'min-w-fit'
            )}
          >
            <Icon
              className={cn(
                currentSize.icon,
                currentVariant.iconColor,
                'transition-all duration-300'
              )}
            />
          </div>
        </div>
        {/* Label */}
        <p
          className={cn(
            'font-semibold mb-1 tracking-wide leading-tight text-center',
            currentSize.label,
            // מניעת חריגת טקסט - חיוני!
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            // צבעים לפי וריאנט
            variant === 'highlight' || variant === 'elegant'
              ? 'text-rose-700 sm:text-gray-700'
              : 'text-gray-600 sm:text-gray-700',
            // פדינג קל במובייל
            useMobileLayout && 'px-1'
          )}
        >
          {label}
        </p>

        {/* Value */}
        <div
          className={cn(
            'font-medium leading-relaxed text-center',
            currentSize.value,
            // מניעת חריגת טקסט - הכי חיוני!
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            'max-w-full overflow-hidden',
            // צבעים
            variant === 'highlight' || variant === 'elegant'
              ? 'text-gray-800 sm:text-gray-900'
              : 'text-gray-700 sm:text-gray-800',
            // פדינג קל במובייל
            useMobileLayout && 'px-1',
            valueClassName
          )}
        >
          {value || (
            <span className="text-gray-400 italic text-xs sm:text-sm">
              עוד נגלה יחד...
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Tooltip wrapper אם נדרש
  if (tooltip && responsive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild className="w-full">
          {content}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-center bg-white border border-rose-200 shadow-lg z-50"
          sideOffset={5}
        >
          <p className="text-gray-700 text-sm break-words p-2">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

// 2. EmptyState - רכיב משופר עם רספונסיביות מלאה
const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  variant?: 'mystery' | 'adventure' | 'discovery' | 'romantic';
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean; // מצב קומפקטי למובייל
}> = ({
  icon: Icon,
  title,
  description,
  className,
  action,
  variant = 'discovery',
  size = 'md',
  compact = false,
}) => {
  // הגדרת גדלים רספונסיביים
  const sizes = {
    sm: {
      container: compact ? 'py-4 px-3' : 'py-6 px-4',
      icon: 'w-6 h-6 sm:w-8 sm:h-8',
      iconContainer: 'p-2 sm:p-3',
      title: 'text-sm sm:text-base',
      description: 'text-xs sm:text-sm',
      spacing: 'mb-2 sm:mb-3',
    },
    md: {
      container: compact ? 'py-6 px-4' : 'py-8 px-6',
      icon: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
      iconContainer: 'p-3 sm:p-4',
      title: 'text-base sm:text-lg md:text-xl',
      description: 'text-sm sm:text-base',
      spacing: 'mb-3 sm:mb-4',
    },
    lg: {
      container: compact ? 'py-8 px-6' : 'py-12 px-8',
      icon: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
      iconContainer: 'p-4 sm:p-5 md:p-6',
      title: 'text-lg sm:text-xl md:text-2xl',
      description: 'text-base sm:text-lg',
      spacing: 'mb-4 sm:mb-6',
    },
  };

  const variants = {
    mystery: {
      bg: `bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100`,
      bgSm: `bg-gradient-to-br from-purple-25 via-violet-25 to-purple-50`, // גרסה קלה למובייל
      border: 'border-purple-200 hover:border-purple-300',
      iconBg: `bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600`,
      iconBgSm: `bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500`,
      textColor: 'text-purple-700 sm:text-purple-800',
      titleColor: 'text-purple-800 sm:text-purple-900',
    },
    adventure: {
      bg: `bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100`,
      bgSm: `bg-gradient-to-br from-emerald-25 via-teal-25 to-green-50`,
      border: 'border-emerald-200 hover:border-emerald-300',
      iconBg: `bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600`,
      iconBgSm: `bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500`,
      textColor: 'text-emerald-700 sm:text-emerald-800',
      titleColor: 'text-emerald-800 sm:text-emerald-900',
    },
    discovery: {
      bg: `bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100`,
      bgSm: `bg-gradient-to-br from-amber-25 via-yellow-25 to-orange-50`,
      border: 'border-amber-200 hover:border-amber-300',
      iconBg: `bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600`,
      iconBgSm: `bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500`,
      textColor: 'text-amber-700 sm:text-amber-800',
      titleColor: 'text-amber-800 sm:text-amber-900',
    },
    romantic: {
      bg: `bg-gradient-to-br from-rose-50 via-pink-50 to-red-100`,
      bgSm: `bg-gradient-to-br from-rose-25 via-pink-25 to-red-50`,
      border: 'border-rose-200 hover:border-rose-300',
      iconBg: `bg-gradient-to-r from-rose-500 via-pink-500 to-red-600`,
      iconBgSm: `bg-gradient-to-r from-rose-400 via-pink-400 to-red-500`,
      textColor: 'text-rose-700 sm:text-rose-800',
      titleColor: 'text-rose-800 sm:text-rose-900',
    },
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed transition-all duration-300',
        // גדלים רספונסיביים
        currentSize.container,
        // רקעים רספונסיביים
        currentVariant.bg,
        'sm:' + currentVariant.bgSm,
        // גבולות ואפקטים
        currentVariant.border,
        'shadow-sm hover:shadow-md',
        // מניעת חריגות
        'max-w-full overflow-hidden',
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          'rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
          currentSize.iconContainer,
          currentSize.spacing,
          currentVariant.iconBg,
          // Shadow רספונסיבי
          'shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl'
        )}
      >
        <Icon
          className={cn(
            currentSize.icon,
            'text-white transition-all duration-300'
          )}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-bold leading-tight',
          currentSize.title,
          currentVariant.titleColor,
          currentSize.spacing,
          // מניעת חריגת טקסט
          'break-words hyphens-auto word-break-break-word max-w-full px-2'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'leading-relaxed max-w-xs mx-auto',
            currentSize.description,
            currentVariant.textColor,
            action ? 'mb-4 sm:mb-6' : '',
            // מניעת חריגת טקסט
            'break-words hyphens-auto word-break-break-word px-2'
          )}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full">
          {action}
        </div>
      )}
    </div>
  );
};

// 3. SectionCard - רכיב משופר עם רספונסיביות מושלמת
const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'elegant' | 'romantic' | 'highlight';
  gradient?: string;
  size?: 'sm' | 'md' | 'lg';
  collapsible?: boolean; // אפשרות קיפול במובייל
  compact?: boolean; // מצב קומפקטי
}> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  contentClassName,
  headerClassName,
  action,
  variant = 'default',
  gradient,
  size = 'md',
  collapsible = false,
  compact = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // גדלים רספונסיביים
  const sizes = {
    sm: {
      card: 'rounded-lg sm:rounded-xl',
      header: 'p-2 sm:p-3',
      content: 'p-2 sm:p-3',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
      iconPadding: 'p-1.5 sm:p-2',
      title: 'text-sm sm:text-base',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-2 sm:gap-3',
    },
    md: {
      card: 'rounded-xl sm:rounded-2xl',
      header: compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 md:p-6',
      content: compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 md:p-6',
      icon: 'w-5 h-5 sm:w-6 sm:h-6',
      iconPadding: 'p-2 sm:p-2.5',
      title: 'text-base sm:text-lg md:text-xl',
      subtitle: 'text-sm sm:text-base',
      gap: 'gap-3 sm:gap-4',
    },
    lg: {
      card: 'rounded-2xl',
      header: compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-8',
      content: compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-8',
      icon: 'w-6 h-6 sm:w-7 sm:h-7',
      iconPadding: 'p-2.5 sm:p-3',
      title: 'text-lg sm:text-xl md:text-2xl',
      subtitle: 'text-base sm:text-lg',
      gap: 'gap-4 sm:gap-5',
    },
  };

  const variants = {
    default: {
      card: 'bg-white border-gray-200 shadow-lg hover:shadow-xl',
      header: 'bg-gradient-to-r from-gray-50 to-white border-gray-200',
      headerSm: 'bg-gradient-to-r from-gray-25 to-white border-gray-100',
      iconBg: 'bg-gray-100 border border-gray-200',
      iconColor: 'text-gray-600',
    },
    elegant: {
      card: `bg-white border-amber-200 shadow-xl hover:shadow-2xl`,
      header: `bg-gradient-to-r ${gradient || 'from-amber-50 via-yellow-50 to-orange-50'} border-amber-200`,
      headerSm: `bg-gradient-to-r from-amber-25 via-yellow-25 to-orange-25 border-amber-100`,
      iconBg: `bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    romantic: {
      card: `bg-white border-rose-200 shadow-lg hover:shadow-xl`,
      header: `bg-gradient-to-r ${gradient || 'from-rose-50 via-pink-50 to-red-50'} border-rose-200`,
      headerSm: `bg-gradient-to-r from-rose-25 via-pink-25 to-red-25 border-rose-100`,
      iconBg: `bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    highlight: {
      card: `bg-white border-pink-200 shadow-lg hover:shadow-xl ring-1 ring-pink-100 hover:ring-pink-200`,
      header: `bg-gradient-to-r ${gradient || 'from-pink-500 via-rose-500 to-red-500'} border-pink-200`,
      headerSm: `bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 border-pink-100`,
      iconBg: `bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg`,
      iconColor: 'text-white',
    },
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        'border overflow-hidden flex flex-col transition-all duration-300',
        currentSize.card,
        currentVariant.card,
        // מניעת חריגות
        'max-w-full min-w-0',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between border-b transition-all duration-300',
          currentSize.header,
          'gap-2', // רווח קטן וקבוע
          currentVariant.header,
          'sm:' + currentVariant.headerSm,
          // מניעת חריגות בכותרת
          'min-w-0 overflow-hidden',
          headerClassName
        )}
      >
        <div
          className={cn(
            'flex items-center min-w-0 flex-1',
            'gap-1 sm:gap-2' // רווח קטן ורספונסיבי
          )}
        >
          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 rounded-lg transition-all duration-300',
                currentSize.iconPadding,
                currentVariant.iconBg,
                'hover:scale-110 active:scale-95'
              )}
            >
              <Icon
                className={cn(currentSize.icon, currentVariant.iconColor)}
              />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1 overflow-hidden text-center">
            <h3
              className={cn(
                'font-bold leading-tight transition-all duration-300 text-center',
                currentSize.title,
                variant === 'default'
                  ? 'text-gray-800 hover:text-gray-900'
                  : 'text-gray-800',
                // מניעת חריגת טקסט בכותרת - קריטי!
                'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere max-w-full'
              )}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className={cn(
                  'mt-0.5 opacity-80 transition-all duration-300 text-center',
                  currentSize.subtitle,
                  'text-gray-600 text-center mx-auto', // הוסף text-center ו-mx-auto
                  // מניעת חריגת טקסט בכותרת המשנה
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere max-w-full'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Collapsible button במובייל */}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1 h-8 w-8 hover:bg-white/60"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isCollapsed && 'rotate-180'
                )}
              />
            </Button>
          )}

          {/* Custom action */}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          currentSize.content,
          // תמיכה בקיפול במובייל
          collapsible &&
            isCollapsed &&
            'max-h-0 p-0 md:max-h-none md:p-4 md:sm:p-5 md:md:p-6',
          'min-w-0 max-w-full', // מניעת חריגות
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

// 4. ColorPaletteSelector - משופר למובייל
const ColorPaletteSelector: React.FC<{
  selectedPalette: ColorPaletteName;
  onPaletteChange: (palette: ColorPaletteName) => void;
  THEME: ThemeType;
  compact?: boolean;
}> = ({ selectedPalette, onPaletteChange, THEME, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'bg-white/90 backdrop-blur-sm rounded-full border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300',
          'text-gray-600 hover:text-gray-800 hover:bg-white/95',
          compact
            ? 'w-8 h-8 min-h-[44px] min-w-[44px]'
            : 'w-10 h-10 min-h-[44px] min-w-[44px]',
          'touch-manipulation'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="בחר ערכת צבעים"
      >
        <Palette
          className={cn(
            compact ? 'w-4 h-4' : 'w-5 h-5',
            'transition-all duration-300'
          )}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={cn(
              'absolute top-full mt-2 right-0 z-50',
              'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xl',
              'min-w-[160px] py-2',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
          >
            {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
              <button
                key={key}
                onClick={() => {
                  onPaletteChange(key as ColorPaletteName);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-right transition-all duration-200',
                  'hover:bg-gray-100/80 active:bg-gray-200/50',
                  'flex items-center gap-3 min-h-[44px]',
                  selectedPalette === key && 'bg-gray-100/60 font-semibold'
                )}
              >
                {/* Color indicator */}
                <div
                  className={cn(
                    'w-4 h-4 rounded-full flex-shrink-0',
                    key === 'feminine' &&
                      'bg-gradient-to-r from-rose-400 to-pink-500',
                    key === 'masculine' &&
                      'bg-gradient-to-r from-blue-500 to-cyan-600',
                    key === 'luxury' &&
                      'bg-gradient-to-r from-amber-400 to-yellow-500',
                    key === 'professional' &&
                      'bg-gradient-to-r from-gray-500 to-slate-600'
                  )}
                />

                <span
                  className={cn(
                    'text-gray-700 font-medium text-sm',
                    selectedPalette === key && 'text-gray-900 font-semibold'
                  )}
                >
                  {palette.name}
                </span>

                {selectedPalette === key && (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- ProfileHeader & Image Components with Full Responsive Support ---

// Main Profile Card Component Interface
interface ProfileCardProps {
  profile: Omit<UserProfile, 'isProfileComplete'>;
  isProfileComplete: boolean;
  images?: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: 'matchmaker' | 'candidate';
  className?: string;
  candidate?: Candidate;
  allCandidates?: Candidate[];
  onCreateSuggestion?: (data: CreateSuggestionData) => Promise<void>;
  onClose?: () => void;
}

// --- Enhanced ProfileHeader Component ---
const ProfileHeader: React.FC<{
  profile: UserProfile;
  age: number;
  mainImageToDisplay: UserImageType | null;
  availability: ReturnType<typeof formatAvailabilityStatus>;
  viewMode: 'matchmaker' | 'candidate';
  onSuggestClick: () => void;
  isMobile?: boolean;
  selectedPalette: ColorPaletteName;
  onPaletteChange?: (palette: ColorPaletteName) => void;
  THEME: ThemeType;
  compact?: boolean;
}> = ({
  profile,
  age,
  mainImageToDisplay,
  availability,
  viewMode,
  onSuggestClick,
  isMobile = false,
  selectedPalette,
  onPaletteChange,
  THEME,
  compact = false,
}) => {
  // Personality highlights מעודכן לרספונסיביות - תיקון dependency
  const personalityHighlights = useMemo(() => {
    const highlights: ExcitementFactor[] = [];

    if (profile.profileCharacterTraits?.length > 0) {
      const trait = profile.profileCharacterTraits[0];
      const traitData = formatEnumValue(
        trait,
        characterTraitMap,
        trait,
        isMobile
      );
      highlights.push({
        icon: traitData.icon,
        text: traitData.label,
        shortText: traitData.shortLabel || traitData.label,
        gradient: THEME.colors.primary.light,
      });
    }

    if (profile.profileHobbies?.length > 0) {
      const hobby = profile.profileHobbies[0];
      const hobbyData = formatEnumValue(hobby, hobbiesMap, hobby, isMobile);
      highlights.push({
        icon: hobbyData.icon,
        text: hobbyData.label,
        shortText: hobbyData.shortLabel || hobbyData.label,
        gradient: THEME.colors.secondary.sage,
      });
    }

    if (profile.city) {
      const cityText = `גר/ה ב${profile.city}`;
      highlights.push({
        icon: MapPin,
        text: cityText,
        shortText:
          isMobile && cityText.length > 15 ? `${profile.city}` : cityText,
        gradient: THEME.colors.secondary.sky,
      });
    }

    return highlights.slice(0, 3);
  }, [
    profile.profileCharacterTraits,
    profile.profileHobbies,
    profile.city,
    isMobile,
    THEME.colors.primary.light,
    THEME.colors.secondary.sage,
    THEME.colors.secondary.sky,
  ]);

  return (
    <div className="relative overflow-hidden">
      {/* Enhanced Background with responsive decorations */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          THEME.colors.neutral.warm
        )}
      >
        {/* Responsive animated background elements */}
        <div
          className={cn(
            'absolute bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-xl sm:blur-2xl animate-pulse',
            compact
              ? 'top-2 right-2 w-8 h-8 sm:w-16 sm:h-16'
              : 'top-4 right-4 sm:top-10 sm:right-10 w-16 h-16 sm:w-32 sm:h-32'
          )}
        ></div>
        <div
          className={cn(
            'absolute bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-lg sm:blur-xl animate-pulse',
            compact
              ? 'bottom-2 left-2 w-6 h-6 sm:w-12 sm:h-12'
              : 'bottom-4 left-4 sm:bottom-10 sm:left-10 w-12 h-12 sm:w-24 sm:h-24'
          )}
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className={cn(
            'absolute bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-md sm:blur-lg animate-pulse',
            compact
              ? 'top-1/2 left-1/2 w-4 h-4 sm:w-8 sm:h-8'
              : 'top-1/2 left-1/2 w-8 h-8 sm:w-20 sm:h-20'
          )}
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'relative z-10',
          compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4 md:p-6'
        )}
      >
        <div
          className={cn(
            'flex items-start',
            isMobile
              ? 'flex-col items-center text-center gap-3 sm:gap-4'
              : 'flex-row gap-4 sm:gap-6'
          )}
        >
          {/* Enhanced Profile Image with responsive sizing */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'relative rounded-full overflow-hidden border-2 sm:border-4 border-white shadow-lg sm:shadow-2xl ring-2 sm:ring-4 ring-rose-200/50 transition-all duration-300 hover:scale-105',
                // Responsive image sizes - חיוני למובייל!
                compact
                  ? 'h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40'
                  : isMobile
                    ? 'h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44'
                    : 'h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 lg:h-36 lg:w-36',
                THEME.shadows.elegant
              )}
            >
              {mainImageToDisplay?.url ? (
                <Image
                  src={getRelativeCloudinaryPath(mainImageToDisplay.url)}
                  alt={`תמונת פרופיל של ${profile.user?.firstName || 'מועמד יקר'}`}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-110"
                  sizes={compact ? '160px' : isMobile ? '176px' : '144px'}
                  priority
                />
              ) : (
                <div
                  className={cn(
                    'w-full h-full flex items-center justify-center',
                    `bg-gradient-to-br ${THEME.colors.primary.romantic}`
                  )}
                >
                  <span
                    className={cn(
                      'font-bold text-white',
                      compact
                        ? 'text-xl sm:text-2xl'
                        : 'text-3xl sm:text-4xl lg:text-6xl'
                    )}
                  >
                    {getInitials(
                      profile.user?.firstName,
                      profile.user?.lastName,
                      compact ? 1 : 2
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced Status Badge - responsive */}
            <div
              className={cn(
                'absolute transition-all duration-300',
                compact ? '-bottom-1 -right-1' : '-bottom-2 -right-2'
              )}
            >
              <Badge
                className={cn(
                  'font-bold text-white border-0 transition-all duration-300 hover:scale-110',
                  compact
                    ? 'text-xs px-2 py-1'
                    : 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
                  isMobile
                    ? availability.bgColorSm || availability.bgColor
                    : availability.bgColor,
                  false && 'animate-pulse',
                  THEME.shadows.warm
                )}
              >
                <availability.icon
                  className={cn(
                    'flex-shrink-0',
                    compact ? 'w-2 h-2 ml-1' : 'w-3 h-3 ml-1 sm:ml-1.5'
                  )}
                />
                <span className={cn('break-words')}>
                  {isMobile && compact
                    ? availability.shortText || availability.text
                    : isMobile
                      ? availability.shortText || availability.text
                      : availability.text}
                </span>
              </Badge>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col justify-start items-start w-full">
            {/* Desktop Color Palette Selector */}
            {!isMobile && onPaletteChange && (
              <div className="flex justify-end mb-2 sm:mb-3 w-full">
                <ColorPaletteSelector
                  selectedPalette={selectedPalette}
                  onPaletteChange={onPaletteChange}
                  THEME={THEME}
                  compact={compact}
                />
              </div>
            )}

            {/* Name and Age Section - משופר לחלוטין */}
            <div
              className={cn(
                'w-full overflow-hidden',
                compact ? 'mb-2 sm:mb-3' : 'mb-3 sm:mb-4',
                isMobile && 'text-center'
              )}
            >
              <h1
                className={cn(
                  'font-extrabold leading-tight transition-all duration-300',
                  // Responsive font sizes - מדורג בקפידה
                  compact
                    ? 'text-sm sm:text-base md:text-lg'
                    : isMobile
                      ? 'text-lg sm:text-xl md:text-2xl'
                      : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
                  // Critical text overflow prevention
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                  'text-center max-w-full overflow-hidden',
                  // Responsive padding for breathing room
                  'px-1 sm:px-2',
                  // Gradient text
                  'bg-gradient-to-r from-gray-800 via-gray-900 to-black bg-clip-text text-transparent',
                  // Hover effects
                  'hover:from-rose-600 hover:via-pink-600 hover:to-purple-600'
                )}
              >
                {profile.user?.firstName ? (
                  <>
                    הסיפור של {profile.user.firstName}
                    {profile.user.lastName && ` ${profile.user.lastName}`}
                  </>
                ) : (
                  'סיפור שמחכה להתגלות'
                )}
              </h1>

              {/* Age Display */}
              {age > 0 && (
                <div
                  className={cn(
                    'flex items-center justify-center gap-1 sm:gap-2 flex-wrap',
                    isMobile ? 'justify-center' : 'lg:justify-start',
                    'mt-2 sm:mt-3'
                  )}
                >
                  <Cake
                    className={cn(
                      'text-blue-500 flex-shrink-0',
                      compact ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5'
                    )}
                  />
                  <span
                    className={cn(
                      'font-semibold text-gray-700',
                      compact
                        ? 'text-xs sm:text-sm'
                        : 'text-sm sm:text-base md:text-lg'
                    )}
                  >
                    גיל: {age}
                  </span>
                </div>
              )}
            </div>

            {/* Personality Highlights - עם גלילה אופקית מושלמת */}
            {personalityHighlights.length > 0 && (
              <div
                className={cn(
                  'w-full overflow-hidden',
                  compact ? 'mt-2 mb-2' : 'mt-3 mb-4',
                  isMobile ? 'flex justify-center' : 'flex justify-start'
                )}
              >
                <ScrollArea className="w-full max-w-full" dir="rtl">
                  <div
                    className={cn(
                      'flex gap-2 sm:gap-3 pb-2 px-1 min-w-max',
                      isMobile && 'justify-center'
                    )}
                  >
                    {personalityHighlights.map((highlight, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center bg-white/80 border border-gray-200/50 text-gray-700 font-semibold backdrop-blur-sm flex-shrink-0 transition-all duration-300 hover:scale-105 hover:bg-white/90',
                          compact
                            ? 'gap-1 px-2 py-1 rounded-full text-xs'
                            : 'gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm',
                          THEME.shadows.soft
                        )}
                      >
                        <highlight.icon
                          className={cn(
                            'flex-shrink-0',
                            compact ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'
                          )}
                        />
                        <span className="whitespace-nowrap font-medium">
                          {isMobile && compact
                            ? highlight.shortText || highlight.text
                            : isMobile
                              ? highlight.shortText || highlight.text
                              : highlight.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Key Facts Grid - מותאם לחלוטין למובייל */}
            <div
              className={cn(
                'w-full overflow-hidden',
                compact ? 'mt-2' : 'mt-4 sm:mt-6'
              )}
            >
              {isMobile ? (
                // Mobile: Horizontal scroll
                <div className="w-full max-w-full overflow-hidden px-1">
                  <ScrollArea className="w-full" dir="rtl">
                    <div
                      className={cn(
                        'flex gap-2 sm:gap-3 pb-2 px-1',
                        // יישור למרכז
                        'justify-center min-w-max'
                      )}
                    >

                      {profile.occupation && (
                        <KeyFactCard
                          icon={Briefcase}
                          label="עיסוק"
                          value={profile.occupation}
                          color="amber"
                          compact={compact}
                        />
                      )}
                      {profile.religiousLevel && (
                        <KeyFactCard
                          icon={BookMarked}
                          label="השקפה"
                          value={
                            formatEnumValue(
                              profile.religiousLevel,
                              religiousLevelMap,
                              undefined,
                              true
                            ).shortLabel ||
                            formatEnumValue(
                              profile.religiousLevel,
                              religiousLevelMap
                            ).label
                          }
                          color="purple"
                          compact={compact}
                        />
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              ) : (
                // Desktop: Grid layout
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {profile.city && (
                    <KeyFactCard
                      icon={MapPin}
                      label="מיקום"
                      value={profile.city}
                      color="rose"
                      compact={compact}
                    />
                  )}
                  {profile.occupation && (
                    <KeyFactCard
                      icon={Briefcase}
                      label="עיסוק"
                      value={profile.occupation}
                      color="amber"
                      compact={compact}
                    />
                  )}
                  {profile.religiousLevel && (
                    <KeyFactCard
                      icon={BookMarked}
                      label="השקפה"
                      value={
                        formatEnumValue(
                          profile.religiousLevel,
                          religiousLevelMap
                        ).label
                      }
                      color="purple"
                      compact={compact}
                    />
                  )}
                </div>
              )}
            </div>
            {/* Action Button for Matchmakers */}
            {viewMode === 'matchmaker' && (
              <div
                className={cn(
                  'w-full flex',
                  compact ? 'pt-3' : 'pt-4 sm:pt-6',
                  isMobile ? 'justify-center' : 'justify-end'
                )}
              >
                <Button
                  size={compact ? 'default' : 'lg'}
                  className={cn(
                    'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700',
                    'text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95',
                    compact
                      ? 'px-4 py-2 text-sm'
                      : 'px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base',
                    // Touch target
                    'min-h-[44px]'
                  )}
                  onClick={onSuggestClick}
                >
                  <Heart
                    className={cn(
                      'flex-shrink-0',
                      compact
                        ? 'w-4 h-4 ml-1'
                        : 'w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2'
                    )}
                  />
                  <span className="break-words">
                    {compact ? 'הצע התאמה' : 'הצע התאמה מושלמת'}
                  </span>
                  <ArrowRight
                    className={cn(
                      'flex-shrink-0',
                      compact
                        ? 'w-4 h-4 mr-1'
                        : 'w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2'
                    )}
                  />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Inspirational Quote - רספונסיבי מלא */}
        {!compact && (
          <div
            className={cn(
              'text-center w-full overflow-hidden',
              isMobile ? 'mt-3 px-2' : 'mt-6 sm:mt-8'
            )}
          >
            <div
              className={cn(
                'inline-flex items-center justify-center rounded-full text-white shadow-lg max-w-full transition-all duration-300 hover:scale-105',
                isMobile
                  ? 'gap-1.5 px-3 py-2 text-sm flex-wrap'
                  : 'gap-2 px-4 py-3 text-base',
                `bg-gradient-to-r ${THEME.colors.primary.romantic}`
              )}
            >
              <Quote
                className={cn(
                  'flex-shrink-0',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}
              />
              <p className="font-medium italic text-center break-words flex-shrink min-w-0">
                כל סיפור אהבה מתחיל בהכרות אחת מיוחדת...
              </p>
              <Quote
                className={cn(
                  'transform rotate-180 flex-shrink-0',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Component for Key Facts
const KeyFactCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'rose' | 'amber' | 'purple';
  compact?: boolean;
}> = ({ icon: Icon, label, value, color, compact = false }) => {
  const colorClasses = {
    rose: 'border-rose-200/50 hover:border-rose-300',
    amber: 'border-amber-200/50 hover:border-amber-300',
    purple: 'border-purple-200/50 hover:border-purple-300',
  };

  const iconColors = {
    rose: 'text-rose-500',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  };

  return (
    <div
      className={cn(
        'flex items-center bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0',
        compact
          ? 'gap-2 p-2 min-w-[100px] max-w-[120px]'
          : 'gap-2 sm:gap-3 p-2 sm:p-3 min-w-[120px] max-w-[140px] sm:min-w-[140px] sm:max-w-[160px]',
        colorClasses[color],
        // מניעת חריגה
        'max-w-[calc((100vw-4rem)/3)]'
      )}
    >
      <Icon
        className={cn(
          'flex-shrink-0',
          compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5',
          iconColors[color]
        )}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className={cn(
            'font-medium text-gray-500 leading-tight',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'font-semibold text-gray-800 break-words overflow-wrap-anywhere word-break-break-word leading-tight',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

// Mobile Image Gallery with Perfect Horizontal Scroll
const MobileImageGallery: React.FC<{
  orderedImages: UserImageType[];
  profile: UserProfile;
  onImageClick: (image: UserImageType) => void;
  THEME: ThemeType;
  compact?: boolean;
}> = ({ orderedImages, profile, onImageClick, THEME, compact = false }) => {
  if (orderedImages.length === 0) return null;

  return (
    <div
      className={cn(
        'overflow-hidden',
        compact ? 'px-2 pt-2 pb-2' : 'px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3',
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'text-center overflow-hidden',
          compact ? 'mb-2' : 'mb-3 sm:mb-4'
        )}
      >
        <h3
          className={cn(
            'font-bold text-gray-800 flex items-center justify-center gap-1.5 sm:gap-2',
            compact ? 'text-sm mb-1' : 'text-base sm:text-lg mb-1 sm:mb-2'
          )}
        >
          <Camera
            className={cn(
              'text-rose-500 flex-shrink-0',
              compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
            )}
          />
          <span className="break-words min-w-0">
            הגלריה של {profile.user?.firstName || 'המועמד'}
          </span>
        </h3>
        <p
          className={cn(
            'text-gray-600',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          לחץ על תמונה להגדלה
        </p>
      </div>

      {/* Image Gallery */}
      <ScrollArea dir="rtl" className="w-full overflow-hidden">
        <div
          className={cn(
            'flex pb-2 sm:pb-3',
            compact ? 'gap-2' : 'gap-2 sm:gap-3 md:gap-4',
            'justify-center min-w-full'
          )}
        >
          {orderedImages.map((image, idx) => (
            <div
              key={image.id}
              className={cn(
                'relative flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95',
                // גודל מותאם לכמות התמונות
                orderedImages.length <= 3
                  ? compact
                    ? 'w-20 h-24 border-2'
                    : 'w-24 h-32 sm:w-28 sm:h-36 border-2 sm:border-3'
                  : compact
                    ? 'w-16 h-20 border-2'
                    : 'w-20 h-26 sm:w-22 sm:h-30 border-2 sm:border-3',
                'border-white shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl',
                // הגבלת רוחב מקסימלי
                'max-w-[calc((100vw-3rem)/5)]'
              )}
              onClick={() => onImageClick(image)}
            >
              <Image
                src={getRelativeCloudinaryPath(image.url)}
                alt={`תמונה מדהימה ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes={
                  orderedImages.length <= 3
                    ? compact
                      ? '80px'
                      : '112px'
                    : compact
                      ? '64px'
                      : '88px'
                }
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Main badge */}
              {image.isMain && (
                <Badge
                  className={cn(
                    'absolute font-bold',
                    compact
                      ? 'top-0.5 right-0.5 text-xs px-1 py-0.5 gap-0.5'
                      : 'top-1 right-1 text-xs px-1.5 py-0.5 gap-1',
                    'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm',
                    THEME.shadows.warm
                  )}
                >
                  <Star
                    className={cn(
                      'fill-current',
                      compact ? 'w-2 h-2' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'
                    )}
                  />
                  {!compact && <span>ראשי</span>}
                </Badge>
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="mt-1" />
      </ScrollArea>
    </div>
  );
};

// Image Dialog Navigation Functions
const handleOpenImageDialog = (
  image: UserImageType,
  setSelectedImageForDialog: (img: UserImageType | null) => void
) => {
  if (image.url) {
    setSelectedImageForDialog(image);
  }
};

const handleCloseImageDialog = (
  setSelectedImageForDialog: (img: UserImageType | null) => void
) => {
  setSelectedImageForDialog(null);
};

const handleDialogNav = (
  direction: 'next' | 'prev',
  currentDialogImageIndex: number,
  orderedImages: UserImageType[],
  setSelectedImageForDialog: (img: UserImageType) => void
) => {
  if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;

  const newIndex =
    direction === 'next'
      ? (currentDialogImageIndex + 1) % orderedImages.length
      : (currentDialogImageIndex - 1 + orderedImages.length) %
        orderedImages.length;

  setSelectedImageForDialog(orderedImages[newIndex]);
};

// Enhanced Image Dialog Component
const ImageDialogComponent: React.FC<{
  selectedImageForDialog: UserImageType | null;
  currentDialogImageIndex: number;
  orderedImages: UserImageType[];
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
}> = ({
  selectedImageForDialog,
  currentDialogImageIndex,
  orderedImages,
  onClose,
  onNavigate,
}) => {
  if (!selectedImageForDialog) return null;

  return (
    <Dialog
      open={!!selectedImageForDialog}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent
        className={cn(
          'max-w-5xl w-[95vw] h-[90vh] p-0 border-none rounded-2xl flex flex-col',
          'bg-black/95 backdrop-blur-md'
        )}
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader
          className={cn(
            'p-3 sm:p-4 text-white flex-row justify-between items-center border-b border-gray-700/50',
            'bg-black/80 backdrop-blur-sm'
          )}
        >
          <DialogTitle
            className={cn(
              'font-bold flex items-center gap-2',
              'text-base sm:text-lg'
            )}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="break-words">
              תמונה {currentDialogImageIndex + 1} מתוך {orderedImages.length}
            </span>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all',
                'w-8 h-8 sm:w-10 sm:h-10 min-h-[44px] min-w-[44px]'
              )}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Image Container */}
        <div className="relative flex-1 w-full min-h-0 overflow-hidden">
          <Image
            key={selectedImageForDialog.id}
            src={getRelativeCloudinaryPath(selectedImageForDialog.url)}
            alt={`תמונה מוגדלת ${currentDialogImageIndex + 1}`}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />

          {/* Navigation Arrows */}
          {orderedImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2 rounded-full',
                  'bg-black/50 hover:bg-black/70 text-white border border-white/20',
                  'backdrop-blur-sm transition-all hover:scale-110 active:scale-95',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('prev')}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2 rounded-full',
                  'bg-black/50 hover:bg-black/70 text-white border border-white/20',
                  'backdrop-blur-sm transition-all hover:scale-110 active:scale-95',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('next')}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Footer */}
        {orderedImages.length > 1 && (
          <DialogFooter className="border-t border-gray-700/50 bg-black/80 backdrop-blur-sm p-0">
            <ScrollArea dir="rtl" className="w-full">
              <div className="flex gap-2 p-3 justify-center min-w-max">
                {orderedImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105',
                      'border-2',
                      img.id === selectedImageForDialog.id
                        ? 'border-rose-400 ring-2 ring-rose-400/50'
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/40'
                    )}
                    onClick={() =>
                      onNavigate(
                        img.id === selectedImageForDialog.id ? 'next' : 'next'
                      )
                    } // Simplified for demo
                  >
                    <Image
                      src={getRelativeCloudinaryPath(img.url)}
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
  );
};

// START: רכיב ניווט מובייל מתוקן, אלגנטי ונקי
const MobileTabNavigation: React.FC<{
  activeTab: string;
  tabItems: {
    value: string;
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    gradient: string; // The gradient is kept for potential future use or consistency
  }[];
  onTabChange: (newTab: string) => void;
  THEME: ThemeType; // THEME is kept for consistency
}> = ({ activeTab, tabItems, onTabChange }) => {
  const currentIndex = useMemo(
    () => tabItems.findIndex((tab) => tab.value === activeTab),
    [tabItems, activeTab]
  );

  const prevTab = useMemo(
    () => (currentIndex > 0 ? tabItems[currentIndex - 1] : null),
    [tabItems, currentIndex]
  );
  const nextTab = useMemo(
    () =>
      currentIndex < tabItems.length - 1 ? tabItems[currentIndex + 1] : null,
    [tabItems, currentIndex]
  );

  if (!prevTab && !nextTab) {
    return null;
  }

  // Base classes for both buttons for consistency
  const baseButtonClasses =
    'flex-1 flex flex-col p-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  return (
    // The main container FIX: "flex" ensures it's a row, "items-stretch" makes buttons same height.
    <div className="mt-8 pt-6 border-t border-gray-200/80 flex items-stretch justify-between gap-3 sm:gap-4 w-full">
      {/* PREVIOUS BUTTON (Right in RTL) */}
      {prevTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-start text-right', // Aligns content to the right
            'bg-white border border-gray-200/80 hover:border-gray-300',
            'focus-visible:ring-gray-400'
          )}
          onClick={() => onTabChange(prevTab.value)}
        >
          <div className="flex items-center gap-2">
            <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <p className="text-xs font-medium text-gray-500">הקודם</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <prevTab.icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <span className="text-base font-bold text-gray-800 text-right break-words min-w-0">
              {prevTab.label}
            </span>
          </div>
        </button>
      ) : (
        <div className="flex-1" /> // Spacer to keep the 'Next' button aligned to the left
      )}

      {/* NEXT BUTTON (Left in RTL) - The "Hero" button */}
      {nextTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-end text-left', // Aligns content to the left
            'bg-rose-50 border border-rose-200/80 hover:border-rose-300',
            'focus-visible:ring-rose-500'
          )}
          onClick={() => onTabChange(nextTab.value)}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-rose-700">הבא</p>
            <ChevronLeft className="w-6 h-6 text-rose-500 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="text-base font-bold text-rose-900 text-left break-words min-w-0">
              {nextTab.label}
            </span>
            <nextTab.icon className="w-5 h-5 text-rose-600 flex-shrink-0" />
          </div>
        </button>
      ) : (
        <div className="flex-1" /> // Spacer
      )}
    </div>
  );
};

// Main ProfileCard Component
const ProfileCard: React.FC<ProfileCardProps> = ({
  profile: profileData,
  isProfileComplete,
  candidate,
  images = [],
  questionnaire,
  viewMode = 'candidate',
  className,
  allCandidates = [],
  onCreateSuggestion,
  onClose,
}) => {
  // Enhanced profile with isProfileComplete
  const profile = useMemo(
    () => ({
      ...profileData,
      isProfileComplete,
    }),
    [profileData, isProfileComplete]
  );

  // State management
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedImageForDialog, setSelectedImageForDialog] =
    useState<UserImageType | null>(null);
  const [activeTab, setActiveTab] = useState('essence');
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [mobileViewLayout, setMobileViewLayout] = useState<
    'focus' | 'detailed'
  >('focus');
  const [selectedPalette, setSelectedPalette] = useState<ColorPaletteName>(
    () => {
      return profile.gender === 'MALE' ? 'masculine' : 'feminine';
    }
  );

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Enhanced tab change handler with scroll management
  const handleTabChange = (newTab: string) => {
    if (activeTabRef.current === newTab) return;
    setActiveTab(newTab);
  };

  // Get current theme based on selected palette
  const THEME = useMemo(
    () => COLOR_PALETTES[selectedPalette],
    [selectedPalette]
  );

  // Enhanced WORLDS configuration with responsive support
  const WORLDS: {
    [key: string]: {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      gradient: string;
      description: string;
      accentColor: string;
    };
  } = useMemo(
    () => ({
      values: {
        label: 'הערכים והעקרונות שמנחים אותי',
        shortLabel: 'הערכים',
        icon: BookMarked,
        gradient: THEME.colors.primary.accent,
        description: 'מה חשוב לי בחיים ומה מוביל אותי',
        accentColor: 'blue',
      },
      personality: {
        label: 'האישיות והתכונות הייחודיות שלי',
        shortLabel: 'האישיות',
        icon: Sparkles,
        gradient: THEME.colors.primary.light,
        description: 'איך אני באמת ומה מאפיין אותי',
        accentColor: 'purple',
      },
      relationship: {
        label: 'החזון שלי לזוגיות ומשפחה',
        shortLabel: 'הזוגיות',
        icon: Heart,
        gradient: THEME.colors.primary.main,
        description: 'איך אני רואה את עתיד הזוגיות שלי',
        accentColor: 'rose',
      },
      partner: {
        label: 'מה אני מחפש/ת בבן/בת הזוג',
        shortLabel: 'החיפוש',
        icon: Users,
        gradient: THEME.colors.secondary.sky,
        description: 'התכונות והערכים שחשובים לי בפרטנר',
        accentColor: 'blue',
      },
      religion: {
        label: 'הדת והרוחניות בחיי',
        shortLabel: 'הדת',
        icon: Star,
        gradient: THEME.colors.secondary.peach,
        description: 'המקום של האמונה והמסורת בעולמי',
        accentColor: 'amber',
      },
      general: {
        label: 'עוד דברים חשובים שכדאי לדעת עליי',
        shortLabel: 'עוד דברים',
        icon: FileText,
        gradient: THEME.colors.secondary.lavender,
        description: 'פרטים נוספים שמשלימים את התמונה',
        accentColor: 'purple',
      },
    }),
    [
      THEME.colors.primary.accent,
      THEME.colors.primary.light,
      THEME.colors.primary.main,
      THEME.colors.secondary.sky,
      THEME.colors.secondary.peach,
      THEME.colors.secondary.lavender,
    ]
  );

  // Enhanced helper functions with responsive support
  const hasAnyPreferences = useMemo(() => {
    return (
      (profile.preferredMaritalStatuses &&
        profile.preferredMaritalStatuses.length > 0) ||
      (profile.preferredReligiousLevels &&
        profile.preferredReligiousLevels.length > 0) ||
      (profile.preferredEducation && profile.preferredEducation.length > 0) ||
      (profile.preferredOccupations &&
        profile.preferredOccupations.length > 0) ||
      (profile.preferredLocations && profile.preferredLocations.length > 0) ||
      (profile.preferredCharacterTraits &&
        profile.preferredCharacterTraits.length > 0) ||
      (profile.preferredHobbies && profile.preferredHobbies.length > 0)
    );
  }, [profile]);

  const orderedImages = useMemo(() => {
    const validImages = (images || []).filter((img) => img.url);
    const mainImg = validImages.find((img) => img.isMain);
    const otherImages = validImages.filter((img) => !img.isMain);
    return mainImg ? [mainImg, ...otherImages] : validImages;
  }, [images]);

  const mainImageToDisplay = useMemo(
    () => (orderedImages.length > 0 ? orderedImages[0] : null),
    [orderedImages]
  );
  const age = useMemo(
    () => calculateAge(profile.birthDate),
    [profile.birthDate]
  );
  const availability = useMemo(
    () => formatAvailabilityStatus(profile.availabilityStatus, THEME),
    [profile.availabilityStatus, THEME]
  );

  const hasDisplayableQuestionnaireAnswers = useMemo(
    () =>
      questionnaire &&
      questionnaire.formattedAnswers &&
      Object.values(questionnaire.formattedAnswers)
        .flat()
        .some((a) => a.isVisible !== false && (a.answer || a.displayText)),
    [questionnaire]
  );

  const currentDialogImageIndex = useMemo(
    () =>
      selectedImageForDialog
        ? orderedImages.findIndex((img) => img.id === selectedImageForDialog.id)
        : -1,
    [selectedImageForDialog, orderedImages]
  );

  // Event handlers
  const handleOpenImageDialog = (image: UserImageType) =>
    image.url && setSelectedImageForDialog(image);
  const handleCloseImageDialog = () => setSelectedImageForDialog(null);

  const handleDialogNav = (direction: 'next' | 'prev') => {
    if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
    const newIndex =
      (currentDialogImageIndex +
        (direction === 'next' ? 1 : -1) +
        orderedImages.length) %
      orderedImages.length;
    setSelectedImageForDialog(orderedImages[newIndex]);
  };

  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    if (onCreateSuggestion) {
      await onCreateSuggestion(data);
    }
    setIsSuggestDialogOpen(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Enhanced tab configuration with responsive support AND CORRECT ORDER
  // Enhanced tab configuration with responsive support AND CORRECT ORDER
  const tabItems = useMemo(
    () => [
      {
        value: 'essence',
        label: 'המהות', // <-- הטקסטים כאן כבר טובים
        shortLabel: 'מהות',
        icon: Sparkles,
        gradient: THEME.colors.primary.light,
        description: 'מי זה האדם הזה באמת',
      },
      {
        value: 'story',
        label: 'הסיפור',
        shortLabel: 'סיפור',
        icon: BookOpen,
        gradient: THEME.colors.primary.accent,
        description: 'הרקע והדרך שהובילה לכאן',
      },
      {
        value: 'vision',
        label: 'החזון',
        shortLabel: 'חזון',
        icon: Heart,
        gradient: THEME.colors.primary.main,
        description: 'החלום לזוגיות ומשפחה',
      },
      {
        value: 'search',
        label: 'החיפוש',
        shortLabel: 'חיפוש',
        icon: Target,
        gradient: THEME.colors.secondary.sky,
        description: 'מה מחפש בבן/בת הזוג',
      },
      ...(hasDisplayableQuestionnaireAnswers
        ? [
            {
              value: 'deeper',
              label: 'עומק',
              shortLabel: 'עומק',
              icon: Telescope,
              gradient: THEME.colors.secondary.peach,
              description: 'תשובות מעמיקות מהלב',
            },
          ]
        : []),
      ...(viewMode === 'matchmaker'
        ? [
            {
              value: 'professional',
              label: 'מקצועי',
              shortLabel: 'מקצועי',
              icon: Lock,
              gradient: THEME.colors.secondary.lavender,
              description: 'מידע לשדכן בלבד',
            },
          ]
        : []),
    ],
    [
      hasDisplayableQuestionnaireAnswers,
      viewMode,
      THEME.colors.primary.light,
      THEME.colors.primary.accent,
      THEME.colors.primary.main,
      THEME.colors.secondary.sky,
      THEME.colors.secondary.peach,
      THEME.colors.secondary.lavender,
    ]
  );

  // Enhanced preference badges renderer with full responsive support
  const renderPreferenceBadges = (
    title: string,
    icon: React.ElementType,
    values: string[] | undefined,
    translationMap: {
      [key: string]: {
        label: string;
        shortLabel?: string;
        icon: React.ElementType;
        color: string;
      };
    },
    gradientClass: string = THEME.colors.secondary.sky,
    compact: boolean = false
  ) => {
    if (!values || values.length === 0) {
      return null;
    }

    const IconComponent = icon;
    return (
      <div className="space-y-3 sm:space-y-4 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={cn(
              'flex-shrink-0 rounded-lg',
              compact ? 'p-1.5' : 'p-1.5 sm:p-2',
              `bg-gradient-to-r ${gradientClass}`
            )}
          >
            <IconComponent
              className={cn(
                'text-white',
                compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
              )}
            />
          </div>
          <h4
            className={cn(
              'font-bold text-gray-800 break-words hyphens-auto word-break-break-word min-w-0 flex-1 overflow-wrap-anywhere',
              compact ? 'text-sm' : 'text-sm sm:text-base'
            )}
          >
            {title}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 min-w-0 max-w-full">
          {values.map((val) => {
            const itemData = translationMap[val] || {
              label: val,
              shortLabel: val.length > 12 ? val.substring(0, 12) + '...' : val,
              icon: Sparkles,
              color: 'text-gray-600',
            };
            return (
              <Badge
                key={val}
                variant="outline"
                className={cn(
                  'flex items-center font-semibold border-2 min-w-0 max-w-full transition-all hover:scale-105 active:scale-95',
                  compact
                    ? 'gap-1 px-2 py-1 text-xs'
                    : 'gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm',
                  'bg-white hover:bg-gray-50 border-gray-200 hover:border-rose-300',
                  THEME.shadows.soft,
                  // Critical text overflow prevention
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere'
                )}
              >
                <itemData.icon
                  className={cn(
                    'flex-shrink-0',
                    compact ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4',
                    itemData.color
                  )}
                />
                <span className="break-words overflow-hidden min-w-0">
                  {compact && itemData.shortLabel
                    ? itemData.shortLabel
                    : itemData.label}
                </span>
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  // Enhanced QuestionnaireItem with responsive support
  const QuestionnaireItem: React.FC<{
    answer: FormattedAnswer;
    worldColor?: string;
    worldGradient?: string;
    compact?: boolean;
  }> = ({ answer, worldColor = 'rose', worldGradient, compact = false }) => {
    return (
      <div
        className={cn(
          'rounded-xl border transition-all duration-300 hover:shadow-lg overflow-hidden',
          compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5',
          'bg-gradient-to-br from-white to-gray-50/30 max-w-full min-w-0',
          `border-${worldColor}-200 hover:border-${worldColor}-300`
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div
            className={cn(
              'flex-shrink-0 rounded-lg text-white shadow-md',
              compact ? 'p-2' : 'p-2 sm:p-3',
              worldGradient
                ? `bg-gradient-to-r ${worldGradient}`
                : `bg-gradient-to-r from-${worldColor}-400 to-${worldColor}-500`
            )}
          >
            <Quote
              className={cn(compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5')}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h4
              className={cn(
                'font-bold mb-2 sm:mb-3 text-gray-800 leading-relaxed break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                compact ? 'text-sm' : 'text-sm sm:text-base'
              )}
            >
              {answer.question}
            </h4>
            <div
              className={cn(
                'rounded-lg border-r-4 bg-white/60 overflow-hidden',
                compact ? 'p-3' : 'p-3 sm:p-4',
                `border-${worldColor}-400`
              )}
            >
              <p
                className={cn(
                  'text-gray-700 leading-relaxed italic break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                  compact ? 'text-sm' : 'text-sm sm:text-base'
                )}
              >
                <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1 text-gray-400 flex-shrink-0" />
                {answer.displayText || answer.answer}
                <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-gray-400 transform rotate-180 flex-shrink-0" />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Enhanced MainContentTabs with full responsive support
  // Enhanced MainContentTabs with full responsive support
  // Enhanced MainContentTabs with full responsive support
  const MainContentTabs = () => (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full flex flex-col flex-1 min-h-0 max-w-full overflow-hidden"
    >
      {/* Enhanced Tab Navigation Bar */}
      <div
        className={cn(
          'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/50 overflow-hidden sticky top-0 z-20',
          'mb-3 sm:mb-4 md:mb-6 p-1 sm:p-2',
          THEME.shadows.elegant
        )}
      >
        <ScrollArea className="w-full max-w-full overflow-hidden" dir="rtl">
          <div className="flex gap-0.5 sm:gap-1 justify-center min-w-max px-2 sm:px-4">
            {tabItems.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl flex-shrink-0 transition-all duration-300 border border-transparent',
                  'text-gray-600 hover:text-gray-800 hover:bg-rose-50',
                  'min-w-[50px] min-h-[44px] touch-manipulation',
                  'sm:min-w-[60px] md:min-w-[80px]',
                  'px-1.5 py-1.5 sm:px-2 sm:py-2 md:px-3 md:py-2',
                  'text-xs sm:text-sm font-semibold',
                  activeTab === tab.value &&
                    cn(
                      'font-bold text-white shadow-lg border-white/20',
                      `bg-gradient-to-r ${tab.gradient}`
                    )
                )}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="leading-tight text-center break-words hyphens-auto word-break-break-word max-w-full">
                  {typeof window !== 'undefined' &&
                  window.innerWidth < 640 &&
                  tab.shortLabel
                    ? tab.shortLabel
                    : tab.label}
                </span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="mt-1" />
        </ScrollArea>
      </div>

      {/* Tab Content with enhanced responsive handling */}
      <ScrollArea
        id="profile-card-tabs-content"
        className="flex-1 overflow-auto h-full max-w-full"
      >
        <div className="space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-2 min-w-0 max-w-full">
          {/* Essence Tab */}
          <TabsContent value="essence" className="mt-0 max-w-full min-w-0">
            <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
              <SectionCard
                title="מי אני, בקצרה" // <-- UPDATED
                subtitle={`מי ${profile.user?.firstName || 'האדם הזה'} באמת`}
                icon={Heart}
                variant="romantic"
                gradient={THEME.colors.primary.main}
                className="max-w-full min-w-0"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start max-w-full min-w-0">
                  <div className="relative max-w-full min-w-0">
                    <div
                      className={cn(
                        'relative aspect-[3/4] rounded-2xl overflow-hidden border-2 sm:border-4 border-white shadow-xl sm:shadow-2xl ring-2 sm:ring-4 ring-rose-200/50',
                        'max-w-full hover:scale-105 transition-transform duration-700 cursor-pointer'
                      )}
                      onClick={() =>
                        mainImageToDisplay &&
                        handleOpenImageDialog(mainImageToDisplay)
                      }
                    >
                      {mainImageToDisplay?.url ? (
                        <Image
                          src={getRelativeCloudinaryPath(
                            mainImageToDisplay.url
                          )}
                          alt={`${profile.user?.firstName || 'מועמד'} נראה/ת מדהים/ה`}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-full h-full flex items-center justify-center',
                            `bg-gradient-to-br ${THEME.colors.primary.romantic}`
                          )}
                        >
                          <div className="text-center text-white p-4">
                            <User className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 opacity-80" />
                            <p className="text-lg sm:text-xl font-bold">
                              התמונה המושלמת
                            </p>
                            <p className="text-sm opacity-80">מחכה להיחשף</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 sm:space-y-6 max-w-full min-w-0">
                    <div className="text-center lg:text-right max-w-full min-w-0">
                      <h2
                        className={cn(
                          'font-extrabold leading-tight mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                          'text-2xl sm:text-3xl md:text-4xl',
                          'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent',
                          'max-w-full'
                        )}
                      >
                        {profile.user?.firstName || 'מישהו מדהים'}
                      </h2>
                      {age > 0 && (
                        <p className="text-lg sm:text-xl text-gray-700 font-bold mb-4 sm:mb-6 flex items-center justify-center lg:justify-start gap-2 flex-wrap">
                          <Cake className="w-5 h-5 text-rose-500 flex-shrink-0" />
                          <span>גיל: {age}</span>
                        </p>
                      )}
                      {profile.about ? (
                        <div
                          className={cn(
                            'relative p-4 sm:p-6 rounded-2xl border border-rose-200/50 max-w-full min-w-0 overflow-hidden',
                            `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                            THEME.shadows.soft
                          )}
                        >
                          <Quote className="absolute top-3 right-3 w-6 h-6 sm:w-8 sm:h-8 text-rose-300" />
                          <p className="text-base sm:text-lg text-gray-800 leading-relaxed italic font-medium text-center lg:text-right break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                            {profile.about}
                          </p>
                          <Quote className="absolute bottom-3 left-3 w-6 h-6 sm:w-8 sm:h-8 text-rose-300 transform rotate-180" />
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
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-full min-w-0">
                      {profile.city && (
                        <DetailItem
                          icon={MapPin}
                          label="הבית שבלב" // <-- UPDATED
                          value={`${profile.city} - המקום שקורא לי בית`} // <-- UPDATED
                          variant="highlight"
                          size="md"
                          className="max-w-full min-w-0"
                        />
                      )}
                      {profile.occupation && (
                        <DetailItem
                          icon={Briefcase}
                          label="התחום שמלהיב אותי" // <-- UPDATED
                          value={`${profile.occupation} - כאן אני נותן/ת את הלב`} // <-- UPDATED
                          variant="highlight"
                          size="md"
                          className="max-w-full min-w-0"
                        />
                      )}
                      {profile.religiousLevel && (
                        <DetailItem
                          icon={BookMarked}
                          label="השקפת העולם שמנחה אותי" // <-- UPDATED
                          value={
                            formatEnumValue(
                              profile.religiousLevel,
                              religiousLevelMap
                            ).label
                          }
                          variant="highlight"
                          size="md"
                          className="max-w-full min-w-0"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-full min-w-0">
                <SectionCard
                  title="מה שמייחד אותי" // <-- UPDATED
                  subtitle="מה שעושה אותי מיוחד/ת"
                  icon={Sparkles}
                  variant="elegant"
                  gradient={THEME.colors.primary.light}
                  className="max-w-full min-w-0"
                >
                  <div className="space-y-4 max-w-full min-w-0">
                    {profile.profileCharacterTraits?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 sm:gap-3 max-w-full min-w-0">
                        {profile.profileCharacterTraits.map((trait) => {
                          const traitData = formatEnumValue(
                            trait,
                            characterTraitMap,
                            trait
                          );
                          return (
                            <Badge
                              key={trait}
                              className={cn(
                                'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm',
                                'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800',
                                'border border-purple-200 rounded-full hover:scale-105 transition-transform',
                                'break-words hyphens-auto word-break-break-word max-w-full min-w-0',
                                THEME.shadows.soft
                              )}
                            >
                              <traitData.icon
                                className={cn(
                                  'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                  traitData.color
                                )}
                              />{' '}
                              <span className="break-words min-w-0">
                                {traitData.label}
                              </span>
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
                        compact
                      />
                    )}
                  </div>
                </SectionCard>
                <SectionCard
                  title="איך אני ממלא/ה את הנשמה" // <-- UPDATED
                  subtitle="התחביבים והתשוקות שלי"
                  icon={Heart}
                  variant="elegant"
                  gradient={THEME.colors.secondary.sage}
                  className="max-w-full min-w-0"
                >
                  <div className="space-y-4 max-w-full min-w-0">
                    {profile.profileHobbies?.length > 0 ? (
                      <div className="flex flex-wrap gap-2 sm:gap-3 max-w-full min-w-0">
                        {profile.profileHobbies.map((hobby) => {
                          const hobbyData = formatEnumValue(
                            hobby,
                            hobbiesMap,
                            hobby
                          );
                          return (
                            <Badge
                              key={hobby}
                              className={cn(
                                'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm',
                                'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800',
                                'border border-emerald-200 rounded-full hover:scale-105 transition-transform',
                                'break-words hyphens-auto word-break-break-word max-w-full min-w-0',
                                THEME.shadows.soft
                              )}
                            >
                              <hobbyData.icon
                                className={cn(
                                  'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                  hobbyData.color
                                )}
                              />{' '}
                              <span className="break-words min-w-0">
                                {hobbyData.label}
                              </span>
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
                        compact
                      />
                    )}
                  </div>
                </SectionCard>
              </div>
              <div
                className={cn(
                  'text-center p-6 sm:p-8 rounded-2xl text-white max-w-full min-w-0 overflow-hidden',
                  `bg-gradient-to-r ${THEME.colors.primary.main}`,
                  THEME.shadows.elegant
                )}
              >
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                  מוכנים להכיר את {profile.user?.firstName || 'המועמד'} לעומק?{' '}
                  {/* <-- UPDATED & Dynamic */}
                </h3>
                <p className="text-base sm:text-lg mb-4 sm:mb-6 opacity-90 break-words">
                  עוד המון פרטים מעניינים מחכים להתגלות...
                </p>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-full">
                  <Button
                    onClick={() => handleTabChange('story')}
                    className={cn(
                      'bg-white text-gray-600 hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                      'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                      THEME.shadows.warm
                    )}
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />{' '}
                    <span className="break-words">בואו נכיר את הסיפור</span>{' '}
                    {/* <-- UPDATED */}
                  </Button>
                  <Button
                    onClick={() => handleTabChange('vision')}
                    variant="outline"
                    className="bg-white/20 hover:bg-white border border-white/30 text-white hover:text-rose-600 font-bold rounded-full backdrop-blur-sm transition-all min-h-[44px] px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />{' '}
                    <span className="break-words">מה החלום לזוגיות</span>{' '}
                    {/* <-- UPDATED */}
                  </Button>
                </div>
              </div>
              {!isDesktop && mobileViewLayout === 'detailed' && (
                <MobileTabNavigation
                  activeTab={activeTab}
                  tabItems={tabItems}
                  onTabChange={handleTabChange}
                  THEME={THEME}
                />
              )}
            </div>
          </TabsContent>

          {/* Story Tab */}
          <TabsContent
            value="story"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
              <h2
                className={cn(
                  'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                  'text-xl sm:text-2xl md:text-3xl',
                  'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                )}
              >
                הדרך שהובילה את {profile.user?.firstName || 'המועמד/ת'} לכאן
                {/* <-- UPDATED */}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg text-center break-words">
                הרקע, השורשים והתחנות בדרך שעיצבו את מי שאני היום.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-full min-w-0">
              <SectionCard
                title="הזהות הדתית והרוחנית" // <-- UPDATED
                subtitle="המקום של האמונה והמסורת בחיי"
                icon={BookMarked}
                variant="elegant"
                gradient={THEME.colors.primary.gold}
                className="max-w-full min-w-0"
              >
                <div className="space-y-4 sm:space-y-5 max-w-full min-w-0">
                  <DetailItem
                    icon={BookMarked}
                    label="השקפת העולם שמנחה אותי"
                    value={
                      formatEnumValue(profile.religiousLevel, religiousLevelMap)
                        .label
                    }
                    variant="highlight"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                  <DetailItem
                    icon={Heart}
                    label="שמירת נגיעה"
                    value={
                      formatBooleanPreference(
                        profile.shomerNegiah,
                        'כן, זה חשוב לי',
                        'לא'
                      ).label
                    }
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                  {profile.gender === 'FEMALE' && profile.headCovering && (
                    <DetailItem
                      icon={Crown}
                      label="כיסוי ראש"
                      value={
                        formatEnumValue(profile.headCovering, headCoveringMap)
                          .label
                      }
                      variant="elegant"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                  {profile.gender === 'MALE' && profile.kippahType && (
                    <DetailItem
                      icon={Crown}
                      label="סוג כיפה"
                      value={
                        formatEnumValue(profile.kippahType, kippahTypeMap).label
                      }
                      variant="elegant"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                </div>
              </SectionCard>
              <SectionCard
                title="השכלה ועולם המקצוע" // <-- UPDATED
                subtitle="הדרך האקדמית והמקצועית שלי"
                icon={GraduationCap}
                variant="elegant"
                gradient={THEME.colors.secondary.sky}
                className="max-w-full min-w-0"
              >
                <div className="space-y-4 sm:space-y-5 max-w-full min-w-0">
                  <DetailItem
                    icon={GraduationCap}
                    label="רמת ההשכלה"
                    value={
                      formatEnumValue(profile.educationLevel, educationLevelMap)
                        .label
                    }
                    variant="highlight"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                  {profile.education && (
                    <DetailItem
                      icon={BookOpen}
                      label="פירוט הלימודים"
                      value={profile.education}
                      variant="elegant"
                      valueClassName="whitespace-pre-wrap"
                      className="max-w-full min-w-0"
                    />
                  )}
                  <DetailItem
                    icon={Briefcase}
                    label="התחום המקצועי"
                    value={profile.occupation || 'מקצוע מעניין מחכה לגילוי'}
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                  <DetailItem
                    icon={Award}
                    label="השירות הצבאי/לאומי"
                    value={
                      formatEnumValue(profile.serviceType, serviceTypeMap).label
                    }
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                  {profile.serviceDetails && (
                    <DetailItem
                      icon={InfoIcon}
                      label="פרטי השירות"
                      value={profile.serviceDetails}
                      variant="elegant"
                      valueClassName="whitespace-pre-wrap"
                      className="max-w-full min-w-0"
                    />
                  )}
                </div>
              </SectionCard>
            </div>
            <SectionCard
              title="הרקע המשפחתי והתרבותי" // <-- UPDATED
              subtitle="המשפחה והמקורות שעיצבו אותי"
              icon={Users2}
              variant="romantic"
              gradient={THEME.colors.primary.accent}
              className="max-w-full min-w-0"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-full min-w-0">
                <DetailItem
                  icon={Users2}
                  label="סטטוס ההורים"
                  value={profile.parentStatus || 'נגלה יחד'}
                  variant="elegant"
                  textAlign="right"
                  className="max-w-full min-w-0"
                />
                <DetailItem
                  icon={Users}
                  label="אחים ואחיות"
                  value={
                    profile.siblings
                      ? `${profile.siblings} אחים/אחיות`
                      : 'נגלה יחד'
                  }
                  variant="elegant"
                  textAlign="right"
                  className="max-w-full min-w-0"
                />
                <DetailItem
                  icon={Crown}
                  label="המקום במשפחה"
                  value={
                    profile.position ? `מקום ${profile.position}` : 'נגלה יחד'
                  }
                  variant="elegant"
                  textAlign="right"
                  className="max-w-full min-w-0"
                />
                {profile.aliyaCountry && (
                  <DetailItem
                    icon={Globe}
                    label="ארץ המוצא"
                    value={`${profile.aliyaCountry} - השורשים שלי`}
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                )}
                {profile.aliyaYear && (
                  <DetailItem
                    icon={Calendar}
                    label="שנת העלייה"
                    value={`${profile.aliyaYear} - הגעתי הביתה`}
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                )}
                {profile.nativeLanguage && (
                  <DetailItem
                    icon={Languages}
                    label="השפה הראשונה"
                    value={
                      formatEnumValue(profile.nativeLanguage, languageMap).label
                    }
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                )}
              </div>
              {profile.additionalLanguages &&
                profile.additionalLanguages.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 max-w-full min-w-0">
                    <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-blue-500 flex-shrink-0" />{' '}
                      <span className="break-words">
                        שפות נוספות שאני מדבר/ת
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3 max-w-full min-w-0">
                      {profile.additionalLanguages.map((lang) => {
                        const langData = formatEnumValue(lang, languageMap);
                        return (
                          <Badge
                            key={lang}
                            className={cn(
                              'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-xs sm:text-sm',
                              'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800',
                              'border border-blue-200 rounded-full',
                              'break-words hyphens-auto word-break-break-word max-w-full min-w-0',
                              THEME.shadows.soft
                            )}
                          >
                            <langData.icon
                              className={cn(
                                'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                langData.color
                              )}
                            />{' '}
                            <span className="break-words min-w-0">
                              {langData.label}
                            </span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
            </SectionCard>
            {!isDesktop && mobileViewLayout === 'detailed' && (
              <MobileTabNavigation
                activeTab={activeTab}
                tabItems={tabItems}
                onTabChange={handleTabChange}
                THEME={THEME}
              />
            )}
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent
            value="vision"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
              <h2
                className={cn(
                  'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                  'text-xl sm:text-2xl md:text-3xl',
                  'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                )}
              >
                החזון והחלום לזוגיות של {profile.user?.firstName || 'המועמד'}{' '}
                {/* <-- UPDATED */}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg break-words">
                איך אני רואה את העתיד שלנו יחד {/* <-- UPDATED */}
              </p>
            </div>
            <SectionCard
              title="הזוגיות שאני חולם/ת עליה" // <-- UPDATED
              subtitle="המחשבות והרגשות שלי על אהבה ומשפחה"
              icon={Heart}
              variant="romantic"
              gradient={THEME.colors.primary.main}
              className="max-w-full min-w-0"
            >
              {profile.matchingNotes ? (
                <div
                  className={cn(
                    'p-4 sm:p-6 rounded-2xl border border-rose-200 max-w-full min-w-0 overflow-hidden',
                    `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                    THEME.shadows.soft
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4 max-w-full min-w-0">
                    <div
                      className={cn(
                        'p-2 sm:p-3 rounded-full flex-shrink-0',
                        `bg-gradient-to-r ${THEME.colors.primary.rose}`
                      )}
                    >
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="max-w-full min-w-0 flex-1 overflow-hidden">
                      <h4 className="font-bold text-rose-800 mb-3 text-base sm:text-lg">
                        המחשבות שלי על הזוגיות המושלמת:
                      </h4>
                      <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic text-base sm:text-lg break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                        <Quote className="w-4 h-4 sm:w-5 sm:h-5 inline ml-1 text-rose-400 flex-shrink-0" />
                        {profile.matchingNotes}
                        <Quote className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 text-rose-400 transform rotate-180 flex-shrink-0" />
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="החזון לזוגיות טרם פורט"
                  description="זו הזדמנות מצוינת להתחיל שיחה ולגלות יחד!"
                  variant="romantic"
                />
              )}
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 max-w-full min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />{' '}
                  <span className="break-words">החזון למשפחה</span>{' '}
                  {/* <-- UPDATED */}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-full min-w-0">
                  {profile.maritalStatus &&
                    ['divorced', 'widowed', 'annulled'].includes(
                      profile.maritalStatus
                    ) && (
                      <DetailItem
                        icon={Baby}
                        label="ילדים מקשר קודם"
                        value={
                          formatBooleanPreference(
                            profile.hasChildrenFromPrevious,
                            'יש ילדים יקרים',
                            'אין ילדים',
                            'נגלה יחד'
                          ).label
                        }
                        variant="elegant"
                        textAlign="right"
                        className="max-w-full min-w-0"
                      />
                    )}
                  {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                    <DetailItem
                      icon={Calendar}
                      label="הגיל המועדף עליי"
                      value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                      variant="highlight"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                  {(profile.preferredHeightMin ||
                    profile.preferredHeightMax) && (
                    <DetailItem
                      icon={User}
                      label="הגובה המועדף"
                      value={`${profile.preferredHeightMin || '?'} - ${profile.preferredHeightMax || '?'} ס״מ`}
                      variant="highlight"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                  <DetailItem
                    icon={Heart}
                    label="שמירת נגיעה בזוגיות"
                    value={
                      formatStringBooleanPreference(
                        profile.preferredShomerNegiah
                      ).label
                    }
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                </div>
              </div>
            </SectionCard>
            {!isDesktop && mobileViewLayout === 'detailed' && (
              <MobileTabNavigation
                activeTab={activeTab}
                tabItems={tabItems}
                onTabChange={handleTabChange}
                THEME={THEME}
              />
            )}
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent
            value="vision"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
              <h2
                className={cn(
                  'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                  'text-xl sm:text-2xl md:text-3xl',
                  'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                )}
              >
                איך אני רואה את העתיד שלנו יחד
              </h2>
              <p className="text-gray-600 text-base sm:text-lg text-center break-words">
                השאיפות, החלומות והבסיס שאני רוצה לבנות בזוגיות.
              </p>
            </div>
            <SectionCard
              title="המחשבות שלי על שותפות לחיים"
              subtitle="המחשבות והרגשות שלי על אהבה ומשפחה"
              icon={Heart}
              variant="romantic"
              gradient={THEME.colors.primary.main}
              className="max-w-full min-w-0"
            >
              {profile.matchingNotes ? (
                <div
                  className={cn(
                    'p-4 sm:p-6 rounded-2xl border border-rose-200 max-w-full min-w-0 overflow-hidden',
                    `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                    THEME.shadows.soft
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4 max-w-full min-w-0">
                    <div
                      className={cn(
                        'p-2 sm:p-3 rounded-full flex-shrink-0',
                        `bg-gradient-to-r ${THEME.colors.primary.rose}`
                      )}
                    >
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="max-w-full min-w-0 flex-1 overflow-hidden">
                      <h4 className="font-bold text-rose-800 mb-3 text-base sm:text-lg">
                        המחשבות שלי על הזוגיות המושלמת:
                      </h4>
                      <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic text-base sm:text-lg break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                        <Quote className="w-4 h-4 sm:w-5 sm:h-5 inline ml-1 text-rose-400 flex-shrink-0" />
                        {profile.matchingNotes}
                        <Quote className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 text-rose-400 transform rotate-180 flex-shrink-0" />
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="החזון לזוגיות טרם פורט"
                  description="זו הזדמנות מצוינת להתחיל שיחה ולגלות יחד!"
                  variant="romantic"
                />
              )}
              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 max-w-full min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                  <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />{' '}
                  <span className="break-words">החזון למשפחה</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-full min-w-0">
                  {profile.maritalStatus &&
                    ['divorced', 'widowed', 'annulled'].includes(
                      profile.maritalStatus
                    ) && (
                      <DetailItem
                        icon={Baby}
                        label="ילדים מקשר קודם"
                        value={
                          formatBooleanPreference(
                            profile.hasChildrenFromPrevious,
                            'יש ילדים יקרים',
                            'אין ילדים',
                            'נגלה יחד'
                          ).label
                        }
                        variant="elegant"
                        textAlign="right"
                        className="max-w-full min-w-0"
                      />
                    )}
                  {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                    <DetailItem
                      icon={Calendar}
                      label="הגיל המועדף עליי"
                      value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                      variant="highlight"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                  {(profile.preferredHeightMin ||
                    profile.preferredHeightMax) && (
                    <DetailItem
                      icon={User}
                      label="הגובה המועדף"
                      value={`${profile.preferredHeightMin || '?'} - ${profile.preferredHeightMax || '?'} ס״מ`}
                      variant="highlight"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  )}
                  <DetailItem
                    icon={Heart}
                    label="שמירת נגיעה בזוגיות"
                    value={
                      formatStringBooleanPreference(
                        profile.preferredShomerNegiah
                      ).label
                    }
                    variant="elegant"
                    textAlign="right"
                    className="max-w-full min-w-0"
                  />
                </div>
              </div>
            </SectionCard>
            {!isDesktop && mobileViewLayout === 'detailed' && (
              <MobileTabNavigation
                activeTab={activeTab}
                tabItems={tabItems}
                onTabChange={handleTabChange}
                THEME={THEME}
              />
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent
            value="search"
            className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
          >
            <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
              <h2
                className={cn(
                  'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                  'text-xl sm:text-2xl md:text-3xl',
                  'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                )}
              >
                החיבור שאני מחפש/ת בשותף/ה לחיים
                {/* <-- UPDATED */}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg break-words">
                אלו הדברים שאני מאמין/ה שייצרו בינינו חיבור עמוק ואמיתי.
              </p>
            </div>
            {hasAnyPreferences ? (
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {renderPreferenceBadges(
                  'סטטוסים משפחתיים מועדפים',
                  Heart,
                  profile.preferredMaritalStatuses,
                  maritalStatusMap,
                  THEME.colors.primary.main
                )}
                {renderPreferenceBadges(
                  'רמות דתיות מועדפות',
                  BookMarked,
                  profile.preferredReligiousLevels,
                  religiousLevelMap,
                  THEME.colors.secondary.peach
                )}
                {renderPreferenceBadges(
                  'רמות השכלה מועדפות',
                  GraduationCap,
                  profile.preferredEducation,
                  educationLevelMap,
                  THEME.colors.secondary.sky
                )}
                {profile.preferredOccupations &&
                  profile.preferredOccupations.length > 0 &&
                  renderPreferenceBadges(
                    'תחומי עיסוק מועדפים',
                    Briefcase,
                    profile.preferredOccupations,
                    {},
                    THEME.colors.secondary.sage
                  )}
                {profile.preferredLocations &&
                  profile.preferredLocations.length > 0 &&
                  renderPreferenceBadges(
                    'אזורי מגורים מועדפים', // <-- UPDATED Text
                    MapPin,
                    profile.preferredLocations,
                    {},
                    THEME.colors.secondary.peach
                  )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-full min-w-0">
                  {profile.preferredCharacterTraits &&
                    profile.preferredCharacterTraits.length > 0 && (
                      <SectionCard
                        title="תכונות אופי מועדפות"
                        subtitle="איך אני רואה את בן/בת הזוג שלי"
                        icon={Sparkles}
                        variant="elegant"
                        gradient={THEME.colors.primary.light}
                        className="max-w-full min-w-0"
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-3 max-w-full min-w-0">
                          {profile.preferredCharacterTraits.map((trait) => {
                            const traitData = formatEnumValue(
                              trait,
                              characterTraitMap,
                              trait
                            );
                            return (
                              <Badge
                                key={trait}
                                className={cn(
                                  'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 font-semibold text-xs sm:text-sm',
                                  'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800',
                                  'border border-purple-200 rounded-full',
                                  'break-words hyphens-auto word-break-break-word max-w-full min-w-0',
                                  THEME.shadows.soft
                                )}
                              >
                                <traitData.icon
                                  className={cn(
                                    'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                    traitData.color
                                  )}
                                />{' '}
                                <span className="break-words min-w-0">
                                  {traitData.label}
                                </span>
                              </Badge>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}
                  {profile.preferredHobbies &&
                    profile.preferredHobbies.length > 0 && (
                      <SectionCard
                        title="תחביבים משותפים שהייתי שמח/ה" // <-- UPDATED Text
                        subtitle="מה נעשה יחד בזמן הפנוי"
                        icon={Heart}
                        variant="elegant"
                        gradient={THEME.colors.secondary.sage}
                        className="max-w-full min-w-0"
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-3 max-w-full min-w-0">
                          {profile.preferredHobbies.map((hobby) => {
                            const hobbyData = formatEnumValue(
                              hobby,
                              hobbiesMap,
                              hobby
                            );
                            return (
                              <Badge
                                key={hobby}
                                className={cn(
                                  'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 font-semibold text-xs sm:text-sm',
                                  'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800',
                                  'border border-emerald-200 rounded-full',
                                  'break-words hyphens-auto word-break-break-word max-w-full min-w-0',
                                  THEME.shadows.soft
                                )}
                              >
                                <hobbyData.icon
                                  className={cn(
                                    'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                    hobbyData.color
                                  )}
                                />{' '}
                                <span className="break-words min-w-0">
                                  {hobbyData.label}
                                </span>
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
                title="פתוח/ה להכיר את האדם הנכון"
                // <-- UPDATED
                description="אין כאן רשימת דרישות, אלא הזמנה פתוחה להכיר אדם מיוחד. יש כאן מקום לגילויים מרגשים יחד." // <-- UPDATED
                variant="discovery"
              />
            )}
            {!isDesktop && mobileViewLayout === 'detailed' && (
              <MobileTabNavigation
                activeTab={activeTab}
                tabItems={tabItems}
                onTabChange={handleTabChange}
                THEME={THEME}
              />
            )}
          </TabsContent>

          {/* Deeper Tab */}
          {hasDisplayableQuestionnaireAnswers && (
            <TabsContent
              value="deeper"
              className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
            >
              <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
                <h2
                  className={cn(
                    'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                    'text-xl sm:text-2xl md:text-3xl',
                    'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                  )}
                >
                  התשובות העמוקות מהלב של {profile.user?.firstName || 'המועמד'}{' '}
                  {/* <-- UPDATED */}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg break-words">
                  מחשבות אישיות ותובנות על החיים, אהבה וכל מה שביניהם{' '}
                  {/* <-- UPDATED */}
                </p>
              </div>
              {Object.entries(WORLDS).map(([worldKey, worldConfig]) => {
                const answersForWorld = (
                  questionnaire?.formattedAnswers?.[
                    worldKey as keyof typeof questionnaire.formattedAnswers
                  ] ?? []
                ).filter(
                  (answer) =>
                    answer.isVisible !== false &&
                    (answer.answer || answer.displayText)
                );
                if (answersForWorld.length === 0) return null;
                return (
                  <SectionCard
                    key={worldKey}
                    title={worldConfig.label}
                    subtitle={worldConfig.description}
                    icon={worldConfig.icon}
                    variant="elegant"
                    gradient={worldConfig.gradient}
                    className="max-w-full min-w-0"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-full min-w-0">
                      {answersForWorld.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldColor={worldConfig.accentColor}
                          worldGradient={worldConfig.gradient}
                          compact={false}
                        />
                      ))}
                    </div>
                  </SectionCard>
                );
              })}
              {!isDesktop && mobileViewLayout === 'detailed' && (
                <MobileTabNavigation
                  activeTab={activeTab}
                  tabItems={tabItems}
                  onTabChange={handleTabChange}
                  THEME={THEME}
                />
              )}
            </TabsContent>
          )}

          {/* Professional Tab */}
          {viewMode === 'matchmaker' && (
            <TabsContent
              value="professional"
              className="mt-0 max-w-full min-w-0"
            >
              <div className="text-center mb-6 sm:mb-8 px-2 sm:px-4 max-w-full min-w-0 overflow-hidden">
                <h2
                  className={cn(
                    'font-bold mb-3 sm:mb-4 break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-center',
                    'text-xl sm:text-2xl md:text-3xl',
                    'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent'
                  )}
                >
                  מידע מקצועי - לשדכנים בלבד {/* <-- UPDATED */}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg break-words">
                  מידע חסוי ונקודות חשובות לתהליך השידוך {/* <-- UPDATED */}
                </p>
              </div>
              <SectionCard
                title="פרטים חסויים ותובנות לשדכן" // <-- UPDATED
                subtitle="פרטים מקצועיים לתהליך השידוך"
                icon={Lock}
                variant="elegant"
                gradient={THEME.colors.primary.gold}
                className="max-w-full min-w-0"
              >
                <div
                  className={cn(
                    'p-4 sm:p-6 rounded-2xl border-2 border-amber-300/70 max-w-full min-w-0 overflow-hidden',
                    `bg-gradient-to-br ${THEME.colors.secondary.peach}`,
                    THEME.shadows.elegant
                  )}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 max-w-full min-w-0">
                    <DetailItem
                      icon={Phone}
                      label="העדפת יצירת קשר"
                      value={
                        formatEnumValue(
                          profile.contactPreference,
                          contactPreferenceMap,
                          'נגלה יחד'
                        ).label
                      }
                      variant="elegant"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                    <DetailItem
                      icon={Users}
                      label="העדפת מגדר שדכן/ית"
                      value={
                        profile.preferredMatchmakerGender
                          ? profile.preferredMatchmakerGender === 'MALE'
                            ? 'שדכן גבר'
                            : 'שדכנית אישה'
                          : 'אין העדפה מיוחדת'
                      }
                      variant="elegant"
                      textAlign="right"
                      className="max-w-full min-w-0"
                    />
                  </div>
                  {profile.matchingNotes && (
                    <div className="mt-4 sm:mt-6 max-w-full min-w-0 overflow-hidden">
                      <h4 className="text-base sm:text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />{' '}
                        <span className="break-words">
                          הערות מיוחדות לשדכנים:
                        </span>
                      </h4>
                      <div
                        className={cn(
                          'p-3 sm:p-4 rounded-xl border border-amber-200/80 bg-amber-100/70 shadow-inner max-w-full min-w-0 overflow-hidden'
                        )}
                      >
                        <p className="text-amber-800 whitespace-pre-wrap leading-relaxed font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                          {profile.matchingNotes}
                        </p>
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      'mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-100 to-purple-100 max-w-full min-w-0 overflow-hidden'
                    )}
                  >
                    <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />{' '}
                      <span className="break-words">תובנות מערכת:</span>{' '}
                      {/* <-- UPDATED */}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-indigo-700 text-sm sm:text-base max-w-full min-w-0">
                      <div className="flex items-center gap-2 break-words">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />{' '}
                        <span className="break-words min-w-0">
                          פרופיל נוצר:{' '}
                          {profile.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString(
                                'he-IL'
                              )
                            : 'לא ידוע'}
                        </span>
                      </div>
                      {profile.lastActive && (
                        <div className="flex items-center gap-2 break-words">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />{' '}
                          <span className="break-words min-w-0">
                            פעילות אחרונה:{' '}
                            {new Date(profile.lastActive).toLocaleDateString(
                              'he-IL'
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 break-words">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />{' '}
                        <span className="break-words min-w-0">
                          השלמת פרופיל:{' '}
                          {profile.isProfileComplete
                            ? 'מושלם ✅'
                            : 'דורש השלמה ⚠️'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 break-words">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />{' '}
                        <span className="break-words min-w-0">
                          סטטוס זמינות: {availability.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
              {!isDesktop && mobileViewLayout === 'detailed' && (
                <MobileTabNavigation
                  activeTab={activeTab}
                  tabItems={tabItems}
                  onTabChange={handleTabChange}
                  THEME={THEME}
                />
              )}
            </TabsContent>
          )}
        </div>
      </ScrollArea>
    </Tabs>
  );

  // Enhanced Mobile Header
  const MobileHeader = () => (
    <div
      className={cn(
        'flex-shrink-0 flex justify-between items-center border-b border-rose-200/50 sticky top-0 z-30 backdrop-blur-md',
        'p-3 sm:p-4 min-h-[60px]',
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}
      dir="ltr" // הוספת dir="ltr" כדי למנוע התנגשות RTL
    >
      {/* Right side - Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-full transition-all duration-300 shadow-sm hover:shadow-md',
          'w-10 h-10 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] touch-manipulation'
        )}
        onClick={handleClose}
        aria-label="סגור תצוגה מקדימה"
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>

      {/* Center - View Toggle and Color Selector */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        <ToggleGroup
          type="single"
          value={mobileViewLayout}
          onValueChange={(value: 'focus' | 'detailed') => {
            if (value) setMobileViewLayout(value);
          }}
          className={cn(
            'bg-white/95 backdrop-blur-sm rounded-2xl border border-rose-200/50 shadow-lg',
            'p-1',
            THEME.shadows.soft
          )}
        >
          <ToggleGroupItem
            value="focus"
            aria-label="תצוגת היכרות"
            className={cn(
              'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
              'data-[state=on]:bg-gradient-to-r data-[state=on]:from-rose-500 data-[state=on]:to-pink-500 data-[state=on]:text-white data-[state=on]:shadow-md'
            )}
          >
            <Heart className="h-3 h-3 sm:h-4 sm:w-4" />
            <span className="mr-1.5 sm:mr-2 text-xs sm:text-sm font-medium">
              היכרות
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="detailed"
            aria-label="תצוגה מפורטת"
            className={cn(
              'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
              'data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-indigo-500 data-[state=on]:text-white data-[state=on]:shadow-md'
            )}
          >
            <FileText className="h-3 h-3 sm:h-4 sm:w-4" />
            <span className="mr-1.5 sm:mr-2 text-xs sm:text-sm font-medium">
              מפורט
            </span>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Color Palette Selector */}
        <ColorPaletteSelector
          selectedPalette={selectedPalette}
          onPaletteChange={setSelectedPalette}
          THEME={THEME}
          compact={true}
        />
      </div>
    </div>
  );

  // Enhanced Detailed Mobile Layout
  const DetailedMobileLayout = () => (
    <ScrollArea className="flex-1 min-h-0 max-w-full overflow-hidden">
      <div className="flex flex-col min-w-0 max-w-full">
        <ProfileHeader
          profile={profile}
          age={age}
          mainImageToDisplay={mainImageToDisplay}
          availability={availability}
          viewMode={viewMode}
          onSuggestClick={() => setIsSuggestDialogOpen(true)}
          isMobile={true}
          selectedPalette={selectedPalette}
          THEME={THEME}
          compact={false}
        />
        <MobileImageGallery
          orderedImages={orderedImages}
          profile={profile}
          onImageClick={handleOpenImageDialog}
          THEME={THEME}
          compact={false}
        />
        <div
          className={cn(
            'p-3 sm:p-4 min-w-0 max-w-full overflow-hidden',
            `bg-gradient-to-br ${THEME.colors.neutral.cool}`
          )}
        >
          <MainContentTabs />
        </div>
      </div>
    </ScrollArea>
  );

  // Enhanced Focus Mobile Layout
  const FocusMobileLayout = () => (
    <div className="flex-1 min-h-0 flex flex-col max-w-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 max-w-full">
        <div className="pb-4 px-2 sm:px-3 min-w-0 max-w-full overflow-hidden">
          <ProfileHeader
            profile={profile}
            age={age}
            mainImageToDisplay={mainImageToDisplay}
            availability={availability}
            viewMode={viewMode}
            onSuggestClick={() => setIsSuggestDialogOpen(true)}
            isMobile={true}
            selectedPalette={selectedPalette}
            onPaletteChange={setSelectedPalette}
            THEME={THEME}
            compact={true}
          />
          <MobileImageGallery
            orderedImages={orderedImages}
            profile={profile}
            onImageClick={handleOpenImageDialog}
            THEME={THEME}
            compact={true}
          />

          <div
            className={cn(
              'px-2 sm:px-3 py-2 space-y-3 sm:space-y-4 min-w-0 max-w-full overflow-hidden',
              `bg-gradient-to-br ${THEME.colors.neutral.warm}`
            )}
          >
            {/* About Section */}
            {profile.about ? (
              <SectionCard
                title="קצת עליי"
                subtitle="המילים שמגדירות אותי"
                icon={Heart}
                variant="romantic"
                gradient={THEME.colors.primary.main}
                compact={true}
                className="min-w-0 max-w-full"
              >
                <div
                  className={cn(
                    'p-3 sm:p-4 rounded-xl border border-rose-200/50 min-w-0 max-w-full overflow-hidden',
                    `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                  )}
                >
                  <p
                    className="text-gray-800 leading-relaxed italic font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-right"
                    dir="rtl"
                  >
                    <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1 text-rose-400 flex-shrink-0" />
                    {profile.about}
                    <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-rose-400 transform rotate-180 flex-shrink-0" />
                  </p>
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                title="הסיפור שלי"
                subtitle="המילים שמגדירות אותי"
                icon={Telescope}
                variant="romantic"
                compact={true}
              >
                <EmptyState
                  icon={Telescope}
                  title="יש כאן הרבה לגלות!"
                  description="הסיפור האישי מחכה להיכתב יחד איתך..."
                  variant="romantic"
                  compact={true}
                />
              </SectionCard>
            )}

            {/* Quick Summary */}
            <SectionCard
              title="תמצית מהירה"
              subtitle="הפרטים החשובים שכדאי לדעת עליי במבט ראשון"
              icon={Zap}
              variant="elegant"
              gradient={THEME.colors.primary.gold}
              compact={true}
              className="min-w-0 max-w-full"
            >
              <div className="grid grid-cols-1 gap-2 sm:gap-3 min-w-0 max-w-full">
                <DetailItem
                  icon={BookMarked}
                  label="השקפה"
                  value={
                    formatEnumValue(profile.religiousLevel, religiousLevelMap)
                      .label
                  }
                  variant="elegant"
                  size="sm"
                  useMobileLayout={true}
                  textAlign="center"
                  className="min-w-0 max-w-full"
                />
                <DetailItem
                  icon={Heart}
                  label="שמירת נגיעה"
                  value={formatBooleanPreference(profile.shomerNegiah).label}
                  variant="elegant"
                  size="sm"
                  useMobileLayout={true}
                  className="min-w-0 max-w-full"
                />
                <DetailItem
                  icon={Briefcase}
                  label="עיסוק"
                  value={profile.occupation || 'נגלה יחד'}
                  variant="elegant"
                  size="sm"
                  useMobileLayout={true}
                  className="min-w-0 max-w-full"
                />
                <DetailItem
                  icon={GraduationCap}
                  label="השכלה"
                  value={
                    formatEnumValue(profile.educationLevel, educationLevelMap)
                      .label
                  }
                  variant="elegant"
                  size="sm"
                  useMobileLayout={true}
                  className="min-w-0 max-w-full"
                />
              </div>
            </SectionCard>

            {/* Special Traits and Hobbies */}
            {(profile.profileCharacterTraits?.length > 0 ||
              profile.profileHobbies?.length > 0) && (
              <SectionCard
                title="מה מיוחד בי"
                subtitle="התכונות והתחביבים שעושים אותי ייחודי/ת ומעניין/ת"
                icon={Sparkles}
                variant="romantic"
                gradient={THEME.colors.primary.romantic}
                compact={true}
                className="min-w-0 max-w-full"
              >
                <div className="space-y-4 sm:space-y-5 min-w-0 max-w-full">
                  {profile.profileCharacterTraits?.length > 0 && (
                    <div className="min-w-0 max-w-full">
                      <h4 className="text-sm font-bold text-purple-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                        <span className="break-words">התכונות שלי:</span>
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      </h4>
                      <div className="flex flex-wrap gap-2 min-w-0 max-w-full justify-center">
                        {' '}
                        {profile.profileCharacterTraits
                          .slice(0, 4)
                          .map((trait) => {
                            const traitData = formatEnumValue(
                              trait,
                              characterTraitMap,
                              trait,
                              true
                            );
                            return (
                              <Badge
                                key={trait}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-1 text-xs font-semibold min-w-0 max-w-full',
                                  'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800',
                                  'border border-purple-200 rounded-full',
                                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere'
                                )}
                              >
                                <traitData.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="break-words min-w-0 overflow-hidden">
                                  {traitData.shortLabel || traitData.label}
                                </span>
                              </Badge>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {profile.profileHobbies?.length > 0 && (
                    <div className="min-w-0 max-w-full">
                      <h4 className="text-sm font-bold text-emerald-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                        <span className="break-words">מה אני אוהב/ת:</span>
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      </h4>
                      <div className="flex flex-wrap gap-2 min-w-0 max-w-full justify-center">
                        {profile.profileHobbies.slice(0, 4).map((hobby) => {
                          const hobbyData = formatEnumValue(
                            hobby,
                            hobbiesMap,
                            hobby,
                            true
                          );
                          return (
                            <Badge
                              key={hobby}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 text-xs font-semibold min-w-0 max-w-full',
                                'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800',
                                'border border-emerald-200 rounded-full',
                                'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere'
                              )}
                            >
                              <hobbyData.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="break-words min-w-0 overflow-hidden">
                                {hobbyData.shortLabel || hobbyData.label}
                              </span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Search Criteria */}
            <SectionCard
              title="מה אני מחפש/ת"
              subtitle="החלום שלי לזוגיות - איך אני רואה את בן/בת הזוג המושלם/ת"
              icon={Target}
              variant="highlight"
              gradient={THEME.colors.secondary.sky}
              compact={true}
              className="min-w-0 max-w-full"
            >
              {profile.matchingNotes ? (
                <div
                  className={cn(
                    'p-3 sm:p-4 rounded-xl border border-blue-200/50 min-w-0 max-w-full overflow-hidden',
                    'bg-gradient-to-r from-blue-50 to-cyan-50'
                  )}
                >
                  <p className="text-blue-700 leading-relaxed italic font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                    <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline ml-1 text-blue-400 flex-shrink-0" />
                    {profile.matchingNotes}
                    <Quote className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-blue-400 transform rotate-180 flex-shrink-0" />
                  </p>
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="החלום שלי לזוגיות עדיין נכתב..."
                  description="אבל בטוח שנגלה יחד מה מתאים לנו!"
                  variant="adventure"
                  compact={true}
                />
              )}
              {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                <div className="mt-4 sm:mt-5">
                  <DetailItem
                    icon={Calendar}
                    label="טווח גילאים מועדף"
                    value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                    variant="elegant"
                    size="sm"
                    useMobileLayout={true}
                    className="min-w-0 max-w-full"
                  />
                </div>
              )}
            </SectionCard>

            {/* Call to Action */}
            <div
              className={cn(
                'text-center p-4 sm:p-6 rounded-2xl text-white min-w-0 max-w-full overflow-hidden',
                `bg-gradient-to-r ${THEME.colors.primary.main}`,
                THEME.shadows.elegant
              )}
            >
              <h3 className="text-base sm:text-lg font-bold mb-2 break-words">
                רוצים לדעת עוד?
              </h3>
              <p className="mb-3 sm:mb-4 opacity-90 text-sm break-words">
                עוד המון דברים מעניינים מחכים לגילוי...
              </p>
              <Button
                onClick={() => setMobileViewLayout('detailed')}
                className={cn(
                  'bg-white text-gray-600 hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                  'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                  THEME.shadows.warm
                )}
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                <span className="break-words">בואו נכיר לעומק</span>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // Loading State
  if (!isClient) {
    return (
      <Card
        dir="rtl"
        className={cn(
          'w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col h-full',
          className
        )}
      >
        <div
          className={cn(
            'p-4 sm:p-6 border-b border-gray-200/80',
            `bg-gradient-to-r ${THEME.colors.neutral.warm}`
          )}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Skeleton className="h-24 w-24 sm:h-36 sm:w-36 rounded-full flex-shrink-0" />
            <div className="flex-grow w-full space-y-4">
              <Skeleton className="h-8 sm:h-12 w-3/4 mx-auto sm:mx-0" />
              <Skeleton className="h-4 sm:h-6 w-1/2 mx-auto sm:mx-0" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 flex-grow">
          <div className="space-y-4">
            <Skeleton className="h-6 sm:h-8 w-full rounded-xl" />
            <Skeleton className="h-24 sm:h-32 w-full rounded-xl" />
            <Skeleton className="h-16 sm:h-24 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  // Main Render
  return (
    <TooltipProvider>
      <Card
        dir="rtl"
        id="profile-card-container"
        className={cn(
          'w-full h-full overflow-hidden flex flex-col max-w-full min-w-0',
          `bg-gradient-to-br ${THEME.colors.neutral.elegant}`,
          THEME.shadows.elegant,
          '[&_*]:box-border [&_*]:max-w-full',
          className
        )}
        style={{
          direction: 'rtl',
          textAlign: 'right',
          overflow: 'hidden',
        }}
      >
        {/* Desktop Close Button */}
        {isDesktop && onClose && (
          <div className="absolute top-4 left-4 z-40">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'text-gray-600 hover:text-gray-800 bg-white/80 hover:bg-white/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
                    'w-10 h-10 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px]'
                  )}
                  onClick={handleClose}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>סגור תצוגה מקדימה</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Main Content */}
        {isDesktop ? (
          // Desktop Layout
          <ResizablePanelGroup
            direction="horizontal"
            dir="rtl"
            className="flex-grow min-h-0 max-w-full"
          >
            <ResizablePanel
              defaultSize={60}
              minSize={40}
              className="min-w-0 flex flex-col max-w-full overflow-hidden"
            >
              <ScrollArea className="flex-1 min-h-0 max-w-full">
                <ProfileHeader
                  profile={profile}
                  age={age}
                  mainImageToDisplay={mainImageToDisplay}
                  availability={availability}
                  viewMode={viewMode}
                  onSuggestClick={() => setIsSuggestDialogOpen(true)}
                  selectedPalette={selectedPalette}
                  onPaletteChange={setSelectedPalette}
                  THEME={THEME}
                />
                <div className="p-4 sm:p-6 overflow-hidden flex max-w-full">
                  <MainContentTabs />
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className={cn(
                'bg-gradient-to-b from-rose-200 to-pink-200 hover:from-rose-300 hover:to-pink-300',
                'transition-all duration-300'
              )}
            />

            <ResizablePanel
              defaultSize={40}
              minSize={25}
              className="min-w-0 flex flex-col max-w-full overflow-hidden"
            >
              <ScrollArea className="flex-grow min-h-0 max-w-full">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-w-0 max-w-full">
                  {/* Desktop Image Gallery */}
                  <SectionCard
                    title="הגלריה האישית"
                    subtitle="התמונות שמספרות את הסיפור"
                    icon={Camera}
                    variant="romantic"
                    gradient={THEME.colors.primary.rose}
                    className="min-w-0 max-w-full"
                  >
                    {orderedImages.length > 0 ? (
                      <div className="space-y-4 min-w-0 max-w-full">
                        <div
                          className={cn(
                            'relative aspect-video rounded-2xl overflow-hidden cursor-pointer group border-2 sm:border-3 border-white shadow-lg hover:shadow-xl transition-all duration-300 max-w-full'
                          )}
                          onClick={() =>
                            handleOpenImageDialog(orderedImages[0])
                          }
                        >
                          <Image
                            src={getRelativeCloudinaryPath(
                              orderedImages[0].url
                            )}
                            alt="תמונה ראשית מדהימה"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="35vw"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                              <p className="font-bold text-sm sm:text-base">
                                לחץ להגדלה
                              </p>
                            </div>
                          </div>
                        </div>
                        {orderedImages.length > 1 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0 max-w-full">
                            {orderedImages.slice(1, 7).map((img) => (
                              <div
                                key={img.id}
                                className={cn(
                                  'relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-rose-400 transition-all duration-300 shadow-md hover:shadow-lg max-w-full'
                                )}
                                onClick={() => handleOpenImageDialog(img)}
                              >
                                <Image
                                  src={getRelativeCloudinaryPath(img.url)}
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

                  {/* Desktop Quick Facts */}
                  <SectionCard
                    title="הנקודות החמות"
                    subtitle="מה שחשוב לדעת ברגע הראשון"
                    icon={Flame}
                    variant="highlight"
                    gradient={THEME.colors.primary.gold}
                    className="min-w-0 max-w-full"
                  >
                    <div className="space-y-3 sm:space-y-4 min-w-0 max-w-full">
                      <DetailItem
                        icon={BookMarked}
                        label="השקפת עולם"
                        value={
                          formatEnumValue(
                            profile.religiousLevel,
                            religiousLevelMap
                          ).label
                        }
                        variant="highlight"
                        textAlign="right"
                        className="min-w-0 max-w-full"
                      />
                      <DetailItem
                        icon={Heart}
                        label="שמירת נגיעה"
                        value={
                          formatBooleanPreference(profile.shomerNegiah).label
                        }
                        variant="elegant"
                        textAlign="right"
                        className="min-w-0 max-w-full"
                      />
                      <DetailItem
                        icon={Briefcase}
                        label="התחום המקצועי"
                        value={profile.occupation || 'מקצוע מעניין מחכה לגילוי'}
                        variant="elegant"
                        textAlign="right"
                        className="min-w-0 max-w-full"
                      />
                      <DetailItem
                        icon={GraduationCap}
                        label="רמת השכלה"
                        value={
                          formatEnumValue(
                            profile.educationLevel,
                            educationLevelMap
                          ).label
                        }
                        variant="elegant"
                        textAlign="right"
                        className="min-w-0 max-w-full"
                      />
                      <DetailItem
                        icon={MapPin}
                        label="מיקום"
                        value={profile.city || 'איפה שהלב נמצא'}
                        variant="elegant"
                        textAlign="right"
                        className="min-w-0 max-w-full"
                      />
                      {profile.maritalStatus &&
                        ['divorced', 'widowed', 'annulled'].includes(
                          profile.maritalStatus
                        ) && (
                          <DetailItem
                            icon={Baby}
                            label="ילדים מקשר קודם"
                            value={
                              formatBooleanPreference(
                                profile.hasChildrenFromPrevious,
                                'יש ילדים יקרים',
                                'אין ילדים',
                                'נגלה יחד'
                              ).label
                            }
                            variant="elegant"
                            textAlign="right"
                            className="min-w-0 max-w-full"
                          />
                        )}
                    </div>
                  </SectionCard>

                  {/* Desktop About Story */}
                  <SectionCard
                    title="הסיפור שמאחורי הפרופיל"
                    subtitle="מילים מהלב"
                    icon={Quote}
                    variant="romantic"
                    gradient={THEME.colors.primary.romantic}
                    className="min-w-0 max-w-full"
                  >
                    {profile.about ? (
                      <div
                        className={cn(
                          'p-3 sm:p-4 rounded-xl border border-rose-200/50 shadow-inner min-w-0 max-w-full overflow-hidden',
                          `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                        )}
                      >
                        <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 mb-2" />
                        <p className="text-gray-800 leading-relaxed italic font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
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

                  {/* Desktop Vision */}
                  <SectionCard
                    title="החלום לזוגיות"
                    subtitle="מה מחכה למי שיבוא"
                    icon={Target}
                    variant="highlight"
                    gradient={THEME.colors.secondary.sky}
                    className="min-w-0 max-w-full"
                  >
                    {profile.matchingNotes ? (
                      <div
                        className={cn(
                          'p-3 sm:p-4 rounded-xl border border-blue-200/50 shadow-inner min-w-0 max-w-full overflow-hidden',
                          'bg-gradient-to-r from-blue-50 to-cyan-50'
                        )}
                      >
                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mb-2" />
                        <p className="text-blue-700 leading-relaxed italic font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
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
                    <div className="mt-4 space-y-3 min-w-0 max-w-full">
                      {(profile.preferredAgeMin || profile.preferredAgeMax) && (
                        <DetailItem
                          icon={Calendar}
                          label="טווח גילאים מועדף"
                          value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`}
                          variant="elegant"
                          textAlign="right"
                          className="min-w-0 max-w-full"
                        />
                      )}
                      {profile.preferredReligiousLevels &&
                        profile.preferredReligiousLevels.length > 0 && (
                          <div className="min-w-0 max-w-full">
                            <p className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                              <BookMarked className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="break-words">
                                רמות דתיות מועדפות:
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-2 min-w-0 max-w-full">
                              {profile.preferredReligiousLevels
                                .slice(0, 3)
                                .map((level) => {
                                  const levelData = formatEnumValue(
                                    level,
                                    religiousLevelMap,
                                    level
                                  );
                                  return (
                                    <Badge
                                      key={level}
                                      className={cn(
                                        'flex items-center gap-1 text-xs px-2 py-1 font-semibold rounded-full min-w-0 max-w-full',
                                        'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800',
                                        'border border-indigo-200',
                                        'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere'
                                      )}
                                    >
                                      <levelData.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                      <span className="break-words min-w-0 overflow-hidden">
                                        {levelData.label}
                                      </span>
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
          // Mobile Layout
          <div className="flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden">
            <MobileHeader />
            {mobileViewLayout === 'detailed' ? (
              <DetailedMobileLayout />
            ) : (
              <FocusMobileLayout />
            )}
          </div>
        )}

        {/* Image Dialog */}
        <ImageDialogComponent
          selectedImageForDialog={selectedImageForDialog}
          currentDialogImageIndex={currentDialogImageIndex}
          orderedImages={orderedImages}
          onClose={handleCloseImageDialog}
          onNavigate={handleDialogNav}
        />

        {/* Suggestion Dialog */}
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
