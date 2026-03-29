// src/components/matchmaker/suggestions/details/SuggestionDetailsDialog.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import SuggestionChatTab from './SuggestionChatTab';
import SfSliderComparison from './SfSliderComparison';
import SfPreferenceAlignment from './SfPreferenceAlignment';
import AiChatInsightsPanel from '../AiChatInsightsPanel';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileCard } from '@/components/profile';
import { Timeline } from '@/components/ui/timeline';
import { Progress } from '@/components/ui/progress';
import {
  Bookmark,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  RefreshCw,
  Edit,
  Calendar,
  Clock,
  ArrowLeft,
  AlarmClock,
  Trash2,
  User,
  Crown,
  Heart,
  Gem,
  Eye,
  Settings,
  Archive,
  Maximize,
  Minimize,
  X as CloseIcon,
  MapPin,
  Briefcase,
  GraduationCap,
  Quote,
  Phone,
  Ban,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// ✅ CHANGED: Import from pure logic file instead of StatusTransitionService
import {
  getAvailableActions,
  type SuggestionWithParties,
} from '../services/suggestions/StatusTransitionLogic';

import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import Image from 'next/image';

import { MatchSuggestionStatus } from '@prisma/client';
import type {
  ExtendedMatchSuggestion,
  ActionAdditionalData,
  SuggestionParty,
} from '@/types/suggestions';
import type { UserImage } from '@prisma/client';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  MatchmakerPageDictionary,
  SuggestionsDictionary,
  ProfilePageDictionary,
} from '@/types/dictionary';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type SuggestionDetailsActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder'
  | 'sendReminder'
  | 'shareContacts'
  | 'scheduleMeeting'
  | 'viewMeetings'
  | 'exportHistory'
  | 'export'
  | 'resendToAll';

interface DialogActionData extends ActionAdditionalData {
  suggestionId?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
  suggestion?: ExtendedMatchSuggestion;
  partyId?: string;
  type?: string;
  partyType?: 'first' | 'second' | 'both';
}

interface SuggestionDetailsDialogProps {
  suggestion: ExtendedMatchSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (
    action: SuggestionDetailsActionType,
    data?: DialogActionData
  ) => void;
  userId: string;
  matchmakerDict: MatchmakerPageDictionary;
  suggestionsDict: SuggestionsDictionary;
  profileDict: ProfilePageDictionary;
  locale: 'he' | 'en';
}

interface StatusInfo {
  icon: LucideIcon;
  color: string;
  textColor: string;
  bgColor: string;
  badgeColor: string;
  accentColor: string;
  progress: number;
}

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════════════════

const STATUS_INFO_MAP: Record<string, StatusInfo> = {
  DRAFT: {
    icon: Edit,
    color: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    accentColor: 'bg-gray-400',
    progress: 10,
  },
  AWAITING_MATCHMAKER_APPROVAL: {
    icon: User,
    color: 'orange',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    accentColor: 'bg-orange-500',
    progress: 15,
  },
  PENDING_FIRST_PARTY: {
    icon: Clock,
    color: 'amber',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    accentColor: 'bg-amber-500',
    progress: 25,
  },
  FIRST_PARTY_APPROVED: {
    icon: CheckCircle,
    color: 'green',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    accentColor: 'bg-green-500',
    progress: 40,
  },
  FIRST_PARTY_INTERESTED: {
    icon: Bookmark,
    color: 'amber',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    accentColor: 'bg-amber-500',
    progress: 30,
  },
  FIRST_PARTY_DECLINED: {
    icon: XCircle,
    color: 'red',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    accentColor: 'bg-red-500',
    progress: 0,
  },
  PENDING_SECOND_PARTY: {
    icon: Clock,
    color: 'blue',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    accentColor: 'bg-blue-500',
    progress: 50,
  },
  SECOND_PARTY_APPROVED: {
    icon: CheckCircle,
    color: 'emerald',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accentColor: 'bg-emerald-500',
    progress: 60,
  },
  SECOND_PARTY_DECLINED: {
    icon: XCircle,
    color: 'red',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    accentColor: 'bg-red-500',
    progress: 0,
  },
  SECOND_PARTY_NOT_AVAILABLE: {
    icon: Clock,
    color: 'amber',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    accentColor: 'bg-amber-500',
    progress: 45,
  },
  RE_OFFERED_TO_FIRST_PARTY: {
    icon: RefreshCw,
    color: 'blue',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    accentColor: 'bg-blue-500',
    progress: 35,
  },
  CONTACT_DETAILS_SHARED: {
    icon: Phone,
    color: 'purple',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    accentColor: 'bg-purple-500',
    progress: 70,
  },
  MEETING_SCHEDULED: {
    icon: Calendar,
    color: 'blue',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    accentColor: 'bg-blue-500',
    progress: 74,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    icon: MessageCircle,
    color: 'violet',
    textColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
    badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
    accentColor: 'bg-violet-500',
    progress: 76,
  },
  PROCEEDING_TO_SECOND_DATE: {
    icon: Heart,
    color: 'pink',
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
    accentColor: 'bg-pink-500',
    progress: 78,
  },
  ENDED_AFTER_FIRST_DATE: {
    icon: XCircle,
    color: 'red',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    accentColor: 'bg-red-500',
    progress: 0,
  },
  DATING: {
    icon: Heart,
    color: 'pink',
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
    accentColor: 'bg-pink-500',
    progress: 80,
  },
  ENGAGED: {
    icon: Gem,
    color: 'yellow',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    accentColor: 'bg-yellow-500',
    progress: 95,
  },
  MARRIED: {
    icon: Crown,
    color: 'emerald',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accentColor: 'bg-emerald-500',
    progress: 100,
  },
  EXPIRED: {
    icon: AlarmClock,
    color: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    accentColor: 'bg-gray-400',
    progress: 0,
  },
  CLOSED: {
    icon: Archive,
    color: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    accentColor: 'bg-gray-400',
    progress: 0,
  },
  CANCELLED: {
    icon: Ban,
    color: 'gray',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
    accentColor: 'bg-gray-400',
    progress: 0,
  },
};

