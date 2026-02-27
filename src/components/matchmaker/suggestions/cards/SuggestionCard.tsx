// src/app/components/matchmaker/suggestions/cards/SuggestionCard.tsx

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import {
  Bookmark,
  Clock,
  MessageCircle,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  CalendarClock,
  Heart,
  MapPin,
  Sparkles,
  Quote,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Flame,
  TrendingUp,
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
import { TooltipProvider } from '@/components/ui/tooltip';
import type { MatchmakerPageDictionary } from '@/types/dictionary';

// ✅ import משותף במקום הגדרה מקומית מכופלת
import {
  getEnhancedStatusInfo,
  getEnhancedPriorityInfo,
  calculateAge,
  getDaysLeft,
} from '@/lib/suggestion-status-utils';

// ✅ useMediaQuery הוסר לגמרי! isMobile מגיע כ-prop מה-parent

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
  isMobile?: boolean; // ✅ חדש - מגיע מ-parent במקום useMediaQuery פנימי
}

const HighlightPill: React.FC<{
  icon: React.ElementType;
  text: string;
  color?: string;
}> = ({ icon: Icon, text, color = 'from-blue-500 to-cyan-500' }) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border-2 px-3 py-1.5 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
      'border-transparent bg-gradient-to-r text-white',
      color
    )}
  >
    <Icon className="w-3 h-3" />
    <span>{text}</span>
  </div>
);

const MatchmakerInfo: React.FC<{
  dict: MatchmakerPageDictionary['suggestionsDashboard']['suggestionCard']['matchmakerInfo'];
  matchmaker: { firstName: string; lastName: string } | undefined;
  className?: string;
}> = ({ dict, matchmaker, className }) => {
  if (!matchmaker) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 shadow-sm',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <p className="text-sm">{dict.noInfo}</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm',
        className
      )}
    >
      <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
          {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs font-medium text-purple-600">{dict.label}</p>
        <p className="text-sm font-bold text-gray-800">
          {matchmaker.firstName} {matchmaker.lastName}
        </p>
      </div>
    </div>
  );
};

