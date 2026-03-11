// src/app/components/matchmaker/suggestions/details/SuggestionDetailsDialog.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import SuggestionChatTab from './SuggestionChatTab';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowRight,
  Edit2,
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
  Sparkles,
  Phone,
  Ban,
  CalendarClock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  statusTransitionService,
  type SuggestionWithParties,
} from '../services/suggestions/StatusTransitionService';
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

  const availableActions = useMemo(
    () =>
      statusTransitionService.getAvailableActions(
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
  suggestionsDict,
  profileDict,
  locale,
}) => {
  const dict = matchmakerDict.suggestionDetailsDialog;
  const [activeTab, setActiveTab] = useState('overview');
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
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
  const { refreshNotifications } = useNotifications();

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
  const tabEntries: [string, string][] = Object.entries(dict.tabs);

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
            </TabsContent>

            {/* First Party Profile */}
            <TabsContent value="firstParty" className="m-0">
              <div className="p-4 sm:p-6">
                <ProfileCard
                  profile={suggestion.firstParty.profile}
                  images={suggestion.firstParty.images}
                  questionnaire={firstPartyQuestionnaire}
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

            {/* Chat */}
            <TabsContent value="chat" className="m-0 h-full">
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
            STATUS CHANGE MODAL
            ════════════════════════════════════════════ */}
        {showStatusChange && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowStatusChange(false);
            }}
          >
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
              {/* Modal header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  {dict.statusChangeModal.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setShowStatusChange(false)}
                >
                  <CloseIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-5 space-y-5">
                {/* Current status */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <Badge
                    className={cn(
                      'text-xs font-semibold border px-2.5 py-1 rounded-lg',
                      statusInfo.badgeColor
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5 ml-1" />
                    {statusLabel}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {dict.statusChangeModal.currentStatusLabel}
                  </span>
                </div>

                {/* Recommended actions */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {dict.statusChangeModal.recommendedLabel ||
                      'פעולות מומלצות'}
                  </p>
                  <div className="space-y-1.5">
                    {statusTransitionService
                      .getAvailableActions(
                        suggestion as unknown as SuggestionWithParties,
                        userId
                      )
                      .map((action) => (
                        <button
                          key={action.id}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-right',
                            newStatus === action.nextStatus
                              ? 'border-purple-300 bg-purple-50 text-purple-700'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                          )}
                          onClick={() => setNewStatus(action.nextStatus)}
                        >
                          <span>{action.label}</span>
                          {newStatus === action.nextStatus && (
                            <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    {statusTransitionService.getAvailableActions(
                      suggestion as unknown as SuggestionWithParties,
                      userId
                    ).length === 0 && (
                      <p className="text-sm text-gray-400 italic py-2">
                        {dict.statusChangeModal.noRecommendations ||
                          'אין פעולות מומלצות לסטטוס זה'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Manual select */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {dict.statusChangeModal.manualLabel || 'בחירה ידנית'}
                  </p>
                  <Select
                    value={newStatus || undefined}
                    onValueChange={(v) =>
                      setNewStatus(v as MatchSuggestionStatus)
                    }
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl">
                      <SelectValue
                        placeholder={
                          dict.statusChangeModal.newStatusPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Object.entries(dict.statusLabels).map(
                        ([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {dict.statusChangeModal.notesLabel}
                  </p>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder={dict.statusChangeModal.notesPlaceholder}
                    className="min-h-[80px] resize-none rounded-xl"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStatusChange(false)}
                    className="rounded-xl"
                  >
                    {dict.statusChangeModal.cancelButton}
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        {dict.statusChangeModal.savingButton}
                      </>
                    ) : (
                      dict.statusChangeModal.saveButton
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;
