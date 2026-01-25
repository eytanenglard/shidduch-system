// =============================================================================
// 📁 src/components/matchmaker/PotentialMatches/hooks/usePotentialMatches.ts
// =============================================================================
// 🎯 Hook לניהול Potential Matches - V3.0
// 
// ✅ Features:
// - SSE streaming for real-time progress (with polling fallback)
// - Async scan with background processing
// - Progress tracking with toast notifications
// - Auto-refresh on completion
// - Incremental scan support
// =============================================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { BatchScanProgress } from '@/app/api/ai/batch-scan-symmetric/route';

// =============================================================================
// TYPES
// =============================================================================

export interface PotentialMatchData {
  id: string;
  maleUserId: string;
  femaleUserId: string;
  aiScore: number;
  scoreForMale?: number | null;
  scoreForFemale?: number | null;
  shortReasoning?: string | null;
  status: string;
  scannedAt: Date;
  male: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: {
      age?: number;
      city?: string | null;
      religiousLevel?: string | null;
      occupation?: string | null;
    } | null;
    images?: Array<{ url: string; isMain: boolean }>;
  };
  female: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: {
      age?: number;
      city?: string | null;
      religiousLevel?: string | null;
      occupation?: string | null;
    } | null;
    images?: Array<{ url: string; isMain: boolean }>;
  };
}

export interface ScanProgress {
  phase: string;
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  progressPercent: number;
  pairsEvaluated: number;
  pairsPassedQuickFilter: number;
  pairsPassedVectorFilter: number;
  pairsSentToAi: number;
  matchesFoundSoFar: number;
  message: string;
}

export interface ScanResult {
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  durationMs: number;
}

