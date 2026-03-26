// src/components/suggestions/modals/SuggestionDetailsModal.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

import { AskMatchmakerDialog } from '../dialogs/AskMatchmakerDialog';
import { getEnhancedStatusInfo } from '@/lib/utils/suggestionUtils';
import { useSuggestionModal } from './hooks/useSuggestionModal';
import { useSwipeTabs } from './hooks/useSwipeTabs';
import ModalShell from './components/ModalShell';
import TabHeader from './components/TabHeader';
import PresentationTab from './components/PresentationTab';
import PresentationTabSkeleton from './components/PresentationTabSkeleton';
import ProfileTab from './components/ProfileTab';
import CompatibilityTab from './components/CompatibilityTab';
import DetailsTab from './components/DetailsTab';
import QuickActionsBar from './components/QuickActionsBar';
import type { SuggestionDetailsModalProps } from './types/modal.types';

const tabAnimationVariants = {
  enter: (direction: number) => ({
    x: direction * 30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction * -30,
    opacity: 0,
  }),
};

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
    tabDirection,
    handleTabChange,
    showAskDialog,
    setShowAskDialog,
    isSubmitting,
    isQuestionnaireLoading,
    isActionsExpanded,
    setIsActionsExpanded,
    isInitialLoad,
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

  const { handleTouchStart, handleTouchEnd } = useSwipeTabs(
    activeTab,
    handleTabChange,
    isMobile,
    locale === 'he'
  );

  // Scroll to top when switching tabs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) viewport.scrollTop = 0;
  }, [activeTab]);

  if (!suggestion || !targetParty || !profileWithUser) return null;

  const targetAge = targetParty.profile?.birthDate
    ? new Date().getFullYear() - new Date(targetParty.profile.birthDate).getFullYear()
    : null;

  const statusInfo = getEnhancedStatusInfo(suggestion.status, isFirstParty, dict.suggestions.card);

  const renderActiveTab = () => {
    // Show skeleton on initial load
    if (isInitialLoad) {
      if (activeTab === 'presentation') return <PresentationTabSkeleton />;
      return (
        <div className="p-5 md:p-8 space-y-4 bg-gray-50 min-h-[400px] animate-in fade-in-0">
          <Skeleton className="w-48 h-6 rounded" />
          <Skeleton className="w-full h-40 rounded-xl" />
          <Skeleton className="w-36 h-5 rounded" />
          <Skeleton className="w-full h-32 rounded-xl" />
        </div>
      );
    }

    switch (activeTab) {
      case 'presentation':
        return (
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
            onViewProfile={() => handleTabChange('profile')}
            onStartConversation={() => handleTabChange('details')}
            dict={dict.suggestions.modal.header}
            profileCardDict={dict.profileCard}
          />
        );
      case 'profile':
        return (
          <div
            className="p-4 md:p-6 bg-gray-50 text-start"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            <ProfileTab
              profileWithUser={profileWithUser}
              isQuestionnaireLoading={isQuestionnaireLoading}
              targetParty={targetParty}
              questionnaire={questionnaire}
              locale={locale}
              onNavigateToDetails={() => handleTabChange('details')}
              dict={{
                modal: dict.suggestions.modal,
                profileCard: dict.profileCard,
              }}
            />
          </div>
        );
      case 'compatibility':
        return (
          <div className="p-4 md:p-6 bg-gray-50">
            <CompatibilityTab
              firstParty={suggestion.firstParty}
              secondParty={suggestion.secondParty}
              matchingReason={suggestion.matchingReason}
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
                compatibility: dict.suggestions.compatibility,
              }}
            />
          </div>
        );
      case 'details':
        return (
          <div className="p-4 md:p-6 bg-gray-50 min-h-[600px]">
            <DetailsTab
              suggestionId={suggestion.id}
              statusHistory={suggestion.statusHistory}
              matchmakerFirstName={suggestion.matchmaker?.firstName || ''}
              status={suggestion.status}
              targetPartyContact={targetParty ? {
                firstName: targetParty.firstName,
                lastName: targetParty.lastName,
                phone: targetParty.phone,
                email: targetParty.email,
              } : undefined}
              locale={locale}
              dict={{
                timeline: dict.suggestions.timeline,
                modal: dict.suggestions.modal,
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

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
        <ScrollArea className="flex-grow min-h-0 modal-scroll" ref={scrollAreaRef}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-full"
          >
            <TabHeader
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onClose={onClose}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              isMobile={isMobile}
              isTransitioning={isTransitioning}
              dict={dict.suggestions.modal.tabs}
              personName={targetParty.firstName}
              personAge={targetAge}
              statusLabel={statusInfo.shortLabel}
              statusBadgeClass={statusInfo.className}
            />

            {/* Animated tab content with swipe support */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait" initial={false} custom={tabDirection}>
                <motion.div
                  key={activeTab}
                  custom={tabDirection}
                  variants={tabAnimationVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {/* Hidden TabsContent to keep Radix Tabs state in sync */}
                  <TabsContent value={activeTab} className="mt-0" forceMount>
                    {renderActiveTab()}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
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
          onAskQuestion={() => handleTabChange('details')}
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
