// src/types/dictionary.d.ts
import type { MatchmakerPageDictionary } from './dictionaries/matchmaker';
import { WORLD_KEYS } from '@/components/profile/constants'; 
import type { AuthDictionary } from './dictionaries/auth';
import type { WorldId } from '@/components/questionnaire/types/types';
// --- Navbar ---
export type NavbarDict = {
  myMatches: string;
  matchmakingQuestionnaire: string;
  messages: string;
  login: string;
  register: string;
  toQuestionnaire: string;
    matchmakerSuggestions: string;
  matchmakerClients: string;
};
// --- User Dropdown ---
export type UserDropdownDict = {
  openMenuAriaLabel: string;
  profileImageAlt: string;
  myProfile: string;
  questionnaire: string;
  accountSettings: string;
  signOut: string;
};


// --- Hero Section ---
export type PrincipleDict = {
  title: string;
  shortTitle: string;
  description:string;
};

export type HeroSectionDict = {
  titleLine1: string;
  highlightedWord: string;
  typewriterText: string;
  ctaButton: string;
  ctaButtonShort: string;
  secondaryButton: string;
  secondaryButtonShort: string;

  principlesHeader: {
    title: string;
    subtitle: string;
  };
  principles: PrincipleDict[];
  synergy: {
    techTools: string;
    personalGuidance: string;
  };
};

// --- Value Proposition Section ---
type SolutionItemDict = {
  bold: string;
  text?: string;
  textWithLink?: {
    part1: string;
    linkText: string;
    part2: string;
  };
};

export type ValuePropositionDict = {
  title_part1: string;
  title_brand: string;
  title_part2: string;
  subtitle: string;
  challengeCard: {
    title: string;
    items: string[];
  };
  solutionCard: {
    title: string;
    items: SolutionItemDict[];
  };
};

// --- Our Method Section ---
export type WorldDict = {
  title: string;
  shortDesc: string;
  fullDescription: string;
  personalExample: string;
  insight: string;
};

export type OurMethodDict = {
  constellation: {
    header: string;
    title_part1: string;
    title_part2: string;
    subtitle: string;
    cta_header: string;
    cta_title_part1: string;
    cta_title_part2: string;
    cta_subtitle: string;
    cta_button: string;
    cta_features: string;
    worlds: WorldDict[];
    example_header: string;
    insight_header: string;
    dimension_prefix: string;
    dimension_suffix: string;
  };
};

// --- How It Works Section ---
type StepDict = {
  title: string;
  description: string;
  linkText?: string;
};

type BenefitDict = {
  title: string;
  description: string;
};

export type HowItWorksDict = {
  promise: {
    header: string;
    title_line1: string;
    title_line2_part1: string;
    title_line2_part2: string;
    subtitle_line1: string;
    subtitle_line2: string;
  };
  process: {
    steps: StepDict[];
  };
  proof: {
    header: string;
    title_part1: string;
    title_part2: string;
    subtitle: string;
    demo_female: string;
    demo_male: string;
  };
  keyBenefits: {
    title_part1: string;
    title_part2: string;
    benefits: BenefitDict[];
  };
  testimonial: {
    header: string;
    quote: string;
    author_name: string;
    author_role: string;
  };
  finalCta: {
    title_line1: string;
    title_line2: string;
    subtitle_line1: string;
    subtitle_line2: string;
    button: string;
    features: string;
  };
    suggestionDemo: SuggestionDemoDict;
};


export type StickyNavDict = {
  homepageAriaLabel: string;
  signUpButton: string;
    mobileTitle?: string; // <--- הוסף את השורה הזו

  closeNavAriaLabel: string;
  openNavAriaLabel: string;
    navLinks: {
    howItWorks: string;
    suggestionDemo: string;
    successStories: string;
    ourTeam: string;
    faq: string;
  };

};

type TeamMemberDict = {
  name: string;
  role: string;
  description: string;
  tags: string[];
  imageSrc: string;
  color: string;
};

export type MatchmakerTeamDict = {
  title_part1: string;
  title_highlight: string;
  title_part2: string;
  subtitle: string;
  contact_button_text: string;
  team: TeamMemberDict[];
};

type StoryDict = {
  text: string;
  author: string;
  result: string;
  color: string;
};

export type SuccessStoriesDict = {
  title_part1: string;
  title_highlight: string;
  subtitle: string;
  more_stories_button: string;
  coming_soon_message: string;
  stories: StoryDict[];
};

// --- FAQ Section ---
type QuestionDict = {
  question: string;
  answer: string;
};

export type FaqDict = {
  header: string;
  title_part1: string;
  title_highlight: string;
  subtitle: string;
  contact_block: {
    title_part1: string;
    title_highlight: string;
    subtitle: string;
    button: string;
    availability: string;
  };
  questions: QuestionDict[];
};

export type PrivacyAssuranceDict = {
  title: string;
  subtitle: string;
  card_title: string;
  card_text: string;
  card_button: string;
  features: string[];
};

// --- CTA Section ---
export type CtaDict = {
  title_part1: string;
  title_highlight: string;
  subtitle: string;
  button: string;
};

// --- Footer Section ---
type FooterLink = {
  text: string;
  href: string;
};

type FooterContactItem = {
  icon: string;
  text: string;
};

export type FooterDict = {
  description: string;
  motto: string;
  copyright: string;
  columns: {
    navigation: {
      title: string;
      links: FooterLink[];
    };
    information: {
      title: string;
      links: FooterLink[];
    };
    contact: {
      title: string;
      items: FooterContactItem[];
    };
  };
};

export type ChatWidgetDict = {
  aria_open: string;
  aria_close: string;
  header_title: string;
  header_subtitle: string;
  header_status: string;
  prompt_header: string;
  prompt_questions: string[];
  email_action_button: string;
  email_link_button: string;
  texts: {
    welcome: string;
    limitReached: string;
    switchToEmailPrompt: string;
    composeEmailPrompt: string;
    emailError: string;
    genericError: string;
    sendEmailError: string;
    placeholderDefault: string;
    placeholderGatheringEmail: string;
    placeholderComposingEmail: string;
    placeholderLimitReached: string;
  };
};

export type CookieBannerDict = {
  aria_close: string;
  title: string;
  text_part1: string;
  privacy_policy_link: string;
  text_part2: string;
  accept_button: string;
  decline_button: string;
};

// ======================================================================== //
// ✨ START: NEW TYPES FOR SUGGESTIONS FEATURE ✨
// ======================================================================== //

export type SuggestionsCardDict = {
   suggestedBy: string;
  yourTurn: string;
  urgent: string;
  viewDetailsAria: string; // e.g., "View full details for {{name}}"
  whySpecial: string;
  reasonTeaserDefault: string;
  clickForDetails: string;
  buttons: {
    decline: string;
    approve: string;
    approveDisabledTooltip: string;
    askMatchmaker: string;
    viewDetails: string;
  };
    statusIndicator: {
    yourTurn: string;
    waitingForYou: string;
    matchmaker: string;
    firstParty: string;
    secondParty: string;
    bothParties: string;
  };
  statusDescriptions: {
    [key: string]: string;
  };


};

export type SuggestionsModalDict = {
  header: {
    title: string;
    subtitleLine1: string;
    subtitleLine2: string;
    suggestedBy: string;
    discoverMore: string;
    ageInYears: string; // e.g., "{{age}} years old"
    matchStoryTitle: string;
    matchStorySubtitle1: string;
    matchStorySubtitle2: string;
    viewFullProfile: string;
    iHaveQuestions: string;
    matchmakerInsight: string;
    whyYou: string;
    ourConnection: string;
    whatsNextTitle: string;
    whatsNextSubtitle1: string;
    whatsNextSubtitle2: string;
    bestTimeIsNow: string;
    toFullProfile: string;
  };
  tabs: {
    presentation: string;
    presentationShort: string;
    profile: string;
    profileShort: string;
    compatibility: string;
    compatibilityShort: string;
    details: string;
    detailsShort: string;
    fullscreen: string;
    exitFullscreen: string;
  };
  actions: {
    titleExpanded: string;
    titleCollapsed: string;
    subtitle: string;
    approve: string;
    sending: string;
    updating: string;
    ask: string;
    decline: string;
    reminder: string;
  };
  profile: {
    loading: string;
    loadingDescription: string;
    errorTitle: string;
    errorDescription: string;
    contactMatchmaker: string;
  };
  aiAnalysisCta: {
    title: string;
    description: string;
    feature1: string;
    feature2: string;
    feature3: string;
    button: string;
  };
};

// No changes needed in SuggestionsDictionary, as SuggestionsModalDict is already there.

