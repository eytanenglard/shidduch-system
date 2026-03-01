// src/types/dictionary.d.ts
import type { MatchmakerPageDictionary } from './dictionaries/matchmaker';
import { WORLD_KEYS } from '@/components/profile/constants';
import type { AuthDictionary } from './dictionaries/auth';
import type { WorldId } from '@/components/questionnaire/types/types';
import type { EmailDictionary } from './dictionaries/email';
import { MatchSuggestionStatus } from '@prisma/client';
import type { AdminDictionary } from './dictionaries/admin';

// --- Navbar ---
export type NavbarDict = {
  myMatches: string;
  matchmakingQuestionnaire: string;
  messages: string;
  login: string;
  referralsAdmin: string;
  engagementDashboard: string;
  register: string;
  toQuestionnaire: string;
  matchmakerSuggestions: string;
  matchmakerClients: string;
  potentialMatches: string;
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
  description: string;
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
  toQuestionnaireButton: string;
  signInLink: string;
  mobileTitle?: string;
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
// ✨ START: TYPES FOR SUGGESTIONS FEATURE ✨
// ======================================================================== //

export type SuggestionsCardDict = {
      activeProcessExplanation: string;

  toasts: {
    approveDisabledTitle: string;
    approveDisabledDescription: string;
    interestedTitle: string;
    interestedDescription: string;
  };
  suggestedBy: string;
  yourTurn: string;
  urgent: string;
  viewDetailsAria: string;
  whySpecial: string;
  reasonTeaserDefault: string;
  clickForDetails: string;
  buttons: {
    decline: string;
    approve: string;
    approveDisabledTooltip: string;
    interested: string;
    activateNow: string;
    removeFromList: string;
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
  statusLabels: {
    interested: string;
    pending: string;
  };
  statusDescriptions: {
    [key: string]: string;
  };
  partyIndicators: {
    interestedSaved: string;
  };
};

export type SuggestionsModalDict = {
  header: {
    title: string;
    subtitleLine1: string;
    subtitleLine2: string;
    suggestedBy: string;
    discoverMore: string;
    ageInYears: string;
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
    showingSingle: string;
    showingMultiple: string;
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
    errorLoading: string;
    unknownError: string;
  };
  dialogs: {
    approveTitle: string;
    declineTitle: string;
    interestedTitle: string;
    interestedDescription: string;
    confirmInterested: string;
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
    statusUpdateError: string;
    approvedSuccess: string;
    approvedFirstPartyDesc: string;
    approvedSecondPartyDesc: string;
    declinedSuccess: string;
    declinedDesc: string;
    matchmakerNotified: string;
    refreshSuccessTitle: string;
    refreshSuccessDescription: string;
    interestedSuccess: string;
    interestedSuccessDesc: string;
    activateSuccess: string;
    activateSuccessDesc: string;
    removeFromListSuccess: string;
  };
  dailySuggestion: {
    badge: string;
    badgeTooltip: string;
    systemMatchmaker: string;
    systemMatchmakerShort: string;
    matchingNote: string;
    basedOnLearning: string;
    aiPowered: string;
    cardTitle: string;
    cardSubtitle: string;
    noSuggestionToday: string;
    score: string;
    reminderTitle: string;
    reminderSubject: string;
    reminderBody: string;
    reminderCta: string;
    emailSubject: string;
    emailNote: string;
    emptyTitle: string;
    emptyDescription: string;
    howItWorks: string;
    howItWorksText: string;
  };
};

export type ChatTabDict = {
  title: string;
  header: string;
  noMessages: string;
  noMessagesDescription: string;
  placeholder: string;
  sendError: string;
  senderLabels: {
    matchmaker: string;
    system: string;
  };
  partyLabels: {
    partyA: string;
    partyB: string;
  };
};

export type MatchmakerMessagesPageDict = {
  header: {
    title: string;
    subtitle: string;
  };
  tabs: {
    chat: string;
    availability: string;
  };
  chatPanel: {
    activeSuggestions: string;
    noActiveSuggestions: string;
    selectSuggestion: string;
    selectSuggestionDescription: string;
    back: string;
    noMessages: string;
    noMessagesDescription: string;
    placeholder: string;
    sendError: string;
    messages: string;
    senderLabels: {
      matchmaker: string;
      system: string;
    };
    partyLabels: {
      partyA: string;
      partyB: string;
    };
    statusLabels: {
      PENDING_FIRST_PARTY: string;
      PENDING_SECOND_PARTY: string;
      FIRST_PARTY_APPROVED: string;
      SECOND_PARTY_APPROVED: string;
      CONTACT_DETAILS_SHARED: string;
      DATING: string;
      AWAITING_FIRST_DATE_FEEDBACK: string;
    };
  };
};

export type SuggestionsPresentationDict = {
  hero: {
    title: string;
    matchmakerThoughts: string;
  };
  peek: {
    opportunity: string;
    age: string;
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
  rationale: {
    title: string;
    description: string;
    personalNoteTitle: string;
    generalReasonTitle: string;
    noReasonText: string;
  };
};

export type SuggestionsQuickViewDict = {
  unitCm: string;
  aboutTitle: string;
  reasonTitle: string;
  deadlineText: string;
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
    progressText: string;
    overallScoreLabel: string;
  };
  categoryTitles: {
    basic: string;
    lifestyle: string;
    values: string;
    preferences: string;
  };
  categorySubtitle: string;
  compatibilityLabel: string;
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
    mutualMatch: string;
    mismatch: string;
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

export type AskMatchmakerDict = {
  title: string;
  titleDefault: string;
  description: string;
  statusBadge: string;
  errorSubmitting: string;
  topicSelect: {
    title: string;
    subtitle: string;
  };
  sampleQuestions: {
    title: string;
  };
  input: {
    label: string;
    placeholder: string;
    charCount: string;
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
    charCount: string;
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
  | 'DRAFT'
  | 'PENDING_FIRST_PARTY'
  | 'FIRST_PARTY_APPROVED'
  | 'FIRST_PARTY_DECLINED'
  | 'PENDING_SECOND_PARTY'
  | 'SECOND_PARTY_APPROVED'
  | 'SECOND_PARTY_DECLINED'
  | 'AWAITING_MATCHMAKER_APPROVAL'
  | 'CONTACT_DETAILS_SHARED'
  | 'AWAITING_FIRST_DATE_FEEDBACK'
  | 'THINKING_AFTER_DATE'
  | 'PROCEEDING_TO_SECOND_DATE'
  | 'ENDED_AFTER_FIRST_DATE'
  | 'MEETING_PENDING'
  | 'MEETING_SCHEDULED'
  | 'MATCH_APPROVED'
  | 'MATCH_DECLINED'
  | 'DATING'
  | 'ENGAGED'
  | 'MARRIED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'CANCELLED';

// This is the main type for the modular suggestions dictionary
export type SuggestionsDictionary = {
  container: SuggestionsContainerDict;
  card: SuggestionsCardDict;
  modal: SuggestionsModalDict;
  aiAnalysis: AiAnalysisDict;
  list: SuggestionsListDict;
  presentation: SuggestionsPresentationDict;
  quickView: SuggestionsQuickViewDict;
  compatibility: SuggestionsCompatibilityDict;
  askMatchmaker: AskMatchmakerDict;
  inquiryThread: InquiryThreadDict;
  timeline: SuggestionTimelineDict;
};

// ======================================================================== //
// ✨ END: TYPES FOR SUGGESTIONS FEATURE ✨
// ======================================================================== //

// ======================================================================== //
// ✨ START: TYPES FOR QUESTIONNAIRE FEATURE ✨
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
  estimatedTime: string;
  benefitMessages: string[];
  encouragementMessage: string;
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
  stats: {
    completion: string;
    answered: string;
    time: string;
  };
  unlocksTitle: string;
  achievements: {
    completed: {
      title: string;
      description: string;
    };
    speed: {
      title: string;
      description: string;
    };
    profile: {
      title: string;
      description: string;
    };
  };
};

export type MatchmakingQuestionnaireDict = {
  worldLabels: Record<WorldId, string>;
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
    worldFinished: string;
    allWorldsFinished: string;
    submitSuccess: string;
    nextWorldAction: string;
  };
  errors: {
    invalidSubmission: string;
    saveFailed: string;
    loadFailed: string;
    genericLoadError: string;
    stageLoadError: string;
    invalidStep: string;
    submitFailed: string;
  };
  idleModal: {
    title: string;
    description: string;
    logoutButton: string;
    stayActiveButton: string;
  };
  lastSaved: string;
  loading: string;
  loadingSubtext: string;
  lastSavedIndicatorLabel: string;
};

export type QuestionnairePageDict = {
  loading: string;
  backToMain: string;
  stageLoadError: string;
  completionError: string;
};

export type QuestionsListDict = {
  depthLabels: {
    BASIC: string;
    ADVANCED: string;
    EXPERT: string;
  };
  stats: {
    answeredQuestions: string;
    complete: string;
    remaining: string;
    done: string;
  };
  badges: {
    required: string;
    answered: string;
  };
  motivationalMessages: {
    start: { title: string; subtitle: string };
    quarter: { title: string; subtitle: string };
    half: { title: string; subtitle: string };
    threeQuarters: { title: string; subtitle: string };
    finish: { title: string; subtitle: string };
  };
};

export type QuestionnaireCompletePageDict = {
  loading: string;
  title: string;
  successMessage1: string;
  successMessage2: string;
  profilePrompt: string;
  continueButton: string;
};

export type QuestionnaireRestoreDict = {
  loading: string;
  restoringTitle: string;
  restoringSubtitle: string;
  error: string;
  backButton: string;
};

export type UserStatsDict = {
  matchStatsCard: {
    title: string;
    activeMatches: string;
    pendingMatches: string;
    matchScore: string;
    daysActive: string;
    joinDate: string;
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
    traitScore: string;
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
      completionDetails: string;
    };
    accordion: {
      recommendations: string;
      timeBreakdown: string;
    };
  };
  statusBadge: {
    complete: string;
    started: string;
    progress: string;
  };
  timeStrings: {
    lessThanAMinute: string;
    minutesSuffix: string;
    hours: string;
    and: string;
    savedNow: string;
    savedMinutesAgo: string;
    savedHoursAgo: string;
    savedAtTime: string;
  };
  rewards: {
    title: string;
    achievedText: string;
    moreToGo: string;
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
    title: string;
    subtitle: string;
    statusCompleted: string;
    timePerWorld: string;
  };
};

type WorldInfoDict = {
  title: string;
  description: string;
};

export type QuestionnaireLandingPageDict = {
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle1: string;
    subtitle2: string;
    subtitleHighlight: string;
    subtitle3: string;
    timeEstimate: string;
  };
  cta: {
    continue: string;
    startAsUser: string;
    startDefault: string;
    login: string;
  };
  problemSection: {
    badge: string;
    title1: string;
    title2: string;
    cards: {
      generalAnswers: { title: string; description: string };
      wastedTime: { title: string; description: string };
      lackOfFocus: { title: string; description: string };
      frustration: { title: string; description: string };
    };
    insight: string;
  };
  solutionSection: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle1: string;
    subtitle2: string;
    cards: {
      selfDiscovery: { title: string; description: string };
      fullPicture: { title: string; description: string };
      focusedSearch: { title: string; description: string };
    };
    result: {
      title: string;
      description: string;
    };
  };
  worldsSection: {
    title: string;
    subtitle: string;
    worlds: {
      PERSONALITY: WorldInfoDict;
      VALUES: WorldInfoDict;
      RELATIONSHIP: WorldInfoDict;
      PARTNER: WorldInfoDict;
      RELIGION: WorldInfoDict;
    };
    worldLabel: string;
  };
  featuresSection: {
    title: string;
    cards: {
      fast: { title: string; description: string };
      private: { title: string; description: string };
      instantResult: { title: string; description: string };
    };
  };
  finalCta: {
    title1: string;
    title2: string;
    subtitle: string;
    buttonText: string;
    assurance: string;
  };
  footer: {
    copyright: string;
  };
};

