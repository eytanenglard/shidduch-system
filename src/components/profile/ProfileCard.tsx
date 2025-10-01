// src/components/profile/ProfileCard.tsx

'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Image from 'next/image';
import BudgetDisplay from './sections/BudgetDisplay';

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
  MessageSquareQuote,
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
  FriendTestimonial,
  WorldId,
} from '@/types/next-auth';
import { languageOptions } from '@/lib/languageOptions';
import type { Candidate } from '@/components/matchmaker/new/types/candidates';

import NewSuggestionForm from '@/components/matchmaker/suggestions/NewSuggestionForm';
import { ProfileCardDict, ProfileCardDisplayDict } from '@/types/dictionary';
// הוסף CSS משתנים דינמיים

const NeshamaTechSummary: React.FC<{
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  THEME: ThemeType;
  direction: 'ltr' | 'rtl';
}> = ({ profile, dict, THEME, direction }) => {
  if (!profile.isNeshamaTechSummaryVisible || !profile.manualEntryText) {
    return null;
  }
  return (
    <SectionCard
      title={dict.content.neshamaTechSummary.title.replace(
        '{{name}}',
        profile.user?.firstName || ''
      )}
      icon={Bot}
      variant="elegant"
      gradient={THEME.colors.primary.gold}
    >
      <div className="text-center italic p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
        <p
          dir={direction}
          className="whitespace-pre-wrap text-gray-800 leading-relaxed"
        >
          {' '}
          {profile.manualEntryText}
        </p>
      </div>
    </SectionCard>
  );
};

// רכיב 2: הסיפור של המשתמש (קצת עליי)
const AboutMeSection: React.FC<{
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  THEME: ThemeType;
}> = ({ profile, dict, THEME }) => {
  if (!profile.isAboutVisible || !profile.about) {
    return null;
  }
  return (
    <SectionCard
      title={dict.content.aboutMe.titleCard.replace(
        '{{name}}',
        profile.user?.firstName || ''
      )}
      icon={User}
      variant="romantic"
      gradient={THEME.colors.primary.romantic}
    >
      <div className="relative p-4 bg-rose-50/30 rounded-lg border border-rose-200/50">
        <Quote className="absolute top-2 right-2 w-6 h-6 text-rose-200" />
        <p className="whitespace-pre-wrap text-gray-800 leading-relaxed italic px-4">
          {profile.about}
        </p>
        <Quote className="absolute bottom-2 left-2 w-6 h-6 text-rose-200 transform rotate-180" />
      </div>
    </SectionCard>
  );
};

// רכיב 3: המלצות חברים (תצוגה מלאה)
const FriendTestimonialsSection: React.FC<{
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  THEME: ThemeType;
  direction: 'ltr' | 'rtl';
}> = ({ profile, dict, THEME, direction }) => {
  const approvedTestimonials = (profile.testimonials || []).filter(
    (t) => t.status === 'APPROVED'
  );

  if (!profile.isFriendsSectionVisible || approvedTestimonials.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title={dict.content.friendTestimonials.emptyState.title}
        description={dict.content.friendTestimonials.emptyState.description}
        variant="discovery"
        THEME={THEME}
      />
    );
  }

  return (
    <div className="space-y-4">
      {approvedTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          <blockquote
            className={cn(
              'italic pr-4',
              THEME.colors.primary.main.includes('cyan')
                ? 'text-cyan-800 border-r-4 border-cyan-500'
                : THEME.colors.primary.main.includes('blue')
                  ? 'text-blue-800 border-r-4 border-blue-500'
                  : 'text-gray-800 border-r-4 border-gray-500'
            )}
          >
            &quot;{testimonial.content}&quot;
          </blockquote>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-800 text-start">
              {' '}
              - {testimonial.authorName},{' '}
              <span className="font-normal text-gray-600">
                {testimonial.relationship}
              </span>
            </p>
            {testimonial.isPhoneVisibleToMatch && testimonial.authorPhone && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full',
                  `text-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-700`,
                  `border-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-300`,
                  `hover:bg-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-50`
                )}
              >
                <a href={`tel:${testimonial.authorPhone}`}>
                  <Phone className="w-3 h-3 me-2" />
                  {dict.content.friendTestimonials.callButton.replace(
                    '{{name}}',
                    testimonial.authorName.split(' ')[0]
                  )}
                </a>
              </Button>
            )}
          </div>
        </div>
      ))}
      {approvedTestimonials.some((t) => t.isPhoneVisibleToMatch) && (
        <p className="text-xs text-center text-gray-500 mt-4 px-4">
          {dict.content.friendTestimonials.callDisclaimer}
        </p>
      )}
    </div>
  );
};

// --- Maps Creation ---
const createMaritalStatusMap = (
  dict: ProfileCardDict['options']['maritalStatus']
) => ({
  single: {
    label: dict.single,
    shortLabel: 'רווק',
    icon: Heart,
    color: 'text-rose-600',
  },
  divorced: {
    label: dict.divorced,
    shortLabel: 'גרוש',
    icon: Sunrise,
    color: 'text-amber-600',
  },
  widowed: {
    label: dict.widowed,
    shortLabel: 'אלמן',
    icon: Stars,
    color: 'text-purple-600',
  },
  annulled: {
    label: dict.annulled,
    shortLabel: 'מוכן לאהבה',
    icon: Rainbow,
    color: 'text-pink-600',
  },
  any: {
    label: 'פתוח/ה לכל האפשרויות',
    shortLabel: 'פתוח',
    icon: Sparkles,
    color: 'text-indigo-600',
  },
});

const createReligiousLevelMap = (
  dict: ProfileCardDict['options']['religiousLevel']
) => ({
  charedi: {
    label: dict.charedi,
    shortLabel: 'חרדי',
    icon: BookMarked,
    color: 'text-indigo-700',
  },
  charedi_modern: {
    label: dict.charedi_modern,
    shortLabel: 'חרדי מודרני',
    icon: BookOpen,
    color: 'text-indigo-600',
  },
  dati_leumi_torani: {
    label: dict.dati_leumi_torani,
    shortLabel: 'דתי תורני',
    icon: Star,
    color: 'text-blue-700',
  },
  dati_leumi_liberal: {
    label: dict.dati_leumi_liberal,
    shortLabel: 'דתי ליברלי',
    icon: Flower,
    color: 'text-blue-600',
  },
  dati_leumi_standard: {
    label: dict.dati_leumi_standard,
    shortLabel: 'דתי לאומי',
    icon: Crown,
    color: 'text-blue-600',
  },
  masorti_strong: {
    label: dict.masorti_strong,
    shortLabel: 'מסורתי חזק',
    icon: TreePine,
    color: 'text-emerald-700',
  },
  masorti_light: {
    label: dict.masorti_light,
    shortLabel: 'מסורתי קל',
    icon: Wind,
    color: 'text-emerald-600',
  },
  secular_traditional_connection: {
    label: dict.secular_traditional_connection,
    shortLabel: 'חילוני עם זיקה',
    icon: Waves,
    color: 'text-cyan-600',
  },
  secular: {
    label: dict.secular,
    shortLabel: 'חילוני',
    icon: Sunrise,
    color: 'text-orange-600',
  },
  spiritual_not_religious: {
    label: dict.spiritual_not_religious,
    shortLabel: 'רוחני',
    icon: Sparkle,
    color: 'text-purple-600',
  },
  other: {
    label: dict.other,
    shortLabel: 'ייחודי',
    icon: Rainbow,
    color: 'text-pink-600',
  },
  no_preference: {
    label: dict.other, // Assuming 'other' can serve as a fallback for 'no preference' text
    shortLabel: 'פתוח',
    icon: Globe,
    color: 'text-gray-600',
  },
});

const createReligiousJourneyMap = (
  dict: ProfileCardDict['options']['religiousJourney']
) => ({
  BORN_INTO_CURRENT_LIFESTYLE: {
    label: dict.BORN_INTO_CURRENT_LIFESTYLE,
    shortLabel: 'גדלתי דתי',
    icon: Home,
    color: 'text-blue-600',
  },
  BORN_SECULAR: {
    label: dict.BORN_SECULAR,
    shortLabel: 'גדלתי חילוני',
    icon: Sun,
    color: 'text-orange-600',
  },
  BAAL_TESHUVA: {
    label: dict.BAAL_TESHUVA,
    shortLabel: 'חוזר בתשובה',
    icon: Sparkles,
    color: 'text-purple-600',
  },
  DATLASH: {
    label: dict.DATLASH,
    shortLabel: 'דתל"ש',
    icon: ArrowLeft,
    color: 'text-gray-600',
  },
  CONVERT: {
    label: dict.CONVERT,
    shortLabel: 'גיורת',
    icon: Star,
    color: 'text-amber-600',
  },
  IN_PROCESS: {
    label: dict.IN_PROCESS,
    shortLabel: 'בתהליך',
    icon: Compass,
    color: 'text-teal-600',
  },
  OTHER: {
    label: dict.OTHER,
    shortLabel: 'אחר',
    icon: InfoIcon,
    color: 'text-pink-600',
  },
  no_preference: {
    label: 'ללא העדפה למסע הדתי',
    shortLabel: 'ללא העדפה',
    icon: Globe,
    color: 'text-gray-500',
  },
});

const createEducationLevelMap = (
  dict: ProfileCardDict['options']['educationLevel']
) => ({
  high_school: {
    label: dict.high_school,
    shortLabel: 'תיכון',
    icon: School,
    color: 'text-blue-600',
  },
  vocational: {
    label: dict.vocational,
    shortLabel: 'מקצועי',
    icon: Award,
    color: 'text-green-600',
  },
  academic_student: {
    label: dict.academic_student,
    shortLabel: 'סטודנט',
    icon: BookOpen,
    color: 'text-orange-600',
  },
  academic_ba: {
    label: dict.academic_ba,
    shortLabel: 'ב.א',
    icon: GraduationCap,
    color: 'text-purple-600',
  },
  academic_ma: {
    label: dict.academic_ma,
    shortLabel: 'מ.א',
    icon: Star,
    color: 'text-indigo-600',
  },
  academic_phd: {
    label: dict.academic_phd,
    shortLabel: 'דוקטור',
    icon: Crown,
    color: 'text-rose-600',
  },
  yeshiva_seminary: {
    label: dict.yeshiva_seminary,
    shortLabel: 'תורני',
    icon: BookMarked,
    color: 'text-amber-600',
  },
  other: {
    label: dict.other,
    shortLabel: 'ייחודי',
    icon: Sparkles,
    color: 'text-pink-600',
  },
  'ללא העדפה': {
    label: 'הכל פתוח',
    shortLabel: 'פתוח',
    icon: Globe,
    color: 'text-gray-600',
  },
});

const createServiceTypeMap = (
  dict: ProfileCardDict['options']['serviceType']
) => ({
  MILITARY_COMBATANT: {
    label: dict.MILITARY_COMBATANT,
    shortLabel: 'לוחם',
    icon: Award,
    color: 'text-red-600',
  },
  MILITARY_SUPPORT: {
    label: dict.MILITARY_SUPPORT,
    shortLabel: 'תומך',
    icon: Users,
    color: 'text-orange-600',
  },
  MILITARY_OFFICER: {
    label: dict.MILITARY_OFFICER,
    shortLabel: 'קצין',
    icon: Crown,
    color: 'text-purple-600',
  },
  MILITARY_INTELLIGENCE_CYBER_TECH: {
    label: dict.MILITARY_INTELLIGENCE_CYBER_TECH,
    shortLabel: 'טכנולוגיה',
    icon: Zap,
    color: 'text-blue-600',
  },
  NATIONAL_SERVICE_ONE_YEAR: {
    label: dict.NATIONAL_SERVICE_ONE_YEAR,
    shortLabel: 'שירות לאומי',
    icon: Heart,
    color: 'text-pink-600',
  },
  NATIONAL_SERVICE_TWO_YEARS: {
    label: dict.NATIONAL_SERVICE_TWO_YEARS,
    shortLabel: 'שירות מורחב',
    icon: Stars,
    color: 'text-rose-600',
  },
  HESDER_YESHIVA: {
    label: dict.HESDER_YESHIVA,
    shortLabel: 'הסדר',
    icon: BookMarked,
    color: 'text-indigo-600',
  },
  YESHIVA_ONLY_POST_HS: {
    label: dict.YESHIVA_ONLY_POST_HS,
    shortLabel: 'תורני',
    icon: BookOpen,
    color: 'text-amber-600',
  },
  PRE_MILITARY_ACADEMY_AND_SERVICE: {
    label: dict.PRE_MILITARY_ACADEMY_AND_SERVICE,
    shortLabel: 'מכינה',
    icon: GraduationCap,
    color: 'text-green-600',
  },
  EXEMPTED: {
    label: dict.EXEMPTED,
    shortLabel: 'פטור',
    icon: Shield,
    color: 'text-gray-600',
  },
  CIVILIAN_SERVICE: {
    label: dict.CIVILIAN_SERVICE,
    shortLabel: 'אזרחי',
    icon: Users2,
    color: 'text-teal-600',
  },
  OTHER: {
    label: dict.OTHER,
    shortLabel: 'ייחודי',
    icon: Sparkles,
    color: 'text-purple-600',
  },
});