export type AiAnalysisDict = {
  dialogTitle: string;
  loadingTitle: string;
  loadingDescription: string;
  loadingSteps: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
  errorTitle: string;
  errorAlertTitle: string;
  errorAlertDescription: string;
  retryButton: string;
  tabs: {
    summary: string;
    consider: string;
    conversation: string;
  };
  summaryTab: {
    strengthTitle: string;
  };
  considerTab: {
    title: string;
  };
  conversationTab: {
    title: string;
  };
  importantNote: string;
  noteText: string;
  backButton: string;
  triggerButton: string;
};

export type SuggestionsListDict = {
  emptyState: {
    noResultsTitle: string;
    noHistoryTitle: string;
    noActiveTitle: string;
    noResultsDescription: string;
    noHistoryDescription: string;
    noActiveDescription: string;
    clearFilters: string;
  };
  stats: {
    showing: string;
    total: string;
    pending: string;
    progress: string;
  };
  controls: {
    searchPlaceholder: string;
    filterLabel: string;
    filterAll: string;
    filterPending: string;
    filterAccepted: string;
    filterDeclined: string;
    filterContactShared: string;
    sortPlaceholder: string;
    sortNewest: string;
    sortOldest: string;
    sortDeadline: string;
    sortPriority: string;
  };
  activeFilters: {
    title: string;
    search: string;
    clearAll: string;
  };
  resultsCount: {
    showingSingle: string; // e.g., "Showing {{count}} suggestion of {{total}}"
    showingMultiple: string; // e.g., "Showing {{count}} suggestions of {{total}}"
    qualityMatches: string;
  };
};

export type SuggestionsContainerDict = {
  loading: {
    title: string;
    subtitle: string;
  };
  stats: {
    title: string;
    subtitle: string;
    new: string;
    newDesc: string;
    yourTurn: string;
    yourTurnDesc: string;
    approved: string;
    approvedDesc: string;
  };
  main: {
    title: string;
    refreshAriaLabel: string;
    newSuggestions: string;
    tabs: {
      active: string;
      urgent: string;
      history: string;
    };
    errorLoading: string; // e.g., "An error occurred: {error}"
    unknownError: string;
  };
  dialogs: {
    approveTitle: string;
    declineTitle: string;
    approveDescription: string;
    declineDescription: string;
    cancel: string;
    confirmApproval: string;
    confirmDecline: string;
  };
  toasts: {
    errorTitle: string;
    errorDescription: string;
    newSuggestionsTitle: string;
    newSuggestionsDescription: string;
    statusUpdateSuccess: string;
    statusUpdateError: string; // e.g., "Error updating status: {error}"
    approvedSuccess: string;
    approvedFirstPartyDesc: string;
    approvedSecondPartyDesc: string;
    declinedSuccess: string;
    declinedDesc: string;
    matchmakerNotified: string;
    refreshSuccessTitle: string;
    refreshSuccessDescription: string;
  };
};

// This is the main type for the new modular dictionary
export type SuggestionsDictionary = {
  container: SuggestionsContainerDict;
  card: SuggestionsCardDict;
  modal: SuggestionsModalDict;
  aiAnalysis: AiAnalysisDict;
  list: SuggestionsListDict;
  presentation: SuggestionsPresentationDict;
    quickView: SuggestionsQuickViewDict; 
  compatibility: SuggestionsCompatibilityDict; // <-- Add this line
  askMatchmaker: AskMatchmakerDict; // <-- Add this line
  inquiryThread: InquiryThreadDict; // <-- Add this line
  timeline: SuggestionTimelineDict; // <-- Add this line

};

// ======================================================================== //
// ✨ END: NEW TYPES FOR SUGGESTIONS FEATURE ✨
// ======================================================================== //

// --- The COMPLETE Dictionary Type for the entire app ---
export type Dictionary = {
  // Keys from the main dictionary
  navbar: NavbarDict;
  userDropdown: UserDropdownDict;
  stickyNav: StickyNavDict;
  heroSection: HeroSectionDict;
  valueProposition: ValuePropositionDict;
  ourMethod: OurMethodDict;
  howItWorks: HowItWorksDict;
  matchmakerTeam: MatchmakerTeamDict;
  successStories: SuccessStoriesDict;
  faq: FaqDict;
  privacyAssurance: PrivacyAssuranceDict;
  cta: CtaDict;
  footer: FooterDict;
  chatWidget: ChatWidgetDict;
  cookieBanner: CookieBannerDict;
    metadata: MetadataDict;
      questionnaire: QuestionnaireDictionary; 

  demoProfileCard: DemoProfileCardDict;
  unsavedChangesModal: UnsavedChangesModalDict;

  // New, namespaced key for the modular dictionary
  suggestions: SuggestionsDictionary;
  profilePage: ProfilePageDictionary;
    matchmakerPage: MatchmakerPageDictionary;
  auth: AuthDictionary; // <--- 2. הוספת המפתח והטיפוס החדש
contactPage: ContactPageDict;
  feedbackWidget: FeedbackWidgetDict; // <--- הוסף את השורה הזו

};
export type {
  SuggestionsDictionary,
  QuestionnaireDictionary,
  ProfilePageDictionary,
  MatchmakerPageDictionary,
};

export type SuggestionsPresentationDict = {
  hero: {
    title: string;
    matchmakerThoughts: string; // e.g., "Thoughts from the matchmaker, {{name}}:"
  };
  peek: {
    opportunity: string;
    age: string; // e.g., ", {{age}}"
    notSpecified: string;
    viewProfileButton: string;
  };
  ingredients: {
    title: string;
    values: string;
    personality: string;
    background: string;
    spark: string;
    matchmakerNotes: string;
  };
  aiCta: {
    title: string;
    description: string;
  };
  // Add this new object for the MatchmakerRationale component
  rationale: {
    title: string;
    description: string; // e.g., "Thoughts from the matchmaker {{name}}"
    personalNoteTitle: string;
    generalReasonTitle: string;
    noReasonText: string;
  };
};
export type MetadataDict = {
  title: string;
  description: string;
};

export type SuggestionsQuickViewDict = {
  unitCm: string;
  aboutTitle: string;
  reasonTitle: string;
  deadlineText: string; // e.g., "Response needed by {{date}}"
  buttons: {
    viewProfile: string;
    approve: string;
    decline: string;
    ask: string;
  };
};

export type SuggestionsCompatibilityDict = {
  mainTitle: string;
  mainSubtitle: string;
  errorTitle: string;
  errorDescription: string;
  noDataTitle: string;
  noDataDescription: string;
  overallScore: {
    cardTitle: string;
    score: string;
    descriptionExcellent: string;
    descriptionGood: string;
    descriptionModerate: string;
    descriptionChallenging: string;
    progressText: string; // e.g., "{{compatibleCount}} of {{totalCount}} criteria match"
    overallScoreLabel: string; // e.g., "Overall Score: {{score}}%"
  };
  categoryTitles: {
    basic: string;
    lifestyle: string;
    values: string;
    preferences: string;
  };
  categorySubtitle: string; // e.g., "{{compatibleCount}} of {{totalCount}} compatible"
  compatibilityLabel: string; // "Compatibility"
  importance: {
    high: string;
    medium: string;
    low: string;
  };
  card: {
    notSpecified: string;
  };
  criteria: {
    age: string;
    height: string;
    location: string;
    religiousLevel: string;
    education: string;
    occupation: string;
    origin: string;
    language: string;
  };
  reasons: {
    mutualMatch: string; // "Mutual match in {{criterion}} expectations"
    mismatch: string; // "Mismatch in {{criterion}} expectations"
    sameOrigin: string;
    differentOrigin: string;
    sharedLanguage: string;
    noSharedLanguage: string;
  };
  matchmakerRationaleTitle: string;
  unitCm: string;
};

type QuestionTopicDict = {
  label: string;
  description: string;
  questions: string[];
};

// Add this new type definition before the SuggestionsDictionary type
export type AskMatchmakerDict = {
  title: string; // "Question for {{name}}" or "Question for the Matchmaker"
  titleDefault: string; // "Question for the Matchmaker"
  description: string;
  statusBadge: string;
  errorSubmitting: string;
  topicSelect: {
    title: string;
    subtitle: string;
  };
  sampleQuestions: {
    title: string; // "Sample Questions - {{topic}}"
  };
  input: {
    label: string;
    placeholder: string;
    charCount: string; // "{{count}}/500 characters"
    info: string;
  };
  buttons: {
    cancel: string;
    submit: string;
    submitting: string;
  };
  topics: {
    values: QuestionTopicDict;
    family: QuestionTopicDict;
    career: QuestionTopicDict;
    personality: QuestionTopicDict;
    future: QuestionTopicDict;
    other: QuestionTopicDict;
  };
};

