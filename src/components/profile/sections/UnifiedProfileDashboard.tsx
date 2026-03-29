'use client';

import React from 'react';
import Link from 'next/link';
import type { User as SessionUserType } from '@/types/next-auth';

// Child Components
import { ProfileChecklist } from './ProfileChecklist';
import { NeshmaInsightButton } from './NeshmaInsightButton';
import { ShidduchCardButton } from './shidduch-card';
import HeartMapNudgeBanner from '@/components/profile/HeartMapNudgeBanner';
import { Lock, Eye } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Shared Profile Components
import {
  ProfileCard,
  PhotosSection,
  PreferencesSection,
  ProfileSection,
  QuestionnaireResponsesSection,
} from '@/components/profile';

// Loading Component
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import { cn } from '@/lib/utils';
import { ErrorBoundary, CardErrorBoundary } from '@/components/ui/error-boundary';

// Types
import type { ProfilePageDictionary } from '@/types/dictionary';

// Hook
import { useProfileDashboard } from './dashboard/useProfileDashboard';

interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
  initialTab?: string;
  dict: ProfilePageDictionary;
  locale: 'he' | 'en';
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
  initialTab = 'overview',
  dict,
  locale,
}) => {
  const {
    session,
    profileData,
    images,
    questionnaireResponse,
    activeTab,
    isCvUploading,
    isEditing,
    setIsEditing,
    isLoading,
    error,
    previewOpen,
    setPreviewOpen,
    hasSeenPreview,
    completionPercentage,
    setCompletionPercentage,
    sfCompleted,
    sfProgress,
    sfAnswers,
    isMobile,
    direction,
    isOwnProfile,
    questionnaireSyncedFields,
    handleTabChange,
    handleNavigateToQuestionnaire,
    handlePreviewClick,
    handleSave,
    handleImageUpload,
    handleSetMainImage,
    handleDeleteImage,
    handleQuestionnaireUpdate,
    handleCvUpload,
    handleCvDelete,
  } = useProfileDashboard({ viewOnly, userId, initialTab, dict, locale });

  // Loading state
  if (isLoading && !profileData) {
    return <StandardizedLoadingSpinner text={dict.dashboard.loadingData} />;
  }

  // Error state
  if (error && !profileData) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4"
        dir={direction}
      >
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription className="text-center">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const user = session?.user as SessionUserType | undefined;

  return (
    <div className="relative min-h-screen w-full" dir={direction}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-orange-50 animate-gradient-slow -z-10"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:30px_30px] -z-10"></div>

      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="space-y-6 md:space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isOwnProfile && !sfCompleted && (
            <div className="mb-4 md:mb-6">
              <HeartMapNudgeBanner locale={locale} />
            </div>
          )}

          {isOwnProfile && user && profileData && (
            <>
              <CardErrorBoundary>
                <ProfileChecklist
                  user={{ ...user, profile: profileData, images: images }}
                  hasSeenPreview={hasSeenPreview}
                  onPreviewClick={handlePreviewClick}
                  questionnaireResponse={questionnaireResponse}
                  dict={dict.dashboard.checklist}
                  locale={locale}
                  onNavigateToTab={handleTabChange}
                  onCompletionChange={setCompletionPercentage}
                  sfCompleted={sfCompleted}
                  sfProgress={sfProgress}
                />
              </CardErrorBoundary>
              <div id="neshama-insight-btn">
                <CardErrorBoundary>
                  <NeshmaInsightButton
                    userId={user.id}
                    locale={locale}
                    completionPercentage={completionPercentage}
                    lastGeneratedAt={user.neshamaInsightLastGeneratedAt}
                    generatedCount={user.neshamaInsightGeneratedCount || 0}
                    dict={dict.dashboard.neshmaInsightButton}
                    userRole={user.role}
                  />
                </CardErrorBoundary>
              </div>
              <div id="shidduch-card-btn">
                <CardErrorBoundary>
                  <ShidduchCardButton
                    userId={user.id}
                    locale={locale}
                    lastGeneratedAt={user.shidduchCardLastGeneratedAt}
                    generatedCount={user.shidduchCardGeneratedCount || 0}
                    userRole={user.role}
                    hasSoulFingerprint={sfCompleted}
                    dict={dict.dashboard.shidduchCardButton}
                  />
                </CardErrorBoundary>
              </div>
            </>
          )}

          {/* Preview Button + Dialog */}
          {!viewOnly && isOwnProfile && (
            <div
              id="onboarding-target-preview-profile"
              className="flex justify-center my-6 md:my-8"
            >
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handlePreviewClick}
                    variant="outline"
                    size="lg"
                    className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {dict.dashboard.previewButton}
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={cn(
                    'p-0 shadow-2xl border-none overflow-hidden flex flex-col transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-md',
                    isMobile
                      ? '!w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0 !transform-none'
                      : 'w-screen h-screen sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl sm:rounded-3xl'
                  )}
                  dir={direction}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex-shrink-0 w-full flex items-center justify-center py-2 bg-teal-50/80 border-b border-teal-100 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded-full shadow-sm max-w-[95%]">
                      <Lock className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="text-xs text-teal-700 font-medium text-center truncate sm:whitespace-normal">
                        {dict.dashboard.privacyAssurances.preview}
                      </span>
                    </div>
                  </div>

                  {profileData ? (
                    <div className="flex-1 min-h-0 w-full max-w-full overflow-hidden">
                      <ProfileCard
                        profile={profileData}
                        images={images}
                        questionnaire={questionnaireResponse}
                        sfAnswers={sfAnswers}
                        viewMode="candidate"
                        isProfileComplete={session?.user?.isProfileComplete ?? false}
                        onClose={() => setPreviewOpen(false)}
                        dict={dict.profileCard}
                        locale={locale}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-center text-gray-500 py-10">
                        {dict.dashboard.previewLoading}
                      </p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Privacy Banner */}
          {!viewOnly && isOwnProfile && (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 mb-6 bg-teal-50/80 border border-teal-200/60 rounded-full max-w-fit mx-auto">
              <Lock className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-teal-700 font-medium">
                {dict.dashboard.privacyAssurances.banner.text}
              </span>
              <span className="text-xs text-teal-600">
                {dict.dashboard.privacyAssurances.banner.subtext}
              </span>
            </div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center mb-6 md:mb-8">
              <ScrollArea dir={direction as 'rtl' | 'ltr'} className="w-auto max-w-full">
                <TabsList className="h-auto p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-md gap-1 inline-flex flex-nowrap">
                  {['overview', 'photos', 'preferences', 'questionnaire'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors duration-200 ease-in-out hover:bg-teal-100/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      {dict.dashboard.tabs[tab as keyof typeof dict.dashboard.tabs]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" className="mt-1" />
              </ScrollArea>
            </div>

            <div
              id="profile-tabs-content"
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-300 ease-in-out scroll-mt-4"
            >
              <TabsContent value="overview" id="overview-content" className="scroll-mt-24">
                <ErrorBoundary>
                  {profileData ? (
                    <ProfileSection
                      profile={profileData}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      onSave={handleSave}
                      viewOnly={viewOnly || !isOwnProfile}
                      onCvUpload={handleCvUpload}
                      onCvDelete={handleCvDelete}
                      isCvUploading={isCvUploading}
                      dict={dict.profileSection}
                      locale={locale}
                      questionnaireSyncedFields={questionnaireSyncedFields}
                      onNavigateToQuestionnaire={handleNavigateToQuestionnaire}
                      neshamaInsightTldr={(user?.neshamaInsightData as Record<string, unknown> | null)?.tldr as string | undefined}
                      onScrollToInsight={() => {
                        document.getElementById('neshama-insight-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    />
                  ) : (
                    <p className="text-center text-gray-500 py-10">{dict.dashboard.tabContent.loadingOverview}</p>
                  )}
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="photos" id="photos-content" className="scroll-mt-4">
                <ErrorBoundary>
                  <PhotosSection
                    images={images}
                    isUploading={isLoading}
                    disabled={viewOnly || !isOwnProfile}
                    onUpload={handleImageUpload}
                    onSetMain={handleSetMainImage}
                    onDelete={handleDeleteImage}
                    dict={dict.photosSection}
                    locale={locale}
                  />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="preferences" id="preferences-content" className="scroll-mt-4">
                <ErrorBoundary>
                  {profileData ? (
                    <PreferencesSection
                      profile={profileData}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      onChange={handleSave}
                      viewOnly={viewOnly || !isOwnProfile}
                      dictionary={dict.preferencesSection}
                      locale={locale}
                    />
                  ) : (
                    <p className="text-center text-gray-500 py-10">{dict.dashboard.tabContent.loadingPreferences}</p>
                  )}
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="questionnaire" id="questionnaire-content" className="scroll-mt-4">
                <ErrorBoundary>
                  {questionnaireResponse ? (
                    <QuestionnaireResponsesSection
                      questionnaire={questionnaireResponse}
                      onUpdate={handleQuestionnaireUpdate}
                      isEditable={!viewOnly && isOwnProfile}
                      dict={dict}
                      locale={locale}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      {isLoading
                        ? dict.dashboard.tabContent.loadingQuestionnaire
                        : dict.dashboard.tabContent.noQuestionnaire}
                      {!isLoading && isOwnProfile && (
                        <Button asChild variant="link" className="mt-2 text-teal-600">
                          <Link href="/questionnaire">{dict.dashboard.tabContent.fillQuestionnaireLink}</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </ErrorBoundary>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfileDashboard;
