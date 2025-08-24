// src/types/dictionaries/matchmaker.d.ts

import { Gender } from "@prisma/client";

// Types for individual components

type MinimalHeaderDict = {
  title: string;
  totalLabel: string;
  verifiedLabel: string;
  profilesCompleteLabel: string;
  addButton: string;
  refreshButton: string;
  expandTooltip: string;
  collapseTooltip: string;
  advancedTitle: string;
  advancedSubtitle: string;
  addCandidateButton: string;
  bulkUpdateDialog: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
  stats: {
    total: string;
    male: string;
    female: string;
    verified: string;
    active: string;
    complete: string;
  };
};

type SearchBarDict = {
  generalPlaceholder: string;
  malePlaceholder: string;
  femalePlaceholder: string;
  clearTooltip: string;
  smartSearch: string;
  resultsCount: string; // e.g., "{{count}} results"
  filterResultsPlaceholder: string;
  noResultsTitle: string;
  noResultsDescription: string;
  recentSearches: string;
  clearHistory: string;
  matchingResults: string; // e.g., "Matching results ({{count}})"
  tip: string;
  tipContent: string;
  categories: {
    name: string;
    city: string;
    occupation: string;
    all: string;
  };
  tooltips: {
    maleTarget: string;
    femaleTarget: string;
  };
};


type ActiveFiltersDict = {
  title: string;
  filterActive: string;      // e.g., "1 filter active"
  filtersActive: string;     // e.g., "{{count}} filters active"
  suggestButton: string;
  suggestTooltip: string;
  clearAllButton: string;
  clearAllTooltip: string;
  labels: {
    search: string; // e.g., "Search: {{query}}"
    maleSearch: string; // e.g., "Male Search: {{query}}"
    femaleSearch: string; // e.g., "Female Search: {{query}}"
    separateFiltering: string;
    gender: string; // e.g., "Gender: {{gender}}"
    genders: {
      MALE: string;
      FEMALE: string;
    };
    age: string; // e.g., "Age: {{min}}-{{max}}"
    ageAbove: string; // e.g., "Age: Over {{min}}"
    ageBelow: string; // e.g., "Age: Up to {{max}}"
    height: string; // e.g., "Height: {{min}}-{{max}} cm"
    heightAbove: string;
    heightBelow: string;
    religiousLevel: string;
    educationLevel: string;
    city: string;
    occupation: string;
    availability: { // הוספנו אובייקט לתרגום סטטוסים
      AVAILABLE: string;
      DATING: string;
      UNAVAILABLE: string;
    };
    status: string; // e.g. "Status: {{status}}"
    maritalStatus: string;
    verifiedOnly: string;
    withRecommendations: string;
    fullProfile: string;
    activeToday: string;
    activeLast3Days: string;
    activeLast7Days: string;
    activeLast30Days: string;
    activeInDays: string; // e.g., "Active in last {{days}} days"
  };
  summary: {
    title: string; // e.g., "Advanced filtering active - {{count}} criteria"
    highPriority: string; // e.g., "{{count}} important"
    mediumPriority: string; // e.g., "{{count}} medium"
  };
};

type FilterPanelDict = {
  header: {
    title: string;
    subtitle: string;
    resetTooltip: string;
    saveTooltip: string;
  };
  popularFilters: {
    activeRecently: string;
    verifiedOnly: string;
    withRecommendations: string;
    availableOnly: string;
    completeProfiles: string;
  };
  savePreset: {
    title: string;
    placeholder: string;
    button: string;
  };
  separateFiltering: {
    title: string;
    description: string;
  };
  genderFilterPanel: {
    maleTitle: string;
    femaleTitle: string;
    copyToMale: string;
    copyToFemale: string;
    copyTooltip: string;
    ageLabel: string;
    heightLabel: string;
    minLabel: string;
    maxLabel: string;
    religiousLevelLabel: string;
    cityLabel: string;
    verifiedOnlyLabel: string;
    withRecommendationsLabel: string;
    fullProfileLabel: string;
    placeholders: {
      selectReligious: string;
      selectCity: string;
    };
    options: {
      all: string;
    };
  };
  tabs: {
    basic: string;
    advanced: string;
    status: string;
    saved: string;
  };
  sections: {
    gender: string;
    age: string;
    height: string;
  };
  buttons: {
    male: string;
    female: string;
    removeSelection: string;
    reset: string;
    save: string;
  };
  savedFilters: SavedFiltersDict;

};