const getStatusInfo = (status: string): StatusInfo =>
  STATUS_INFO_MAP[status] || {
    icon: RefreshCw,
    color: 'gray',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
    accentColor: 'bg-gray-400',
    progress: 10,
  };

// ═══════════════════════════════════════════════════════════════
// TRANSITION METADATA — מטא-דאטה ויזואלי למעברי סטטוס
// ═══════════════════════════════════════════════════════════════

interface TransitionMeta {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  category: 'advance' | 'update' | 'close';
  description: string;
}

const TRANSITION_META: Record<string, TransitionMeta> = {
  PENDING_FIRST_PARTY: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', category: 'advance', description: 'ההצעה תישלח לאישור צד א׳' },
  FIRST_PARTY_APPROVED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300', category: 'advance', description: 'צד א׳ אישר/ה את ההצעה' },
  FIRST_PARTY_INTERESTED: { icon: Bookmark, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', category: 'update', description: 'שמירה ברשימת גיבוי' },
  FIRST_PARTY_DECLINED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', category: 'close', description: 'צד א׳ דחה/תה את ההצעה' },
  PENDING_SECOND_PARTY: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', category: 'advance', description: 'ההצעה תישלח לאישור צד ב׳' },
  SECOND_PARTY_APPROVED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', category: 'advance', description: 'צד ב׳ אישר/ה את ההצעה' },
  SECOND_PARTY_DECLINED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', category: 'close', description: 'צד ב׳ דחה/תה את ההצעה' },
  SECOND_PARTY_NOT_AVAILABLE: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', category: 'update', description: 'סימון שצד ב׳ לא זמין כרגע' },
  RE_OFFERED_TO_FIRST_PARTY: { icon: RefreshCw, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', category: 'update', description: 'שליחה מחדש לאישור צד א׳' },
  AWAITING_MATCHMAKER_APPROVAL: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', category: 'advance', description: 'ממתין לאישור סופי מהשדכן' },
  CONTACT_DETAILS_SHARED: { icon: Phone, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', category: 'advance', description: 'שיתוף פרטי קשר בין הצדדים' },
  AWAITING_FIRST_DATE_FEEDBACK: { icon: MessageCircle, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-300', category: 'advance', description: 'בקשת משוב לאחר הפגישה' },
  THINKING_AFTER_DATE: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', category: 'update', description: 'הצדדים בחשיבה לאחר הפגישה' },
  PROCEEDING_TO_SECOND_DATE: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-300', category: 'advance', description: 'המשך לפגישה שנייה' },
  ENDED_AFTER_FIRST_DATE: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', category: 'close', description: 'התהליך הסתיים לאחר הפגישה' },
  DATING: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-300', category: 'advance', description: 'הצדדים בתהליך היכרות פעיל' },
  ENGAGED: { icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300', category: 'advance', description: 'עדכון אירוסין' },
  MARRIED: { icon: Crown, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', category: 'advance', description: 'עדכון נישואין' },
  CANCELLED: { icon: Ban, color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', category: 'close', description: 'ביטול ההצעה וסגירת התהליך' },
  CLOSED: { icon: Archive, color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', category: 'close', description: 'סגירת ההצעה' },
};

const DEFAULT_TRANSITION_META: TransitionMeta = {
  icon: RefreshCw, color: 'text-gray-600', bgColor: 'bg-gray-50',
  borderColor: 'border-gray-300', category: 'update', description: '',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const calculateAge = (
  birthDate: string | Date | null | undefined
): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const getPartyImage = (party: SuggestionParty): string => {
  const main = party.images?.find((img: UserImage) => img.isMain);
  return main?.url
    ? getRelativeCloudinaryPath(main.url)
    : '/placeholders/user.png';
};

const getPartyResponseStatus = (
  suggestion: ExtendedMatchSuggestion,
  side: 'first' | 'second'
): { label: string; color: string; icon: LucideIcon } | null => {
  const s = suggestion.status;
  if (side === 'first') {
    if (
      [
        'FIRST_PARTY_APPROVED',
        'PENDING_SECOND_PARTY',
        'SECOND_PARTY_APPROVED',
        'SECOND_PARTY_DECLINED',
        'CONTACT_DETAILS_SHARED',
        'MEETING_SCHEDULED',
        'DATING',
        'ENGAGED',
        'MARRIED',
      ].includes(s)
    )
      return {
        label: 'אישר/ה',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle,
      };
    if (s === 'FIRST_PARTY_INTERESTED')
      return {
        label: 'מתעניין/ת',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: Bookmark,
      };
    if (s === 'FIRST_PARTY_DECLINED')
      return {
        label: 'דחה/תה',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
      };
    if (s === 'PENDING_FIRST_PARTY')
      return {
        label: 'ממתין/ה',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: Clock,
      };
  }
  if (side === 'second') {
    if (
      [
        'SECOND_PARTY_APPROVED',
        'CONTACT_DETAILS_SHARED',
        'MEETING_SCHEDULED',
        'DATING',
        'ENGAGED',
        'MARRIED',
      ].includes(s)
    )
      return {
        label: 'אישר/ה',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle,
      };
    if (s === 'SECOND_PARTY_DECLINED')
      return {
        label: 'דחה/תה',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
      };
    if (s === 'PENDING_SECOND_PARTY')
      return {
        label: 'ממתין/ה',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: Clock,
      };
    if (s === 'SECOND_PARTY_NOT_AVAILABLE')
      return {
        label: 'לא זמין/ה',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: Clock,
      };
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/** Party mini card for overview */
const PartyOverviewCard: React.FC<{
  party: SuggestionParty;
  label: string;
  responseStatus: { label: string; color: string; icon: LucideIcon } | null;
  onViewProfile: () => void;
}> = ({ party, label, responseStatus, onViewProfile }) => {
  const age = calculateAge(party.profile?.birthDate);
  const imageUrl = getPartyImage(party);
  const ResponseIcon = responseStatus?.icon;

  return (
    <div
      className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer group"
      onClick={onViewProfile}
    >
      {/* Label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
        {label}
      </p>

      {/* Photo + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-purple-200 transition-all flex-shrink-0">
          <Image
            src={imageUrl}
            alt={party.firstName}
            fill
            className="object-cover"
            sizes="4rem"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
            {party.firstName} {party.lastName}
          </h3>
          {age && <p className="text-sm text-gray-500">{age}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {party.profile?.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{party.profile.city}</span>
          </div>
        )}
        {party.profile?.occupation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{party.profile.occupation}</span>
          </div>
        )}
        {party.profile?.education && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{party.profile.education}</span>
          </div>
        )}
      </div>

      {/* Response Status */}
      {responseStatus && ResponseIcon && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border w-fit',
            responseStatus.color
          )}
        >
          <ResponseIcon className="w-3.5 h-3.5" />
          {responseStatus.label}
        </div>
      )}
    </div>
  );
};

/** Overview tab content */
const OverviewTab: React.FC<{
  suggestion: ExtendedMatchSuggestion;
  statusInfo: StatusInfo;
  statusLabel: string;
  dict: SuggestionDetailsDialogProps['matchmakerDict']['suggestionDetailsDialog'];
  locale: 'he' | 'en';
  onAction: SuggestionDetailsDialogProps['onAction'];
  onTabChange: (tab: string) => void;
  onShowStatusChange: () => void;
  userId: string;
}> = ({
  suggestion,
  statusInfo,
  statusLabel,
  dict,
  locale,
  onAction,
  onTabChange,
  onShowStatusChange,
  userId,
}) => {
  const firstStatus = getPartyResponseStatus(suggestion, 'first');
  const secondStatus = getPartyResponseStatus(suggestion, 'second');

  // ✅ CHANGED: Use imported function directly
  const availableActions = useMemo(
    () =>
      getAvailableActions(
        suggestion as unknown as SuggestionWithParties,
        userId
      ),
    [suggestion, userId]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* ── Parties Comparison ── */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
        <PartyOverviewCard
          party={suggestion.firstParty}
          label={dict.tabs?.firstParty || 'צד א׳'}
          responseStatus={firstStatus}
          onViewProfile={() => onTabChange('firstParty')}
        />

        {/* Heart connector */}
        <div className="flex items-center justify-center py-2 sm:py-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
        </div>

        <PartyOverviewCard
          party={suggestion.secondParty}
          label={dict.tabs?.secondParty || 'צד ב׳'}
          responseStatus={secondStatus}
          onViewProfile={() => onTabChange('secondParty')}
        />
      </div>

      {/* ── Status & Progress ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <statusInfo.icon className={cn('w-4 h-4', statusInfo.textColor)} />
            <span className="font-semibold text-gray-800 text-sm">
              {statusLabel}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {statusInfo.progress}%
          </span>
        </div>
        <Progress value={statusInfo.progress} className="h-2 bg-gray-100" />

        {/* Key dates row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDistanceToNow(new Date(suggestion.createdAt), {
                addSuffix: true,
                locale: locale === 'he' ? he : undefined,
              })}
            </span>
          </div>
          {suggestion.decisionDeadline && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>
                {dict.overview?.deadline || 'דדליין'}:{' '}
                {formatDistanceToNow(new Date(suggestion.decisionDeadline), {
                  addSuffix: true,
                  locale: locale === 'he' ? he : undefined,
                })}
              </span>
            </div>
          )}
          {suggestion.priority && suggestion.priority !== 'MEDIUM' && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {dict.overview?.priority || 'עדיפות'}:{' '}
                {suggestion.priority === 'URGENT'
                  ? '🔴 דחוף'
                  : suggestion.priority === 'HIGH'
                    ? '🟠 גבוהה'
                    : suggestion.priority}
              </span>
            </div>
          )}
          {suggestion.matchmaker && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>
                {suggestion.matchmaker.firstName}{' '}
                {suggestion.matchmaker.lastName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Matching Reason ── */}
      {suggestion.matchingReason && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 flex-shrink-0">
              <Quote className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                {dict.overview?.matchReason || 'סיבת ההתאמה'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                &ldquo;{suggestion.matchingReason}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          {dict.overview?.nextSteps || 'פעולות הבאות'}
        </p>

        {/* Recommended actions from transition service */}
        {availableActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {availableActions.slice(0, 3).map((action) => (
              <Button
                key={action.id}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md rounded-xl text-xs h-9 px-4"
                onClick={() =>
                  onAction('changeStatus', {
                    suggestionId: suggestion.id,
                    newStatus: action.nextStatus,
                  })
                }
              >
                {action.label}
                <ArrowLeft className="w-3 h-3 mr-1.5" />
              </Button>
            ))}
          </div>
        )}

        {/* Always-available actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 border-gray-200"
            onClick={onShowStatusChange}
          >
            <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
            {dict.actions?.statusChange?.button || 'שנה סטטוס'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 border-gray-200"
            onClick={() => onAction('edit', { suggestion })}
          >
            <Edit className="w-3.5 h-3.5 ml-1.5" />
            {dict.actions?.edit?.button || 'ערוך'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 border-gray-200"
            onClick={() => onAction('message', { suggestion })}
          >
            <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
            {dict.overview?.sendMessage || 'שלח הודעה'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 border-gray-200"
            onClick={() => onTabChange('chat')}
          >
            <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
            {dict.tabs?.chat || 'צ׳אט'}
          </Button>
        </div>
      </div>

      {/* ── Notes ── */}
      {(suggestion.internalNotes ||
        suggestion.firstPartyNotes ||
        suggestion.secondPartyNotes) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {dict.overview?.notes || 'הערות'}
          </p>
          {suggestion.internalNotes && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <span className="font-semibold text-gray-500 text-xs block mb-1">
                {dict.overview?.internalNotes || 'הערות פנימיות'}
              </span>
              {suggestion.internalNotes}
            </div>
          )}
          {suggestion.firstPartyNotes && (
            <div className="text-sm text-gray-600 bg-blue-50/50 rounded-lg p-3">
              <span className="font-semibold text-blue-500 text-xs block mb-1">
                {dict.overview?.firstPartyNotes || 'הערות צד א׳'}
              </span>
              {suggestion.firstPartyNotes}
            </div>
          )}
          {suggestion.secondPartyNotes && (
            <div className="text-sm text-gray-600 bg-purple-50/50 rounded-lg p-3">
              <span className="font-semibold text-purple-500 text-xs block mb-1">
                {dict.overview?.secondPartyNotes || 'הערות צד ב׳'}
              </span>
              {suggestion.secondPartyNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB CONFIG
// ═══════════════════════════════════════════════════════════════

const TAB_ICONS: Record<string, LucideIcon> = {
  overview: Eye,
  firstParty: User,
  secondParty: User,
  timeline: Calendar,
  dateFeedback: Heart,
  chat: MessageCircle,
  actions: Settings,
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
  userId,
  matchmakerDict,
  suggestionsDict: _suggestionsDict,
  profileDict,
  locale,
}) => {
  const dict = matchmakerDict.suggestionDetailsDialog;
  const [activeTab, setActiveTab] = useState('overview');
  const [firstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire] = useState<QuestionnaireResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [newStatus, setNewStatus] = useState<MatchSuggestionStatus | null>(
    null
  );
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [firstPartySfAnswers, setFirstPartySfAnswers] = useState<Record<string, unknown> | null>(null);
  const [secondPartySfAnswers, setSecondPartySfAnswers] = useState<Record<string, unknown> | null>(null);
  const [firstPartySfUpdatedAt, setFirstPartySfUpdatedAt] = useState<string | null>(null);
  const [secondPartySfUpdatedAt, setSecondPartySfUpdatedAt] = useState<string | null>(null);
  const { refreshNotifications } = useNotifications();

  // Fetch SF answers for both parties
  useEffect(() => {
    if (!isOpen || !suggestion) return;
    const fetchSf = async (userId: string) => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        const data = await res.json();
        return data.success ? { sfAnswers: data.sfAnswers || null, sfUpdatedAt: data.sfUpdatedAt || null } : { sfAnswers: null, sfUpdatedAt: null };
      } catch { return { sfAnswers: null, sfUpdatedAt: null }; }
    };
    fetchSf(suggestion.firstPartyId).then(r => { setFirstPartySfAnswers(r.sfAnswers); setFirstPartySfUpdatedAt(r.sfUpdatedAt); });
    fetchSf(suggestion.secondPartyId).then(r => { setSecondPartySfAnswers(r.sfAnswers); setSecondPartySfUpdatedAt(r.sfUpdatedAt); });
  }, [isOpen, suggestion?.firstPartyId, suggestion?.secondPartyId]);

  useEffect(() => {
    if (isOpen && suggestion) {
      setActiveTab('overview');
      setShowStatusChange(false);
      setNewStatus(null);
      setStatusChangeNote('');

      const hasUnread = suggestion.inquiries?.some(
        (inq) => inq.toUserId === userId && inq.status === 'PENDING'
      );
      if (hasUnread) {
        const markAsRead = async () => {
          try {
            await fetch(
              `/api/suggestions/${suggestion.id}/inquiries/mark-as-read`,
              { method: 'POST' }
            );
            refreshNotifications();
          } catch (error) {
            console.error('Failed to mark inquiries as read:', error);
          }
        };
        markAsRead();
      }
    }
  }, [isOpen, suggestion, userId, refreshNotifications]);

  // Extract date feedback from statusHistory (stored as JSON in notes field with reason=DATE_FEEDBACK)
  const dateFeedbackEntries = useMemo(() => {
    if (!suggestion?.statusHistory) return [];
    return suggestion.statusHistory
      .filter((h) => h.reason === 'DATE_FEEDBACK' && h.notes)
      .map((h) => {
        try {
          return JSON.parse(h.notes!);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }, [suggestion?.statusHistory]);

  const hasDateFeedback = dateFeedbackEntries.length > 0;

  // Add date feedback tab dynamically when feedback exists
  const tabEntries: [string, string][] = useMemo(() => {
    const base = Object.entries(dict.tabs) as [string, string][];
    if (hasDateFeedback) {
      const timelineIndex = base.findIndex(([key]) => key === 'timeline');
      const feedbackTab: [string, string] = ['dateFeedback', 'פידבק דייט'];
      if (timelineIndex >= 0) {
        base.splice(timelineIndex + 1, 0, feedbackTab);
      } else {
        base.push(feedbackTab);
      }
    }
    return base;
  }, [dict.tabs, hasDateFeedback]);

  const handleStatusChange = async () => {
    if (!newStatus || !suggestion) return;
    setIsLoading(true);
    try {
      onAction('changeStatus', {
        suggestionId: suggestion.id,
        newStatus,
        notes: statusChangeNote,
      });
      setShowStatusChange(false);
      setStatusChangeNote('');
      setNewStatus(null);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error(
        `${dict.toasts.statusUpdateError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestion) return null;

  const statusInfo = getStatusInfo(suggestion.status);
  const statusLabel = dict.statusLabels[suggestion.status] || suggestion.status;
  const StatusIcon = statusInfo.icon;

  // ✅ CHANGED: Use imported function directly
  const currentAvailableActions = getAvailableActions(
    suggestion as unknown as SuggestionWithParties,
    userId
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 border-0 bg-gray-50 overflow-hidden z-[50] flex flex-col transition-all duration-300',
          isFullscreen
            ? '!w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0'
            : 'md:max-w-5xl md:w-[95vw] md:h-[90vh] md:rounded-2xl shadow-2xl'
        )}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {dict.header.title.replace(
            '{{id}}',
            suggestion?.id?.toString().split('-')[0] || ''
          )}
        </DialogTitle>

        {/* ════════════════════════════════════════════
            STATUS ACCENT BAR
            ════════════════════════════════════════════ */}
        <div
          className={cn('h-1 w-full flex-shrink-0', statusInfo.accentColor)}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* ════════════════════════════════════════════
              HEADER
              ════════════════════════════════════════════ */}
          <div className="bg-white border-b border-gray-100 flex-shrink-0">
            {/* Title row */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <Badge
                  className={cn(
                    'text-xs font-semibold border px-2.5 py-1 rounded-lg flex-shrink-0',
                    statusInfo.badgeColor
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5 ml-1" />
                  {statusLabel}
                </Badge>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                    {suggestion.firstParty.firstName}{' '}
                    {suggestion.firstParty.lastName}
                    <span className="mx-1.5 text-gray-300">↔</span>
                    {suggestion.secondParty.firstName}{' '}
                    {suggestion.secondParty.lastName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-4 h-4" />
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isFullscreen
                        ? dict.header.minimizeTooltip
                        : dict.header.fullscreenTooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="px-4 sm:px-6 overflow-x-auto scrollbar-hide">
              <TabsList className="bg-transparent p-0 h-auto gap-0 w-auto inline-flex">
                {tabEntries.map(([key, label]) => {
                  const IconComponent = TAB_ICONS[key] || Eye;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className={cn(
                        'relative px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-none border-b-2 transition-all',
                        'data-[state=active]:border-purple-600 data-[state=active]:text-purple-700 data-[state=active]:bg-transparent',
                        'data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700'
                      )}
                    >
                      <IconComponent className="w-4 h-4 ml-1.5 inline-block" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              CONTENT
              ════════════════════════════════════════════ */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview */}
            <TabsContent value="overview" className="m-0 h-full">
              <OverviewTab
                suggestion={suggestion}
                statusInfo={statusInfo}
                statusLabel={statusLabel}
                dict={dict}
                locale={locale}
                onAction={onAction}
                onTabChange={setActiveTab}
                onShowStatusChange={() => setShowStatusChange(true)}
                userId={userId}
              />
              {firstPartySfAnswers && secondPartySfAnswers && (
                <div className="px-4 sm:px-6 pb-6 space-y-4">
                  <SfSliderComparison
                    sfAnswersA={firstPartySfAnswers}
                    sfAnswersB={secondPartySfAnswers}
                    genderA={suggestion.firstParty.profile?.gender || null}
                    genderB={suggestion.secondParty.profile?.gender || null}
                    nameA={suggestion.firstParty.firstName}
                    nameB={suggestion.secondParty.firstName}
                    locale={locale}
                  />
                  <SfPreferenceAlignment
                    sfAnswersA={firstPartySfAnswers}
                    sfAnswersB={secondPartySfAnswers}
                    genderA={suggestion.firstParty.profile?.gender || null}
                    genderB={suggestion.secondParty.profile?.gender || null}
                    nameA={suggestion.firstParty.firstName}
                    nameB={suggestion.secondParty.firstName}
                    locale={locale}
                  />
                </div>
              )}
            </TabsContent>

            {/* First Party Profile */}
            <TabsContent value="firstParty" className="m-0">
              <div className="p-4 sm:p-6">
                <ProfileCard
                  profile={suggestion.firstParty.profile}
                  images={suggestion.firstParty.images}
                  questionnaire={firstPartyQuestionnaire}
                  sfAnswers={firstPartySfAnswers}
                  sfUpdatedAt={firstPartySfUpdatedAt}
                  viewMode="matchmaker"
                  isProfileComplete={suggestion.firstParty.isProfileComplete}
                  dict={profileDict.profileCard}
                  locale={locale}
                />
              </div>
            </TabsContent>

            {/* Second Party Profile */}
            <TabsContent value="secondParty" className="m-0">
              <div className="p-4 sm:p-6">
                <ProfileCard
                  profile={suggestion.secondParty.profile}
                  images={suggestion.secondParty.images}
                  questionnaire={secondPartyQuestionnaire}
                  sfAnswers={secondPartySfAnswers}
                  sfUpdatedAt={secondPartySfUpdatedAt}
                  viewMode="matchmaker"
                  isProfileComplete={suggestion.secondParty.isProfileComplete}
                  dict={profileDict.profileCard}
                  locale={locale}
                />
              </div>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="m-0">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    {dict.timeline.title}
                  </h3>
                  <Timeline
                    items={(suggestion?.statusHistory || []).map((history) => {
                      const hStatus = getStatusInfo(history.status as string);
                      return {
                        title:
                          dict.statusLabels[history.status] || history.status,
                        description: history.notes || dict.timeline.noNotes,
                        date:
                          typeof history.createdAt === 'string'
                            ? new Date(history.createdAt)
                            : history.createdAt,
                        icon: hStatus.icon,
                      };
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Date Feedback */}
            {hasDateFeedback && (
              <TabsContent value="dateFeedback" className="m-0">
                <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    פידבק מדייט
                  </h3>

                  {dateFeedbackEntries.map((feedback: {
                    userId: string;
                    overallRating: number;
                    connectionFelt: boolean;
                    likedAspects: string[];
                    improvementAreas: string[];
                    wantSecondDate: string;
                    freeText?: string;
                    submittedAt: string;
                  }, idx: number) => {
                    const isFirstPartyFeedback = feedback.userId === suggestion.firstPartyId;
                    const partyName = isFirstPartyFeedback
                      ? suggestion.firstParty?.firstName
                      : suggestion.secondParty?.firstName;

                    const ratingEmojis = ['😞', '😕', '😐', '🙂', '😍'];
                    const secondDateLabels: Record<string, { text: string; color: string }> = {
                      yes: { text: 'כן, בהחלט!', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                      maybe: { text: 'אולי, צריך/ה לחשוב', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                      no: { text: 'לא, לא מרגיש נכון', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                    };
                    const likedLabels: Record<string, string> = {
                      conversation: 'שיחה זורמת',
                      humor: 'חוש הומור',
                      values: 'ערכים משותפים',
                      appearance: 'מראה חיצוני',
                      ambition: 'שאפתנות',
                      warmth: 'חום אישי',
                      intelligence: 'אינטליגנציה',
                      chemistry: 'כימיה',
                    };
                    const improvementLabels: Record<string, string> = {
                      conversation: 'השיחה לא זרמה',
                      values_gap: 'פער בערכים',
                      no_chemistry: 'חסר כימיה',
                      different_expectations: 'ציפיות שונות',
                      appearance: 'המראה לא תאם',
                      too_quiet: 'שקט/ה מדי',
                      too_intense: 'אינטנסיבי/ת מדי',
                    };
                    const secondDate = secondDateLabels[feedback.wantSecondDate] || secondDateLabels.maybe;

                    return (
                      <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">פידבק מ{partyName}</p>
                              <p className="text-xs text-gray-500">
                                {isFirstPartyFeedback ? 'צד א׳' : 'צד ב׳'}
                                {feedback.submittedAt && ` • ${new Date(feedback.submittedAt).toLocaleDateString('he-IL')}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">דירוג כללי:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <span
                                key={val}
                                className={cn(
                                  'text-lg',
                                  val <= feedback.overallRating ? 'opacity-100' : 'opacity-20'
                                )}
                              >
                                ⭐
                              </span>
                            ))}
                            <span className="text-xl mr-2">
                              {ratingEmojis[feedback.overallRating - 1]}
                            </span>
                          </div>
                        </div>

                        {/* Connection */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">חיבור:</span>
                          <Badge className={cn(
                            'border',
                            feedback.connectionFelt
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}>
                            {feedback.connectionFelt ? '✓ הרגיש חיבור' : '✗ לא הרגיש חיבור'}
                          </Badge>
                        </div>

                        {/* Liked aspects */}
                        {feedback.likedAspects?.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 block mb-1.5">מה אהב/ה:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {feedback.likedAspects.map((key: string) => (
                                <Badge key={key} className="bg-teal-50 text-teal-700 border border-teal-200 text-xs">
                                  {likedLabels[key] || key}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvement areas */}
                        {feedback.improvementAreas?.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 block mb-1.5">מה היה פחות:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {feedback.improvementAreas.map((key: string) => (
                                <Badge key={key} className="bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                                  {improvementLabels[key] || key}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Second date */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">דייט שני:</span>
                          <Badge className={cn('border', secondDate.color)}>
                            {secondDate.text}
                          </Badge>
                        </div>

                        {/* Free text */}
                        {feedback.freeText && (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1 font-medium">הערות נוספות:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{feedback.freeText}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {/* Chat */}
            <TabsContent value="chat" className="m-0 h-full">
              {/* AI Chat Insights for this suggestion */}
              <div className="px-4 pt-3">
                <AiChatInsightsPanel suggestionId={suggestion.id} />
              </div>

              <SuggestionChatTab
                suggestionId={suggestion.id}
                locale={locale}
                dict={dict.chatTab}
              />
            </TabsContent>

            {/* Actions */}
            <TabsContent value="actions" className="m-0">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-500" />
                  {dict.actions.title}
                </h3>

                {/* Status Change - inline */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {dict.actions.statusChange.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {dict.actions.statusChange.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    onClick={() => setShowStatusChange(true)}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    {dict.actions.statusChange.button}
                  </Button>
                </div>

                {/* Edit */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Edit className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {dict.actions.edit.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {dict.actions.edit.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                    onClick={() => onAction('edit', { suggestion })}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    {dict.actions.edit.button}
                  </Button>
                </div>

                {/* Delete */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-50">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {dict.actions.delete.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {dict.actions.delete.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={() =>
                      onAction('delete', { suggestionId: suggestion.id })
                    }
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    {dict.actions.delete.button}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* ════════════════════════════════════════════
            STATUS CHANGE MODAL — World-class redesign
            ════════════════════════════════════════════ */}
        {showStatusChange && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowStatusChange(false);
            }}
          >
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">

              {/* ── Header ── */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {dict.statusChangeModal.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {suggestion.firstParty.firstName} {suggestion.firstParty.lastName}
                      {' '}↔{' '}
                      {suggestion.secondParty.firstName} {suggestion.secondParty.lastName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-gray-100 -mt-1"
                    onClick={() => setShowStatusChange(false)}
                  >
                    <CloseIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                {/* ── Current → New Status Preview ── */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50/60 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Current status */}
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold',
                      statusInfo.badgeColor
                    )}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusLabel}</span>
                    </div>

                    {newStatus && (
                      <>
                        <div className="flex items-center">
                          <ArrowLeft className="w-5 h-5 text-gray-300" />
                        </div>
                        {/* New status */}
                        {(() => {
                          const newMeta = TRANSITION_META[newStatus] || DEFAULT_TRANSITION_META;
                          const newInfo = STATUS_INFO_MAP[newStatus];
                          const NewIcon = newMeta.icon;
                          return (
                            <div className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold animate-in fade-in slide-in-from-right-2 duration-300',
                              newInfo?.badgeColor || 'bg-gray-100 text-gray-700 border-gray-200'
                            )}>
                              <NewIcon className="w-4 h-4" />
                              <span>{dict.statusLabels[newStatus] || newStatus}</span>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {dict.statusChangeModal.currentStatusLabel}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {newStatus ? (STATUS_INFO_MAP[newStatus]?.progress ?? statusInfo.progress) : statusInfo.progress}%
                      </span>
                    </div>
                    <Progress
                      value={newStatus ? (STATUS_INFO_MAP[newStatus]?.progress ?? statusInfo.progress) : statusInfo.progress}
                      className="h-1.5 bg-gray-200/60 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* ── Action Cards by Category ── */}
                {(() => {
                  const enrichedActions = currentAvailableActions.map(action => ({
                    ...action,
                    meta: TRANSITION_META[action.nextStatus] || DEFAULT_TRANSITION_META,
                  }));
                  const advanceActions = enrichedActions.filter(a => a.meta.category === 'advance');
                  const updateActions = enrichedActions.filter(a => a.meta.category === 'update');
                  const closeActions = enrichedActions.filter(a => a.meta.category === 'close');

                  const renderActionCard = (action: typeof enrichedActions[0]) => {
                    const ActionIcon = action.meta.icon;
                    const isSelected = newStatus === action.nextStatus;
                    return (
                      <button
                        key={action.id}
                        className={cn(
                          'w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-right group',
                          isSelected
                            ? `${action.meta.borderColor} ${action.meta.bgColor} shadow-sm scale-[1.01]`
                            : 'border-transparent hover:bg-gray-50/80 hover:border-gray-100'
                        )}
                        onClick={() => setNewStatus(action.nextStatus)}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                          isSelected ? action.meta.bgColor : 'bg-gray-100 group-hover:bg-gray-200/60'
                        )}>
                          <ActionIcon className={cn(
                            'w-[18px] h-[18px] transition-colors duration-200',
                            isSelected ? action.meta.color : 'text-gray-400 group-hover:text-gray-600'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-semibold text-sm transition-colors duration-200',
                            isSelected ? 'text-gray-900' : 'text-gray-700'
                          )}>
                            {action.label}
                          </p>
                          {action.meta.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                              {action.meta.description}
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                          isSelected
                            ? `${action.meta.borderColor} ${action.meta.bgColor}`
                            : 'border-gray-200'
                        )}>
                          {isSelected && <CheckCircle className={cn('w-4 h-4', action.meta.color)} />}
                        </div>
                      </button>
                    );
                  };

                  return (
                    <div className="space-y-4">
                      {advanceActions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                              {dict.statusChangeModal.recommendedLabel || 'קידום'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {advanceActions.map(renderActionCard)}
                          </div>
                        </div>
                      )}
                      {updateActions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                              עדכון
                            </span>
                          </div>
                          <div className="space-y-1">
                            {updateActions.map(renderActionCard)}
                          </div>
                        </div>
                      )}
                      {closeActions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2 px-1">
                            <Ban className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                              סגירה
                            </span>
                          </div>
                          <div className="space-y-1">
                            {closeActions.map(renderActionCard)}
                          </div>
                        </div>
                      )}
                      {currentAvailableActions.length === 0 && (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <Ban className="w-7 h-7 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-400">
                            {dict.statusChangeModal.noRecommendations || 'אין פעולות זמינות לסטטוס זה'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Notes ── */}
                <div className="pt-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    {dict.statusChangeModal.notesLabel}
                  </p>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder={dict.statusChangeModal.notesPlaceholder}
                    className="min-h-[72px] resize-none rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200/30 text-sm"
                  />
                </div>

                {/* ── Destructive Warning ── */}
                {newStatus && TRANSITION_META[newStatus]?.category === 'close' && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">שים/י לב</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        פעולה זו תשלח התראות לצדדים הרלוונטיים ועלולה לסגור את ההצעה.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
                <Button
                  variant="ghost"
                  onClick={() => setShowStatusChange(false)}
                  className="rounded-xl px-5 text-gray-600 hover:text-gray-800"
                >
                  {dict.statusChangeModal.cancelButton}
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={!newStatus || isLoading}
                  className={cn(
                    'rounded-xl px-6 text-white shadow-md transition-all duration-200 min-w-[120px]',
                    !newStatus
                      ? 'bg-gray-300 cursor-not-allowed shadow-none'
                      : newStatus && TRANSITION_META[newStatus]?.category === 'close'
                        ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg'
                  )}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      {dict.statusChangeModal.savingButton}
                    </>
                  ) : newStatus && TRANSITION_META[newStatus]?.category === 'close' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 ml-2" />
                      {dict.statusChangeModal.saveButton}
                    </>
                  ) : (
                    dict.statusChangeModal.saveButton
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;