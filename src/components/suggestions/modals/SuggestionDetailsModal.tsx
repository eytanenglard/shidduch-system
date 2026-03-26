// src/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { AskMatchmakerDialog } from '../dialogs/AskMatchmakerDialog';
import { useSuggestionModal } from './hooks/useSuggestionModal';
import ModalShell from './components/ModalShell';
import TabHeader from './components/TabHeader';
import PresentationTab from './components/PresentationTab';
import ProfileTab from './components/ProfileTab';
import CompatibilityTab from './components/CompatibilityTab';
import DetailsTab from './components/DetailsTab';
import QuickActionsBar from './components/QuickActionsBar';
import type { SuggestionDetailsModalProps } from './types/modal.types';

const SuggestionDetailsModal: React.FC<SuggestionDetailsModalProps> = (props) => {
  const {
    suggestion,
    locale,
    isOpen,
    onClose,
    questionnaire,
    isDemo = false,
    demoAnalysisData = null,
    isUserInActiveProcess = false,
    dict,
  } = props;

  const state = useSuggestionModal(props);
  const {
    activeTab,
    setActiveTab,
    showAskDialog,
    setShowAskDialog,
    isSubmitting,
    isQuestionnaireLoading,
    isActionsExpanded,
    setIsActionsExpanded,
    isMobile,
    isFullscreen,
    isTransitioning,
    toggleFullscreen,
    isFirstParty,
    targetParty,
    profileWithUser,
    handleApprove,
    handleDecline,
    handleInterested,
    handleWithdraw,
    handleSendQuestion,
  } = state;

  if (!suggestion || !targetParty || !profileWithUser) return null;

  const targetAge = targetParty.profile?.birthDate
    ? new Date().getFullYear() - new Date(targetParty.profile.birthDate).getFullYear()
    : null;

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        locale={locale}
        isMobile={isMobile}
        isFullscreen={isFullscreen}
        isTransitioning={isTransitioning}
      >
        <ScrollArea className="flex-grow min-h-0 modal-scroll">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            <TabHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={onClose}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              isMobile={isMobile}
              isTransitioning={isTransitioning}
              dict={dict.suggestions.modal.tabs}
              personName={targetParty.firstName}
              personAge={targetAge}
            />

            {/* TAB: Presentation */}
            <TabsContent
              value="presentation"
              className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-200"
            >
              <PresentationTab
                matchmaker={suggestion.matchmaker}
                targetParty={targetParty}
                locale={locale}
                personalNote={
                  isFirstParty
                    ? suggestion.firstPartyNotes
                    : suggestion.secondPartyNotes
                }
                matchingReason={suggestion.matchingReason}
                onViewProfile={() => setActiveTab('profile')}
                onStartConversation={() => setActiveTab('details')}
                dict={dict.suggestions.modal.header}
              />
            </TabsContent>

            {/* TAB: Profile */}
            <TabsContent
              value="profile"
              className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-teal-50 text-start data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-200"
              dir={locale === 'he' ? 'rtl' : 'ltr'}
            >
              <ProfileTab
                profileWithUser={profileWithUser}
                isQuestionnaireLoading={isQuestionnaireLoading}
                targetParty={targetParty}
                questionnaire={questionnaire}
                locale={locale}
                onNavigateToDetails={() => setActiveTab('details')}
                dict={{
                  modal: dict.suggestions.modal,
                  profileCard: dict.profileCard,
                }}
              />
            </TabsContent>

            {/* TAB: Compatibility / AI Analysis */}
            <TabsContent
              value="compatibility"
              className="mt-0 p-4 md:p-6 bg-gradient-to-br from-slate-50 via-white to-rose-50 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-200"
            >
              <CompatibilityTab
                targetPartyId={targetParty.id}
                isDemo={isDemo}
                demoAnalysisData={demoAnalysisData}
                currentUserName={
                  isFirstParty
                    ? (suggestion.firstParty?.firstName ?? '')
                    : (suggestion.secondParty?.firstName ?? '')
                }
                suggestedUserName={targetParty.firstName}
                locale={locale}
                dict={{
                  aiAnalysisCta: dict.suggestions.modal.aiAnalysisCta,
                  aiAnalysis: dict.suggestions.aiAnalysis,
                }}
              />
            </TabsContent>

            {/* TAB: Details — Chat + Timeline */}
            <TabsContent
              value="details"
              className="mt-0 p-4 md:p-6 bg-[#f0f2f5] min-h-[600px] data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-200"
            >
              <DetailsTab
                suggestionId={suggestion.id}
                statusHistory={suggestion.statusHistory}
                matchmakerFirstName={suggestion.matchmaker?.firstName || ''}
                locale={locale}
                dict={{
                  timeline: dict.suggestions.timeline,
                  modal: dict.suggestions.modal,
                }}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Quick Actions Footer */}
        <QuickActionsBar
          isExpanded={isActionsExpanded}
          onToggleExpand={() => setIsActionsExpanded((prev) => !prev)}
          status={suggestion.status}
          isFirstParty={isFirstParty}
          isUserInActiveProcess={isUserInActiveProcess}
          isSubmitting={isSubmitting}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onInterested={handleInterested}
          onAskQuestion={() => setActiveTab('details')}
          onWithdraw={handleWithdraw}
          approvedAt={suggestion.firstPartyResponded}
          secondPartySent={suggestion.secondPartySent}
          dict={dict.suggestions.modal.actions}
          locale={locale}
        />
      </ModalShell>

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={`${suggestion.matchmaker?.firstName} ${suggestion.matchmaker?.lastName}`}
        dict={dict.suggestions.askMatchmaker}
      />
    </>
  );
};

export default SuggestionDetailsModal;
