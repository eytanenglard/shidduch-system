// src/components/profile/sections/neshma-insight/useNeshmaInsight.ts

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type { NeshamaInsightReport } from '@/types/neshamaInsight';
import { COMPLETION_THRESHOLD, INSIGHT_COOLDOWN_HOURS } from '@/lib/constants/questionnaireConfig';
import { buildCopyText } from './insightPdfExport';

// =====================================================
// Types
// =====================================================

export interface NeshmaInsightHookParams {
  userId: string;
  locale: 'he' | 'en';
  completionPercentage: number;
  lastGeneratedAt?: string | Date | null;
  generatedCount?: number;
  userRole?: string;
  dict: {
    alreadyGeneratedToday?: string;
  };
}

export interface NeshmaInsightHookReturn {
  // State
  isOpen: boolean;
  isGenerating: boolean;
  isLoadingSaved: boolean;
  isDownloadingPdf: boolean;
  report: NeshamaInsightReport | null;
  reportRef: React.RefObject<HTMLDivElement | null>;

  // Derived state
  isHe: boolean;
  isPrivileged: boolean;
  isProfileComplete: boolean;
  hasGeneratedBefore: boolean;
  canGenerate: boolean;
  daysUntilNextGeneration: number;

  // Actions
  setIsOpen: (open: boolean) => void;
  setIsDownloadingPdf: (downloading: boolean) => void;
  handleViewSaved: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  copyToClipboard: () => void;
}

// =====================================================
// Hook
// =====================================================

export function useNeshmaInsight({
  userId,
  locale,
  completionPercentage,
  lastGeneratedAt,
  generatedCount = 0,
  userRole,
  dict,
}: NeshmaInsightHookParams): NeshmaInsightHookReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [report, setReport] = useState<NeshamaInsightReport | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Track local state so UI updates immediately after generation
  const [localGeneratedCount, setLocalGeneratedCount] = useState(generatedCount);
  const [localLastGeneratedAt, setLocalLastGeneratedAt] = useState<string | Date | null | undefined>(lastGeneratedAt);

  // Sync props when they change (e.g. page refresh)
  useEffect(() => {
    setLocalGeneratedCount(generatedCount);
  }, [generatedCount]);
  useEffect(() => {
    setLocalLastGeneratedAt(lastGeneratedAt);
  }, [lastGeneratedAt]);

  const isHe = locale === 'he';
  const isPrivileged = userRole === 'MATCHMAKER' || userRole === 'ADMIN';
  const isProfileComplete = completionPercentage >= COMPLETION_THRESHOLD || isPrivileged;
  const hasGeneratedBefore = localGeneratedCount > 0;

  const canGenerateToday = useCallback(() => {
    if (isPrivileged) return true;
    if (!localLastGeneratedAt) return true;
    const diffMs = Date.now() - new Date(localLastGeneratedAt).getTime();
    return diffMs / (1000 * 60 * 60) >= INSIGHT_COOLDOWN_HOURS;
  }, [isPrivileged, localLastGeneratedAt]);

  const canGenerate = isProfileComplete && canGenerateToday();

  // Calculate days remaining until next generation
  const daysUntilNextGeneration = useMemo(() => {
    if (!localLastGeneratedAt || isPrivileged) return 0;
    const diffMs = Date.now() - new Date(localLastGeneratedAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const remaining = Math.ceil(7 - diffDays);
    return remaining > 0 ? remaining : 0;
  }, [localLastGeneratedAt, isPrivileged]);

  // Fetch saved report from DB
  const handleViewSaved = async () => {
    setIsOpen(true);
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`/api/profile/neshama-insight?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report as NeshamaInsightReport);
      }
    } catch (err) {
      console.error('Error loading saved report:', err);
      toast.error(isHe ? 'שגיאה בטעינת הדוח' : 'Error loading report');
      setIsOpen(false);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Generate new report
  const handleGenerate = async () => {
    if (!canGenerate) {
      if (!isProfileComplete) {
        toast.error(
          isHe
            ? `יש להשלים את הפרופיל ל-${COMPLETION_THRESHOLD}% לפחות`
            : `Complete your profile to at least ${COMPLETION_THRESHOLD}%`
        );
      } else {
        toast.error(
          dict.alreadyGeneratedToday ||
          (isHe
            ? 'ניתן ליצור את התמונה המלאה פעם אחת בשבוע'
            : 'You can generate your Full Picture once a week')
        );
      }
      return;
    }

    setIsOpen(true);
    setIsGenerating(true);
    setReport(null);

    try {
      const res = await fetch('/api/profile/neshama-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate');
      }

      const data = await res.json();
      setReport(data.report as NeshamaInsightReport);

      // Update local state so the UI switches to "view saved" mode
      setLocalGeneratedCount((prev) => prev + 1);
      setLocalLastGeneratedAt(new Date().toISOString());

      toast.success(isHe ? 'התמונה המלאה נוצרה בהצלחה!' : 'Full Picture generated!');
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast.error(error.message || (isHe ? 'שגיאה ביצירת הדוח' : 'Error generating report'));
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!report) return;
    const text = buildCopyText(report, locale);
    navigator.clipboard.writeText(text);
    toast.success(isHe ? 'הדוח הועתק ללוח' : 'Report copied to clipboard');
  };

  return {
    // State
    isOpen,
    isGenerating,
    isLoadingSaved,
    isDownloadingPdf,
    report,
    reportRef,

    // Derived state
    isHe,
    isPrivileged,
    isProfileComplete,
    hasGeneratedBefore,
    canGenerate,
    daysUntilNextGeneration,

    // Actions
    setIsOpen,
    setIsDownloadingPdf,
    handleViewSaved,
    handleGenerate,
    copyToClipboard,
  };
}
