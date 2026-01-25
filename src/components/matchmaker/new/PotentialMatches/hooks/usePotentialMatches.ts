// =============================================================================
// src/components/matchmaker/PotentialMatches/hooks/usePotentialMatches.ts
// React Hook לניהול התאמות פוטנציאליות - V2.0 with Async Scan Support
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  PotentialMatch,
  PotentialMatchesResponse,
  PotentialMatchesStats,
  LastScanInfo,
  PotentialMatchFilters,
  PotentialMatchSortBy,
  PotentialMatchFilterStatus,
  PotentialMatchAction,
  BatchScanResponse,
  BatchScanProgress,
} from '../types/potentialMatches';

// =============================================================================
// TYPES
// =============================================================================

interface UsePotentialMatchesOptions {
  initialFilters?: Partial<PotentialMatchFilters>;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

interface UsePotentialMatchesReturn {
  // Data
  matches: PotentialMatch[];
  stats: PotentialMatchesStats | null;
  lastScanInfo: LastScanInfo | null;
  
  // Pagination
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isActioning: boolean;
  
  // Filters
  filters: PotentialMatchFilters;
  setFilters: (filters: Partial<PotentialMatchFilters>) => void;
  resetFilters: () => void;
  
  // Pagination controls
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Actions
  refresh: () => Promise<void>;
  reviewMatch: (matchId: string) => Promise<boolean>;
  dismissMatch: (matchId: string, reason?: string) => Promise<boolean>;
  restoreMatch: (matchId: string) => Promise<boolean>;
  saveMatch: (matchId: string) => Promise<boolean>;
  createSuggestion: (matchId: string, data?: {
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    firstPartyNotes?: string;
    secondPartyNotes?: string;
    matchingReason?: string;
  }) => Promise<string | null>;
  
  // Bulk actions
  bulkDismiss: (matchIds: string[], reason?: string) => Promise<number>;
  bulkReview: (matchIds: string[]) => Promise<number>;
  bulkRestore: (matchIds: string[]) => Promise<number>;
  
  // Scan controls
  startScan: (options?: {
    method?: 'algorithmic' | 'vector' | 'hybrid';
    forceRefresh?: boolean;
  }) => Promise<string | null>;
  cancelScan: () => Promise<boolean>;
  scanProgress: BatchScanProgress | null;
  isScanRunning: boolean;
  