export type InquiryThreadDict = {
  title: string;
  subtitle: string;
  status: {
    pending: string;
    answered: string;
    closed: string;
  };
  answerBadge: string;
  loadingError: string;
  retryButton: string;
  emptyState: {
    title: string;
    description: string;
  };
  composer: {
    label: string;
    placeholder: string;
    charCount: string; // e.g., "{{count}}/500"
    sendButton: string;
    sendingButton: string;
  };
  replyForm: {
    title: string;
    placeholder: string;
    sendButton: string;
    sendingButton: string;
  };
  toasts: {
    sendSuccessTitle: string;
    sendSuccessDescription: string;
    sendError: string;
    replySuccess: string;
    replyError: string;
  };
  invalidDate: string;
};
export type SuggestionTimelineDict = {
  title: string;
  subtitle: string;
  emptyState: {
    title: string;
    description: string;
  };
  latestBadge: string;
  summary: {
    totalSteps: string;
    activeDays: string;
    approvals: string;
    currentStatus: string;
  };
  statuses: {
    [key in MatchSuggestionStatus]: {
      label: string;
      description: string;
    };
  };
};

export type MatchSuggestionStatus = 
  | 'DRAFT' | 'PENDING_FIRST_PARTY' | 'FIRST_PARTY_APPROVED' | 'FIRST_PARTY_DECLINED'
  | 'PENDING_SECOND_PARTY' | 'SECOND_PARTY_APPROVED' | 'SECOND_PARTY_DECLINED'
  | 'AWAITING_MATCHMAKER_APPROVAL' | 'CONTACT_DETAILS_SHARED' | 'AWAITING_FIRST_DATE_FEEDBACK'
  | 'THINKING_AFTER_DATE' | 'PROCEEDING_TO_SECOND_DATE' | 'ENDED_AFTER_FIRST_DATE'
  | 'MEETING_PENDING' | 'MEETING_SCHEDULED' | 'MATCH_APPROVED' | 'MATCH_DECLINED'
  | 'DATING' | 'ENGAGED' | 'MARRIED' | 'EXPIRED' | 'CLOSED' | 'CANCELLED';


  export type DemoProfileCardDict = {
  tabs: {
    essence: string;
    story: string;
    vision: string;
  };
  vision: {
    q1: string;
    a1: string;
    q2: string;
    a2: string;
  };
  ctaButton: string;
  imageNav: {
    prev: string;
    next: string;
    showImage: string; // e.g., "Show image number {{number}}"
  };
  tablistLabel: string;
};

// ======================================================================== //
// ✨ START: NEW TYPES FOR QUESTIONNAIRE FEATURE ✨
// ======================================================================== //

export type WorldIntroDict = {
  world: string;
  of: string;
  stats: {
    estimatedTime: string;
    totalQuestions: string;
    requiredQuestions: string;
    
  };
  statsValues: {
    minutes: string;
  };
  whyTitle: string;
  whatYouWillDiscoverTitle: string;
  startButton: string;

};

type WorldContent = {
  title: string;
  subtitle: string;
  whyIsItImportant: string;
  whatYouWillDiscover: string[];
  guidingThought: string;
};


export type QuestionCardDict = {
  depthLabels: {
    BASIC: string;
    ADVANCED: string;
    EXPERT: string;
  };
  depthDescriptions: {
    BASIC: string;
    ADVANCED: string;
    EXPERT: string;
  };
  requiredBadge: string;
  tooltips: {
    removeBookmark: string;
    addBookmark: string;
    hideHelp: string;
    showHelp: string;
    whyQuestion: string;
    visibility: {
      visibleTitle: string;
      hiddenTitle: string;
      visibleDesc: string;
      hiddenDesc: string;
    };
    saveProgressSaving: string;
    saveProgress: string;
    viewProfile: string;
  };
  visibilityButton: {
    visible: string;
    hidden: string;
  };
  skipButton: {
    skip: string;
    required: string;
  };
};

// ... (rest of the file remains the same) ...

export type QuestionnaireCompletionDict = {
  title: string;
  loggedInDescription: string;
  guestDescription: string;
  loggedInContent: {
    prompt: string;
    promptSubtitle: string;
    sendButton: string;
    sendingButton: string;
    reviewButton: string;
  };
  guestContent: {
    loginButton: string;
  };
};

export type MatchmakingQuestionnaireDict = {
      worldLabels: Record<WorldId, string>; // ודא שזה משתמש ב-WorldId המיובא

  toasts: {
    saveSuccess: string;
    autoSaveError: string;
    unsavedChanges: {
      message: string;
      action: string;
    };
    answerVisible: string;
    answerHidden: string;
    worldProgressSaved: string;
    worldProgressSavedBrowser: string;
    worldCompletionError: string;
    worldFinished: string; // e.g., "כל הכבוד! סיימת את עולם ה{{worldName}}"
  };
  errors: {
    invalidSubmission: string;
    saveFailed: string;
    loadFailed: string;
    genericLoadError: string;
    stageLoadError: string;
  };
  idleModal: {
    title: string;
    description: string;
    logoutButton: string;
    stayActiveButton: string;
  };
  lastSaved: string; // e.g., "נשמר לאחרונה: {{time}}"
  loading: string;
};

export type QuestionnairePageDict = {
  loading: string;
  backToMain: string;
  stageLoadError: string;
  completionError: string;
};

// Main dictionary for the questionnaire feature
export type QuestionnaireDictionary = {
  worldIntro: WorldIntroDict;
  questionCard: QuestionCardDict;
  completion: QuestionnaireCompletionDict;
  matchmaking: MatchmakingQuestionnaireDict;
  page: QuestionnairePageDict;
    landingPage: QuestionnaireLandingPageDict; // <-- הוספה
  worldsMap: WorldsMapDict; // <-- הוספה
   layout: QuestionnaireLayoutDict;
  world: WorldComponentDict;
    answerInput: AnswerInputDict;
  interactiveScale: InteractiveScaleDict;
  faq: QuestionnaireFaqDict; // <-- הוספה
  accessibilityFeatures: AccessibilityFeaturesDict; // <-- הוספה
  questionnaireProgress: QuestionnaireProgressDict; // <-- הוספה
  userStats: UserStatsDict; // <-- הוספה
  questionnaireRestore: QuestionnaireRestoreDict; // <-- הוספה
  questionnaireCompletePage: QuestionnaireCompletePageDict; // <-- הוספה
  questionsList: QuestionsListDict; // <-- הוספה
  matchResultCard: MatchResultCardDict; // <-- הוספה
  questions: QuestionsDictionary; // <--- הוספת המפתח החדש

  // Add other component dictionaries here as needed
};

export type QuestionsListDict = {
  depthLabels: {
    BASIC: string;
    ADVANCED: string;
    EXPERT: string;
  };
};

// ======================================================================== //
// ✨ END: NEW TYPES FOR QUESTIONNAIRE FEATURE ✨
// ======================================================================== //

// START: Additions for QuestionnaireComplete.tsx
export type QuestionnaireCompletePageDict = {
  loading: string;
  title: string;
  successMessage1: string;
  successMessage2: string;
  profilePrompt: string;
  continueButton: string;
};
// END: Additions for QuestionnaireComplete.tsx


// START: Additions for QuestionnaireRestore.tsx
export type QuestionnaireRestoreDict = {
  loading: string;
  restoringTitle: string;
  restoringSubtitle: string;
  error: string;
  backButton: string;
};
// END: Additions for QuestionnaireRestore.tsx

