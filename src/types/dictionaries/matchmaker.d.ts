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
    search: string;
    maleSearch: string;
    femaleSearch: string;
    separateFiltering: string;
    gender: string; // e.g., "Gender: {{gender}}"
    genders: { MALE: string; FEMALE: string; };
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
    status: string;
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
  savedFilters: {
    emptyTitle: string;
    emptyDescription: string;
    saveCurrentButton: string;
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
  };  cardActions: {
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
    aiMatch: string; // e.g., "{{score}}% Match"
    manualEntry: string;
    noImage: string;
    yearsSuffix: string;
    lastActivePrefix: string; // e.g., "Active" -> "Active {{timeAgo}}"
    qualityScore: string; // e.g., "Quality: {{score}}%"
    compare: string;
    tooltips: {
      editProfile: string;
      setAsAiTarget: string;
      clearAiTarget: string;
    };
  };
  
};

type SplitViewDict = {
  panelHeaders: {
    male: { title: string; subtitle: string; };
    female: { title: string; subtitle: string; };
    targetLabel: string; // e.g., "Target: {{name}}"
    findMatchesButton: string;
    searchingButton: string;
  };
  mobile: {
    tabs: { male: string; female: string; };
    splitLabels: { male: string; female: string; };
  };
};

// Main dictionary type for the Matchmaker Page
export type MatchmakerPageDictionary = {
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
  };
  // Other potential top-level keys for the matchmaker interface can be added here
};