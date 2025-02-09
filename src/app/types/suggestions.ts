import { 
  MatchSuggestionStatus, 
  Priority,
  Gender,
  AvailabilityStatus,
  UserRole,
  DateFeedback,
  MeetingStatus,
  Profile
} from '@prisma/client';

// Base suggestion data for creation
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

// Main suggestion type
export interface Suggestion {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status: MatchSuggestionStatus;
  priority: Priority;
  
  // Notes
  internalNotes?: string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  matchingReason?: string;
  followUpNotes?: string;
  
  // Deadlines & Timing
  responseDeadline?: Date;
  decisionDeadline?: Date;
  lastStatusChange?: Date;
  previousStatus?: MatchSuggestionStatus;
  
  // Activity Tracking
  lastActivity: Date;
  firstPartySent?: Date;
  firstPartyResponded?: Date;
  secondPartySent?: Date;
  secondPartyResponded?: Date;
  firstMeetingScheduled?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  matchmaker: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  firstParty: PartyProfile;
  secondParty: PartyProfile;
  meetings: SuggestionMeeting[];
  statusHistory: SuggestionStatusHistory[];
  feedback: DateFeedback[];
  reviewedBy: PartyProfile[];
  approvedBy: PartyProfile[];
}

// Meeting type
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

// Status history
export interface SuggestionStatusHistory {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

// Profile type
export interface PartyProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile?: Profile;
}

// Update type
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

// Response types
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