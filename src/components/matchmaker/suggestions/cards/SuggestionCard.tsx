// src/app/components/matchmaker/suggestions/cards/SuggestionCard.tsx

import React, { useMemo, useState } from 'react';
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
  Sparkles,
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
  GitBranchPlus,
  Phone,
  Users,
  Calendar,
  Ban,
  HeartHandshake,
  Gem,
  Send,
  UserCheck,
  UserX,
  ArrowLeftRight,
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

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (
    type:
      | 'view'
      | 'contact'
      | 'message'
      | 'edit'
      | 'delete'
      | 'resend'
      | 'changeStatus'
      | 'reminder',
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => void;
  dict: MatchmakerPageDictionary['suggestionsDashboard']['suggestionCard'];
  className?: string;
  variant?: 'full' | 'compact';
  unreadChatCount?: number;
  isMobile?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// STATUS TRANSITIONS MAP
// ═══════════════════════════════════════════════════════════════

interface StatusTransition {
  value: string;
  icon: React.ElementType;
  color: string;
}

const STATUS_TRANSITIONS: Record<string, StatusTransition[]> = {
  PENDING_FIRST_PARTY: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      value: 'FIRST_PARTY_INTERESTED',
      icon: Bookmark,
      color: 'text-amber-600',
    },
    { value: 'FIRST_PARTY_DECLINED', icon: XCircle, color: 'text-red-600' },
  ],
  FIRST_PARTY_APPROVED: [
    { value: 'PENDING_SECOND_PARTY', icon: Send, color: 'text-blue-600' },
    { value: 'FIRST_PARTY_DECLINED', icon: XCircle, color: 'text-red-600' },
  ],
  FIRST_PARTY_INTERESTED: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    { value: 'PENDING_SECOND_PARTY', icon: Send, color: 'text-blue-600' },
    { value: 'FIRST_PARTY_DECLINED', icon: XCircle, color: 'text-red-600' },
  ],
  PENDING_SECOND_PARTY: [
    {
      value: 'SECOND_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    { value: 'SECOND_PARTY_DECLINED', icon: XCircle, color: 'text-red-600' },
    {
      value: 'SECOND_PARTY_NOT_AVAILABLE',
      icon: Clock,
      color: 'text-amber-600',
    },
  ],
  SECOND_PARTY_APPROVED: [
    { value: 'CONTACT_DETAILS_SHARED', icon: Phone, color: 'text-purple-600' },
    { value: 'MEETING_SCHEDULED', icon: Calendar, color: 'text-blue-600' },
    { value: 'DATING', icon: Heart, color: 'text-pink-600' },
  ],
  SECOND_PARTY_NOT_AVAILABLE: [
    {
      value: 'RE_OFFERED_TO_FIRST_PARTY',
      icon: RefreshCw,
      color: 'text-blue-600',
    },
    { value: 'CLOSED', icon: Ban, color: 'text-gray-600' },
  ],
  RE_OFFERED_TO_FIRST_PARTY: [
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    { value: 'FIRST_PARTY_DECLINED', icon: XCircle, color: 'text-red-600' },
  ],
  CONTACT_DETAILS_SHARED: [
    { value: 'MEETING_SCHEDULED', icon: Calendar, color: 'text-blue-600' },
    { value: 'DATING', icon: Heart, color: 'text-pink-600' },
    { value: 'CLOSED', icon: Ban, color: 'text-gray-600' },
  ],
  MEETING_SCHEDULED: [
    { value: 'DATING', icon: Heart, color: 'text-pink-600' },
    { value: 'CLOSED', icon: Ban, color: 'text-gray-600' },
  ],
  DATING: [
    { value: 'ENGAGED', icon: Gem, color: 'text-purple-600' },
    { value: 'CLOSED', icon: Ban, color: 'text-gray-600' },
  ],
  ENGAGED: [
    { value: 'MARRIED', icon: HeartHandshake, color: 'text-pink-600' },
    { value: 'CLOSED', icon: Ban, color: 'text-gray-600' },
  ],
  FIRST_PARTY_DECLINED: [
    { value: 'PENDING_FIRST_PARTY', icon: RefreshCw, color: 'text-blue-600' },
  ],
  SECOND_PARTY_DECLINED: [
    { value: 'PENDING_SECOND_PARTY', icon: RefreshCw, color: 'text-blue-600' },
  ],
  EXPIRED: [
    { value: 'PENDING_FIRST_PARTY', icon: RefreshCw, color: 'text-blue-600' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * תצוגת אווטאר + שם ועיסוק
 */
const PartyMini: React.FC<{
  party: SuggestionParty;
  age: number;
  side?: 'right' | 'left';
  compact?: boolean;
}> = ({ party, age, side = 'right', compact = false }) => {
  const imageUrl =
    party.images.find((img: UserImage) => img.isMain)?.url ||
    '/placeholders/user.png';

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        side === 'left' && 'flex-row-reverse'
      )}
    >
      <div
        className={cn(
          'relative rounded-full overflow-hidden ring-2 ring-white shadow-md flex-shrink-0',
          compact ? 'h-9 w-9' : 'h-11 w-11'
        )}
      >
        <Image
          src={getRelativeCloudinaryPath(imageUrl)}
          alt={party.firstName}
          fill
          className="object-cover"
          sizes={compact ? '2.25rem' : '2.75rem'}
        />
      </div>
      <div className={cn('min-w-0', side === 'left' && 'text-left')}>
        <p
          className={cn(
            'font-semibold text-gray-900 truncate leading-tight',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {party.firstName} {party.lastName}
        </p>
        <p
          className={cn(
            'text-gray-500 truncate leading-tight',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {party.profile?.occupation || '—'} · {age}
        </p>
      </div>
    </div>
  );
};

/**
 * פס סטטוס דק עם אייקון ולייבל
 */
const StatusStrip: React.FC<{
  statusInfo: ReturnType<typeof getEnhancedStatusInfo>;
  statusText: { label: string; shortLabel: string; description: string };
  progress: number;
}> = ({ statusInfo, statusText, progress }) => {
  const StatusIcon = statusInfo.icon;
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          statusInfo.bgColor,
          statusInfo.color
        )}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        <span>{statusText.shortLabel}</span>
      </div>
      <div className="flex-1 max-w-[80px]">
        <Progress value={progress} className="h-1.5 bg-gray-100" />
      </div>
    </div>
  );
};

/**
 * Badge עדיפות קטן
 */
const PriorityDot: React.FC<{
  priority: string;
  priorityInfo: ReturnType<typeof getEnhancedPriorityInfo>;
  label: string;
}> = ({ priority, priorityInfo, label }) => {
  if (priority === 'MEDIUM' || priority === 'LOW') return null;
  const PriorityIcon = priorityInfo.icon;
  return (
    <Badge
      className={cn(
        'text-[10px] px-2 py-0.5 font-bold border-0 shadow-sm',
        priorityInfo.badgeClass
      )}
    >
      <PriorityIcon className="w-3 h-3 ml-1" />
      {label}
    </Badge>
  );
};

/**
 * אינדיקטור deadline דחוף
 */
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

/**
 * כפתור שינוי סטטוס ישיר
 */
const StatusChangeButton: React.FC<{
  suggestion: Suggestion;
  onAction: SuggestionCardProps['onAction'];
  dict: SuggestionCardProps['dict'];
  size?: 'sm' | 'md';
}> = ({ suggestion, onAction, dict, size = 'sm' }) => {
  const transitions = STATUS_TRANSITIONS[suggestion.status];

  if (!transitions || transitions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 font-medium transition-all',
            size === 'md' ? 'h-10 px-3 text-sm' : 'h-8 px-2.5 text-xs'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowLeftRight
            className={cn('ml-1.5', size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5')}
          />
          {dict.actions?.changeStatus || 'שנה סטטוס'}
          <ChevronDown
            className={cn('mr-1', size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3')}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl shadow-xl border-0 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {dict.actions?.selectNewStatus || 'בחר סטטוס חדש'}
        </div>
        <DropdownMenuSeparator />
        {transitions.map((transition) => {
          const TransitionIcon = transition.icon;
          const statusLabel =
            dict.statuses?.[transition.value]?.shortLabel ||
            dict.statuses?.[transition.value]?.label ||
            transition.value;
          return (
            <DropdownMenuItem
              key={transition.value}
              onClick={() =>
                onAction('changeStatus', suggestion, {
                  newStatus:
                    transition.value as ActionAdditionalData['newStatus'],
                })
              }
              className="rounded-lg py-2.5 px-3 cursor-pointer hover:bg-gray-50"
            >
              <TransitionIcon
                className={cn('w-4 h-4 ml-2.5 flex-shrink-0', transition.color)}
              />
              <span className="text-sm font-medium">{statusLabel}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPANDED SECTION
// ═══════════════════════════════════════════════════════════════

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
      {/* ── שני הצדדים בפירוט ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* צד ראשון */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
            {dict.desktop?.partyLabels?.firstParty || 'צד א׳'}
          </p>
          <PartyDetailBlock party={firstParty} age={firstPartyAge} />
          <PartyStatusBadge suggestion={suggestion} side="first" dict={dict} />
        </div>
        {/* צד שני */}
        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">
            {dict.desktop?.partyLabels?.secondParty || 'צד ב׳'}
          </p>
          <PartyDetailBlock party={secondParty} age={secondPartyAge} />
          <PartyStatusBadge suggestion={suggestion} side="second" dict={dict} />
        </div>
      </div>

      {/* ── סיבת ההתאמה ── */}
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

      {/* ── מטא-דאטה ── */}
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
        <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1 border">
          <TrendingUp className="w-3 h-3" />
          <span>{statusInfo.progress}%</span>
        </div>
      </div>

      {/* ── סטטוס מפורט ── */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <statusInfo.icon className={cn('w-4 h-4', statusInfo.color)} />
        <span className="font-medium">{statusText.label}</span>
        <span className="text-gray-400">—</span>
        <span>{statusText.description}</span>
      </div>

      <Progress value={statusInfo.progress} className="h-2 bg-gray-100" />
    </div>
  );
};

/**
 * בלוק פרטים מפורט של צד אחד
 */
const PartyDetailBlock: React.FC<{
  party: SuggestionParty;
  age: number;
}> = ({ party, age }) => {
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

/**
 * Badge סטטוס תגובה של צד מסוים
 */
const PartyStatusBadge: React.FC<{
  suggestion: Suggestion;
  side: 'first' | 'second';
  dict: SuggestionCardProps['dict'];
}> = ({ suggestion, side, dict }) => {
  const isFirst = side === 'first';
  const relevantStatuses = isFirst
    ? ['FIRST_PARTY_APPROVED', 'FIRST_PARTY_DECLINED', 'FIRST_PARTY_INTERESTED']
    : ['SECOND_PARTY_APPROVED', 'SECOND_PARTY_DECLINED'];

  if (!relevantStatuses.includes(suggestion.status)) return null;

  const isApproved = suggestion.status.includes('APPROVED');
  const isInterested = suggestion.status.includes('INTERESTED');

  return (
    <Badge
      className={cn(
        'text-[10px] border-0 shadow-sm',
        isApproved
          ? 'bg-green-100 text-green-700'
          : isInterested
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
      )}
    >
      {isApproved ? (
        <>
          <CheckCircle className="w-3 h-3 ml-1" />
          {dict.desktop?.partyStatus?.approved || 'אישר/ה'}
        </>
      ) : isInterested ? (
        <>
          <Bookmark className="w-3 h-3 ml-1" />
          {dict.desktop?.partyStatus?.interested || 'מתעניין/ת'}
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 ml-1" />
          {dict.desktop?.partyStatus?.declined || 'דחה/תה'}
        </>
      )}
    </Badge>
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

  const canBeResent = [
    'EXPIRED',
    'FIRST_PARTY_DECLINED',
    'SECOND_PARTY_DECLINED',
  ].includes(suggestion.status);

  // ─────────────────────────────────────────────────────────
  // Compact variant – לקנבן (mobile + desktop)
  // ─────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden',
          'border-r-[3px] bg-white',
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
                  {firstParty.firstName} {firstParty.lastName} ↔{' '}
                  {secondParty.firstName} {secondParty.lastName}
                </p>
                <p className="text-[10px] text-gray-400">
                  {firstPartyAge} · {secondPartyAge}
                </p>
              </div>
            </div>
            <StatusStrip
              statusInfo={statusInfo}
              statusText={statusText}
              progress={statusInfo.progress}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Full variant – Collapsed/Expanded (responsive)
  // ─────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden transition-all duration-300 group',
          'border bg-white hover:shadow-xl',
          isExpanded && 'shadow-xl ring-1 ring-purple-100',
          suggestion.priority === 'URGENT' && 'border-r-[3px] border-r-red-400',
          suggestion.priority === 'HIGH' &&
            'border-r-[3px] border-r-orange-400',
          className
        )}
      >
        <CardContent className="p-0">
          {/* ════════════════════════════════════════════════════
              COLLAPSED VIEW
              ════════════════════════════════════════════════════ */}
          <div className="p-4">
            {/* שני הצדדים – אנכי במובייל, אופקי בדסקטופ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* צד ראשון */}
              <div className="flex-1 min-w-0">
                <PartyMini
                  party={firstParty}
                  age={firstPartyAge}
                  side="right"
                />
              </div>

              {/* אייקון לב מרכזי */}
              <div className="flex-shrink-0 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
              </div>

              {/* צד שני */}
              <div className="flex-1 min-w-0">
                <PartyMini
                  party={secondParty}
                  age={secondPartyAge}
                  side="left"
                />
              </div>
            </div>

            {/* שורת סטטוס */}
            <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
              <StatusStrip
                statusInfo={statusInfo}
                statusText={statusText}
                progress={statusInfo.progress}
              />
              <PriorityDot
                priority={suggestion.priority}
                priorityInfo={priorityInfo}
                label={priorityText.label}
              />
              <DeadlineWarning
                daysLeft={daysLeft}
                status={suggestion.status}
                dict={dict.deadline}
              />
              {suggestion.priority === 'URGENT' && (
                <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              )}
            </div>

            {/* שורת פעולות */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              {/* כפתור שינוי סטטוס */}
              <StatusChangeButton
                suggestion={suggestion}
                onAction={onAction}
                dict={dict}
              />

              {/* כפתורי פעולה */}
              <div className="flex items-center gap-1.5">
                {/* עריכה */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction('edit', suggestion);
                      }}
                    >
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{dict.actions.edit}</TooltipContent>
                </Tooltip>

                {/* הודעה */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-cyan-50 relative"
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

                {/* צפייה */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-purple-50"
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

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-100"
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

                {/* תפריט נוסף */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 rounded-xl shadow-xl border-0"
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
                    {canBeResent && (
                      <DropdownMenuItem
                        onClick={() => onAction('resend', suggestion)}
                      >
                        <RefreshCw className="w-4 h-4 ml-2 text-green-500" />
                        <span>{dict.actions.resend}</span>
                      </DropdownMenuItem>
                    )}
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

          {/* ════════════════════════════════════════════════════
              EXPANDED VIEW
              ════════════════════════════════════════════════════ */}
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

                {/* כפתורי פעולה מורחבים */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 pt-3 border-t border-gray-100 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => onAction('view', suggestion)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md rounded-xl text-xs h-9 px-4"
                    >
                      <Eye className="w-3.5 h-3.5 ml-1.5" />
                      {dict.actions.viewDetails}
                      <ArrowRight className="w-3 h-3 mr-1" />
                    </Button>
                    <StatusChangeButton
                      suggestion={suggestion}
                      onAction={onAction}
                      dict={dict}
                    />
                    {canBeResent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction('resend', suggestion)}
                        className="rounded-xl text-xs h-9 border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
                        {dict.actions.resend}
                      </Button>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 text-center sm:text-right">
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
