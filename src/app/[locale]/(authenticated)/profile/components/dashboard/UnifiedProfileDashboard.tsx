// src/app/[locale]/(authenticated)/profile/components/dashboard/UnifiedProfileDashboard.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User as SessionUserType } from '@/types/next-auth';

// Child Components
import { ProfileChecklist } from './ProfileChecklist';
import { AIProfileAdvisorDialog } from '../advisor/AIProfileAdvisorDialog';

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

// Icons
import { Eye, Loader2 } from 'lucide-react';

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from '@/types/next-auth';
import type { ProfilePageDictionary } from '@/types/dictionary'; // <-- שלב 1: ייבוא הטיפוס הנכון

// Props interface for the component, now including the dictionary
interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
  initialTab?: string;
  dict: ProfilePageDictionary; // <-- שלב 1: שימוש בטיפוס הנכון
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
  initialTab = 'overview',
  dict, // קבלת המילון המלא
}) => {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const router = useRouter();

  // State hooks remain the same
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasSeenPreview, setHasSeenPreview] = useState(
    session?.user?.profile?.hasViewedProfilePreview || false
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/profile?tab=${newTab}`, { scroll: false });
  };

  const isOwnProfile = !userId || session?.user?.id === userId;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Logic for fetching data remains the same...
      const profileUrl = userId
        ? `/api/profile?userId=${userId}`
        : '/api/profile';
      const profileResponse = await fetch(profileUrl);
      const profileJson = await profileResponse.json();

      if (!profileResponse.ok || !profileJson.success) {
        throw new Error(profileJson.message || 'Failed to load profile');
      }
      setProfileData(profileJson.profile);
      setImages(profileJson.images || []);
      if (profileJson.profile?.hasViewedProfilePreview) {
        setHasSeenPreview(true);
      }

      const questionnaireUrl = userId
        ? `/api/profile/questionnaire?userId=${userId}`
        : '/api/profile/questionnaire';
      const questionnaireFetchResponse = await fetch(questionnaireUrl);

      // ... logic for questionnaire response ...
      if (questionnaireFetchResponse.status === 404) {
        setQuestionnaireResponse(null);
      } else if (questionnaireFetchResponse.ok) {
        const questionnaireJson = await questionnaireFetchResponse.json();
        if (questionnaireJson.success) {
          setQuestionnaireResponse(questionnaireJson.questionnaireResponse);
        } else {
          console.warn(
            'Could not load questionnaire. Reason:',
            questionnaireJson.message
          );
          setQuestionnaireResponse(null);
        }
      } else {
        console.error(
          'Failed to fetch questionnaire data. Status:',
          questionnaireFetchResponse.status
        );
        setQuestionnaireResponse(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load profile data:', err);
      let errorMessage = 'An unexpected error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      // Use dictionary for error message
      const translatedError = dict.dashboard.loadError.replace(
        '{{error}}',
        errorMessage
      );
      setError(translatedError);
      toast.error(translatedError);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dict]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      loadData();
    }
  }, [sessionStatus, loadData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        sessionStatus === 'authenticated'
      ) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData, sessionStatus]);

  const handlePreviewClick = async () => {
    setPreviewOpen(true);
    if (!hasSeenPreview) {
      try {
        const response = await fetch('/api/profile/viewed-preview', {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to update preview status');
        }
        setHasSeenPreview(true);
        // Use dictionary for success toast
        toast.success(dict.dashboard.viewedPreviewSuccess);
        await updateSession();
      } catch (error) {
        console.error('Error in handlePreviewClick:', error);
        // Use dictionary for error toast
        toast.error(dict.dashboard.viewedPreviewError);
      }
    }
  };

  const handleSave = async (formData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success && data.profile) {
        await updateSession();
        setProfileData(data.profile);
        setIsEditing(false);
        // Use dictionary for success toast
        toast.success(dict.dashboard.updateSuccess);
        setError('');
      } else {
        const errorMessage = data.message || 'שגיאה בעדכון הפרופיל';
        // Use dictionary for error message and toast
        const translatedError = dict.dashboard.updateError.replace(
          '{{error}}',
          errorMessage
        );
        setError(translatedError);
        toast.error(translatedError);
      }
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = 'שגיאה בעדכון הפרופיל';
      const translatedError = dict.dashboard.updateError.replace(
        '{{error}}',
        errorMessage
      );
      setError(translatedError);
      toast.error(translatedError);
    } finally {
      setIsLoading(false);
    }
  };

  // Image handling and other functions remain the same logic,
  // but any user-facing strings inside them should be replaced.
  // For brevity, only showing the updated parts in the JSX.
  const handleImageUpload = async (files: File[]) => {
    /* ... logic ... */
  };
  const handleSetMainImage = async (imageId: string) => {
    /* ... logic ... */
  };
  const handleDeleteImage = async (imageIds: string[]) => {
    /* ... logic ... */
  };
  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: any
  ) => {
    /* ... logic ... */
  };

  if (isLoading && !profileData) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50"
        dir="rtl"
      >
        <div className="flex items-center gap-2 text-lg text-cyan-600">
          <Loader2 className="animate-spin h-6 w-6" />
          {/* Use dictionary for loading text */}
          <span>{dict.dashboard.loadingData}</span>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4"
        dir="rtl"
      >
        <Alert variant="destructive" className="max-w-md mx-auto">
          {/* The `error` state variable already contains the translated string */}
          <AlertDescription className="text-center">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const user = session?.user as SessionUserType | undefined;

  return (
    <div className="relative min-h-screen w-full" dir="rtl">
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow -z-10"
        style={{ backgroundSize: '400% 400%' }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:30px_30px] -z-10"></div>
      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="space-y-6 md:space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isOwnProfile && user && (
            <>
              <ProfileChecklist
                user={{
                  ...user,
                  profile: profileData,
                  images: images,
                }}
                hasSeenPreview={hasSeenPreview}
                onPreviewClick={handlePreviewClick}
                questionnaireResponse={questionnaireResponse}
                // Pass the relevant dictionary part to the child component
                dict={dict.dashboard.checklist}
              />
              <div className="my-6 md:my-8 text-center">
                <AIProfileAdvisorDialog
                  userId={user.id}
                  // Pass the relevant dictionary part to the child component
                  dict={dict.dashboard.aiAdvisor}
                  analysisDict={dict.dashboard.analysisResult}
                />
              </div>
            </>
          )}

          {!viewOnly && isOwnProfile && (
            <div className="flex justify-center my-6 md:my-8">
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
                      className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      {/* Use dictionary for button text */}
                      {dict.dashboard.previewButton}{' '}
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-screen h-screen sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl p-0 bg-white/95 backdrop-blur-md sm:rounded-3xl shadow-2xl border-none overflow-hidden">
                    {profileData ? (
                      <ProfileCard
                        profile={profileData}
                        images={images}
                        questionnaire={questionnaireResponse}
                        viewMode="candidate"
                        isProfileComplete={
                          session?.user?.isProfileComplete ?? false
                        }
                        className="h-full"
                        onClose={() => setPreviewOpen(false)}
                        dict={dict.profileCard}
                      />
                    ) : (
                      <p className="text-center text-gray-500 py-10">
                        {/* Use dictionary for loading text */}
                        {dict.dashboard.previewLoading}
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex justify-center mb-6 md:mb-8">
              <ScrollArea dir="rtl" className="w-auto max-w-full">
                <TabsList className="h-auto p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-md gap-1 inline-flex flex-nowrap">
                  <TabsTrigger value="overview">
                    {dict.dashboard.tabs.overview}
                  </TabsTrigger>
                  <TabsTrigger value="photos">
                    {dict.dashboard.tabs.photos}
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    {dict.dashboard.tabs.preferences}
                  </TabsTrigger>
                  <TabsTrigger value="questionnaire">
                    {dict.dashboard.tabs.questionnaire}
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" className="mt-1" />
              </ScrollArea>
            </div>
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 transition-all duration-300 ease-in-out">
              <TabsContent value="overview">
                {profileData ? (
                  <ProfileSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                    dict={dict.profileSection}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    {dict.dashboard.tabContent.loadingOverview}
                  </p>
                )}
              </TabsContent>
              <TabsContent value="photos">
                <PhotosSection
                  images={images}
                  isUploading={isLoading}
                  disabled={viewOnly || !isOwnProfile}
                  onUpload={handleImageUpload}
                  onSetMain={handleSetMainImage}
                  onDelete={handleDeleteImage}
                  dict={dict.photosSection}
                />
              </TabsContent>
              <TabsContent value="preferences">
                {profileData ? (
                  <PreferencesSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onChange={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                    dictionary={dict.preferencesSection}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    {dict.dashboard.tabContent.loadingPreferences}
                  </p>
                )}
              </TabsContent>
              <TabsContent value="questionnaire">
                {questionnaireResponse ? (
                  <QuestionnaireResponsesSection
                    questionnaire={questionnaireResponse}
                    onUpdate={handleQuestionnaireUpdate}
                    isEditable={!viewOnly && isOwnProfile}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {isLoading
                      ? dict.dashboard.tabContent.loadingQuestionnaire
                      : dict.dashboard.tabContent.noQuestionnaire}
                    {!isLoading && isOwnProfile && (
                      <Button
                        asChild
                        variant="link"
                        className="mt-2 text-cyan-600"
                      >
                        <Link href="/questionnaire">
                          {dict.dashboard.tabContent.fillQuestionnaireLink}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfileDashboard;