const createHeadCoveringMap = (
  dict: ProfileCardDict['options']['headCovering']
) => ({
  FULL_COVERAGE: {
    label: dict.FULL_COVERAGE,
    shortLabel: 'מלא',
    icon: Crown,
    color: 'text-purple-600',
  },
  PARTIAL_COVERAGE: {
    label: dict.PARTIAL_COVERAGE,
    shortLabel: 'חלקי',
    icon: Flower,
    color: 'text-pink-600',
  },
  HAT_BERET: {
    label: dict.HAT_BERET,
    shortLabel: 'כובע',
    icon: Sun,
    color: 'text-orange-600',
  },
  SCARF_ONLY_SOMETIMES: {
    label: dict.SCARF_ONLY_SOMETIMES,
    shortLabel: 'לאירועים',
    icon: Sparkle,
    color: 'text-rose-600',
  },
  NONE: {
    label: dict.NONE,
    shortLabel: 'ללא',
    icon: Wind,
    color: 'text-blue-600',
  },
  any: {
    label: 'גמיש/ה',
    shortLabel: 'גמיש',
    icon: Rainbow,
    color: 'text-indigo-600',
  },
});

const createKippahTypeMap = (
  dict: ProfileCardDict['options']['kippahType']
) => ({
  BLACK_VELVET: {
    label: dict.BLACK_VELVET,
    shortLabel: 'קטיפה',
    icon: Crown,
    color: 'text-indigo-700',
  },
  KNITTED_SMALL: {
    label: dict.KNITTED_SMALL,
    shortLabel: 'סרוגה קטנה',
    icon: Star,
    color: 'text-blue-600',
  },
  KNITTED_LARGE: {
    label: dict.KNITTED_LARGE,
    shortLabel: 'סרוגה גדולה',
    icon: Stars,
    color: 'text-blue-700',
  },
  CLOTH: {
    label: dict.CLOTH,
    shortLabel: 'בד',
    icon: Flower,
    color: 'text-green-600',
  },
  BRESLEV: {
    label: dict.BRESLEV,
    shortLabel: 'ברסלב',
    icon: Sparkle,
    color: 'text-purple-600',
  },
  NONE_AT_WORK_OR_CASUAL: {
    label: dict.NONE_AT_WORK_OR_CASUAL,
    shortLabel: 'לא בעבודה',
    icon: Briefcase,
    color: 'text-gray-600',
  },
  NONE_USUALLY: {
    label: dict.NONE_USUALLY,
    shortLabel: 'לרוב לא',
    icon: Wind,
    color: 'text-gray-500',
  },
  OTHER: {
    label: dict.OTHER,
    shortLabel: 'ייחודי',
    icon: Rainbow,
    color: 'text-pink-600',
  },
  any: {
    label: 'גמיש',
    shortLabel: 'גמיש',
    icon: Globe,
    color: 'text-teal-600',
  },
});

