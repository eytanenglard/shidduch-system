// src/app/components/matchmaker/new/types/filters.ts

import { Gender, AvailabilityStatus, UserStatus, UserSource  } from '@prisma/client';

// הגדרת טווח ערכים מספריים
export interface RangeFilter {
  min: number;
  max: number;
}

// הגדרת פילטר שמור
export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  isDefault?: boolean;
  createdAt: Date;
}

export interface FilterState {
  // הוספת מצב תצוגה נפרדת
  separateFiltering: boolean;
    source?: UserSource | undefined;
  // הוספת שדות חיפוש נפרדים
  maleSearchQuery?: string;
  femaleSearchQuery?: string;

  // פילטרים נפרדים לגברים
  maleFilters?: Omit<FilterState, 'gender' | 'maleFilters' | 'femaleFilters' | 
    'separateFiltering' | 'maleSearchQuery' | 'femaleSearchQuery'>;
  
  // פילטרים נפרדים לנשים
  femaleFilters?: Omit<FilterState, 'gender' | 'maleFilters' | 'femaleFilters' | 
    'separateFiltering' | 'maleSearchQuery' | 'femaleSearchQuery'>;

  searchQuery?: string;
  savedFilterId?: string;
  gender?: Gender | undefined;
  ageRange?: RangeFilter;
  heightRange?: RangeFilter;
  cities?: string[];
  occupations?: string[];
  religiousLevel?: string;
  educationLevel?: string;
  maritalStatus?: string;
  availabilityStatus?: AvailabilityStatus | string;
  userStatus?: UserStatus;
  isVerified?: boolean;
  hasReferences?: boolean;
  lastActiveDays?: number;
  isProfileComplete?: boolean;
}

// הגדרת אפשרות פילטר
export interface FilterOption {
  key: keyof (FilterState & { education: string });
  value: Gender | AvailabilityStatus | UserStatus | RangeFilter | string[] | string | number | boolean | undefined;
  label: string;
  category?: string;
}

// הגדרת קטגוריית פילטר
export interface FilterCategory {
  id: string;
  label: string;
  filters: Array<keyof (FilterState & { education: string })>;
}

// הגדרת פרופ לקומפוננטת הפילטרים
export interface FilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset?: () => void;
  className?: string;
}

// הגדרת אפשרויות הפילטר
export interface FilterOptions {
  ages: RangeFilter;
  heights: RangeFilter;
  cities: string[];
  religiousLevels: string[];
  educationLevels: string[];
  occupations: string[];
  maritalStatuses: string[];
  availabilityStatuses: AvailabilityStatus[];
}

// הגדרת מצב הממשק של הפילטרים
export interface FilterUIState {
  isOpen: boolean;
  activeCategory?: string;
  showSaveDialog: boolean;
  presetName: string;
}

// הגדרה של אירועי שינוי בפילטרים
export type FilterChangeHandler = (filters: FilterState) => void;

// הגדרת אירועי שמירת פילטר
export interface SaveFilterHandler {
  (name: string, filters: FilterState): Promise<SavedFilter>;
}

// הגדרת אירועי טעינת פילטר
export interface LoadFilterHandler {
  (id: string): void;
}

// הגדרת הגדרות הפילטרים
export interface FilterSettings {
  localStorageKey?: string;
  defaultFilters?: Partial<FilterState>;
  onFilterChange?: FilterChangeHandler;
}

// הגדרת תוצאות הפילטר
export interface FilterResults {
  totalResults: number;
  filteredResults: number;
  categories: Record<string, number>;
}

// קונסטנטות של הפילטרים
export const DEFAULT_FILTER_STATE: FilterState = {
  separateFiltering: false,
  maleFilters: {},
  femaleFilters: {},
  maleSearchQuery: '',
  femaleSearchQuery: '',
  gender: undefined,
  ageRange: { min: 18, max: 99 },
  heightRange: { min: 140, max: 210 },
  cities: [],
  occupations: [],
  religiousLevel: undefined,
  educationLevel: undefined,
  maritalStatus: undefined,
  availabilityStatus: undefined,
    source: undefined,
  userStatus: undefined,
  isVerified: undefined,
  hasReferences: undefined,
  lastActiveDays: undefined,
  isProfileComplete: undefined,
  searchQuery: '',
  savedFilterId: undefined
};

// קטגוריות פילטרים מוגדרות מראש
export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'basic',
    label: 'פילטרים בסיסיים',
    filters: ['gender', 'ageRange', 'cities', 'religiousLevel']
  },
  {
    id: 'advanced',
    label: 'פילטרים מתקדמים',
    filters: ['heightRange', 'occupations', 'educationLevel', 'maritalStatus']
  },
  {
    id: 'status',
    label: 'סטטוס ואימות',
    filters: ['availabilityStatus', 'isVerified', 'hasReferences', 'lastActiveDays']
  }
];

// טיפוסי מיון
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: keyof FilterState;
  direction: SortDirection;
  label: string;
}

// הגדרות קיבוץ
export interface GroupOption {
  field: keyof FilterState;
  label: string;
}

export const filterConstants = {
  DEFAULT_FILTER_STATE,
  FILTER_CATEGORIES
};

export default filterConstants;