// START: Additions for UserStats.tsx
export type UserStatsDict = {
  matchStatsCard: {
    title: string;
    activeMatches: string;
    pendingMatches: string;
    matchScore: string;
    daysActive: string; // Placeholder: {{days}}
    joinDate: string; // Placeholder: {{date}}
  };
  profileProgressCard: {
    title: string;
    profileCompletion: string;
    questionsAnswered: string;
    outOf: string;
    completedWorlds: string;
    activityLevel: string;
  };
  personalityTraitsCard: {
    title: string;
  };
  tooltips: {
    traitScore: string; // Placeholder: {{score}}
  };
  common: {
    notAvailable: string;
  };
  worlds: {
    [key in 'PERSONALITY' | 'VALUES' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION']: string;
  };
  activityLevels: {
    high: string;
    medium: string;
    low: string;
  };
};
// END: Additions for UserStats.tsx

// src/types/dictionary.d.ts

// --- טיפוסים חדשים עבור עמוד הפרופיל ---

export type ProfileChecklistDict = {
  welcome: string; // Placeholder: {{firstName}}
  allComplete: string; // Placeholder: {{firstName}}
  welcomeSubtitle: string;
  allCompleteSubtitle: string;
  completionLabel: string;
  expandLabel: string;
  minimizeLabel: string;
  missingItemsTitle: string;
  tasks: {
    photos: {
      title: string;
      description:string;
      missing: string; // Placeholder: {{count}}
    };
    personalDetails: {
      title: string;
      description: string;
    };
    partnerPreferences: {
      title: string;
      description: string;
    };
    questionnaire: {
      title: string;
      description: string;
    };
    review: {
      title: string;
      description: string;
      missing: string;
    };
  };
  missingItems: { [key: string]: string }; // <-- הוסף שורה זו

};
export type PhotosSectionDict = {
  title: string;
  subtitle: string; // Placeholder: {{maxImages}}
  uploadingMultiple: string; // Placeholder: {{count}}
  selectForDeletion: string;
  uploadButton: string;
  selectionHeader: string; // Placeholder: {{count}}
  deselectAll: string;
  selectAll: string;
  deleteSelected: string;
  setAsMainTooltip: string;
  deleteTooltip: string;
  mainBadge: string;
  uploadPlaceholder: {
    title: string;
    remaining: string; // Placeholder: {{count}}
    prompt: string;
  };
  uploadingPlaceholder: string;
  emptyState: {
    title: string;
    description: string;
  };
  emptyStateDisabled: {
    title: string;
  };
  deleteDialog: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
  imageViewer: {
    closeLabel: string;
    altText: string; // Placeholder: {{index}}
    prevLabel: string;
    nextLabel: string;
    setMainButton: string;
    deleteButton: string;
    counter: string; // Placeholders: {{current}}, {{total}}
  };
  toasts: {
    maxImagesError: string;
    slotsError: string; // Placeholder: {{count}}
    invalidFileTypeError: string; // Placeholder: {{fileName}}
    fileTooLargeError: string; // Placeholder: {{fileName}}
    uploadSuccess: string; // Placeholder: {{count}}
    uploadError: string;
    selectOneError: string;
    bulkDeleteSuccess: string; // Placeholder: {{count}}
    bulkDeleteError: string;
    singleDeleteSuccess: string;
    singleDeleteError: string;
    setMainSuccess: string;
    setMainError: string;
  };
  confirmations: {
    bulkDelete: string; // Placeholder: {{count}}
  };
};


export type AIAdvisorDialogDict = {
  triggerButton: string;
  dialogTitle: string;
  dialogDescription: string;
  closeButton: string;
  loadingTitle: string;
  loadingDescription: string;
  // שדות ייעודיים לאלרט השגיאה שמופיע בתוך הדיאלוג
  errorAlertTitle: string; 
  errorAlertDescription: string;
  retryButton: string;
  initialState: string;
  // אובייקט ייעודי להודעות ה-toast שקופצות
  toast: {
    errorTitle: string;
    errorDescription: string; // Placeholder: {{error}}
  };
};


export type AnalysisResultDisplayDict = {
  tabs: {
    summary: string;
    completeness: string;
    tips: string;
  };
  summary: {
    myPersonalityTitle: string;
    myPersonalityDescription: string;
    lookingForTitle: string;
    lookingForDescription: string;
  };
  completeness: {
    title: string;
    description: string;
    status: {
      complete: string;
      partial: string;
      missing: string;
    };
  };
  tips: {
    title: string;
    description: string;
  };
};

export type UnifiedProfileDashboardDict = {
  loadingData: string;
  loadError: string; // Placeholder: {{error}}
  updateSuccess: string;
  updateError: string; // Placeholder: {{error}}
  previewButton: string;
  previewLoading: string;
  viewedPreviewSuccess: string;
  viewedPreviewError: string;
  tabs: {
    overview: string;
    photos: string;
    preferences: string;
    questionnaire: string;
  };
  tabContent: {
    loadingOverview: string;
    loadingPreferences: string;
    loadingQuestionnaire: string;
    noQuestionnaire: string;
    fillQuestionnaireLink: string;
    questionnaireUpdateSuccess: string; // <-- הוספה
    questionnaireUpdateError: string; 
  };
  checklist: ProfileChecklistDict;
  aiAdvisor: AIAdvisorDialogDict;
  analysisResult: AnalysisResultDisplayDict;

};
export type PreferencesSectionDict = {
  header: {
    title: string;
    subtitleEdit: string;
    subtitleView: string;
  };
  buttons: {
    edit: string;
    cancel: string;
    save: string;
  };
  cards: {
    general: {
      title: string;
      notesLabel: string;
      notesTooltip: string;
      notesPlaceholder: string;
      notesEmpty: string;
      contactPreferenceLabel: string;
      contactPreferencePlaceholder: string;
      contactPreferenceEmpty: string;
    };
    ageAndHeight: {
      title: string;
      ageLegend: string;
      ageTooltip: string;
      ageMinPlaceholder: string;
      ageMaxPlaceholder: string;
      ageEmpty: string;
      heightLegend: string;
      heightMinPlaceholder: string;
      heightMaxPlaceholder: string;
      heightEmpty: string;
    };
    locationAndReligion: {
      title: string;
      locationsLabel: string;
      locationsPlaceholder: string;
      locationsRemoveLabel: string; // Placeholder: {{loc}}
      locationsEmpty: string;
      religiousLevelsLegend: string;
      religiousLevelsTooltip: string;
      religiousLevelsEmpty: string;
      religiousJourneysLegend: string;
      religiousJourneysEmpty: string;
      shomerNegiahLabel: string;
      shomerNegiahPlaceholder: string;
      headCoveringLegend: string;
      headCoveringEmpty: string;
      kippahTypeLegend: string;
      kippahTypeEmpty: string;
    };
    educationAndCareer: {
      title: string;
      educationLegend: string;
      educationEmpty: string;
      occupationLegend: string;
      occupationEmpty: string;
      serviceTypeLegend: string;
      serviceTypeEmpty: string;
    };
    personalBackground: {
      title: string;
      maritalStatusLegend: string;
      maritalStatusEmpty: string;
      partnerHasChildrenLabel: string;
      partnerHasChildrenPlaceholder: string;
      originLegend: string;
      originPlaceholder: string;
      originRemoveLabel: string; // Placeholder: {{origin}}
      originEmpty: string;
      aliyaStatusLabel: string;
      aliyaStatusPlaceholder: string;
    };
    characterAndInterests: {
      title: string;
      traitsLegend: string;
      traitsEmpty: string;
      hobbiesLegend: string;
      hobbiesEmpty: string;
    };
  };
  options: {
    // We will store all select/multi-select options here
    contactPreference: { direct: string; matchmaker: string; both: string; };
    religiousLevels: { [key: string]: string };
    religiousJourneys: { [key: string]: string };
    shomerNegiah: { yes: string; no: string; flexible: string; };
    education: { [key: string]: string };
    occupation: { [key: string]: string };
    serviceTypes: { [key: string]: string };
    headCovering: { [key: string]: string };
    kippahType: { [key: string]: string };
    maritalStatus: { [key: string]: string };
    partnerHasChildren: { yes_ok: string; no_preferred: string; does_not_matter: string; };
    aliyaStatus: { oleh: string; tzabar: string; no_preference: string; };
    origins: { [key: string]: string };
    traits: { [key: string]: string };
    hobbies: { [key: string]: string };
  };
};
export type FaqAnswerPart = {
  type: 'p' | 'list' | 'tip' | 'info' | 'star' | 'alert';
  title?: string;
  content: string | string[];
};


type FaqItemDict = {
  question: string;
  answer: FaqAnswerPart[];
};

export type QuestionnaireFaqDict = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  popularBadge: string;
  emptyState: string;
  categories: {
    all: string;
    process: string;
    technical: string;
    privacy: string;
    results: string;
    general: string;
  };
  items: {
    'save-progress': FaqItemDict;
    'time-to-complete': FaqItemDict;
    'required-questions': FaqItemDict;
    'how-matching-works': FaqItemDict;
    'privacy-info': FaqItemDict;
    'edit-answers': FaqItemDict;
    'match-percentage': FaqItemDict;
    'incomplete-questionnaire': FaqItemDict;
    'inactive-account': FaqItemDict;
  };
};
// END: Additions for FAQ.tsx

// --- טיפוס-על המאגד את כל מילוני הפרופיל ---
export type ProfilePageDictionary = {
  pageLoader: string;
  dashboard: UnifiedProfileDashboardDict;
    photosSection: PhotosSectionDict; // הוספת הטיפוס החדש
  preferencesSection: PreferencesSectionDict; // הוספת הטיפוס החדש
  profileSection: ProfileSectionDict; // This line is added
  profileCard: ProfileCardDict; // This line is added
  minimalCard: MinimalCardDict;
  statsCard: StatsCardDict;
  visibilityControl: VisibilityControlDict;
  budgetDisplay: BudgetDisplayDict;
  utils: ProfileUtilsDict;
    questionnaireSection: QuestionnaireSectionDictionary;
  availabilityStatus: AvailabilityStatusDict;
  accountSettings: AccountSettingsDict;

  // כאן יתווספו מילונים עבור רכיבים נוספים כמו ProfileSection, PreferencesSection וכו'
};

// START: Additions for QuestionnaireProgress.tsx
type AchievementDict = {
  name: string;
  description: string;
};