export type WorldsMapWorldContent = {
  title: string;
  description: string;
  whyIsItImportant: string;
  benefits: string[];
  guidingThought: string;
};

export type WorldsMapDict = {
  worldLabels: Record<WorldId, string>;
  progressHeader: {
    greeting: string;
    greetingNoName: string;
    journeyQuestion: string;
    journeyTitle: string;
    progressText: string;
    ctaButton: string;
    mapTitle: string;
    milestones: {
      start: string;
      onTrack: string;
      inProgress: string;
      almostThere: string;
      completed: string;
    };
    nextStepTitle: string;
    nextStepPrompt: string;
    completionTitle: string;
    completionSubtitle: string;
  };
  reviewCard: {
    title: string;
    description: string;
    button: string;
  };
  worldCard: {
    discoverTitle: string;
    questionsLabel: string;
    minutesLabel: string;
    worldNumberLabel: string;
    progressLabel: string;
    recommendedRibbon: string;
    expandButton: string;
    benefitsTitle: string;
    statuses: {
      completed: string;
      recommended: string;
      active: string;
      available: string;
      locked: string;
    };
    actions: {
      edit: string;
      startRecommended: string;
      continue: string;
      start: string;
      locked: string;
    };
  };
  completionBanner: {
    title: string;
    titleNoName: string;
    subtitle: string;
    description: string;
    statWorlds: string;
    statReport: string;
  };
  worldsContent: Record<WorldId, WorldsMapWorldContent>;
};