type QuickViewDict = {
  availability: {
    AVAILABLE: string;
    DATING: string;
    UNAVAILABLE: string;
    UNKNOWN: string;
  };
  availabilityDescription: {
    AVAILABLE: string;
    DATING: string;
    UNAVAILABLE: string;
    UNKNOWN: string;
  };
  manualEntry: string;
  tooltips: {
    setAsAiTarget: string;
    clearAiTarget: string;
  };
  details: {
    years: string;
    heightUnit: string;
    maritalStatus: string;
    religiousLevel: string;
    manualDescription: string;
    moreInfo: string;
    education: string;
    occupation: string;
    location: string;
    about: string;
  };
  qualityScore: string;
  actions: {
    view: string;
    suggest: string;
    invite: string;
    contact: string;
    edit: string;
  };
  actionsDescription: {
    view: string;
    suggest: string;
    invite: string;
    contact: string;
    edit: string;
  };
  stats: {
    rating: string;
    match: string;
    response: string;
    quick: string;
  };
};

type CandidatesListDict = {
  quickViewTooltip: string;
  editProfileTooltip: string;
  emptyState: {
    title: string;
    description: string;
  };
  profileDialog: {
    title: string;
    description: string;
    editButton: string;
    viewAsLabel: string;
    candidateView: string;
    matchmakerView: string;
  };
  cardActions: {
    availableNow: string;
    viewProfile: string;
    suggestMatch: string;
    sendInvite: string;
    checkAvailability: string;
    viewProfileTooltip: string;
    suggestMatchTooltip: string;
    sendInviteTooltip: string;
    checkAvailabilityTooltip: string;
    addToFavorites: string;
    rating: string;
    matchScore: string;
    response: string;
    quickResponse: string;
  };
  minimalCard: {
    availability: {
      AVAILABLE: string;
      DATING: string;
      UNAVAILABLE: string;
      UNKNOWN: string;
    };
    aiMatch: string;
    manualEntry: string;
    noImage: string;
    yearsSuffix: string;
    lastActivePrefix: string;
    qualityScore: string;
    compare: string;
    tooltips: {
      editProfile: string;
      setAsAiTarget: string;
      clearAiTarget: string;
    };
  };
  quickView: QuickViewDict;
};

type SplitViewDict = {
  panelHeaders: {
    male: { title: string; subtitle: string; };
    female: { title: string; subtitle: string; };
    targetLabel: string;
    findMatchesButton: string;
    searchingButton: string;
  };
  mobile: {
    tabs: { male: string; female: string; };
    splitLabels: { male: string; female: string; };
  };
};

type AiMatchAnalysisDialogDict = {
  header: {
    title: string;
    description: string;
    languageSelectPlaceholder: string;
    languages: {
      he: string;
      en: string;
    };
  };
  sidebar: {
    title: string; // e.g., "Candidates to Compare ({{count}})"
  };
  main: {
    selectCandidate: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      description: string;
    };
  };
  miniProfile: {
    matchBadge: string; // e.g., "{{score}}% Match"
    targetBadge: string;
    years: string;
    notSpecified: string;
  };
  tabs: {
    summary: string;
    challenges: string;
    comparison: string;
    conversation: string;
  };
  analysis: {
    summaryTitle: string;
    strengthsTitle: string;
    challengesTitle: string;
    conversationStartersTitle: string;
  };
  comparisonTable: {
    criterion: string;
    fields: {
      age: string;
      ageApprox: string; // e.g., "(approx.)"
      city: string;
      maritalStatus: string;
      religiousLevel: string;
      occupation: string;
      education: string;
    };
  };
};


// Main dictionary type for the Matchmaker Page
export type MatchmakerPageDictionary = {
    suggestionDetailsDialog: SuggestionDetailsDialogDict; 
  candidatesManager: {
    header: MinimalHeaderDict;
    controls: {
      sort: string;
      sortBy: string;
      filters: string;
      hideFilters: string;
      mobile: {
        split: string;
        singleCol: string;
        doubleCol: string;
      };
    };
    sortOptions: { [key: string]: string };
    viewOptions: { [key: string]: string };
    searchBar: SearchBarDict;
    activeFilters: ActiveFiltersDict;
    filterPanel: FilterPanelDict;
    list: CandidatesListDict;
    splitView: SplitViewDict;
    newSuggestionForm: NewSuggestionFormDict;
    // --- התיקון כאן ---
    // העברנו את aiAnalysis להיות חלק מ-candidatesManager
    aiAnalysis: AiMatchAnalysisDialogDict;
        stats: CandidatesStatsDict;
            editProfile: MatchmakerEditProfileDict;
    actionDialogs: ActionDialogsDict;

    addManualCandidateDialog: AddManualCandidateDialogDict;
  };
    statusBadges: StatusBadgeDict;
      pagination: PaginationDict;
  loadingStates: LoadingStatesDict;
suggestionsDashboard: MatchmakerSuggestionsDashboardDict; 
newSuggestionForm: NewSuggestionFormIndexDict;

};

