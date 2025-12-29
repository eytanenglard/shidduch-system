// /constants/filterOptions.ts
import { AvailabilityStatus } from '@prisma/client';

export const AGE_RANGE = {
  min: 18,
  max: 130,
  default: {
    min: 20,
    max: 35
  }
};

export const HEIGHT_RANGE = {
  min: 80,
  max: 210,
  default: {
    min: 150,
    max: 190
  }
};

export const RELIGIOUS_LEVELS = [
  { value: "charedi", label: "חרדי/ת" },
  { value: "charedi_modern", label: "חרדי/ת מודרני/ת" },
  { value: "dati_leumi_torani", label: "דתי/ה לאומי/ת תורני/ת" },
  { value: "dati_leumi_liberal", label: "דתי/ה לאומי/ת ליברלי/ת" },
  { value: "dati_leumi_standard", label: "דתי/ה לאומי/ת (סטנדרטי)" },
  { value: "masorti_strong", label: "מסורתי/ת (קרוב/ה לדת)" },
  { value: "masorti_light", label: "מסורתי/ת (קשר קל למסורת)" },
  {
    value: "secular_traditional_connection",
    label: "חילוני/ת עם זיקה למסורת",
  },
  { value: "secular", label: "חילוני/ת" },
  { value: "spiritual_not_religious", label: "רוחני/ת (לאו דווקא דתי/ה)" },
  { value: "other", label: "אחר (נא לפרט ב'אודות')" },
];

export const EDUCATION_LEVELS = [
  { value: 'תיכונית', label: 'השכלה תיכונית' },
  { value: 'ישיבה', label: 'ישיבה' },
  { value: 'סמינר', label: 'סמינר' },
  { value: 'תואר ראשון', label: 'תואר ראשון' },
  { value: 'תואר שני', label: 'תואר שני' },
  { value: 'דוקטורט', label: 'דוקטורט' }
];

export const MARITAL_STATUS = [
  { value: 'רווק/ה', label: 'רווק/ה' },
  { value: 'גרוש/ה', label: 'גרוש/ה' },
  { value: 'אלמן/ה', label: 'אלמן/ה' }
];

export const OCCUPATION_CATEGORIES = [
  { value: 'חינוך', label: 'חינוך והוראה' },
  { value: 'הייטק', label: 'הייטק ותוכנה' },
  { value: 'רפואה', label: 'רפואה ובריאות' },
  { value: 'משפטים', label: 'משפטים' },
  { value: 'עסקים', label: 'עסקים וכלכלה' },
  { value: 'שירותים', label: 'שירותים' },
  { value: 'אחר', label: 'אחר' }
];

export const REGIONS = [
  { value: 'ירושלים', label: 'ירושלים והסביבה' },
  { value: 'תל אביב', label: 'תל אביב והמרכז' },
  { value: 'חיפה', label: 'חיפה והצפון' },
  { value: 'באר שבע', label: 'באר שבע והדרום' },
  { value: 'יהודה ושומרון', label: 'יהודה ושומרון' }
];

export const POPULAR_CITIES = [
  'ירושלים',
  'תל אביב',
  'חיפה',
  'בני ברק',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'באר שבע',
  'חולון',
  'רמת גן',
  'בית שמש',
  'מודיעין עילית',
  'אלעד',
  'ביתר עילית'
];

export const AVAILABILITY_STATUS_OPTIONS = [
  { 
    value: AvailabilityStatus.AVAILABLE, 
    label: 'פנוי/ה',
    description: 'מועמד/ת פנוי/ה להצעות'
  },
  { 
    value: AvailabilityStatus.DATING, 
    label: 'בתהליך הכרות',
    description: 'נמצא/ת בתהליך הכרות'
  },
  { 
    value: AvailabilityStatus.UNAVAILABLE, 
    label: 'לא פנוי/ה',
    description: 'לא פנוי/ה להצעות כרגע'
  }
];

export const SORT_OPTIONS = [
  { 
    value: 'lastActive',
    label: 'פעילות אחרונה',
    defaultOrder: 'desc'
  },
  { 
    value: 'age',
    label: 'גיל',
    defaultOrder: 'asc'
  },
  { 
    value: 'name',
    label: 'שם',
    defaultOrder: 'asc'
  },
  { 
    value: 'city',
    label: 'עיר',
    defaultOrder: 'asc'
  },
  { 
    value: 'religiousLevel',
    label: 'רמת דתיות',
    defaultOrder: 'asc'
  },
  { 
    value: 'height',
    label: 'גובה',
    defaultOrder: 'desc'
  },
  { 
    value: 'registrationDate',
    label: 'תאריך הרשמה',
    defaultOrder: 'desc'
  }
];

export const VIEW_OPTIONS = [
  {
    value: 'grid',
    label: 'תצוגת גריד',
    icon: 'LayoutGrid'
  },
  {
    value: 'list',
    label: 'תצוגת רשימה',
    icon: 'List'
  }
];

export const CARD_SIZES = [
  {
    value: 'sm',
    label: 'קטן',
    dimensions: {
      grid: 'h-64',
      list: 'h-24'
    }
  },
  {
    value: 'md',
    label: 'בינוני',
    dimensions: {
      grid: 'h-80',
      list: 'h-32'
    }
  },
  {
    value: 'lg',
    label: 'גדול',
    dimensions: {
      grid: 'h-96',
      list: 'h-40'
    }
  }
];

export const GROUP_BY_OPTIONS = [
  {
    value: 'none',
    label: 'ללא קיבוץ'
  },
  {
    value: 'city',
    label: 'עיר'
  },
  {
    value: 'religiousLevel',
    label: 'רמת דתיות'
  },
  {
    value: 'ageGroup',
    label: 'קבוצת גיל'
  },
  {
    value: 'availability',
    label: 'סטטוס זמינות'
  }
];

export const DEFAULT_FILTERS = {
  gender: undefined,
  ageRange: undefined,      // היה: AGE_RANGE.default
  heightRange: undefined,   // היה: HEIGHT_RANGE.default
  cities: [],
  religiousLevel: undefined,
  occupations: [],
  availability: undefined,
  searchQuery: '',
  isVerified: undefined,
  hasReferences: undefined,
  lastActiveDays: undefined
};

export const FILTER_CATEGORIES = [
  {
    id: 'basic',
    label: 'פילטרים בסיסיים',
    filters: ['gender', 'ageRange', 'cities', 'religiousLevel']
  },
  {
    id: 'advanced',
    label: 'פילטרים מתקדמים',
    filters: ['heightRange', 'occupations', 'education', 'maritalStatus']
  },
  {
    id: 'status',
    label: 'סטטוס ואימות',
    filters: ['availability', 'isVerified', 'hasReferences', 'lastActiveDays']
  }
];