export interface UsePotentialMatchesReturn {
  // Data
  matches: PotentialMatchData[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Scan state
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  scanResult: ScanResult | null;
  scanId: string | null;
  
  // Actions
  fetchMatches: (filters?: FetchFilters) => Promise<void>;
  startScan: (options?: ScanOptions) => Promise<void>;
  cancelScan: () => Promise<void>;
  refreshMatches: () => Promise<void>;
  dismissMatch: (matchId: string, reason?: string) => Promise<void>;
  createSuggestion: (matchId: string) => Promise<void>;
}

export interface FetchFilters {
  status?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'aiScore' | 'scannedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ScanOptions {
  action?: 'full_scan' | 'scan_single' | 'scan_new_users' | 'scan_users';
  userId?: string;
  userIds?: string[];
  incremental?: boolean;
  forceRefresh?: boolean;
  useStreaming?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const POLLING_INTERVAL = 3000; // 3 seconds
const API_BASE = '/api/ai/batch-scan-symmetric';

// =============================================================================
// HOOK
// =============================================================================

export function usePotentialMatches(): UsePotentialMatchesReturn {
  // Data state
  const [matches, setMatches] = useState<PotentialMatchData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  
  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastFiltersRef = useRef<FetchFilters>({});

  // ==========================================================================
  // Cleanup on unmount
  // ==========================================================================
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ==========================================================================
  // Fetch Matches
  // ==========================================================================
  const fetchMatches = useCallback(async (filters: FetchFilters = {}) => {
    setIsLoading(true);
    setError(null);
    lastFiltersRef.current = filters;

    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.minScore) params.set('minScore', filters.minScore.toString());
      if (filters.maxScore) params.set('maxScore', filters.maxScore.toString());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const response = await fetch(`/api/matchmaker/potential-matches?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      
      setMatches(data.matches || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('שגיאה בטעינת התאמות', { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================================================
  // Start Scan
  // ==========================================================================
  const startScan = useCallback(async (options: ScanOptions = {}) => {
    const { 
      action = 'full_scan', 
      userId, 
      userIds, 
      incremental = false,
      forceRefresh = false,
      useStreaming = true,
    } = options;

    setIsScanning(true);
    setScanResult(null);
    setError(null);

    try {
      // Start the scan
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId,
          userIds,
          incremental,
          forceRefresh,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start scan');
      }

      const { scanId: newScanId, message } = await response.json();
      setScanId(newScanId);

      toast.info('סריקה התחילה', {
        description: message || 'מתחיל סריקה...',
        duration: 3000,
      });

      // Start progress tracking
      if (useStreaming && typeof EventSource !== 'undefined') {
        startSSETracking(newScanId);
      } else {
        startPolling(newScanId);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setIsScanning(false);
      toast.error('שגיאה בהתחלת סריקה', { description: message });
    }
  }, []);

  // ==========================================================================
  // SSE Streaming
  // ==========================================================================
  const startSSETracking = useCallback((scanIdToTrack: string) => {
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `${API_BASE}?scanId=${scanIdToTrack}&stream=true`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setScanProgress({
            phase: data.phase,
            currentUserIndex: data.currentUserIndex,
            totalUsers: data.totalUsers,
            currentUserName: data.currentUserName,
            progressPercent: data.progressPercent,
            pairsEvaluated: data.stats?.pairsEvaluated || 0,
            pairsPassedQuickFilter: data.stats?.pairsPassedQuickFilter || 0,
            pairsPassedVectorFilter: data.stats?.pairsPassedVectorFilter || 0,
            pairsSentToAi: data.stats?.pairsSentToAi || 0,
            matchesFoundSoFar: data.stats?.matchesFoundSoFar || 0,
            message: data.message,
          });
        }

        if (data.type === 'complete') {
          setScanResult(data.result);
          setIsScanning(false);
          eventSource.close();
          
          toast.success('הסריקה הושלמה!', {
            description: `נמצאו ${data.result.matchesFound} התאמות (${data.result.newMatches} חדשות)`,
            duration: 5000,
          });

          // Auto-refresh matches
          fetchMatches(lastFiltersRef.current);
        }

        if (data.type === 'error') {
          setError(data.error || data.message);
          setIsScanning(false);
          eventSource.close();
          
          toast.error('שגיאה בסריקה', {
            description: data.error || data.message,
          });
        }

      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection error, falling back to polling');
      eventSource.close();
      startPolling(scanIdToTrack);
    };
  }, [fetchMatches]);

  // ==========================================================================
  // Polling Fallback
  // ==========================================================================
  const startPolling = useCallback((scanIdToTrack: string) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}?scanId=${scanIdToTrack}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch scan status');
        }

        const data: BatchScanProgress = await response.json();

        setScanProgress(data.progress);

        if (data.status === 'completed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setIsScanning(false);
          if (data.result) {
            setScanResult(data.result);
          }

          toast.success('הסריקה הושלמה!', {
            description: `נמצאו ${data.result?.matchesFound || 0} התאמות (${data.result?.newMatches || 0} חדשות)`,
            duration: 5000,
          });

          // Auto-refresh matches
          fetchMatches(lastFiltersRef.current);
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setIsScanning(false);
          setError(data.error || 'Scan failed');

          if (data.status === 'cancelled') {
            toast.info('הסריקה בוטלה');
          } else {
            toast.error('שגיאה בסריקה', {
              description: data.error || 'Unknown error',
            });
          }
        }

      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Initial poll
    poll();

    // Start interval
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
  }, [fetchMatches]);

  // ==========================================================================
  // Cancel Scan
  // ==========================================================================
  const cancelScan = useCallback(async () => {
    if (!scanId) return;

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          scanId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel scan');
      }

      // Cleanup
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setIsScanning(false);
      setScanId(null);
      
      toast.info('הסריקה בוטלה');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('שגיאה בביטול', { description: message });
    }
  }, [scanId]);

  // ==========================================================================
  // Refresh Matches
  // ==========================================================================
  const refreshMatches = useCallback(async () => {
    await fetchMatches(lastFiltersRef.current);
    toast.success('התאמות עודכנו');
  }, [fetchMatches]);

  // ==========================================================================
  // Dismiss Match
  // ==========================================================================
  const dismissMatch = useCallback(async (matchId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/matchmaker/potential-matches/${matchId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss match');
      }

      // Update local state
      setMatches(prev => prev.filter(m => m.id !== matchId));
      setTotalCount(prev => prev - 1);
      
      toast.success('התאמה נדחתה');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('שגיאה בדחיית התאמה', { description: message });
    }
  }, []);

  // ==========================================================================
  // Create Suggestion
  // ==========================================================================
  const createSuggestion = useCallback(async (matchId: string) => {
    try {
      const response = await fetch(`/api/matchmaker/potential-matches/${matchId}/create-suggestion`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create suggestion');
      }

      const data = await response.json();

      // Update local state
      setMatches(prev => prev.map(m => 
        m.id === matchId ? { ...m, status: 'SENT' } : m
      ));
      
      toast.success('הצעה נוצרה בהצלחה!', {
        description: data.suggestionId ? `מספר הצעה: ${data.suggestionId}` : undefined,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('שגיאה ביצירת הצעה', { description: message });
    }
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================
  return {
    // Data
    matches,
    totalCount,
    isLoading,
    error,
    
    // Scan state
    isScanning,
    scanProgress,
    scanResult,
    scanId,
    
    // Actions
    fetchMatches,
    startScan,
    cancelScan,
    refreshMatches,
    dismissMatch,
    createSuggestion,
  };
}

export default usePotentialMatches;