type CandidatesStatsDict = {
  hero: {
    title: string;
    subtitle: string;
  };
  mainStats: {
    total: {
      title: string;
      description: string;
    };
    ratio: {
      title: string;
      description: string;
    };
    activity: {
      title: string;
    };
    completion: {
      title: string;
      description: string; // e.g., "{{completed}} out of {{total}}"
    };
    trend: {
      increase: string;
      decrease: string;
      period: string;
    };
  };
  tabs: {
    demographics: string;
    activity: string;
    completion: string;
  };
  charts: {
    ageDistribution: {
      title: string;
      description: string;
    };
    religiousDistribution: {
      title: string;
      description: string;
    };
    topCities: {
      title: string;
      description: string;
    };
    userActivity: {
      title: string;
      description: string;
      weeklyActive: string;
      monthlyActive: string;
      avgLogin: string;
      days: string;
    };
    activityTrend: {
      title: string;
      description: string;
      comingSoon: string;
      subtitle: string;
    };
    profileCompletion: {
      title: string;
      description: string;
      hasPhotos: string;
      isVerified: string;
      hasReferences: string;
    };
    performance: {
      title: string;
      description: string;
      qualityRating: string;
      satisfaction: string;
      monthlyProgress: string;
      newCandidates: string;
      activity: string;
      profileCompletion: string;
    };
  };
};

type SavedFiltersDict = {
  header: {
    title: string;
    subtitle: string; // e.g., "{{count}} saved filter" or "{{count}} saved filters"
    singleFilter: string;
    multipleFilters: string;
  };
  filterCard: {
    defaultBadge: string;
    complexity: {
      basic: string;
      advanced: string;
      complex: string;
      expert: string;
    };
    criteria: string; // e.g., "{{count}} criteria"
    actions: {
      edit: string;
      setDefault: string;
      isDefault: string;
      delete: string;
    };
    summary: {
      search: string;
      gender: string;
      age: string;
      ageValue: string; // e.g., "{{min}}-{{max}}"
      height: string;
      heightValue: string; // e.g., "{{min}}-{{max}}cm"
      city: string;
      cities: string; // e.g., "{{count}} cities"
      religiousLevel: string;
      educationLevel: string;
      maritalStatus: string;
      occupation: string;
      occupations: string; // e.g., "{{count}} occupations"
      status: string;
      statuses: {
        AVAILABLE: string;
        DATING: string;
        UNAVAILABLE: string;
              PAUSED: string;
      ENGAGED: string;
      MARRIED: string;

      };
      verifiedOnly: string;
      withRecommendations: string;
      fullProfile: string;
      activeToday: string;
      activeLastWeek: string;
      activeLastMonth: string;
      activeInDays: string; // e.g., "Active in last {{days}} days"
      separateFiltering: string;
      andMore: string; // e.g., "and {{count}} more criteria"
      noCriteria: string;
    };
  };
  emptyState: {
    title: string;
    description: string;
    fastSearches: string;
    advancedFiltering: string;
    quickAccess: string;
      saveCurrentButton: string; // <--- הוסף את השורה הזו

  };
  stats: {
    default: string;
    advanced: string;
    avgCriteria: string;
  };
};

// src/types/dictionaries/matchmaker.d.ts

// ... (שאר הטיפוסים הקיימים) ...

type MatchmakerEditProfileDict = {
  deleteConfirmationPhrase: string;
  toasts: {
    loadError: string;
    updateSuccess: string;
    updateError: string;
    uploadSuccessSingle: string;
    uploadSuccessMultiple: string; // e.g., "{{count}} photos uploaded successfully"
    uploadError: string;
    setMainSuccess: string;
    setMainError: string;
    deleteImageSuccessSingle: string;
    deleteImageSuccessMultiple: string; // e.g., "{{count}} photos deleted successfully"
    deleteImageError: string;
    deleteCandidateErrorConfirmation: string; // e.g., "Invalid confirmation phrase"
    deleteCandidateErrorDescription: string; // e.g., "Please type '...' exactly"
    deleteCandidateSuccess: string;
    deleteCandidateError: string;
    sendInviteErrorEmail: string;
    sendInviteErrorGeneral: string;
    sendInviteSuccess: string;
  };
  header: {
    title: string; // e.g., "Edit Profile - {{firstName}} {{lastName}}"
    description: string;
    saving: string;
  };
  tabs: {
    profile: string;
    photos: string;
    preferences: string;
  };
  footer: {
    tabInfo: {
      profile: string;
      photos: string;
      preferences: string;
    };
    buttons: {
      sendInvite: string;
      deleteCandidate: string;
      close: string;
    };
  };
  inviteDialog: {
    title: string;
    description: string; // e.g., "Send an invitation to {{fullName}}..."
    emailLabel: string;
    emailPlaceholder: string;
    buttons: {
      cancel: string;
      send: string;
      sending: string;
    };
  };
  deleteDialog: {
    title: string;
    description: string; // e.g., "Are you sure you want to delete {{fullName}}?"
    irreversible: string;
    confirmationLabel: string; // e.g., "To confirm, please type: {{phrase}}"
    inputPlaceholder: string;
    mismatchError: string;
    buttons: {
      cancel: string;
      delete: string;
      deleting: string;
    };
  };
};

