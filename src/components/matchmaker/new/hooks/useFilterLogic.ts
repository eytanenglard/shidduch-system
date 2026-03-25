// src/app/components/matchmaker/new/hooks/useFilterLogic.ts - גרסה משופרת

import { useState, useMemo, useCallback, useRef } from 'react';
import type {
  FilterState,
  FilterOption,
  FilterChangeHandler,
} from '../types/filters';
import { DEFAULT_FILTER_STATE } from '../types/filters';

const RANGE_DEBOUNCE_MS = 400;
import { useSavedFilters } from './useSavedFilters';
import { useSearchHistory } from './useSearchHistory';
import { useGenderFilters } from './useGenderFilters';

interface UseFilterLogicProps {
  onFilterChange?: FilterChangeHandler;
  defaultFilters?: Partial<FilterState>;
  localStorageKey?: string;
}

export const useFilterLogic = ({
  onFilterChange,
  defaultFilters = {},
  localStorageKey = 'candidateFilters'
}: UseFilterLogicProps = {}) => {
  // Core filter state
  const [filters, setFiltersState] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...defaultFilters
  });

  // Sub-hooks
  const {
    savedFilters,
    lastAppliedFilter,
    setLastAppliedFilter,
    saveFilter,
    updateSavedFilter,
    deleteFilter,
    setDefaultFilter,
    loadSavedFilter: loadSavedFilterInternal,
  } = useSavedFilters({ localStorageKey, onFilterChange });

  const {
    recentSearches,
    searchHistory,
    popularFilters,
    clearRecentSearches,
    addSearchQuery,
  } = useSearchHistory({ localStorageKey });

  const {
    toggleSeparateFiltering,
    updateMaleFilters,
    updateFemaleFilters,
    updateMaleSearchQuery,
    updateFemaleSearchQuery,
    copyFilters,
  } = useGenderFilters({ onFilterChange, setFiltersState });

  // Wrap loadSavedFilter to pass setFiltersState
  const loadSavedFilter = useCallback((id: string) => {
    loadSavedFilterInternal(id, (loadedFilters: FilterState) => {
      setFiltersState(loadedFilters);
    });
  }, [loadSavedFilterInternal]);

  // Debounce timer for range filter changes (age/height sliders)
  const rangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if filter update contains only range changes
  const isRangeOnly = (newFilters: Partial<FilterState>): boolean => {
    const keys = Object.keys(newFilters) as (keyof FilterState)[];
    return keys.every((k) => k === 'ageRange' || k === 'heightRange');
  };

  // עדכון פילטרים כללי — with debounce for range filters
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };

      // אם יש מחרוזת חיפוש חדשה, עדכן את היסטורית החיפוש
      if (newFilters.searchQuery && newFilters.searchQuery !== prev.searchQuery) {
        const newQuery = newFilters.searchQuery;
        addSearchQuery(newQuery);
      }

      // Debounce range changes (sliders) to avoid hammering API during drag
      if (isRangeOnly(newFilters)) {
        if (rangeDebounceRef.current) {
          clearTimeout(rangeDebounceRef.current);
        }
        rangeDebounceRef.current = setTimeout(() => {
          onFilterChange?.(updated);
        }, RANGE_DEBOUNCE_MS);
      } else {
        // Non-range filters update immediately
        onFilterChange?.(updated);
      }

      return updated;
    });
  }, [onFilterChange, addSearchQuery]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultState: FilterState = {
      ...DEFAULT_FILTER_STATE,
      ...defaultFilters
    };

    setFiltersState(defaultState);
    setLastAppliedFilter(null);
    onFilterChange?.(defaultState);
  }, [defaultFilters, onFilterChange, setLastAppliedFilter]);

  // Apply popular filter
  const applyPopularFilter = useCallback((filterConfig: Partial<FilterState>) => {
    const updatedFilters = {
      ...DEFAULT_FILTER_STATE,
      ...filterConfig
    };
    setFiltersState(updatedFilters);
    onFilterChange?.(updatedFilters);
  }, [onFilterChange]);

  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery ||
      filters.gender !== undefined ||
      (filters.cities?.length ?? 0) > 0 ||
      (filters.occupations?.length ?? 0) > 0 ||
      (filters.languages?.length ?? 0) > 0 ||
      filters.religiousLevel ||
      filters.educationLevel ||
      filters.maritalStatus ||
      filters.availabilityStatus ||
      filters.userStatus ||
      filters.isVerified ||
      filters.hasReferences ||
      filters.lastActiveDays ||
      filters.isProfileComplete ||
      (filters.ageRange && (
        filters.ageRange.min !== DEFAULT_FILTER_STATE.ageRange?.min ||
        filters.ageRange.max !== DEFAULT_FILTER_STATE.ageRange?.max
      )) ||
      (filters.heightRange && (
        filters.heightRange.min !== DEFAULT_FILTER_STATE.heightRange?.min ||
        filters.heightRange.max !== DEFAULT_FILTER_STATE.heightRange?.max
      )) ||
      filters.separateFiltering
    );
  }, [filters]);

  // Get active filters in formatted array
  const activeFilters = useMemo((): FilterOption[] => {
    const active: FilterOption[] = [];

    if (filters.searchQuery) {
      active.push({
        key: 'searchQuery',
        value: filters.searchQuery,
        label: `חיפוש: ${filters.searchQuery}`,
        category: 'חיפוש'
      });
    }

    if (filters.gender) {
      active.push({
        key: 'gender',
        value: filters.gender,
        label: `מגדר: ${filters.gender === 'MALE' ? 'זכר' : 'נקבה'}`,
        category: 'מידע בסיסי'
      });
    }

    if (filters.separateFiltering) {
      active.push({
        key: 'separateFiltering',
        value: true,
        label: 'סינון נפרד לפי מגדר',
        category: 'מידע בסיסי'
      });
    }

    // גיל
    if (filters.ageRange && (
      filters.ageRange.min !== DEFAULT_FILTER_STATE.ageRange?.min ||
      filters.ageRange.max !== DEFAULT_FILTER_STATE.ageRange?.max
    )) {
      active.push({
        key: 'ageRange',
        value: filters.ageRange,
        label: `גיל: ${filters.ageRange.min}-${filters.ageRange.max}`,
        category: 'מידע בסיסי'
      });
    }

    // גובה
    if (filters.heightRange && (
      filters.heightRange.min !== DEFAULT_FILTER_STATE.heightRange?.min ||
      filters.heightRange.max !== DEFAULT_FILTER_STATE.heightRange?.max
    )) {
      active.push({
        key: 'heightRange',
        value: filters.heightRange,
        label: `גובה: ${filters.heightRange.min}-${filters.heightRange.max} ס"מ`,
        category: 'מידע בסיסי'
      });
    }

    // ערים
    if (filters.cities?.length) {
      if (filters.cities.length === 1) {
        active.push({
          key: 'cities',
          value: filters.cities[0],
          label: `עיר: ${filters.cities[0]}`,
          category: 'מיקום'
        });
      } else {
        active.push({
          key: 'cities',
          value: filters.cities,
          label: `ערים: ${filters.cities.length} נבחרו`,
          category: 'מיקום'
        });
      }
    }

    // תחומי עיסוק
    if (filters.occupations?.length) {
      if (filters.occupations.length === 1) {
        active.push({
          key: 'occupations',
          value: filters.occupations[0],
          label: `תחום עיסוק: ${filters.occupations[0]}`,
          category: 'תעסוקה'
        });
      } else {
        active.push({
          key: 'occupations',
          value: filters.occupations,
          label: `תחומי עיסוק: ${filters.occupations.length} נבחרו`,
          category: 'תעסוקה'
        });
      }
    }

    // שפות
    if (filters.languages?.length) {
      if (filters.languages.length === 1) {
        active.push({
          key: 'languages',
          value: filters.languages[0],
          label: `שפה: ${filters.languages[0]}`,
          category: 'שפות'
        });
      } else {
        active.push({
          key: 'languages',
          value: filters.languages,
          label: `שפות: ${filters.languages.length} נבחרו`,
          category: 'שפות'
        });
      }
    }

    // רמת דתיות
    if (filters.religiousLevel) {
      active.push({
        key: 'religiousLevel',
        value: filters.religiousLevel,
        label: `רמת דתיות: ${filters.religiousLevel}`,
        category: 'דת'
      });
    }

    // השכלה
    if (filters.educationLevel) {
      active.push({
        key: 'educationLevel',
        value: filters.educationLevel,
        label: `השכלה: ${filters.educationLevel}`,
        category: 'השכלה'
      });
    }

    // מצב משפחתי
    if (filters.maritalStatus) {
      active.push({
        key: 'maritalStatus',
        value: filters.maritalStatus,
        label: `מצב משפחתי: ${filters.maritalStatus}`,
        category: 'מידע אישי'
      });
    }

    // סטטוס זמינות
    if (filters.availabilityStatus) {
      const statusLabel =
        filters.availabilityStatus === "AVAILABLE" ? "פנוי/ה" :
        filters.availabilityStatus === "DATING" ? "בתהליך הכרות" :
        filters.availabilityStatus === "UNAVAILABLE" ? "לא פנוי/ה" :
        filters.availabilityStatus;

      active.push({
        key: 'availabilityStatus',
        value: filters.availabilityStatus,
        label: `סטטוס זמינות: ${statusLabel}`,
        category: 'זמינות'
      });
    }

    // סטטוס משתמש
    if (filters.userStatus) {
      active.push({
        key: 'userStatus',
        value: filters.userStatus,
        label: `סטטוס משתמש: ${filters.userStatus}`,
        category: 'סטטוס'
      });
    }

    // משתמש מאומת
    if (filters.isVerified !== undefined) {
      active.push({
        key: 'isVerified',
        value: filters.isVerified,
        label: `משתמש מאומת: ${filters.isVerified ? 'כן' : 'לא'}`,
        category: 'אימות'
      });
    }

    // יש המלצות
    if (filters.hasReferences !== undefined) {
      active.push({
        key: 'hasReferences',
        value: filters.hasReferences,
        label: `יש המלצות: ${filters.hasReferences ? 'כן' : 'לא'}`,
        category: 'המלצות'
      });
    }

    // פעילות אחרונה
    if (filters.lastActiveDays !== undefined) {
      active.push({
        key: 'lastActiveDays',
        value: filters.lastActiveDays,
        label: `פעיל ב-${filters.lastActiveDays} הימים האחרונים`,
        category: 'פעילות'
      });
    }

    // פרופיל מלא
    if (filters.isProfileComplete !== undefined) {
      active.push({
        key: 'isProfileComplete',
        value: filters.isProfileComplete,
        label: `פרופיל מלא: ${filters.isProfileComplete ? 'כן' : 'לא'}`,
        category: 'שלמות פרופיל'
      });
    }

    return active;
  }, [filters]);

  // Remove single filter
  const removeFilter = useCallback((key: keyof FilterState, value?: string) => {
    setFiltersState(prev => {
      const updated = { ...prev };

      if (key === 'separateFiltering') {
        updated.separateFiltering = false;
      } else if (Array.isArray(updated[key]) && value !== undefined) {
        if (key === 'cities' || key === 'occupations' || key === 'languages') {
          updated[key] = (updated[key] as string[]).filter(v => v !== value);
        }
      } else {
        delete updated[key];
      }

      onFilterChange?.(updated);
      return updated;
    });
  }, [onFilterChange]);

  return {
    // Current state
    filters,
    savedFilters,
    recentSearches,
    searchHistory,
    activeFilters,
    hasActiveFilters,
    popularFilters,
    lastAppliedFilter,

    // Separate filtering functions
    toggleSeparateFiltering,
    updateMaleFilters,
    updateFemaleFilters,
    copyFilters,

    // חיפוש נפרד פונקציות חדשות
    updateMaleSearchQuery,
    updateFemaleSearchQuery,

    // Actions
    setFilters: updateFilters,
    removeFilter,
    resetFilters,
    clearRecentSearches,
    applyPopularFilter,

    // Saved filters management
    saveFilter,
    updateSavedFilter,
    deleteFilter,
    setDefaultFilter,
    loadSavedFilter,
};
};
export default useFilterLogic;
