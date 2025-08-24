import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Circle,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { MatchSuggestionStatus, VerificationStatus } from '@prisma/client';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

type StatusType = 'suggestion' | 'verification' | 'profile';
type StatusSize = 'sm' | 'md' | 'lg';

interface StatusConfig {
  label: string;
  color: 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';
  icon:
    | typeof Circle
    | typeof CheckCircle
    | typeof XCircle
    | typeof Clock
    | typeof AlertTriangle;
}

interface StatusBadgeProps {
  type: StatusType;
  status: string;
  size?: StatusSize;
  dict: MatchmakerPageDictionary['statusBadges'];
}

// Presentation logic remains in the component
const statusStyling = {
  // Suggestion Statuses Styling
  DRAFT: { color: 'secondary', icon: Circle },
  PENDING_FIRST_PARTY: { color: 'warning', icon: Clock },
  FIRST_PARTY_APPROVED: { color: 'success', icon: CheckCircle },
  FIRST_PARTY_DECLINED: { color: 'destructive', icon: XCircle },
  PENDING_SECOND_PARTY: { color: 'warning', icon: Clock },
  SECOND_PARTY_APPROVED: { color: 'success', icon: CheckCircle },
  SECOND_PARTY_DECLINED: { color: 'destructive', icon: XCircle },
  AWAITING_MATCHMAKER_APPROVAL: { color: 'warning', icon: Clock },
  CONTACT_DETAILS_SHARED: { color: 'success', icon: CheckCircle },
  AWAITING_FIRST_DATE_FEEDBACK: { color: 'warning', icon: Clock },
  THINKING_AFTER_DATE: { color: 'warning', icon: Clock },
  PROCEEDING_TO_SECOND_DATE: { color: 'success', icon: CheckCircle },
  ENDED_AFTER_FIRST_DATE: { color: 'destructive', icon: XCircle },
  MEETING_PENDING: { color: 'warning', icon: Clock },
  MEETING_SCHEDULED: { color: 'success', icon: CheckCircle },
  MATCH_APPROVED: { color: 'success', icon: CheckCircle },
  MATCH_DECLINED: { color: 'destructive', icon: XCircle },
  DATING: { color: 'secondary', icon: Circle },
  ENGAGED: { color: 'success', icon: CheckCircle },
  MARRIED: { color: 'success', icon: CheckCircle },
  EXPIRED: { color: 'destructive', icon: XCircle },
  CLOSED: { color: 'destructive', icon: XCircle },
  CANCELLED: { color: 'destructive', icon: XCircle },

  // Verification Statuses Styling
  PENDING: { color: 'warning', icon: Clock },
  COMPLETED: { color: 'success', icon: CheckCircle },
  FAILED: { color: 'destructive', icon: XCircle },

  // Profile Statuses Styling
  INCOMPLETE: { color: 'warning', icon: AlertTriangle },
  PENDING_VERIFICATION: { color: 'warning', icon: Clock },
  VERIFIED: { color: 'success', icon: CheckCircle },
  BLOCKED: { color: 'destructive', icon: XCircle },
};

const defaultStyling = {
  color: 'secondary' as const,
  icon: Circle,
};

const getStatusConfig = (
  type: StatusType,
  status: string,
  dict: StatusBadgeProps['dict']
): StatusConfig => {
  let label: string;
  let style;

  switch (type) {
    case 'suggestion':
      label = dict.suggestion[status as MatchSuggestionStatus] || dict.unknown;
      style =
        statusStyling[status as keyof typeof statusStyling] || defaultStyling;
      break;
    case 'verification':
      label = dict.verification[status as VerificationStatus] || dict.unknown;
      style =
        statusStyling[status as keyof typeof statusStyling] || defaultStyling;
      break;
    case 'profile':
      label = dict.profile[status as keyof typeof dict.profile] || dict.unknown;
      style =
        statusStyling[status as keyof typeof statusStyling] || defaultStyling;
      break;
    default:
      label = dict.unknown;
      style = defaultStyling;
  }

  return { label, ...style };
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  size = 'md',
  dict,
}) => {
  const config = getStatusConfig(type, status, dict);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant={config.color}
      className={`flex items-center gap-1.5 ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{config.label}</span>
    </Badge>
  );
};

export default StatusBadge;
