// =============================================================================
// src/components/matchmaker/PotentialMatches/hooks/usePotentialMatches.ts
// =============================================================================
// 🎯 Hook לניהול התאמות פוטנציאליות - V3.0 Unified
//
// ✅ Features:
// - Advanced Pagination & Filtering (From V2)
// - Bulk Actions & Selection Management (From V2)
// - SSE Streaming for Real-time Scan Progress (From V3)
// - Robust Async Scan with Polling Fallback (From V3)
// - Comprehensive State Management
// =============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

// --- Data Types ---
export interface PotentialMatch {
  id: string;
  maleUserId: string;
  femaleUserId: string;
  aiScore: number;
  scoreForMale?: number | null;
  scoreForFemale?: number | null;
  shortReasoning?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'SENT' | 'DECLINED';
  scannedAt: Date;
  hasWarning?: boolean;
  // Expanded user objects
  male: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: any;
    images?: Array<{ url: string; isMain: boolean }>;
  };
  female: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: any;
    images?: Array<{ url: string; isMain: boolean }>;
  };
}

export interface PotentialMatchesStats {
  total: number;
  pending: number;
  reviewed: number;
  shortlisted: number;
  sent: number;
  declined: number;
}

export interface LastScanInfo {
  date: Date;
  matchCount: number;
  durationMs: number;
}

// --- Filter & Pagination Types ---
export type PotentialMatchSortBy = 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc';

export interface PotentialMatchFilters {
  searchTerm?: string;
  status: string; // 'pending' | 'reviewed' | ...
  minScore: number;
  maxScore: number;
  religiousLevel: string | null;
  city: string | null;
  hasWarning: boolean | null;
  scannedAfter: Date | null;
  sortBy: PotentialMatchSortBy;
}

// --- Scan Types (V3) ---
export interface ScanProgress {
  phase: string;
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  progressPercent: number;
  // Detailed stats
  pairsEvaluated: number;
  pairsPassedQuickFilter: number;
  pairsPassedVectorFilter: number;
  pairsSentToAi: number;
  matchesFoundSoFar: number;
  // System
  scanId: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  message?: string;
  error?: string | null;
}

export interface ScanResult {
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  durationMs: number;
}

export interface ScanOptions {
  method?: 'algorithmic' | 'vector' | 'hybrid'; // Kept for V2 compatibility
  action?: 'full_scan' | 'scan_single' | 'scan_new_users'; // V3 actions
  forceRefresh?: boolean;
  incremental?: boolean;
  userId?: string;
  userIds?: string[];
  useStreaming?: boolean;
}

