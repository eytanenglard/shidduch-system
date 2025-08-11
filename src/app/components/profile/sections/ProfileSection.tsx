// src/app/components/profile/sections/ProfileSection.tsx
'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import   React, { useState, useEffect } from 'react';
import {
  Gender,
  AvailabilityStatus,
  ServiceType,
  HeadCoveringType,
  KippahType,
  ReligiousJourney,
} from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
  HeartPulse, // אייקון חדש
  Lock,       // אייקון חדש
  Eye,        // אייקון חדש
  EyeOff,     // אייקון חדש
} from 'lucide-react';
import { UserProfile } from '@/types/next-auth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { languageOptions } from '@/lib/languageOptions';
import { toast } from 'sonner';
import Autocomplete from 'react-google-autocomplete';
import { Switch } from '@/components/ui/switch'; // ייבוא רכיב הסוויץ'

const maritalStatusOptions = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
  { value: 'annulled', label: 'נישואין שבוטלו' },
];

const religiousLevelOptions = [
  { value: 'charedi', label: 'חרדי/ת' },
  { value: 'charedi_modern', label: 'חרדי/ת מודרני/ת' },
  { value: 'dati_leumi_torani', label: 'דתי/ה לאומי/ת תורני/ת' },
  { value: 'dati_leumi_liberal', label: 'דתי/ה לאומי/ת ליברלי/ת' },
  { value: 'dati_leumi_standard', label: 'דתי/ה לאומי/ת (סטנדרטי)' },
  { value: 'masorti_strong', label: 'מסורתי/ת (קרוב/ה לדת)' },
  { value: 'masorti_light', label: 'מסורתי/ת (קשר קל למסורת)' },
  { value: 'secular_traditional_connection', label: 'חילוני/ת עם זיקה למסורת' },
  { value: 'secular', label: 'חילוני/ת' },
  { value: 'spiritual_not_religious', label: 'רוחני/ת (לאו דווקא דתי/ה)' },
  { value: 'other', label: "אחר (נא לפרט ב'אודות')" },
];
const religiousJourneyOptions = [
  {
    value: 'BORN_INTO_CURRENT_LIFESTYLE',
    label: 'גדלתי בסביבה דומה להגדרתי כיום',
  },
  { value: 'BORN_SECULAR', label: 'גדלתי בסביבה חילונית' },
  { value: 'BAAL_TESHUVA', label: 'חזרתי בתשובה' },
  { value: 'DATLASH', label: 'יצאתי בשאלה (דתל"ש)' },
  { value: 'CONVERT', label: 'גר/ה / גיורת' },
  { value: 'IN_PROCESS', label: 'בתהליך של שינוי / התלבטות' },
  { value: 'OTHER', label: 'אחר (נא לפרט בהערות)' },
];

const educationLevelOptions = [
  { value: 'high_school', label: 'תיכונית' },
  { value: 'vocational', label: 'מקצועית / תעודה' },
  { value: 'academic_student', label: 'סטודנט/ית לתואר' },
  { value: 'academic_ba', label: 'תואר ראשון (BA/BSc)' },
  { value: 'academic_ma', label: 'תואר שני (MA/MSc)' },
  { value: 'academic_phd', label: 'דוקטורט (PhD)' },
  { value: 'yeshiva_seminary', label: 'לימודים תורניים (ישיבה/מדרשה/כולל)' },
  { value: 'other', label: 'אחר' },
];

const serviceTypeOptions = [
  { value: ServiceType.MILITARY_COMBATANT, label: 'צבאי - לוחם/ת' },
  { value: ServiceType.MILITARY_SUPPORT, label: 'צבאי - תומכ/ת לחימה' },
  { value: ServiceType.MILITARY_OFFICER, label: 'צבאי - קצונה' },
  {
    value: ServiceType.MILITARY_INTELLIGENCE_CYBER_TECH,
    label: 'צבאי - מודיעין/סייבר/טכנולוגי',
  },
  { value: ServiceType.NATIONAL_SERVICE_ONE_YEAR, label: 'שירות לאומי - שנה' },
  {
    value: ServiceType.NATIONAL_SERVICE_TWO_YEARS,
    label: 'שירות לאומי - שנתיים',
  },
  { value: ServiceType.HESDER_YESHIVA, label: 'ישיבת הסדר' },
  {
    value: ServiceType.YESHIVA_ONLY_POST_HS,
    label: 'ישיבה גבוהה / מדרשה (ללא שירות צבאי/לאומי)',
  },
  {
    value: ServiceType.PRE_MILITARY_ACADEMY_AND_SERVICE,
    label: 'מכינה קדם-צבאית ושירות',
  },
  { value: ServiceType.EXEMPTED, label: 'פטור משירות' },
  { value: ServiceType.CIVILIAN_SERVICE, label: 'שירות אזרחי' },
  { value: ServiceType.OTHER, label: 'אחר / לא רלוונטי' },
];