export type QuestionnaireProgressDict = {
        worldLabels: Record<WorldId, string>;
  mobile: {
    title: string;
    totalLabel: string;
    requiredLabel: string;
    timeLeftLabel: string;
    savedLabel: string;
  };
  desktop: {
    title: string;
    subtitle: string;
    progressSummaryTitle: string;
    achievementsTitle: string;
    worldsTitle: string;
    worldsSubtitle: string;
    tooltip: {
      progressInfoTitle: string;
      progressInfoDesc: string;
      completionDetails: string; // Placeholder: {{answered}}, {{total}}
    };
    accordion: {
      recommendations: string;
      timeBreakdown: string;
    };
  };
  statusBadge: {
    complete: string;
    started: string;
    progress: string; // Placeholder: {{progress}}
  };
  timeStrings: {
    lessThanAMinute: string;
    minutesSuffix: string;
    hours: string;
    and: string;
    savedNow: string;
    savedMinutesAgo: string; // Placeholder: {{minutes}}
    savedHoursAgo: string; // Placeholder: {{hours}}
    savedAtTime: string; // Placeholder: {{time}}
  };
  rewards: {
    title: string;
    achievedText: string;
    moreToGo: string; // Placeholder: {{count}}
    prompt: string;
    achievements: {
      goal: AchievementDict;
      halfway: AchievementDict;
      advanced: AchievementDict;
      complete: AchievementDict;
    };
  };
  recommendations: {
    title: string;
    statuses: {
      completed: string;
      active: string;
      pending: string;
    };
    ctaButton: string;
  };
  timeBreakdown: {
    title: string; // Placeholder: {{timeLeft}}
    subtitle: string;
    statusCompleted: string;
    timePerWorld: string; // Placeholder: {{time}}
  };
};
// END: Additions for QuestionnaireProgress.tsx

export type QuestionnaireLandingPageDict = {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };
  cta: {
    start: string;
    continue: string;
    startAsUser: string; // "{{name}}, התחל/י את המסע"
    loginButton: string;
  };
  worldsSection: {
    title: string;
    subtitle: string;
  };
  worlds: {
    [key in WorldId]: {
      title: string;
      description: string;
      questionsLabel: string; // "e.g., "{{count}} שאלות"
    };
  };
  featuresSection: {
    title: string;
    subtitle: string;
    features: {
      title: string;
      description: string;
    }[];
  };
  finalCta: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
  footer: {
    copyright: string; // e.g., "© {{year}} NeshamaTech. כל הזכויות שמורות."
  };
};

type WorldContent = {
  title: string;
  subtitle: string;
  whyIsItImportant: string;
  whatYouWillDiscover: string[];
  guidingThought: string;
};

export type WorldsMapDict = {
  worldLabels: Record<WorldId, string>; // labels for buttons, headers etc.
  progressHeader: {
    greeting: string; // e.g., "שלום, {{name}}! ברוך הבא למסע שלך"
    defaultTitle: string;
    progressText: string; // e.g., "השלמת {{completedCount}} מתוך {{totalCount}} עולמות."
    ctaButton: string; // e.g., "המשך לעולם המומלץ: {{worldName}}"
  };
  reviewCard: {
    title: string;
    description: string;
    button: string;
  };
  worldCard: {
    readMore: string;
    showLess: string;
    questionCount: string; // e.g., "{{count}} שאלות"
    estimatedTime: string; // e.g., "~{{count}} דקות"
    statuses: {
      completed: string;
      recommended: string;
      active: string;
      available: string;
      locked: string;
    };
    actions: {
      edit: string;
      start: string;
      continue: string;
      locked: string;
    };
  };
  completionBanner: {
    title: string; // e.g., "כל הכבוד, {{name}}!"
    subtitle: string;
    description: string;
  };
  worldsContent: Record<WorldId, WorldContent>; // All descriptive content for cards
};
export type QuestionnaireLayoutDict = {
  navHeader: string;
  navSubtitle: string;
  unauthenticatedPrompt: {
    title: string;
    subtitle: string;
    loginButton: string;
    registerButton: string;
  };
  buttons: {
    save: string;
    saving: string;
    review: string;
    map: string;
  };
  lastSaved: string; // e.g., "נשמר: {{time}}"
  exitPrompt: {
    title: string;
    description: string;
    cancel: string;
    saveAndExit: string;
    exitWithoutSaving: string;
  };
  mobileNav: {
    title: string;
    backToMap: string;
    exit: string;
    reviewAnswers: string;
  };
  tooltips: {
    faq: string;
    accessibility: string;
  };
  profileNotice: {
    title: string;
    textPart1: string;
    textPart2: string;
    textPart3: string;
    link: string;
  };
};

export type WorldComponentDict = {
  header: {
    questionLabel: string; // e.g., "שאלה {{current}} מתוך {{total}}"
  };
  errors: {
    loadingFailedTitle: string;
    loadingFailedDescription: string;
    invalidQuestion: string;
  };
  buttons: {
    backToMap: string;
    hideList: string;
    showList: string;
    questionList: string;
    previous: string;
    next: string;
    finish: string;
  };
  listSheet: {
    title: string; // e.g., "כל השאלות ב{{worldTitle}}"
    description: string;
    legend: {
      completed: string;
      required: string;
      notAnswered: string;
    };
  };
};


export type AnalysisResultDisplayDict = {
  tabs: {
    summary: string;
    completeness: string;
    tips: string;
  };
  summary: {
    // השמות הנכונים הם myPersonality...
    myPersonalityTitle: string;
    myPersonalityDescription: string;
    lookingForTitle: string;
    lookingForDescription: string;
  };
  completeness: {
    title: string;
    description: string;
    status: {
      complete: string;
      partial: string;
      missing: string;
    };
  };
  tips: {
    title: string;
    description: string;
  };

 };
 export type AnswerInputDict = {
  clearSelection: string;
  tooltips: {
    copy: string;
    copied: string;
    clearText: string;
    removeCustomAnswer: string;
    resetAllocation: string;
  };
  multiSelectWithOther: {
    addOtherOptionLabel: string;
    otherOptionPlaceholder: string;
    addButton: string;
    addedAnswersLabel: string;
    errorExists: string;
  };
  multiSelect: {
    maxSelectionError: string; // e.g., "ניתן לבחור עד {{count}} אפשרויות"
    selectedInfo: string; // e.g., "נבחרו {{count}} אפשרויות"
    minLabel: string; // e.g., "מינימום"
    maxLabel: string; // e.g., "מקסימום"
  };
  openText: {
    placeholder: string;
    minLengthRequired: string; // e.g., "נדרשים עוד {{count}} תווים"
    minLengthMet: string;
    maxLengthExceeded: string;
    minLengthInfoRequired: string; // e.g., "נדרש לפחות {{count}} תווים"
    minLengthInfoRecommended: string; // e.g., "מומלץ לפחות {{count}} תווים"
    estimatedTime: string; // e.g., "זמן כתיבה משוער: {{count}} דקות"
    tipsButton: string;
  };
  budgetAllocation: {
    totalAllocated: string; // e.g., "סה״כ הוקצה:"
    remaining: string; // e.g., "חסר {{count}}"
    surplus: string; // e.g., "עודף {{count}}"
    resetButton: string;
  };
  unsupportedType: string; // e.g., "אופס! סוג השאלה {{type}} אינו נתמך כרגע."
};

export type InteractiveScaleDict = {
  selectedValue: string; // e.g., "ערך נבחר: {{value}}"
  ariaLabel: string; // e.g., "Scale value {{value}}"
};


// START: Additions for AccessibilityFeatures.tsx
type ContrastOptionDict = {
  label: string;
  description: string;
};

type AdvancedOptionDict = {
  label: string;
  description: string;
};

export type AccessibilityFeaturesDict = {
  panelTitle: string;
  panelSubtitle: string;
  changedBadge: string;
  triggerButton: {
    open: string;
    close: string;
  };
  resetButton: string;
  textSize: {
    title: string;
    description: string;
  };
  displayMode: {
    title: string;
  };
  contrastOptions: {
    normal: ContrastOptionDict;
    high: ContrastOptionDict;
    dark: ContrastOptionDict;
  };
  additionalSettings: {
    title: string;
  };
  advancedOptions: {
    sound: AdvancedOptionDict;
    reader: AdvancedOptionDict;
    cursor: AdvancedOptionDict;
    font: AdvancedOptionDict;
    motion: AdvancedOptionDict;
  };
  settingNames: {
    [key in 'fontScale' | 'contrastMode' | 'reducedMotion' | 'readableMode' | 'bigCursor' | 'textReader' | 'soundEnabled']: string;
  };
  toasts: {
    settingUpdated: string; // Placeholder: {{settingName}}
    settingsReset: string;
    readerEnabled: string;
  };
};
// END: Additions for AccessibilityFeatures.tsx

