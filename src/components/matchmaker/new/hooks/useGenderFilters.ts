// src/components/matchmaker/new/hooks/useGenderFilters.ts
// Sub-hook: separate male/female filtering, copy filters between genders, gender-specific search queries

import { useCallback } from 'react';
import type { FilterState, FilterChangeHandler } from '../types/filters';

interface UseGenderFiltersProps {
  onFilterChange?: FilterChangeHandler;
  setFiltersState: React.Dispatch<React.SetStateAction<FilterState>>;
}

export interface UseGenderFiltersReturn {
  toggleSeparateFiltering: () => void;
  updateMaleFilters: (maleFilters: Partial<FilterState>) => void;
  updateFemaleFilters: (femaleFilters: Partial<FilterState>) => void;
  updateMaleSearchQuery: (query: string) => void;
  updateFemaleSearchQuery: (query: string) => void;
  copyFilters: (source: 'male' | 'female', target: 'male' | 'female') => void;
}

export const useGenderFilters = ({
  onFilterChange,
  setFiltersState,
}: UseGenderFiltersProps): UseGenderFiltersReturn => {

  // Toggle separate filtering mode
  const toggleSeparateFiltering = useCallback(() => {
    setFiltersState(prev => {
      const newState = {
        ...prev,
        separateFiltering: !prev.separateFiltering
      };

      return newState;
    });
  }, [setFiltersState]);

  // Update male-specific filters
  const updateMaleFilters = useCallback((maleFilters: Partial<FilterState>) => {
    setFiltersState(prev => {
      const updatedMaleFilters = {
        ...prev.maleFilters,
        ...maleFilters
      };

      // If there's a search query update specific to males
      if (maleFilters.searchQuery !== undefined) {
        const updated = {
          ...prev,
          maleFilters: updatedMaleFilters,
          maleSearchQuery: maleFilters.searchQuery
        };

        if (onFilterChange) {
          onFilterChange(updated);
        }

        return updated;
      }

      const updated = {
        ...prev,
        maleFilters: updatedMaleFilters
      };

      if (onFilterChange) {
        onFilterChange(updated);
      }

      return updated;
    });
  }, [onFilterChange, setFiltersState]);

  // Update female-specific filters
  const updateFemaleFilters = useCallback((femaleFilters: Partial<FilterState>) => {
    setFiltersState(prev => {
      const updatedFemaleFilters = {
        ...prev.femaleFilters,
        ...femaleFilters
      };

      // If there's a search query update specific to females
      if (femaleFilters.searchQuery !== undefined) {
        const updated = {
          ...prev,
          femaleFilters: updatedFemaleFilters,
          femaleSearchQuery: femaleFilters.searchQuery
        };

        if (onFilterChange) {
          onFilterChange(updated);
        }

        return updated;
      }

      const updated = {
        ...prev,
        femaleFilters: updatedFemaleFilters
      };

      if (onFilterChange) {
        onFilterChange(updated);
      }

      return updated;
    });
  }, [onFilterChange, setFiltersState]);

  // Update male search query
  const updateMaleSearchQuery = useCallback((query: string) => {
    setFiltersState(prev => {
      const updated = {
        ...prev,
        maleSearchQuery: query
      };

      // Also update male-specific filters if separate filtering is active
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
  }, [onFilterChange, setFiltersState]);

  // Update female search query
  const updateFemaleSearchQuery = useCallback((query: string) => {
    setFiltersState(prev => {
      const updated = {
        ...prev,
        femaleSearchQuery: query
      };

      // Also update female-specific filters if separate filtering is active
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
  }, [onFilterChange, setFiltersState]);

  // Copy filters from one gender to another
  const copyFilters = useCallback((source: 'male' | 'female', target: 'male' | 'female') => {
    setFiltersState(prev => {
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

      if (onFilterChange) {
        onFilterChange(updated);
      }

      return updated;
    });
  }, [onFilterChange, setFiltersState]);

  return {
    toggleSeparateFiltering,
    updateMaleFilters,
    updateFemaleFilters,
    updateMaleSearchQuery,
    updateFemaleSearchQuery,
    copyFilters,
  };
};

export default useGenderFilters;
