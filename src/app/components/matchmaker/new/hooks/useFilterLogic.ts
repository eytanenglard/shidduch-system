// src/app/components/matchmaker/new/hooks/useFilterLogic.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  FilterState,
  SavedFilter,
  FilterOption,
  FilterChangeHandler
} from '../types/filters';
import { DEFAULT_FILTER_STATE } from '../types/filters'; 

type SavedFilterFromStorage = Omit<SavedFilter, 'createdAt'> & {
  createdAt: string;
};
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
  // States
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...defaultFilters
  });
  
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load saved filters and history from localStorage
  useEffect(() => {
    try {
      // Load saved filters
      const savedPrefs = localStorage.getItem(localStorageKey);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setSavedFilters(parsed.map((filter: SavedFilterFromStorage) => ({
          ...filter,
          createdAt: new Date(filter.createdAt)
        })));
      }

      // Load recent searches
      const searches = localStorage.getItem(`${localStorageKey}_recent_searches`);
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, [localStorageKey]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // If there's a new search query, update search history
      if (newFilters.searchQuery && newFilters.searchQuery !== prev.searchQuery) {
        setRecentSearches(prevSearches => {
          const updatedSearches = [
            newFilters.searchQuery!,
            ...prevSearches.filter(s => s !== newFilters.searchQuery)
          ].slice(0, 10);
          
          localStorage.setItem(
            `${localStorageKey}_recent_searches`,
            JSON.stringify(updatedSearches)
          );
          
          return updatedSearches;
        });
      }

      // Call onChange callback if exists
      onFilterChange?.(updated);
      
      return updated;
    });
  }, [onFilterChange, localStorageKey]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultState: FilterState = {
      ...DEFAULT_FILTER_STATE,
      ...defaultFilters
    };

    setFilters(defaultState);
    onFilterChange?.(defaultState);
  }, [defaultFilters, onFilterChange]);

  // Save new filter
  const saveFilter = useCallback(async (name: string, filters: FilterState) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      isDefault: false,
      createdAt: new Date()
    };

    setSavedFilters(prev => {
      const updated = [...prev, newFilter];
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      return updated;
    });

    return newFilter;
  }, [localStorageKey]);

  // Update existing filter
  const updateSavedFilter = useCallback((id: string, updates: Partial<SavedFilter>) => {
    setSavedFilters(prev => {
      const updated = prev.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      );
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      return updated;
    });
  }, [localStorageKey]);

  // Delete filter
  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      return updated;
    });
  }, [localStorageKey]);

  // Set default filter
  const setDefaultFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updated = prev.map(f => ({
        ...f,
        isDefault: f.id === id
      }));
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      return updated;
    });
  }, [localStorageKey]);

  // Load saved filter
  const loadSavedFilter = useCallback((id: string) => {
    const filter = savedFilters.find(f => f.id === id);
    if (filter) {
      setFilters({ ...filter.filters, savedFilterId: id });
      onFilterChange?.({ ...filter.filters, savedFilterId: id });
    }
  }, [savedFilters, onFilterChange]);

  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery ||
      filters.gender !== undefined ||
      (filters.cities?.length ?? 0) > 0 ||  // בדיקה בטוחה למערך
      (filters.occupations?.length ?? 0) > 0 ||  // בדיקה בטוחה למערך
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
      ))
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

    // גיל
    if (filters.ageRange && (filters.ageRange.min !== 18 || filters.ageRange.max !== 99)) {
      active.push({
        key: 'ageRange',
        value: filters.ageRange,
        label: `גיל: ${filters.ageRange.min}-${filters.ageRange.max}`,
        category: 'מידע בסיסי'
      });
    }

    // גובה
    if (filters.heightRange && (filters.heightRange.min !== 140 || filters.heightRange.max !== 210)) {
      active.push({
        key: 'heightRange',
        value: filters.heightRange,
        label: `גובה: ${filters.heightRange.min}-${filters.heightRange.max} ס"מ`,
        category: 'מידע בסיסי'
      });
    }

    // ערים
    if (filters.cities?.length) {
      active.push({
        key: 'cities',
        value: filters.cities,
        label: `ערים: ${filters.cities.join(', ')}`,
        category: 'מיקום'
      });
    }

    // תחומי עיסוק
    if (filters.occupations?.length) {
      active.push({
        key: 'occupations',
        value: filters.occupations,
        label: `תחומי עיסוק: ${filters.occupations.join(', ')}`,
        category: 'תעסוקה'
      });
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
      active.push({
        key: 'availabilityStatus',
        value: filters.availabilityStatus,
        label: `סטטוס זמינות: ${filters.availabilityStatus}`,
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
  setFilters(prev => {
    const updated = { ...prev };

    if (Array.isArray(updated[key]) && value !== undefined) {
      if (key === 'cities' || key === 'occupations') {
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
    activeFilters,
    hasActiveFilters,

    // Actions
    setFilters: updateFilters,
    removeFilter,
    resetFilters,

    // Saved filters management
    saveFilter,
    updateSavedFilter,
    deleteFilter,
    setDefaultFilter,
    loadSavedFilter,
  };
};

export default useFilterLogic;