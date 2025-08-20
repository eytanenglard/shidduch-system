// src/types/dictionary.ts

// --- Navbar ---
export type NavbarDict = {
  myMatches: string;
  matchmakingQuestionnaire: string;
  messages: string;
  login: string;
  register: string;
  toQuestionnaire: string;
};

// --- Hero Section ---
type PrincipleDict = {
  title: string;
  shortTitle: string;
  description:string;
};

export type HeroSectionDict = {
  titleLine1: string;
  highlightedWord: string;
  typewriterText: string;
  ctaButton: string;
  secondaryButton: string;
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
type WorldDict = {
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
};

// --- The Master Dictionary Type for HomePage (remains for context) ---
export type HomePageDictionary = {
  navbar: NavbarDict;
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
  suggestions: SuggestionsDictionary;
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

  // New, namespaced key for the modular dictionary
  suggestions: SuggestionsDictionary;
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