const headCoveringOptions = [
  { value: HeadCoveringType.FULL_COVERAGE, label: 'כיסוי ראש מלא' },
  { value: HeadCoveringType.PARTIAL_COVERAGE, label: 'כיסוי ראש חלקי' },
  { value: HeadCoveringType.HAT_BERET, label: 'כובע / ברט' },
  {
    value: HeadCoveringType.SCARF_ONLY_SOMETIMES,
    label: 'מטפחת (רק באירועים/בית כנסת)',
  },
  { value: HeadCoveringType.NONE, label: 'ללא כיסוי ראש' },
];

const kippahTypeOptions = [
  { value: KippahType.BLACK_VELVET, label: 'קטיפה שחורה' },
  { value: KippahType.KNITTED_SMALL, label: 'סרוגה קטנה' },
  { value: KippahType.KNITTED_LARGE, label: 'סרוגה גדולה' },
  { value: KippahType.CLOTH, label: 'בד' },
  { value: KippahType.BRESLEV, label: 'ברסלב (לבנה גדולה)' },
  { value: KippahType.NONE_AT_WORK_OR_CASUAL, label: 'לא בעבודה / ביומיום' },
  { value: KippahType.NONE_USUALLY, label: 'לרוב לא חובש' },
  { value: KippahType.OTHER, label: 'אחר' },
];

const characterTraitsOptions = [
  { value: 'empathetic', label: 'אמפתי/ת', icon: Heart },
  { value: 'driven', label: 'שאפתן/ית', icon: Briefcase },
  { value: 'optimistic', label: 'אופטימי/ת', icon: Smile },
  { value: 'family_oriented', label: 'משפחתי/ת', icon: Users },
  { value: 'intellectual', label: 'אינטלקטואל/ית', icon: BookOpen },
  { value: 'organized', label: 'מאורגנ/ת', icon: Palette },
  { value: 'calm', label: 'רגוע/ה', icon: Heart },
  { value: 'humorous', label: 'בעל/ת חוש הומור', icon: Smile },
  { value: 'sociable', label: 'חברותי/ת', icon: Users },
  { value: 'sensitive', label: 'רגיש/ה', icon: Heart },
  { value: 'independent', label: 'עצמאי/ת', icon: MapPin },
  { value: 'creative', label: 'יצירתי/ת', icon: Palette },
  { value: 'honest', label: 'כן/ה וישר/ה', icon: Shield },
  { value: 'responsible', label: 'אחראי/ת', icon: Shield },
  { value: 'easy_going', label: 'זורם/ת וקליל/ה', icon: Smile },
];

const hobbiesOptions = [
  { value: 'travel', label: 'טיולים', icon: MapPin },
  { value: 'sports', label: 'ספורט', icon: Briefcase },
  { value: 'reading', label: 'קריאה', icon: BookOpen },
  { value: 'cooking_baking', label: 'בישול/אפיה', icon: Palette },
  { value: 'music_playing_instrument', label: 'מוזיקה/נגינה', icon: Languages },
  { value: 'art_crafts', label: 'אומנות/יצירה', icon: Palette },
  { value: 'volunteering', label: 'התנדבות', icon: Heart },
  { value: 'learning_courses', label: 'למידה/קורסים', icon: BookOpen },
  { value: 'board_games_puzzles', label: 'משחקי קופסא/פאזלים', icon: Smile },
  { value: 'movies_theater', label: 'סרטים/תיאטרון', icon: Smile },
  { value: 'dancing', label: 'ריקוד', icon: Users },
  { value: 'writing', label: 'כתיבה', icon: BookOpen },
  { value: 'nature_hiking', label: 'טבע/טיולים רגליים', icon: MapPin },
  { value: 'photography', label: 'צילום', icon: Palette },
];

