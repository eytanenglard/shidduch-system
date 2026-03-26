// src/components/profile/sections/neshma-insight/config.ts

import {
  Compass,
  Star,
  TrendingUp,
  Heart,
  ShieldAlert,
  Flag,
  Feather,
  type LucideIcon,
} from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface SectionConfig {
  key: string;
  Icon: LucideIcon;
  titleHe: string;
  titleEn: string;
  accentGradient: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
}

export interface LoadingStep {
  he: string;
  en: string;
}

// =====================================================
// Section Configuration
// =====================================================

export const REPORT_SECTIONS: SectionConfig[] = [
  {
    key: 'soulMap',
    Icon: Compass,
    titleHe: 'מפת הנשמה — מי את/ה באמת',
    titleEn: 'Soul Map — Who You Really Are',
    accentGradient: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    titleColor: 'text-violet-800',
  },
  {
    key: 'strengths',
    Icon: Star,
    titleHe: 'מה את/ה מביא/ה לקשר',
    titleEn: 'What You Bring to a Relationship',
    accentGradient: 'from-emerald-400 to-green-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-800',
  },
  {
    key: 'growthChallenges',
    Icon: TrendingUp,
    titleHe: 'אתגרי צמיחה',
    titleEn: 'Growth Challenges',
    accentGradient: 'from-sky-400 to-blue-500',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    titleColor: 'text-sky-800',
  },
  {
    key: 'classicFit',
    Icon: Heart,
    titleHe: 'ההתאמה הקלאסית',
    titleEn: 'The Classic Fit',
    accentGradient: 'from-rose-400 to-pink-500',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-800',
  },
  {
    key: 'trap',
    Icon: ShieldAlert,
    titleHe: 'המוקש — מה לא יעבוד',
    titleEn: 'The Trap — What Won\'t Work',
    accentGradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
  },
  {
    key: 'dealbreakers',
    Icon: Flag,
    titleHe: 'על מה לא להתפשר',
    titleEn: 'Non-Negotiables',
    accentGradient: 'from-red-400 to-rose-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
  },
  {
    key: 'whereToRelax',
    Icon: Feather,
    titleHe: 'איפה אפשר לשחרר',
    titleEn: 'Where to Let Go',
    accentGradient: 'from-lime-400 to-green-500',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
    titleColor: 'text-lime-800',
  },
];

// =====================================================
// Loading Steps
// =====================================================

export const LOADING_STEPS: LoadingStep[] = [
  { he: 'מנתח את הפרופיל שלך', en: 'Analyzing your profile' },
  { he: 'ממפה ערכים ותכונות אישיות', en: 'Mapping values and traits' },
  { he: 'מגבש תובנות לזוגיות ודייטים', en: 'Building relationship insights' },
  { he: 'בונה את הדוח האישי שלך', en: 'Creating your personal report' },
];
