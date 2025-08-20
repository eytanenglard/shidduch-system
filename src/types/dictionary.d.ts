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
  description: string;
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


// --- The Master Dictionary Type for HomePage ---
export type HomePageDictionary = {
  navbar: NavbarDict;
  heroSection: HeroSectionDict;
  valueProposition: ValuePropositionDict;
  ourMethod: OurMethodDict;
  howItWorks: HowItWorksDict;
    matchmakerTeam: MatchmakerTeamDict; // <-- הוסף את השורה הזו
 successStories: SuccessStoriesDict; // <-- הוסף את השורה הזו
  faq: FaqDict; // <-- הוסף את השורה הזו
  privacyAssurance: PrivacyAssuranceDict; // <-- הוסף
  cta: CtaDict;                           // <-- הוסף
  footer: FooterDict;    
    chatWidget: ChatWidgetDict; // <-- הוסף את השורה הזו
                  cookieBanner: CookieBannerDict; // <-- הוסף את השורה הזו
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

export type SuggestionsCardDict = {
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
};

export type SuggestionsDictionary = {
  container: SuggestionsContainerDict; // את זה כבר מימשנו, אז הוא נשאר חובה
  card?: SuggestionsCardDict; // עדיין לא מימשנו -> הופך לאופציונלי
  modal?: SuggestionsModalDict; // עדיין לא מימשנו -> הופך לאופציונלי
  aiAnalysis?: AiAnalysisDict; // עדיין לא מימשנו -> הופך לאופציונלי
  list?: SuggestionsListDict; // עדיין לא מימשנו -> הופך לאופציונלי
  presentation?: SuggestionsPresentationDict; // עדיין לא מימשנו -> הופך לאופציונלי
};

export type Dictionary = {
  // --- מפתחות מהמילון הראשי ---
  metadata: MetadataDict;
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

  // --- מפתחות מהמילונים המודולריים ---
  suggestions: SuggestionsDictionary;
};

export type SuggestionsContainerDict = {
  loading: {
    title: string;
    subtitle: string;
  };
  stats: {
    title: string;
    subtitle:string;
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
  };
};

