// src/components/suggestions/constants.ts
// Shared constants for the suggestions system

export const SYSTEM_MATCHMAKER_ID = 'system-matchmaker-neshamatech';

export const ACTIVE_PROCESS_STATUSES = [
  'FIRST_PARTY_APPROVED',
  'PENDING_SECOND_PARTY',
  'SECOND_PARTY_APPROVED',
  'AWAITING_MATCHMAKER_APPROVAL',
  'CONTACT_DETAILS_SHARED',
  'AWAITING_FIRST_DATE_FEEDBACK',
  'THINKING_AFTER_DATE',
  'PROCEEDING_TO_SECOND_DATE',
  'MEETING_PENDING',
  'MEETING_SCHEDULED',
  'MATCH_APPROVED',
  'DATING',
  'ENGAGED',
] as const;

export type ActiveProcessStatus = (typeof ACTIVE_PROCESS_STATUSES)[number];

// =============================================================================
// STATUS_THEME — Centralized color system for suggestion statuses
// =============================================================================
export interface StatusTheme {
  bg: string;
  text: string;
  gradient: string;
  glow: string;
  border: string;
  iconBg: string;
  badgeClass: string;
  heroBg: string;
  progressGradient: string;
  ringColor: string;
}

export const STATUS_THEME: Record<string, StatusTheme> = {
  // Pending statuses — Amber/Orange warmth
  PENDING_FIRST_PARTY: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-orange-400',
    glow: 'shadow-amber-200/50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    heroBg: 'from-amber-50 via-white to-orange-50/30',
    progressGradient: 'from-amber-400 to-orange-400',
    ringColor: 'ring-amber-300',
  },
  PENDING_SECOND_PARTY: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    gradient: 'from-blue-400 to-cyan-400',
    glow: 'shadow-blue-200/50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-50 text-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    heroBg: 'from-blue-50 via-white to-cyan-50/30',
    progressGradient: 'from-blue-400 to-cyan-400',
    ringColor: 'ring-blue-300',
  },
  RE_OFFERED_TO_FIRST_PARTY: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-orange-400',
    glow: 'shadow-amber-200/50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    heroBg: 'from-amber-50 via-white to-orange-50/30',
    progressGradient: 'from-amber-400 to-orange-400',
    ringColor: 'ring-amber-300',
  },

  // Approved statuses — Emerald/Teal trust
  FIRST_PARTY_APPROVED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    gradient: 'from-teal-400 to-emerald-400',
    glow: 'shadow-emerald-200/50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heroBg: 'from-emerald-50 via-white to-teal-50/30',
    progressGradient: 'from-teal-400 to-emerald-400',
    ringColor: 'ring-emerald-300',
  },
  FIRST_PARTY_INTERESTED: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-yellow-400',
    glow: 'shadow-amber-200/50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    heroBg: 'from-amber-50 via-white to-yellow-50/30',
    progressGradient: 'from-amber-400 to-yellow-400',
    ringColor: 'ring-amber-300',
  },
  SECOND_PARTY_APPROVED: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    gradient: 'from-violet-400 to-purple-400',
    glow: 'shadow-violet-200/50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-50 text-violet-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    heroBg: 'from-violet-50 via-white to-purple-50/30',
    progressGradient: 'from-violet-400 to-purple-400',
    ringColor: 'ring-violet-300',
  },
  AWAITING_MATCHMAKER_APPROVAL: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    gradient: 'from-indigo-400 to-blue-400',
    glow: 'shadow-indigo-200/50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-50 text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    heroBg: 'from-indigo-50 via-white to-blue-50/30',
    progressGradient: 'from-indigo-400 to-blue-400',
    ringColor: 'ring-indigo-300',
  },

  // Contact & Meeting — Pink/Warm
  CONTACT_DETAILS_SHARED: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    gradient: 'from-pink-400 to-rose-400',
    glow: 'shadow-pink-200/50',
    border: 'border-pink-200',
    iconBg: 'bg-pink-50 text-pink-600',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    heroBg: 'from-pink-50 via-white to-rose-50/30',
    progressGradient: 'from-pink-400 to-rose-400',
    ringColor: 'ring-pink-300',
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-orange-400',
    glow: 'shadow-amber-200/50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    heroBg: 'from-amber-50 via-white to-orange-50/30',
    progressGradient: 'from-amber-400 to-orange-400',
    ringColor: 'ring-amber-300',
  },
  THINKING_AFTER_DATE: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    gradient: 'from-indigo-400 to-violet-400',
    glow: 'shadow-indigo-200/50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-50 text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    heroBg: 'from-indigo-50 via-white to-violet-50/30',
    progressGradient: 'from-indigo-400 to-violet-400',
    ringColor: 'ring-indigo-300',
  },
  PROCEEDING_TO_SECOND_DATE: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    gradient: 'from-teal-400 to-emerald-400',
    glow: 'shadow-teal-200/50',
    border: 'border-teal-200',
    iconBg: 'bg-teal-50 text-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    heroBg: 'from-teal-50 via-white to-emerald-50/30',
    progressGradient: 'from-teal-400 to-emerald-400',
    ringColor: 'ring-teal-300',
  },
  MEETING_PENDING: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    gradient: 'from-cyan-400 to-teal-400',
    glow: 'shadow-cyan-200/50',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-50 text-cyan-600',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    heroBg: 'from-cyan-50 via-white to-teal-50/30',
    progressGradient: 'from-cyan-400 to-teal-400',
    ringColor: 'ring-cyan-300',
  },
  MEETING_SCHEDULED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    gradient: 'from-emerald-400 to-green-400',
    glow: 'shadow-emerald-200/50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heroBg: 'from-emerald-50 via-white to-green-50/30',
    progressGradient: 'from-emerald-400 to-green-400',
    ringColor: 'ring-emerald-300',
  },

  // Dating & Romance — Rose/Pink warmth
  DATING: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    gradient: 'from-rose-400 to-pink-400',
    glow: 'shadow-rose-200/50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-50 text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    heroBg: 'from-rose-50 via-white to-pink-50/30',
    progressGradient: 'from-rose-400 to-pink-500',
    ringColor: 'ring-rose-300',
  },
  MATCH_APPROVED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    gradient: 'from-emerald-400 to-teal-400',
    glow: 'shadow-emerald-200/50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heroBg: 'from-emerald-50 via-white to-teal-50/30',
    progressGradient: 'from-emerald-400 to-teal-400',
    ringColor: 'ring-emerald-300',
  },

  // Celebration — Gold/Amber
  ENGAGED: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    gradient: 'from-amber-400 to-yellow-300',
    glow: 'shadow-amber-300/50',
    border: 'border-amber-300',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    heroBg: 'from-amber-50 via-yellow-50/30 to-orange-50/20',
    progressGradient: 'from-amber-400 to-yellow-300',
    ringColor: 'ring-amber-400',
  },
  MARRIED: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    gradient: 'from-yellow-400 to-amber-300',
    glow: 'shadow-amber-300/60',
    border: 'border-amber-300',
    iconBg: 'bg-amber-50 text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    heroBg: 'from-amber-50 via-yellow-50/40 to-orange-50/20',
    progressGradient: 'from-yellow-400 to-amber-300',
    ringColor: 'ring-amber-400',
  },

  // Declined / Closed — Gray/Muted
  FIRST_PARTY_DECLINED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-200/30',
    border: 'border-gray-200',
    iconBg: 'bg-gray-50 text-gray-500',
    badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
    heroBg: 'from-gray-50 via-white to-slate-50/30',
    progressGradient: 'from-gray-300 to-gray-400',
    ringColor: 'ring-gray-300',
  },
  SECOND_PARTY_DECLINED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-200/30',
    border: 'border-gray-200',
    iconBg: 'bg-gray-50 text-gray-500',
    badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
    heroBg: 'from-gray-50 via-white to-slate-50/30',
    progressGradient: 'from-gray-300 to-gray-400',
    ringColor: 'ring-gray-300',
  },
  CLOSED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-200/30',
    border: 'border-gray-200',
    iconBg: 'bg-gray-50 text-gray-500',
    badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
    heroBg: 'from-gray-50 via-white to-slate-50/30',
    progressGradient: 'from-gray-300 to-gray-400',
    ringColor: 'ring-gray-300',
  },
  EXPIRED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-200/30',
    border: 'border-gray-200',
    iconBg: 'bg-gray-50 text-gray-500',
    badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
    heroBg: 'from-gray-50 via-white to-slate-50/30',
    progressGradient: 'from-gray-300 to-gray-400',
    ringColor: 'ring-gray-300',
  },
  CANCELLED: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    gradient: 'from-gray-300 to-gray-400',
    glow: 'shadow-gray-200/30',
    border: 'border-gray-200',
    iconBg: 'bg-gray-50 text-gray-500',
    badgeClass: 'bg-gray-50 text-gray-500 border-gray-200',
    heroBg: 'from-gray-50 via-white to-slate-50/30',
    progressGradient: 'from-gray-300 to-gray-400',
    ringColor: 'ring-gray-300',
  },
};

// Default theme fallback
export const DEFAULT_STATUS_THEME: StatusTheme = {
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  gradient: 'from-gray-400 to-slate-400',
  glow: 'shadow-gray-200/30',
  border: 'border-gray-200',
  iconBg: 'bg-gray-50 text-gray-600',
  badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
  heroBg: 'from-gray-50 via-white to-slate-50/30',
  progressGradient: 'from-gray-400 to-slate-400',
  ringColor: 'ring-gray-300',
};

export const getStatusTheme = (status: string): StatusTheme =>
  STATUS_THEME[status] || DEFAULT_STATUS_THEME;
