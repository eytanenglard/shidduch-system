import { 
  MatchSuggestionStatus, 
  Priority, 
  MeetingStatus,
  User,
  Meeting,
} from '@prisma/client';

import type {
  UserProfile,
  UserImage,
} from "@/types/next-auth";



export interface SuggestionParty extends User {
  profile: UserProfile;
  images: UserImage[];
}

// Rest of the interfaces remain the same
export interface CreateSuggestionData {
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  decisionDeadline: Date;
  notes?: {
    internal?: string;
    forFirstParty?: string;
    forSecondParty?: string;
    matchingReason?: string;
    followUpNotes?: string;
  };
}

export interface SuggestionMeeting {
  id: string;
  suggestionId: string;
  scheduledDate: Date;
  location?: string;
  status: MeetingStatus;
  notes?: string;
  feedback?: DateFeedback[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestionStatusHistory {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

export interface DateFeedback {
  id: string;
  suggestionId: string;
  partyId: string;
  meetingId: string;
  meetingNumber: number;
  feedback: string;
  status: string;
  nextSteps?: string;
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status: MatchSuggestionStatus;
  priority: Priority;
  category: 'ACTIVE' | 'PENDING' | 'HISTORY';
  internalNotes?: string | null;
  firstPartyNotes?: string | null;
  secondPartyNotes?: string | null;
  matchingReason?: string | null;
  followUpNotes?: string | null;
  
  responseDeadline?: Date | null;
  decisionDeadline?: Date | null;
  lastStatusChange?: Date | null;
  previousStatus?: MatchSuggestionStatus | null;
  
  lastActivity: Date;
  firstPartySent?: Date | null;
  firstPartyResponded?: Date | null;
  secondPartySent?: Date | null;
  secondPartyResponded?: Date | null;
  firstMeetingScheduled?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: SuggestionStatusHistory[];
  matchmaker?: User;
  firstParty: SuggestionParty;
  secondParty: SuggestionParty;
  meetings?: Meeting[];
  feedback?: DateFeedback[];
  reviewedBy?: User[];
  approvedBy?: User[];
}

export interface UpdateSuggestionStatusData {
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
}

export interface UpdateSuggestionData {
  id: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  responseDeadline?: Date;
  decisionDeadline?: Date;
  notes?: {
    internal?: string;
    forFirstParty?: string;
    forSecondParty?: string;
    matchingReason?: string;
    followUpNotes?: string;
  };
}

export interface SuggestionFilters {
  status?: MatchSuggestionStatus[];
  priority?: Priority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  matchmakerId?: string;
  partyId?: string;
  requiresAction?: boolean;
  hasDeadlinePassed?: boolean;
  searchTerm?: string;
}

export interface SuggestionResponse {
  success: boolean;
  data?: Suggestion;
  error?: string;
}

export interface SuggestionsListResponse {
  success: boolean;
  data?: {
    suggestions: Suggestion[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export interface SuggestionStats {
  total: number;
  activeCount: number;
  pendingCount: number;
  successCount: number;
  byStatus: Record<MatchSuggestionStatus, number>;
  byPriority: Record<Priority, number>;
  averageResponseTime: number;
  successRate: number;
}

export default {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus
};

export const getSuggestionCategory = (status: MatchSuggestionStatus) => {
  switch (status) {
    case 'DRAFT':
    case 'AWAITING_MATCHMAKER_APPROVAL':
    case 'PENDING_FIRST_PARTY':
    case 'PENDING_SECOND_PARTY':
      return 'PENDING';
    
    case 'FIRST_PARTY_DECLINED':
    case 'SECOND_PARTY_DECLINED':
    case 'MATCH_DECLINED':
    case 'ENDED_AFTER_FIRST_DATE':
    case 'ENGAGED':
    case 'MARRIED':
    case 'EXPIRED':
    case 'CLOSED':
    case 'CANCELLED':
      return 'HISTORY';
    
    default:
      return 'ACTIVE';
  }
};
