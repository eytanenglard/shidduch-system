// =============================================================================
// src/lib/suggestion-status-utils.ts
// =============================================================================
// מקור אמת יחיד ל-status/priority info
// מחליף getEnhancedStatusInfo שהיה מכופל ב-SuggestionCard, SuggestionDetailsDialog

import {
  Bookmark,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Heart,
  Edit,
  Calendar,
  AlarmClock,
  Archive,
  MessageCircle,
  User,
  Crown,
  Gem,
  Flame,
  Star,
  Target,
  Shield,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type { MatchSuggestionStatus, Priority } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Status Info
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusInfo {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeColor: string;
  progress: number;
  pulse?: boolean;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  DRAFT: {
    icon: Edit,
    color: 'text-gray-600',
    bgColor: 'from-gray-50 to-slate-50',
    badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
    progress: 10,
  },
  PENDING_FIRST_PARTY: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'from-yellow-50 to-amber-50',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
    progress: 25,
    pulse: true,
  },
  FIRST_PARTY_APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    progress: 40,
  },
  FIRST_PARTY_DECLINED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'from-red-50 to-pink-50',
    badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    progress: 100,
  },
    FIRST_PARTY_INTERESTED: {
    icon: Bookmark,
    color: 'text-amber-600',
    bgColor: 'from-amber-50 to-orange-50',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    progress: 30,
  },
  PENDING_SECOND_PARTY: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'from-blue-50 to-cyan-50',
    badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    progress: 50,
    pulse: true,
  },
  SECOND_PARTY_APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    progress: 60,
  },
  SECOND_PARTY_DECLINED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'from-red-50 to-pink-50',
    badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    progress: 100,
  },
  AWAITING_MATCHMAKER_APPROVAL: {
    icon: User,
    color: 'text-blue-600',
    bgColor: 'from-blue-50 to-cyan-50',
    badgeColor: 'bg-blue-500 text-white',
    progress: 65,
  },
  MATCH_APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-green-500 text-white',
    progress: 60,
  },
  MATCH_DECLINED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'from-red-50 to-pink-50',
    badgeColor: 'bg-red-500 text-white',
    progress: 0,
  },
  CONTACT_DETAILS_SHARED: {
    icon: Send,
    color: 'text-purple-600',
    bgColor: 'from-purple-50 to-pink-50',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    progress: 70,
  },
  MEETING_PENDING: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'from-purple-50 to-pink-50',
    badgeColor: 'bg-purple-500 text-white',
    progress: 72,
  },
  MEETING_SCHEDULED: {
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'from-green-50 to-emerald-50',
    badgeColor: 'bg-green-500 text-white',
    progress: 74,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'from-orange-50 to-amber-50',
    badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
    progress: 75,
    pulse: true,
  },
  THINKING_AFTER_DATE: {
    icon: Clock,
    color: 'text-indigo-600',
    bgColor: 'from-indigo-50 to-violet-50',
    badgeColor: 'bg-indigo-500 text-white',
    progress: 77,
  },
  PROCEEDING_TO_SECOND_DATE: {
    icon: CheckCircle,
    color: 'text-teal-600',
    bgColor: 'from-teal-50 to-cyan-50',
    badgeColor: 'bg-teal-500 text-white',
    progress: 78,
  },
  DATING: {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'from-pink-50 to-rose-50',
    badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
    progress: 80,
  },
  ENGAGED: {
    icon: Gem,
    color: 'text-yellow-600',
    bgColor: 'from-yellow-50 to-orange-50',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    progress: 95,
  },
  MARRIED: {
    icon: Crown,
    color: 'text-emerald-600',
    bgColor: 'from-emerald-50 to-green-50',
    badgeColor: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    progress: 100,
  },
  ENDED_AFTER_FIRST_DATE: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'from-red-50 to-pink-50',
    badgeColor: 'bg-red-500 text-white',
    progress: 0,
  },
  EXPIRED: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'from-gray-50 to-slate-50',
    badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
    progress: 100,
  },
  CLOSED: {
    icon: Archive,
    color: 'text-gray-600',
    bgColor: 'from-gray-50 to-slate-50',
    badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
    progress: 0,
  },
  CANCELLED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'from-red-50 to-pink-50',
    badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    progress: 0,
  },
};

const DEFAULT_STATUS: StatusInfo = {
  icon: RefreshCw,
  color: 'text-gray-600',
  bgColor: 'from-gray-50 to-slate-50',
  badgeColor: 'bg-gray-500 text-white',
  progress: 30,
};

export function getEnhancedStatusInfo(status: MatchSuggestionStatus | string): StatusInfo {
  return STATUS_MAP[status] || DEFAULT_STATUS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority Info
// ─────────────────────────────────────────────────────────────────────────────

export interface PriorityInfo {
  icon: LucideIcon;
  borderColor: string;
  bgGradient: string;
  badgeClass: string;
}

const PRIORITY_MAP: Record<string, PriorityInfo> = {
  URGENT: {
    icon: Flame,
    borderColor: 'border-red-500',
    bgGradient: 'from-red-50 to-pink-50',
    badgeClass:
      'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl animate-pulse',
  },
  HIGH: {
    icon: Star,
    borderColor: 'border-orange-500',
    bgGradient: 'from-orange-50 to-amber-50',
    badgeClass:
      'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg',
  },
  MEDIUM: {
    icon: Target,
    borderColor: 'border-blue-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    badgeClass:
      'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg',
  },
  LOW: {
    icon: Shield,
    borderColor: 'border-gray-400',
    bgGradient: 'from-gray-50 to-slate-50',
    badgeClass:
      'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg',
  },
};

export function getEnhancedPriorityInfo(priority: Priority | string): PriorityInfo {
  return PRIORITY_MAP[priority] || PRIORITY_MAP.MEDIUM;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getDaysLeft(decisionDeadline?: Date | string | null): number | null {
  if (!decisionDeadline) return null;
  const deadline = new Date(decisionDeadline);
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}