type ActionDialogsDict = {
  invite: {
    title: string;
    description: string;
    emailLabel: string;
    emailPlaceholder: string;
    successMessage: string;
    successDescription: string;
    invalidEmailError: string;
    submissionError: string;
    whatsNextTitle: string;
    whatsNextItems: string[];
    buttons: {
      cancel: string;
      send: string;
      sending: string;
    };
  };
  availability: {
    title: string;
    description: string;
    successMessage: string;
    successDescription: string;
    submissionError: string;
    whatsNextTitle: string;
    whatsNextItems: string[];
    messageToSendTitle: string;
    messageContent: string; // e.g., "Hello {{firstName}}, the matchmaker..."
    buttons: {
      cancel: string;
      check: string;
      checking: string;
    };
  };
  suggest: {
    title: string;
    description: string;
    whatsNextTitle: string;
    whatsNextDescription: string;
    buttons: {
      cancel: string;
      continue: string;
    };
  };
};
type AddManualCandidateDialogDict = {
  title: string;
  description: string;
  close: string;
  fields: {
    firstName: {
      label: string;
      placeholder: string;
    };
    lastName: {
      label: string;
      placeholder: string;
    };
    email: {
      label: string;
      placeholder: string;
      description: string;
    };
    sendInvite: {
      label: string;
      disabledTooltip: string;
    };
    gender: {
      label: string;
      placeholder: string;
      male: string;
      female: string;
    };
    birthDate: {
      modeLabel: string;
      dateMode: string;
      ageMode: string;
      dateLabel: string;
      datePlaceholder: string;
      ageLabel: string;
      agePlaceholder: string;
      ageDescription: string;
    };
    notes: {
      label: string;
      placeholder: string;
    };
    photos: {
      label: string;
      cta: string;
      description: string;
      maxFilesWarning: string; // e.g., "Can upload up to {{max}} images."
      fileTooLargeError: string; // e.g., "File {{fileName}} is too large (max {{maxSize}}MB)."
      previewAlt: string; // e.g., "Preview {{index}}"
      removeLabel: string;
    };
  };
  buttons: {
    add: string;
    adding: string;
    cancel: string;
  };
  toasts: {
    error: {
      missingFields: string;
      invalidBirthDate: string;
      invalidAge: string;
      general: string;
    };
    success: {
      candidateAdded: string;
      inviteSent: string;
      inviteError: string;
      inviteLoading: string;
    };
  };
};
type StatusBadgeDict = {
  suggestion: Record<MatchSuggestionStatus, string>;
  verification: Record<VerificationStatus, string>;
  profile: {
    INCOMPLETE: string;
    PENDING_VERIFICATION: string;
    VERIFIED: string;
    BLOCKED: string;
  };
  unknown: string;
};
type PaginationDict = {
  show: string;
  rows: string;
  results: string; // e.g., "Showing {{start}}-{{end}} of {{total}} results"
};
type LoadingStatesDict = {
  errorTitle: string;
  retryButton: string;
};


type MatchmakerHeroSectionDict = {
  title: string;
  subtitle: string;
  totalSuggestions: string;
  pendingResponse: string;
  successfulMatches: string;
  successRate: string;
  newSuggestionButton: string;
  sparkle: string;
  refreshButton: string;
  refreshingButton: string;
};

type EnhancedStatsDict = {
  totalSuggestions: {
    title: string;
    description: string;
  };
  pendingResponse: {
    title: string;
    description: string;
  };
  activeNow: {
    title: string;
    description: string;
  };
  successRate: {
    title: string;
    description: string;
    couples: string;
  };
};

type KanbanColumnDict = {
  requiresAction: string;
  pendingResponse: string;
  inProgress: string;
  history: string;
  noSuggestions: string;
};

type MobileViewDict = {
  list: string;
  kanban: string;
  filter: string;
  searchPlaceholder: string;
  noMatches: {
    title: string;
    description: string;
  };
  newSuggestionButton: string;
};