export type QuestionnaireLayoutDict = {
  navHeader: string;
  navSubtitle: string;
  sidebarHeader: {
    title: string;
    subtitle: string;
  };
  sidebarProgress: {
    title: string;
    worldsLabel: string;
    completionMessage: string;
  };
  navButtonStatus: {
    active: string;
    completed: string;
    available: string;
  };
  saveButton: {
    default: string;
    saving: string;
    saved: string;
  };
  lastSavedSuccess: string;
  actionButtons: {
    review: string;
    exitToMap: string;
    faq: string;
  };
  faqSheet: {
    title: string;
  };
  unauthenticatedPrompt: {
    title: string;
    subtitle: string;
    loginButton: string;
    registerButton: string;
  };
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
    menuTitle: string;
  };
  tooltips: {
    faq: string;
    accessibility: string;
  };
  profileNotice: {
    title: string;
    textPart1: string;
    textPart2: string;
    link: string;
    visibilityToggleLabel: string;
  };
};

export type WorldComponentDict = {
  header: {
    questionLabel: string;
    estimatedTimeLeft: string;
    statusCard: {
      progress: string;
      required: string;
      status: string;
      questions: string;
      complete: string;
      left: string;
      keepItUp: string;
      states: {
        started: string;
        going: string;
        great: string;
        almost: string;
        perfect: string;
      };
    };
    overallProgress: string;
    lastSaved: {
      now: string;
      minuteAgo: string;
      minutesAgo: string;
      hoursAgo: string;
    };
  };
  errors: {
    loadingFailedTitle: string;
    loadingFailedDescription: string;
    invalidQuestion: string;
    noQuestionFound: string;
    validation: {
      required: string;
      minLength: string;
      maxLength: string;
      minSelections: string;
      maxSelections: string;
      budgetAllocation: string;
      budgetRequired: string;
      generalRequired: string;
    };
  };
  buttons: {
    backToMap: string;
    hideList: string;
    showList: string;
    questionList: string;
    previous: string;
    next: string;
    finish: string;
    save: string;
    saving: string;
    completing: string;
    prevShort: string;
    nextShort: string;
    finishShort: string;
  };
  listSheet: {
    title: string;
    description: string;
    legend: {
      completed: string;
      required: string;
      notAnswered: string;
    };
  };
  celebration: {
    quarter: string;
    half: string;
    threeQuarters: string;
    complete: string;
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
    maxSelectionError: string;
    selectedInfo: string;
    minLabel: string;
    maxLabel: string;
  };
  openText: {
    placeholder: string;
    minLengthRequired: string;
    minLengthMet: string;
    maxLengthExceeded: string;
    minLengthInfoRequired: string;
    minLengthInfoRecommended: string;
    estimatedTime: string;
    tipsButton: string;
    wordCount: string;
    readingTime: string;
    completionPercentage: string;
    writingGreat: string;
  };
  budgetAllocation: {
    totalAllocated: string;
    remaining: string;
    surplus: string;
    resetButton: string;
    statusComplete: string;
    statusRemaining: string;
    statusExceeded: string;
  };
  unsupportedType: string;
  supportContactMessage: string;
};