const PartyDisplay: React.FC<{
  party: SuggestionParty;
  isCompact?: boolean;
}> = ({ party, isCompact = false }) => {
  const imageUrl =
    party.images.find((img: UserImage) => img.isMain)?.url ||
    '/placeholders/user.png';
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'relative rounded-full overflow-hidden shadow-xl border-3 border-white',
          isCompact ? 'h-12 w-12' : 'h-16 w-16'
        )}
      >
        <Image
          src={getRelativeCloudinaryPath(imageUrl)}
          alt={party.firstName}
          fill
          className="object-cover"
          sizes={isCompact ? '3rem' : '4rem'}
        />
      </div>
      <div className="text-center">
        <h4
          className={cn(
            'font-bold text-gray-800',
            isCompact ? 'text-sm' : 'text-base'
          )}
        >
          {party.firstName} {party.lastName}
        </h4>
        {party.profile?.city && (
          <div
            className={cn(
              'flex items-center justify-center gap-1 text-gray-600',
              isCompact ? 'text-xs' : 'text-sm'
            )}
          >
            <MapPin className="w-3 h-3 text-green-500" />
            <span>{party.profile.city}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  dict,
  className,
  variant = 'full',
  unreadChatCount = 0,
  isMobile = false, // ✅ prop במקום useMediaQuery
}) => {
  const { firstParty, secondParty, matchmaker } = suggestion;

  // ✅ Memoize חישובים כבדים - לא מחושבים מחדש אם ה-props לא השתנו
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

  const highlights = [
    {
      text: dict.highlights.familyValues,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
    },
    {
      text: dict.highlights.religiousView,
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      text: dict.highlights.location,
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
    },
  ].slice(0, 3);

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile Compact View
  // ─────────────────────────────────────────────────────────────────────────
  if (isMobile && variant === 'compact') {
    const StatusIcon = statusInfo.icon;
    return (
      <Card
        className={cn(
          'w-full cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden',
          'border-l-4 bg-gradient-to-br from-white to-gray-50/50',
          priorityInfo.borderColor,
          className
        )}
        onClick={() => onAction('view', suggestion)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-2 text-sm leading-tight">
                {firstParty.firstName} ו{secondParty.firstName}
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-2">
                  <Image
                    src={getRelativeCloudinaryPath(
                      firstParty.images.find((img) => img.isMain)?.url ||
                        '/placeholders/user.png'
                    )}
                    alt={firstParty.firstName}
                    width={24}
                    height={24}
                    className="rounded-full border-2 border-white shadow-md"
                  />
                  <Image
                    src={getRelativeCloudinaryPath(
                      secondParty.images.find((img) => img.isMain)?.url ||
                        '/placeholders/user.png'
                    )}
                    alt={secondParty.firstName}
                    width={24}
                    height={24}
                    className="rounded-full border-2 border-white shadow-md"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {firstPartyAge}, {secondPartyAge}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-r',
                statusInfo.bgColor
              )}
            >
              <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
            </div>
          </div>
          <Badge
            className={cn(
              'text-xs font-bold bg-opacity-20 border',
              priorityInfo.borderColor,
              statusInfo.color
            )}
          >
            {statusText.shortLabel}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile Full View
  // ─────────────────────────────────────────────────────────────────────────
  if (isMobile && variant === 'full') {
    return (
      <Card
        className={cn(
          'overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 hover:shadow-2xl transition-all duration-500 group',
          className
        )}
      >
        <CardContent className="p-6 space-y-6">
          <div className="relative">
            <div className="relative z-10 flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {dict.mobile.title}
              </h3>
              <Badge
                className={cn(
                  'text-sm font-bold shadow-xl',
                  priorityInfo.badgeClass
                )}
              >
                <statusInfo.icon className="w-4 h-4 ml-2" />
                {statusText.label}
              </Badge>
            </div>
          </div>
          {suggestion.priority === 'URGENT' && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-xl shadow-lg">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-red-700 font-bold text-sm">
                {dict.mobile.urgentTitle}
              </span>
            </div>
          )}
          <MatchmakerInfo dict={dict.matchmakerInfo} matchmaker={matchmaker} />
          <div>
            <h4 className="font-bold text-lg mb-3 text-center text-gray-700 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              {dict.mobile.connectionPoints}
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {highlights.map((highlight, index) => (
                <HighlightPill
                  key={index}
                  icon={highlight.icon}
                  text={highlight.text}
                  color={highlight.color}
                />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <PartyDisplay party={firstParty} />
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
                <Heart className="w-6 h-6" />
              </div>
            </div>
            <PartyDisplay party={secondParty} />
          </div>
          {suggestion.matchingReason && (
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl shadow-inner">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-cyan-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-cyan-800 mb-2">
                    {dict.mobile.matchReasonTitle}
                  </h4>
                  <p className="text-cyan-900 leading-relaxed italic font-medium text-sm">
                    &quot;{suggestion.matchingReason}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{statusText.description}</span>
              <span>{statusInfo.progress}%</span>
            </div>
            <Progress
              value={statusInfo.progress}
              className="h-2 bg-gray-100 shadow-inner"
            />
          </div>
          <div className="pt-4 border-t border-purple-100 space-y-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-14 font-bold text-lg transform hover:scale-105"
              onClick={() => onAction('view', suggestion)}
            >
              <Eye className="w-6 h-6 ml-3" />
              {dict.mobile.viewDetailsButton}
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                {dict.mobile.sentTime.replace(
                  '{{timeAgo}}',
                  formatDistanceToNow(new Date(suggestion.createdAt), {
                    addSuffix: true,
                    locale: he,
                  })
                )}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-500 hover:bg-purple-50 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onAction('edit', suggestion)}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    <span>{dict.actions.edit}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction('message', suggestion)}
                    className="relative"
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    <span>{dict.actions.sendMessage}</span>
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction('delete', suggestion)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    <span>{dict.actions.delete}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop View (default)
  // ─────────────────────────────────────────────────────────────────────────
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;
  const canBeResent = [
    'EXPIRED',
    'FIRST_PARTY_DECLINED',
    'SECOND_PARTY_DECLINED',
  ].includes(suggestion.status);

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-to-br from-white via-gray-50/30 to-purple-50/20',
          className
        )}
      >
        <div
          className={cn(
            'p-6 border-b relative overflow-hidden bg-gradient-to-r shadow-lg',
            statusInfo.bgColor
          )}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-white/20 backdrop-blur-sm">
                  <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg">
                    {statusText.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {statusText.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={priorityInfo.badgeClass}>
                  <PriorityIcon className="w-4 h-4 ml-2" />
                  {priorityText.label}
                </Badge>
                {daysLeft !== null &&
                  daysLeft <= 3 &&
                  suggestion.status !== 'EXPIRED' && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl animate-pulse">
                      <Clock className="w-3 h-3 ml-1" />
                      {daysLeft === 0
                        ? dict.deadline.lastDay
                        : dict.deadline.daysLeft.replace(
                            '{{count}}',
                            daysLeft.toString()
                          )}
                    </Badge>
                  )}
              </div>
            </div>
            <Progress
              value={statusInfo.progress}
              className="h-3 bg-white/30 shadow-inner"
            />
          </div>
        </div>
        <div className="p-6 space-y-6">
          <MatchmakerInfo dict={dict.matchmakerInfo} matchmaker={matchmaker} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <PartyDisplay party={firstParty} />
              <div className="flex flex-wrap items-stretch gap-3 text-sm">
                {firstParty.profile?.occupation && (
                  <div className="flex-1 min-w-[120px] flex items-start gap-2 p-2 bg-white/70 rounded-lg shadow-sm">
                    <Briefcase className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-gray-700">
                      {firstParty.profile.occupation}
                    </span>
                  </div>
                )}
                {firstParty.profile?.education && (
                  <div className="flex-1 min-w-[120px] flex items-start gap-2 p-2 bg-white/70 rounded-lg shadow-sm">
                    <GraduationCap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-gray-700">
                      {firstParty.profile.education}
                    </span>
                  </div>
                )}
              </div>
              {(suggestion.status === 'FIRST_PARTY_APPROVED' ||
                suggestion.status === 'FIRST_PARTY_DECLINED' ||
                suggestion.status === 'FIRST_PARTY_INTERESTED') && (
                <Badge
                  className={
                    suggestion.status === 'FIRST_PARTY_APPROVED'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg'
                      : suggestion.status === 'FIRST_PARTY_INTERESTED'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg'
                  }
                >
                  {suggestion.status === 'FIRST_PARTY_APPROVED' ? (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      {dict.desktop.partyStatus.approved}
                    </>
                  ) : suggestion.status === 'FIRST_PARTY_INTERESTED' ? (
                    <>
                      <Bookmark className="w-4 h-4 ml-2" />
                      {dict.desktop.partyStatus.interested || 'שמר/ה לגיבוי'}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 ml-2" />
                      {dict.desktop.partyStatus.declined}
                    </>
                  )}
                </Badge>
              )}
            </div>
            <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <PartyDisplay party={secondParty} />
              <div className="flex flex-wrap items-stretch gap-3 text-sm">
                {secondParty.profile?.occupation && (
                  <div className="flex-1 min-w-[120px] flex items-start gap-2 p-2 bg-white/70 rounded-lg shadow-sm">
                    <Briefcase className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-gray-700">
                      {secondParty.profile.occupation}
                    </span>
                  </div>
                )}
                {secondParty.profile?.education && (
                  <div className="flex-1 min-w-[120px] flex items-start gap-2 p-2 bg-white/70 rounded-lg shadow-sm">
                    <GraduationCap className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium text-gray-700">
                      {secondParty.profile.education}
                    </span>
                  </div>
                )}
              </div>
              {(suggestion.status === 'SECOND_PARTY_APPROVED' ||
                suggestion.status === 'SECOND_PARTY_DECLINED') && (
                <Badge
                  className={
                    suggestion.status === 'SECOND_PARTY_APPROVED'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg'
                  }
                >
                  {suggestion.status === 'SECOND_PARTY_APPROVED' ? (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      {dict.desktop.partyStatus.approved}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 ml-2" />
                      {dict.desktop.partyStatus.declined}
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 shadow-lg">
            <h4 className="font-bold text-lg mb-3 text-cyan-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              {dict.desktop.connectionPoints}
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, index) => (
                <HighlightPill
                  key={index}
                  icon={highlight.icon}
                  text={highlight.text}
                  color={highlight.color}
                />
              ))}
            </div>
          </div>
          {suggestion.matchingReason && (
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 shadow-lg">
              <h5 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                {dict.desktop.matchReasonTitle}
              </h5>
              <p className="text-emerald-800 leading-relaxed font-medium">
                {suggestion.matchingReason}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl shadow-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-gray-600">
                  {dict.desktop.timeline.created}
                </p>
                <p className="text-gray-800">
                  {formatDistanceToNow(new Date(suggestion.createdAt), {
                    addSuffix: true,
                    locale: he,
                  })}
                </p>
              </div>
            </div>
            {suggestion.decisionDeadline && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl shadow-sm">
                <CalendarClock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-600">
                    {dict.desktop.timeline.deadline}
                  </p>
                  <p className="text-orange-800">
                    {daysLeft !== null
                      ? daysLeft === 0
                        ? dict.deadline.today
                        : dict.deadline.decisionInDays.replace(
                            '{{count}}',
                            daysLeft.toString()
                          )
                      : dict.deadline.noDeadline}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl shadow-sm">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium text-blue-600">
                  {dict.desktop.timeline.progress}
                </p>
                <p className="text-blue-800">
                  {dict.desktop.timeline.progressCompleted.replace(
                    '{{percent}}',
                    statusInfo.progress.toString()
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('message', suggestion)}
                className="relative text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl font-medium"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                {dict.actions.sendMessage}
                {unreadChatCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </Button>
              {canBeResent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction('resend', suggestion)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl font-medium"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  {dict.actions.resend}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onAction('view', suggestion)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
              >
                <Eye className="w-4 h-4 ml-2" />
                {dict.actions.viewDetails}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 hover:bg-gray-100 rounded-xl"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onAction('edit', suggestion)}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    <span>{dict.actions.edit}</span>
                  </DropdownMenuItem>
                  {canBeResent && (
                    <DropdownMenuItem
                      onClick={() => onAction('resend', suggestion)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      <span>{dict.actions.resend}</span>
                    </DropdownMenuItem>
                  )}
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
      </Card>
    </TooltipProvider>
  );
};

// ✅ React.memo - מונע re-render אם ה-props לא השתנו
export default React.memo(SuggestionCard);
