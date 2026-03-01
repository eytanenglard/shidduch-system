// src/types/suggestions.ts
// =============================================================================
// קובץ טיפוסים מאוחד עבור הצעות שידוכים
// =============================================================================

import {
  MatchSuggestion as PrismaMatchSuggestion,
  MatchSuggestionStatus,
  Priority,
  MeetingStatus,
  User,
  Meeting,
  UserImage,
  Profile as PrismaProfile,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
  SuggestionInquiry as PrismaSuggestionInquiry,
  TestimonialStatus,
  SubmissionSource,
  SuggestionCategory,
} from '@prisma/client';

// ⬇️ הייבוא הקריטי שהיה חסר!
import { QuestionnaireResponse as CustomQuestionnaireResponse } from '@/types/next-auth';

// =============================================================================
// ✅ World ID - הגדרת עולמות השאלון
// =============================================================================
export type WorldId =
  | 'values'
  | 'personality'
  | 'relationship'
  | 'partner'
  | 'religion';

// =============================================================================
// ✅ Questionnaire Response - שימוש בטיפוס המותאם שכולל formattedAnswers
// =============================================================================
export type QuestionnaireResponse = CustomQuestionnaireResponse;

// =============================================================================
// ✅ Friend Testimonial - המלצת חבר
// =============================================================================
export interface FriendTestimonial {
  id: string;
  authorName: string;
  relationship: string;
  content: string;
  authorPhone?: string | null;
  isPhoneVisibleToMatch: boolean;
  status: TestimonialStatus;
  submittedBy: SubmissionSource;
  createdAt: Date;
}

// =============================================================================
// ✅ User Profile - פרופיל משתמש מורחב
// =============================================================================
export interface UserProfile extends PrismaProfile {
  testimonials?: FriendTestimonial[];
}

// =============================================================================
// ✅ Party Info - מידע על צד בהצעה (כללי - profile יכול להיות null)
// =============================================================================
export interface PartyInfo {
  // Fields from User model
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isProfileComplete: boolean;

  // Relation to Profile (which can be null)
  profile: UserProfile | null;

  // Relation to Images
  images: UserImage[];

  // Questionnaire responses - משתמש בטיפוס המותאם!
  questionnaireResponses?: QuestionnaireResponse[];
}

// =============================================================================
// ✅ Suggestion Party With Profile - צד עם פרופיל מובטח (לשימוש בהצעות)
// =============================================================================
export interface SuggestionPartyWithProfile extends Omit<PartyInfo, 'profile'> {
  profile: UserProfile;
}

// =============================================================================
// ✅ Alias for backward compatibility
// =============================================================================
export type SuggestionParty = PartyInfo;

// =============================================================================
// ✅ Status History
// =============================================================================
export interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: MatchSuggestionStatus | string;
  reason?: string | null;
  notes?: string | null;
  createdAt: Date | string;
}

// Alias for backward compatibility
export type SuggestionStatusHistory = StatusHistoryItem;

// =============================================================================
// ✅ Date Feedback
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
// ✅ Suggestion Meeting
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
// ✅ Suggestion Inquiry
// =============================================================================
export interface SuggestionInquiry extends PrismaSuggestionInquiry {
  fromUser: Partial<User>;
  toUser: Partial<User>;
}

// =============================================================================
// ✅ Action Additional Data
// =============================================================================
export interface ActionAdditionalData {
  partyType?: 'first' | 'second' | 'both';
  type?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
}

// =============================================================================
// ✅ Matchmaker Info
// =============================================================================
export interface MatchmakerInfo {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
}

// =============================================================================
// ✅ Extended Match Suggestion - המודל המרכזי
// משתמש ב-Omit כדי לרשת את כל השדות מ-Prisma ולהחליף רק את ה-relations
// =============================================================================
export interface ExtendedMatchSuggestion
  extends Omit<
    PrismaMatchSuggestion,
    'firstParty' | 'secondParty' | 'matchmaker'
  > {
  // === Relations (overridden with our custom types) ===
  matchmaker: MatchmakerInfo;
  firstParty: SuggestionPartyWithProfile;
  secondParty: SuggestionPartyWithProfile;
  statusHistory: StatusHistoryItem[];

  // === Relations (additional) ===
  meetings?: Meeting[];
  feedback?: DateFeedback[];
  reviewedBy?: User[];
  approvedBy?: User[];
  inquiries?: SuggestionInquiry[];
}

// =============================================================================
// ✅ Suggestion - Alias for backward compatibility
// =============================================================================
export type Suggestion = ExtendedMatchSuggestion;

// =============================================================================
// ✅ Create Suggestion Data
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
// ✅ Update Suggestion Data
// =============================================================================
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

// =============================================================================
// ✅ Filters & Sorting
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
// ✅ API Responses
// =============================================================================
export interface SuggestionResponse {
  success: boolean;
  data?: ExtendedMatchSuggestion;
  error?: string;
}

export interface SuggestionsListResponse {
  success: boolean;
  data?: {
    suggestions: ExtendedMatchSuggestion[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

// =============================================================================
// ✅ Statistics
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
// ✅ Category Helper
// =============================================================================
export const getSuggestionCategory = (
  status: MatchSuggestionStatus
): SuggestionCategory => {
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
// ✅ Enums Re-export
// =============================================================================
export {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus,
  SuggestionCategory,
} from '@prisma/client';

const suggestionEnums = {
  MatchSuggestionStatus,
  Priority,
  MeetingStatus,
  SuggestionCategory,
};

export default suggestionEnums;