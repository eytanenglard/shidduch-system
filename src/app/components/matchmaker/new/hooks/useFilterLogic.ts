// src/app/components/matchmaker/new/hooks/useFilterLogic.ts - גרסה משופרת

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  FilterState,
  SavedFilter,
  FilterOption,
  FilterChangeHandler,  
} from '../types/filters';
import { DEFAULT_FILTER_STATE } from '../types/filters'; 

type SavedFilterFromStorage = Omit<SavedFilter, 'createdAt'> & {
  createdAt: string;
};

interface SearchHistoryItemFromStorage {
  query: string;
  timestamp: string;
}
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
  const [searchHistory, setSearchHistory] = useState<{query: string, timestamp: Date}[]>([]);
  const [lastAppliedFilter, setLastAppliedFilter] = useState<string | null>(null);

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

      // Load search history
      const history = localStorage.getItem(`${localStorageKey}_search_history`);
      if (history) {
        setSearchHistory(JSON.parse(history).map((item: SearchHistoryItemFromStorage) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, [localStorageKey]);

  // עדכון פילטרים כללי
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    console.log("updateFilters called with:", newFilters);
    
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      console.log("Updated filters:", updated);
      
      // אם יש מחרוזת חיפוש חדשה, עדכן את היסטורית החיפוש
      if (newFilters.searchQuery && newFilters.searchQuery !== prev.searchQuery) {
        const newQuery = newFilters.searchQuery;
        console.log("New search query detected:", newQuery);
        
        // עדכון היסטוריית החיפוש
        const updatedHistory = [
          { query: newQuery, timestamp: new Date() },
          ...searchHistory.filter(item => item.query !== newQuery).slice(0, 9)
        ];
        
        setSearchHistory(updatedHistory);
        setRecentSearches(updatedHistory.map(item => item.query));
        
        // שמירה ב-localStorage
        try {
          localStorage.setItem(
            `${localStorageKey}_recent_searches`, 
            JSON.stringify(updatedHistory.map(item => item.query))
          );
          localStorage.setItem(
            `${localStorageKey}_search_history`,
            JSON.stringify(updatedHistory.map(item => ({
              query: item.query,
              timestamp: item.timestamp.toISOString()
            })))
          );
        } catch (e) {
          console.error("Error saving search history:", e);
        }
      }
      
      // טיפול בחיפוש נפרד לגברים
      if (newFilters.maleSearchQuery && newFilters.maleSearchQuery !== prev.maleSearchQuery) {
        // כאן אפשר לייצר היסטוריה נפרדת לחיפושי גברים או לשמור בהיסטוריה הכללית
        console.log("New male search query:", newFilters.maleSearchQuery);
      }
      
      // טיפול בחיפוש נפרד לנשים
      if (newFilters.femaleSearchQuery && newFilters.femaleSearchQuery !== prev.femaleSearchQuery) {
        // כאן אפשר לייצר היסטוריה נפרדת לחיפושי נשים או לשמור בהיסטוריה הכללית
        console.log("New female search query:", newFilters.femaleSearchQuery);
      }

      // קריאה לפונקציית callback
      if (onFilterChange) {
        console.log("Calling onFilterChange with updated filters");
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange, searchHistory, localStorageKey, setRecentSearches, setSearchHistory]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultState: FilterState = {
      ...DEFAULT_FILTER_STATE,
      ...defaultFilters
    };

    setFilters(defaultState);
    setLastAppliedFilter(null);
    onFilterChange?.(defaultState);
  }, [defaultFilters, onFilterChange]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(`${localStorageKey}_recent_searches`);
  }, [localStorageKey]);

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

  // פונקציה משופרת להחלפת מצב הסינון הנפרד
  const toggleSeparateFiltering = useCallback(() => {
    console.log("toggleSeparateFiltering called");
    
    setFilters(prev => {
      const newState = {
        ...prev,
        separateFiltering: !prev.separateFiltering
      };
      
      console.log(`Changing separateFiltering from ${prev.separateFiltering} to ${newState.separateFiltering}`);
      
      return newState;
    });
  }, []);

  // פונקציה משופרת לעדכון סינון גברים
  const updateMaleFilters = useCallback((maleFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updatedMaleFilters = {
        ...prev.maleFilters,
        ...maleFilters
      };
      
      // אם יש עדכון של מחרוזת חיפוש ספציפית לגברים
      if (maleFilters.searchQuery !== undefined) {
        const updated = {
          ...prev,
          maleFilters: updatedMaleFilters,
          maleSearchQuery: maleFilters.searchQuery // שמירת החיפוש גם בשדה הנפרד
        };
        
        // קריאה לפונקציית callback אם קיימת
        if (onFilterChange) {
          onFilterChange(updated);
        }
        
        return updated;
      }
      
      const updated = {
        ...prev,
        maleFilters: updatedMaleFilters
      };
      
      // קריאה לפונקציית callback אם קיימת
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange]);

  // פונקציה משופרת לעדכון סינון נשים
  const updateFemaleFilters = useCallback((femaleFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updatedFemaleFilters = {
        ...prev.femaleFilters,
        ...femaleFilters
      };
      
      // אם יש עדכון של מחרוזת חיפוש ספציפית לנשים
      if (femaleFilters.searchQuery !== undefined) {
        const updated = {
          ...prev,
          femaleFilters: updatedFemaleFilters,
          femaleSearchQuery: femaleFilters.searchQuery // שמירת החיפוש גם בשדה הנפרד
        };
        
        // קריאה לפונקציית callback אם קיימת
        if (onFilterChange) {
          onFilterChange(updated);
        }
        
        return updated;
      }
      
      const updated = {
        ...prev,
        femaleFilters: updatedFemaleFilters
      };
      
      // קריאה לפונקציית callback אם קיימת
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange]);

  const updateMaleSearchQuery = useCallback((query: string) => {
    setFilters(prev => {
      // שומרים את החיפוש בשדה הייעודי
      const updated = {
        ...prev,
        maleSearchQuery: query
      };
      
      // מעדכנים גם את הפילטרים הספציפיים לגברים אם פעיל סינון נפרד
      if (prev.separateFiltering) {
        updated.maleFilters = {
          ...prev.maleFilters,
          searchQuery: query
        };
      }
      
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange]);
  
  // פונקציה חדשה לעדכון חיפוש נפרד לנשים
  const updateFemaleSearchQuery = useCallback((query: string) => {
    setFilters(prev => {
      // שומרים את החיפוש בשדה הייעודי
      const updated = {
        ...prev,
        femaleSearchQuery: query
      };
      
      // מעדכנים גם את הפילטרים הספציפיים לנשים אם פעיל סינון נפרד
      if (prev.separateFiltering) {
        updated.femaleFilters = {
          ...prev.femaleFilters,
          searchQuery: query
        };
      }
      
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange]);

  // פונקציה משופרת להעתקת סינון מצד אחד לשני
  const copyFilters = useCallback((source: 'male' | 'female', target: 'male' | 'female') => {
    setFilters(prev => {
      const sourceFilters = source === 'male' ? prev.maleFilters : prev.femaleFilters;
      
      if (!sourceFilters) {
        return prev;
      }
      
      const updated = { ...prev };
      
      if (target === 'male') {
        updated.maleFilters = { ...sourceFilters };
      } else {
        updated.femaleFilters = { ...sourceFilters };
      }
      
      // קריאה לפונקציית callback אם קיימת
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  }, [onFilterChange]);

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
      
      if (lastAppliedFilter === id) {
        setLastAppliedFilter(null);
      }
      
      return updated;
    });
  }, [localStorageKey, lastAppliedFilter]);

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

  // Load saved filter - תמיכה בסינון נפרד
  const loadSavedFilter = useCallback((id: string) => {
    const filter = savedFilters.find(f => f.id === id);
    if (filter) {
      // בדוק אם יש בפילטר השמור מידע לגבי סינון נפרד
      setFilters({ 
        ...filter.filters, 
        savedFilterId: id,
        // וודא שיש תמיד את המאפיינים האלה, גם אם אינם מוגדרים בפילטר המקורי
        separateFiltering: true as boolean,        maleFilters: filter.filters.maleFilters || {},
        femaleFilters: filter.filters.femaleFilters || {}
      });
      
      setLastAppliedFilter(id);
      onFilterChange?.({ 
        ...filter.filters, 
        savedFilterId: id,
        separateFiltering: true as boolean,        maleFilters: filter.filters.maleFilters || {},
        femaleFilters: filter.filters.femaleFilters || {} 
      });
    }
  }, [savedFilters, onFilterChange]);

  // Apply popular filter
  const applyPopularFilter = useCallback((filterConfig: Partial<FilterState>) => {
    const updatedFilters = {
      ...DEFAULT_FILTER_STATE,
      ...filterConfig
    };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  }, [onFilterChange]);

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
      )) ||
      // בדיקת פילטרים נפרדים פעילים
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
    setFilters(prev => {
      const updated = { ...prev };

      if (key === 'separateFiltering') {
        updated.separateFiltering = false;
      } else if (Array.isArray(updated[key]) && value !== undefined) {
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
  
  // Calculate popular filters based on search history
  const popularFilters = useMemo(() => {
    // Group searches by frequency
    const searchFrequency: Record<string, number> = {};
    searchHistory.forEach(item => {
      searchFrequency[item.query] = (searchFrequency[item.query] || 0) + 1;
    });
    
    // Sort by frequency
    return Object.entries(searchFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }, [searchHistory]);

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