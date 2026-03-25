// src/components/matchmaker/new/PotentialMatches/hooks/usePotentialMatches.ts
// 🆕 V2.3: Added active scan detection on page load

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

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

export type PotentialMatchSortBy = 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc' | 'asymmetry_desc';

export interface PotentialMatchFilters {
  searchTerm?: string;
  status: string;
  minScore: number;
  maxScore: number;
  religiousLevel: string | null;
  city: string | null;
  hasWarning: boolean | null;
  scannedAfter: Date | null;
  scannedBefore: Date | null;
  sortBy: PotentialMatchSortBy;
  gender?: 'MALE' | 'FEMALE' | null;
  maleAgeRange?: { min: number; max: number };
  femaleAgeRange?: { min: number; max: number };
  maleReligiousLevel?: string[];
  femaleReligiousLevel?: string[];
  scanMethod: string | null;
  // 🆕 V3: Advanced filters
  scanSessionId: string | null;
  availabilityFilter: 'available_only' | 'all';
  backgroundCompatibility: string[];
  maxAsymmetryGap: number | null;
  minConfidence: number | null;
  dataQuality: string | null;
  isExploratoryMatch: boolean | null;
  tier: 'excellent' | 'good' | 'fair' | null;
}

export interface ScanProgress {
  phase: string;
  method?: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  progressPercent: number;
  pairsEvaluated: number;
  pairsPassedQuickFilter: number;
  pairsPassedVectorFilter: number;
  pairsSentToAi: number;
  matchesFoundSoFar: number;
  // 🆕 V2.3: New fields
  newMatchesFoundSoFar?: number;
  usersScanned?: number;
  preparationStats?: {
    totalNeedingUpdate: number;
    currentIndex: number;
    currentUserName: string;
    updated: number;
    failed: number;
    skipped: number;              // 🆕
    currentStep: 'checking' | 'ai_summary' | 'metrics' | 'vectors' | 'done';  // 🆕
    aiCallsMade: number;          // 🆕
    embeddingCallsMade: number;   // 🆕
  };

  scanId: string;
  status: 'running' | 'completed' | 'failed' | 'partial' | 'cancelled' | 'resuming';
  message?: string;
  error?: string | null;
}

export interface ScanResult {
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  durationMs: number;
}

interface ScanOptions {
  useStreaming?: boolean;
  action?: 'full_scan' | 'scan_new_users' | 'scan_single';
  method?: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2';
  forceRefresh?: boolean;
  incremental?: boolean;
  userId?: string;
  userIds?: string[];
  skipPreparation?: boolean;
}