type MainContentDict = {
  monthlyTrendButton: string;
  tabs: {
    pending: string;
    active: string;
    history: string;
  };
  loadingText: string;
  emptyStates: {
    pending: {
      title: string;
      description: string;
    };
    active: {
      title: string;
      description: string;
    };
    history: {
      title: string;
      description: string;
    };
  };
};

type DialogsDict = {
  monthlyTrend: {
    title: string;
  };
  deleteConfirm: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
};

// הטיפוס הראשי עבור עמוד ניהול ההצעות
type MatchmakerSuggestionsDashboardDict = {
      messageForm: MessageFormDict; // <--- הוספת המפתח החדש

      suggestionsList: SuggestionsListDict; // <--- הוספת המפתח החדש
  managerSuggestionsList: ManagerSuggestionsListDict; // <--- הוספת המפתח החדש

      monthlyTrendModal: MonthlyTrendModalDict; // <-- הוספת המפתח החדש
  heroSection: MatchmakerHeroSectionDict;
  enhancedStats: EnhancedStatsDict;
  kanban: KanbanColumnDict;
  mobile: MobileViewDict;
  mainContent: MainContentDict;
  dialogs: DialogsDict;
  toasts: {
    refreshSuccess: string;
    loadError: string;
    createSuccess: string;
    createError: string;
    deleteSuccess: string;
    deleteError: string;
    statusUpdateSuccess: string;
    statusUpdateError: string;
    updateSuccess: string;
    updateError: string;
    messageSentSuccess: string;
    messageSentError: string;
    
  };
  actionBar: SuggestionActionBarDict;
    suggestionCard: SuggestionCardDict; // <-- הוספת המפתח החדש
  editSuggestionForm: EditSuggestionFormDict; // <-- הוספת המפתח החדש

};

type SuggestionActionBarDict = {
  searchPlaceholder: string;
  buttons: {
    dateRange: string;
    advancedFilters: string;
    clearDate: string;
    hideAdvanced: string;
    clearAll: string;
  };
  priorityFilter: {
    placeholder: string;
    all: string;
    options: Record<"URGENT" | "HIGH" | "MEDIUM" | "LOW", string>;
  };
  advancedFilters: {
    title: string;
    statusTitle: string;
    participantsTitle: string;
    sortByTitle: string;
    statusOptions: {
      PENDING_FIRST_PARTY: string;
      PENDING_SECOND_PARTY: string;
      FIRST_PARTY_APPROVED: string;
      SECOND_PARTY_APPROVED: string;
      DATING: string;
    };
    participantOptions: {
      all: string;
    };
    sortOptions: {
      lastActivity: string;
      createdAt: string;
      priority: string;
      decisionDeadline: string;
    };
  };
  activeFilters: {
    title: string;
    priorityLabel: string;
    dateLabel: string;
    statusLabel: string;
    statusValues: {
      single: string; // למשל: "סטטוס אחד"
      multiple: string; // למשל: "{{count}} סטטוסים"
    };
    userLabel: string;
    userValue: string; // למשל: "משתתף מסוים"
  };
};
type StatusTranslation = {
  label: string;
  shortLabel: string;
  description: string;
};

type PriorityTranslation = {
  label: string;
};

