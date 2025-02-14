import { 
  MatchSuggestionStatus, 
  Priority,
  UserRole,
  DateFeedback,
  MeetingStatus,
  Profile
} from '@prisma/client';

// Base suggestion data for creation
interface CreateSuggestionData {
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  decisionDeadline: Date;
  notes?: SuggestionNotes;
}

// Shared notes interface to avoid repetition
interface SuggestionNotes {
  internal?: string;
  forFirstParty?: string;
  forSecondParty?: string;
  matchingReason?: string;
  followUpNotes?: string;
}

// Main suggestion type
interface Suggestion {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  status: MatchSuggestionStatus;
  priority: Priority;
  
  // Notes (using shared interface)
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
  matchmaker: MatchmakerProfile;
  firstParty: PartyProfile;
  secondParty: PartyProfile;
  meetings: SuggestionMeeting[];
  statusHistory: SuggestionStatusHistory[];
  feedback: DateFeedback[];
  reviewedBy: PartyProfile[];
  approvedBy: PartyProfile[];
}

// Matchmaker profile type
interface MatchmakerProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Meeting type
interface SuggestionMeeting {
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
interface SuggestionStatusHistory {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

// Profile type
interface PartyProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile?: Profile;
}

// Update type
interface UpdateSuggestionData {
  id: string;
  status?: MatchSuggestionStatus;
  priority?: Priority;
  responseDeadline?: Date;
  decisionDeadline?: Date;
  notes?: SuggestionNotes;
}

// Response types
interface SuggestionResponse {
  success: boolean;
  data?: Suggestion;
  error?: string;
}

interface SuggestionsListResponse {
  success: boolean;
  data?: {
    suggestions: Suggestion[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export type {
  CreateSuggestionData,
  SuggestionNotes,
  Suggestion,
  MatchmakerProfile,
  SuggestionMeeting,
  SuggestionStatusHistory,
  PartyProfile,
  UpdateSuggestionData,
  SuggestionResponse,
  SuggestionsListResponse,
};