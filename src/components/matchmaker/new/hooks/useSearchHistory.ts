// src/components/matchmaker/new/hooks/useSearchHistory.ts
// Sub-hook: search history tracking, recent searches, popular filters computation

import { useState, useEffect, useMemo, useCallback } from 'react';

interface SearchHistoryItemFromStorage {
  query: string;
  timestamp: string;
}

interface UseSearchHistoryProps {
  localStorageKey: string;
}

export interface UseSearchHistoryReturn {
  recentSearches: string[];
  searchHistory: { query: string; timestamp: Date }[];
  popularFilters: string[];
  clearRecentSearches: () => void;
  addSearchQuery: (query: string) => void;
}

export const useSearchHistory = ({
  localStorageKey,
}: UseSearchHistoryProps): UseSearchHistoryReturn => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<{ query: string; timestamp: Date }[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
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
      // Error handled silently - localStorage may be unavailable
    }
  }, [localStorageKey]);

  // Add a search query to history
  const addSearchQuery = useCallback((newQuery: string) => {
    const updatedHistory = [
      { query: newQuery, timestamp: new Date() },
      ...searchHistory.filter(item => item.query !== newQuery).slice(0, 9)
    ];

    setSearchHistory(updatedHistory);
    setRecentSearches(updatedHistory.map(item => item.query));

    // Save to localStorage
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
      // Error handled silently - localStorage may be unavailable
    }
  }, [searchHistory, localStorageKey]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(`${localStorageKey}_recent_searches`);
  }, [localStorageKey]);

  // Calculate popular filters based on search history
  const popularFilters = useMemo(() => {
    const searchFrequency: Record<string, number> = {};
    searchHistory.forEach(item => {
      searchFrequency[item.query] = (searchFrequency[item.query] || 0) + 1;
    });

    return Object.entries(searchFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }, [searchHistory]);

  return {
    recentSearches,
    searchHistory,
    popularFilters,
    clearRecentSearches,
    addSearchQuery,
  };
};

export default useSearchHistory;
