// src/components/matchmaker/new/hooks/useSavedFilters.ts
// Sub-hook: localStorage + server sync of saved filter presets

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FilterState, SavedFilter, FilterChangeHandler } from '../types/filters';

type SavedFilterFromStorage = Omit<SavedFilter, 'createdAt'> & {
  createdAt: string;
};

interface UseSavedFiltersProps {
  localStorageKey: string;
  onFilterChange?: FilterChangeHandler;
}

// Sync presets to server (fire-and-forget)
async function syncPresetsToServer(presets: SavedFilter[]) {
  try {
    await fetch('/api/matchmaker/filter-presets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presets }),
    });
  } catch {
    // Silent fail — localStorage is always the source of truth
  }
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
  const serverSyncedRef = useRef(false);

  // Load saved filters from localStorage, then try to merge from server
  useEffect(() => {
    // Load from localStorage first (instant)
    let localPresets: SavedFilter[] = [];
    try {
      const savedPrefs = localStorage.getItem(localStorageKey);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        localPresets = parsed.map((filter: SavedFilterFromStorage) => ({
          ...filter,
          createdAt: new Date(filter.createdAt)
        }));
        setSavedFilters(localPresets);
      }
    } catch {
      // localStorage may be unavailable
    }

    // Then try to load from server (for cross-device sync)
    if (!serverSyncedRef.current) {
      serverSyncedRef.current = true;
      fetch('/api/matchmaker/filter-presets')
        .then((res) => res.json())
        .then((data) => {
          if (data.presets?.length > 0 && localPresets.length === 0) {
            // Server has presets but local doesn't — use server data
            const serverPresets = data.presets.map((f: SavedFilterFromStorage) => ({
              ...f,
              createdAt: new Date(f.createdAt),
            }));
            setSavedFilters(serverPresets);
            localStorage.setItem(localStorageKey, JSON.stringify(data.presets));
          } else if (localPresets.length > 0) {
            // Local has presets — sync them to server
            syncPresetsToServer(localPresets);
          }
        })
        .catch(() => { /* silent */ });
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
      syncPresetsToServer(updated);
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
      syncPresetsToServer(updated);
      return updated;
    });
  }, [localStorageKey]);

  // Delete filter
  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      syncPresetsToServer(updated);

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
      syncPresetsToServer(updated);
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
