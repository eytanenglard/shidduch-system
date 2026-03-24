'use client';

import { useState, useEffect } from 'react';
import type { CardData } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CARD_COUNT_OPTIONS = [5, 10, 20, 50];
export const MAX_IMAGES_PER_CARD = 5;
export const MAX_IMAGE_SIZE_MB = 10;

// ---------------------------------------------------------------------------
// Marital status mapping
// ---------------------------------------------------------------------------

export const MARITAL_STATUS_NORMALIZE: Record<string, string> = {
  single: 'SINGLE',
  divorced: 'DIVORCED',
  widowed: 'WIDOWED',
  SINGLE: 'SINGLE',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  רווק: 'SINGLE',
  רווקה: 'SINGLE',
  גרוש: 'DIVORCED',
  גרושה: 'DIVORCED',
  אלמן: 'WIDOWED',
  אלמנה: 'WIDOWED',
  פרוד: 'DIVORCED',
  פרודה: 'DIVORCED',
  separated: 'DIVORCED',
};

export const MARITAL_STATUS_DISPLAY: Record<string, string> = {
  SINGLE: 'רווק/ה',
  DIVORCED: 'גרוש/ה',
  WIDOWED: 'אלמן/ה',
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

export function normalizeMaritalStatus(value: string | null | undefined): string {
  if (!value) return 'SINGLE';
  return MARITAL_STATUS_NORMALIZE[value.trim()] || 'SINGLE';
}

export function createEmptyCard(): CardData {
  return {
    id: crypto.randomUUID(),
    images: [],
    rawText: '',
    extracted: null,
    status: 'empty',
    error: null,
    aiConfidence: null,
    aiNotes: null,
    savedCandidateId: null,
    aiPrepStatus: 'idle',
    aiPrepResult: null,
    aiPrepError: null,
  };
}

// ---------------------------------------------------------------------------
// Hook: detect mobile
// ---------------------------------------------------------------------------

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// ---------------------------------------------------------------------------
// Concurrency helper — run N tasks at a time
// ---------------------------------------------------------------------------

export async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  let index = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (index < items.length) {
        const currentIndex = index++;
        await fn(items[currentIndex]);
      }
    }
  );
  await Promise.all(workers);
}