export type InteractiveScaleDict = {
  selectedValue: string;
  ariaLabel: string;
};

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
    fontScale: string;
    contrastMode: string;
    reducedMotion: string;
    readableMode: string;
    bigCursor: string;
    textReader: string;
    soundEnabled: string;
  };
  toasts: {
    settingUpdated: string;
    settingsReset: string;
    readerEnabled: string;
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

// Main dictionary for the questionnaire feature
export type QuestionnaireDictionary = {
  worldIntro: WorldIntroDict;
  questionCard: QuestionCardDict;
  worlds: Record<WorldId, { title: string; description: string }>;
  completion: QuestionnaireCompletionDict;
  matchmaking: MatchmakingQuestionnaireDict;
  page: QuestionnairePageDict;
  landingPage: QuestionnaireLandingPageDict;
  worldsMap: WorldsMapDict;
  layout: QuestionnaireLayoutDict;
  world: WorldComponentDict;
  answerInput: AnswerInputDict;
  interactiveScale: InteractiveScaleDict;
  faq: QuestionnaireFaqDict;
  accessibilityFeatures: AccessibilityFeaturesDict;
  questionnaireProgress: QuestionnaireProgressDict;
  userStats: UserStatsDict;
  questionnaireRestore: QuestionnaireRestoreDict;
  questionnaireCompletePage: QuestionnaireCompletePageDict;
  questionsList: QuestionsListDict;
  matchResultCard: MatchResultCardDict;
  questions: QuestionsDictionary;
};

// ======================================================================== //
// ✨ END: TYPES FOR QUESTIONNAIRE FEATURE ✨
// ======================================================================== //

// ======================================================================== //
// ✨ START: TYPES FOR PROFILE PAGE ✨
// ======================================================================== //

export type ProfileChecklistDict = {
  welcome: string;
  welcome_female?: string;
  allComplete: string;
  allComplete_female?: string;
  welcomeSubtitle: string;
  allCompleteSubtitle: string;
  checklistPurpose: string;
  completionLabel: string;
  expandLabel: string;
  minimizeLabel: string;
  missingItemsTitle: string;
  tasks: {
    photos: {
      title: string;
      description: string;
      missing: string;
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
  missingItems: { [key: string]: string };
  privacyNote?: string;
};

export type PhotosSectionDict = {
  title: string;
  subtitle: string;
  uploadingMultiple: string;
  selectForDeletion: string;
  uploadButton: string;
  selectionHeader: string;
  deselectAll: string;
  selectAll: string;
  deleteSelected: string;
  setAsMainTooltip: string;
  deleteTooltip: string;
  mainBadge: string;
  uploadPlaceholder: {
    title: string;
    remaining: string;
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
    altText: string;
    prevLabel: string;
    nextLabel: string;
    setMainButton: string;
    deleteButton: string;
    counter: string;
  };
  toasts: {
    maxImagesError: string;
    slotsError: string;
    invalidFileTypeError: string;
    fileTooLargeError: string;
    uploadSuccess: string;
    uploadError: string;
    selectOneError: string;
    bulkDeleteSuccess: string;
    bulkDeleteError: string;
    singleDeleteSuccess: string;
    singleDeleteError: string;
    setMainSuccess: string;
    setMainError: string;
  };
  confirmations: {
    bulkDelete: string;
  };
  privacyNote?: string;
};

export type AIAdvisorDialogDict = {
  triggerButton: string;
  dialogTitle: string;
  dialogDescription: string;
  closeButton: string;
  loadingTitle: string;
  loadingDescription: string;
  errorAlertTitle: string;
  errorAlertDescription: string;
  retryButton: string;
  initialState: string;
  toast: {
    errorTitle: string;
    errorDescription: string;
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

export type NeshamaInsightButtonDict = {
  buttonText: string;
  buttonSubtitle: string;
  dialogTitle: string;
  generating: string;
  downloadPdf: string;
  close: string;
  lockedTitle: string;
  lockedDescription: string;
  alreadyGeneratedToday: string;
  minimizedButtonText: string;
};

export type UnifiedProfileDashboardDict = {
  loadingData: string;
  loadError: string;
  updateSuccess: string;
  updateError: string;
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
    questionnaireUpdateSuccess: string;
    questionnaireUpdateError: string;
  };
  privacyAssurances: {
    banner: {
      text: string;
      subtext: string;
    };
    preview: string;
  };
  checklist: ProfileChecklistDict;
  aiAdvisor: AIAdvisorDialogDict;
  analysisResult: AnalysisResultDisplayDict;
  neshmaInsightButton: NeshamaInsightButtonDict;
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
    saveChanges: string;
    unsavedChanges: string;
    editHint: string;
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
      locationsRemoveLabel: string;
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
      originRemoveLabel: string;
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
    contactPreference: { direct: string; matchmaker: string; both: string };
    religiousLevels: { [key: string]: string };
    religiousJourneys: { [key: string]: string };
    shomerNegiah: { yes: string; no: string; flexible: string };
    education: { [key: string]: string };
    occupation: { [key: string]: string };
    serviceTypes: { [key: string]: string };
    headCovering: { [key: string]: string };
    kippahType: { [key: string]: string };
    maritalStatus: { [key: string]: string };
    partnerHasChildren: { yes_ok: string; no_preferred: string; does_not_matter: string };
    aliyaStatus: { oleh: string; tzabar: string; no_preference: string };
    origins: { [key: string]: string };
    traits: { [key: string]: string };
    hobbies: { [key: string]: string };
  };
};

export type FriendTestimonialsDict = {
  cardTitle: string;
  addManualButton: string;
  requestLinkButton: string;
  pendingApproval: string;
  approvedAndVisible: string;
  hidden: string;
  approveButton: string;
  hideButton: string;
  showButton: string;
  deleteButton: string;
  deleteConfirm: string;
  addModal: {
    title: string;
    authorNameLabel: string;
    authorNamePlaceholder: string;
    relationshipLabel: string;
    relationshipPlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    consentLabel: string;
    saveButton: string;
    cancelButton: string;
  };
  linkModal: {
    title: string;
    description: string;
    copyButton: string;
    copiedTooltip: string;
    closeButton: string;
  };
  visibilityTooltip: string;
  emptyState: string;
};

export type ProfileSectionDict = {
  aboutMe: {
    cardTitle: string;
    placeholder: string;
    tooltip: string;
    visibilityTooltip: string;
  };
  neshamaTechSummary: {
    cardTitle: string;
    emptyState: string;
    visibilityTooltip: string;
  };
  friendTestimonials: FriendTestimonialsDict;
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
    unsavedChanges: string;
    editHint: string;
  };
  cards: {
    personal: {
      title: string;
      genderLabel: string;
      genderPlaceholder: string;
      birthDateLabel: string;
      heightLabel: string;
      heightUnit: string;
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
      removeLanguageLabel: string;
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
      shomerNegiahNo: string;
      shomerNegiahPlaceholder: string;
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
      privacyNote?: string;
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
      cvSection: CvSectionDict;
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
    about: string;
    inspiringCouple: string;
    influentialRabbi: string;
    privateNotes: string;
  };
  toasts: {
    validationErrorTitle: string;
    aboutMinLength: string;
    uploadSuccess: string;
    uploadError: string;
    deleteSuccess: string;
    deleteError: string;
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
      charedi_litvak: string;
      charedi_sephardic: string;
      charedi_hasidic: string;
      chabad: string;
      breslov: string;
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
  charCount: string;
};

export type CvSectionDict = {
  title: string;
  subtitle: string;
  uploadButton: string;
  replaceButton: string;
  deleteButton: string;
  uploading: string;
  successBadge: string;
  fileTypes: string;
  toasts: {
    invalidFileType: string;
    fileTooLarge: string;
    uploadSuccess: string;
    uploadError: string;
    deleteSuccess: string;
    deleteError: string;
  };
};

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
    profileImageAlt: string;
    storyOf: string;
    ageLabel: string;
    heightLabel: string;
    languagesLabel: string;
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
    title: string;
    subtitle: string;
    showImageAlt: string;
    imageAlt: string;
    mainBadge: string;
  };
  imageDialog: {
    closeLabel: string;
    title: string;
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
    deepDive: { label: string; shortLabel: string };
    recommendations: { label: string; shortLabel: string };
    journey: { label: string; shortLabel: string };
    spirit: { label: string; shortLabel: string };
    vision: { label: string; shortLabel: string };
    connection: { label: string; shortLabel: string };
    professional: { label: string; shortLabel: string };
  };
  content: {
    systemRationaleTitle: string;
    recommendationsTitle: string;
    recommendationsSubtitle: string;
    noRecommendationsYet: string;
    emptyStateTitle: string;
    inspiringCouple: { title: string };
    influentialRabbi: { title: string };
    emptyStateDescription: string;
    openingSentence: string;
    aboutMeSubtitle: string;
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
    neshamaTechSummary: {
      title: string;
    };
    aboutMe: {
      titleCard: string;
    };
    friendTestimonials: {
      title: string;
      callButton: string;
      callDisclaimer: string;
      focusSubtitle: string;
      viewButton: string;
      emptyState: {
        title: string;
        description: string;
      };
    };
    focus: {
      aboutMe: string;
      myStory: string;
      quickSummary: string;
      importantDetails: string;
      readFullStory: string;
      whatMakesMeUnique: string;
      traitsAndHobbies: string;
      myTraits: string;
      whatILove: string;
      wantToKnowMore: string;
      moreToDiscover: string;
      letsGetToKnow: string;
    };
    questionnaire: {
      questionFromCategory: string;
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
      shomerNegiahNo: string;
      shomerNegiahPlaceholder: string;
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
  budgetDisplay: BudgetDisplayDict;
  display: ProfileCardDisplayDict;
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
      removeLanguageLabel: string;
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
      shomerNegiahNo: string;
      shomerNegiahPlaceholder: string;
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
    about: string;
    inspiringCouple: string;
    influentialRabbi: string;
    privateNotes: string;
  };
  toasts: {
    validationErrorTitle: string;
    aboutMinLength: string;
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
  charCount: string;
};

export type MatchResultCardDict = {
  premiumBadge: string;
  matchPercentageBadge: string;
  tooltips: {
    addToBookmarks: string;
    removeFromBookmarks: string;
    traitDescription: string;
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
    about: string;
    topMatches: string;
    commonInterests: string;
    lastActive: string;
  };
  lastActiveFormat: {
    unknown: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
  };
};

export type MinimalCardDict = {
  nameNotAvailable: string;
  yearsOld: string;
  profileImageAlt: string;
  available: string;
  inProcess: string;
};

export type StatsCardDict = {
  availabilityStatusTitle: string;
  availabilityValue: {
    available: string;
    unavailable: string;
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
  ariaLabel: string;
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

export type QuestionnaireSectionDictionary = {
  worlds: Record<typeof WORLD_KEYS[keyof typeof WORLD_KEYS], { title: string }>;
  emptyState: {
    title: string;
    subtitle: string;
    button: string;
  };
  noAnswersState: {
    title: string;
    subtitle: string;
    button: string;
  };
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
  worldSection: {
    answerSingular: string;
    answerPlural: string;
    status: {
      completed: string;
      inProgress: string;
    };
  };
  questionCard: {
    languageBadge: {
      en: string;
      he: string;
    };
    languageTooltip: string;
    toasts: {
      emptyAnswer: string;
      updateSuccess: string;
      updateError: string;
      visibilitySuccess: string;
      visibilityError: string;
      deleteSuccess: string;
      deleteError: string;
    };
    deleteConfirm: {
      message: string;
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
      delete: string;
    };
  };
  buttons?: {
    editingMode: string;
    editHint: string;
  };
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
    communication: {
      title: string;
      engagement: {
        label: string;
        description: string;
      };
      promotional: {
        label: string;
        description: string;
      };
    };
    security: {
      title: string;
      description: string;
      changePasswordButton: string;
      accountVerificationLabel: string;
      passwordManagementLabel: string;
      managedByProvider: string;
      managedExternally: string;
    };
    delete: {
      title: string;
      description: string;
      deleteButton: string;
    };
    language: {
      title: string;
      label: string;
      description: string;
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
    invalidDeleteConfirmationDesc: string;
    deleteSuccess: string;
    deleteSuccessDesc: string;
    deleteError: string;
    deleteErrorDesc: string;
    consentUpdateSuccess: string;
    consentUpdateError: string;
    languageUpdateSuccess: string;
    languageUpdateError: string;
  };
  passwordDialog: {
    title: string;
    step1Description: string;
    step2Description: string;
    step1Label: string;
    step2Label: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    strengthLabel: string;
    showPassword: string;
    hidePassword: string;
    passwordStrengthLabel: string;
    requirements: {
      length: string;
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
    loadingButton: string;
    backButton: string;
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

// Profile Page Dictionary
export type ProfilePageDictionary = {
  pageLoader: string;
  dashboard: UnifiedProfileDashboardDict;
  photosSection: PhotosSectionDict;
  preferencesSection: PreferencesSectionDict;
  profileSection: ProfileSectionDict;
  profileCard: ProfileCardDict;
  minimalCard: MinimalCardDict;
  statsCard: StatsCardDict;
  visibilityControl: VisibilityControlDict;
  budgetDisplay: BudgetDisplayDict;
  utils: ProfileUtilsDict;
  questionnaireSection: QuestionnaireSectionDictionary;
  availabilityStatus: AvailabilityStatusDict;
  accountSettings: AccountSettingsDict;
};

// ======================================================================== //
// ✨ END: TYPES FOR PROFILE PAGE ✨
// ======================================================================== //

// ======================================================================== //
// ✨ START: OTHER TYPES ✨
// ======================================================================== //

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
    showImage: string;
  };
  tablistLabel: string;
};

export type UnsavedChangesModalDict = {
  title: string;
  description: string;
  cancelButton: string;
  continueWithoutSavingButton: string;
  saveAndContinueButton: string;
  savingButton: string;
};

export type MetadataDict = {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    images: {
      url: string;
      width: number;
      height: number;
      alt: string;
    }[];
    locale: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
  };
};

export interface NeshmaInsightDict {
  badge: string;
  title: {
    part1: string;
    highlight: string;
    part2: string;
  };
  subtitle: string;
  chatHeader: {
    name: string;
    status: string;
  };
  progressLabels: string[];
  conversation: {
    sender: 'user' | 'friend';
    text: string;
  }[];
  placeholder: string;
  transitionText: string;
  insights: {
    title: string;
    items: {
      title: string;
      description: string;
    }[];
  };
  transitionCTA: string;
  cta: {
    button: string;
    subtitle: string;
  };
  postConversationTransition: {
    line1: string;
    line2: string;
  };
}

type SuggestionDemoDict = {
  hoverTitle: string;
  hoverSubtitle: string;
};

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

type ContactFaqItem = {
  question: string;
  answer: string;
};

type ContactTeamMember = {
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
      members: ContactTeamMember[];
    };
    faq: {
      title: string;
      items: ContactFaqItem[];
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

export type FeedbackWidgetDict = {
  openAriaLabel: string;
  closeAriaLabel: string;
  title: string;
  subtitle: string;
  tabLabel: string;
  step_type_title: string;
  types: {
    suggestion: { label: string; description: string };
    bug: { label: string; description: string };
    positive: { label: string; description: string };
  };
  placeholder: string;
  attachScreenshot: string;
  screenshotTooltip: string;
  fileInstructions: string;
  cancelButton: string;
  submitButton: string;
  submittingButton: string;
  toasts: {
    imageTooLarge: string;
    contentRequired: string;
    submitSuccess: string;
    submitError: string;
  };
};

export type MessageListItemDict = {
  matchBadge: string;
};

export type MessageListDict = {
  header: string;
  subtitle: string;
};

export type AvailabilityRequestCardDict = {
  title: string;
  fromMatchmaker: string;
  firstPartyLabel: string;
  secondPartyLabel: string;
  progressLabel: string;
  noteLabel: string;
  buttons: {
    available: string;
    unavailable: string;
  };
  responses: {
    [key: string]: string;
  };
};

export type MessagesPageDict = {
  header: {
    title: string;
    subtitle: string;
  };
  actionBanner: {
    titleSingle: string;
    titleMultiple: string;
    description: string;
  };
  filters: {
    all: string;
    actionRequired: string;
    updates: string;
    refresh: string;
  };
  error: string;
  emptyState: {
    title: string;
    descriptionAll: string;
    descriptionFiltered: string;
  };
  notificationCard: {
    matchmakerPrefix: string;
    suggestionWith: string;
    viewDetails: string;
  };
  badges: {
    match: string;
  };
  messageList: MessageListDict;
  messageListItem: MessageListItemDict;
  availabilityRequestCard: AvailabilityRequestCardDict;
};

// ======================================================================== //
// ✨ END: OTHER TYPES ✨
// ======================================================================== //

// ======================================================================== //
// ✨ MAIN DICTIONARY TYPE ✨
// ======================================================================== //

// --- The COMPLETE Dictionary Type for the entire app ---
export type Dictionary = {
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
  email: EmailDictionary;
  demoProfileCard: DemoProfileCardDict;
  unsavedChangesModal: UnsavedChangesModalDict;
  suggestions: SuggestionsDictionary;
  profilePage: ProfilePageDictionary;
  matchmakerPage: MatchmakerPageDictionary;
  auth: AuthDictionary;
  contactPage: ContactPageDict;
  feedbackWidget: FeedbackWidgetDict;
  messagesPage: MessagesPageDict;
  admin: AdminDictionary;
  neshmaInsight: NeshmaInsightDict;
};

// ======================================================================== //
// ✨ TYPE EXPORTS ✨
// ======================================================================== //

export type {
  SuggestionsDictionary,
  QuestionnaireDictionary,
  ProfilePageDictionary,
  MatchmakerPageDictionary,
  AuthDictionary,
  EmailDictionary,
  ChatTabDict,
  MatchmakerMessagesPageDict,
};

// Service Type Enums (should be imported from schema or defined here)
export type ServiceType =
  | 'MILITARY_COMBATANT'
  | 'MILITARY_SUPPORT'
  | 'MILITARY_OFFICER'
  | 'MILITARY_INTELLIGENCE_CYBER_TECH'
  | 'NATIONAL_SERVICE_ONE_YEAR'
  | 'NATIONAL_SERVICE_TWO_YEARS'
  | 'HESDER_YESHIVA'
  | 'YESHIVA_ONLY_POST_HS'
  | 'PRE_MILITARY_ACADEMY_AND_SERVICE'
  | 'EXEMPTED'
  | 'CIVILIAN_SERVICE'
  | 'YESHIVA_HESDER'
  | 'YESHIVA_FULL_TIME'
  | 'SEMINARY'
  | 'MIDRASHA'
  | 'NONE'
  | 'OTHER';

export type HeadCoveringType =
  | 'NONE'
  | 'SOMETIMES'
  | 'MITPACHAT'
  | 'WIG'
  | 'BOTH'
  | 'OTHER'
  | 'FULL_COVERAGE'
  | 'PARTIAL_COVERAGE'
  | 'HAT_BERET'
  | 'SCARF_ONLY_SOMETIMES'
  | 'UNDECIDED';

export type KippahType =
  | 'NONE'
  | 'SOMETIMES'
  | 'SRUGA'
  | 'BLACK'
  | 'LARGE'
  | 'OTHER'
  | 'BLACK_VELVET'
  | 'KNITTED_SMALL'
  | 'KNITTED_LARGE'
  | 'CLOTH'
  | 'BRESLEV'
  | 'NONE_AT_WORK_OR_CASUAL'
  | 'NONE_USUALLY';