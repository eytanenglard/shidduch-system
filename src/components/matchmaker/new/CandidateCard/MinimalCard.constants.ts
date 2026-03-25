// MinimalCard.constants.ts — Config maps & pure config functions

import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import type { PriorityConfig, ReadinessConfig, BackgroundBadgeConfig } from './MinimalCard.types';

// ── Priority ────────────────────────────────────────────────────────────────

export const getPriorityConfig = (category: string | null | undefined): PriorityConfig => {
  switch (category) {
    case 'CRITICAL':
      return { color: '#EF4444', borderColor: 'border-l-red-500', bg: 'bg-red-50', textColor: 'text-red-700', label: 'דחוף' };
    case 'HIGH':
      return { color: '#F97316', borderColor: 'border-l-orange-500', bg: 'bg-orange-50', textColor: 'text-orange-700', label: 'גבוה' };
    case 'MEDIUM':
      return { color: '#F59E0B', borderColor: 'border-l-amber-400', bg: 'bg-amber-50', textColor: 'text-amber-700', label: 'בינוני' };
    case 'LOW':
      return { color: '#10B981', borderColor: 'border-l-emerald-400', bg: 'bg-emerald-50', textColor: 'text-emerald-700', label: 'נמוך' };
    default:
      return { color: '#E5E7EB', borderColor: 'border-l-gray-200', bg: '', textColor: '', label: '' };
  }
};

// ── Background compatibility badge ──────────────────────────────────────────

export const getBackgroundBadge = (compatibility?: string): BackgroundBadgeConfig | null => {
  switch (compatibility) {
    case 'excellent':
      return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'רקע מצוין' };
    case 'good':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, label: 'רקע טוב' };
    case 'possible':
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Info, label: 'רקע אפשרי' };
    case 'problematic':
      return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'פער רקע' };
    case 'not_recommended':
      return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'רקע בעייתי' };
    default:
      return null;
  }
};

// ── Readiness ───────────────────────────────────────────────────────────────

export const getReadinessConfig = (level: string | null | undefined): ReadinessConfig | null => {
  switch (level) {
    case 'VERY_READY':
      return { emoji: '🚀', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'מאוד מוכן/ת' };
    case 'READY':
      return { emoji: '✅', color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'מוכן/ת' };
    case 'SOMEWHAT_READY':
      return { emoji: '🌱', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'מתחיל/ה' };
    case 'UNCERTAIN':
      return { emoji: '🤔', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'לא בטוח/ה' };
    case 'NOT_READY':
      return { emoji: '⏸️', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'לא מוכן/ת' };
    default:
      return null;
  }
};

// ── Service type labels ──────────────────────────────────────────────────────

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  MILITARY_COMBATANT: 'צבאי קרבי',
  MILITARY_SUPPORT: 'צבאי תומך',
  HESDER_YESHIVA: 'הסדר',
  YESHIVA_FULL_TIME: 'ישיבה',
  SEMINARY: 'סמינר',
  MIDRASHA: 'מדרשה',
  NATIONAL_SERVICE: 'שירות לאומי',
  EXEMPTED: 'פטור',
  ATUDA: 'עתודה',
  OFFICER: 'קצונה',
  NOT_DRAFTED: 'לא גויס',
};

// ── Kippah labels (males) ────────────────────────────────────────────────────

export const KIPPAH_LABELS: Record<string, string> = {
  NONE: 'ללא כיפה',
  SOMETIMES: 'כיפה לפעמים',
  SRUGA: 'כיפה סרוגה',
  BLACK: 'כיפה שחורה',
  LARGE: 'כיפה גדולה',
};

// ── Head covering labels (females) ───────────────────────────────────────────

export const HEAD_COVERING_LABELS: Record<string, string> = {
  NONE: 'ללא כיסוי ראש',
  SOMETIMES: 'כיסוי לפעמים',
  MITPACHAT: 'מטפחת',
  WIG: 'פאה',
  BOTH: 'פאה ומטפחת',
};

// ── Body type labels ─────────────────────────────────────────────────────────

export const BODY_TYPE_LABELS: Record<string, string> = {
  VERY_SLIM: 'רזה מאוד',
  SLIM: 'רזה',
  SLIM_MEDIUM: 'רזה-בינוני/ת',
  MEDIUM: 'בינוני/ת',
  MEDIUM_FULL: 'בינוני/ת-מלא/ה',
  FULL: 'מלא/ה',
  ATHLETIC: 'ספורטיבי/ת',
};

// ── Appearance tone labels ──────────────────────────────────────────────────

export const APPEARANCE_TONE_LABELS: Record<string, string> = {
  VERY_FAIR: 'בהיר/ה מאוד',
  FAIR: 'בהיר/ה',
  MEDIUM: 'בינוני/ת',
  MEDITERRANEAN: 'שחום/ה מדיטרני/ת',
  DARK: 'שחום/ה',
  VERY_DARK: 'כהה מאוד',
};

// ── Grooming style labels ────────────────────────────────────────────────────

export const GROOMING_STYLE_LABELS: Record<string, string> = {
  VERY_POLISHED: 'מטופח/ת מאוד',
  CLASSIC_NEAT: 'קלאסי/ת ומסודר/ת',
  NATURAL: 'טבעי/ת',
  SPORTY_CASUAL: 'ספורטיבי/ת-קז\'ואל',
  TRENDY: 'טרנדי/ת',
};

// ── Smoking labels ───────────────────────────────────────────────────────────

export const SMOKING_LABELS: Record<string, string> = {
  never: 'לא מעשן/ת',
  occasionally: 'מעשן/ת מדי פעם',
  regularly: 'מעשן/ת',
  trying_to_quit: 'מנסה להפסיק לעשן',
};

// ── Language map ────────────────────────────────────────────────────────────

export const LANGUAGE_MAP: Record<string, string> = {
  hebrew: 'עברית',
  english: 'אנגלית',
  russian: 'רוסית',
  french: 'צרפתית',
  spanish: 'ספרדית',
  amharic: 'אמהרית',
  arabic: 'ערבית',
  german: 'גרמנית',
  italian: 'איטלקית',
};
