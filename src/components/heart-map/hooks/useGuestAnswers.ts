'use client';

import { useCallback, useRef } from 'react';
import type { SFAnswers } from '@/components/soul-fingerprint/types';

const STORAGE_KEY = 'neshamatech_heart_map';

export interface GuestHeartMapData {
  answers: SFAnswers;
  gender: 'MALE' | 'FEMALE';
  currentSectionIndex: number;
  startedAt: string;
  completedAt?: string;
}

export function useGuestAnswers() {
  const cacheRef = useRef<GuestHeartMapData | null>(null);

  const loadAnswers = useCallback((): GuestHeartMapData | null => {
    if (cacheRef.current) return cacheRef.current;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as GuestHeartMapData;
      cacheRef.current = data;
      return data;
    } catch {
      return null;
    }
  }, []);

  const saveAnswers = useCallback((data: GuestHeartMapData) => {
    try {
      cacheRef.current = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      // QuotaExceededError — silently fail, answers still in memory via cacheRef
      console.warn('[HeartMap] localStorage save failed:', err);
    }
  }, []);

  const clearAnswers = useCallback(() => {
    cacheRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const hasExistingProgress = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as GuestHeartMapData;
      return Object.keys(data.answers).length > 0;
    } catch {
      return false;
    }
  }, []);

  return { loadAnswers, saveAnswers, clearAnswers, hasExistingProgress };
}

/** Static helpers for use outside React (e.g., registration flow) */
export function getGuestHeartMapData(): GuestHeartMapData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestHeartMapData;
  } catch {
    return null;
  }
}

export function clearGuestHeartMapData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