  // Selection
  selectedMatchIds: string[];
  toggleSelection: (matchId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (matchId: string) => boolean;
  
  // Error
  error: string | null;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_FILTERS: PotentialMatchFilters = {
  status: 'pending',
  minScore: 70,
  maxScore: 100,
  religiousLevel: null,
  city: null,
  hasWarning: null,
  scannedAfter: null,
  sortBy: 'score_desc',
};

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function usePotentialMatches(
  options: UsePotentialMatchesOptions = {}
): UsePotentialMatchesReturn {
  
  const { 
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  // State
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [stats, setStats] = useState<PotentialMatchesStats | null>(null);
  const [lastScanInfo, setLastScanInfo] = useState<LastScanInfo | null>(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  
  const [filters, setFiltersState] = useState<PotentialMatchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  
  const [scanProgress, setScanProgress] = useState<BatchScanProgress | null>(null);
  const [isScanRunning, setIsScanRunning] = useState(false);
  const [pollingScanId, setPollingScanId] = useState<string | null>(null);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================

  const fetchMatches = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
      if (filters.searchTerm) {
        params.set('searchTerm', filters.searchTerm);
      }
      params.set('status', filters.status);
      params.set('minScore', String(filters.minScore));
      params.set('maxScore', String(filters.maxScore));
      params.set('sortBy', filters.sortBy);
      
      if (filters.hasWarning !== null) {
        params.set('hasWarning', String(filters.hasWarning));
      }
      if (filters.religiousLevel) {
        params.set('religiousLevel', filters.religiousLevel);
      }
      if (filters.city) {
        params.set('city', filters.city);
      }

      const response = await fetch(`/api/matchmaker/potential-matches?${params.toString()}`);
      const data: PotentialMatchesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch matches');
      }

      setMatches(data.matches);
      setStats(data.stats);
      setLastScanInfo(data.lastScanInfo);
      setPagination(data.pagination);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בטעינת ההתאמות';
      setError(message);
      console.error('[usePotentialMatches] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchMatches(true);
  }, [fetchMatches]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMatches(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMatches]);

  // ==========================================================================
  // FILTERS
  // ==========================================================================

  const setFilters = useCallback((newFilters: Partial<PotentialMatchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // ==========================================================================
  // SINGLE ACTIONS
  // ==========================================================================

  const performAction = useCallback(async (
    matchId: string,
    action: PotentialMatchAction,
    additionalData?: any
  ): Promise<boolean> => {
    setIsActioning(true);
    
    try {
      const response = await fetch('/api/matchmaker/potential-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, ...additionalData }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Action failed');
      }

      // Update local state based on action
      if (action === 'dismiss') {
        setMatches(prev => prev.filter(m => m.id !== matchId));
      } else if (action === 'review') {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'REVIEWED' as any } : m
        ));
      } else if (action === 'restore') {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'PENDING' as any } : m
        ));
      } else if (action === 'save') {
        setMatches(prev => prev.map(m => 
          m.id === matchId ? { ...m, status: 'SHORTLISTED' as any } : m
        ));
      }

      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'הפעולה נכשלה';
      toast.error(message);
      console.error('[usePotentialMatches] Action error:', err);
      return false;
    } finally {
      setIsActioning(false);
    }
  }, []);

  const reviewMatch = useCallback(async (matchId: string): Promise<boolean> => {
    return performAction(matchId, 'review');
  }, [performAction]);

  const dismissMatch = useCallback(async (matchId: string, reason?: string): Promise<boolean> => {
    const success = await performAction(matchId, 'dismiss', { reason });
    if (success) toast.success('ההתאמה נדחתה');
    return success;
  }, [performAction]);

  const restoreMatch = useCallback(async (matchId: string): Promise<boolean> => {
    const success = await performAction(matchId, 'restore');
    if (success) toast.success('ההתאמה שוחזרה');
    return success;
  }, [performAction]);

  const saveMatch = useCallback(async (matchId: string): Promise<boolean> => {
    const success = await performAction(matchId, 'save');
    if (success) toast.success('ההתאמה נשמרה בצד');
    return success;
  }, [performAction]);

  // ==========================================================================
  // CREATE SUGGESTION
  // ==========================================================================

  const createSuggestion = useCallback(async (
    matchId: string,
    data?: {
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      firstPartyNotes?: string;
      secondPartyNotes?: string;
      matchingReason?: string;
    }
  ): Promise<string | null> => {
    setIsActioning(true);
    
    try {
      const response = await fetch('/api/matchmaker/potential-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId, 
          action: 'create_suggestion',
          ...data,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create suggestion');
      }

      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === matchId 
          ? { ...m, status: 'SENT' as any, suggestionId: result.suggestionId }
          : m
      ));

      toast.success('הצעה נוצרה בהצלחה!');
      return result.suggestionId;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'יצירת ההצעה נכשלה';
      toast.error(message);
      console.error('[usePotentialMatches] Create suggestion error:', err);
      return null;
    } finally {
      setIsActioning(false);
    }
  }, []);

  // ==========================================================================
  // BULK ACTIONS
  // ==========================================================================

  const performBulkAction = useCallback(async (
    matchIds: string[],
    action: 'dismiss' | 'review' | 'restore',
    reason?: string
  ): Promise<number> => {
    if (matchIds.length === 0) return 0;
    
    setIsActioning(true);
    
    try {
      const response = await fetch('/api/matchmaker/potential-matches', {
        method: 'DELETE', // Using DELETE for bulk actions
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchIds, action, reason }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Bulk action failed');
      }

      // Refresh data
      await fetchMatches(false);
      
      // Clear selection
      setSelectedMatchIds([]);
      
      return data.processed;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'הפעולה נכשלה';
      toast.error(message);
      console.error('[usePotentialMatches] Bulk action error:', err);
      return 0;
    } finally {
      setIsActioning(false);
    }
  }, [fetchMatches]);

  const bulkDismiss = useCallback(async (matchIds: string[], reason?: string): Promise<number> => {
    const count = await performBulkAction(matchIds, 'dismiss', reason);
    if (count > 0) toast.success(`${count} התאמות נדחו`);
    return count;
  }, [performBulkAction]);

  const bulkReview = useCallback(async (matchIds: string[]): Promise<number> => {
    const count = await performBulkAction(matchIds, 'review');
    if (count > 0) toast.success(`${count} התאמות סומנו כנבדקו`);
    return count;
  }, [performBulkAction]);

  const bulkRestore = useCallback(async (matchIds: string[]): Promise<number> => {
    const count = await performBulkAction(matchIds, 'restore');
    if (count > 0) toast.success(`${count} התאמות שוחזרו`);
    return count;
  }, [performBulkAction]);

  // ==========================================================================
  // SCAN CONTROLS - V2.0 Async
  // ==========================================================================

  const startScan = useCallback(async (scanOptions?: {
    method?: 'algorithmic' | 'vector' | 'hybrid';
    forceRefresh?: boolean;
  }): Promise<string | null> => {
    // בדוק אם סריקה כבר רצה
    if (isScanRunning) {
      toast.warning('סריקה כבר רצה כרגע');
      return pollingScanId;
    }
    
    setIsScanRunning(true);
    setScanProgress({
      scanId: '',
      status: 'running',
      progress: 0,
      currentCandidate: null,
      candidatesScanned: 0,
      totalCandidates: 0,
      matchesFound: 0,
      elapsedMs: 0,
      estimatedRemainingMs: null,
      error: null,
    });
    
    try {
      const response = await fetch('/api/ai/batch-scan-symmetric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'full_scan',
          forceRefresh: scanOptions?.forceRefresh ?? false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.status === 'already_running') {
          toast.warning('סריקה כבר רצה כרגע');
          setPollingScanId(data.scanId);
          return data.scanId;
        }
        throw new Error(data.message || data.error || 'Failed to start scan');
      }

      toast.success('הסריקה החלה!');
      setPollingScanId(data.scanId);
      
      // עדכון progress ראשוני
      setScanProgress(prev => prev ? {
        ...prev,
        scanId: data.scanId,
      } : null);
      
      return data.scanId;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'הפעלת הסריקה נכשלה';
      toast.error(message);
      console.error('[usePotentialMatches] Start scan error:', err);
      setIsScanRunning(false);
      setScanProgress(null);
      return null;
    }
  }, [isScanRunning, pollingScanId]);

  // Cancel scan
  const cancelScan = useCallback(async (): Promise<boolean> => {
    if (!pollingScanId) return false;
    
    try {
      const response = await fetch('/api/ai/batch-scan-symmetric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cancel',
          scanId: pollingScanId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.info('הסריקה בוטלה');
        setPollingScanId(null);
        setIsScanRunning(false);
        setScanProgress(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[usePotentialMatches] Cancel scan error:', err);
      return false;
    }
  }, [pollingScanId]);

  // Poll scan progress - V2.0 - polls the same endpoint with scanId
  useEffect(() => {
    if (!pollingScanId) return;

    const pollProgress = async () => {
      try {
        // Poll the same batch-scan-symmetric endpoint with scanId
        const response = await fetch(`/api/ai/batch-scan-symmetric?scanId=${pollingScanId}`);
        const data = await response.json();

        if (data.success && data.scan) {
          const scan = data.scan;
          
          setScanProgress({
            scanId: scan.id,
            status: scan.status,
            progress: scan.progress ?? 
              (scan.candidatesScanned && scan.totalCandidates 
                ? Math.round((scan.candidatesScanned / scan.totalCandidates) * 100)
                : 0),
            currentCandidate: scan.currentPhase || null,
            candidatesScanned: scan.candidatesScanned ?? 0,
            totalCandidates: scan.totalCandidates ?? 0,
            matchesFound: scan.matchesFound ?? 0,
            elapsedMs: scan.durationMs ?? 0,
            estimatedRemainingMs: null,
            error: scan.error,
          });

          // בדוק אם הסריקה הסתיימה
          if (scan.status === 'completed' || scan.status === 'failed' || scan.status === 'partial') {
            setPollingScanId(null);
            setIsScanRunning(false);
            
            if (scan.status === 'completed' || scan.status === 'partial') {
              const matchCount = scan.matchesFound ?? 0;
              const newMatchCount = scan.newMatches ?? 0;
              toast.success(`סריקה הושלמה! נמצאו ${matchCount} התאמות (${newMatchCount} חדשות)`);
              // רענן את ההתאמות
              fetchMatches(false);
            } else if (scan.status === 'failed') {
              toast.error(scan.error || 'הסריקה נכשלה');
            }
          }
        } else if (!data.success) {
          // Scan not found - might have completed and been cleaned up
          console.log('[usePotentialMatches] Scan not found, stopping polling');
          setPollingScanId(null);
          setIsScanRunning(false);
          // Refresh to get latest matches
          fetchMatches(false);
        }
      } catch (err) {
        console.error('[usePotentialMatches] Poll progress error:', err);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollProgress, 3000);
    
    // Initial poll immediately
    pollProgress();

    return () => clearInterval(interval);
  }, [pollingScanId, fetchMatches]);

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  const toggleSelection = useCallback((matchId: string) => {
    setSelectedMatchIds(prev => 
      prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedMatchIds(matches.map(m => m.id));
  }, [matches]);

  const clearSelection = useCallback(() => {
    setSelectedMatchIds([]);
  }, []);

  const isSelected = useCallback((matchId: string): boolean => {
    return selectedMatchIds.includes(matchId);
  }, [selectedMatchIds]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Data
    matches,
    stats,
    lastScanInfo,
    
    // Pagination
    pagination,
    
    // Loading states
    isLoading,
    isRefreshing,
    isActioning,
    
    // Filters
    filters,
    setFilters,
    resetFilters,
    
    // Pagination controls
    setPage,
    setPageSize,
    
    // Actions
    refresh: () => fetchMatches(false),
    reviewMatch,
    dismissMatch,
    restoreMatch,
    createSuggestion,
    saveMatch,
    
    // Bulk actions
    bulkDismiss,
    bulkReview,
    bulkRestore,
    
    // Scan controls
    startScan,
    cancelScan,
    scanProgress,
    isScanRunning,
    
    // Selection
    selectedMatchIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    
    // Error
    error,
  };
}

export default usePotentialMatches;