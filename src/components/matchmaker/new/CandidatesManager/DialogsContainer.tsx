'use client';

import React from 'react';
import { AddManualCandidateDialog } from '../dialogs/AddManualCandidateDialog';
import { AiMatchAnalysisDialog } from '../dialogs/AiMatchAnalysisDialog';
import { ProfileFeedbackDialog } from '../dialogs/ProfileFeedbackDialog';
import { AiMatchmakerProfileAdvisorDialog } from '../dialogs/AiMatchmakerProfileAdvisorDialog';
import { BulkImportDialog } from '../dialogs/BulkImportDialog';
import { CardBasedImportDialog } from '../dialogs/CardBasedImportDialog';
import BulkSuggestionsDialog from '../dialogs/BulkSuggestionsDialog';
import { VirtualUserDialog, SavedVirtualProfiles } from '../VirtualSearch';
import type { Candidate } from '../types/candidates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface DialogsContainerProps {
  // Manual add
  showManualAddDialog: boolean;
  onCloseManualAdd: () => void;
  onCandidateAdded: () => void;

  // Bulk import
  showBulkImportDialog: boolean;
  onCloseBulkImport: () => void;
  onImportComplete: () => void;

  // Card import
  showCardImportDialog: boolean;
  onCloseCardImport: () => void;
  onCardImportComplete: () => void;

  // AI Profile Advisor
  analyzedCandidate: Candidate | null;
  onCloseAiAnalysis: () => void;

  // Profile Feedback
  feedbackCandidate: Candidate | null;
  onCloseFeedback: () => void;

  // AI Match Analysis
  isAnalysisDialogOpen: boolean;
  onCloseAnalysis: () => void;
  aiTargetCandidate: Candidate | null;
  comparisonCandidates: Candidate[];

  // Bulk Suggestions
  showBulkSuggestionsDialog: boolean;
  onCloseBulkSuggestions: () => void;
  existingSuggestions: Record<string, { status: string; createdAt: string }>;

  // Virtual Search
  showVirtualUserDialog: boolean;
  onCloseVirtualUser: () => void;
  onVirtualProfileCreated: (profile: unknown) => void;
  showSavedVirtualProfiles: boolean;
  onCloseSavedVirtualProfiles: () => void;
  onSelectVirtualProfile: (profile: unknown) => void;
  onCreateNewVirtualProfile: () => void;

  // i18n
  dict: MatchmakerPageDictionary;
  locale: string;
}

const DialogsContainer: React.FC<DialogsContainerProps> = ({
  showManualAddDialog,
  onCloseManualAdd,
  onCandidateAdded,
  showBulkImportDialog,
  onCloseBulkImport,
  onImportComplete,
  showCardImportDialog,
  onCloseCardImport,
  onCardImportComplete,
  analyzedCandidate,
  onCloseAiAnalysis,
  feedbackCandidate,
  onCloseFeedback,
  isAnalysisDialogOpen,
  onCloseAnalysis,
  aiTargetCandidate,
  comparisonCandidates,
  showBulkSuggestionsDialog,
  onCloseBulkSuggestions,
  existingSuggestions,
  showVirtualUserDialog,
  onCloseVirtualUser,
  onVirtualProfileCreated,
  showSavedVirtualProfiles,
  onCloseSavedVirtualProfiles,
  onSelectVirtualProfile,
  onCreateNewVirtualProfile,
  dict,
  locale,
}) => {
  return (
    <>
      <AiMatchmakerProfileAdvisorDialog
        isOpen={!!analyzedCandidate}
        onClose={onCloseAiAnalysis}
        candidate={analyzedCandidate}
        dict={dict.candidatesManager.aiProfileAdvisor}
        locale={locale}
      />

      <ProfileFeedbackDialog
        isOpen={!!feedbackCandidate}
        onClose={onCloseFeedback}
        candidate={feedbackCandidate}
        locale={locale}
        dict={dict.candidatesManager.profileFeedbackDialog}
      />

      <AddManualCandidateDialog
        isOpen={showManualAddDialog}
        onClose={onCloseManualAdd}
        onCandidateAdded={onCandidateAdded}
        dict={dict.candidatesManager.addManualCandidateDialog}
        locale={locale}
      />

      <BulkImportDialog
        isOpen={showBulkImportDialog}
        onClose={onCloseBulkImport}
        onImportComplete={onImportComplete}
        locale={locale}
      />

      <CardBasedImportDialog
        isOpen={showCardImportDialog}
        onClose={onCloseCardImport}
        onImportComplete={onCardImportComplete}
        locale={locale}
      />

      <AiMatchAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={onCloseAnalysis}
        targetCandidate={aiTargetCandidate}
        comparisonCandidates={comparisonCandidates}
        dict={dict.candidatesManager.aiAnalysis}
        locale={locale}
      />

      {aiTargetCandidate && (
        <BulkSuggestionsDialog
          isOpen={showBulkSuggestionsDialog}
          onClose={onCloseBulkSuggestions}
          firstPartyCandidate={aiTargetCandidate}
          secondPartyCandidates={comparisonCandidates}
          existingSuggestions={existingSuggestions}
          dict={dict}
          locale={locale}
        />
      )}

      <VirtualUserDialog
        isOpen={showVirtualUserDialog}
        onClose={onCloseVirtualUser}
        onProfileCreated={onVirtualProfileCreated}
        locale={locale}
      />

      <SavedVirtualProfiles
        isOpen={showSavedVirtualProfiles}
        onClose={onCloseSavedVirtualProfiles}
        onSelectProfile={onSelectVirtualProfile}
        onCreateNew={onCreateNewVirtualProfile}
        locale={locale}
      />
    </>
  );
};

export default React.memo(DialogsContainer);