interface UsePotentialMatchesReturn {
  matches: PotentialMatch[];
  stats: PotentialMatchesStats | null;
  lastScanInfo: LastScanInfo | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  isLoading: boolean;
  isRefreshing: boolean;
  isActioning: boolean;
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scanResult: ScanResult | null;
  filters: PotentialMatchFilters;
  setFilters: (filters: Partial<PotentialMatchFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
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
    suppressNotifications?: boolean;
    swapParties?: boolean;
  }) => Promise<string | null>;
  bulkDismiss: (matchIds: string[], reason?: string) => Promise<number>;
  bulkReview: (matchIds: string[]) => Promise<number>;
  bulkRestore: (matchIds: string[]) => Promise<number>;
  bulkCreateSuggestions: (matchIds: string[], options?: {
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    suppressNotifications?: boolean;
  }) => Promise<{ success: number; failed: number; suggestionIds: string[] }>;
  startScan: (options?: ScanOptions) => Promise<string | null>;
  cancelScan: () => Promise<boolean>;
  selectedMatchIds: string[];
  toggleSelection: (matchId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (matchId: string) => boolean;
  error: string | null;
  // 🆕 V2.3: New property to indicate if we're reconnecting to an existing scan
  isReconnecting: boolean;
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
  scannedBefore: null,
  sortBy: 'score_desc',
  gender: null,
  scanMethod: null,
  maleAgeRange: undefined,
  femaleAgeRange: undefined,
  maleReligiousLevel: [],
  femaleReligiousLevel: [],
  // 🆕 V3: Advanced filters
  scanSessionId: null,
  availabilityFilter: 'all',
  backgroundCompatibility: [],
  maxAsymmetryGap: null,
  minConfidence: null,
  dataQuality: null,
  isExploratoryMatch: null,
  tier: null,
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

  // --- State: Scanning ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  
  // 🆕 V2.3: State for reconnection
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasCheckedForActiveScan, setHasCheckedForActiveScan] = useState(false);

  // --- Refs ---
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastFiltersRef = useRef<PotentialMatchFilters>(filters);

  useEffect(() => {
    lastFiltersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // ==========================================================================
  // 🆕 V2.3: CHECK FOR ACTIVE SCAN ON PAGE LOAD
  // ==========================================================================
  
  const checkForActiveScan = useCallback(async () => {
    if (hasCheckedForActiveScan) return;
    
    try {
      setIsReconnecting(true);

      const response = await fetch(`${API_BASE_SCAN}?checkActive=true`);
      const data = await response.json();

      if (data.success && data.hasActiveScan && data.scan) {
        
        // Set scanning state
        setIsScanning(true);
        setActiveScanId(data.scan.id);
        
        // Update progress from existing scan
        setScanProgress({
          phase: data.scan.phase || 'scanning',
          method: data.scan.method,
          currentUserIndex: data.scan.currentUserIndex || 0,
          totalUsers: data.scan.totalUsers || 0,
          currentUserName: data.scan.currentUserName,
          progressPercent: data.scan.progressPercent || 0,
          pairsEvaluated: data.scan.usersScanned || 0,
          pairsPassedQuickFilter: 0,
          pairsPassedVectorFilter: 0,
          pairsSentToAi: 0,
          matchesFoundSoFar: data.scan.matchesFoundSoFar || 0,
          newMatchesFoundSoFar: data.scan.newMatchesFoundSoFar || 0,
          usersScanned: data.scan.usersScanned || 0,
          preparationStats: data.scan.preparationStats,
          scanId: data.scan.id,
          status: 'running',
          message: data.scan.message || 'מתחבר לסריקה פעילה...',
        });
        
        // Start polling
        startPolling(data.scan.id);
        
        toast.info('מתחבר לסריקה פעילה...', {
          description: `נמצאה סריקה שרצה ברקע`,
        });
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setIsReconnecting(false);
      setHasCheckedForActiveScan(true);
    }
  }, [hasCheckedForActiveScan]);

  // Check for active scan on mount
  useEffect(() => {
    checkForActiveScan();
  }, [checkForActiveScan]);

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
      
      if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
      params.set('status', filters.status);
      params.set('minScore', String(filters.minScore));
      params.set('maxScore', String(filters.maxScore));
      params.set('sortBy', filters.sortBy);
      if (filters.scanMethod) {
        params.set('lastScanMethod', filters.scanMethod);
      }
      if (filters.hasWarning !== null) params.set('hasWarning', String(filters.hasWarning));
      if (filters.religiousLevel) params.set('religiousLevel', filters.religiousLevel);
      if (filters.city) params.set('city', filters.city);
      if (filters.maleAgeRange) {
        params.set('maleAgeMin', String(filters.maleAgeRange.min));
        params.set('maleAgeMax', String(filters.maleAgeRange.max));
      }
      if (filters.femaleAgeRange) {
        params.set('femaleAgeMin', String(filters.femaleAgeRange.min));
        params.set('femaleAgeMax', String(filters.femaleAgeRange.max));
      }
      if (filters.maleReligiousLevel && filters.maleReligiousLevel.length > 0) {
        params.set('maleReligiousLevel', filters.maleReligiousLevel.join(','));
      }
      if (filters.femaleReligiousLevel && filters.femaleReligiousLevel.length > 0) {
        params.set('femaleReligiousLevel', filters.femaleReligiousLevel.join(','));
      }
      // 🆕 V3: Advanced filters
      if (filters.scanSessionId) params.set('scanSessionId', filters.scanSessionId);
      if (filters.scannedAfter) params.set('scannedAfter', filters.scannedAfter.toISOString());
      if (filters.scannedBefore) params.set('scannedBefore', filters.scannedBefore.toISOString());
      if (filters.availabilityFilter && filters.availabilityFilter !== 'all') {
        params.set('availabilityFilter', filters.availabilityFilter);
      }
      if (filters.backgroundCompatibility && filters.backgroundCompatibility.length > 0) {
        params.set('backgroundCompatibility', filters.backgroundCompatibility.join(','));
      }
      if (filters.maxAsymmetryGap !== null) params.set('maxAsymmetryGap', String(filters.maxAsymmetryGap));
      if (filters.minConfidence !== null) params.set('minConfidence', String(filters.minConfidence));
      if (filters.dataQuality) params.set('dataQuality', filters.dataQuality);
      if (filters.isExploratoryMatch !== null) params.set('isExploratoryMatch', String(filters.isExploratoryMatch));
      if (filters.tier) params.set('tier', filters.tier);

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
      if (showLoadingState) toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchMatches(true);
  }, [fetchMatches]);

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
      const response = await fetch(API_BASE_MATCHES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, ...additionalData }),
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Action failed');

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

  const createSuggestion = useCallback(async (matchId: string, data?: {
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    firstPartyNotes?: string;
    secondPartyNotes?: string;
    matchingReason?: string;
    suppressNotifications?: boolean;
    swapParties?: boolean; 
  }) => {
    setIsActioning(true);
    try {
      const response = await fetch(API_BASE_MATCHES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId, 
          action: 'create_suggestion', 
          ...data 
        }),
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
        method: 'DELETE',
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

  const bulkCreateSuggestions = useCallback(async (
    matchIds: string[],
    options?: {
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      suppressNotifications?: boolean;
    }
  ): Promise<{ success: number; failed: number; suggestionIds: string[] }> => {
    if (matchIds.length === 0) {
      return { success: 0, failed: 0, suggestionIds: [] };
    }

    setIsActioning(true);
    const results = { success: 0, failed: 0, suggestionIds: [] as string[] };

    try {
      const chunkSize = 5;
      
      for (let i = 0; i < matchIds.length; i += chunkSize) {
        const chunk = matchIds.slice(i, i + chunkSize);
        
        const promises = chunk.map(async (matchId) => {
          try {
            const response = await fetch(API_BASE_MATCHES, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                matchId,
                action: 'create_suggestion',
                priority: options?.priority || 'MEDIUM',
                suppressNotifications: options?.suppressNotifications ?? false,
              }),
            });
            
            const result = await response.json();
            
            if (result.success && result.suggestionId) {
              results.success++;
              results.suggestionIds.push(result.suggestionId);
              return { success: true, matchId };
            } else {
              results.failed++;
              return { success: false, matchId, error: result.error };
            }
          } catch (err) {
            results.failed++;
            return { success: false, matchId, error: err };
          }
        });

        await Promise.all(promises);
      }

      setMatches(prev => prev.map(m => 
        matchIds.includes(m.id) ? { ...m, status: 'SENT' as const } : m
      ));

      setSelectedMatchIds([]);

      if (results.success > 0) {
        toast.success(`נוצרו ${results.success} הצעות בהצלחה!`, {
          description: results.failed > 0 ? `${results.failed} נכשלו` : undefined,
        });
      } else if (results.failed > 0) {
        toast.error(`כל ${results.failed} ההצעות נכשלו`);
      }

      await fetchMatches(false);

      return results;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה ביצירת הצעות מרובות';
      toast.error(msg);
      return results;
    } finally {
      setIsActioning(false);
    }
  }, [fetchMatches]);

  // ==========================================================================
  // SCAN LOGIC - 🆕 V2.3: With persistence support
  // ==========================================================================
  
  const updateScanState = useCallback((data: any) => {
    if (!data) return;
    
    setScanProgress({
      phase: data.phase || 'running',
      method: data.method,
      currentUserIndex: data.currentUserIndex || 0,
      totalUsers: data.totalUsers || 0,
      currentUserName: data.currentUserName,
      progressPercent: data.progressPercent || 0,
      pairsEvaluated: data.usersScanned || data.candidatesScanned || 0,
      pairsPassedQuickFilter: data.stats?.pairsPassedQuickFilter || 0,
      pairsPassedVectorFilter: data.stats?.pairsPassedVectorFilter || 0,
      pairsSentToAi: data.stats?.pairsSentToAi || 0,
      matchesFoundSoFar: data.matchesFoundSoFar || data.stats?.matchesFoundSoFar || 0,
      newMatchesFoundSoFar: data.newMatchesFoundSoFar || 0,
      usersScanned: data.usersScanned || 0,
      preparationStats: data.preparationStats,
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
          
          if (['completed', 'failed', 'partial', 'cancelled'].includes(data.scan.status) ||
              ['completed', 'failed', 'cancelled'].includes(data.scan.phase)) {
            if (data.scan.status === 'failed' || data.scan.phase === 'failed') {
              setIsScanning(false);
              setActiveScanId(null);
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              toast.error(data.scan.error || 'הסריקה נכשלה');
            } else if (data.scan.status === 'cancelled' || data.scan.phase === 'cancelled') {
              setIsScanning(false);
              setActiveScanId(null);
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              toast.info('הסריקה בוטלה');
            } else {
              handleScanCompletion({
                matchesFound: data.scan.matchesFoundSoFar || 0,
                newMatches: data.scan.newMatchesFoundSoFar || 0,
                updatedMatches: 0,
                durationMs: 0
              });
            }
          }
        }
      } catch (err) {
        // Error handled silently - polling will retry
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
        // Error handled silently - SSE parse failure
      }
    };

    evtSource.onerror = () => {
      console.warn('SSE disconnected, falling back to polling');
      evtSource.close();
      startPolling(scanId);
    };
  }, [updateScanState, handleScanCompletion, startPolling]);

  const getMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      hybrid: 'היברידית',
      algorithmic: 'AI מתקדם',
      vector: 'דמיון מהיר',
      metrics_v2: 'מדדים V2',
    };
    return labels[method] || method;
  };

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
      method = 'hybrid',
      forceRefresh = false,
      incremental = false,
      userId, 
      userIds,
      skipPreparation = false
    } = opts;

    try {
      const response = await fetch(API_BASE_SCAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          method,
          forceRefresh,
          incremental,
          userId,
          userIds,
          skipPreparation
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // 🆕 V2.3: Handle already running or resuming
        if (data.status === 'already_running' || data.status === 'resuming') {
          toast.info(data.status === 'resuming' ? 'ממשיך סריקה קודמת...' : 'סריקה כבר רצה ברקע');
          setActiveScanId(data.scanId);
          
          // If we have progress data, update state
          if (data.progress) {
            updateScanState(data.progress);
          }
          
          startPolling(data.scanId);
          return data.scanId;
        }
        throw new Error(data.error || 'Failed to start scan');
      }

      toast.info(`סריקת ${getMethodLabel(method)} החלה!`);
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
  }, [isScanning, activeScanId, startSSETracking, startPolling, updateScanState]);

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
      // Error handled silently
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
    matches,
    stats,
    lastScanInfo,
    pagination,
    isLoading,
    isRefreshing,
    isActioning,
    error,
    isScanning,
    scanProgress,
    scanResult,
    filters,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    refresh: () => fetchMatches(false),
    reviewMatch,
    dismissMatch,
    restoreMatch,
    saveMatch,
    createSuggestion,
    bulkDismiss,
    bulkReview,
    bulkRestore,
    startScan,
    cancelScan,
    selectedMatchIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkCreateSuggestions,
    // 🆕 V2.3
    isReconnecting,
  };
}

export default usePotentialMatches;