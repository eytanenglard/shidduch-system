// src/app/components/matchmaker/suggestions/cards/SuggestionCard.tsx
// ════════════════════════════════════════════════════════════════
// 🔧 REDESIGN: כרטיס הצעה עם:
//   - Smart Primary Action (כפתור ראשי בולט לכל סטטוס)
//   - Status Timeline (מחליף את ה-progress bar)
//   - Categorized dropdown (קידום / עדכון / סגירה)
//   - Confirmation dialog לפעולות הרסניות
//   - Contextual hints (nudges)
//   - Synced transitions map (מסונכרן עם השרת!)
//   - Micro-animations
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import {
  Clock,
  MessageCircle,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Heart,
  MapPin,
  Quote,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowRight,
  Bookmark,
  CalendarClock,
  GraduationCap,
  TrendingUp,
  Phone,
  Calendar,
  Ban,
  HeartHandshake,
  Gem,
  Send,
  ArrowLeftRight,
  EyeOff,
  AlertTriangle,
  Sparkles,
  Bell,
  PartyPopper,
  Pause,
  RotateCcw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { UserImage } from '@prisma/client';
import type {
  Suggestion,
  ActionAdditionalData,
  SuggestionParty,
} from '@/types/suggestions';
import { Progress } from '@/components/ui/progress';
import { cn, getRelativeCloudinaryPath, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MatchmakerPageDictionary } from '@/types/dictionary';
import {
  getEnhancedStatusInfo,
  getEnhancedPriorityInfo,
  calculateAge,
  getDaysLeft,
} from '@/lib/suggestion-status-utils';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type SuggestionCardActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder'
  | 'hideFirstParty'
  | 'hideSecondParty';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (
    type: SuggestionCardActionType,
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => void;
  dict: MatchmakerPageDictionary['suggestionsDashboard']['suggestionCard'];
  className?: string;
  variant?: 'full' | 'compact';
  unreadChatCount?: number;
  isMobile?: boolean;
  hiddenCandidateIds?: Set<string>;
}

// ═══════════════════════════════════════════════════════════════
// STATUS TRANSITIONS — מסונכרן עם StatusTransitionService בשרת!
// ═══════════════════════════════════════════════════════════════

interface StatusTransition {
  value: string;
  icon: React.ElementType;
  color: string;
  category: 'advance' | 'update' | 'close';
  requiresConfirmation?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// ⚠️ חייב להיות מסונכרן עם validTransitions ב-StatusTransitionService.ts
const STATUS_TRANSITIONS: Record<string, StatusTransition[]> = {
  DRAFT: [
    {
      value: 'PENDING_FIRST_PARTY',
      icon: Send,
      color: 'text-blue-600',
      category: 'advance',
      sentiment: 'positive',
    },
  ],
  PENDING_FIRST_PARTY: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'FIRST_PARTY_INTERESTED',
      icon: Bookmark,
      color: 'text-amber-600',
      category: 'update',
      sentiment: 'neutral',
    },
    {
      value: 'FIRST_PARTY_DECLINED',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  FIRST_PARTY_INTERESTED: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'FIRST_PARTY_DECLINED',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  FIRST_PARTY_APPROVED: [
    {
      value: 'PENDING_SECOND_PARTY',
      icon: Send,
      color: 'text-blue-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  FIRST_PARTY_DECLINED: [
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      sentiment: 'negative',
    },
  ],
  PENDING_SECOND_PARTY: [
    {
      value: 'SECOND_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'SECOND_PARTY_DECLINED',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'SECOND_PARTY_NOT_AVAILABLE',
      icon: Pause,
      color: 'text-amber-600',
      category: 'update',
      sentiment: 'neutral',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  SECOND_PARTY_NOT_AVAILABLE: [
    {
      value: 'PENDING_SECOND_PARTY',
      icon: RefreshCw,
      color: 'text-blue-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  SECOND_PARTY_APPROVED: [
    {
      value: 'CONTACT_DETAILS_SHARED',
      icon: Phone,
      color: 'text-emerald-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'RE_OFFERED_TO_FIRST_PARTY',
      icon: RotateCcw,
      color: 'text-blue-600',
      category: 'update',
      sentiment: 'neutral',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  RE_OFFERED_TO_FIRST_PARTY: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'AWAITING_MATCHMAKER_APPROVAL',
      icon: Clock,
      color: 'text-blue-600',
      category: 'update',
      sentiment: 'neutral',
    },
    {
      value: 'FIRST_PARTY_DECLINED',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  SECOND_PARTY_DECLINED: [
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      sentiment: 'negative',
    },
  ],
  AWAITING_MATCHMAKER_APPROVAL: [
    {
      value: 'CONTACT_DETAILS_SHARED',
      icon: Phone,
      color: 'text-emerald-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  CONTACT_DETAILS_SHARED: [
    {
      value: 'AWAITING_FIRST_DATE_FEEDBACK',
      icon: MessageSquare,
      color: 'text-blue-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  AWAITING_FIRST_DATE_FEEDBACK: [
    {
      value: 'THINKING_AFTER_DATE',
      icon: Clock,
      color: 'text-amber-600',
      category: 'update',
      sentiment: 'neutral',
    },
    {
      value: 'ENDED_AFTER_FIRST_DATE',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  THINKING_AFTER_DATE: [
    {
      value: 'PROCEEDING_TO_SECOND_DATE',
      icon: Heart,
      color: 'text-pink-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'ENDED_AFTER_FIRST_DATE',
      icon: XCircle,
      color: 'text-red-600',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  PROCEEDING_TO_SECOND_DATE: [
    {
      value: 'DATING',
      icon: Heart,
      color: 'text-pink-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  ENDED_AFTER_FIRST_DATE: [
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      sentiment: 'negative',
    },
  ],
  MEETING_PENDING: [
    {
      value: 'MEETING_SCHEDULED',
      icon: Calendar,
      color: 'text-blue-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  MEETING_SCHEDULED: [
    {
      value: 'DATING',
      icon: Heart,
      color: 'text-pink-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  MATCH_APPROVED: [
    {
      value: 'DATING',
      icon: Heart,
      color: 'text-pink-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  MATCH_DECLINED: [
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      sentiment: 'negative',
    },
  ],
  DATING: [
    {
      value: 'ENGAGED',
      icon: Gem,
      color: 'text-purple-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CLOSED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
  ENGAGED: [
    {
      value: 'MARRIED',
      icon: HeartHandshake,
      color: 'text-pink-600',
      category: 'advance',
      sentiment: 'positive',
    },
    {
      value: 'CANCELLED',
      icon: Ban,
      color: 'text-gray-500',
      category: 'close',
      requiresConfirmation: true,
      sentiment: 'negative',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// PRIMARY ACTIONS — פעולה מומלצת ראשית לכל סטטוס
// ═══════════════════════════════════════════════════════════════

interface PrimaryAction {
  nextStatus: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  hoverGradient: string;
}

const PRIMARY_ACTIONS: Record<string, PrimaryAction> = {
  DRAFT: {
    nextStatus: 'PENDING_FIRST_PARTY',
    label: 'שלח לצד א׳',
    icon: Send,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'from-blue-600 to-cyan-600',
  },
  FIRST_PARTY_APPROVED: {
    nextStatus: 'PENDING_SECOND_PARTY',
    label: 'שלח לצד ב׳',
    icon: Send,
    gradient: 'from-blue-500 to-indigo-500',
    hoverGradient: 'from-blue-600 to-indigo-600',
  },
  FIRST_PARTY_INTERESTED: {
    nextStatus: 'FIRST_PARTY_APPROVED',
    label: 'צד א׳ אישר',
    icon: CheckCircle,
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'from-green-600 to-emerald-600',
  },
  SECOND_PARTY_APPROVED: {
    nextStatus: 'CONTACT_DETAILS_SHARED',
    label: 'שתף פרטי קשר',
    icon: Phone,
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'from-emerald-600 to-teal-600',
  },
  AWAITING_MATCHMAKER_APPROVAL: {
    nextStatus: 'CONTACT_DETAILS_SHARED',
    label: 'אשר ושתף פרטים',
    icon: Phone,
    gradient: 'from-emerald-500 to-teal-500',
    hoverGradient: 'from-emerald-600 to-teal-600',
  },
  CONTACT_DETAILS_SHARED: {
    nextStatus: 'AWAITING_FIRST_DATE_FEEDBACK',
    label: 'בקש משוב',
    icon: MessageSquare,
    gradient: 'from-violet-500 to-purple-500',
    hoverGradient: 'from-violet-600 to-purple-600',
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    nextStatus: 'THINKING_AFTER_DATE',
    label: 'בחשיבה',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    hoverGradient: 'from-amber-600 to-orange-600',
  },
  THINKING_AFTER_DATE: {
    nextStatus: 'PROCEEDING_TO_SECOND_DATE',
    label: 'ממשיכים לפגישה שנייה',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-500',
    hoverGradient: 'from-pink-600 to-rose-600',
  },
  PROCEEDING_TO_SECOND_DATE: {
    nextStatus: 'DATING',
    label: 'בתהליך היכרות',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-500',
    hoverGradient: 'from-pink-600 to-rose-600',
  },
  DATING: {
    nextStatus: 'ENGAGED',
    label: 'עדכון אירוסין 💍',
    icon: Gem,
    gradient: 'from-purple-500 to-fuchsia-500',
    hoverGradient: 'from-purple-600 to-fuchsia-600',
  },
  ENGAGED: {
    nextStatus: 'MARRIED',
    label: 'עדכון נישואין 💒',
    icon: HeartHandshake,
    gradient: 'from-pink-500 to-rose-500',
    hoverGradient: 'from-pink-600 to-rose-600',
  },
  // עבור סטטוסים של "ממתין" — הפעולה הראשית היא תזכורת
  PENDING_FIRST_PARTY: {
    nextStatus: 'FIRST_PARTY_APPROVED',
    label: 'צד א׳ אישר',
    icon: CheckCircle,
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'from-green-600 to-emerald-600',
  },
  PENDING_SECOND_PARTY: {
    nextStatus: 'SECOND_PARTY_APPROVED',
    label: 'צד ב׳ אישר',
    icon: CheckCircle,
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'from-green-600 to-emerald-600',
  },
  // Declined / closed — הפעולה הראשית היא סגירה
  FIRST_PARTY_DECLINED: {
    nextStatus: 'CLOSED',
    label: 'סגור הצעה',
    icon: Ban,
    gradient: 'from-gray-400 to-gray-500',
    hoverGradient: 'from-gray-500 to-gray-600',
  },
  SECOND_PARTY_DECLINED: {
    nextStatus: 'CLOSED',
    label: 'סגור הצעה',
    icon: Ban,
    gradient: 'from-gray-400 to-gray-500',
    hoverGradient: 'from-gray-500 to-gray-600',
  },
  ENDED_AFTER_FIRST_DATE: {
    nextStatus: 'CLOSED',
    label: 'סגור הצעה',
    icon: Ban,
    gradient: 'from-gray-400 to-gray-500',
    hoverGradient: 'from-gray-500 to-gray-600',
  },
  MATCH_DECLINED: {
    nextStatus: 'CLOSED',
    label: 'סגור הצעה',
    icon: Ban,
    gradient: 'from-gray-400 to-gray-500',
    hoverGradient: 'from-gray-500 to-gray-600',
  },
  SECOND_PARTY_NOT_AVAILABLE: {
    nextStatus: 'PENDING_SECOND_PARTY',
    label: 'שלח שוב לצד ב׳',
    icon: RefreshCw,
    gradient: 'from-blue-500 to-cyan-500',
    hoverGradient: 'from-blue-600 to-cyan-600',
  },
  RE_OFFERED_TO_FIRST_PARTY: {
    nextStatus: 'FIRST_PARTY_APPROVED',
    label: 'צד א׳ אישר',
    icon: CheckCircle,
    gradient: 'from-green-500 to-emerald-500',
    hoverGradient: 'from-green-600 to-emerald-600',
  },
};

// ═══════════════════════════════════════════════════════════════
// CONTEXTUAL HINTS — הודעות הקשר חכמות
// ═══════════════════════════════════════════════════════════════

const getContextualHint = (
  suggestion: Suggestion
): { text: string; icon: React.ElementType; color: string } | null => {
  const status = suggestion.status;
  const daysSinceActivity = suggestion.lastActivity
    ? Math.floor(
        (Date.now() - new Date(suggestion.lastActivity).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  if (status === 'SECOND_PARTY_APPROVED') {
    return {
      text: 'שני הצדדים אישרו! שתף פרטי קשר',
      icon: PartyPopper,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
  }
  if (
    (status === 'PENDING_FIRST_PARTY' || status === 'PENDING_SECOND_PARTY') &&
    daysSinceActivity >= 3
  ) {
    return {
      text: `ממתין ${daysSinceActivity} ימים — שלח תזכורת?`,
      icon: Bell,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    };
  }
  if (status === 'CONTACT_DETAILS_SHARED' && daysSinceActivity >= 2) {
    return {
      text: 'כבר 48 שעות — בקש משוב על הפגישה',
      icon: MessageSquare,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    };
  }
  if (status === 'DATING' && daysSinceActivity >= 30) {
    return {
      text: 'חודש בהיכרות — אולי הגיע הזמן לבשר? 💍',
      icon: Sparkles,
      color: 'text-pink-600 bg-pink-50 border-pink-200',
    };
  }
  if (status === 'FIRST_PARTY_APPROVED') {
    return {
      text: 'צד א׳ אישר — שלח עכשיו לצד ב׳!',
      icon: ArrowRight,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    };
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// TIMELINE STEPS — שלבי התהליך
// ═══════════════════════════════════════════════════════════════

const TIMELINE_STEPS = [
  { key: 'draft', label: 'טיוטה', statuses: ['DRAFT'] },
  {
    key: 'first',
    label: 'צד א׳',
    statuses: [
      'PENDING_FIRST_PARTY',
      'FIRST_PARTY_APPROVED',
      'FIRST_PARTY_INTERESTED',
      'FIRST_PARTY_DECLINED',
      'RE_OFFERED_TO_FIRST_PARTY',
    ],
  },
  {
    key: 'second',
    label: 'צד ב׳',
    statuses: [
      'PENDING_SECOND_PARTY',
      'SECOND_PARTY_APPROVED',
      'SECOND_PARTY_DECLINED',
      'SECOND_PARTY_NOT_AVAILABLE',
      'AWAITING_MATCHMAKER_APPROVAL',
    ],
  },
  { key: 'contact', label: 'פרטים', statuses: ['CONTACT_DETAILS_SHARED'] },
  {
    key: 'meeting',
    label: 'פגישה',
    statuses: [
      'AWAITING_FIRST_DATE_FEEDBACK',
      'THINKING_AFTER_DATE',
      'PROCEEDING_TO_SECOND_DATE',
      'MEETING_PENDING',
      'MEETING_SCHEDULED',
      'ENDED_AFTER_FIRST_DATE',
    ],
  },
  { key: 'dating', label: 'היכרות', statuses: ['DATING', 'MATCH_APPROVED'] },
  { key: 'success', label: '💍', statuses: ['ENGAGED', 'MARRIED'] },
];

const getTimelineState = (currentStatus: string) => {
  const failedStatuses = [
    'FIRST_PARTY_DECLINED',
    'SECOND_PARTY_DECLINED',
    'MATCH_DECLINED',
    'ENDED_AFTER_FIRST_DATE',
    'CLOSED',
    'CANCELLED',
    'EXPIRED',
  ];
  const isFailed = failedStatuses.includes(currentStatus);

  let currentStepIndex = -1;
  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (TIMELINE_STEPS[i].statuses.includes(currentStatus)) {
      currentStepIndex = i;
      break;
    }
  }

  return { currentStepIndex, isFailed };
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const PartyMini: React.FC<{
  party: SuggestionParty;
  age: number;
  side?: 'right' | 'left';
}> = ({ party, age, side = 'right' }) => {
  const imageUrl =
    party.images.find((img: UserImage) => img.isMain)?.url ||
    '/placeholders/user.png';

  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        side === 'left' && 'flex-row-reverse'
      )}
    >
      <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-white shadow-md flex-shrink-0">
        <Image
          src={getRelativeCloudinaryPath(imageUrl)}
          alt={party.firstName}
          fill
          className="object-cover"
          sizes="2.75rem"
        />
      </div>
      <div className={cn('min-w-0', side === 'left' && 'text-left')}>
        <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
          {party.firstName} {party.lastName}
        </p>
        <p className="text-[11px] text-gray-500 truncate leading-tight">
          {party.profile?.occupation || '—'} · {age}
        </p>
      </div>
    </div>
  );
};

/** Timeline מינימלי אופקי */
const StatusTimeline: React.FC<{ currentStatus: string }> = ({
  currentStatus,
}) => {
  const { currentStepIndex, isFailed } = getTimelineState(currentStatus);

  return (
    <div className="flex items-center gap-0.5 w-full">
      {TIMELINE_STEPS.map((step, i) => {
        const isPast = i < currentStepIndex;
        const isCurrent = i === currentStepIndex;
        const isFuture = i > currentStepIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Dot */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex-shrink-0 rounded-full transition-all duration-500',
                      isCurrent && !isFailed && 'w-3 h-3 ring-4 ring-offset-1',
                      isCurrent &&
                        isFailed &&
                        'w-3 h-3 ring-4 ring-offset-1 bg-red-500 ring-red-100',
                      isCurrent && !isFailed && 'bg-blue-500 ring-blue-100',
                      isPast && 'w-2 h-2 bg-emerald-400',
                      isFuture && 'w-2 h-2 bg-gray-200'
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {step.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Line */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 rounded-full transition-all duration-500',
                  i < currentStepIndex ? 'bg-emerald-300' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** כפתור Primary Action */
const PrimaryActionButton: React.FC<{
  suggestion: Suggestion;
  onAction: SuggestionCardProps['onAction'];
  dict: SuggestionCardProps['dict'];
}> = ({ suggestion, onAction, dict }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const action = PRIMARY_ACTIONS[suggestion.status];
  if (!action) return null;

  const PIcon = action.icon;
  const statusLabel =
    dict.statuses?.[action.nextStatus]?.shortLabel || action.label;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // בדיקה אם הפעולה דורשת אישור
    const transition = STATUS_TRANSITIONS[suggestion.status]?.find(
      (t) => t.value === action.nextStatus
    );
    if (transition?.requiresConfirmation) {
      setShowConfirm(true);
    } else {
      onAction('changeStatus', suggestion, {
        newStatus: action.nextStatus as ActionAdditionalData['newStatus'],
      });
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={handleClick}
        className={cn(
          'rounded-xl text-xs h-9 px-4 font-bold text-white shadow-md',
          'bg-gradient-to-r transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
          `${action.gradient} hover:${action.hoverGradient}`
        )}
        style={{
          backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
        }}
      >
        <PIcon className="w-3.5 h-3.5 ml-1.5" />
        {action.label}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {dict.actions?.confirmTitle || 'האם אתה בטוח?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {dict.actions?.confirmDescription ||
                'פעולה זו תשלח התראות לצדדים הרלוונטיים ולא ניתנת לביטול.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl px-6"
              >
                {dict.actions?.cancel || 'ביטול'}
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  onAction('changeStatus', suggestion, {
                    newStatus:
                      action.nextStatus as ActionAdditionalData['newStatus'],
                  });
                }}
                className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                {dict.actions?.confirm || 'אישור'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** כפתור More Actions — dropdown מקוטלג */
const MoreActionsButton: React.FC<{
  suggestion: Suggestion;
  onAction: SuggestionCardProps['onAction'];
  dict: SuggestionCardProps['dict'];
}> = ({ suggestion, onAction, dict }) => {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const transitions = STATUS_TRANSITIONS[suggestion.status];
  if (!transitions || transitions.length === 0) return null;

  const primaryAction = PRIMARY_ACTIONS[suggestion.status];
  // סנן את הפעולה הראשית מהרשימה
  const otherTransitions = transitions.filter(
    (t) => t.value !== primaryAction?.nextStatus
  );
  if (otherTransitions.length === 0) return null;

  const advanceItems = otherTransitions.filter((t) => t.category === 'advance');
  const updateItems = otherTransitions.filter((t) => t.category === 'update');
  const closeItems = otherTransitions.filter((t) => t.category === 'close');

  const handleTransition = (transition: StatusTransition) => {
    if (transition.requiresConfirmation) {
      setShowConfirm(transition.value);
    } else {
      onAction('changeStatus', suggestion, {
        newStatus: transition.value as ActionAdditionalData['newStatus'],
      });
    }
  };

  const renderItem = (transition: StatusTransition) => {
    const TIcon = transition.icon;
    const statusLabel =
      dict.statuses?.[transition.value]?.shortLabel ||
      dict.statuses?.[transition.value]?.label ||
      transition.value;
    return (
      <DropdownMenuItem
        key={transition.value}
        onClick={() => handleTransition(transition)}
        className={cn(
          'rounded-lg py-2.5 px-3 cursor-pointer',
          transition.sentiment === 'negative' &&
            'text-red-600 focus:text-red-600 focus:bg-red-50'
        )}
      >
        <TIcon className={cn('w-4 h-4 ml-2 flex-shrink-0', transition.color)} />
        <span className="text-sm font-medium">{statusLabel}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-xl shadow-xl border-0 p-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {advanceItems.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {dict.actions?.advanceCategory || 'קידום'}
              </div>
              {advanceItems.map(renderItem)}
            </>
          )}
          {updateItems.length > 0 && (
            <>
              {advanceItems.length > 0 && <DropdownMenuSeparator />}
              <div className="px-3 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                {dict.actions?.updateCategory || 'עדכון'}
              </div>
              {updateItems.map(renderItem)}
            </>
          )}
          {closeItems.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                <Ban className="w-3 h-3" />
                {dict.actions?.closeCategory || 'סגירה'}
              </div>
              {closeItems.map(renderItem)}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {dict.actions?.confirmTitle || 'האם אתה בטוח?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {dict.actions?.confirmDescription ||
                'פעולה זו תשלח התראות לצדדים הרלוונטיים.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(null)}
                className="rounded-xl px-6"
              >
                {dict.actions?.cancel || 'ביטול'}
              </Button>
              <Button
                onClick={() => {
                  onAction('changeStatus', suggestion, {
                    newStatus: showConfirm as ActionAdditionalData['newStatus'],
                  });
                  setShowConfirm(null);
                }}
                className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                {dict.actions?.confirm || 'אישור'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** Deadline Warning */
const DeadlineWarning: React.FC<{
  daysLeft: number | null;
  status: string;
  dict: SuggestionCardProps['dict']['deadline'];
}> = ({ daysLeft, status, dict }) => {
  if (daysLeft === null || daysLeft > 3 || status === 'EXPIRED') return null;
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 animate-pulse">
      <Clock className="w-3 h-3" />
      <span>
        {daysLeft === 0
          ? dict.lastDay
          : dict.daysLeft.replace('{{count}}', daysLeft.toString())}
      </span>
    </div>
  );
};

/** Expanded Details */
const ExpandedDetails: React.FC<{
  suggestion: Suggestion;
  firstParty: SuggestionParty;
  secondParty: SuggestionParty;
  firstPartyAge: number;
  secondPartyAge: number;
  statusInfo: ReturnType<typeof getEnhancedStatusInfo>;
  statusText: { label: string; shortLabel: string; description: string };
  daysLeft: number | null;
  dict: SuggestionCardProps['dict'];
  matchmaker: { firstName: string; lastName: string } | undefined;
}> = ({
  suggestion,
  firstParty,
  secondParty,
  firstPartyAge,
  secondPartyAge,
  statusInfo,
  statusText,
  daysLeft,
  dict,
  matchmaker,
}) => {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
      {/* שני הצדדים */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
            {dict.desktop?.partyLabels?.firstParty || 'צד א׳'}
          </p>
          <PartyDetailBlock party={firstParty} age={firstPartyAge} />
        </div>
        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">
            {dict.desktop?.partyLabels?.secondParty || 'צד ב׳'}
          </p>
          <PartyDetailBlock party={secondParty} age={secondPartyAge} />
        </div>
      </div>

      {/* סיבת ההתאמה */}
      {suggestion.matchingReason && (
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                {dict.desktop?.matchReasonTitle || 'סיבת ההתאמה'}
              </p>
              <p className="text-sm text-emerald-800 leading-relaxed italic">
                &ldquo;{suggestion.matchingReason}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* מטא-דאטה */}
      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
        {matchmaker && (
          <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1 border">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-[8px] font-bold">
                {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <span>
              {matchmaker.firstName} {matchmaker.lastName}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1 border">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(suggestion.createdAt), {
              addSuffix: true,
              locale: he,
            })}
          </span>
        </div>
        {suggestion.decisionDeadline && (
          <div className="flex items-center gap-1 bg-orange-50 rounded-full px-2.5 py-1 border border-orange-200 text-orange-700">
            <CalendarClock className="w-3 h-3" />
            <span>
              {daysLeft !== null
                ? daysLeft === 0
                  ? dict.deadline.today
                  : dict.deadline.decisionInDays?.replace(
                      '{{count}}',
                      daysLeft.toString()
                    )
                : dict.deadline.noDeadline}
            </span>
          </div>
        )}
      </div>

      {/* סטטוס מפורט */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <statusInfo.icon className={cn('w-4 h-4', statusInfo.color)} />
        <span className="font-medium">{statusText.label}</span>
        <span className="text-gray-400">—</span>
        <span>{statusText.description}</span>
      </div>
    </div>
  );
};

/** Party Detail Block */
const PartyDetailBlock: React.FC<{ party: SuggestionParty; age: number }> = ({
  party,
  age,
}) => {
  const imageUrl =
    party.images.find((img: UserImage) => img.isMain)?.url ||
    '/placeholders/user.png';
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white shadow-md flex-shrink-0">
          <Image
            src={getRelativeCloudinaryPath(imageUrl)}
            alt={party.firstName}
            fill
            className="object-cover"
            sizes="2.5rem"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">
            {party.firstName} {party.lastName}
          </p>
          <p className="text-[11px] text-gray-500">{age}</p>
        </div>
      </div>
      <div className="space-y-1">
        {party.profile?.occupation && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Briefcase className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="truncate">{party.profile.occupation}</span>
          </div>
        )}
        {party.profile?.education && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <GraduationCap className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="truncate">{party.profile.education}</span>
          </div>
        )}
        {party.profile?.city && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="truncate">{party.profile.city}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  dict,
  className,
  variant = 'full',
  unreadChatCount = 0,
  isMobile = false,
  hiddenCandidateIds = new Set(),
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { firstParty, secondParty, matchmaker } = suggestion;

  const statusInfo = useMemo(
    () => getEnhancedStatusInfo(suggestion.status),
    [suggestion.status]
  );
  const priorityInfo = useMemo(
    () => getEnhancedPriorityInfo(suggestion.priority),
    [suggestion.priority]
  );
  const daysLeft = useMemo(
    () => getDaysLeft(suggestion.decisionDeadline),
    [suggestion.decisionDeadline]
  );
  const firstPartyAge = useMemo(
    () => calculateAge(firstParty.profile.birthDate),
    [firstParty.profile.birthDate]
  );
  const secondPartyAge = useMemo(
    () => calculateAge(secondParty.profile.birthDate),
    [secondParty.profile.birthDate]
  );

  const statusText = dict.statuses[suggestion.status] || dict.statuses.DEFAULT;
  const priorityText =
    dict.priorities[suggestion.priority] || dict.priorities.MEDIUM;
  const hint = useMemo(() => getContextualHint(suggestion), [suggestion]);
  const isTerminal = ['CLOSED', 'CANCELLED', 'EXPIRED', 'MARRIED'].includes(
    suggestion.status
  );

  // ── Compact variant ──
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden border-r-[3px] bg-white',
          priorityInfo.borderColor,
          className
        )}
        onClick={() => onAction('view', suggestion)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex -space-x-2 flex-shrink-0">
                <Image
                  src={getRelativeCloudinaryPath(
                    firstParty.images.find((img) => img.isMain)?.url ||
                      '/placeholders/user.png'
                  )}
                  alt={firstParty.firstName}
                  width={28}
                  height={28}
                  className="rounded-full border-2 border-white shadow-sm"
                />
                <Image
                  src={getRelativeCloudinaryPath(
                    secondParty.images.find((img) => img.isMain)?.url ||
                      '/placeholders/user.png'
                  )}
                  alt={secondParty.firstName}
                  width={28}
                  height={28}
                  className="rounded-full border-2 border-white shadow-sm"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {firstParty.firstName} ↔ {secondParty.firstName}
                </p>
                <p className="text-[10px] text-gray-400">
                  {firstPartyAge} · {secondPartyAge}
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border-0',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              {statusText.shortLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Full variant ──
  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300 group border bg-white hover:shadow-xl',
          isExpanded && 'shadow-xl ring-1 ring-purple-100',
          suggestion.priority === 'URGENT' && 'border-r-[3px] border-r-red-400',
          suggestion.priority === 'HIGH' &&
            'border-r-[3px] border-r-orange-400',
          isTerminal && 'opacity-60',
          className
        )}
      >
        <CardContent className="p-0">
          {/* ══ COLLAPSED VIEW ══ */}
          <div className="p-4">
            {/* שני הצדדים */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <PartyMini
                  party={firstParty}
                  age={firstPartyAge}
                  side="right"
                />
              </div>
              <div className="flex-shrink-0 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <PartyMini
                  party={secondParty}
                  age={secondPartyAge}
                  side="left"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-3 pt-3 border-t border-gray-50">
              <StatusTimeline currentStatus={suggestion.status} />
            </div>

            {/* Status label + badges */}
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <Badge
                className={cn(
                  'text-[10px] px-2.5 py-0.5 rounded-full font-semibold border-0',
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                <statusInfo.icon className="w-3 h-3 ml-1" />
                {statusText.shortLabel}
              </Badge>
              {suggestion.priority === 'URGENT' && (
                <Badge className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 border-0 font-bold">
                  <Flame className="w-3 h-3 ml-1 animate-pulse" />
                  {priorityText.label}
                </Badge>
              )}
              {suggestion.priority === 'HIGH' && (
                <Badge className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 border-0 font-bold">
                  {priorityText.label}
                </Badge>
              )}
              <DeadlineWarning
                daysLeft={daysLeft}
                status={suggestion.status}
                dict={dict.deadline}
              />
            </div>

            {/* Contextual hint */}
            {hint && (
              <div
                className={cn(
                  'flex items-center gap-2 mt-2.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                  hint.color
                )}
              >
                <hint.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{hint.text}</span>
              </div>
            )}

            {/* ═══ ACTION BAR — הלב של הכרטיס ═══ */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 gap-2">
              {/* שמאל: Primary Action + More Actions */}
              <div className="flex items-center gap-2">
                <PrimaryActionButton
                  suggestion={suggestion}
                  onAction={onAction}
                  dict={dict}
                />
                <MoreActionsButton
                  suggestion={suggestion}
                  onAction={onAction}
                  dict={dict}
                />
              </div>

              {/* ימין: Quick Actions */}
              <div className="flex items-center gap-1">
                {/* Chat */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-cyan-50 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('message', suggestion);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 text-cyan-500" />
                      {unreadChatCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
                          {unreadChatCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{dict.actions.sendMessage}</TooltipContent>
                </Tooltip>

                {/* View */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-purple-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('view', suggestion);
                      }}
                    >
                      <Eye className="w-4 h-4 text-purple-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{dict.actions.viewDetails}</TooltipContent>
                </Tooltip>

                {/* Expand */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </Button>

                {/* More menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl shadow-xl border-0"
                  >
                    <DropdownMenuItem
                      onClick={() => onAction('view', suggestion)}
                    >
                      <Eye className="w-4 h-4 ml-2 text-purple-500" />
                      <span>{dict.actions.viewDetails}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAction('edit', suggestion)}
                    >
                      <Edit className="w-4 h-4 ml-2 text-blue-500" />
                      <span>{dict.actions.edit}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAction('message', suggestion)}
                    >
                      <MessageCircle className="w-4 h-4 ml-2 text-cyan-500" />
                      <span>{dict.actions.sendMessage}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <EyeOff className="w-4 h-4 ml-2 text-amber-500" />
                        <span>
                          {dict.actions?.hideCandidate || 'הסתר מועמד/ת'}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-52 rounded-xl shadow-xl border-0">
                        <DropdownMenuItem
                          onClick={() => onAction('hideFirstParty', suggestion)}
                          className="cursor-pointer"
                        >
                          <EyeOff className="w-4 h-4 ml-2 text-amber-500" />
                          <span>
                            {dict.actions?.hideParty?.replace(
                              '{{name}}',
                              firstParty.firstName
                            ) || `הסתר את ${firstParty.firstName}`}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onAction('hideSecondParty', suggestion)
                          }
                          className="cursor-pointer"
                        >
                          <EyeOff className="w-4 h-4 ml-2 text-amber-500" />
                          <span>
                            {dict.actions?.hideParty?.replace(
                              '{{name}}',
                              secondParty.firstName
                            ) || `הסתר את ${secondParty.firstName}`}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onAction('delete', suggestion)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      <span>{dict.actions.delete}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* ══ EXPANDED VIEW ══ */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="pt-3">
                <ExpandedDetails
                  suggestion={suggestion}
                  firstParty={firstParty}
                  secondParty={secondParty}
                  firstPartyAge={firstPartyAge}
                  secondPartyAge={secondPartyAge}
                  statusInfo={statusInfo}
                  statusText={statusText}
                  daysLeft={daysLeft}
                  dict={dict}
                  matchmaker={matchmaker}
                />
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(suggestion.createdAt), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default React.memo(SuggestionCard);
