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
import { AIProfileAdvisorDialog } from './AIProfileAdvisorDialog';

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
  UpdateValue, // <-- פתרון בעיית ה-any
} from '@/types/next-auth';
import type { ProfilePageDictionary } from '@/types/dictionary';

// Props interface for the component, now including the dictionary
interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
  initialTab?: string;
  dict: ProfilePageDictionary;
  locale: string; // Added locale prop
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
  initialTab = 'overview',
  dict,
  locale, // Destructure locale
}) => {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const router = useRouter();

  // State hooks
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
  const direction = locale === 'he' ? 'rtl' : 'ltr'; // Define direction based on locale

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
      // Fetch profile data
      const profileUrl = userId
        ? `/api/profile?userId=${userId}`
        : '/api/profile';
      const profileResponse = await fetch(profileUrl);
      const profileJson = await profileResponse.json();

      if (!profileResponse.ok || !profileJson.success) {
        throw new Error(profileJson.message || 'Failed to load profile');
      }
      console.log('---[ CLIENT LOG 1 ]--- Received Profile Data from API:');
      console.log(profileJson.profile);

      setProfileData(profileJson.profile);
      setImages(profileJson.images || []);
      if (profileJson.profile?.hasViewedProfilePreview) {
        setHasSeenPreview(true);
      }

      // Fetch questionnaire data
      const questionnaireUrl = userId
        ? `/api/profile/questionnaire?userId=${userId}`
        : '/api/profile/questionnaire';
      const questionnaireFetchResponse = await fetch(questionnaireUrl);

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
        toast.success(dict.dashboard.viewedPreviewSuccess);
        await updateSession();
      } catch (error) {
        console.error('Error in handlePreviewClick:', error);
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
        toast.success(dict.dashboard.updateSuccess);
        setError('');
      } else {
        const errorMessage = data.message || 'Profile update error';
        const translatedError = dict.dashboard.updateError.replace(
          '{{error}}',
          errorMessage
        );
        setError(translatedError);
        toast.error(translatedError);
      }
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = 'Profile update error';
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

  // --- השלמת הפונקציות החסרות עם תרגום ---

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const uploadedImages: UserImage[] = [];
    const failedUploads: string[] = [];
    const toastsDict = dict.photosSection.toasts;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const toastId = `upload-${i}`;
      const loadingMsg = dict.photosSection.uploadingMultiple.replace(
        '{{count}}',
        `${i + 1}/${files.length}`
      );

      try {
        toast.loading(loadingMsg, { id: toastId });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/profile/images', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success && data.image) {
          uploadedImages.push(data.image);
          toast.success(
            `${file.name} uploaded successfully!`, // This specific string is often kept in English for file names
            { id: toastId }
          );
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : toastsDict.uploadError;
        failedUploads.push(`${file.name}: ${errorMessage}`);
        toast.error(`${file.name}: ${errorMessage}`, { id: toastId });
      }
    }

    if (uploadedImages.length > 0) {
      setImages((prev) => [...prev, ...uploadedImages].slice(0, 10)); // Assuming max 10 images
      await updateSession();
      toast.success(
        toastsDict.uploadSuccess.replace(
          '{{count}}',
          String(uploadedImages.length)
        )
      );
      setError('');
    }

    if (failedUploads.length > 0 && uploadedImages.length === 0) {
      setError(toastsDict.uploadError);
      toast.error(toastsDict.uploadError);
    }

    setIsLoading(false);
  };

  const handleSetMainImage = async (imageId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/images/${imageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMain: true }),
      });
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
        await updateSession();
        toast.success(dict.photosSection.toasts.setMainSuccess);
        setError('');
      } else {
        const errorMsg = data.message || dict.photosSection.toasts.setMainError;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = dict.photosSection.toasts.setMainError;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageIds: string[]) => {
    if (!imageIds || imageIds.length === 0) {
      toast.info(dict.photosSection.toasts.selectOneError);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds }),
      });

      const data = await response.json();
      if (data.success) {
        setImages(data.images);
        await updateSession();
        const successMsg =
          imageIds.length > 1
            ? dict.photosSection.toasts.bulkDeleteSuccess.replace(
                '{{count}}',
                String(imageIds.length)
              )
            : dict.photosSection.toasts.singleDeleteSuccess;
        toast.success(successMsg);
        setError('');
      } else {
        const errorMsg =
          data.message || dict.photosSection.toasts.bulkDeleteError;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Delete image error:', err);
      setError(dict.photosSection.toasts.bulkDeleteError);
      toast.error(dict.photosSection.toasts.bulkDeleteError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: UpdateValue // <-- שימוש בטיפוס הנכון במקום any
  ) => {
    setIsLoading(true);
    try {
      const payload = { worldKey: world, questionId: questionId, value };
      const response = await fetch('/api/profile/questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setQuestionnaireResponse(data.data);
        toast.success(dict.dashboard.tabContent.questionnaireUpdateSuccess);
        setError('');
      } else {
        const errorMsg =
          data.message || dict.dashboard.tabContent.questionnaireUpdateError;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Failed to update questionnaire:', err);
      setError(dict.dashboard.tabContent.questionnaireUpdateError);
      toast.error(dict.dashboard.tabContent.questionnaireUpdateError);
    } finally {
      setIsLoading(false);
    }
  };

  // --- סוף החלק שהושלם ---

  if (isLoading && !profileData) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50"
        dir={direction} // Changed
      >
        <div className="flex items-center gap-2 text-lg text-cyan-600">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>{dict.dashboard.loadingData}</span>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4"
        dir={direction} // Changed
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

          {isOwnProfile && user && profileData && (
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
                dict={dict.dashboard.checklist}
                locale={locale} // Added
              />
              <div className="my-6 md:my-8 flex justify-center">
                <AIProfileAdvisorDialog
                  userId={user.id}
                  dict={dict.dashboard.aiAdvisor}
                  analysisDict={dict.dashboard.analysisResult}
                  locale={locale}
                />
              </div>
            </>
          )}

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
                    className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {dict.dashboard.previewButton}
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
                      locale={locale} // Pass locale to ProfileCard
                    />
                  ) : (
                    <p className="text-center text-gray-500 py-10">
                      {dict.dashboard.previewLoading}
                    </p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex justify-center mb-6 md:mb-8">
              <ScrollArea dir={direction} className="w-auto max-w-full">
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
                    locale={locale} // Pass locale
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
                  locale={locale}
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
                    locale={locale} // Pass locale
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
                    dict={dict}
                    locale={locale} // Pass locale
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