export type ProfileSectionDict = {
  loading: string;
  header: {
    title: string;
    subtitleEdit: string;
    subtitleView: string;
  };
  buttons: {
    edit: string;
    cancel: string;
    save: string;
    saveChanges: string;
  };
  cards: {
    personal: {
      title: string;
      genderLabel: string;
      genderPlaceholder: string;
      birthDateLabel: string;
      heightLabel: string;
      heightPlaceholder: string;
      cityLabel: string;
      cityPlaceholder: string;
      originLabel: string;
      originPlaceholder: string;
      aliyaCountryLabel: string;
      aliyaCountryPlaceholder: string;
      aliyaYearLabel: string;
      aliyaYearPlaceholder: string;
      nativeLanguageLabel: string;
      nativeLanguagePlaceholder: string;
      additionalLanguagesLabel: string;
      additionalLanguagesPlaceholder: string;
      noAdditionalLanguages: string;
      removeLanguageLabel: string; // Placeholder: {{lang}}
    };
    family: {
      title: string;
      maritalStatusLabel: string;
      maritalStatusPlaceholder: string;
      hasChildrenLabel: string;
      hasChildrenYes: string;
      parentStatusLabel: string;
      parentStatusPlaceholder: string;
      fatherOccupationLabel: string;
      fatherOccupationPlaceholder: string;
      motherOccupationLabel: string;
      motherOccupationPlaceholder: string;
      siblingsLabel: string;
      siblingsPlaceholder: string;
      positionLabel: string;
      positionPlaceholder: string;
    };
    religion: {
      title: string;
      religiousLevelLabel: string;
      religiousLevelPlaceholder: string;
      religiousJourneyLabel: string;
      religiousJourneyPlaceholder: string;
      shomerNegiahLabel: string;
      shomerNegiahYes: string;
      headCoveringLabel: string;
      headCoveringPlaceholder: string;
      headCoveringDefault: string;
      kippahTypeLabel: string;
      kippahTypePlaceholder: string;
      kippahTypeDefault: string;
      matchmakerGenderLabel: string;
      matchmakerGenderPlaceholder: string;
      matchmakerGenderDefault: string;
      influentialRabbiLabel: string;
      influentialRabbiPlaceholder: string;
      influentialRabbiEmpty: string;
    };
    about: {
      title: string;
      headlineLabel: string;
      headlinePlaceholder: string;
      headlineEmpty: {
        title: string;
        subtitle: string;
        example: string;
      };
      aboutLabel: string;
      aboutPlaceholder: string;
      aboutEmpty: string;
      inspiringCoupleLabel: string;
      inspiringCouplePlaceholder: string;
      inspiringCoupleEmpty: string;
      privateNotesLabel: string;
      privateNotesPlaceholder: string;
      privateNotesEmpty: string;
    };
    medical: {
      title: string;
      tooltip: string;
      description: string;
      hasInfoLabel: string;
      detailsLabel: string;
      detailsPlaceholder: string;
      timingLabel: string;
      timingPlaceholder: string;
      visibilityLabel: string;
      visibilityToggle: {
        visible: string;
        hidden: string;
      };
      visibilityDescription: {
        visible: string;
        hidden: string;
      };
      display: {
        sharedInfo: string;
        yes: string;
        no: string;
        details: string;
        noDetails: string;
        timing: string;
        visibility: string;
        visibleBadge: string;
        hiddenBadge: string;
      };
    };
    education: {
      title: string;
      levelLabel: string;
      levelPlaceholder: string;
      detailsLabel: string;
      detailsPlaceholder: string;
      occupationLabel: string;
      occupationPlaceholder: string;
      serviceTypeLabel: string;
      serviceTypePlaceholder: string;
      serviceDetailsLabel: string;
      serviceDetailsPlaceholder: string;
    };
    character: {
      title: string;
      traitsLabel: string;
      traitsEmpty: string;
      hobbiesLabel: string;
      hobbiesEmpty: string;
    };
  };
  placeholders: {
    notSpecified: string;
    notRelevant: string;
    noYear: string;
  };
  tooltips: {
    headline: string;
    about: string; // Placeholder: {{count}}
    inspiringCouple: string;
    influentialRabbi: string;
    privateNotes: string;
  };
  toasts: {
    validationErrorTitle: string;
    aboutMinLength: string; // Placeholder: {{count}}
  };
  options: {
    gender: {
      MALE: string;
      FEMALE: string;
    };
    maritalStatus: {
      single: string;
      divorced: string;
      widowed: string;
      annulled: string;
    };
    religiousLevel: {
      charedi: string;
      charedi_modern: string;
      dati_leumi_torani: string;
      dati_leumi_liberal: string;
      dati_leumi_standard: string;
      masorti_strong: string;
      masorti_light: string;
      secular_traditional_connection: string;
      secular: string;
      spiritual_not_religious: string;
      other: string;
    };
    religiousJourney: {
      BORN_INTO_CURRENT_LIFESTYLE: string;
      BORN_SECULAR: string;
      BAAL_TESHUVA: string;
      DATLASH: string;
      CONVERT: string;
      IN_PROCESS: string;
      OTHER: string;
    };
    educationLevel: {
      high_school: string;
      vocational: string;
      academic_student: string;
      academic_ba: string;
      academic_ma: string;
      academic_phd: string;
      yeshiva_seminary: string;
      other: string;
    };
    serviceType: { [key in ServiceType]: string };
    headCovering: { [key in HeadCoveringType]: string };
    kippahType: { [key in KippahType]: string };
    matchmakerGender: {
      MALE: string;
      FEMALE: string;
      NONE: string;
    };
    medicalTiming: {
      FROM_THE_START: string;
      AFTER_FIRST_DATES: string;
      WHEN_SERIOUS: string;
      IN_COORDINATION_ONLY: string;
    };
    traits: { [key: string]: string };
    hobbies: { [key: string]: string };
  };
  charCount: string; // e.g., " / {{count}}+ characters"
};

export interface UnsavedChangesModalDict {
  title: string;
  description: string;
  cancelButton: string;
  continueWithoutSavingButton: string;
  saveAndContinueButton: string;
  savingButton: string;
}

export type ProfileCardDisplayDict = {
  placeholders: {
    willDiscover: string;
    notSpecified: string;
    mysterious: string;
    storyWaiting: string;
    professionWaiting: string;
  };
  colorPalette: {
    selectLabel: string;
    selected: string;
    palettes: {
      professional: string;
      feminine: string;
      masculine: string;
      luxury: string;
    };
  };
  availability: {
    AVAILABLE: string;
    UNAVAILABLE: string;
    DATING: string;
    PAUSED: string;
    ENGAGED: string;
    MARRIED: string;
  };
  booleanPrefs: {
    yes: string;
    no: string;
    shomerYes: string;
  };
  stringBooleanPrefs: {
    yes: string;
    no: string;
    flexible: string;
  };
  header: {
    profileImageAlt: string; // Placeholder: {{name}}
    storyOf: string; // Placeholder: {{name}}
    ageLabel: string; // Placeholder: {{age}}
    availabilityBadge: {
      available_short: string;
      unavailable_short: string;
      dating_short: string;
      paused_short: string;
      engaged_short: string;
      married_short: string;
      mysterious_short: string;
    };
    excitementQuote: string;
    suggestMatchButton: string;
    suggestPerfectMatchButton: string;
  };
  keyFacts: {
    occupation: string;
    outlook: string;
    location: string;
  };
  gallery: {
    title: string; // Placeholder: {{name}}
    subtitle: string;
    showImageAlt: string; // Placeholder: {{index}}
    imageAlt: string; // Placeholder: {{index}}
    mainBadge: string;
  };
  imageDialog: {
    closeLabel: string;
    title: string; // Placeholders: {{current}}, {{total}}
    prevLabel: string;
    nextLabel: string;
    thumbAlt: string;
  };
  mobileNav: {
    closePreview: string;
    introView: string;
    detailedView: string;
    previous: string;
    next: string;
  };
  tabs: {
    essence: { label: string; shortLabel: string };
    journey: { label: string; shortLabel: string };
    spirit: { label: string; shortLabel: string };
    vision: { label: string; shortLabel: string };
    connection: { label: string; shortLabel: string };
    professional: { label: string; shortLabel: string };
  };
  content: {
    emptyStateTitle: string;
    emptyStateDescription: string;
    openingSentence: string;
    aboutMe: string;
    aboutMeSubtitle: string; // Placeholder: {{name}}
    whatMakesMeSpecial: string;
    myTraits: string;
    whatFillsMySoul: string;
    myHobbies: string;
    deepDivePersonality: string;
    moreAnswersPersonality: string;
    educationAndCareer: string;
    academicAndProfessionalPath: string;
    familyAndCulturalBackground: string;
    familyThatShapedMe: string;
    valuesAndPrinciples: string;
    answersOnWhatMatters: string;
    myConnectionToJudaism: string;
    faithAndTraditionInMyLife: string;
    inspiringSpiritualFigure: string;
    myReligiousAndSpiritualWorld: string;
    answersOnFaith: string;
    myDreamRelationship: string;
    myRoleModelForRelationship: string;
    theCoupleThatInspiresMe: string;
    moreOnMyVision: string;
    answersOnLoveAndFamily: string;
    matchingPreferences: string;
    whatHelpsFindConnection: string;
    maritalStatuses: string;
    religiousLevels: string;
    partnerReligiousJourney: string;
    educationLevels: string;
    howIVisionMyPartner: string;
    moreAnswersAboutPartner: string;
    confidentialInfo: string;
    professionalDetails: string;
    emptyPrefsTitle: string;
    emptyPrefsDescription: string;
    focus: {
      aboutMe: string;
      myStory: string;
      quickSummary: string;
      importantDetails: string;
      whatMakesMeUnique: string;
      traitsAndHobbies: string;
      myTraits: string;
      whatILove: string;
      wantToKnowMore: string;
      moreToDiscover: string;
      letsGetToKnow: string;
    };
    questionnaire: {
      questionFromCategory: string; // Placeholder: {{worldName}}
      confidential: string;
      confidentialTooltip: string;
    };
    professionalInfo: {
      contactPreference: string;
      matchmakerGenderPref: string;
      noPreference: string;
      matchmakerMale: string;
      matchmakerFemale: string;
      medicalInfo: string;
      medicalInfoVisible: string;
      medicalInfoDiscreet: string;
      profileCreated: string;
      lastActive: string;
      unknown: string;
    };
        detailLabels: {
      worldview: string;
      religiousJourney: string;
      shomerNegiah: string;
      headCovering: string;
      kippahType: string;
      educationLevel: string;
      educationDetails: string;
      professionalField: string;
      militaryService: string;
      serviceDetails: string;
      parentStatus: string;
      fatherOccupation: string;
      motherOccupation: string;
      siblings: string;
      birthOrder: string;
      countryOfOrigin: string;
      aliyaYear: string;
    };

    worlds: {
      values: { label: string; description: string };
      personality: { label: string; description: string };
      relationship: { label: string; description: string };
      partner: { label: string; description: string };
      religion: { label: string; description: string };
      general: { label: string; description: string };
    };
  };
};

