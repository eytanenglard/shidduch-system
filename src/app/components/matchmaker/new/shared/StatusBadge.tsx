import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Circle,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MatchSuggestionStatus, VerificationStatus } from "@prisma/client";

type StatusType = "suggestion" | "verification" | "profile";
type StatusSize = "sm" | "md" | "lg";

interface StatusConfig {
  label: string;
  color: "destructive" | "outline" | "secondary" | "success" | "warning";
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
}

const suggestionStatuses: Record<MatchSuggestionStatus, StatusConfig> = {
  DRAFT: {
    label: "טיוטה",
    color: "secondary",
    icon: Circle,
  },
  PENDING_FIRST_PARTY: {
    label: "ממתין לצד ראשון",
    color: "warning",
    icon: Clock,
  },
  FIRST_PARTY_APPROVED: {
    label: 'אושר ע"י צד ראשון',
    color: "success",
    icon: CheckCircle,
  },
  FIRST_PARTY_DECLINED: {
    label: 'נדחה ע"י צד ראשון',
    color: "destructive",
    icon: XCircle,
  },
  PENDING_SECOND_PARTY: {
    label: "ממתין לצד שני",
    color: "warning",
    icon: Clock,
  },
  SECOND_PARTY_APPROVED: {
    label: 'אושר ע"י צד שני',
    color: "success",
    icon: CheckCircle,
  },
  SECOND_PARTY_DECLINED: {
    label: 'נדחה ע"י צד שני',
    color: "destructive",
    icon: XCircle,
  },
  AWAITING_MATCHMAKER_APPROVAL: {
    label: "ממתין לאישור שדכן",
    color: "warning",
    icon: Clock,
  },
  CONTACT_DETAILS_SHARED: {
    label: "פרטי קשר שותפו",
    color: "success",
    icon: CheckCircle,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    label: "ממתין למשוב פגישה ראשונה",
    color: "warning",
    icon: Clock,
  },
  THINKING_AFTER_DATE: {
    label: "בשיקול לאחר פגישה",
    color: "warning",
    icon: Clock,
  },
  PROCEEDING_TO_SECOND_DATE: {
    label: "ממשיכים לפגישה שנייה",
    color: "success",
    icon: CheckCircle,
  },
  ENDED_AFTER_FIRST_DATE: {
    label: "הסתיים לאחר פגישה ראשונה",
    color: "destructive",
    icon: XCircle,
  },
  MEETING_PENDING: {
    label: "פגישה בתכנון",
    color: "warning",
    icon: Clock,
  },
  MEETING_SCHEDULED: {
    label: "פגישה נקבעה",
    color: "success",
    icon: CheckCircle,
  },
  MATCH_APPROVED: {
    label: "השידוך אושר",
    color: "success",
    icon: CheckCircle,
  },
  MATCH_DECLINED: {
    label: "השידוך נדחה",
    color: "destructive",
    icon: XCircle,
  },
  DATING: {
    label: "בתהליך היכרות",
    color: "secondary",
    icon: Circle,
  },
  ENGAGED: {
    label: "מאורסים",
    color: "success",
    icon: CheckCircle,
  },
  MARRIED: {
    label: "נישאו",
    color: "success",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "פג תוקף",
    color: "destructive",
    icon: XCircle,
  },
  CLOSED: {
    label: "סגור",
    color: "destructive",
    icon: XCircle,
  },
  CANCELLED: {
    label: "בוטל",
    color: "destructive",
    icon: XCircle,
  },
};

const verificationStatuses: Record<VerificationStatus, StatusConfig> = {
  PENDING: {
    label: "ממתין לאימות",
    color: "warning",
    icon: Clock,
  },
  COMPLETED: {
    label: "מאומת",
    color: "success",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "פג תוקף",
    color: "destructive",
    icon: XCircle,
  },
  FAILED: {
    label: "נכשל",
    color: "destructive",
    icon: XCircle,
  },
};

const profileStatuses: Record<string, StatusConfig> = {
  INCOMPLETE: {
    label: "לא הושלם",
    color: "warning",
    icon: AlertTriangle,
  },
  PENDING_VERIFICATION: {
    label: "ממתין לאימות",
    color: "warning",
    icon: Clock,
  },
  VERIFIED: {
    label: "מאומת",
    color: "success",
    icon: CheckCircle,
  },
  BLOCKED: {
    label: "חסום",
    color: "destructive",
    icon: XCircle,
  },
};

const defaultStatus: StatusConfig = {
  label: "לא ידוע",
  color: "secondary",
  icon: Circle,
};

const getStatusConfig = (type: StatusType, status: string): StatusConfig => {
  switch (type) {
    case "suggestion":
      return (
        suggestionStatuses[status as MatchSuggestionStatus] || defaultStatus
      );
    case "verification":
      return (
        verificationStatuses[status as VerificationStatus] || defaultStatus
      );
    case "profile":
      return profileStatuses[status] || defaultStatus;
    default:
      return defaultStatus;
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  size = "md",
}) => {
  const config = getStatusConfig(type, status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant={config.color}
      className={`flex items-center gap-1.5 ${sizeClasses[size]}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span>{config.label}</span>
    </Badge>
  );
};

export default StatusBadge;