const preferredMatchmakerGenderOptions = [
  { value: 'MALE', label: 'משדך' },
  { value: 'FEMALE', label: 'שדכנית' },
  { value: 'NONE', label: 'ללא העדפה' },
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
  if (typeof value === 'string' || typeof value === 'number') {
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

  const [cityInputValue, setCityInputValue] = useState('');
  const [aliyaCountryInputValue, setAliyaCountryInputValue] = useState('');

  const initializeFormData = (profileData: UserProfile | null) => {
    const dataToSet: Partial<UserProfile> = {
      gender: profileData?.gender || undefined,
      birthDate: ensureDateObject(profileData?.birthDate),
      nativeLanguage: profileData?.nativeLanguage || undefined,
      additionalLanguages: profileData?.additionalLanguages || [],
      height: profileData?.height ?? undefined,
      maritalStatus: profileData?.maritalStatus || undefined,
      occupation: profileData?.occupation || '',
      education: profileData?.education || '',
      educationLevel: profileData?.educationLevel || undefined,
      city: profileData?.city || '',
      origin: profileData?.origin || '',
      religiousJourney: profileData?.religiousJourney || undefined,
      religiousLevel: profileData?.religiousLevel || undefined,
      about: profileData?.about || '',
      parentStatus: profileData?.parentStatus || undefined,
      fatherOccupation: profileData?.fatherOccupation || '',
      motherOccupation: profileData?.motherOccupation || '',
      siblings: profileData?.siblings ?? undefined,
      position: profileData?.position ?? undefined,
      isProfileVisible: profileData?.isProfileVisible ?? true,
      preferredMatchmakerGender:
        profileData?.preferredMatchmakerGender || undefined,
      availabilityStatus:
        profileData?.availabilityStatus || AvailabilityStatus.AVAILABLE,
      availabilityNote: profileData?.availabilityNote || '',
      availabilityUpdatedAt: ensureDateObject(
        profileData?.availabilityUpdatedAt
      ),
      matchingNotes: profileData?.matchingNotes || '',
      shomerNegiah: profileData?.shomerNegiah ?? undefined,
      serviceType: profileData?.serviceType || undefined,
      serviceDetails: profileData?.serviceDetails || '',
      headCovering: profileData?.headCovering || undefined,
      kippahType: profileData?.kippahType || undefined,
      hasChildrenFromPrevious:
        profileData?.hasChildrenFromPrevious ?? undefined,
      profileCharacterTraits: profileData?.profileCharacterTraits || [],
      profileHobbies: profileData?.profileHobbies || [],
      aliyaCountry: profileData?.aliyaCountry || '',
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
      // --- עדכון: אתחול שדות רפואיים ---
      hasMedicalInfo: profileData?.hasMedicalInfo ?? false,
      medicalInfoDetails: profileData?.medicalInfoDetails || '',
      medicalInfoDisclosureTiming: profileData?.medicalInfoDisclosureTiming || undefined,
      isMedicalInfoVisible: profileData?.isMedicalInfoVisible ?? false,
      // --- סוף עדכון ---
    };
    setFormData(dataToSet);
    setInitialData(dataToSet);

    setCityInputValue(dataToSet.city || '');
    setAliyaCountryInputValue(dataToSet.aliyaCountry || '');
  };

  useEffect(() => {
    setLoading(true);
    if (profileProp) {
      initializeFormData(profileProp);
      setLoading(false);
    } else {
      const fetchProfileAndInitialize = async () => {
        try {
          const response = await fetch('/api/profile');
          if (!response.ok) throw new Error('Failed to fetch profile');
          const data = await response.json();
          if (data.success && data.profile) {
            initializeFormData(data.profile);
          } else {
            initializeFormData(null);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
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
        field === 'height' ||
        field === 'siblings' ||
        field === 'position' ||
        field === 'aliyaYear' ||
        field === 'preferredAgeMin' ||
        field === 'preferredAgeMax' ||
        field === 'preferredHeightMin' ||
        field === 'preferredHeightMax'
      ) {
        const rawValue = value as string | number;
        if (rawValue === '' || rawValue === null || rawValue === undefined) {
          finalValue = undefined;
        } else {
          const parsed = parseInt(String(rawValue), 10);
          finalValue = !isNaN(parsed)
            ? (parsed as UserProfile[typeof field])
            : undefined;
        }
      } else if (field === 'birthDate') {
        finalValue = ensureDateObject(
          value as string | Date | null | undefined
        ) as UserProfile[typeof field];
      } else if (
        typeof prev[field] === 'boolean' ||
        field === 'shomerNegiah' ||
        field === 'hasChildrenFromPrevious' ||
        field === 'isProfileVisible' ||
        field === 'hasMedicalInfo' ||      // הוספה
        field === 'isMedicalInfoVisible'   // הוספה
      ) {
        finalValue = value as boolean as UserProfile[typeof field];
      } else if (Array.isArray(prev[field])) {
        finalValue = value as string[] as UserProfile[typeof field];
      } else if (value === '' || value === null) {
        const nullableStringFields: (keyof UserProfile)[] = [
          'nativeLanguage',
          'occupation',
          'education',
          'city',
          'origin',
          'religiousLevel',
          'religiousJourney',
          'about',
          'parentStatus',
          'fatherOccupation',
          'motherOccupation',
          'serviceDetails',
          'aliyaCountry',
          'availabilityNote',
          'matchingNotes',
          'educationLevel',
          'maritalStatus',
          'serviceType',
          'headCovering',
          'kippahType',
          'preferredMatchmakerGender',
          'contactPreference',
          'medicalInfoDetails',          // הוספה
          'medicalInfoDisclosureTiming', // הוספה
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
      toast.error('שגיאת ולידציה', {
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
    setCityInputValue(initialData.city || '');
    setAliyaCountryInputValue(initialData.aliyaCountry || '');
    setIsEditing(false);
  };

  const renderDisplayValue = (
    value: string | number | Date | undefined | null,
    placeholder: string = 'לא צוין'
  ) => {
    if (value === undefined || value === null || value === '') {
      return <span className="italic text-gray-500">{placeholder}</span>;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Intl.DateTimeFormat('he-IL').format(value);
    }
    return String(value);
  };

  const renderSelectDisplayValue = (
    value: string | undefined | null,
    options: { value: string; label: string }[],
    placeholder: string = 'לא צוין'
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
    trueLabel: string = 'כן',
    falseLabel: string = 'לא',
    placeholder: string = 'לא צוין'
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
    emptyPlaceholder: string = 'לא נבחרו פריטים.'
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
                  ? 'ערוך/י את פרטי הפרופיל שלך.'
                  : 'פרטי הפרופיל של המועמד/ת.'}
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
                  {/* ...שדות פרטים אישיים קיימים... */}
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
                  {/* ...שדות מצב משפחתי ורקע קיימים... */}
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
                  {/* ...שדות דת ואורח חיים קיימים... */}
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
                  {/* ...שדות קצת עלי והערות לשדכן קיימים... */}
                </div>
              </CardContent>
            </Card>

            {/* --- עדכון: Card חדש למידע רפואי --- */}
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50/40 to-pink-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <HeartPulse className="w-5 h-5 text-red-700" />
                <CardTitle className="text-base font-semibold text-gray-700">מידע רפואי ורגיש</CardTitle>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>מידע בחלק זה מיועד לשדכנים בלבד ולא יוצג בפרופיל כברירת מחדל.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200/80">
                  אנו מאמינים שקשר בריא נבנה על יושרה. סעיף זה נועד לתת לך מקום בטוח לשתף מידע רפואי (פיזי או נפשי) רלוונטי. 
                  הכנות שלך כאן היא צעד של אחריות המאפשר לנו למצוא עבורך התאמה מדויקת ולמנוע עוגמת נפש.
                </div>

                {isEditing && !viewOnly ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="hasMedicalInfo"
                        checked={formData.hasMedicalInfo || false}
                        onCheckedChange={(checked) => handleChange('hasMedicalInfo', checked as boolean)}
                      />
                      <Label htmlFor="hasMedicalInfo" className="text-sm font-medium text-gray-700 cursor-pointer">
                        ישנו מידע רפואי שחשוב שהצוות יידע?
                      </Label>
                    </div>

                    {formData.hasMedicalInfo && (
                      <div className="space-y-4 border-t pt-4 animate-in fade-in-50">
                        <div>
                          <Label htmlFor="medicalInfoDetails" className="block mb-1.5 text-xs font-medium text-gray-600">
                            פירוט המידע (יישמר בסודיות מוחלטת)
                          </Label>
                          <Textarea
                            id="medicalInfoDetails"
                            value={formData.medicalInfoDetails || ''}
                            onChange={(e) => handleChange('medicalInfoDetails', e.target.value)}
                            className="text-sm focus:ring-cyan-500 min-h-[100px] rounded-lg"
                            placeholder="כאן המקום לפרט. למשל: מחלה כרונית, התמודדות נפשית, ענייני פוריות, או כל דבר שמרגיש לך נכון וחשוב לציין."
                          />
                        </div>
                        <div>
                          <Label htmlFor="medicalInfoDisclosureTiming" className="block mb-1.5 text-xs font-medium text-gray-600">
                            מתי תרצה/י שהמידע ייחשף לצד השני (בתיווך השדכן/ית)?
                          </Label>
                          <Select
                            value={formData.medicalInfoDisclosureTiming || ''}
                            onValueChange={(value) => handleChange('medicalInfoDisclosureTiming', value || undefined)}
                          >
                            <SelectTrigger className="h-9 text-sm focus:ring-cyan-500">
                              <SelectValue placeholder="בחר/י תזמון חשיפה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FROM_THE_START">מההתחלה (מומלץ לנושאים מהותיים)</SelectItem>
                              <SelectItem value="AFTER_FIRST_DATES">לאחר דייט ראשון או שני</SelectItem>
                              <SelectItem value="WHEN_SERIOUS">כשהקשר הופך לרציני</SelectItem>
                              <SelectItem value="IN_COORDINATION_ONLY">אך ורק בתיאום טלפוני אישי איתי</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border-t pt-4">
                           <Label className="block mb-2 text-xs font-medium text-gray-600">
                            הצגה בפרופיל
                          </Label>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                             <Switch
                                id="isMedicalInfoVisible"
                                checked={formData.isMedicalInfoVisible}
                                onCheckedChange={(checked) => handleChange('isMedicalInfoVisible', checked)}
                                className="data-[state=checked]:bg-green-500"
                              />
                              <div className="flex flex-col">
                                <Label htmlFor="isMedicalInfoVisible" className="text-sm font-medium text-gray-800 cursor-pointer">
                                  {formData.isMedicalInfoVisible ? 'יוצג בפרופיל' : 'דיסקרטי (לצוות בלבד)'}
                                </Label>
                                <p className="text-xs text-gray-500">
                                 {formData.isMedicalInfoVisible 
                                   ? 'ציון על קיום מידע רפואי יוצג בכרטיס שלך.'
                                   : 'המידע יישאר חסוי וישמש את השדכנים בלבד.'}
                                </p>
                              </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="block text-xs font-medium text-gray-500">
                        מידע רפואי ששותף
                      </Label>
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderBooleanDisplayValue(formData.hasMedicalInfo, 'כן', 'לא')}
                      </p>
                    </div>
                    {formData.hasMedicalInfo && (
                      <>
                        <div>
                          <Label className="block text-xs font-medium text-gray-500">
                            פרטי המידע
                          </Label>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[40px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                            {formData.medicalInfoDetails || <span className="text-gray-500 italic">לא הוזן פירוט.</span>}
                          </p>
                        </div>
                        <div>
                          <Label className="block text-xs font-medium text-gray-500">
                            תזמון חשיפה מועדף
                          </Label>
                          <p className="text-sm text-gray-800 font-medium mt-1">
                            {renderSelectDisplayValue(
                              formData.medicalInfoDisclosureTiming,
                              [
                                { value: 'FROM_THE_START', label: 'מההתחלה' },
                                { value: 'AFTER_FIRST_DATES', label: 'לאחר דייטים ראשונים' },
                                { value: 'WHEN_SERIOUS', label: 'כשהקשר רציני' },
                                { value: 'IN_COORDINATION_ONLY', label: 'בתיאום אישי בלבד' },
                              ]
                            )}
                          </p>
                        </div>
                        <div>
                          <Label className="block text-xs font-medium text-gray-500">
                            נראות בפרופיל
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            {formData.isMedicalInfoVisible ? (
                               <Badge variant="secondary" className="bg-green-100 text-green-800">
                                 <Eye className="w-3.5 h-3.5 ml-1.5" />
                                 גלוי בפרופיל
                               </Badge>
                            ) : (
                               <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                 <Lock className="w-3.5 h-3.5 ml-1.5" />
                                 דיסקרטי (לצוות בלבד)
                               </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                  {/* ...שדות השכלה ועיסוק קיימים... */}
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
                {/* ...שדות תכונות אופי ותחביבים קיימים... */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buttons */}
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