type SuggestionCardDict = {
  // תרגומים לכל הסטטוסים האפשריים
  statuses: Record<string, StatusTranslation>; // Using string key for flexibility with prisma enum
  // תרגומים לכל רמות הדחיפות
  priorities: Record<"URGENT" | "HIGH" | "MEDIUM" | "LOW", PriorityTranslation>;
  deadline: {
    daysLeft: string; // "{{count}} ימים נותרו"
    lastDay: string;  // "היום אחרון!"
    noDeadline: string; // "אין מועד אחרון"
    decisionInDays: string; // "{{count}} ימים להחלטה"
    today: string; // "היום!"
  };
  matchmakerInfo: {
    noInfo: string;
    label: string;
  };
  mobile: {
    title: string;
    urgentTitle: string;
    connectionPoints: string;
    matchReasonTitle: string;
    viewDetailsButton: string;
    sentTime: string; // "נשלח {{timeAgo}}"
  };
  desktop: {
    connectionPoints: string;
    matchReasonTitle: string;
    timeline: {
      created: string;
      deadline: string;
      progress: string;
      progressCompleted: string; // "{{percent}}% הושלמו"
    };
    partyStatus: {
      approved: string;
      declined: string;
    };
  };
  actions: {
    edit: string;
    sendMessage: string;
    delete: string;
    resend: string;
    viewDetails: string;
  };
  // טקסטים סטטיים לדוגמה, יכולים לעבור ל-DB בעתיד
  highlights: {
    familyValues: string;
    religiousView: string;
    location: string;
  };
};
type EditSuggestionFormDict = {
  header: {
    title: string; // "עריכת הצעת שידוך #{{id}}"
    description: string; // "עריכת הפרטים עבור ההצעה בין {{party1}} ל{{party2}}"
    priorityLabel: string; // "עדיפות: {{priority}}"
    currentStatusLabel: string; // "סטטוס נוכחי: {{status}}"
  };
  infoAlert: {
    title: string; // "מידע נוכחי:"
    createdFor: string; // "ההצעה נוצרה עבור {{party1}} ו{{party2}}."
    status: string; // "סטטוס: {{status}}"
    priority: string; // "עדיפות: {{priority}}"
  };
  sections: {
    priority: {
      title: string;
      placeholder: string;
    };
    statusChange: {
      title: string;
      changeButton: string; // "שנה סטטוס"
      cancelChangeButton: string; // "ביטול שינוי"
      placeholder: string; // "בחר/י סטטוס חדש"
      noChangeOption: string; // "ללא שינוי"
      notesLabel: string; // "הערות לשינוי הסטטוס"
      notesPlaceholder: string; // "הערות אופציונליות..."
    };
    decisionDeadline: {
      title: string;
    };
    matchingReason: {
      title: string;
      placeholder: string; // "פרט/י מדוע יש התאמה..."
    };
    firstPartyNotes: {
      title: string; // "הערות לצד א' ({{name}})"
      placeholder: string; // "הערות שיוצגו רק לצד א'..."
    };
    secondPartyNotes: {
      title: string; // "הערות לצד ב' ({{name}})"
      placeholder: string; // "הערות שיוצגו רק לצד ב'..."
    };
    internalNotes: {
      title: string;
      placeholder: string; // "הערות פנימיות..."
    };
  };
  footer: {
    info: string; // "כל השינויים יישמרו..."
    cancelButton: string;
    saveButton: string;
    savingButton: string;
  };
  toasts: {
    noSuggestionData: string;
    updateSuccess: string;
    updateError: string;
  };
  // תרגומים לסטטוסים ולרמות דחיפות שכבר קיימים בטיפוסים אחרים
  // אבל נשכפל אותם כאן לנוחות כדי שהרכיב יהיה עצמאי
  statusLabels: Record<string, string>;
  priorityLabels: Record<"URGENT" | "HIGH" | "MEDIUM" | "LOW", string>;
};

type NewSuggestionFormIndexDict = {
      matchPreview: MatchPreviewDict; // <-- הוספת המפתח החדש
  suggestionDetails: SuggestionDetailsDict; // <-- הוספת המפתח החדש

  header: {
    title: string;
    description: string;
  };
  steps: {
    select: {
      label: string;
      description: string;
    };
    analyze: {
      label: string;
      description: string;
    };
    details: {
      label: string;
      description: string;
    };
  };
  emptyState: {
    title: string;
  };
  buttons: {
    fullAnalysis: string;
    back: string;
    continue: string;
    create: string;
    creating: string;
  };
  footer: {
    step: string; // "שלב {{current}} מתוך {{total}}"
    info: string;
  };
  toasts: {
    selectParties: string;
    createSuccess: string;
    createError: string;
  };
  candidateSelector: CandidateSelectorDict; 
};