// --- Hook Return Interface ---
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

  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  isActioning: boolean;
  
  // Scan States (Enhanced)
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scanResult: ScanResult | null;
  
  // Filters
  filters: PotentialMatchFilters;
  setFilters: (filters: Partial<PotentialMatchFilters>) => void;
  resetFilters: () => void;

  // Pagination Controls
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

  // Bulk Actions
  bulkDismiss: (matchIds: string[], reason?: string) => Promise<number>;
  bulkReview: (matchIds: string[]) => Promise<number>;
  bulkRestore: (matchIds: string[]) => Promise<number>;

  // Scan Controls
  startScan: (options?: ScanOptions) => Promise<string | null>;
  cancelScan: () => Promise<boolean>;

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
// CONSTANTS & DEFAULTS
// =============================================================================
const API_BASE_SCAN = '/api/ai/batch-scan-all';
const API_BASE_MATCHES = '/api/matchmaker/potential-matches';
const POLLING_INTERVAL = 3000;

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
export function usePotentialMatches(options: {
  initialFilters?: Partial<PotentialMatchFilters>;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}): UsePotentialMatchesReturn {
  const {
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  // --- State: Data & UI ---
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [stats, setStats] = useState<PotentialMatchesStats | null>(null);
  const [lastScanInfo, setLastScanInfo] = useState<LastScanInfo | null>(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFiltersState] = useState<PotentialMatchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- State: Loading ---
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // --- State: Scanning (V3 Enhanced) ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  // --- Refs ---
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastFiltersRef = useRef<PotentialMatchFilters>(filters);

  // Update ref when filters change
  useEffect(() => {
    lastFiltersRef.current = filters;
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  const fetchMatches = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));
      
      // Filter Mapping
      if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
      params.set('status', filters.status);
      params.set('minScore', String(filters.minScore));
      params.set('maxScore', String(filters.maxScore));
      params.set('sortBy', filters.sortBy);
      
      if (filters.hasWarning !== null) params.set('hasWarning', String(filters.hasWarning));
      if (filters.religiousLevel) params.set('religiousLevel', filters.religiousLevel);
      if (filters.city) params.set('city', filters.city);

      const response = await fetch(`${API_BASE_MATCHES}?${params.toString()}`);
      const data = await response.json();

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
      // Don't show toast for background refresh errors to avoid spam
      if (showLoadingState) toast.error(message);
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
  // FILTERS & PAGINATION
  // ==========================================================================
  const setFilters = useCallback((newFilters: Partial<PotentialMatchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

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
    action: string,
    additionalData?: any
  ): Promise<boolean> => {
    setIsActioning(true);
    try {
      // Note: Using generic endpoint to maintain compatibility with V2 implementation
      // or specific endpoint if required. Assuming V2 Generic POST structure:
      const response = await fetch(API_BASE_MATCHES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, ...additionalData }),
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Action failed');

      // Optimistic Updates
      setMatches(prev => {
        if (action === 'dismiss') return prev.filter(m => m.id !== matchId);
        
        const statusMap: Record<string, any> = {
          'review': 'REVIEWED',
          'restore': 'PENDING',
          'save': 'SHORTLISTED',
          'create_suggestion': 'SENT'
        };

        if (statusMap[action]) {
          return prev.map(m => m.id === matchId ? { ...m, status: statusMap[action] } : m);
        }
        return prev;
      });

      // Update selection if item removed
      if (action === 'dismiss') {
        setSelectedMatchIds(prev => prev.filter(id => id !== matchId));
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'הפעולה נכשלה';
      toast.error(message);
      return false;
    } finally {
      setIsActioning(false);
    }
  }, []);

  const reviewMatch = (id: string) => performAction(id, 'review');
  
  const dismissMatch = async (id: string, reason?: string) => {
    const success = await performAction(id, 'dismiss', { reason });
    if (success) toast.success('ההתאמה נדחתה');
    return success;
  };
  
  const restoreMatch = async (id: string) => {
    const success = await performAction(id, 'restore');
    if (success) toast.success('ההתאמה שוחזרה');
    return success;
  };
  
  const saveMatch = async (id: string) => {
    const success = await performAction(id, 'save');
    if (success) toast.success('ההתאמה נשמרה');
    return success;
  };

  const createSuggestion = useCallback(async (matchId: string, data?: any) => {
    setIsActioning(true);
    try {
      const response = await fetch(API_BASE_MATCHES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action: 'create_suggestion', ...data }),
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'SENT' } : m));
      toast.success('הצעה נוצרה בהצלחה!');
      return result.suggestionId;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה ביצירת הצעה');
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
      const response = await fetch(API_BASE_MATCHES, {
        method: 'DELETE', // As per V2 spec
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchIds, action, reason }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      await fetchMatches(false);
      setSelectedMatchIds([]);
      return data.processed;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'פעולה מרובה נכשלה');
      return 0;
    } finally {
      setIsActioning(false);
    }
  }, [fetchMatches]);

  const bulkDismiss = (ids: string[], reason?: string) => performBulkAction(ids, 'dismiss', reason).then(c => { if(c) toast.success(`${c} התאמות נדחו`); return c; });
  const bulkReview = (ids: string[]) => performBulkAction(ids, 'review').then(c => { if(c) toast.success(`${c} התאמות סומנו`); return c; });
  const bulkRestore = (ids: string[]) => performBulkAction(ids, 'restore').then(c => { if(c) toast.success(`${c} התאמות שוחזרו`); return c; });

  // ==========================================================================
  // SCAN LOGIC - V3.0 (Streaming + Polling)
  // ==========================================================================
  
  // Helper to process progress updates
  const updateScanState = useCallback((data: any) => {
    if (!data) return;
    
    setScanProgress({
      phase: data.phase || 'running',
      currentUserIndex: data.currentUserIndex || 0,
      totalUsers: data.totalUsers || 0,
      currentUserName: data.currentUserName,
      progressPercent: data.progressPercent || 0,
      pairsEvaluated: data.stats?.pairsEvaluated || data.candidatesScanned || 0,
      pairsPassedQuickFilter: data.stats?.pairsPassedQuickFilter || 0,
      pairsPassedVectorFilter: data.stats?.pairsPassedVectorFilter || 0,
      pairsSentToAi: data.stats?.pairsSentToAi || 0,
      matchesFoundSoFar: data.stats?.matchesFoundSoFar || data.matchesFound || 0,
      scanId: data.scanId || data.id,
      status: data.status || 'running',
      message: data.message,
      error: data.error
    });
  }, []);

  const handleScanCompletion = useCallback((result: ScanResult | null) => {
    setIsScanning(false);
    setActiveScanId(null);
    setScanResult(result);
    
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (eventSourceRef.current) eventSourceRef.current.close();

    const matchesFound = result?.matchesFound ?? 0;
    const newMatches = result?.newMatches ?? 0;
    
    toast.success('הסריקה הושלמה!', {
      description: `נמצאו ${matchesFound} התאמות (${newMatches} חדשות)`,
      duration: 5000,
    });
    
    // Refresh list
    fetchMatches(false);
  }, [fetchMatches]);

  const startPolling = useCallback((scanId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_SCAN}?scanId=${scanId}`);
        const data = await res.json();
        
        if (data.success && data.scan) {
          updateScanState(data.scan);
          
          if (['completed', 'failed', 'partial'].includes(data.scan.status)) {
            if (data.scan.status === 'failed') {
               setIsScanning(false);
               toast.error(data.scan.error || 'הסריקה נכשלה');
            } else {
               handleScanCompletion({
                 matchesFound: data.scan.matchesFound,
                 newMatches: data.scan.newMatches,
                 updatedMatches: 0,
                 durationMs: data.scan.durationMs
               });
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };
    
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
    poll();
  }, [updateScanState, handleScanCompletion]);

  const startSSETracking = useCallback((scanId: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const evtSource = new EventSource(`${API_BASE_SCAN}?scanId=${scanId}&stream=true`);
    eventSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          updateScanState(data);
        } else if (data.type === 'complete') {
          handleScanCompletion(data.result);
        } else if (data.type === 'error') {
          setIsScanning(false);
          toast.error('שגיאה בסריקה', { description: data.error });
          evtSource.close();
        }
      } catch (e) {
        console.error('SSE Parse Error', e);
      }
    };

    evtSource.onerror = () => {
      console.warn('SSE disconnected, falling back to polling');
      evtSource.close();
      startPolling(scanId);
    };
  }, [updateScanState, handleScanCompletion, startPolling]);

  const startScan = useCallback(async (opts: ScanOptions = {}): Promise<string | null> => {
    if (isScanning) {
      toast.warning('סריקה כבר רצה');
      return activeScanId;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanProgress(null);

    const {
      useStreaming = true,
      action = 'full_scan',
      forceRefresh = false,
      incremental = false,
      userId, userIds
    } = opts;

    try {
      const response = await fetch(API_BASE_SCAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          forceRefresh,
          incremental,
          userId,
          userIds
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.status === 'already_running') {
          toast.warning('סריקה כבר רצה ברקע');
          setActiveScanId(data.scanId);
          startPolling(data.scanId); // Catch up with existing scan
          return data.scanId;
        }
        throw new Error(data.error || 'Failed to start scan');
      }

      toast.info('הסריקה החלה!');
      setActiveScanId(data.scanId);

      if (useStreaming && typeof EventSource !== 'undefined') {
        startSSETracking(data.scanId);
      } else {
        startPolling(data.scanId);
      }

      return data.scanId;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'הפעלת הסריקה נכשלה';
      toast.error(msg);
      setIsScanning(false);
      return null;
    }
  }, [isScanning, activeScanId, startSSETracking, startPolling]);

  const cancelScan = useCallback(async (): Promise<boolean> => {
    if (!activeScanId) return false;
    try {
      await fetch(API_BASE_SCAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', scanId: activeScanId }),
      });
      
      setIsScanning(false);
      setActiveScanId(null);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
      
      toast.info('הסריקה בוטלה');
      return true;
    } catch (err) {
      console.error('Cancel error:', err);
      return false;
    }
  }, [activeScanId]);

  // ==========================================================================
  // SELECTION HELPERS
  // ==========================================================================
  const toggleSelection = useCallback((matchId: string) => {
    setSelectedMatchIds(prev =>
      prev.includes(matchId) ? prev.filter(id => id !== matchId) : [...prev, matchId]
    );
  }, []);

  const selectAll = useCallback(() => setSelectedMatchIds(matches.map(m => m.id)), [matches]);
  const clearSelection = useCallback(() => setSelectedMatchIds([]), []);
  const isSelected = useCallback((matchId: string) => selectedMatchIds.includes(matchId), [selectedMatchIds]);

  // ==========================================================================
  // RETURN
  // ==========================================================================
  return {
    // Data
    matches,
    stats,
    lastScanInfo,
    pagination,
    
    // Status
    isLoading,
    isRefreshing,
    isActioning,
    error,
    
    // Scan Status
    isScanning,
    scanProgress,
    scanResult,
    
    // Filters
    filters,
    setFilters,
    resetFilters,
    
    // Pagination
    setPage,
    setPageSize,
    
    // Actions
    refresh: () => fetchMatches(false),
    reviewMatch,
    dismissMatch,
    restoreMatch,
    saveMatch,
    createSuggestion,
    
    // Bulk
    bulkDismiss,
    bulkReview,
    bulkRestore,
    
    // Scan Controls
    startScan,
    cancelScan,
    
    // Selection
    selectedMatchIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  };
}

export default usePotentialMatches;