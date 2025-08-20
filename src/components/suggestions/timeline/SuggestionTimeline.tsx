// src/app/components/suggestions/timeline/SuggestionTimeline.tsx

import React from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Clock,
  MessageCircle,
  User,
  Check,
  Zap,
  XCircle,
  Heart,
  Phone,
  Calendar,
  Users,
  Award,
  Star,
  TimerOff,
  Edit3,
  UserX,
  Archive,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MatchSuggestionStatus } from '@prisma/client';
import type { SuggestionTimelineDict } from '@/types/dictionary';

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface SuggestionTimelineProps {
  statusHistory: StatusHistoryItem[];
  className?: string;
  dict: SuggestionTimelineDict;
}

const getStatusVisuals = (status: MatchSuggestionStatus) => {
    const statusMap: { [key in MatchSuggestionStatus]?: { icon: React.ElementType; category: string } } = {
        DRAFT: { icon: Edit3, category: 'pending' },
        PENDING_FIRST_PARTY: { icon: User, category: 'pending' },
        PENDING_SECOND_PARTY: { icon: User, category: 'pending' },
        FIRST_PARTY_APPROVED: { icon: Check, category: 'approved' },
        SECOND_PARTY_APPROVED: { icon: Check, category: 'approved' },
        FIRST_PARTY_DECLINED: { icon: XCircle, category: 'declined' },
        SECOND_PARTY_DECLINED: { icon: XCircle, category: 'declined' },
        AWAITING_MATCHMAKER_APPROVAL: { icon: Zap, category: 'progress' },
        CONTACT_DETAILS_SHARED: { icon: Phone, category: 'progress' },
        AWAITING_FIRST_DATE_FEEDBACK: { icon: MessageCircle, category: 'progress' },
        THINKING_AFTER_DATE: { icon: Clock, category: 'pending' },
        PROCEEDING_TO_SECOND_DATE: { icon: Heart, category: 'approved' },
        ENDED_AFTER_FIRST_DATE: { icon: UserX, category: 'declined' },
        MEETING_PENDING: { icon: Calendar, category: 'progress' },
        MEETING_SCHEDULED: { icon: Calendar, category: 'progress' },
        MATCH_APPROVED: { icon: Award, category: 'completed' },
        MATCH_DECLINED: { icon: XCircle, category: 'declined' },
        DATING: { icon: Heart, category: 'completed' },
        ENGAGED: { icon: Star, category: 'completed' },
        MARRIED: { icon: Star, category: 'completed' },
        EXPIRED: { icon: TimerOff, category: 'declined' },
        CLOSED: { icon: Archive, category: 'declined' },
        CANCELLED: { icon: Ban, category: 'declined' },
    };
    return statusMap[status] || { icon: Clock, category: 'default' };
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'pending':
      return 'border-purple-200';
    case 'approved':
      return 'border-emerald-200';
    case 'progress':
      return 'border-blue-200';
    case 'completed':
      return 'border-yellow-200';
    case 'declined':
      return 'border-red-200';
    default:
      return 'border-gray-200';
  }
};

const TimelineNode: React.FC<{
  IconComponent: React.ElementType;
  isLatest: boolean;
  isLast: boolean;
  category: string;
}> = ({ IconComponent, isLatest, isLast, category }) => {
  const gradientMap: { [key: string]: string } = {
    pending: 'bg-gradient-to-br from-purple-400 to-purple-500',
    approved: 'bg-gradient-to-br from-emerald-400 to-green-500',
    progress: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    completed: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    declined: 'bg-gradient-to-br from-red-400 to-rose-500',
    default: 'bg-gradient-to-br from-gray-400 to-gray-500',
  };

  return (
    <div className="relative flex items-center">
      {!isLast && (
        <div
          className={cn(
            'absolute top-12 right-6 w-0.5 h-16 bg-gradient-to-b rounded-full',
            isLatest ? 'from-cyan-300 to-cyan-100' : 'from-gray-300 to-gray-100'
          )}
        />
      )}
      <div
        className={cn(
          'relative z-10 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white',
          gradientMap[category],
          isLatest && 'ring-4 ring-cyan-200 animate-pulse-subtle'
        )}
      >
        <IconComponent className="w-6 h-6" />
      </div>
    </div>
  );
};

const SuggestionTimeline: React.FC<SuggestionTimelineProps> = ({
  statusHistory,
  className,
  dict,
}) => {
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <Card className={cn('border-0 shadow-lg', className)}>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {dict.emptyState.title}
          </h3>
          <p className="text-gray-500">{dict.emptyState.description}</p>
        </CardContent>
      </Card>
    );
  }

  const latestStatusInfo = dict.statuses[
    sortedHistory[0].status as MatchSuggestionStatus
  ] || { label: sortedHistory[0].status, description: '' };
  const latestStatusVisuals = getStatusVisuals(
    sortedHistory[0].status as MatchSuggestionStatus
  );

  return (
    <Card className={cn('border-0 shadow-lg overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{dict.title}</h3>
            <p className="text-sm text-gray-600">{dict.subtitle}</p>
          </div>
        </div>
        <div className="space-y-6">
          {sortedHistory.map((item, index) => {
            const statusKey = item.status as MatchSuggestionStatus;
            const statusInfo = dict.statuses[statusKey] || {
              label: item.status,
              description: '',
            };
            const statusVisuals = getStatusVisuals(statusKey);
            const isLatest = index === 0;
            const isLast = index === sortedHistory.length - 1;
            const formattedDate = format(
              new Date(item.createdAt),
              'dd בMMMM yyyy',
              { locale: he }
            );
            const formattedTime = format(new Date(item.createdAt), 'HH:mm', {
              locale: he,
            });

            return (
              <div key={item.id} className="flex gap-4">
                <TimelineNode
                  IconComponent={statusVisuals.icon}
                  isLatest={isLatest}
                  isLast={isLast}
                  category={statusVisuals.category}
                />
                <div className="flex-1 pb-4">
                  <Card
                    className={cn(
                      'border-2 transition-all duration-300 hover:shadow-md',
                      getCategoryColor(statusVisuals.category),
                      isLatest && 'shadow-md'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={cn('border-0 shadow-sm font-semibold')}
                            >
                              {statusInfo.label}
                            </Badge>
                            {isLatest && (
                              <Badge
                                variant="outline"
                                className="bg-white/80 text-cyan-600 border-cyan-200 text-xs"
                              >
                                {dict.latestBadge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">
                            {statusInfo.description}
                          </p>
                        </div>
                        <div className="text-left text-xs text-gray-500 space-y-1">
                          <div className="font-medium">{formattedDate}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedTime}
                          </div>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="mt-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {item.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-cyan-600">
                {sortedHistory.length}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {dict.summary.totalSteps}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-emerald-600">
                {differenceInCalendarDays(
                  new Date(),
                  new Date(sortedHistory[sortedHistory.length - 1].createdAt)
                ) + 1}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {dict.summary.activeDays}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {
                  sortedHistory.filter((s) => s.status.includes('APPROVED'))
                    .length
                }
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {dict.summary.approvals}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-amber-600">
                {latestStatusVisuals.category === 'completed'
                  ? '🎉'
                  : latestStatusVisuals.category === 'progress'
                    ? '⏳'
                    : latestStatusVisuals.category === 'approved'
                      ? '✅'
                      : '📋'}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {dict.summary.currentStatus}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionTimeline;
