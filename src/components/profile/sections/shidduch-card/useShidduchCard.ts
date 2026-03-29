// src/components/profile/sections/shidduch-card/useShidduchCard.ts

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { ShidduchCardFull } from '@/types/shidduchCard';

const COOLDOWN_HOURS = 72; // 3 days

export interface ShidduchCardHookParams {
  userId: string;
  locale: 'he' | 'en';
  lastGeneratedAt?: string | Date | null;
  generatedCount?: number;
  userRole?: string;
  hasSoulFingerprint?: boolean;
}

export interface ShidduchCardHookReturn {
  isOpen: boolean;
  isGenerating: boolean;
  isLoadingSaved: boolean;
  cardData: ShidduchCardFull | null;

  isHe: boolean;
  isPrivileged: boolean;
  isEligible: boolean;
  hasGeneratedBefore: boolean;
  canGenerate: boolean;
  daysUntilNextGeneration: number;

  setIsOpen: (open: boolean) => void;
  handleViewSaved: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  copyToClipboard: () => void;
}

export function useShidduchCard({
  userId,
  locale,
  lastGeneratedAt,
  generatedCount = 0,
  userRole,
  hasSoulFingerprint,
}: ShidduchCardHookParams): ShidduchCardHookReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [cardData, setCardData] = useState<ShidduchCardFull | null>(null);

  const [localGeneratedCount, setLocalGeneratedCount] = useState(generatedCount);
  const [localLastGeneratedAt, setLocalLastGeneratedAt] = useState<string | Date | null | undefined>(lastGeneratedAt);

  useEffect(() => { setLocalGeneratedCount(generatedCount); }, [generatedCount]);
  useEffect(() => { setLocalLastGeneratedAt(lastGeneratedAt); }, [lastGeneratedAt]);

  const isHe = locale === 'he';
  const isPrivileged = userRole === 'MATCHMAKER' || userRole === 'ADMIN';
  const isEligible = !!hasSoulFingerprint || isPrivileged;
  const hasGeneratedBefore = localGeneratedCount > 0;

  const canGenerateNow = useCallback(() => {
    if (isPrivileged) return true;
    if (!localLastGeneratedAt) return true;
    const diffMs = Date.now() - new Date(localLastGeneratedAt).getTime();
    return diffMs / (1000 * 60 * 60) >= COOLDOWN_HOURS;
  }, [isPrivileged, localLastGeneratedAt]);

  const canGenerate = isEligible && canGenerateNow();

  const daysUntilNextGeneration = useMemo(() => {
    if (!localLastGeneratedAt || isPrivileged) return 0;
    const diffMs = Date.now() - new Date(localLastGeneratedAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const remaining = Math.ceil(3 - diffDays);
    return remaining > 0 ? remaining : 0;
  }, [localLastGeneratedAt, isPrivileged]);

  const handleViewSaved = async () => {
    setIsOpen(true);
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`/api/profile/shidduch-card?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.card) {
        setCardData(data.card as ShidduchCardFull);
      }
    } catch (err) {
      console.error('Error loading Shidduch Card:', err);
      toast.error(isHe ? 'שגיאה בטעינת הכרטיס' : 'Error loading card');
      setIsOpen(false);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      if (!isEligible) {
        toast.error(
          isHe
            ? 'יש להשלים את מפת הלב / טביעת הנשמה כדי ליצור כרטיס'
            : 'Complete the Heart Map / Soul Fingerprint to generate a card'
        );
      } else {
        toast.error(
          isHe
            ? 'ניתן ליצור כרטיס חדש פעם בשלושה ימים'
            : 'You can generate a new card once every 3 days'
        );
      }
      return;
    }

    setIsOpen(true);
    setIsGenerating(true);
    setCardData(null);

    try {
      const res = await fetch('/api/profile/shidduch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, locale }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to generate');
      }

      const data = await res.json();
      setCardData(data.card as ShidduchCardFull);

      setLocalGeneratedCount((prev) => prev + 1);
      setLocalLastGeneratedAt(new Date().toISOString());

      toast.success(isHe ? 'כרטיס השידוכים נוצר בהצלחה!' : 'Shidduch Card generated!');
    } catch (error: any) {
      console.error('Error generating card:', error);
      toast.error(error.message || (isHe ? 'שגיאה ביצירת הכרטיס' : 'Error generating card'));
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!cardData) return;
    const text = buildCopyText(cardData, locale);
    navigator.clipboard.writeText(text);
    toast.success(isHe ? 'הכרטיס הועתק ללוח!' : 'Card copied to clipboard!');
  };

  return {
    isOpen,
    isGenerating,
    isLoadingSaved,
    cardData,
    isHe,
    isPrivileged,
    isEligible,
    hasGeneratedBefore,
    canGenerate,
    daysUntilNextGeneration,
    setIsOpen,
    handleViewSaved,
    handleGenerate,
    copyToClipboard,
  };
}

// =====================================================
// Build plain-text card for clipboard
// =====================================================

function buildCopyText(data: ShidduchCardFull, locale: 'he' | 'en'): string {
  const isHe = locale === 'he';
  const { card, meta } = data;
  const divider = '─'.repeat(30);

  const lines: string[] = [];

  // Header
  lines.push(card.headline);
  lines.push(divider);

  // Meta info
  const metaParts: string[] = [];
  if (meta.firstName) metaParts.push(meta.firstName);
  if (meta.age) metaParts.push(isHe ? `${meta.age}` : `${meta.age}`);
  if (meta.city) metaParts.push(meta.city);
  if (meta.religiousLevel) metaParts.push(meta.religiousLevel);
  if (meta.occupation) metaParts.push(meta.occupation);
  if (meta.height) metaParts.push(isHe ? `${meta.height} ס"מ` : `${meta.height}cm`);
  lines.push(metaParts.join(' | '));
  lines.push('');

  // About Me
  lines.push(isHe ? '🧑 מי אני:' : '🧑 About Me:');
  lines.push(card.aboutMe);
  lines.push('');

  // Looking For
  lines.push(isHe ? '💕 מה אני מחפש/ת:' : '💕 Looking For:');
  lines.push(card.lookingFor);
  lines.push('');

  // Tags
  if (card.strengthTags.length > 0) {
    lines.push(isHe ? '⭐ חוזקות:' : '⭐ Strengths:');
    lines.push(card.strengthTags.join(' • '));
    lines.push('');
  }

  if (card.coreTags.length > 0) {
    lines.push(isHe ? '💎 ערכים מרכזיים:' : '💎 Core Values:');
    lines.push(card.coreTags.join(' • '));
    lines.push('');
  }

  // Lifestyle
  if (card.lifestyleSummary) {
    lines.push(isHe ? '🌟 סגנון חיים:' : '🌟 Lifestyle:');
    lines.push(card.lifestyleSummary);
    lines.push('');
  }

  lines.push(divider);
  lines.push(card.closingLine);
  lines.push('');
  lines.push(isHe ? 'נוצר באמצעות NeshamaTech' : 'Generated with NeshamaTech');

  return lines.join('\n');
}
