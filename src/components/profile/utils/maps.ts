// src/components/profile/utils/maps.ts

import {
  Heart,
  Sunrise,
  Stars,
  Rainbow,
  Sparkles,
  BookMarked,
  BookOpen,
  Star,
  Flower,
  Crown,
  TreePine,
  Wind,
  Waves,
  Sparkle,
  Globe,
  School,
  Award,
  GraduationCap,
  Users,
  Users2,
  Shield,
  Briefcase,
  Zap,
  Home,
  Sun,
  Compass,
  ArrowLeft,
  Info as InfoIcon,
  CheckCircle,
  Palette,
  Smile,
  Coffee,
  Camera,
  Music,
  Play,
  Edit3,
  Phone as PhoneIcon,
  MessageSquare,
} from 'lucide-react';
import type { ProfileCardDict } from '@/types/dictionary';

export const createMaritalStatusMap = (
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

export const createReligiousLevelMap = (
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
  charedi_litvak: {
    label: dict.charedi_litvak,
    shortLabel: 'חרדי ליטאי',
    icon: BookMarked,
    color: 'text-indigo-700',
  },
  charedi_sephardic: {
    label: dict.charedi_sephardic,
    shortLabel: 'חרדי ספרדי',
    icon: BookMarked,
    color: 'text-indigo-700',
  },
  charedi_hasidic: {
    label: dict.charedi_hasidic,
    shortLabel: 'חרדי חסידי',
    icon: BookMarked,
    color: 'text-indigo-800',
  },
  chabad: {
    label: dict.chabad,
    shortLabel: 'חב״ד',
    icon: Star,
    color: 'text-indigo-600',
  },
  breslov: {
    label: dict.breslov,
    shortLabel: 'ברסלב',
    icon: Sparkle,
    color: 'text-indigo-500',
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
    label: dict.other,
    shortLabel: 'פתוח',
    icon: Globe,
    color: 'text-gray-600',
  },
});

export const createReligiousJourneyMap = (
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

export const createEducationLevelMap = (
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

export const createServiceTypeMap = (
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

export const createHeadCoveringMap = (
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

export const createKippahTypeMap = (
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

export const createCharacterTraitMap = (
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

export const createHobbiesMap = (dict: ProfileCardDict['options']['hobbies']) => ({
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

export const createContactPreferenceMap = () => ({
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
