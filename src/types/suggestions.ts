// src/types/suggestions.ts

import {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus,
  User,
  Meeting,
  SuggestionInquiry as PrismaSuggestionInquiry,
} from '@prisma/client';

import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from '@/types/next-auth';

// =============================================================================
// Party Info with Profile & Images
// =============================================================================
export interface SuggestionParty extends User {
  profile: UserProfile | null;
  images: UserImage[];
  questionnaireResponses?: QuestionnaireResponse[];
}

// =============================================================================
// Action Additional Data
// =============================================================================
export interface ActionAdditionalData {
  partyType?: 'first' | 'second' | 'both';
  type?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
}

// =============================================================================
// Create Suggestion Data
// =============================================================================
export interface CreateSuggestionData {
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  decisionDeadline: Date | string;
  firstPartyLanguage?: 'he' | 'en';
  secondPartyLanguage?: 'he' | 'en';
  notes?: {
    internal?: string;
    forFirstParty?: string;
    forSecondParty?: string;
    matchingReason?: string;
    followUpNotes?: string;
  };
}

// =============================================================================
// Suggestion Meeting
// =============================================================================
export interface SuggestionMeeting {
  id: string;
  suggestionId: string;
  scheduledDate: Date | string;
  location?: string;
  status: MeetingStatus;
  notes?: string;
  feedback?: DateFeedback[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =============================================================================
// Status History
// =============================================================================
export interface SuggestionStatusHistory {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt: Date | string;
}

// =============================================================================
// Date Feedback
// =============================================================================
export interface DateFeedback {
  id: string;
  suggestionId: string;
  partyId: string;
  meetingId: string;
  meetingNumber: number;
  feedback: string;
  status: string;
  nextSteps?: string;
  createdAt: Date | string;
}

// =============================================================================
// Suggestion Inquiry (with user details)
// =============================================================================
export interface SuggestionInquiry extends PrismaSuggestionInquiry {
  fromUser: Partial<User>;
  toUser: Partial<User>;
}

// =============================================================================
// Base Suggestion Interface
// =============================================================================
export interface Suggestion {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status: MatchSuggestionStatus;
  priority: Priority;
  category: 'ACTIVE' | 'PENDING' | 'HISTORY';
  isAutoSuggestion: boolean;
  internalNotes?: string | null;
  firstPartyNotes?: string | null;
  secondPartyNotes?: string | null;
  matchingReason?: string | null;
  followUpNotes?: string | null;

  responseDeadline?: Date | string | null;
  decisionDeadline?: Date | string | null;
  lastStatusChange?: Date | string | null;
  previousStatus?: MatchSuggestionStatus | null;

  lastActivity: Date | string;
  firstPartySent?: Date | string | null;
  firstPartyResponded?: Date | string | null;
  secondPartySent?: Date | string | null;
  secondPartyResponded?: Date | string | null;
  firstMeetingScheduled?: Date | string | null;
  closedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  statusHistory: SuggestionStatusHistory[];
  matchmaker?: User;
  firstParty: SuggestionParty;
  secondParty: SuggestionParty;
  meetings?: Meeting[];
  feedback?: DateFeedback[];
  reviewedBy?: User[];
  approvedBy?: User[];
}

// =============================================================================
// Extended Match Suggestion
// =============================================================================
export interface ExtendedMatchSuggestion extends Suggestion {
  // View Tracking
  firstPartyLastViewedAt?: Date | string | null;
  secondPartyLastViewedAt?: Date | string | null;

  // Interested Queue
  firstPartyRank?: number | null;
  firstPartyInterestedAt?: Date | string | null;

  // Chat/Inquiries
  inquiries?: SuggestionInquiry[];
}

// =============================================================================
// Update Status Data
// =============================================================================
export interface UpdateSuggestionStatusData {
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
}

// =============================================================================
// Update Suggestion Data
// =============================================================================
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

// =============================================================================
// Filters & Sorting
// =============================================================================
export type SortByOption =
  | 'lastActivity'
  | 'createdAt'
  | 'priority'
  | 'decisionDeadline';

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
  userId?: string;
  sortBy?: SortByOption;
}

// =============================================================================
// API Responses
// =============================================================================
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

// =============================================================================
// Statistics
// =============================================================================
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

// =============================================================================
// Category Helper
// =============================================================================
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

// =============================================================================
// Enums Export
// =============================================================================
const suggestionEnums = {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus,
};

export default suggestionEnums;