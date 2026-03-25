import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import type { Candidate, CandidatesFilter } from '../types/candidates';
import type { CandidateProfile } from '../types/candidates';
import { Dispatch, SetStateAction } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseCandidatesReturn {
  loading: boolean;
  error: string | null;
  candidates: Candidate[];
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  filteredCandidates: Candidate[];
  filters: CandidatesFilter;
  setFilters: Dispatch<SetStateAction<CandidatesFilter>>;
  refresh: () => Promise<void>;
  totalCount: number;
  filteredCount: number;
  maleCount: number;
  femaleCount: number;
  searchResults: {
    term: string;
    count: number;
    male: number;
    female: number;
  } | null;
  exportCandidates: (candidates: Candidate[], filters: CandidatesFilter) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<CandidateProfile>) => Promise<void>;
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  setSorting: (field: string, direction: 'asc' | 'desc') => void;
  searchSuggestions: (term: string) => Promise<Candidate[]>;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  // Infinite scroll
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  // Bulk selection
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAllOnPage: () => void;
  clearSelection: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

const DEBOUNCE_MS = 300;

function buildQueryParams(
  filters: CandidatesFilter,
  sorting: { field: string; direction: 'asc' | 'desc' },
  pagination: { page: number; pageSize: number }
): URLSearchParams {
  const params = new URLSearchParams();

  // Pagination
  params.set('page', String(pagination.page));
  params.set('pageSize', String(pagination.pageSize));

  // Sorting
  params.set('sortBy', sorting.field);
  params.set('sortDirection', sorting.direction);

  // Gender (only when NOT in separate filtering mode)
  if (!filters.separateFiltering && filters.gender) {
    params.set('gender', filters.gender);
  }

  // Age range
  if (filters.ageRange?.min) params.set('ageMin', String(filters.ageRange.min));
  if (filters.ageRange?.max) params.set('ageMax', String(filters.ageRange.max));

  // Height range
  if (filters.heightRange?.min) params.set('heightMin', String(filters.heightRange.min));
  if (filters.heightRange?.max) params.set('heightMax', String(filters.heightRange.max));

  // Array filters (comma-separated)
  if (filters.cities?.length) params.set('cities', filters.cities.join(','));
  if (filters.religiousLevel?.length) params.set('religiousLevel', filters.religiousLevel.join(','));
  if (filters.languages?.length) params.set('languages', filters.languages.join(','));
  if (filters.occupations?.length) params.set('occupations', filters.occupations.join(','));
  if (filters.bodyType?.length) params.set('bodyType', filters.bodyType.join(','));
  if (filters.appearanceTone?.length) params.set('appearanceTone', filters.appearanceTone.join(','));
  if (filters.ethnicBackground?.length) params.set('ethnicBackground', filters.ethnicBackground.join(','));

  // Single-value filters
  if (filters.educationLevel) params.set('educationLevel', filters.educationLevel);
  if (filters.maritalStatus) params.set('maritalStatus', filters.maritalStatus);
  if (filters.availabilityStatus) params.set('availabilityStatus', String(filters.availabilityStatus));
  if (filters.userStatus) params.set('userStatus', String(filters.userStatus));
  if (filters.source) params.set('source', String(filters.source));

  // Boolean filters
  if (filters.isVerified) params.set('isVerified', 'true');
  if (filters.isProfileComplete) params.set('isProfileComplete', 'true');

  // Last active days
  if (filters.lastActiveDays) params.set('lastActiveDays', String(filters.lastActiveDays));

  // Search query
  if (!filters.separateFiltering && filters.searchQuery) {
    params.set('searchQuery', filters.searchQuery);
  }

  return params;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function checkSearchMatch(candidate: Candidate, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const normalizedTerm = searchTerm.toLowerCase().trim();
  if (!normalizedTerm) return true;

  const fullName = `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
  const city = (candidate.profile.city || '').toLowerCase();
  const occupation = (candidate.profile.occupation || '').toLowerCase();
  const religiousLevel = (candidate.profile.religiousLevel || '').toLowerCase();
  const email = (candidate.email || '').toLowerCase();
  const phone = (candidate.phone || '').toLowerCase();

  return (
    fullName.includes(normalizedTerm) ||
    city.includes(normalizedTerm) ||
    occupation.includes(normalizedTerm) ||
    religiousLevel.includes(normalizedTerm) ||
    email.includes(normalizedTerm) ||
    phone.includes(normalizedTerm)
  );
}

/**
 * Apply gender-specific sub-filters (used in separateFiltering mode)
 * These are additional client-side filters on top of server results
 */
function applyGenderSubFilters(
  candidates: Candidate[],
  subFilters: Partial<CandidatesFilter> | undefined,
  searchQuery: string | undefined
): Candidate[] {
  if (!subFilters && !searchQuery) return candidates;

  return candidates.filter((candidate) => {
    if (subFilters) {
      if (subFilters.ageRange) {
        const age = calculateAge(candidate.profile.birthDate);
        if (age < subFilters.ageRange.min || age > subFilters.ageRange.max) return false;
      }

      if (subFilters.heightRange && candidate.profile.height) {
        if (candidate.profile.height < subFilters.heightRange.min ||
            candidate.profile.height > subFilters.heightRange.max) return false;
      }

      if (subFilters.religiousLevel?.length) {
        const candidateLevel = candidate.profile.religiousLevel;
        const includeNotDefined = subFilters.religiousLevel.includes('not_defined');
        if (!candidateLevel) {
          if (!includeNotDefined) return false;
        } else {
          if (!subFilters.religiousLevel.includes(candidateLevel)) return false;
        }
      }

      if (subFilters.cities?.length && candidate.profile.city) {
        if (!subFilters.cities.includes(candidate.profile.city)) return false;
      }

      if (subFilters.languages?.length) {
        const native = (candidate.profile.nativeLanguage || '').toLowerCase();
        const additional = (candidate.profile.additionalLanguages || []).map(l => l.toLowerCase());
        const allLangs = [native, ...additional].filter(Boolean);
        const hasMatch = subFilters.languages.some(lang =>
          allLangs.some(l => l.includes(lang.toLowerCase()) || lang.toLowerCase().includes(l))
        );
        if (!hasMatch) return false;
      }

      if (subFilters.occupations?.length && candidate.profile.occupation) {
        if (!subFilters.occupations.includes(candidate.profile.occupation)) return false;
      }

      if (subFilters.educationLevel && candidate.profile.education !== subFilters.educationLevel) return false;
      if (subFilters.maritalStatus && candidate.profile.maritalStatus !== subFilters.maritalStatus) return false;

      if (subFilters.bodyType?.length && !(subFilters.bodyType as string[]).includes((candidate.profile as any).bodyType)) return false;
      if (subFilters.appearanceTone?.length && !(subFilters.appearanceTone as string[]).includes((candidate.profile as any).appearanceTone)) return false;
      if (subFilters.ethnicBackground?.length) {
        const origin = ((candidate.profile as any).origin || '') as string;
        const hasMatch = (subFilters.ethnicBackground as string[]).some((eb) => origin.includes(eb));
        if (!hasMatch) return false;
      }

      if (subFilters.isVerified !== undefined && candidate.isVerified !== subFilters.isVerified) return false;

      if (subFilters.lastActiveDays && candidate.profile.lastActive) {
        const lastActive = new Date(candidate.profile.lastActive);
        const daysDiff = (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > subFilters.lastActiveDays) return false;
      }

      if (subFilters.isProfileComplete !== undefined &&
          candidate.isProfileComplete !== subFilters.isProfileComplete) return false;

      if (subFilters.searchQuery) {
        return checkSearchMatch(candidate, subFilters.searchQuery);
      }
    }

    if (searchQuery) {
      return checkSearchMatch(candidate, searchQuery);
    }

    return true;
  });
}

// =============================================================================
// Hook
// =============================================================================

export const useCandidates = (
  initialFilters: CandidatesFilter = {},
  options: { skip?: boolean } = {}
): UseCandidatesReturn => {
  // Server data
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidatesFilter>(initialFilters);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [sorting, setSortingState] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({
    field: 'lastActive',
    direction: 'desc',
  });
  const [searchResults, setSearchResults] = useState<{
    term: string;
    count: number;
    male: number;
    female: number;
  } | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Loading more (infinite scroll) vs initial/filter loading
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounce ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // =========================================================================
  // Build gender-specific filters for separate filtering mode
  // =========================================================================
  const buildGenderQueryParams = useCallback((
    gender: 'MALE' | 'FEMALE',
    genderFilters: Partial<CandidatesFilter> | undefined,
    genderSearchQuery: string | undefined,
    currentSorting: { field: string; direction: 'asc' | 'desc' },
    page: number,
    pageSize: number
  ): URLSearchParams => {
    // Merge gender-specific filters with base filters (excluding gender/search overrides)
    const mergedFilters: CandidatesFilter = {
      ...genderFilters,
      gender,
      searchQuery: genderSearchQuery || undefined,
      separateFiltering: false, // Don't pass this to API
    };
    return buildQueryParams(mergedFilters, currentSorting, { page, pageSize });
  }, []);

  // =========================================================================
  // Fetch candidates from server with filters
  // =========================================================================
  const fetchCandidates = useCallback(async (
    overrideFilters?: CandidatesFilter,
    overrideSorting?: { field: string; direction: 'asc' | 'desc' },
    overridePage?: number,
    append?: boolean
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const currentFilters = overrideFilters || filters;
      const currentSorting = overrideSorting || sorting;
      const currentPage = overridePage || pagination.page;

      // === Separate filtering: dual API calls ===
      if (currentFilters.separateFiltering) {
        const maleParams = buildGenderQueryParams(
          'MALE',
          currentFilters.maleFilters,
          currentFilters.maleSearchQuery,
          currentSorting,
          currentPage,
          pagination.pageSize
        );
        const femaleParams = buildGenderQueryParams(
          'FEMALE',
          currentFilters.femaleFilters,
          currentFilters.femaleSearchQuery,
          currentSorting,
          currentPage,
          pagination.pageSize
        );

        const [maleRes, femaleRes] = await Promise.all([
          fetch(`/api/matchmaker/candidates?${maleParams.toString()}`),
          fetch(`/api/matchmaker/candidates?${femaleParams.toString()}`),
        ]);

        if (!maleRes.ok || !femaleRes.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const [maleData, femaleData] = await Promise.all([
          maleRes.json(),
          femaleRes.json(),
        ]);

        if (!maleData.success || !femaleData.success) {
          throw new Error(maleData.error || femaleData.error || 'Failed to load candidates');
        }

        const allCandidates = [
          ...(maleData.clients as Candidate[]),
          ...(femaleData.clients as Candidate[]),
        ];

        if (append) {
          setCandidates((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newCandidates = allCandidates.filter((c) => !existingIds.has(c.id));
            return [...prev, ...newCandidates];
          });
        } else {
          setCandidates(allCandidates);
        }

        // Use combined total for pagination
        const totalMale = maleData.pagination?.total ?? 0;
        const totalFemale = femaleData.pagination?.total ?? 0;
        setPagination((prev) => ({
          ...prev,
          page: currentPage,
          total: totalMale + totalFemale,
          totalPages: Math.max(
            maleData.pagination?.totalPages ?? 0,
            femaleData.pagination?.totalPages ?? 0
          ),
        }));
      } else {
        // === Standard filtering: single API call ===
        const params = buildQueryParams(currentFilters, currentSorting, {
          page: currentPage,
          pageSize: pagination.pageSize,
        });

        const response = await fetch(`/api/matchmaker/candidates?${params.toString()}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load candidates');
        }

        if (append) {
          setCandidates((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newCandidates = (data.clients as Candidate[]).filter(
              (c) => !existingIds.has(c.id)
            );
            return [...prev, ...newCandidates];
          });
        } else {
          setCandidates(data.clients);
        }

        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: data.pagination.page,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      // Error handled - error state is set above
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, sorting, pagination.page, pagination.pageSize, buildGenderQueryParams]);

  // =========================================================================
  // Load next page (infinite scroll)
  // =========================================================================
  const loadMore = useCallback(() => {
    if (isLoadingMore || loading) return;
    if (pagination.page >= pagination.totalPages) return;
    const nextPage = pagination.page + 1;
    fetchCandidates(filters, sorting, nextPage, true);
  }, [isLoadingMore, loading, pagination.page, pagination.totalPages, fetchCandidates, filters, sorting]);

  // =========================================================================
  // Debounced fetch when filters/sorting change
  // =========================================================================
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (options.skip) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Reset to page 1 when filters change (fresh load, not append)
      fetchCandidates(filters, sorting, 1, false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, sorting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch
  useEffect(() => {
    if (!options.skip) {
      fetchCandidates();
    }
  }, [options.skip]); // eslint-disable-line react-hooks/exhaustive-deps

  // =========================================================================
  // Derived data (gender split with client-side sub-filters)
  // =========================================================================

  const filteredCandidates = candidates;

  // In separate filtering mode, server already filtered per-gender
  // In unified mode, just split by gender from the combined result
  const maleCandidates = useMemo(() => {
    return candidates.filter((c) => c.profile.gender === 'MALE');
  }, [candidates]);

  const femaleCandidates = useMemo(() => {
    return candidates.filter((c) => c.profile.gender === 'FEMALE');
  }, [candidates]);

  // =========================================================================
  // Search results
  // =========================================================================
  useEffect(() => {
    if (!filters.separateFiltering && filters.searchQuery) {
      setSearchResults({
        term: filters.searchQuery,
        count: pagination.total,
        male: maleCandidates.length,
        female: femaleCandidates.length,
      });
    } else {
      setSearchResults(null);
    }
  }, [pagination.total, maleCandidates.length, femaleCandidates.length, filters.searchQuery, filters.separateFiltering]);

  // =========================================================================
  // Actions
  // =========================================================================

  const setSorting = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortingState({ field, direction });
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchCandidates(filters, sorting, page);
  }, [fetchCandidates, filters, sorting]);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // Bulk selection actions
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelectedIds(new Set(candidates.map((c) => c.id)));
  }, [candidates]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const searchSuggestions = useCallback(async (term: string): Promise<Candidate[]> => {
    if (!term || term.length < 2) return [];
    const searchTerm = term.toLowerCase();
    return candidates.filter((candidate) => {
      const searchableText = `
        ${candidate.firstName}
        ${candidate.lastName}
        ${candidate.profile.occupation || ''}
        ${candidate.profile.city || ''}
        ${candidate.profile.religiousLevel || ''}
        ${candidate.email || ''}
        ${candidate.phone || ''}
      `.toLowerCase();
      return searchableText.includes(searchTerm);
    }).slice(0, 10);
  }, [candidates]);

  const exportCandidates = useCallback(async (
    candidatesToExport: Candidate[],
    exportFilters: CandidatesFilter
  ): Promise<void> => {
    try {
      const exportData = candidatesToExport.map((candidate) => ({
        'שם פרטי': candidate.firstName,
        'שם משפחה': candidate.lastName,
        'גיל': calculateAge(candidate.profile.birthDate),
        'מגדר': candidate.profile.gender === 'MALE' ? 'זכר' : 'נקבה',
        'עיר': candidate.profile.city || '',
        'גובה': candidate.profile.height || '',
        'רמת דתיות': candidate.profile.religiousLevel || '',
        'תעסוקה': candidate.profile.occupation || '',
        'השכלה': candidate.profile.education || '',
        'מצב משפחתי': candidate.profile.maritalStatus || '',
        'סטטוס זמינות': candidate.profile.availabilityStatus || '',
        'מאומת': candidate.isVerified ? 'כן' : 'לא',
        'אימייל': candidate.email || '',
        'טלפון': candidate.phone || '',
        'פעילות אחרונה': candidate.profile.lastActive
          ? new Date(candidate.profile.lastActive).toLocaleDateString('he-IL')
          : '',
      }));

      const filenameSegments = ['candidates'];
      if (exportFilters.gender) {
        filenameSegments.push(exportFilters.gender === 'MALE' ? 'male' : 'female');
      }
      if (exportFilters.religiousLevel && exportFilters.religiousLevel.length > 0) {
        filenameSegments.push(exportFilters.religiousLevel.join('-').replace(/ /g, '-'));
      }
      if (exportFilters.cities?.length === 1) {
        filenameSegments.push(exportFilters.cities[0].replace(/ /g, '-'));
      }

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `${filenameSegments.join('_')}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Error propagated via throw below
      throw new Error('Failed to export candidates');
    }
  }, []);

  const updateCandidate = useCallback(async (
    id: string,
    updates: Partial<CandidateProfile>
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/matchmaker/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update candidate');
      }

      // Refresh current page
      await fetchCandidates();
    } catch (error) {
      // Error propagated via throw below
      throw error;
    }
  }, [fetchCandidates]);

  // =========================================================================
  // Return
  // =========================================================================
  return {
    loading,
    error,
    candidates,
    filteredCandidates,
    maleCandidates,
    femaleCandidates,
    filters,
    setFilters,
    refresh: fetchCandidates,
    totalCount: pagination.total,
    filteredCount: pagination.total,
    maleCount: maleCandidates.length,
    femaleCount: femaleCandidates.length,
    searchResults,
    exportCandidates,
    updateCandidate,
    sorting,
    setSorting,
    searchSuggestions,
    pagination,
    setPage,
    setPageSize,
    // Infinite scroll
    loadMore,
    isLoadingMore,
    hasMore: pagination.page < pagination.totalPages,
    // Bulk selection
    selectedIds,
    toggleSelection,
    selectAllOnPage,
    clearSelection,
  };
};
