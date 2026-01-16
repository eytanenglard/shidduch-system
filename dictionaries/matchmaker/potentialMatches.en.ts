// =============================================================================
// src/dictionaries/en/potentialMatches.ts
// English Dictionary - Potential Matches
// =============================================================================

export const potentialMatchesDictionary = {
  // Titles
  title: 'Potential Matches',
  subtitle: 'Matches found by automated scanning',
  
  // Statistics
  stats: {
    total: 'Total Matches',
    pending: 'Pending',
    reviewed: 'Reviewed',
    sent: 'Suggestions Sent',
    dismissed: 'Dismissed',
    expired: 'Expired',
    withWarnings: 'With Warnings',
    avgScore: 'Average Score',
    highScore: 'High Score (85+)',
    mediumScore: 'Medium Score (70-84)',
  },
  
  // Filters
  filters: {
    status: 'Status',
    minScore: 'Minimum Score',
    maxScore: 'Maximum Score',
    religiousLevel: 'Religious Level',
    city: 'City',
    hasWarning: 'Warning Filter',
    sortBy: 'Sort By',
    search: 'Search',
    searchPlaceholder: 'Search by name...',
    
    statusOptions: {
      all: 'All',
      pending: 'Pending',
      reviewed: 'Reviewed',
      sent: 'Sent',
      dismissed: 'Dismissed',
      withWarnings: 'With Warnings',
      noWarnings: 'No Warnings',
    },
    
    sortOptions: {
      scoreDesc: 'Score (High to Low)',
      scoreAsc: 'Score (Low to High)',
      dateDesc: 'Date (Newest First)',
      dateAsc: 'Date (Oldest First)',
      maleWaiting: 'Waiting Time (Male)',
      femaleWaiting: 'Waiting Time (Female)',
    },
    
    warningOptions: {
      all: 'All',
      withWarnings: 'With Warnings Only',
      noWarnings: 'No Warnings Only',
    },
    
    resetFilters: 'Clear Filters',
  },
  
  // Match Card
  card: {
    score: 'Match Score',
    reasoning: 'Reasoning',
    scannedAt: 'Scanned',
    backgroundCompatibility: 'Background Compatibility',
    activeWarning: 'Warning',
    activeWarningWith: 'Active suggestion with',
    createSuggestion: 'Create Suggestion',
    dismiss: 'Dismiss',
    markReviewed: 'Mark as Reviewed',
    viewDetails: 'View Details',
    restore: 'Restore',
    viewProfile: 'View Profile',
    showBreakdown: 'Show Score Breakdown',
    hideBreakdown: 'Hide Breakdown',
    readMore: 'Read more...',
    suggestionCreated: 'Suggestion Created',
    viewSuggestion: 'View Suggestion',
  },
  
  // Score Breakdown
  scoreBreakdown: {
    title: 'Score Breakdown',
    religious: 'Religious Compatibility',
    ageCompatibility: 'Age Compatibility',
    careerFamily: 'Career-Family Balance',
    lifestyle: 'Lifestyle',
    ambition: 'Ambition',
    communication: 'Communication',
    values: 'Values',
  },
  
  // Background Compatibility
  backgroundCompatibility: {
    excellent: 'Excellent Match',
    good: 'Good Match',
    possible: 'Possible Match',
    problematic: 'Background Gap',
    not_recommended: 'Not Recommended',
  },
  
  // Actions
  actions: {
    bulkSelect: 'Bulk Select',
    bulkDismiss: 'Dismiss All',
    bulkReview: 'Mark All as Reviewed',
    bulkRestore: 'Restore All',
    selectAll: 'Select All',
    clearSelection: 'Clear Selection',
    runScan: 'Run Scan',
    refreshList: 'Refresh List',
    selected: 'Selected',
    items: 'items',
  },
  
  // Empty State
  emptyState: {
    noMatches: 'No Matches Found',
    noMatchesFiltered: 'No matches found with the selected filters',
    noMatchesDescription: 'Try changing the filters or running a new scan',
    runScanDescription: 'Run a nightly scan to find new potential matches',
    showAll: 'Show All Matches',
  },
  
  // Scan
  scan: {
    title: 'Nightly Scan',
    running: 'Scan in progress...',
    completed: 'Scan Completed',
    failed: 'Scan Failed',
    partial: 'Scan Partially Completed',
    lastScan: 'Last Scan',
    duration: 'Duration',
    candidatesScanned: 'Candidates Scanned',
    matchesFound: 'Matches Found',
    newMatches: 'New Matches',
    startScan: 'Start Scan',
    confirmTitle: 'Run Nightly Scan',
    confirmDescription: 'The scan will go through all candidates in the system and find new potential matches. This process may take several minutes.',
    alreadyRunning: 'A scan is already running',
  },
  
  // Dialogs
  dialogs: {
    createSuggestion: {
      title: 'Create Suggestion',
      description: 'Create a match suggestion from this potential match',
      priority: 'Priority',
      priorityLow: 'Low',
      priorityMedium: 'Medium',
      priorityHigh: 'High',
      priorityUrgent: 'Urgent',
      notes: 'Notes',
      notesPlaceholder: 'Add notes or matching reason...',
      create: 'Create Suggestion',
      cancel: 'Cancel',
    },
    
    dismiss: {
      title: 'Dismiss Match',
      description: 'You can optionally provide a reason for dismissal',
      reasonPlaceholder: 'Reason for dismissal...',
      confirm: 'Dismiss',
      cancel: 'Cancel',
    },
    
    bulkDismiss: {
      title: 'Dismiss Multiple Matches',
      description: 'Are you sure you want to dismiss all selected matches? You can restore them later.',
      confirm: 'Dismiss All',
      cancel: 'Cancel',
    },
    
    reasoning: {
      title: 'Match Reasoning',
      overallScore: 'Overall Match Score',
      basedOnAI: 'Based on deep AI analysis',
      shortSummary: 'Short Summary',
      detailedAnalysis: 'Detailed Analysis',
      close: 'Close',
    },
  },
  
  // Toast Messages
  toasts: {
    dismissSuccess: 'Match dismissed',
    dismissError: 'Error dismissing match',
    reviewSuccess: 'Match marked as reviewed',
    restoreSuccess: 'Match restored',
    suggestionCreated: 'Suggestion created successfully!',
    suggestionError: 'Failed to create suggestion',
    bulkDismissSuccess: 'Matches dismissed',
    bulkReviewSuccess: 'Matches marked as reviewed',
    bulkRestoreSuccess: 'Matches restored',
    scanStarted: 'Scan started!',
    scanCompleted: 'Scan completed!',
    scanError: 'Failed to start scan',
    refreshSuccess: 'List refreshed',
    refreshError: 'Error loading matches',
  },
  
  // Pagination
  pagination: {
    showing: 'Showing',
    of: 'of',
    page: 'Page',
    perPage: 'per page',
  },
  
  // View
  view: {
    grid: 'Grid View',
    list: 'List View',
  },
  
  // Religious Levels
  religiousLevels: {
    charedi_hasidic: 'Charedi Hasidic',
    charedi_litvak: 'Charedi Litvak',
    charedi_sephardic: 'Charedi Sephardic',
    chabad: 'Chabad',
    breslov: 'Breslov',
    charedi_modern: 'Modern Charedi',
    dati_leumi_torani: 'Dati Leumi Torani',
    dati_leumi_standard: 'Dati Leumi',
    dati_leumi_liberal: 'Dati Leumi Liberal',
    masorti_strong: 'Strong Traditional',
    masorti_light: 'Traditional',
    secular_traditional_connection: 'Secular with Traditional Connection',
    secular: 'Secular',
    spiritual_not_religious: 'Spiritual Not Religious',
    other: 'Other',
    unknown: 'Not Specified',
  },
};

export default potentialMatchesDictionary;
