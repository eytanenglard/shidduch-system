'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User as SessionUserType } from '@/types/next-auth';

// Child Components
import { ProfileChecklist } from './ProfileChecklist';
import { AIProfileAdvisorDialog } from './AIProfileAdvisorDialog';
import { NeshmaInsightButton } from './NeshmaInsightButton';
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
import { cn } from '@/lib/utils'; // ודאי שזה מיובא

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue,
} from '@/types/next-auth';
import type { ProfilePageDictionary } from '@/types/dictionary';

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
  console.log(`---[ CLIENT LOG ]--- Dashboard loaded. Tab: "${initialTab}"`);

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

  const [isCvUploading, setIsCvUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasSeenPreview, setHasSeenPreview] = useState(
    session?.user?.profile?.hasViewedProfilePreview || false
  );
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // --- START OF ADDITION ---
  const [isMobile, setIsMobile] = useState(false); // הוספה: סטייט לזיהוי מובייל
  // --- END OF ADDITION ---

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  // --- START OF ADDITION ---
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768); // 768px הוא נקודת השבירה המקובלת למובייל ב-Tailwind
    };
    checkDevice(); // בדיקה ראשונית
    window.addEventListener('resize', checkDevice); // האזנה לשינוי גודל חלון
    return () => window.removeEventListener('resize', checkDevice); // ניקוי בעת הסרה
  }, []);
  // --- END OF ADDITION ---

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/${locale}/profile?tab=${newTab}`, { scroll: false });

    setTimeout(() => {
      const elementId = `${newTab}-content`;
      const element = document.getElementById(elementId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const fallbackElement = document.getElementById('profile-tabs-content');
        if (fallbackElement) {
          fallbackElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }
    }, 150);
  };

  const isOwnProfile = !userId || session?.user?.id === userId;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    // --- הוספת שורה 1: יצירת הבטחה (Promise) שמסתיימת אחרי 2 שניות ---
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 2000));

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

      setProfileData(profileJson.profile);
      setImages(profileJson.images || []);
      if (profileJson.profile?.hasViewedProfilePreview) {
        setHasSeenPreview(true);
      }

      // Fetch questionnaire data
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('locale', locale);

      const questionnaireUrl = `/api/profile/questionnaire?${params.toString()}`;
      const questionnaireFetchResponse = await fetch(questionnaireUrl);

      if (questionnaireFetchResponse.status === 404) {
        setQuestionnaireResponse(null);
      } else if (questionnaireFetchResponse.ok) {
        const questionnaireJson = await questionnaireFetchResponse.json();
        if (questionnaireJson.success) {
          setQuestionnaireResponse(questionnaireJson.questionnaireResponse);
        } else {
          setQuestionnaireResponse(null);
        }
      } else {
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
      // --- הוספת שורה 2: המתנה לסיום הטיימר לפני הסתרת מסך הטעינה ---
      await minDelayPromise;
      setIsLoading(false);
    }
  }, [userId, dict, locale]);

  const handleCvUpload = async (file: File) => {
    setIsCvUploading(true);
    const cvToasts = dict.profileSection.cards.education.cvSection.toasts;

    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/profile/cv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload CV');
      }

      if (data.profile) {
        setProfileData(data.profile);
        toast.success(cvToasts.uploadSuccess);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : cvToasts.uploadError;
      toast.error(errorMessage);
    } finally {
      setIsCvUploading(false);
    }
  };

  const handleCvDelete = async () => {
    setIsCvUploading(true);
    const cvToasts = dict.profileSection.cards.education.cvSection.toasts;

    try {
      const response = await fetch('/api/profile/cv', { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete CV');
      }

      if (data.profile) {
        setProfileData(data.profile);
        toast.success(cvToasts.deleteSuccess);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : cvToasts.deleteError;
      toast.error(errorMessage);
    } finally {
      setIsCvUploading(false);
    }
  };

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
        if (!response.ok) throw new Error('Failed');
        setHasSeenPreview(true);
        toast.success(dict.dashboard.viewedPreviewSuccess);
        await updateSession();
      } catch (error) {
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
        const errorMessage = data.message || 'Error';
        const translatedError = dict.dashboard.updateError.replace(
          '{{error}}',
          errorMessage
        );
        setError(translatedError);
        toast.error(translatedError);
      }
    } catch (err) {
      const translatedError = dict.dashboard.updateError.replace(
        '{{error}}',
        'Unknown Error'
      );
      setError(translatedError);
      toast.error(translatedError);
    } finally {
      setIsLoading(false);
    }
  };

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
          toast.success(`${file.name}`, { id: toastId });
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
      setImages((prev) => [...prev, ...uploadedImages].slice(0, 10));
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
      setError(dict.photosSection.toasts.setMainError);
      toast.error(dict.photosSection.toasts.setMainError);
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
      setError(dict.photosSection.toasts.bulkDeleteError);
      toast.error(dict.photosSection.toasts.bulkDeleteError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => {
    try {
      const payload = { worldKey: world, questionId, value };
      const response = await fetch('/api/profile/questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(dict.dashboard.tabContent.questionnaireUpdateSuccess);
        setError('');
        await loadData();
      } else {
        const errorMsg =
          data.message || dict.dashboard.tabContent.questionnaireUpdateError;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to update questionnaire:', err);
      setError(dict.dashboard.tabContent.questionnaireUpdateError);
      toast.error(dict.dashboard.tabContent.questionnaireUpdateError);
      setIsLoading(false);
    }
  };

  // Render States
  if (isLoading && !profileData) {
    return <StandardizedLoadingSpinner text={dict.dashboard.loadingData} />;
  }

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
      {/* Updated Design Backgrounds */}
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

          {isOwnProfile && user && profileData && (
            <>
              <ProfileChecklist
                user={{ ...user, profile: profileData, images: images }}
                hasSeenPreview={hasSeenPreview}
                onPreviewClick={handlePreviewClick}
                questionnaireResponse={questionnaireResponse}
                dict={dict.dashboard.checklist}
                locale={locale}
                onNavigateToTab={handleTabChange}
                onCompletionChange={setCompletionPercentage}
              />
              <div className="my-6 md:my-8 flex justify-center">
                <AIProfileAdvisorDialog
                  userId={user.id}
                  dict={dict.dashboard.aiAdvisor}
                  analysisDict={dict.dashboard.analysisResult}
                  locale={locale}
                />
              </div>

              {/* Neshama Insight Button - Fully localized via dictionary */}
              <NeshmaInsightButton
                userId={user.id}
                locale={locale}
                completionPercentage={completionPercentage}
                lastGeneratedAt={user.neshamaInsightLastGeneratedAt}
                generatedCount={user.neshamaInsightGeneratedCount || 0}
                dict={dict.dashboard.neshmaInsightButton}
              />
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
                    className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {dict.dashboard.previewButton}
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  // --- START OF MODIFICATION ---
                  className={cn(
                    "p-0 shadow-2xl border-none overflow-hidden flex flex-col transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-md",
                    isMobile
                      ? "!w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0 !transform-none"
                      : "w-screen h-screen sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl sm:rounded-3xl"
                  )}
                  dir={direction}
                  onOpenAutoFocus={(e) => e.preventDefault()} // חשוב למנוע התנהגות פוקוס לא רצויה
                  // --- END OF MODIFICATION ---
                >
                  {/* Privacy Banner inside Preview */}
                  <div className="flex-shrink-0 w-full flex items-center justify-center py-2 bg-teal-50/80 border-b border-teal-100 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-teal-200 rounded-full shadow-sm max-w-[95%]">
                      <Lock className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="text-xs text-teal-700 font-medium text-center truncate sm:whitespace-normal">
                        {dict.dashboard.privacyAssurances.preview}
                      </span>
                    </div>
                  </div>

                  {profileData ? (
                    // --- FIX: הסרנו את p-4 sm:p-6 שגרם להטיה ימינה במובייל ---
                    <div className="flex-1 min-h-0 w-full max-w-full overflow-hidden">
                      <ProfileCard
                        profile={profileData}
                        images={images}
                        questionnaire={questionnaireResponse}
                        viewMode="candidate"
                        isProfileComplete={
                          session?.user?.isProfileComplete ?? false
                        }
                        // הסרנו את className="flex-1 min-h-0 w-full" מפה
                        onClose={() => setPreviewOpen(false)}
                        dict={dict.profileCard}
                        locale={locale}
                      />
                    </div>
                    // --- END OF MODIFICATION ---
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

          {/* Privacy Assurance Banner (Dashboard) */}
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

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex justify-center mb-6 md:mb-8">
              <ScrollArea dir={direction} className="w-auto max-w-full">
                {/* Updated Tab List Styling */}
                <TabsList className="h-auto p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-md gap-1 inline-flex flex-nowrap">
                  <TabsTrigger
                    value="overview"
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors duration-200 ease-in-out hover:bg-teal-100/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    {dict.dashboard.tabs.overview}
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors duration-200 ease-in-out hover:bg-teal-100/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    {dict.dashboard.tabs.photos}
                  </TabsTrigger>
                  <TabsTrigger
                    value="preferences"
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors duration-200 ease-in-out hover:bg-teal-100/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    {dict.dashboard.tabs.preferences}
                  </TabsTrigger>
                  <TabsTrigger
                    value="questionnaire"
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 transition-colors duration-200 ease-in-out hover:bg-teal-100/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    {dict.dashboard.tabs.questionnaire}
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" className="mt-1" />
              </ScrollArea>
            </div>

            <div
              id="profile-tabs-content"
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl transition-all duration-300 ease-in-out scroll-mt-4"
            >
              <TabsContent
                value="overview"
                id="overview-content"
                className="scroll-mt-24"
              >
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
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    {dict.dashboard.tabContent.loadingOverview}
                  </p>
                )}
              </TabsContent>
              <TabsContent
                value="photos"
                id="photos-content"
                className="scroll-mt-4"
              >
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
              <TabsContent
                value="preferences"
                id="preferences-content"
                className="scroll-mt-4"
              >
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
                  <p className="text-center text-gray-500 py-10">
                    {dict.dashboard.tabContent.loadingPreferences}
                  </p>
                )}
              </TabsContent>
              <TabsContent
                value="questionnaire"
                id="questionnaire-content"
                className="scroll-mt-4"
              >
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
                      <Button
                        asChild
                        variant="link"
                        className="mt-2 text-teal-600"
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