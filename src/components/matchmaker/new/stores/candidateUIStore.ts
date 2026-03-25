// Store for UI state: view modes, dialog visibility, header, selection, QuickView
import { create } from 'zustand';
import type { ViewMode, MobileView, Candidate } from '../types/candidates';

interface CandidateUIState {
  // View modes
  viewMode: ViewMode;
  mobileView: MobileView;
  isMobile: boolean;
  isHeaderCompact: boolean;
  isQuickViewEnabled: boolean;

  // Filter panel visibility
  showFiltersPanel: boolean;
  showFiltersMobile: boolean;

  // Dialog visibility
  showManualAddDialog: boolean;
  showBulkImportDialog: boolean;
  showCardImportDialog: boolean;
  showBulkSuggestionsDialog: boolean;
  showVirtualUserDialog: boolean;
  showSavedVirtualProfiles: boolean;
  isAnalysisDialogOpen: boolean;

  // Candidates being acted on in dialogs
  feedbackCandidate: Candidate | null;
  analyzedCandidate: Candidate | null;

  // Bulk update
  isBulkUpdating: boolean;
}

interface CandidateUIActions {
  setViewMode: (mode: ViewMode) => void;
  setMobileView: (mode: MobileView) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleHeaderCompact: () => void;
  toggleQuickView: () => void;
  setShowFiltersPanel: (show: boolean) => void;
  setShowFiltersMobile: (show: boolean) => void;

  // Dialog toggles
  openDialog: (dialog: DialogName) => void;
  closeDialog: (dialog: DialogName) => void;

  // Candidate-specific dialog actions
  setFeedbackCandidate: (candidate: Candidate | null) => void;
  setAnalyzedCandidate: (candidate: Candidate | null) => void;

  setIsBulkUpdating: (updating: boolean) => void;
}

type DialogName =
  | 'manualAdd'
  | 'bulkImport'
  | 'cardImport'
  | 'bulkSuggestions'
  | 'virtualUser'
  | 'savedVirtualProfiles'
  | 'analysis';

const dialogKeyMap: Record<DialogName, keyof CandidateUIState> = {
  manualAdd: 'showManualAddDialog',
  bulkImport: 'showBulkImportDialog',
  cardImport: 'showCardImportDialog',
  bulkSuggestions: 'showBulkSuggestionsDialog',
  virtualUser: 'showVirtualUserDialog',
  savedVirtualProfiles: 'showSavedVirtualProfiles',
  analysis: 'isAnalysisDialogOpen',
};

export const useCandidateUIStore = create<CandidateUIState & CandidateUIActions>(
  (set) => ({
    // Initial state
    viewMode: 'grid',
    mobileView: 'double',
    isMobile: false,
    isHeaderCompact: true,
    isQuickViewEnabled: false,
    showFiltersPanel: false,
    showFiltersMobile: false,
    showManualAddDialog: false,
    showBulkImportDialog: false,
    showCardImportDialog: false,
    showBulkSuggestionsDialog: false,
    showVirtualUserDialog: false,
    showSavedVirtualProfiles: false,
    isAnalysisDialogOpen: false,
    feedbackCandidate: null,
    analyzedCandidate: null,
    isBulkUpdating: false,

    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setMobileView: (mode) => set({ mobileView: mode }),
    setIsMobile: (isMobile) => set({ isMobile }),
    toggleHeaderCompact: () =>
      set((s) => ({ isHeaderCompact: !s.isHeaderCompact })),
    toggleQuickView: () =>
      set((s) => ({ isQuickViewEnabled: !s.isQuickViewEnabled })),
    setShowFiltersPanel: (show) => set({ showFiltersPanel: show }),
    setShowFiltersMobile: (show) => set({ showFiltersMobile: show }),

    openDialog: (dialog) =>
      set({ [dialogKeyMap[dialog]]: true } as Partial<CandidateUIState>),
    closeDialog: (dialog) =>
      set({ [dialogKeyMap[dialog]]: false } as Partial<CandidateUIState>),

    setFeedbackCandidate: (candidate) => set({ feedbackCandidate: candidate }),
    setAnalyzedCandidate: (candidate) => set({ analyzedCandidate: candidate }),

    setIsBulkUpdating: (updating) => set({ isBulkUpdating: updating }),
  })
);