type CandidateSelectorDict = {
  searchPlaceholder: string;
  commandInputPlaceholder: string;
  noResults: {
    title: string;
    description: string;
  };
  status: {
    blocked: string;
    blockedDescription: string; // "בהצעה פעילה עם {{name}}"
    pending: string;
    pendingDescription: string; // "הצעה ממתינה עם {{name}}"
    available: string;
    availableDescription: string;
  };
  card: {
    cannotSelect: string;
    years: string;
  };
  selectedDisplay: {
    title: string;
    removeButton: string;
    viewProfileButton: string;
  };
  toasts: {
    cannotSelectError: {
      title: string;
      description: string; // "{{name}} כבר נמצא/ת בהצעה פעילה עם {{withName}}."
    };
  };
};
type MatchPreviewDict = {
  errorState: {
    title: string;
    description: string;
    suggestion: string;
  };
  qualityLevels: {
    perfect: { text: string; description: string; };
    excellent: { text: string; description: string; };
    good: { text: string; description: string; };
    medium: { text: string; description: string; };
    low: { text: string; description: string; };
  };
  generalScoreLabel: string;
  criteriaSection: {
    title: string;
    description: string;
  };
  criteria: {
    age: string;
    location: string;
    religious: string;
        reasons: {
      age: {
        ideal: string;
        good: string;
        fair: string;
        large: string;
        preferenceMismatch: string;
      };
      location: {
        noData: string;
        sameCity: string;
        mutualPreference: string;
        oneWayPreference: string;
        differentCities: string;
      };
      religious: {
        noData: string;
        sameLevel: string;
        mutualPreference: string;
        oneWayPreference: string;
        differentLevels: string;
      };
    };
  };
  scoreCategories: {
    perfect: string;
    excellent: string;
    good: string;
    medium: string;
    low: string;
  };
  scoreLabel: string; // "התאמה"
  reasonsSection: {
    title: string;
  };
  summary: {
    title: string;
    description: string;
    recommendations: {
      high: string; // "מומלץ בחום!"
      medium: string; // "שווה לנסות"
      low: string; // "צריך שיקול"
    };
    basedOn: string; // "מבוסס על {{count}} קריטריונים"
  };
};
type SuggestionDetailsDict = {
  priority: {
    title: string;
    description: string;
    label: string;
    placeholder: string;
    options: Record<"URGENT" | "HIGH" | "MEDIUM" | "LOW", { title: string; description: string; }>;
  };
  rationale: {
    title: string;
    description: string;
    label: string;
    aiButton: string;
    aiButtonLoading: string;
    placeholder: string;
    aiTip: string;
  };
  notes: {
    party1Title: string; // "הערות אישיות ל{{name}}"
    party2Title: string; // "הערות אישיות ל{{name}}"
    description: string;
    party1Label: string; // "צד א' בהצעה"
    party2Label: string; // "צד ב' בהצעה"
    party1Placeholder: string; // "טקסט אישי המדגיש את היתרונות של {{otherName}}..."
    party2Placeholder: string; // "טקסט אישי המדגיש את היתרונות של {{otherName}}..."
  };
  internalNotes: {
    title: string;
    description: string;
    secretInfo: string;
    visibleTo: string;
    placeholder: string;
  };
  deadline: {
    title: string;
    description: string;
    label: string;
    options: Record<"3" | "7" | "14" | "30", { title: string; description: string; }>;
    infoBox: {
      title: string;
      body: string;
    };
  };
  summary: {
    title: string;
    description: string;
    ready: string;
    info: string;
  };
  toasts: {
    aiLoading: {
      title: string;
      description: string;
    };
    aiSuccess: {
      title: string;
      description: string;
    };
    aiError: {
      title: string;
      description: string;
    };
  };
};
type SuggestionDetailsDialogDict = {
  header: {
    title: string; // "הצעה #{{id}}"
    subtitle: string; // "{{party1}} ו{{party2}}"
    fullscreenTooltip: string;
    minimizeTooltip: string;
  };
  tabs: {
    overview: string;
    party1: string;
    party2: string;
    timeline: string;
    communication: string;
    actions: string;
  };
  overview: {
    statusSummaryTitle: string;
    progressCompleted: string; // "{{percent}}% הושלמו"
    matchmakerLabel: string;
    detailsTitle: string;
    details: {
      createdAt: string;
      lastActivity: string;
      priority: string;
      responseDeadline: string;
      decisionDeadline: string;
      notSet: string;
    };
    editButton: string;
    partyALabel: string;
    partyBLabel: string;
    contactButton: string;
    reminderButton: string;
    reasons: {
      matchTitle: string;
      internalTitle: string;
    };
    deadlineAlert: {
      today: string;
      daysLeft: string; // "{{count}} ימים"
    };
  };
  timeline: {
    title: string;
    noNotes: string;
  };
  communication: {
    title: string;
  };
  actions: {
    title: string;
    statusChange: {
      title: string;
      description: string;
      button: string;
    };
    edit: {
      title: string;
      description: string;
      button: string;
    };
    delete: {
      title: string;
      description: string;
      button: string;
    };
  };
  statusChangeModal: {
    title: string;
    currentStatusLabel: string;
    newStatusLabel: string;
    newStatusPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    cancelButton: string;
    saveButton: string;
    savingButton: string;
  };
  toasts: {
    statusUpdateError: string;
  };
  // כולל תרגומים שכבר קיימים במקומות אחרים, למען שלמות הרכיב
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
};
type MonthlyTrendModalDict = {
  emptyState: {
    title: string;
    description: string;
  };
  header: {
    title: string;
    subtitle: string;
  };
  trendCards: {
    total: { title: string; description: string; };
    active: { title: string; description: string; };
    pending: { title: string; description: string; };
    success: { title: string; description: string; };
    trendLabel: {
      increase: string; // "גידול מהחודש הקודם"
      decrease: string; // "ירידה מהחודש הקודם"
    };
  };
  charts: {
    areaChart: {
      title: string;
      badge: string; // "{{count}} חודשים"
    };
    pieChart: {
      title: string;
      badge: string; // "{{month}} {{year}}"
    };
    legend: {
      active: string;
      pending: string;
      success: string;
      declined: string;
      total: string;
    };
    tooltip: {
      monthLabel: string; // "חודש: {{label}}"
    };
  };
  table: {
    title: string;
    exportButton: string;
    viewAllButton: string;
    headers: {
      month: string;
      total: string;
      active: string;
      pending: string;
      success: string;
      declined: string;
    };
    currentMonthBadge: string;
  };
  insights: {
    title: string;
    subtitle: string;
    growth: {
      title: string;
      increase: string; // "גידול של {{trend}}%..."
      decrease: string; // "ירידה של {{trend}}%..."
    };
    successRate: {
      title: string;
      rate: string; // "{{rate}}% מההצעות הגיעו להצלחה..."
      noData: string;
    };
    currentActivity: {
      title: string;
      body: string; // "{{count}} הצעות זקוקות לטיפול..."
    };
  };
};

