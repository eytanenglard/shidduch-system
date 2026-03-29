// src/components/messages/NotificationCard.tsx

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn, getInitials, getRelativeCloudinaryPath } from '@/lib/utils';
import type { FeedItem } from '@/types/messages';
import {
  Heart,
  MessageCircle,
  ArrowLeft,
  Zap,
  CheckCircle,
  Info,
  ArrowRight,
  UserCheck,
  Phone,
  ThumbsUp,
  ThumbsDown,
  Star,
  Loader2,
  PartyPopper,
  RotateCcw,
  CalendarCheck,
} from 'lucide-react';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';

// ==========================================
// Icon Config per feed type
// ==========================================

const iconMap: Record<
  FeedItem['type'],
  { icon: React.ElementType; gradient: string }
> = {
  NEW_SUGGESTION: {
    icon: Heart,
    gradient: 'from-pink-400 to-rose-500',
  },
  ACTION_REQUIRED: {
    icon: Zap,
    gradient: 'from-orange-400 to-amber-500',
  },
  STATUS_UPDATE: {
    icon: CheckCircle,
    gradient: 'from-emerald-400 to-green-500',
  },
  MATCHMAKER_MESSAGE: {
    icon: MessageCircle,
    gradient: 'from-blue-400 to-cyan-500',
  },
  INQUIRY_RESPONSE: {
    icon: Info,
    gradient: 'from-cyan-400 to-teal-500',
  },
  AVAILABILITY_INQUIRY: {
    icon: UserCheck,
    gradient: 'from-violet-400 to-purple-500',
  },
};

// ==========================================
// CTA Config per type / status
// ==========================================

function getCtaConfig(
  item: FeedItem,
  dict: MessagesPageDict['notificationCard']
): { label: string; className: string; icon: React.ElementType } {
  const suggestion = item.payload.suggestion;
  const status = suggestion?.status;

  if (item.type === 'ACTION_REQUIRED') {
    return {
      label: dict.cta.respondNow,
      className: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
      icon: Zap,
    };
  }
  if (status === 'CONTACT_DETAILS_SHARED') {
    return {
      label: dict.cta.viewContact,
      className: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      icon: Phone,
    };
  }
  if (status === 'AWAITING_FIRST_DATE_FEEDBACK') {
    return {
      label: dict.cta.giveFeedback,
      className: 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600',
      icon: CalendarCheck,
    };
  }
  if (item.type === 'MATCHMAKER_MESSAGE' || item.type === 'INQUIRY_RESPONSE') {
    return {
      label: dict.cta.viewChat,
      className: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
      icon: MessageCircle,
    };
  }
  if (item.type === 'AVAILABILITY_INQUIRY') {
    return {
      label: dict.cta.respondToInquiry,
      className: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600',
      icon: UserCheck,
    };
  }
  return {
    label: dict.cta.viewDetails,
    className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    icon: ArrowRight,
  };
}

// ==========================================
// Resolve title/description from dict keys
// ==========================================

function resolveTitle(
  titleKey: string,
  item: FeedItem,
  dict: MessagesPageDict['notificationCard'],
  userId: string
): string {
  const suggestion = item.payload.suggestion;
  const otherParty = suggestion
    ? suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;
  const otherName = otherParty?.firstName || '';

  // Check if key exists in feedTitles
  const titleTemplate = (dict.feedTitles as Record<string, string>)?.[titleKey];
  if (titleTemplate) {
    return titleTemplate
      .replace('{{name}}', otherName);
  }

  // Fallback to key itself (for backward compatibility with old API format)
  return titleKey;
}

function resolveDescription(
  descKey: string,
  item: FeedItem,
  dict: MessagesPageDict['notificationCard'],
  userId: string
): string {
  const suggestion = item.payload.suggestion;
  const inquiry = item.payload.suggestionInquiry;
  const otherParty = suggestion
    ? suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;
  const otherName = otherParty?.firstName || '';
  const matchmakerName = suggestion?.matchmaker?.firstName || '';

  const descTemplate = (dict.feedDescriptions as Record<string, string>)?.[descKey];
  if (descTemplate) {
    let result = descTemplate
      .replace('{{name}}', otherName)
      .replace('{{matchmaker}}', matchmakerName);

    // Preview text for inquiries
    if (inquiry) {
      const preview = inquiry.answer
        ? inquiry.answer.substring(0, 40) + '...'
        : inquiry.question.substring(0, 50) + '...';
      result = result.replace('{{preview}}', preview);
    }

    return result;
  }

  return descKey;
}

// ==========================================
// Component
// ==========================================