export type ProfileCardDict = {
  loading: string;
    budgetDisplay: BudgetDisplayDict; // הוסף שורה זו
  display: ProfileCardDisplayDict; // <-- הוסף שורה זו

  header: {
    title: string;
    subtitleEdit: string;
    subtitleView: string;
  };
  buttons: {
    edit: string;
    cancel: string;
    save: string;
    saveChanges: string;
  };
  cards: {
    personal: {
      title: string;
      genderLabel: string;
      genderPlaceholder: string;
      birthDateLabel: string;
      heightLabel: string;
      heightPlaceholder: string;
      cityLabel: string;
      cityPlaceholder: string;
      originLabel: string;
      originPlaceholder: string;
      aliyaCountryLabel: string;
      aliyaCountryPlaceholder: string;
      aliyaYearLabel: string;
      aliyaYearPlaceholder: string;
      nativeLanguageLabel: string;
      nativeLanguagePlaceholder: string;
      additionalLanguagesLabel: string;
      additionalLanguagesPlaceholder: string;
      noAdditionalLanguages: string;
      removeLanguageLabel: string; // Placeholder: {{lang}}
    };
    family: {
      title: string;
      maritalStatusLabel: string;
      maritalStatusPlaceholder: string;
      hasChildrenLabel: string;
      hasChildrenYes: string;
      parentStatusLabel: string;
      parentStatusPlaceholder: string;
      fatherOccupationLabel: string;
      fatherOccupationPlaceholder: string;
      motherOccupationLabel: string;
      motherOccupationPlaceholder: string;
      siblingsLabel: string;
      siblingsPlaceholder: string;
      positionLabel: string;
      positionPlaceholder: string;
    };
    religion: {
      title: string;
      religiousLevelLabel: string;
      religiousLevelPlaceholder: string;
      religiousJourneyLabel: string;
      religiousJourneyPlaceholder: string;
      shomerNegiahLabel: string;
      shomerNegiahYes: string;
      headCoveringLabel: string;
      headCoveringPlaceholder: string;
      headCoveringDefault: string;
      kippahTypeLabel: string;
      kippahTypePlaceholder: string;
      kippahTypeDefault: string;
      matchmakerGenderLabel: string;
      matchmakerGenderPlaceholder: string;
      matchmakerGenderDefault: string;
      influentialRabbiLabel: string;
      influentialRabbiPlaceholder: string;
      influentialRabbiEmpty: string;
    };
    about: {
      title: string;
      headlineLabel: string;
      headlinePlaceholder: string;
      headlineEmpty: {
        title: string;
        subtitle: string;
        example: string;
      };
      aboutLabel: string;
      aboutPlaceholder: string;
      aboutEmpty: string;
      inspiringCoupleLabel: string;
      inspiringCouplePlaceholder: string;
      inspiringCoupleEmpty: string;
      privateNotesLabel: string;
      privateNotesPlaceholder: string;
      privateNotesEmpty: string;
    };
    medical: {
      title: string;
      tooltip: string;
      description: string;
      hasInfoLabel: string;
      detailsLabel: string;
      detailsPlaceholder: string;
      timingLabel: string;
      timingPlaceholder: string;
      visibilityLabel: string;
      visibilityToggle: {
        visible: string;
        hidden: string;
      };
      visibilityDescription: {
        visible: string;
        hidden: string;
      };
      display: {
        sharedInfo: string;
        yes: string;
        no: string;
        details: string;
        noDetails: string;
        timing: string;
        visibility: string;
        visibleBadge: string;
        hiddenBadge: string;
      };
    };
    education: {
      title: string;
      levelLabel: string;
      levelPlaceholder: string;
      detailsLabel: string;
      detailsPlaceholder: string;
      occupationLabel: string;
      occupationPlaceholder: string;
      serviceTypeLabel: string;
      serviceTypePlaceholder: string;
      serviceDetailsLabel: string;
      serviceDetailsPlaceholder: string;
    };
    character: {
      title: string;
      traitsLabel: string;
      traitsEmpty: string;
      hobbiesLabel: string;
      hobbiesEmpty: string;
    };
  };
  placeholders: {
    notSpecified: string;
    notRelevant: string;
    noYear: string;
  };
  tooltips: {
    headline: string;
    about: string; // Placeholder: {{count}}
    inspiringCouple: string;
    influentialRabbi: string;
    privateNotes: string;
  };
  toasts: {
    validationErrorTitle: string;
    aboutMinLength: string; // Placeholder: {{count}}
  };
  options: {
    gender: {
      MALE: string;
      FEMALE: string;
    };
    maritalStatus: { [key: string]: string };
    religiousLevel: { [key: string]: string };
    religiousJourney: { [key: string]: string };
    educationLevel: { [key: string]: string };
    serviceType: { [key in ServiceType]: string };
    headCovering: { [key in HeadCoveringType]: string };
    kippahType: { [key in KippahType]: string };
    matchmakerGender: {
      MALE: string;
      FEMALE: string;
      NONE: string;
    };
    medicalTiming: {
      FROM_THE_START: string;
      AFTER_FIRST_DATES: string;
      WHEN_SERIOUS: string;
      IN_COORDINATION_ONLY: string;
    };
    traits: { [key: string]: string };
    hobbies: { [key: string]: string };
  };
  charCount: string; // e.g., " / {{count}}+ characters"
};

// START: Additions for MatchResultCard.tsx
export type MatchResultCardDict = {
  premiumBadge: string;
  matchPercentageBadge: string; // Placeholder: {{percentage}}
  tooltips: {
    addToBookmarks: string;
    removeFromBookmarks: string;
    traitDescription: string; // Placeholder: {{description}}
  };
  buttons: {
    reject: string;
    confirmReject: string;
    cancel: string;
    accept: string;
    continueChat: string;
    showMore: string;
    hideMore: string;
    viewFullProfile: string;
  };
  sections: {
    about: string; // Placeholder: {{name}}
    topMatches: string;
    commonInterests: string;
    lastActive: string; // Placeholder: {{time}}
  };
  lastActiveFormat: {
    unknown: string;
    today: string;
    yesterday: string;
    daysAgo: string; // Placeholder: {{count}}
    weeksAgo: string; // Placeholder: {{count}}
    monthsAgo: string; // Placeholder: {{count}}
  };
};
// END: Additions for MatchResultCard.tsx

// START: Additions for Profile Elements & Utils

export type MinimalCardDict = {
  nameNotAvailable: string;
  yearsOld: string; // Placeholder: {{age}}
  profileImageAlt: string;
  available: string;
  inProcess: string;
};

export type StatsCardDict = {
  availabilityStatusTitle: string;
  availabilityValue: {
    available: string; // e.g., "פנוי/ה"
    unavailable: string; // e.g., "לא פנוי/ה"
  };
};

