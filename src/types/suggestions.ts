import { 
  MatchSuggestionStatus, 
  Priority, 
  MeetingStatus,
  User,
  Meeting,
  SuggestionInquiry as PrismaSuggestionInquiry, // <<< הוסף את זה
} from '@prisma/client';

import type {
  UserProfile,
  UserImage,
} from "@/types/next-auth";



export interface SuggestionParty extends User {
  profile: UserProfile;
  images: UserImage[];
}

export interface ActionAdditionalData {
  partyType?: "first" | "second" | "both";
  type?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
}

// Rest of the interfaces remain the same
export interface CreateSuggestionData {
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  decisionDeadline: Date | string; // Update to accept string as well
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

export interface SuggestionStatusHistory {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
  createdAt: Date | string;
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
  createdAt: Date | string;
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
  
  // Update date type definitions to be consistent
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

export type SortByOption = 
  | "lastActivity" 
  | "createdAt" 
  | "priority" 
  | "decisionDeadline";
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
  userId?: string;           // סינון לפי מזהה משתמש ספציפי
  sortBy?: SortByOption; 
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

const suggestionEnums = {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus
};

export default suggestionEnums;

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
// --- START OF NEW CODE ---
// Defines a single inquiry/chat message with user details
export interface SuggestionInquiry extends PrismaSuggestionInquiry {
  fromUser: Partial<User>;
  toUser: Partial<User>;
}

// Defines an "extended" suggestion that INCLUDES the chat history
export interface ExtendedMatchSuggestion extends Suggestion {
  inquiries?: SuggestionInquiry[]; // The missing property
}
// --- END OF NEW CODE ---