interface NotificationCardProps {
  item: FeedItem;
  userId: string;
  dict: MessagesPageDict['notificationCard'];
  statusBadges: Record<string, string>;
  locale: Locale;
  onQuickAction?: (suggestionId: string, action: 'approve' | 'decline' | 'interested') => Promise<void>;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  userId,
  dict,
  statusBadges,
  locale,
  onQuickAction,
}) => {
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const { icon: Icon, gradient } = iconMap[item.type] || {
    icon: Info,
    gradient: 'from-gray-400 to-slate-500',
  };

  const suggestion = item.payload.suggestion;
  const matchmaker = suggestion?.matchmaker;
  const isHe = locale === 'he';

  const otherParty = suggestion
    ? suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;
  const mainImage = otherParty?.images?.find((img) => img.isMain);

  const title = resolveTitle(item.title, item, dict, userId);
  const description = resolveDescription(item.description, item, dict, userId);
  const cta = getCtaConfig(item, dict);
  const CtaIcon = cta.icon;

  // Quick action handler
  const handleQuickAction = useCallback(async (action: 'approve' | 'decline' | 'interested') => {
    if (!suggestion?.id || !onQuickAction) return;
    setQuickActionLoading(action);
    try {
      await onQuickAction(suggestion.id, action);
    } finally {
      setQuickActionLoading(null);
    }
  }, [suggestion?.id, onQuickAction]);

  const isActionRequired = item.type === 'ACTION_REQUIRED';
  const showQuickActions = isActionRequired && onQuickAction && suggestion;

  return (
    <Card
      className={cn(
        'border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        // Unread indicator
        !item.isRead
          ? 'bg-white border-s-4 border-s-teal-400 shadow-md'
          : 'bg-white/80 border-gray-100 shadow-sm',
        // Action required pulse
        isActionRequired && !item.isRead && 'ring-1 ring-orange-200'
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon column — hidden on very small screens */}
          <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br shadow-md',
                gradient
              )}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            {matchmaker && (
              <Avatar
                className="w-8 h-8 border-2 border-white"
                title={`${dict.matchmakerPrefix} ${matchmaker.firstName}`}
              >
                <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px] font-bold">
                  {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mobile icon — only on small screens */}
                  <div
                    className={cn(
                      'sm:hidden w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                      gradient
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight truncate">
                    {title}
                  </h3>
                  {/* Unread badge */}
                  {!item.isRead && (
                    <Badge className="bg-teal-500 text-white text-[10px] px-1.5 py-0 border-0 flex-shrink-0">
                      {dict.unread}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>

                {/* Status Badge */}
                {suggestion?.status && statusBadges[suggestion.status] && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'mt-2 text-[11px] font-medium px-2.5 py-0.5',
                      getStatusBadgeClass(suggestion.status)
                    )}
                  >
                    {statusBadges[suggestion.status]}
                  </Badge>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[11px] text-gray-400 flex-shrink-0 ps-1 whitespace-nowrap">
                {formatDistanceToNow(new Date(item.timestamp), {
                  addSuffix: true,
                  locale: isHe ? he : enUS,
                })}
              </span>
            </div>

            {/* Quick Actions for ACTION_REQUIRED */}
            {showQuickActions && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => handleQuickAction('approve')}
                  disabled={!!quickActionLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs h-8 px-3"
                >
                  {quickActionLoading === 'approve' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin me-1" />
                  ) : (
                    <ThumbsUp className="w-3.5 h-3.5 me-1" />
                  )}
                  {quickActionLoading === 'approve' ? dict.quickActions.approving : dict.quickActions.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickAction('interested')}
                  disabled={!!quickActionLoading}
                  className="rounded-full text-xs h-8 px-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Star className="w-3.5 h-3.5 me-1" />
                  {dict.quickActions.interested}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAction('decline')}
                  disabled={!!quickActionLoading}
                  className="rounded-full text-xs h-8 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  {quickActionLoading === 'decline' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin me-1" />
                  ) : (
                    <ThumbsDown className="w-3.5 h-3.5 me-1" />
                  )}
                  {quickActionLoading === 'decline' ? dict.quickActions.declining : dict.quickActions.decline}
                </Button>
              </div>
            )}

            {/* Footer: other party avatar + CTA */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center gap-2">
              {otherParty ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-white shadow flex-shrink-0">
                    {mainImage?.url ? (
                      <Image
                        src={getRelativeCloudinaryPath(mainImage.url)}
                        alt={otherParty.firstName}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <AvatarFallback className="bg-gray-300 text-gray-700 font-bold text-xs">
                        {getInitials(
                          `${otherParty.firstName} ${otherParty.lastName}`
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {dict.suggestionWith.replace('{{name}}', otherParty.firstName)}
                  </span>
                </div>
              ) : (
                <div />
              )}
              <Link href={item.link} passHref>
                <Button
                  size="sm"
                  className={cn(
                    'text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 flex-shrink-0',
                    cta.className
                  )}
                >
                  {cta.label}
                  {isHe ? (
                    <ArrowLeft className="ms-1.5 h-3.5 w-3.5" />
                  ) : (
                    <ArrowRight className="ms-1.5 h-3.5 w-3.5" />
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// Status Badge Styles (using Tailwind classes)
// ==========================================

function getStatusBadgeClass(status: string): string {
  const classMap: Record<string, string> = {
    PENDING_FIRST_PARTY: 'bg-orange-100 text-orange-700 border-orange-200',
    PENDING_SECOND_PARTY: 'bg-amber-100 text-amber-700 border-amber-200',
    FIRST_PARTY_APPROVED: 'bg-green-100 text-green-700 border-green-200',
    FIRST_PARTY_INTERESTED: 'bg-teal-100 text-teal-700 border-teal-200',
    SECOND_PARTY_APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CONTACT_DETAILS_SHARED: 'bg-blue-100 text-blue-700 border-blue-200',
    DATING: 'bg-purple-100 text-purple-700 border-purple-200',
    FIRST_PARTY_DECLINED: 'bg-gray-100 text-gray-500 border-gray-200',
    SECOND_PARTY_DECLINED: 'bg-gray-100 text-gray-500 border-gray-200',
    CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
    AWAITING_FIRST_DATE_FEEDBACK: 'bg-violet-100 text-violet-700 border-violet-200',
    RE_OFFERED_TO_FIRST_PARTY: 'bg-sky-100 text-sky-700 border-sky-200',
    ENGAGED: 'bg-pink-100 text-pink-700 border-pink-200',
    MARRIED: 'bg-rose-100 text-rose-700 border-rose-200',
    MEETING_SCHEDULED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    THINKING_AFTER_DATE: 'bg-slate-100 text-slate-600 border-slate-200',
    PROCEEDING_TO_SECOND_DATE: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    ENDED_AFTER_FIRST_DATE: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return classMap[status] || 'bg-gray-100 text-gray-500 border-gray-200';
}

export default NotificationCard;
