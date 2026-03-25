// src/components/matchmaker/new/hooks/useSavedFilters.ts
// Sub-hook: localStorage load/save of saved filter presets

import { useState, useEffect, useCallback } from 'react';
import type { FilterState, SavedFilter, FilterChangeHandler } from '../types/filters';

type SavedFilterFromStorage = Omit<SavedFilter, 'createdAt'> & {
  createdAt: string;
};

interface UseSavedFiltersProps {
  localStorageKey: string;
  onFilterChange?: FilterChangeHandler;
}

export interface UseSavedFiltersReturn {
  savedFilters: SavedFilter[];
  lastAppliedFilter: string | null;
  setLastAppliedFilter: (id: string | null) => void;
  saveFilter: (name: string, filters: FilterState) => Promise<SavedFilter>;
  updateSavedFilter: (id: string, updates: Partial<SavedFilter>) => void;
  deleteFilter: (id: string) => void;
  setDefaultFilter: (id: string) => void;
  loadSavedFilter: (id: string, setFilters: (filters: FilterState) => void) => void;
}

export const useSavedFilters = ({
  localStorageKey,
  onFilterChange,
}: UseSavedFiltersProps): UseSavedFiltersReturn => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [lastAppliedFilter, setLastAppliedFilter] = useState<string | null>(null);

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem(localStorageKey);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setSavedFilters(parsed.map((filter: SavedFilterFromStorage) => ({
          ...filter,
          createdAt: new Date(filter.createdAt)
        })));
      }
    } catch (error) {
      // Error handled silently - localStorage may be unavailable
    }
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

  // Load saved filter - support for separate filtering
  const loadSavedFilter = useCallback((id: string, setFilters: (filters: FilterState) => void) => {
    const filter = savedFilters.find(f => f.id === id);
    if (filter) {
      const loadedState: FilterState = {
        ...filter.filters,
        savedFilterId: id,
        separateFiltering: true as boolean,
        maleFilters: filter.filters.maleFilters || {},
        femaleFilters: filter.filters.femaleFilters || {}
      };

      setFilters(loadedState);
      setLastAppliedFilter(id);
      onFilterChange?.(loadedState);
    }
  }, [savedFilters, onFilterChange]);

  return {
    savedFilters,
    lastAppliedFilter,
    setLastAppliedFilter,
    saveFilter,
    updateSavedFilter,
    deleteFilter,
    setDefaultFilter,
    loadSavedFilter,
  };
};

export default useSavedFilters;