export type VisibilityControlDict = {
  tooltip: {
    visible: string;
    hidden: string;
    actionPrefix: string;
    actionHide: string;
    actionShow: string;
  };
  srAction: {
    hide: string;
    show: string;
  };
  ariaLabel: string; // Placeholder: {{status}} -> "visible" or "hidden"
};

export type BudgetDisplayDict = {
  errorInvalidData: string;
  noValuesAllocated: string;
};

export type ProfileUtilsDict = {
  validationErrors: {
    heightRange: string;
  };
};

// END: Additions for Profile Elements & Utils
export type QuestionnaireSectionDictionary = {
  // הגדרה דינמית של כותרות ה"עולמות" על בסיס הקבועים
  worlds: Record<typeof WORLD_KEYS[keyof typeof WORLD_KEYS], { title: string }>;

  // טקסטים למצב שבו השאלון כלל לא מולא
  emptyState: {
    title: string;
    subtitle: string;
    button: string;
  };

  // טקסטים למצב שבו השאלון התחיל אך אין עדיין תשובות
  noAnswersState: {
    title: string;
    subtitle: string;
    button: string;
  };

  // טקסטים לכותרת הראשית של אזור השאלון
  header: {
    title: {
      completed: string;
      inProgress: string;
    };
    lastUpdated: string;
    notStarted: string;
    goToButton: string;
    editButton: {
      start: string;
      finish: string;
    };
  };

  // טקסטים עבור רכיב WorldSection
  worldSection: {
    answerSingular: string;
    answerPlural: string;
    status: {
      completed: string;
      inProgress: string;
    };
  };

  // טקסטים עבור רכיב QuestionCard
  questionCard: {
    toasts: {
      emptyAnswer: string;
      updateSuccess: string;
      updateError: string;
      visibilitySuccess: string;
      visibilityError: string;
    };
       visibilityButton: {
      visible: string;
      hidden: string;
    };

    visibilityTooltip: {
      editing: {
        visible: string;
        hidden: string;
      };
      viewing: {
        visible: string;
        hidden: string;
      };
    };
    editTextareaPlaceholder: string;
    editButtons: {
      cancel: string;
      save: string;
    };
    dateTooltip: string;
    editTooltip: {
      text: string;
      budget: string;
    };
  };
};

type SuggestionDemoDict = {
  hoverTitle: string;
  hoverSubtitle: string;
};
export type AvailabilityStatusDict = {
  dialogTitle: string;
  dialogDescription: string;
  statusLabel: string;
  selectPlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  updateError: string;
  cancelButton: string;
  updateButton: string;
  updatingButton: string;
  successDialogTitle: string;
  successDialogDescription: string;
  successDialogAction: string;
  status: {
    AVAILABLE: string;
    UNAVAILABLE: string;
    DATING: string;
    PAUSED: string;
    ENGAGED: string;
    MARRIED: string;
    UNKNOWN: string;
  };
};

// Type for AccountSettings component
export type AccountSettingsDict = {
  loadingText: string;
  cardHeader: {
    title: string;
    description: string;
  };
  sections: {
    personal: {
      title: string;
      description: string;
      fullNameLabel: string;
      fullNameNotSet: string;
      emailLabel: string;
      sendVerificationButton: string;
    };
    status: {
      title: string;
      permissionsLabel: string;
      roles: {
        ADMIN: string;
        MATCHMAKER: string;
        USER: string;
      };
      statuses: {
        ACTIVE: string;
        PENDING_EMAIL_VERIFICATION: string;
        PENDING_PHONE_VERIFICATION: string;
        INACTIVE: string;
        BLOCKED: string;
      };
      verification: {
        verified: string;
        notVerified: string;
      };
      timeInfoLabel: string;
      createdAt: string;
      lastLogin: string;
    };
    marketing: {
      title: string;
      label: string;
      description: string;
    };
    security: {
      title: string;
      description: string;
      changePasswordButton: string;
      accountVerificationLabel: string;
      passwordManagementLabel: string;
      managedByProvider: string; // Placeholder: {{provider}}
      managedExternally: string;
    };
    delete: {
      title: string;
      description: string;
      deleteButton: string;
    };
  };
  cardFooter: {
    notice: string;
  };
  toasts: {
    fillAllFieldsError: string;
    fillAllFieldsDesc: string;
    passwordsMismatchError: string;
    passwordsMismatchDesc: string;
    passwordValidationError: string;
    passwordValidationDesc: string;
    verificationSentSuccess: string;
    verificationSentDesc: string;
    sendVerificationError: string;
    sendVerificationDesc: string;
    initiatePasswordError: string;
    initiatePasswordDesc: string;
    verificationCodeRequired: string;
    verificationCodeDesc: string;
    invalidVerificationCode: string;
    invalidVerificationCodeDesc: string;
    passwordUpdateSuccess: string;
    passwordUpdateSuccessDesc: string;
    passwordUpdateError: string;
    passwordUpdateDesc: string;
    invalidDeleteConfirmation: string;
    invalidDeleteConfirmationDesc: string; // Placeholder: {{phrase}}
    deleteSuccess: string;
    deleteSuccessDesc: string;
    deleteError: string;
    deleteErrorDesc: string;
    marketingUpdateSuccess: string;
    marketingUpdateError: string;
  };
  passwordDialog: {
    title: string;
step1Description: string;
    step2Description: string; // Placeholder: {{email}}
    step1Label: string;
    step2Label: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
        strengthLabel: string; // This was missing
    showPassword: string;  // This was missing
    hidePassword: string;  // This was missing

    passwordStrengthLabel: string;
    requirements: {
      length: string; // Placeholder: {{count}}
      uppercase: string;
      lowercase: string;
      number: string;
    };
    passwordsMismatchWarning: string;
    noticeTitle: string;
    noticeDescription: string;
    verificationCodeLabel: string;
    verificationCodePlaceholder: string;
    tokenLifetime: string;
    noCodeAlertTitle: string;
    noCodeAlertDescription: string;
    cancelButton: string;
    continueButton: string;
    confirmButton: string;
        loadingButton: string; // הוספה
    backButton: string; // הוספה

    loading: {
      sending: string;
      verifying: string;
    };
  };
  passwordStrength: {
    veryWeak: string;
    weak: string;
    medium: string;
    strong: string;
  };
  deleteDialog: {
    title: string;
    description: string;
    confirmationLabel: string;
    confirmationPhrase: string;
    mismatchWarning: string;
    cancelButton: string;
    deleteButton: string;
    deletingButton: string;
  };
};
type QuestionContent = {
  question: string;
  placeholder?: string;
  helpText?: string;
  labels?: { min: string; max: string; middle?: string };
  options?: Record<string, string | { text: string; description: string }>;
  categories?: Record<string, string | { label: string; description?: string }>;
};
type WorldQuestionsContent = Record<string, QuestionContent>;

export type QuestionsDictionary = Record<WorldId, WorldQuestionsContent>;


type ContactFormErrorMessages = {
    nameMin: string;
    emailInvalid: string;
    categoryRequired: string;
    messageMin: string;
    sendError: string;
    unexpectedError: string;
};

type ContactCategory = {
    value: string;
    label: string;
};

type FaqItem = {
    question: string;
    answer: string;
};

type TeamMember = {
    name: string;
    role: string;
    description: string;
};

export type ContactPageDict = {
    backToHome: string;
    hero: {
        header: string;
        title: string;
        highlightedTitle: string;
        subtitle: string;
        guarantee: string;
    };
    form: {
        title: string;
        description: string;
        nameLabel: string;
        namePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        categoryLabel: string;
        messageLabel: string;
        messagePlaceholder: string;
        submitButton: string;
        submitButtonLoading: string;
        privacyCommitment: string;
        errors: ContactFormErrorMessages;
        categories: ContactCategory[];
    };
    successMessage: {
        title: string;
        description: string;
        signUpButton: string;
        questionnaireButton: string;
    };
    sidebar: {
        team: {
            title: string;
            members: TeamMember[];
        };
        faq: {
            title: string;
            items: FaqItem[];
        };
        otherWays: {
            title: string;
            phone: string;
            email: string;
            hours: string;
            commitment: {
                title: string;
                body: string;
            };
        };
        cta: {
            title: string;
            description: string;
            signUpButton: string;
            questionnaireButton: string;
        };
    };
    footer: {
        tagline: string;
        copyright: string;
    };
};

export type FeedbackWidgetDict  = {
  openAriaLabel: string;
  title: string;
  subtitle: string;
  tabLabel: string; // הוספנו תרגום חדש ללשונית
  types: {
    suggestion: string;
    bug: string;
    positive: string;
  };
  placeholder: string;
  attachScreenshot: string;
  cancelButton: string;
  submitButton: string;
  toasts: {
    imageTooLarge: string;
    contentRequired: string;
    submitSuccess: string;
    submitError: string;
  };
}


