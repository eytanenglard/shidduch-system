import type { QuestionnaireResponse } from '@/types/next-auth';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type { ExtendedMatchSuggestion } from '@/types/suggestions';
import type {
  SuggestionsDictionary,
  SuggestionsCompatibilityDict,
  ProfileCardDict,
} from '@/types/dictionary';

// --- Main Props (unchanged, same interface for all 3 callers) ---
export interface SuggestionDetailsModalProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline' | 'interested'
  ) => void;
  onRefresh?: () => void;
  locale: 'he' | 'en';
  questionnaire: QuestionnaireResponse | null;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  initialTab?: string;
  isUserInActiveProcess?: boolean;
  dict: {
    suggestions: SuggestionsDictionary;
    profileCard: ProfileCardDict;
  };
}

// --- Hook Return Type ---
export interface SuggestionModalState {
  // State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabDirection: number;
  handleTabChange: (tab: string) => void;
  showAskDialog: boolean;
  setShowAskDialog: (show: boolean) => void;
  isSubmitting: boolean;
  isQuestionnaireLoading: boolean;
  isActionsExpanded: boolean;
  setIsActionsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialLoad: boolean;
  visitedTabs: Set<string>;
  actionFeedback: 'success' | 'declined' | null;

  // Device & fullscreen
  isMobile: boolean;
  isFullscreen: boolean;
  isTransitioning: boolean;
  toggleFullscreen: () => void;

  // Derived
  isFirstParty: boolean;
  isHe: boolean;
  targetParty: ExtendedMatchSuggestion['secondParty'] | null;
  profileWithUser: (ExtendedMatchSuggestion['secondParty']['profile'] & {
    user: { firstName: string; lastName: string };
  }) | null;

  // Handlers
  handleApprove: () => void;
  handleDecline: () => void;
  handleInterested: () => void;
  handleWithdraw: (type: 'grace_period' | 'before_second_party') => Promise<void>;
  handleSendQuestion: (question: string) => Promise<void>;
}

// --- Sub-component Props ---
export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  locale: 'he' | 'en';
  isMobile: boolean;
  isFullscreen: boolean;
  isTransitioning: boolean;
  children: React.ReactNode;
}

export interface PersonIdentityBarProps {
  personName?: string;
  personAge?: number | null;
  statusLabel?: string;
  statusBadgeClass?: string;
}

export interface TabHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMobile: boolean;
  isTransitioning?: boolean;
  dict: SuggestionsDictionary['modal']['tabs'];
  personName?: string;
  personAge?: number | null;
  statusLabel?: string;
  statusBadgeClass?: string;
  visitedTabs?: Set<string>;
}

export interface PresentationTabProps {
  matchmaker: { firstName: string; lastName: string } | undefined;
  targetParty: ExtendedMatchSuggestion['secondParty'];
  personalNote?: string | null;
  matchingReason?: string | null;
  locale: 'he' | 'en';
  onViewProfile: () => void;
  onStartConversation: () => void;
  onRequestAiSummary: () => void;
  onNavigateToCompatibility: () => void;
  dict: SuggestionsDictionary['modal']['header'];
  aiInsightBarDict: { aiSummaryButton: string; compatibilityButton: string };
  profileCardDict?: ProfileCardDict;
}

export interface ProfileTabProps {
  profileWithUser: SuggestionModalState['profileWithUser'];
  isQuestionnaireLoading: boolean;
  targetParty: ExtendedMatchSuggestion['secondParty'] | null;
  questionnaire: QuestionnaireResponse | null;
  locale: 'he' | 'en';
  onNavigateToDetails: () => void;
  onRequestAiSummary: () => void;
  onNavigateToCompatibility: () => void;
  dict: {
    modal: SuggestionsDictionary['modal'];
    profileCard: ProfileCardDict;
  };
  aiInsightBarDict: { aiSummaryButton: string; compatibilityButton: string };
}

export interface CompatibilityTabProps {
  firstParty: ExtendedMatchSuggestion['firstParty'];
  secondParty: ExtendedMatchSuggestion['secondParty'];
  matchingReason?: string | null;
  targetPartyId: string;
  isDemo: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName: string;
  suggestedUserName: string;
  locale: 'he' | 'en';
  enumLabels?: Record<string, string>;
  dict: {
    aiAnalysisCta: SuggestionsDictionary['modal']['aiAnalysisCta'];
    aiAnalysis: SuggestionsDictionary['aiAnalysis'];
    compatibility: SuggestionsCompatibilityDict;
  };
}

export interface DetailsTabProps {
  suggestionId: string;
  statusHistory: ExtendedMatchSuggestion['statusHistory'];
  matchmakerFirstName: string;
  status: string;
  targetPartyContact?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    email: string;
  };
  locale: 'he' | 'en';
  dict: {
    timeline: SuggestionsDictionary['timeline'];
    modal: SuggestionsDictionary['modal'];
  };
  /** Auto-send message to AI chat when tab opens */
  autoSendMessage?: string | null;
  autoSendRequestType?: 'profile_summary';
  onAutoSendComplete?: () => void;
}

export interface QuickActionsBarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  status: string;
  isFirstParty: boolean;
  isUserInActiveProcess: boolean;
  isSubmitting: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onInterested: () => void;
  onAskQuestion: () => void;
  onWithdraw?: (type: 'grace_period' | 'before_second_party') => void;
  approvedAt?: Date | string | null;
  secondPartySent?: Date | string | null;
  locale: 'he' | 'en';
  dict: SuggestionsDictionary['modal']['actions'];
}

// --- Action State Shared Props ---
export interface ActionStateProps {
  isSubmitting: boolean;
  isHe: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onInterested: () => void;
  dict: SuggestionsDictionary['modal']['actions'];
}