const createCharacterTraitMap = (
  dict: ProfileCardDict['options']['traits']
) => ({
  empathetic: {
    label: dict.empathetic,
    shortLabel: 'אמפתי',
    icon: Heart,
    color: 'text-rose-600',
  },
  driven: {
    label: dict.driven,
    shortLabel: 'שאפתן',
    icon: Zap,
    color: 'text-orange-600',
  },
  optimistic: {
    label: dict.optimistic,
    shortLabel: 'אופטימי',
    icon: Sunrise,
    color: 'text-yellow-600',
  },
  family_oriented: {
    label: dict.family_oriented,
    shortLabel: 'משפחתי',
    icon: Users2,
    color: 'text-pink-600',
  },
  intellectual: {
    label: dict.intellectual,
    shortLabel: 'אינטלקטואל',
    icon: BookOpen,
    color: 'text-indigo-600',
  },
  organized: {
    label: dict.organized,
    shortLabel: 'מאורגן',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  calm: {
    label: dict.calm,
    shortLabel: 'רגוע',
    icon: Waves,
    color: 'text-blue-600',
  },
  humorous: {
    label: dict.humorous,
    shortLabel: 'מצחיק',
    icon: Smile,
    color: 'text-purple-600',
  },
  sociable: {
    label: dict.sociable,
    shortLabel: 'חברותי',
    icon: Users,
    color: 'text-cyan-600',
  },
  sensitive: {
    label: dict.sensitive,
    shortLabel: 'רגיש',
    icon: Flower,
    color: 'text-pink-600',
  },
  independent: {
    label: dict.independent,
    shortLabel: 'עצמאי',
    icon: Crown,
    color: 'text-amber-600',
  },
  creative: {
    label: dict.creative,
    shortLabel: 'יצירתי',
    icon: Palette,
    color: 'text-rose-600',
  },
  honest: {
    label: dict.honest,
    shortLabel: 'כן וישר',
    icon: Star,
    color: 'text-blue-600',
  },
  responsible: {
    label: dict.responsible,
    shortLabel: 'אחראי',
    icon: Award,
    color: 'text-green-600',
  },
  easy_going: {
    label: dict.easy_going,
    shortLabel: 'זורם',
    icon: Wind,
    color: 'text-teal-600',
  },
  no_strong_preference: {
    label: 'פתוח/ה לגילוי',
    shortLabel: 'פתוח',
    icon: Compass,
    color: 'text-gray-600',
  },
});

const createHobbiesMap = (dict: ProfileCardDict['options']['hobbies']) => ({
  travel: {
    label: dict.travel,
    shortLabel: 'טיולים',
    icon: Compass,
    color: 'text-green-600',
  },
  sports: {
    label: dict.sports,
    shortLabel: 'ספורט',
    icon: Zap,
    color: 'text-orange-600',
  },
  reading: {
    label: dict.reading,
    shortLabel: 'קריאה',
    icon: BookOpen,
    color: 'text-indigo-600',
  },
  cooking_baking: {
    label: dict.cooking_baking,
    shortLabel: 'בישול',
    icon: Coffee,
    color: 'text-amber-600',
  },
  music_playing_instrument: {
    label: dict.music_playing_instrument,
    shortLabel: 'מוזיקה',
    icon: Music,
    color: 'text-purple-600',
  },
  art_crafts: {
    label: dict.art_crafts,
    shortLabel: 'אומנות',
    icon: Palette,
    color: 'text-pink-600',
  },
  volunteering: {
    label: dict.volunteering,
    shortLabel: 'התנדבות',
    icon: Heart,
    color: 'text-rose-600',
  },
  learning_courses: {
    label: dict.learning_courses,
    shortLabel: 'למידה',
    icon: GraduationCap,
    color: 'text-blue-600',
  },
  board_games_puzzles: {
    label: dict.board_games_puzzles,
    shortLabel: 'משחקים',
    icon: Play,
    color: 'text-cyan-600',
  },
  movies_theater: {
    label: dict.movies_theater,
    shortLabel: 'סרטים',
    icon: Camera,
    color: 'text-red-600',
  },
  dancing: {
    label: dict.dancing,
    shortLabel: 'ריקוד',
    icon: Sparkle,
    color: 'text-pink-600',
  },
  writing: {
    label: dict.writing,
    shortLabel: 'כתיבה',
    icon: Edit3,
    color: 'text-gray-600',
  },
  nature_hiking: {
    label: dict.nature_hiking,
    shortLabel: 'טבע',
    icon: TreePine,
    color: 'text-green-600',
  },
  photography: {
    label: dict.photography,
    shortLabel: 'צילום',
    icon: Camera,
    color: 'text-blue-600',
  },
  no_strong_preference: {
    label: 'פתוח/ה לגילוי יחד',
    shortLabel: 'פתוח',
    icon: Rainbow,
    color: 'text-gray-600',
  },
});

const createContactPreferenceMap = () => ({
  direct: {
    label: 'ישירות',
    shortLabel: 'ישירות',
    icon: PhoneIcon,
    color: 'text-green-600',
  },
  matchmaker: {
    label: 'דרך השדכן/ית',
    shortLabel: 'דרך שדכן',
    icon: Users,
    color: 'text-purple-600',
  },
  both: {
    label: 'גמיש/ה',
    shortLabel: 'גמיש',
    icon: MessageSquare,
    color: 'text-blue-600',
  },
});

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
  shortText?: string;
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

const SPACING = {
  xs: 'gap-1 sm:gap-1.5',
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-5',
} as const;

const getGradientClasses = (gradient: string, isMobile: boolean = false) => {
  const baseGradient = `bg-gradient-to-r ${gradient}`;
  const hoverGradient = gradient
    .replace('from-', 'hover:from-')
    .replace('to-', 'hover:to-');

  return cn(
    baseGradient,
    !isMobile && hoverGradient,
    'transition-all duration-300'
  );
};

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

// --- Enhanced Helper Functions with Responsive Support ---

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
  placeholder: string,
  useMobile: boolean = false
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

const formatAvailabilityStatus = (
  status: UserProfile['availabilityStatus'] | undefined,
  THEME: ThemeType,
  dict: ProfileCardDisplayDict['availability'] & { mysterious: string },
  badgeDict: ProfileCardDisplayDict['header']['availabilityBadge']
) => {
  const statusMap = {
    AVAILABLE: {
      text: dict.AVAILABLE,
      shortText: badgeDict.available_short,
      gradient: THEME.colors.primary.main,
      gradientSm: THEME.colors.primary.mainSm,
      icon: Heart,
      pulse: false,
      bgColor: `bg-gradient-to-r ${THEME.colors.primary.main}`,
      bgColorSm: `bg-gradient-to-r ${THEME.colors.primary.mainSm}`,
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    UNAVAILABLE: {
      text: dict.UNAVAILABLE,
      shortText: badgeDict.unavailable_short,
      gradient: 'from-gray-400 to-gray-500',
      gradientSm: 'from-gray-300 to-gray-400',
      icon: Clock,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
      bgColorSm: 'bg-gradient-to-r from-gray-300 to-gray-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    DATING: {
      text: dict.DATING,
      shortText: badgeDict.dating_short,
      gradient: THEME.colors.primary.accent,
      gradientSm: THEME.colors.primary.accentSm,
      icon: Coffee,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      bgColorSm: 'bg-gradient-to-r from-amber-400 to-orange-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    PAUSED: {
      text: dict.PAUSED,
      shortText: badgeDict.paused_short,
      gradient: THEME.colors.secondary.sky,
      gradientSm: THEME.colors.secondary.skySm,
      icon: Moon,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      bgColorSm: 'bg-gradient-to-r from-blue-400 to-cyan-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    ENGAGED: {
      text: dict.ENGAGED,
      shortText: badgeDict.engaged_short,
      gradient: THEME.colors.primary.light,
      gradientSm: THEME.colors.primary.lightSm,
      icon: Star,
      pulse: false,
      bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
      bgColorSm: 'bg-gradient-to-r from-pink-400 to-rose-400',
      mobileClasses: 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2',
    },
    MARRIED: {
      text: dict.MARRIED,
      shortText: badgeDict.married_short,
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
      text: dict.mysterious,
      shortText: badgeDict.mysterious_short,
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

const formatBooleanPreference = (
  value: boolean | null | undefined,
  dict: ProfileCardDisplayDict['booleanPrefs'] & { willDiscover: string },
  useYesShomer: boolean = false,
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  const yesLabel = useYesShomer ? dict.shomerYes : dict.yes;
  const noLabel = dict.no;
  const notSpecifiedLabel = dict.willDiscover;

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

const formatStringBooleanPreference = (
  value: string | null | undefined,
  dict: ProfileCardDisplayDict['stringBooleanPrefs'] & { willDiscover: string },
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  const options: {
    [key: string]: {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      color: string;
    };
  } = {
    yes: {
      label: dict.yes,
      shortLabel: dict.yes,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    no: { label: dict.no, shortLabel: dict.no, icon: X, color: 'text-red-500' },
    flexible: {
      label: dict.flexible,
      shortLabel: dict.flexible,
      icon: Rainbow,
      color: 'text-indigo-600',
    },
  };

  const notSpecifiedLabel = {
    label: dict.willDiscover,
    shortLabel: 'נגלה',
    icon: Telescope,
    color: 'text-gray-500',
  };

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

// 1. DetailItem
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
  textAlign?: 'center' | 'right' | 'left' | 'start' | 'end';
  responsive?: boolean;
  useMobileLayout?: boolean;
  placeholder: string;
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
  placeholder,
}) => {
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
  const textAlignClass = `text-${textAlign}`;

  const content = (
    <div
      className={cn(
        'flex rounded-xl transition-all duration-300',
        'min-w-0 w-full max-w-full overflow-hidden',
        useMobileLayout
          ? 'flex-col items-center text-center gap-2 sm:gap-3'
          : 'items-start',
        currentSize.container,
        currentVariant.card,
        responsive && 'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      <div
        className={cn(
          'flex-1 overflow-hidden',
          useMobileLayout ? 'text-center w-full' : 'min-w-0'
        )}
      >
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
              aria-hidden="true"
              className={cn(
                currentSize.icon,
                currentVariant.iconColor,
                'transition-all duration-300'
              )}
            />
          </div>
        </div>
        <p
          className={cn(
            'font-semibold mb-1 tracking-wide leading-tight',
            textAlignClass,
            currentSize.label,
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            variant === 'highlight' || variant === 'elegant'
              ? 'text-rose-700 sm:text-gray-700'
              : 'text-gray-600 sm:text-gray-700',
            useMobileLayout && 'px-1'
          )}
        >
          {label}
        </p>
        <div
          className={cn(
            'font-medium leading-relaxed',
            textAlignClass,
            currentSize.value,
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            'max-w-full overflow-hidden',
            variant === 'highlight' || variant === 'elegant'
              ? 'text-gray-800 sm:text-gray-900'
              : 'text-gray-700 sm:text-gray-800',
            useMobileLayout && 'px-1',
            valueClassName
          )}
        >
          {value || (
            <span className="text-gray-400 italic text-xs sm:text-sm">
              {placeholder}
            </span>
          )}
        </div>
      </div>
    </div>
  );

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

// 2. EmptyState
const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  variant?: 'mystery' | 'adventure' | 'discovery' | 'romantic';
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  THEME?: ThemeType;
}> = ({
  icon: Icon,
  title,
  description,
  className,
  action,
  variant = 'discovery',
  size = 'md',
  compact = false,
  THEME,
}) => {
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

  const variants = useMemo(() => {
    const baseVariants = {
      mystery: {
        bg: `bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100`,
        bgSm: `bg-gradient-to-br from-purple-25 via-violet-25 to-purple-50`,
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

    if (THEME) {
      return {
        ...baseVariants,
        discovery: {
          bg: `bg-gradient-to-br ${THEME.colors.neutral.warm}`,
          bgSm: `bg-gradient-to-br ${THEME.colors.neutral.warmSm}`,
          border: 'border-gray-200 hover:border-gray-300',
          iconBg: `bg-gradient-to-r ${THEME.colors.primary.main}`,
          iconBgSm: `bg-gradient-to-r ${THEME.colors.primary.mainSm}`,
          textColor: 'text-gray-700 sm:text-gray-800',
          titleColor: 'text-gray-800 sm:text-gray-900',
        },
        romantic: {
          ...baseVariants.romantic,
          iconBg: `bg-gradient-to-r ${THEME.colors.primary.romantic}`,
          iconBgSm: `bg-gradient-to-r ${THEME.colors.primary.romanticSm}`,
        },
      };
    }
    return baseVariants;
  }, [THEME]);

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed transition-all duration-300',
        currentSize.container,
        currentVariant.bg,
        'sm:' + currentVariant.bgSm,
        currentVariant.border,
        'shadow-sm hover:shadow-md',
        'max-w-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
          currentSize.iconContainer,
          currentSize.spacing,
          currentVariant.iconBg,
          THEME
            ? `${THEME.shadows.warm} hover:${THEME.shadows.elegant}`
            : 'shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl'
        )}
      >
        <Icon
          className={cn(
            currentSize.icon,
            'text-white transition-all duration-300'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-bold leading-tight',
          currentSize.title,
          currentVariant.titleColor,
          currentSize.spacing,
          'break-words hyphens-auto word-break-break-word max-w-full px-2'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'leading-relaxed max-w-xs mx-auto',
            currentSize.description,
            currentVariant.textColor,
            action ? 'mb-4 sm:mb-6' : '',
            'break-words hyphens-auto word-break-break-word px-2'
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full">
          {action}
        </div>
      )}
    </div>
  );
};

// 3. SectionCard
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
  collapsible?: boolean;
  compact?: boolean;
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
  // --- START MODIFICATION ---
  // If a gradient is provided for elegant or romantic variants, use it for the icon background.
  const iconBgClass =
    (variant === 'elegant' ||
      variant === 'romantic' ||
      variant === 'highlight') &&
    gradient
      ? `bg-gradient-to-r ${gradient} text-white shadow-md`
      : currentVariant.iconBg;
  // --- END MODIFICATION ---

  return (
    <div
      className={cn(
        'border overflow-hidden flex flex-col transition-all duration-300',
        currentSize.card,
        currentVariant.card,
        'max-w-full min-w-0',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b transition-all duration-300',
          currentSize.header,
          'gap-2',
          currentVariant.header,
          'sm:' + currentVariant.headerSm,
          'min-w-0 overflow-hidden',
          headerClassName
        )}
      >
        <div
          className={cn('flex items-center min-w-0 flex-1', 'gap-1 sm:gap-2')}
        >
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 rounded-lg transition-all duration-300',
                currentSize.iconPadding,
                iconBgClass, // Use the dynamic icon class here
                'hover:scale-110 active:scale-95'
              )}
            >
              <Icon
                className={cn(currentSize.icon, currentVariant.iconColor)}
              />
            </div>
          )}
          <div className="min-w-0 flex-1 overflow-hidden text-center">
            <h3
              className={cn(
                'font-bold leading-tight transition-all duration-300 text-center',
                currentSize.title,
                variant === 'default'
                  ? 'text-gray-800 hover:text-gray-900'
                  : 'text-gray-800',
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
                  'text-gray-600 text-center mx-auto',
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere max-w-full'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          currentSize.content,
          collapsible &&
            isCollapsed &&
            'max-h-0 p-0 md:max-h-none md:p-4 md:sm:p-5 md:md:p-6',
          'min-w-0 max-w-full',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

// 4. ColorPaletteSelector
const ColorPaletteSelector: React.FC<{
  selectedPalette: ColorPaletteName;
  onPaletteChange: (palette: ColorPaletteName) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['colorPalette'];
  compact?: boolean;
  direction: 'ltr' | 'rtl';
}> = ({
  selectedPalette,
  onPaletteChange,
  THEME,
  dict,
  compact = false,
  direction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        id="color-palette-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        variant="ghost"
        size="icon"
        className={cn(
          'bg-white/90 backdrop-blur-sm rounded-full border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300',
          'text-gray-600 hover:text-gray-800 hover:bg-white/95',
          compact
            ? 'w-8 h-8 min-h-[44px] min-w-[44px]'
            : 'w-10 h-10 min-h-[44px] min-w-[44px]',
          'touch-manipulation',
          'active:scale-95 transition-transform' // הוסף
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={dict.selectLabel}
      >
        <Palette
          className={cn(
            compact ? 'w-4 h-4' : 'w-5 h-5',
            'transition-all duration-300'
          )}
        />
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            aria-labelledby="color-palette-button"
            className={cn(
              'absolute top-full mt-2 z-50',
              direction === 'rtl' ? 'right-0' : 'right-0',
              'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-xl',
              'min-w-[160px] py-2',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
            dir={direction}
          >
            {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
              <button
                key={key}
                role="menuitem"
                onClick={() => {
                  onPaletteChange(key as ColorPaletteName);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-start transition-all duration-200',
                  'hover:bg-gray-100/80 active:bg-gray-200/50',
                  'flex items-center gap-3 min-h-[44px]',
                  selectedPalette === key && 'bg-gray-100/60 font-semibold'
                )}
              >
                <div
                  aria-hidden="true"
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
                  {dict.palettes[key as keyof typeof dict.palettes]}
                </span>
                {selectedPalette === key && (
                  <>
                    <span className="sr-only">{dict.selected}</span>
                    <CheckCircle
                      aria-hidden="true"
                      className="w-4 h-4 text-green-600 ms-auto"
                    />
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
  dict: ProfileCardDict;
  locale: string;
}

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
  dict: ProfileCardDisplayDict;
  compact?: boolean;
  characterTraitMap: ReturnType<typeof createCharacterTraitMap>;
  hobbiesMap: ReturnType<typeof createHobbiesMap>;
  religiousLevelMap: ReturnType<typeof createReligiousLevelMap>;
  educationLevelMap: ReturnType<typeof createEducationLevelMap>;
  locale: string;
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
  dict,
  compact = false,
  characterTraitMap,
  hobbiesMap,
  religiousLevelMap,
  educationLevelMap,
  locale,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';
  console.log(
    `ProfileCard Loaded - Locale: ${locale}, Direction: ${direction}`
  );

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
    characterTraitMap,
    hobbiesMap,
  ]);

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          THEME.colors.neutral.warm
        )}
      >
        <div
          className={cn(
            'absolute bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-xl sm:blur-2xl animate-pulse',
            compact
              ? 'top-2 end-2 w-8 h-8 sm:w-16 sm:h-16'
              : 'top-4 end-4 sm:top-10 sm:end-10 w-16 h-16 sm:w-32 sm:h-32'
          )}
        ></div>
        <div
          className={cn(
            'absolute bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-lg sm:blur-xl animate-pulse',
            compact
              ? 'bottom-2 start-2 w-6 h-6 sm:w-12 sm:h-12'
              : 'bottom-4 start-4 sm:bottom-10 sm:start-10 w-12 h-12 sm:w-24 sm:h-24'
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
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'relative rounded-full overflow-hidden border-2 sm:border-4 border-white shadow-lg sm:shadow-2xl ring-2 sm:ring-4 ring-rose-200/50 transition-all duration-300 hover:scale-105',
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
                  alt={dict.header.profileImageAlt.replace(
                    '{{name}}',
                    `${profile.user?.firstName || ''} ${profile.user?.lastName || ''}`.trim()
                  )}
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

            <div
              className={cn(
                'absolute transition-all duration-300',
                compact ? '-bottom-1 -end-1' : '-bottom-2 -end-2'
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
                    compact ? 'w-2 h-2 me-1' : 'w-3 h-3 me-1 sm:me-1.5'
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

          <div className="flex-1 min-w-0 flex flex-col justify-start items-start w-full">
            {!isMobile && onPaletteChange && (
              <div className="flex justify-end mb-2 sm:mb-3 w-full">
                <ColorPaletteSelector
                  selectedPalette={selectedPalette}
                  onPaletteChange={onPaletteChange}
                  THEME={THEME}
                  dict={dict.colorPalette}
                  compact={compact}
                  direction={direction}
                />
              </div>
            )}
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
                  compact
                    ? 'text-sm sm:text-base md:text-lg'
                    : isMobile
                      ? 'text-lg sm:text-xl md:text-2xl'
                      : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                  'text-center max-w-full overflow-hidden',
                  'px-1 sm:px-2',
                  `bg-gradient-to-r ${THEME.colors.primary.main} bg-clip-text text-transparent`,
                  `hover:bg-gradient-to-r hover:${THEME.colors.primary.accent} bg-clip-text`
                )}
              >
                {profile.user?.firstName
                  ? dict.header.storyOf.replace(
                      '{{name}}',
                      `${profile.user.firstName} ${profile.user.lastName || ''}`.trim()
                    )
                  : dict.placeholders.storyWaiting}
              </h1>

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
                    {dict.header.ageLabel.replace('{{age}}', age.toString())}
                  </span>
                </div>
              )}
            </div>
            {personalityHighlights.length > 0 && (
              <div
                className={cn(
                  'w-full overflow-hidden',
                  compact ? 'mt-2 mb-2' : 'mt-3 mb-4',
                  isMobile ? 'flex justify-center' : 'flex justify-start'
                )}
              >
                <ScrollArea className="w-full max-w-full" dir={direction}>
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
            <div
              className={cn(
                'w-full overflow-hidden',
                compact ? 'mt-2' : 'mt-4 sm:mt-6'
              )}
            >
              {isMobile ? (
                <div className="w-full max-w-full overflow-hidden px-1">
                  <ScrollArea className="w-full" dir={direction}>
                    <div
                      className={cn(
                        'flex gap-2 sm:gap-3 pb-2 px-1',
                        'justify-center min-w-max'
                      )}
                    >
                      {profile.occupation && (
                        <KeyFactCard
                          icon={Briefcase}
                          label={dict.keyFacts.occupation}
                          value={profile.occupation}
                          color="amber"
                          compact={compact}
                        />
                      )}
                      {(() => {
                        const religiousLevelData = profile.religiousLevel
                          ? formatEnumValue(
                              profile.religiousLevel,
                              religiousLevelMap,
                              '',
                              true
                            )
                          : null;
                        if (
                          religiousLevelData &&
                          religiousLevelData.shortLabel?.trim()
                        ) {
                          return (
                            <KeyFactCard
                              icon={BookMarked}
                              label={dict.keyFacts.outlook}
                              value={religiousLevelData.shortLabel}
                              color="purple"
                              compact={compact}
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {profile.city && (
                    <KeyFactCard
                      icon={MapPin}
                      label={dict.keyFacts.location}
                      value={profile.city}
                      color="rose"
                      compact={compact}
                    />
                  )}
                  {profile.occupation && (
                    <KeyFactCard
                      icon={Briefcase}
                      label={dict.keyFacts.occupation}
                      value={profile.occupation}
                      color="amber"
                      compact={compact}
                    />
                  )}
                  {(() => {
                    const religiousLevelData = profile.religiousLevel
                      ? formatEnumValue(
                          profile.religiousLevel,
                          religiousLevelMap,
                          ''
                        )
                      : null;
                    if (
                      religiousLevelData &&
                      religiousLevelData.label?.trim()
                    ) {
                      return (
                        <KeyFactCard
                          icon={BookMarked}
                          label={dict.keyFacts.outlook}
                          value={religiousLevelData.label}
                          color="purple"
                          compact={compact}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
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
                    `bg-gradient-to-r ${THEME.colors.primary.main} hover:${THEME.colors.primary.accent}`,
                    'text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95',
                    compact
                      ? 'px-4 py-2 text-sm'
                      : 'px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base',
                    'min-h-[44px]'
                  )}
                  onClick={onSuggestClick}
                >
                  <Heart
                    className={cn(
                      'flex-shrink-0',
                      compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5',
                      direction === 'rtl' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'
                    )}
                  />
                  <span className="break-words">
                    {compact
                      ? dict.header.suggestMatchButton
                      : dict.header.suggestPerfectMatchButton}
                  </span>
                  {direction === 'rtl' ? (
                    <ArrowLeft
                      className={cn(
                        'flex-shrink-0',
                        compact
                          ? 'w-4 h-4 mr-1'
                          : 'w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2'
                      )}
                    />
                  ) : (
                    <ArrowRight
                      className={cn(
                        'flex-shrink-0',
                        compact
                          ? 'w-4 h-4 ml-1'
                          : 'w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2'
                      )}
                    />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
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
                aria-hidden="true"
                className={cn(
                  'flex-shrink-0',
                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                )}
              />
              <p className="font-medium italic text-center break-words flex-shrink min-w-0">
                {dict.header.excitementQuote}
              </p>
              <Quote
                aria-hidden="true"
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
        'max-w-[calc((100vw-4rem)/3)]'
      )}
    >
      <Icon
        aria-hidden="true"
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

const MobileImageGallery: React.FC<{
  orderedImages: UserImageType[];
  profile: UserProfile;
  onImageClick: (image: UserImageType) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['gallery'];
  compact?: boolean;
  direction: 'ltr' | 'rtl';
}> = ({
  orderedImages,
  profile,
  onImageClick,
  THEME,
  dict,
  compact = false,
  direction,
}) => {
  if (orderedImages.length === 0) return null;

  return (
    <div
      className={cn(
        'overflow-hidden',
        compact ? 'px-2 pt-2 pb-2' : 'px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3',
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}
    >
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
            aria-label={dict.title || 'תמונות'}
            className={cn(
              'text-white',
              'flex-shrink-0',
              compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
            )}
          />
          <span className="break-words min-w-0">
            {dict.title.replace(
              '{{name}}',
              profile.user?.firstName || 'המועמד'
            )}
          </span>
        </h3>
        <p
          className={cn(
            'text-gray-600',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {dict.subtitle}
        </p>
      </div>
      <ScrollArea dir={direction} className="w-full overflow-hidden">
        <div
          className={cn(
            'flex pb-2 sm:pb-3',
            compact ? 'gap-2' : 'gap-2 sm:gap-3 md:gap-4',
            'justify-center min-w-full'
          )}
        >
          {orderedImages.map((image, idx) => (
            <button
              key={image.id}
              type="button"
              aria-label={dict.showImageAlt.replace(
                '{{index}}',
                (idx + 1).toString()
              )}
              className={cn(
                'relative flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500',
                orderedImages.length <= 3
                  ? compact
                    ? 'w-20 h-24 border-2'
                    : 'w-24 h-32 sm:w-28 sm:h-36 border-2 sm:border-3'
                  : compact
                    ? 'w-16 h-20 border-2'
                    : 'w-20 h-26 sm:w-22 sm:h-30 border-2 sm:border-3',
                'border-white shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl',
                'max-w-[calc((100vw-3rem)/5)]'
              )}
              onClick={() => onImageClick(image)}
            >
              <Image
                src={getRelativeCloudinaryPath(image.url)}
                alt={dict.imageAlt.replace('{{index}}', (idx + 1).toString())}
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {image.isMain && (
                <Badge
                  className={cn(
                    'absolute font-bold',
                    compact
                      ? 'top-0.5 end-0.5 text-xs px-1 py-0.5 gap-0.5'
                      : 'top-1 end-1 text-xs px-1.5 py-0.5 gap-1',
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
                  {!compact && <span>{dict.mainBadge}</span>}
                </Badge>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="mt-1" />
      </ScrollArea>
    </div>
  );
};

const ImageDialogComponent: React.FC<{
  selectedImageForDialog: UserImageType | null;
  currentDialogImageIndex: number;
  orderedImages: UserImageType[];
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onImageSelect: (image: UserImageType) => void;
  dict: ProfileCardDisplayDict['imageDialog'];
  THEME: ThemeType;
  direction: 'ltr' | 'rtl';
}> = ({
  selectedImageForDialog,
  currentDialogImageIndex,
  orderedImages,
  onClose,
  onNavigate,
  onImageSelect,
  dict,
  THEME,
  direction,
}) => {
  if (!selectedImageForDialog) return null;
  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

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
        dir={direction}
      >
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
              {dict.title
                .replace(
                  '{{current}}',
                  (currentDialogImageIndex + 1).toString()
                )
                .replace('{{total}}', orderedImages.length.toString())}
            </span>
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={dict.closeLabel}
              className={cn(
                'text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all',
                'w-8 h-8 sm:w-10 sm:h-10 min-h-[44px] min-w-[44px]'
              )}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

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

          {orderedImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                aria-label={dict.prevLabel}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 rounded-full',
                  direction === 'rtl' ? 'right-4' : 'left-4',
                  `bg-gradient-to-r ${THEME.colors.primary.accent} hover:opacity-90 text-white border-0`,
                  'backdrop-blur-sm transition-all hover:scale-110 active:scale-95',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('prev')}
              >
                <PrevIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                aria-label={dict.nextLabel}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 rounded-full',
                  direction === 'rtl' ? 'left-4' : 'right-4',
                  `bg-gradient-to-r ${THEME.colors.primary.accent} hover:opacity-90 text-white border-0`,
                  'backdrop-blur-sm transition-all hover:scale-110 active:scale-95',
                  'w-12 h-12 sm:w-14 sm:h-14 min-h-[44px] min-w-[44px]'
                )}
                onClick={() => onNavigate('next')}
              >
                <NextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}
        </div>

        {orderedImages.length > 1 && (
          <DialogFooter className="border-t border-gray-700/50 bg-black/80 backdrop-blur-sm p-0">
            <ScrollArea dir={direction} className="w-full">
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
                    onClick={() => onImageSelect(img)}
                  >
                    <Image
                      src={getRelativeCloudinaryPath(img.url)}
                      alt={dict.thumbAlt}
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

const TabNavigationButtons: React.FC<{
  activeTab: string;
  tabItems: {
    value: string;
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
    gradient: string;
  }[];
  onTabChange: (newTab: string) => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict['mobileNav'];
  direction: 'ltr' | 'rtl';
}> = ({ activeTab, tabItems, onTabChange, THEME, dict, direction }) => {
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

  const baseButtonClasses =
    'flex-1 flex flex-col p-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const PrevIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'mt-8 pt-6 border-t border-gray-200/80 flex items-stretch justify-between gap-3 sm:gap-4 w-full',
        direction === 'rtl' && 'flex-row-reverse'
      )}
    >
      {' '}
      {prevTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-start text-start',
            'bg-white border border-gray-200/80 hover:border-gray-300',
            'focus-visible:ring-gray-400'
          )}
          onClick={() => onTabChange(prevTab.value)}
        >
          <div className="flex items-center gap-2">
            <PrevIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <p className="text-xs font-medium text-gray-500">{dict.previous}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <prevTab.icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <span className="text-base font-bold text-gray-800 text-start break-words min-w-0">
              {prevTab.label}
            </span>
          </div>
        </button>
      ) : (
        <div className="flex-1" />
      )}
      {nextTab ? (
        <button
          className={cn(
            baseButtonClasses,
            'items-end text-end',
            `bg-gradient-to-r ${THEME.colors.primary.main} hover:${THEME.colors.primary.accent}`,
            'text-white',
            'focus-visible:ring-rose-500' // TODO: Make this dynamic
          )}
          onClick={() => onTabChange(nextTab.value)}
        >
          <div className="flex items-center gap-2 justify-end">
            <p className="text-xs font-medium text-white/90">{dict.next}</p>
            <NextIcon className="w-6 h-6 text-white flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="text-base font-bold text-white text-end break-words min-w-0">
              {nextTab.label}
            </span>
            <nextTab.icon className="w-5 h-5 text-white flex-shrink-0" />
          </div>
        </button>
      ) : (
        <div className="flex-1" />
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
  dict,
  locale,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const useFormattedValue = (value: string, map: any, placeholder: string) => {
    return useMemo(
      () => formatEnumValue(value, map, placeholder),
      [value, map, placeholder]
    );
  };
  const contentScrollAreaRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(
    () => ({
      ...profileData,
      isProfileComplete,
    }),
    [profileData, isProfileComplete]
  );

  const displayDict = dict.display;

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

  const maritalStatusMap = useMemo(
    () => createMaritalStatusMap(dict.options.maritalStatus),
    [dict.options.maritalStatus]
  );
  const religiousLevelMap = useMemo(
    () => createReligiousLevelMap(dict.options.religiousLevel),
    [dict.options.religiousLevel]
  );
  const religiousJourneyMap = useMemo(
    () => createReligiousJourneyMap(dict.options.religiousJourney),
    [dict.options.religiousJourney]
  );
  const educationLevelMap = useMemo(
    () => createEducationLevelMap(dict.options.educationLevel),
    [dict.options.educationLevel]
  );
  const serviceTypeMap = useMemo(
    () =>
      createServiceTypeMap(
        dict.options.serviceType as Record<ServiceType, string>
      ),
    [dict.options.serviceType]
  );
  const headCoveringMap = useMemo(
    () =>
      createHeadCoveringMap(
        dict.options.headCovering as Record<HeadCoveringType, string>
      ),
    [dict.options.headCovering]
  );
  const kippahTypeMap = useMemo(
    () =>
      createKippahTypeMap(
        dict.options.kippahType as Record<KippahType, string>
      ),
    [dict.options.kippahType]
  );
  const contactPreferenceMap = useMemo(() => createContactPreferenceMap(), []);
  const characterTraitMap = useMemo(
    () => createCharacterTraitMap(dict.options.traits),
    [dict.options.traits]
  );
  const hobbiesMap = useMemo(
    () => createHobbiesMap(dict.options.hobbies),
    [dict.options.hobbies]
  );

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // החלף את הפונקציה הקיימת בזו
const handleTabChange = (newTab: string) => {
  if (activeTabRef.current === newTab) return;

  setActiveTab(newTab);

  // גלילה לראש הטאב
  requestAnimationFrame(() => {
    const scrollViewport = contentScrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    );
    if (scrollViewport) {
      scrollViewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
};

  const THEME = useMemo(
    () => COLOR_PALETTES[selectedPalette],
    [selectedPalette]
  );

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
        ...displayDict.content.worlds.values,
        shortLabel: displayDict.tabs.journey.shortLabel,
        icon: BookMarked,
        gradient: THEME.colors.primary.accent,
        accentColor: 'blue',
      },
      personality: {
        ...displayDict.content.worlds.personality,
        shortLabel: displayDict.tabs.essence.shortLabel,
        icon: Sparkles,
        gradient: THEME.colors.primary.light,
        accentColor: 'purple',
      },
      relationship: {
        ...displayDict.content.worlds.relationship,
        shortLabel: displayDict.tabs.vision.shortLabel,
        icon: Heart,
        gradient: THEME.colors.primary.main,
        accentColor: 'rose',
      },
      partner: {
        ...displayDict.content.worlds.partner,
        shortLabel: displayDict.tabs.connection.shortLabel,
        icon: Users,
        gradient: THEME.colors.secondary.sky,
        accentColor: 'blue',
      },
      religion: {
        ...displayDict.content.worlds.religion,
        shortLabel: displayDict.tabs.spirit.shortLabel,
        icon: Star,
        gradient: THEME.colors.secondary.peach,
        accentColor: 'amber',
      },
      general: {
        ...displayDict.content.worlds.general,
        shortLabel: 'עוד',
        icon: FileText,
        gradient: THEME.colors.secondary.lavender,
        accentColor: 'purple',
      },
    }),
    [THEME, displayDict]
  );

  const hasAnyPreferences = useMemo(() => {
    return (
      (profile.preferredMaritalStatuses &&
        profile.preferredMaritalStatuses.length > 0) ||
      (profile.preferredReligiousLevels &&
        profile.preferredReligiousLevels.length > 0) ||
      (profile.preferredReligiousJourneys &&
        profile.preferredReligiousJourneys.length > 0) ||
      (profile.preferredEducation && profile.preferredEducation.length > 0) ||
      (profile.preferredOccupations &&
        profile.preferredOccupations.length > 0) ||
      (profile.preferredLocations && profile.preferredLocations.length > 0) ||
      (profile.preferredCharacterTraits &&
        profile.preferredCharacterTraits.length > 0) ||
      (profile.preferredHobbies && profile.preferredHobbies.length > 0)
    );
  }, [profile]);
  const hasEducationAndCareerDetails = useMemo(() => {
    return (
      !!profile.educationLevel ||
      !!profile.education ||
      !!profile.occupation ||
      !!profile.serviceType ||
      !!profile.serviceDetails
    );
  }, [
    profile.educationLevel,
    profile.education,
    profile.occupation,
    profile.serviceType,
    profile.serviceDetails,
  ]);

  const hasFamilyBackgroundDetails = useMemo(() => {
    return (
      !!profile.parentStatus ||
      !!profile.fatherOccupation ||
      !!profile.motherOccupation ||
      (profile.siblings !== null && profile.siblings !== undefined) ||
      !!profile.position ||
      !!profile.aliyaCountry ||
      !!profile.aliyaYear
    );
  }, [
    profile.parentStatus,
    profile.fatherOccupation,
    profile.motherOccupation,
    profile.siblings,
    profile.position,
    profile.aliyaCountry,
    profile.aliyaYear,
  ]);
  const hasUniqueTraitsOrHobbies = useMemo(() => {
    return (
      (profile.profileCharacterTraits &&
        profile.profileCharacterTraits.length > 0) ||
      (profile.profileHobbies && profile.profileHobbies.length > 0)
    );
  }, [profile.profileCharacterTraits, profile.profileHobbies]);

  const hasJudaismConnectionDetails = useMemo(() => {
    return (
      !!profile.religiousLevel ||
      !!profile.religiousJourney ||
      (profile.shomerNegiah !== null && profile.shomerNegiah !== undefined) ||
      (profile.gender === 'FEMALE' && !!profile.headCovering) ||
      (profile.gender === 'MALE' && !!profile.kippahType)
    );
  }, [
    profile.religiousLevel,
    profile.religiousJourney,
    profile.shomerNegiah,
    profile.gender,
    profile.headCovering,
    profile.kippahType,
  ]);

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
    () =>
      formatAvailabilityStatus(
        profile.availabilityStatus,
        THEME,
        {
          ...displayDict.availability,
          mysterious: displayDict.placeholders.mysterious,
        },
        displayDict.header.availabilityBadge
      ),
    [profile.availabilityStatus, THEME, displayDict]
  );

  // Helper function to check if an answer has actual content
  const isRawValueAnswered = (value: FormattedAnswer['rawValue']): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      return false;
    return true;
  };

  // הקוד המתוקן
  const getVisibleAnswers = useCallback(
    (world: WorldId) => {
      // <-- שימוש בטיפוס המתוקן שלנו
      // ניגשים ישירות למפתח הנכון, ללא המרות מיותרות
      if (!questionnaire?.formattedAnswers?.[world]) return [];

      return questionnaire.formattedAnswers[world].filter((a) => {
        const hasContent = isRawValueAnswered(a.rawValue);
        if (!hasContent) return false;
        if (viewMode === 'matchmaker') return true;
        return a.isVisible !== false;
      });
    },
    [questionnaire, viewMode]
  );

  const personalityAnswers = useMemo(
    () => getVisibleAnswers('PERSONALITY'),
    [getVisibleAnswers]
  );
  const valuesAnswers = useMemo(
    () => getVisibleAnswers('VALUES'),
    [getVisibleAnswers]
  );
  const relationshipAnswers = useMemo(
    () => getVisibleAnswers('RELATIONSHIP'),
    [getVisibleAnswers]
  );
  const partnerAnswers = useMemo(
    () => getVisibleAnswers('PARTNER'),
    [getVisibleAnswers]
  );
  const religionAnswers = useMemo(
    () => getVisibleAnswers('RELIGION'),
    [getVisibleAnswers]
  );

  const hasDisplayableQuestionnaireAnswers = useMemo(
    () =>
      [
        ...personalityAnswers,
        ...valuesAnswers,
        ...relationshipAnswers,
        ...partnerAnswers,
        ...religionAnswers,
      ].length > 0,
    [
      personalityAnswers,
      valuesAnswers,
      relationshipAnswers,
      partnerAnswers,
      religionAnswers,
    ]
  );

  const currentDialogImageIndex = useMemo(
    () =>
      selectedImageForDialog
        ? orderedImages.findIndex((img) => img.id === selectedImageForDialog.id)
        : -1,
    [selectedImageForDialog, orderedImages]
  );

  const handleOpenImageDialog = (image: UserImageType) =>
    image.url && setSelectedImageForDialog(image);
  const handleCloseImageDialog = () => setSelectedImageForDialog(null);

  const handleDialogNav = (navDirection: 'next' | 'prev') => {
    if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
    const newIndex =
      (currentDialogImageIndex +
        (navDirection === 'next' ? 1 : -1) +
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

  const tabItems = useMemo(
    () =>
      [
        {
          value: 'essence',
          label: displayDict.tabs.essence.label,
          shortLabel: displayDict.tabs.essence.shortLabel,
          icon: Sparkles,
          gradient: THEME.colors.primary.light,
          hasContent:
            !!profile.profileHeadline ||
            !!profile.about ||
            (profile.isFriendsSectionVisible &&
              (profile.testimonials || []).filter(
                (t) => t.status === 'APPROVED'
              ).length > 0) || // <-- תוכן שהועבר
            personalityAnswers.length > 0 ||
            (profile.profileCharacterTraits &&
              profile.profileCharacterTraits.length > 0) ||
            (profile.profileHobbies && profile.profileHobbies.length > 0),
        },
        {
          value: 'journey',
          label: displayDict.tabs.journey.label,
          shortLabel: displayDict.tabs.journey.shortLabel,
          icon: Compass,
          gradient: THEME.colors.primary.accent,
          hasContent:
            valuesAnswers.length > 0 ||
            !!profile.educationLevel ||
            !!profile.occupation ||
            !!profile.serviceType ||
            !!profile.parentStatus,
        },
        {
          value: 'spirit',
          label: displayDict.tabs.spirit.label,
          shortLabel: displayDict.tabs.spirit.shortLabel,
          icon: Star,
          gradient: THEME.colors.secondary.peach,
          hasContent:
            religionAnswers.length > 0 ||
            !!profile.religiousLevel ||
            !!profile.religiousJourney ||
            !!profile.influentialRabbi, // <-- תוכן שהועבר
        },
        {
          value: 'vision',
          label: displayDict.tabs.vision.label,
          shortLabel: displayDict.tabs.vision.shortLabel,
          icon: Heart,
          gradient: THEME.colors.primary.main,
          hasContent:
            relationshipAnswers.length > 0 ||
            !!profile.matchingNotes?.trim() ||
            !!profile.inspiringCoupleStory?.trim(), // <-- תוכן שהועבר
        },
        {
          value: 'connection',
          label: displayDict.tabs.connection.label,
          shortLabel: displayDict.tabs.connection.shortLabel,
          icon: Target,
          gradient: THEME.colors.secondary.sky,
          hasContent: hasAnyPreferences || partnerAnswers.length > 0,
        },
        viewMode === 'matchmaker' && {
          value: 'professional',
          label: displayDict.tabs.professional.label,
          shortLabel: displayDict.tabs.professional.shortLabel,
          icon: Lock,
          gradient: THEME.colors.secondary.lavender,
          hasContent: true,
        },
      ].filter(Boolean) as {
        value: string;
        label: string;
        shortLabel?: string;
        icon: React.ElementType;
        gradient: string;
        hasContent: boolean;
      }[],
    [
      THEME,
      profile,
      hasAnyPreferences,
      viewMode,
      personalityAnswers,
      valuesAnswers,
      relationshipAnswers,
      partnerAnswers,
      religionAnswers,
      displayDict,
    ]
  );

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

  const QuestionnaireItem: React.FC<{
    answer: FormattedAnswer;
    worldName: string;
    worldColor?: string;
    worldGradient?: string;
    compact?: boolean;
    direction: 'ltr' | 'rtl';
  }> = ({
    answer,
    worldName,
    worldColor = 'rose',
    worldGradient,
    compact = false,
    direction,
  }) => {
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
              dir="auto"
              className={cn(
                'font-bold mb-2 sm:mb-3 text-gray-800 leading-relaxed',
                'flex items-center justify-between gap-2 text-start',
                compact ? 'text-sm' : 'text-sm sm:text-base'
              )}
            >
              <span className="flex-1 break-words ...">
                <span className="sr-only">
                  {displayDict.content.questionnaire.questionFromCategory.replace(
                    '{{worldName}}',
                    worldName
                  )}{' '}
                </span>
                {answer.question}
              </span>
              {answer.isVisible === false && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-shrink-0 flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs cursor-default">
                        <Lock className="w-3 h-3" />
                        <span>
                          {displayDict.content.questionnaire.confidential}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>
                        {displayDict.content.questionnaire.confidentialTooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h4>
            <div
              className={cn(
                'rounded-lg bg-white/60 overflow-hidden',
                compact ? 'p-3' : 'p-3 sm:p-4',
                direction === 'rtl'
                  ? `border-r-4 border-${worldColor}-400`
                  : `border-l-4 border-${worldColor}-400`
              )}
            >
              {answer.questionType === 'budgetAllocation' &&
              typeof answer.rawValue === 'object' &&
              answer.rawValue &&
              !Array.isArray(answer.rawValue) ? (
                // --- START: התיקון ---
                (() => {
                  // השרת מספק מחרוזת מתורגמת מראש ב-displayText.
                  // אנו מפרקים אותה בחזרה לאובייקט שהמפתחות שלו כבר מתורגמים.
                  const translatedData = answer.displayText.split(' | ').reduce(
                    (acc, item) => {
                      const parts = item.split(': ');
                      if (parts.length === 2) {
                        const label = parts[0].trim();
                        const value = parseInt(
                          parts[1].replace(/[^0-9]/g, ''),
                          10
                        );
                        if (label && !isNaN(value)) {
                          acc[label] = value;
                        }
                      }
                      return acc;
                    },
                    {} as Record<string, number>
                  );

                  return (
                    <BudgetDisplay
                      data={translatedData}
                      dict={dict.budgetDisplay}
                      locale={locale}
                    />
                  );
                })()
              ) : (
                // --- END: התיקון ---
                <p
                  className={cn(
                    'text-gray-700 leading-relaxed italic break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                    compact ? 'text-sm' : 'text-sm sm:text-base'
                  )}
                >
                  <Quote
                    className={cn(
                      'w-3 h-3 sm:w-4 sm:h-4 inline text-gray-400 flex-shrink-0',
                      direction === 'rtl' ? 'ml-1' : 'mr-1'
                    )}
                  />
                  {answer.displayText}
                  <Quote
                    className={cn(
                      'w-3 h-3 sm:w-4 sm:h-4 inline text-gray-400 transform rotate-180 flex-shrink-0',
                      direction === 'rtl' ? 'mr-1' : 'ml-1'
                    )}
                  />
                </p>
              )}
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
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const MainContentTabs: React.FC<{ isDesktop: boolean }> = ({ isDesktop }) => {
    const activeTabConfig = tabItems.find((tab) => tab.value === activeTab);

    // --- START: Refactored Logic for Content Slicing ---
    const getTabContent = (
      answers: FormattedAnswer[]
    ): {
      hookAnswer: FormattedAnswer | undefined;
      deeperAnswers: FormattedAnswer[];
    } => {
      if (!answers || answers.length === 0) {
        return { hookAnswer: undefined, deeperAnswers: [] };
      }
      return {
        hookAnswer: answers[0],
        deeperAnswers: answers.slice(1),
      };
    };

    const personalityContent = getTabContent(personalityAnswers);
    const valuesContent = getTabContent(valuesAnswers);
    const religionContent = getTabContent(religionAnswers);
    const relationshipContent = getTabContent(relationshipAnswers);
    const partnerContent = getTabContent(partnerAnswers);
    // --- END: Refactored Logic for Content Slicing ---

    return (
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full flex flex-col flex-1 min-h-0 max-w-full overflow-hidden"
      >
        <div
          className={cn(
            'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/50 overflow-hidden sticky top-0 z-20',
            'mb-3 sm:mb-4 md:mb-6 p-1 sm:p-2',
            THEME.shadows.elegant
          )}
        >
          <ScrollArea
            className="w-full max-w-full overflow-hidden"
            dir={direction}
          >
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
                    !tab.hasContent && 'opacity-50 cursor-not-allowed',
                    activeTab === tab.value &&
                      cn(
                        'font-bold text-white shadow-lg border-white/20',
                        `bg-gradient-to-r ${tab.gradient}`
                      )
                  )}
                  disabled={!tab.hasContent}
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
        <ScrollArea
          id="profile-card-tabs-content"
          className="flex-1 overflow-auto h-full max-w-full"
          ref={contentScrollAreaRef}
        >
          <div className="space-y-3 sm:space-y-4 md:space-y-6 p-1 sm:p-2 min-w-0 max-w-full">
            {!(activeTabConfig && activeTabConfig.hasContent) && (
              <EmptyState
                icon={Telescope}
                title={displayDict.content.emptyStateTitle}
                description={displayDict.content.emptyStateDescription}
                variant="discovery"
                THEME={THEME}
              />
            )}

            {/* Essence Tab - REFACTORED */}
            <TabsContent value="essence" className="mt-0 max-w-full min-w-0">
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {/* 1. משפט הפתיחה מופיע ראשון */}
                {profile.profileHeadline && (
                  <SectionCard
                    title={displayDict.content.openingSentence}
                    icon={Quote}
                    variant="elegant"
                    gradient={THEME.colors.primary.main}
                  >
                    <p className="text-center text-lg italic font-semibold text-gray-700">
                      &quot;{profile.profileHeadline}&quot;
                    </p>
                  </SectionCard>
                )}

                {/* 2. הסיפור האישי עם כותרת משופרת */}
                <SectionCard
                  title={dict.display.content.aboutMe.titleCard.replace(
                    '{{name}}',
                    profile.user?.firstName || ''
                  )}
                  icon={User}
                  variant="romantic"
                  gradient={THEME.colors.primary.romantic}
                >
                  <div className="relative p-4 bg-rose-50/30 rounded-lg border border-rose-200/50">
                    <Quote className="absolute top-2 right-2 w-6 h-6 text-rose-200" />
                    <p className="whitespace-pre-wrap text-gray-800 leading-relaxed italic px-4">
                      {profile.about}
                    </p>
                    <Quote className="absolute bottom-2 left-2 w-6 h-6 text-rose-200 transform rotate-180" />
                  </div>
                </SectionCard>

                {/* --- START OF CHANGE --- */}
                {/* 3. חלק ההמלצות מופיע כאן (עם תנאי הצגה) */}
                {profile.isFriendsSectionVisible &&
                  (profile.testimonials || []).filter(
                    (t) => t.status === 'APPROVED'
                  ).length > 0 && (
                    <SectionCard
                      title={displayDict.content.recommendationsTitle.replace(
                        '{{name}}',
                        profile.user?.firstName || ''
                      )}
                      subtitle={displayDict.content.recommendationsSubtitle}
                      icon={MessageSquareQuote}
                      variant="default"
                      gradient={THEME.colors.primary.light}
                    >
                      <FriendTestimonialsSection
                        profile={profile}
                        dict={displayDict}
                        THEME={THEME}
                        direction={direction}
                      />
                    </SectionCard>
                  )}
                {/* --- END OF CHANGE --- */}

                {/* 5. כל התשובות מעולם "אישיות" */}
                {personalityAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.deepDivePersonality}
                    subtitle={displayDict.content.moreAnswersPersonality}
                    icon={Telescope}
                    variant="elegant"
                    gradient={WORLDS.personality.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {personalityAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.personality.label}
                          worldColor={WORLDS.personality.accentColor}
                          worldGradient={WORLDS.personality.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-full min-w-0">
                  {profile.profileCharacterTraits &&
                    profile.profileCharacterTraits.length > 0 && (
                      <SectionCard
                        title={displayDict.content.whatMakesMeSpecial}
                        subtitle={displayDict.content.myTraits}
                        icon={Sparkles}
                        variant="elegant"
                        gradient={THEME.colors.primary.light}
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-3">
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
                                  THEME.shadows.soft
                                )}
                              >
                                <traitData.icon
                                  className={cn(
                                    'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                    traitData.color
                                  )}
                                />
                                <span>{traitData.label}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}
                  {profile.profileHobbies &&
                    profile.profileHobbies.length > 0 && (
                      <SectionCard
                        title={displayDict.content.whatFillsMySoul}
                        subtitle={displayDict.content.myHobbies}
                        icon={Heart}
                        variant="elegant"
                        gradient={THEME.colors.secondary.sage}
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-3">
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
                                  THEME.shadows.soft
                                )}
                              >
                                <hobbyData.icon
                                  className={cn(
                                    'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
                                    hobbyData.color
                                  )}
                                />
                                <span>{hobbyData.label}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </SectionCard>
                    )}
                </div>
                {personalityContent.deeperAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.deepDivePersonality}
                    subtitle={displayDict.content.moreAnswersPersonality}
                    icon={Telescope}
                    variant="elegant"
                    gradient={WORLDS.personality.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {personalityContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.personality.label}
                          worldColor={WORLDS.personality.accentColor}
                          worldGradient={WORLDS.personality.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="recommendations"
              className="mt-0 max-w-full min-w-0"
            >
              <SectionCard
                title={displayDict.content.recommendationsTitle.replace(
                  '{{name}}',
                  profile.user?.firstName || ''
                )}
                subtitle={displayDict.content.recommendationsSubtitle}
                icon={MessageSquareQuote}
                variant="default"
                gradient={THEME.colors.primary.light}
              >
                <FriendTestimonialsSection
                  profile={profile}
                  dict={displayDict}
                  THEME={THEME}
                  direction={direction}
                />
              </SectionCard>
            </TabsContent>
            <TabsContent value="deepDive" className="mt-0 max-w-full min-w-0">
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {profile.inspiringCoupleStory?.trim() && (
                  <SectionCard
                    title={displayDict.content.myRoleModelForRelationship}
                    subtitle={displayDict.content.theCoupleThatInspiresMe}
                    icon={Stars}
                    variant="elegant"
                    gradient={THEME.colors.primary.gold}
                  >
                    <div
                      className={cn(
                        'p-4 sm:p-6 rounded-2xl border border-amber-200',
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                      )}
                    >
                      <p className="text-amber-800 leading-relaxed italic">
                        &quot;{profile.inspiringCoupleStory}&quot;
                      </p>
                    </div>
                  </SectionCard>
                )}
                {profile.influentialRabbi && (
                  <SectionCard
                    title={dict.display.content.influentialRabbi.title}
                    icon={BookOpen}
                    variant="elegant"
                  >
                    <p className="italic text-gray-700">
                      &quot;{profile.influentialRabbi}&quot;
                    </p>
                  </SectionCard>
                )}
              </div>
            </TabsContent>
            {/* Journey Tab - REFACTORED */}
            <TabsContent
              value="journey"
              className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
            >
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {valuesContent.hookAnswer && (
                  <QuestionnaireItem
                    answer={valuesContent.hookAnswer}
                    worldName={WORLDS.values.label}
                    worldColor={WORLDS.values.accentColor}
                    worldGradient={WORLDS.values.gradient}
                    direction={direction}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {hasEducationAndCareerDetails && (
                    <SectionCard
                      title={displayDict.content.educationAndCareer}
                      subtitle={displayDict.content.academicAndProfessionalPath}
                      icon={GraduationCap}
                      variant="elegant"
                      gradient={THEME.colors.secondary.sky}
                    >
                      <div className="space-y-4 sm:space-y-5">
                        {profile.educationLevel && (
                          <DetailItem
                            icon={GraduationCap}
                            label={
                              displayDict.content.detailLabels.educationLevel
                            }
                            value={
                              formatEnumValue(
                                profile.educationLevel,
                                educationLevelMap,
                                ''
                              ).label
                            }
                            variant="highlight"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                        {profile.education && (
                          <DetailItem
                            icon={BookOpen}
                            label={
                              displayDict.content.detailLabels.educationDetails
                            }
                            value={profile.education}
                            variant="elegant"
                            valueClassName="whitespace-pre-wrap"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                        {profile.occupation && (
                          <DetailItem
                            icon={Briefcase}
                            label={
                              displayDict.content.detailLabels.professionalField
                            }
                            value={profile.occupation}
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                        {profile.serviceType && (
                          <DetailItem
                            icon={Award}
                            label={
                              displayDict.content.detailLabels.militaryService
                            }
                            value={
                              formatEnumValue(
                                profile.serviceType,
                                serviceTypeMap,
                                ''
                              ).label
                            }
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}

                        {profile.serviceDetails && (
                          <DetailItem
                            icon={InfoIcon}
                            label={
                              displayDict.content.detailLabels.serviceDetails
                            }
                            value={profile.serviceDetails}
                            variant="elegant"
                            valueClassName="whitespace-pre-wrap"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                      </div>
                    </SectionCard>
                  )}
                  {hasFamilyBackgroundDetails && (
                    <SectionCard
                      title={displayDict.content.familyAndCulturalBackground}
                      subtitle={displayDict.content.familyThatShapedMe}
                      icon={Users2}
                      variant="romantic"
                      gradient={THEME.colors.primary.accent}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {profile.parentStatus && (
                          <DetailItem
                            icon={Users2}
                            label={
                              displayDict.content.detailLabels.parentStatus
                            }
                            value={profile.parentStatus}
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                        {profile.fatherOccupation && (
                          <DetailItem
                            icon={Briefcase}
                            label={
                              displayDict.content.detailLabels.fatherOccupation
                            }
                            value={profile.fatherOccupation}
                            variant="elegant"
                            textAlign="start"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                        {profile.motherOccupation && (
                          <DetailItem
                            icon={Briefcase}
                            label={
                              displayDict.content.detailLabels.motherOccupation
                            }
                            value={profile.motherOccupation}
                            variant="elegant"
                            textAlign="start"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                        {profile.siblings !== null &&
                          profile.siblings !== undefined && (
                            <DetailItem
                              icon={Users}
                              label={displayDict.content.detailLabels.siblings}
                              value={`${profile.siblings} אחים/אחיות`}
                              variant="elegant"
                              textAlign="start"
                              placeholder=""
                            />
                          )}
                        {profile.position && (
                          <DetailItem
                            icon={Crown}
                            label={displayDict.content.detailLabels.birthOrder}
                            value={`מקום ${profile.position}`}
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                        {profile.aliyaCountry && (
                          <DetailItem
                            icon={Globe}
                            label={
                              displayDict.content.detailLabels.countryOfOrigin
                            }
                            value={`${profile.aliyaCountry} - השורשים שלי`}
                            variant="elegant"
                            textAlign="start"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                        {profile.aliyaYear && (
                          <DetailItem
                            icon={Calendar}
                            label={displayDict.content.detailLabels.aliyaYear}
                            value={`${profile.aliyaYear} - הגעתי הביתה`}
                            variant="elegant"
                            textAlign="start"
                            placeholder={displayDict.placeholders.willDiscover}
                          />
                        )}
                      </div>
                    </SectionCard>
                  )}
                </div>
                {valuesContent.deeperAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.valuesAndPrinciples}
                    subtitle={displayDict.content.answersOnWhatMatters}
                    icon={BookMarked}
                    variant="elegant"
                    gradient={WORLDS.values.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {valuesContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.values.label}
                          worldColor={WORLDS.values.accentColor}
                          worldGradient={WORLDS.values.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </div>
            </TabsContent>

            {/* Spirit Tab - NEW & REFACTORED */}
            <TabsContent
              value="spirit"
              className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
            >
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {religionContent.hookAnswer && (
                  <QuestionnaireItem
                    answer={religionContent.hookAnswer}
                    worldName={WORLDS.religion.label}
                    worldColor={WORLDS.religion.accentColor}
                    worldGradient={WORLDS.religion.gradient}
                    direction={direction}
                  />
                )}
                {hasJudaismConnectionDetails && (
                  <SectionCard
                    title={displayDict.content.myConnectionToJudaism}
                    subtitle={displayDict.content.faithAndTraditionInMyLife}
                    icon={BookMarked}
                    variant="elegant"
                    gradient={THEME.colors.primary.gold}
                  >
                    <div className="space-y-4 sm:space-y-5">
                      {(() => {
                        const religiousLevelData = profile.religiousLevel
                          ? formatEnumValue(
                              profile.religiousLevel,
                              religiousLevelMap,
                              ''
                            )
                          : null;
                        if (
                          religiousLevelData &&
                          religiousLevelData.label?.trim()
                        ) {
                          return (
                            <DetailItem
                              icon={BookMarked}
                              label="השקפת העולם שמנחה אותי"
                              value={religiousLevelData.label}
                              variant="highlight"
                              textAlign="start"
                              placeholder=""
                            />
                          );
                        }
                        return null;
                      })()}
                      {profile.religiousJourney && (
                        <DetailItem
                          icon={Compass}
                          label={
                            displayDict.content.detailLabels.religiousJourney
                          }
                          value={
                            formatEnumValue(
                              profile.religiousJourney,
                              religiousJourneyMap,
                              displayDict.placeholders.willDiscover
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.shomerNegiah !== null &&
                        profile.shomerNegiah !== undefined && (
                          <DetailItem
                            icon={Heart}
                            label={
                              displayDict.content.detailLabels.shomerNegiah
                            }
                            value={
                              formatBooleanPreference(
                                profile.shomerNegiah,
                                {
                                  ...displayDict.booleanPrefs,
                                  willDiscover: '',
                                },
                                true
                              ).label
                            }
                            variant="elegant"
                            textAlign="start"
                            placeholder=""
                          />
                        )}
                      {profile.gender === 'FEMALE' && profile.headCovering && (
                        <DetailItem
                          icon={Crown}
                          label={displayDict.content.detailLabels.headCovering}
                          value={
                            formatEnumValue(
                              profile.headCovering,
                              headCoveringMap,
                              displayDict.placeholders.willDiscover
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                      {profile.gender === 'MALE' && profile.kippahType && (
                        <DetailItem
                          icon={Crown}
                          label={displayDict.content.detailLabels.kippahType}
                          value={
                            formatEnumValue(
                              profile.kippahType,
                              kippahTypeMap,
                              displayDict.placeholders.willDiscover
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder={displayDict.placeholders.willDiscover}
                        />
                      )}
                    </div>
                  </SectionCard>
                )}
                {profile.influentialRabbi && (
                  <SectionCard
                    title={displayDict.content.inspiringSpiritualFigure}
                    icon={Lightbulb}
                    variant="elegant"
                    gradient={THEME.colors.primary.gold}
                  >
                    <div
                      className={cn(
                        'p-4 sm:p-6 rounded-2xl border border-amber-200',
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                      )}
                    >
                      <p className="text-amber-800 leading-relaxed italic">
                        &quot;{profile.influentialRabbi}&quot;
                      </p>
                    </div>
                  </SectionCard>
                )}

                {religionContent.deeperAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.myReligiousAndSpiritualWorld}
                    subtitle={displayDict.content.answersOnFaith}
                    icon={Star}
                    variant="elegant"
                    gradient={WORLDS.religion.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {religionContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.religion.label}
                          worldColor={WORLDS.religion.accentColor}
                          worldGradient={WORLDS.religion.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </div>
            </TabsContent>

            {/* Vision Tab - REFACTORED */}
            <TabsContent
              value="vision"
              className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
            >
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {relationshipContent.hookAnswer && (
                  <QuestionnaireItem
                    answer={relationshipContent.hookAnswer}
                    worldName={WORLDS.relationship.label}
                    worldColor={WORLDS.relationship.accentColor}
                    worldGradient={WORLDS.relationship.gradient}
                    direction={direction}
                  />
                )}
                {profile.matchingNotes && (
                  <SectionCard
                    title={displayDict.content.myDreamRelationship}
                    icon={Heart}
                    variant="romantic"
                    gradient={THEME.colors.primary.main}
                  >
                    <div
                      className={cn(
                        'p-4 sm:p-6 rounded-2xl border border-rose-200 max-w-full min-w-0 overflow-hidden',
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`,
                        THEME.shadows.soft
                      )}
                    >
                      <p className="text-rose-700 leading-relaxed whitespace-pre-wrap italic text-base sm:text-lg break-words hyphens-auto word-break-break-word overflow-wrap-anywhere">
                        <Quote
                          className={cn(
                            'w-4 h-4 sm:w-5 sm:h-5 inline text-rose-400 flex-shrink-0',
                            direction === 'rtl' ? 'ml-1' : 'mr-1'
                          )}
                        />
                        {profile.matchingNotes}
                        <Quote
                          className={cn(
                            'w-4 h-4 sm:w-5 sm:h-5 inline text-rose-400 transform rotate-180 flex-shrink-0',
                            direction === 'rtl' ? 'mr-1' : 'ml-1'
                          )}
                        />
                      </p>
                    </div>
                  </SectionCard>
                )}
                {profile.inspiringCoupleStory && (
                  <SectionCard
                    title={displayDict.content.myRoleModelForRelationship}
                    subtitle={displayDict.content.theCoupleThatInspiresMe}
                    icon={Stars}
                    variant="elegant"
                    gradient={THEME.colors.primary.gold}
                  >
                    <div
                      className={cn(
                        'p-4 sm:p-6 rounded-2xl border border-amber-200',
                        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
                      )}
                    >
                      <p className="text-amber-800 leading-relaxed italic">
                        &quot;{profile.inspiringCoupleStory}&quot;
                      </p>
                    </div>
                  </SectionCard>
                )}
                {relationshipContent.deeperAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.moreOnMyVision}
                    subtitle={displayDict.content.answersOnLoveAndFamily}
                    icon={Heart}
                    variant="romantic"
                    gradient={WORLDS.relationship.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {relationshipContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.relationship.label}
                          worldColor={WORLDS.relationship.accentColor}
                          worldGradient={WORLDS.relationship.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </div>
            </TabsContent>

            {/* Connection Tab - REFACTORED */}
            <TabsContent
              value="connection"
              className="mt-0 space-y-4 sm:space-y-6 max-w-full min-w-0"
            >
              <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
                {partnerContent.hookAnswer && (
                  <QuestionnaireItem
                    answer={partnerContent.hookAnswer}
                    worldName={WORLDS.partner.label}
                    worldColor={WORLDS.partner.accentColor}
                    worldGradient={WORLDS.partner.gradient}
                    direction={direction}
                  />
                )}
                {hasAnyPreferences ? (
                  <SectionCard
                    title={displayDict.content.matchingPreferences}
                    subtitle={displayDict.content.whatHelpsFindConnection}
                    icon={Filter}
                    variant="default"
                  >
                    <div className="space-y-6 sm:space-y-8">
                      {renderPreferenceBadges(
                        displayDict.content.maritalStatuses,
                        Heart,
                        profile.preferredMaritalStatuses,
                        maritalStatusMap,
                        THEME.colors.primary.main
                      )}
                      {renderPreferenceBadges(
                        displayDict.content.religiousLevels,
                        BookMarked,
                        profile.preferredReligiousLevels,
                        religiousLevelMap,
                        THEME.colors.secondary.peach
                      )}
                      {renderPreferenceBadges(
                        displayDict.content.partnerReligiousJourney,
                        Compass,
                        profile.preferredReligiousJourneys as string[],
                        religiousJourneyMap,
                        THEME.colors.secondary.sage
                      )}
                      {renderPreferenceBadges(
                        displayDict.content.educationLevels,
                        GraduationCap,
                        profile.preferredEducation,
                        educationLevelMap,
                        THEME.colors.secondary.sky
                      )}
                    </div>
                  </SectionCard>
                ) : (
                  !partnerContent.hookAnswer &&
                  partnerContent.deeperAnswers.length === 0 && (
                    <EmptyState
                      icon={Compass}
                      title={displayDict.content.emptyPrefsTitle}
                      description={displayDict.content.emptyPrefsDescription}
                      variant="discovery"
                      THEME={THEME}
                    />
                  )
                )}
                {partnerContent.deeperAnswers.length > 0 && (
                  <SectionCard
                    title={displayDict.content.howIVisionMyPartner}
                    subtitle={displayDict.content.moreAnswersAboutPartner}
                    icon={Target}
                    variant="elegant"
                    gradient={WORLDS.partner.gradient}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {partnerContent.deeperAnswers.map((answer) => (
                        <QuestionnaireItem
                          key={answer.questionId}
                          answer={answer}
                          worldName={WORLDS.partner.label}
                          worldColor={WORLDS.partner.accentColor}
                          worldGradient={WORLDS.partner.gradient}
                          direction={direction}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </div>
            </TabsContent>

            {/* Professional Tab */}
            {viewMode === 'matchmaker' && (
              <TabsContent
                value="professional"
                className="mt-0 max-w-full min-w-0"
              >
                <SectionCard
                  title={displayDict.content.confidentialInfo}
                  subtitle={displayDict.content.professionalDetails}
                  icon={Lock}
                  variant="elegant"
                  gradient={THEME.colors.primary.gold}
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.contactPreference && (
                        <DetailItem
                          icon={Phone}
                          label={
                            displayDict.content.professionalInfo
                              .contactPreference
                          }
                          value={
                            formatEnumValue(
                              profile.contactPreference,
                              contactPreferenceMap,
                              ''
                            ).label
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                      {profile.preferredMatchmakerGender && (
                        <DetailItem
                          icon={Users}
                          label={
                            displayDict.content.professionalInfo
                              .matchmakerGenderPref
                          }
                          value={
                            profile.preferredMatchmakerGender === 'MALE'
                              ? displayDict.content.professionalInfo
                                  .matchmakerMale
                              : displayDict.content.professionalInfo
                                  .matchmakerFemale
                          }
                          variant="elegant"
                          textAlign="start"
                          placeholder=""
                        />
                      )}
                    </div>
                    {profile.hasMedicalInfo && (
                      <DetailItem
                        icon={Heart}
                        label={displayDict.content.professionalInfo.medicalInfo}
                        value={
                          profile.isMedicalInfoVisible
                            ? displayDict.content.professionalInfo
                                .medicalInfoVisible
                            : displayDict.content.professionalInfo
                                .medicalInfoDiscreet
                        }
                        variant="elegant"
                        textAlign="start"
                        tooltip={profile.medicalInfoDetails || undefined}
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {displayDict.content.professionalInfo.profileCreated}{' '}
                          {profile.createdAt
                            ? new Date(profile.createdAt).toLocaleDateString(
                                locale
                              )
                            : displayDict.content.professionalInfo.unknown}
                        </span>
                      </div>
                      {profile.lastActive && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>
                            {displayDict.content.professionalInfo.lastActive}{' '}
                            {new Date(profile.lastActive).toLocaleDateString(
                              locale
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
                {!isDesktop && mobileViewLayout === 'detailed' && (
                  <TabNavigationButtons
                    activeTab={activeTab}
                    tabItems={tabItems}
                    onTabChange={handleTabChange}
                    THEME={THEME}
                    dict={displayDict.mobileNav}
                    direction={direction}
                  />
                )}
              </TabsContent>
            )}
            {isDesktop && (
              <TabNavigationButtons
                activeTab={activeTab}
                tabItems={tabItems}
                onTabChange={handleTabChange}
                THEME={THEME}
                dict={displayDict.mobileNav}
                direction={direction}
              />
            )}
          </div>
        </ScrollArea>
      </Tabs>
    );
  };

  const MobileHeader = () => (
    <div
      className={cn(
        'flex-shrink-0 flex justify-between items-center border-b border-rose-200/50 sticky top-0 z-30 backdrop-blur-md',
        'p-3 sm:p-4 min-h-[60px]',
        `bg-gradient-to-r ${THEME.colors.neutral.warm}`
      )}
      dir={direction}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-full transition-all duration-300 shadow-sm hover:shadow-md',
          'w-10 h-10 sm:w-12 sm:h-12 min-h-[44px] min-w-[44px] touch-manipulation'
        )}
        onClick={handleClose}
        aria-label={displayDict.mobileNav.closePreview}
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
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
            aria-label={displayDict.mobileNav.introView}
            className={cn(
              'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
              'data-[state=on]:bg-gradient-to-r data-[state=on]:from-rose-500 data-[state=on]:to-pink-500 data-[state=on]:text-white data-[state=on]:shadow-md'
            )}
          >
            <Heart className="h-3 h-3 sm:h-4 sm:w-4" />
            <span className="mx-1.5 sm:mx-2 text-xs sm:text-sm font-medium">
              {displayDict.mobileNav.introView}
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="detailed"
            aria-label={displayDict.mobileNav.detailedView}
            className={cn(
              'rounded-xl transition-all duration-300 min-h-[44px] px-3 sm:px-4 py-2 touch-manipulation',
              'data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-indigo-500 data-[state=on]:text-white data-[state=on]:shadow-md'
            )}
          >
            <FileText className="h-3 h-3 sm:h-4 sm:w-4" />
            <span className="mx-1.5 sm:mx-2 text-xs sm:text-sm font-medium">
              {displayDict.mobileNav.detailedView}
            </span>
          </ToggleGroupItem>
        </ToggleGroup>
        <ColorPaletteSelector
          selectedPalette={selectedPalette}
          onPaletteChange={setSelectedPalette}
          THEME={THEME}
          dict={displayDict.colorPalette}
          compact={true}
          direction={direction}
        />
      </div>
    </div>
  );

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
          dict={displayDict}
          compact={false}
          characterTraitMap={characterTraitMap}
          hobbiesMap={hobbiesMap}
          religiousLevelMap={religiousLevelMap}
          educationLevelMap={educationLevelMap}
          locale={locale}
        />
        <MobileImageGallery
          orderedImages={orderedImages}
          profile={profile}
          onImageClick={handleOpenImageDialog}
          THEME={THEME}
          dict={displayDict.gallery}
          compact={false}
          direction={direction}
        />
        <div
          className={cn(
            'p-3 sm:p-4 min-w-0 max-w-full overflow-hidden',
            `bg-gradient-to-br ${THEME.colors.neutral.cool}`
          )}
        >
          <MainContentTabs isDesktop={false} />
        </div>
      </div>
    </ScrollArea>
  );

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
            dict={displayDict}
            compact={true}
            characterTraitMap={characterTraitMap}
            hobbiesMap={hobbiesMap}
            religiousLevelMap={religiousLevelMap}
            educationLevelMap={educationLevelMap}
            locale={locale}
          />
          <MobileImageGallery
            orderedImages={orderedImages}
            profile={profile}
            onImageClick={handleOpenImageDialog}
            THEME={THEME}
            dict={displayDict.gallery}
            compact={true}
            direction={direction}
          />
          <div
            className={cn(
              'px-2 sm:px-3 py-2 space-y-3 sm:space-y-4 min-w-0 max-w-full overflow-hidden',
              `bg-gradient-to-br ${THEME.colors.neutral.warm}`
            )}
          >
            <NeshamaTechSummary
              profile={profile}
              dict={displayDict}
              THEME={THEME}
              direction={direction}
            />

            {profile.isAboutVisible && profile.about && (
              <SectionCard
                title={displayDict.content.focus.aboutMe}
                subtitle={displayDict.content.focus.myStory}
                icon={Heart}
                variant="romantic"
                gradient={THEME.colors.primary.main}
                compact={true}
              >
                <div className="p-3 text-start">
                  <p className="text-gray-800 leading-relaxed italic font-medium break-words line-clamp-4">
                    {profile.about}
                  </p>
                  <div className="text-center mt-3">
                    <Button
                      variant="link"
                      className={cn(
                        'font-bold',
                        THEME.colors.primary.main.includes('rose')
                          ? 'text-rose-600'
                          : THEME.colors.primary.main.includes('blue')
                            ? 'text-blue-600'
                            : THEME.colors.primary.main.includes('amber')
                              ? 'text-amber-600'
                              : 'text-gray-600'
                      )}
                      onClick={() => setMobileViewLayout('detailed')}
                    >
                      {dict.display.content.focus.readFullStory}{' '}
                      <ArrowLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </SectionCard>
            )}

            {profile.isFriendsSectionVisible &&
              (profile.testimonials || []).filter(
                (t) => t.status === 'APPROVED'
              ).length > 0 && (
                <SectionCard
                  title={dict.display.content.friendTestimonials.title.replace(
                    '{{name}}',
                    profile.user?.firstName || ''
                  )}
                  subtitle={dict.display.content.friendTestimonials.focusSubtitle.replace(
                    '{{count}}',
                    (profile.testimonials || [])
                      .filter((t) => t.status === 'APPROVED')
                      .length.toString()
                  )}
                  icon={MessageSquareQuote}
                  variant="default"
                  compact={true}
                >
                  <div className="text-center p-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileViewLayout('detailed');
                        setActiveTab('essence'); // Changed from 'recommendations' to 'essence' to ensure it goes to the right place
                      }}
                    >
                      {dict.display.content.friendTestimonials.viewButton}
                    </Button>
                  </div>
                </SectionCard>
              )}
            {/* --- END: VERIFY THIS CODE BLOCK --- */}

            {profile.about && (
              <SectionCard
                title={displayDict.content.focus.aboutMe}
                subtitle={displayDict.content.focus.myStory}
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
                    className="text-gray-800 leading-relaxed italic font-medium break-words hyphens-auto word-break-break-word overflow-wrap-anywhere text-start"
                    dir={direction}
                  >
                    <Quote
                      className={cn(
                        'w-3 h-3 sm:w-4 sm:h-4 inline text-rose-400 flex-shrink-0',
                        direction === 'rtl' ? 'ml-1' : 'mr-1'
                      )}
                    />
                    {profile.about}
                    <Quote
                      className={cn(
                        'w-3 h-3 sm:w-4 sm:h-4 inline text-rose-400 transform rotate-180 flex-shrink-0',
                        direction === 'rtl' ? 'mr-1' : 'ml-1'
                      )}
                    />
                  </p>
                </div>
              </SectionCard>
            )}
            <SectionCard
              title={displayDict.content.focus.quickSummary}
              subtitle={displayDict.content.focus.importantDetails}
              icon={Zap}
              variant="elegant"
              gradient={THEME.colors.primary.gold}
              compact={true}
              className="min-w-0 max-w-full"
            >
              <div className="grid grid-cols-1 gap-2 sm:gap-3 min-w-0 max-w-full">
                {(() => {
                  const religiousLevelData = profile.religiousLevel
                    ? formatEnumValue(
                        profile.religiousLevel,
                        religiousLevelMap,
                        displayDict.placeholders.willDiscover
                      )
                    : null;
                  if (
                    religiousLevelData &&
                    religiousLevelData.label?.trim() &&
                    religiousLevelData.label !==
                      displayDict.placeholders.willDiscover
                  ) {
                    return (
                      <DetailItem
                        icon={BookMarked}
                        label={dict.display.keyFacts.outlook}
                        value={religiousLevelData.label}
                        variant="highlight"
                        size="sm"
                        useMobileLayout={true}
                        textAlign="center"
                        placeholder={displayDict.placeholders.willDiscover}
                      />
                    );
                  }
                  return null;
                })()}
                {profile.shomerNegiah !== null &&
                  profile.shomerNegiah !== undefined && (
                    <DetailItem
                      icon={Heart}
                      label={displayDict.content.detailLabels.shomerNegiah}
                      value={
                        formatBooleanPreference(profile.shomerNegiah, {
                          ...displayDict.booleanPrefs,
                          willDiscover: displayDict.placeholders.willDiscover,
                        }).label
                      }
                      variant="elegant"
                      size="sm"
                      useMobileLayout={true}
                      placeholder={displayDict.placeholders.willDiscover}
                    />
                  )}
                {profile.occupation && (
                  <DetailItem
                    icon={Briefcase}
                    label={dict.display.keyFacts.occupation}
                    value={
                      profile.occupation ||
                      displayDict.placeholders.willDiscover
                    }
                    variant="elegant"
                    size="sm"
                    useMobileLayout={true}
                    placeholder={displayDict.placeholders.willDiscover}
                  />
                )}
                {profile.educationLevel && (
                  <DetailItem
                    icon={GraduationCap}
                    label={displayDict.content.detailLabels.educationLevel}
                    value={
                      formatEnumValue(
                        profile.educationLevel,
                        educationLevelMap,
                        displayDict.placeholders.willDiscover
                      ).label
                    }
                    variant="elegant"
                    size="sm"
                    useMobileLayout={true}
                    placeholder={displayDict.placeholders.willDiscover}
                  />
                )}
              </div>
            </SectionCard>
            {hasUniqueTraitsOrHobbies && (
              <SectionCard
                title={displayDict.content.focus.whatMakesMeUnique}
                subtitle={displayDict.content.focus.traitsAndHobbies}
                icon={Sparkles}
                variant="romantic"
                gradient={THEME.colors.primary.romantic}
                compact={true}
                className="min-w-0 max-w-full"
              >
                <div className="space-y-4 sm:space-y-5 min-w-0 max-w-full">
                  {profile.profileCharacterTraits &&
                    profile.profileCharacterTraits.length > 0 && (
                      <div className="min-w-0 max-w-full">
                        <h4 className="text-sm font-bold text-purple-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                          <span className="break-words">
                            {displayDict.content.focus.myTraits}
                          </span>
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        </h4>
                        <div className="flex flex-wrap gap-2 min-w-0 max-w-full justify-center">
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
                                    `bg-gradient-to-r ${THEME.colors.secondary.lavender} text-purple-800`,
                                    'border border-purple-200 rounded-full',
                                    'break-words'
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
                  {profile.profileHobbies &&
                    profile.profileHobbies.length > 0 && (
                      <div className="min-w-0 max-w-full">
                        <h4 className="text-sm font-bold text-emerald-700 mb-2 sm:mb-3 flex items-center justify-center gap-2">
                          <span className="break-words">
                            {displayDict.content.focus.whatILove}
                          </span>
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
                                  `bg-gradient-to-r ${THEME.colors.secondary.sage} text-emerald-800`,
                                  'border border-emerald-200 rounded-full',
                                  'break-words'
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
            <div
              className={cn(
                'bg-white hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                // הוסף צבע טקסט דינמי:
                THEME.colors.primary.main.includes('rose')
                  ? 'text-rose-700'
                  : THEME.colors.primary.main.includes('blue')
                    ? 'text-blue-700'
                    : THEME.colors.primary.main.includes('amber')
                      ? 'text-amber-700'
                      : 'text-gray-700',
                THEME.shadows.warm
              )}
            >
              <h3 className="text-base sm:text-lg font-bold mb-2 break-words">
                {displayDict.content.focus.wantToKnowMore}
              </h3>
              <p className="mb-3 sm:mb-4 opacity-90 text-sm break-words">
                {displayDict.content.focus.moreToDiscover}
              </p>
              <Button
                onClick={() => setMobileViewLayout('detailed')}
                className={cn(
                  'bg-white text-gray-600 hover:bg-gray-50 font-bold rounded-full min-h-[44px]',
                  'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
                  THEME.shadows.warm
                )}
              >
                <Eye
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
                    direction === 'rtl' ? 'ml-2' : 'mr-2'
                  )}
                />
                <span className="break-words">
                  {displayDict.content.focus.letsGetToKnow}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (!isClient) {
    return (
      <Card
        dir={direction}
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

  return (
    <TooltipProvider>
      <Card
        dir={direction}
        id="profile-card-container"
        className={cn(
          'w-full h-full overflow-hidden flex flex-col max-w-full min-w-0',
          `bg-gradient-to-br ${THEME.colors.neutral.elegant}`,
          THEME.shadows.elegant,
          '[&_*]:box-border [&_*]:max-w-full',
          className
        )}
        style={{
          textAlign: direction === 'rtl' ? 'right' : 'left',
          overflow: 'hidden',
        }}
      >
        {isDesktop && onClose && (
          <div
            className={cn(
              'absolute top-4 z-40',
              direction === 'rtl' ? 'left-4' : 'right-4'
            )}
          >
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
                <p>{displayDict.mobileNav.closePreview}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {isDesktop ? (
          <ResizablePanelGroup
            direction="horizontal"
            dir={direction}
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
                  dict={displayDict}
                  characterTraitMap={characterTraitMap}
                  hobbiesMap={hobbiesMap}
                  religiousLevelMap={religiousLevelMap}
                  educationLevelMap={educationLevelMap}
                  locale={locale}
                />
                <div className="p-4 sm:p-6 overflow-hidden flex max-w-full">
                  <MainContentTabs isDesktop={isDesktop} />
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
                  <NeshamaTechSummary
                    profile={profile}
                    dict={displayDict}
                    THEME={THEME}
                    direction={direction}
                  />
                  <SectionCard
                    title={displayDict.gallery.title.replace(
                      '{{name}}',
                      profile.user?.firstName || 'המועמד'
                    )}
                    subtitle={displayDict.gallery.subtitle}
                    icon={Camera}
                    variant="elegant"
                    gradient={THEME.colors.primary.main}
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
                            alt={displayDict.gallery.imageAlt.replace(
                              '{{index}}',
                              '1'
                            )}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="35vw"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                              <p className="font-bold text-sm sm:text-base">
                                {displayDict.gallery.subtitle}
                              </p>
                            </div>
                          </div>
                        </div>
                        {orderedImages.length > 1 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-0 max-w-full">
                            {orderedImages.slice(1, 7).map((img, idx) => (
                              <div
                                key={img.id}
                                className={cn(
                                  'relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-rose-400 transition-all duration-300 shadow-md hover:shadow-lg max-w-full'
                                )}
                                onClick={() => handleOpenImageDialog(img)}
                              >
                                <Image
                                  src={getRelativeCloudinaryPath(img.url)}
                                  alt={displayDict.gallery.imageAlt.replace(
                                    '{{index}}',
                                    (idx + 2).toString()
                                  )}
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
                        title={displayDict.content.emptyStateTitle}
                        description={displayDict.content.emptyStateDescription}
                        variant="romantic"
                        THEME={THEME}
                      />
                    )}
                  </SectionCard>
                </div>
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden">
            <MobileHeader />
            {mobileViewLayout === 'detailed' ? (
              <DetailedMobileLayout />
            ) : (
              <FocusMobileLayout />
            )}
          </div>
        )}

        <ImageDialogComponent
          selectedImageForDialog={selectedImageForDialog}
          currentDialogImageIndex={currentDialogImageIndex}
          orderedImages={orderedImages}
          onClose={handleCloseImageDialog}
          onNavigate={handleDialogNav}
          onImageSelect={setSelectedImageForDialog}
          dict={displayDict.imageDialog}
          direction={direction}
          THEME={THEME}
        />
      </Card>
    </TooltipProvider>
  );
};

export default ProfileCard;