type SuggestionsListStatsDict = {
  total: string;
  pending: string;
  approved: string;
  declined: string;
  urgent: string;
};

type SuggestionsListFilterDict = {
  searchPlaceholder: string;
  sortPlaceholder: string;
  sortOptions: {
    latest: string;
    oldest: string;
    deadline: string;
    priority: string;
  };
  filterButton: string;
  advancedFilterTitle: string;
  statusOptions: Record<string, string>;
  clearFiltersButton: string;
  viewModes: {
    grid: string;
    list: string;
  };
};

type SuggestionsListResultsDict = {
  summary: string; // "מציג {{count}} {{label}} מתוך {{total}}"
  itemLabel_one: string; // הצעה
  itemLabel_other: string; // הצעות
  qualityMatches: string;
};

type SuggestionsListEmptyStateDict = {
  filtered: {
    title: string;
    description: string;
  };
  default: {
    title: string;
    description: string;
  };
  clearButton: string;
};

type SuggestionsListActiveFiltersDict = {
  title: string;
  searchLabel: string; // "חיפוש: {{query}}"
  clearAllButton: string;
};

type SuggestionsListPerformanceDict = {
  title: string;
  description: string; // "{{rate}}% אחוז אישור • {{urgentCount}} דחופות • {{pendingCount}} ממתינות לטיפול"
  successLabel: string;
};

type SuggestionsListDict = {
  stats: SuggestionsListStatsDict;
  filters: SuggestionsListFilterDict;
  results: SuggestionsListResultsDict;
  emptyState: SuggestionsListEmptyStateDict;
  activeFilters: SuggestionsListActiveFiltersDict;
  performance: SuggestionsListPerformanceDict;
};
type ManagerSuggestionsListDict = {
  emptyState: {
    title: string;
    description: string;
  };
  deleteDialog: {
    title: string;
    description: string;
    cancelButton: string;
    confirmButton: string;
  };
  toasts: {
    deleteSuccess: string;
    deleteError: string;
  };
};
type MessageFormDict = {
  header: {
    title: string;
    description: string; // "{{party1}} ו{{party2}}"
  };
  infoAlert: {
    suggestionPrefix: string; // "הצעה #"
    body: string; // "הודעה זו תישלח במסגרת הצעת השידוך הפעילה."
    statusLabel: string; // "סטטוס נוכחי:"
    priorityLabel: string; // "עדיפות:"
  };
  form: {
    recipientLabel: string;
    recipientPlaceholder: string;
    recipientSelectedPrefix: string; // "ההודעה תישלח ל"
    messageTypeLabel: string;
    messageTypePlaceholder: string;
    messageContentLabel: string;
    signatureNotice: string;
    charsCount: string; // "{{count}}/1000 תווים"
  };
  partyTypes: {
    first: string; // "{{firstName}} {{lastName}} (צד א')"
    second: string; // "{{firstName}} {{lastName}} (צד ב')"
    both: string; // "שני הצדדים"
  };
  messageTypes: {
    message: {
      label: string;
      description: string;
      placeholder: string;
    };
    reminder: {
      label: string;
      description: string;
      placeholder: string;
    };
    update: {
      label: string;
      description: string;
      placeholder: string;
    };
  };
  preview: {
    title: string;
    recipientLabel: string; // "אל:"
    typeLabel: string; // "סוג:"
    signature: {
      greeting: string; // "בברכה,"
      team: string; // "צוות מערכת השידוכים"
    };
  };
  footer: {
    notificationNotice: string;
    cancelButton: string;
    sendButton: string;
    sendingButton: string;
  };
  toasts: {
    success: string; // "ההודעה נשלחה {{recipient}}"
    successRecipients: {
      first: string; // "ל{{name}}"
      second: string; // "ל{{name}}"
      both: string; // "לשני הצדדים"
    };
    error: string;
  };
};
