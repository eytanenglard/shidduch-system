'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue,
} from '@/types/next-auth';
import type { ProfilePageDictionary } from '@/types/dictionary';
import type { QuestionnaireSyncedFields } from '../profile-cards/types';

interface UseProfileDashboardOptions {
  viewOnly: boolean;
  userId?: string;
  initialTab: string;
  dict: ProfilePageDictionary;
  locale: 'he' | 'en';
}

export function useProfileDashboard({
  viewOnly,
  userId,
  initialTab,
  dict,
  locale,
}: UseProfileDashboardOptions) {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const router = useRouter();

  // State
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
  const [sfCompleted, setSfCompleted] = useState(false);
  const [sfProgress, setSfProgress] = useState<{ total: number; answered: number } | undefined>(undefined);
  const [sfAnswers, setSfAnswers] = useState<Record<string, unknown> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const isOwnProfile = !userId || session?.user?.id === userId;

  // Mobile detection
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Sync tab with prop
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Soul fingerprint status
  useEffect(() => {
    fetch('/api/user/soul-fingerprint')
      .then(r => r.ok ? r.json() : null)
      .then(async (data) => {
        if (data?.profileTags?.completedAt) setSfCompleted(true);
        if (data?.profileTags?.sectionAnswers) {
          setSfAnswers(data.profileTags.sectionAnswers as Record<string, unknown>);
          try {
            const { computeSFProgress } = await import('@/components/soul-fingerprint/questions');
            const gender = profileData?.gender || null;
            const progress = computeSFProgress(data.profileTags.sectionAnswers, gender);
            setSfProgress(progress);
          } catch {
            const answers = data.profileTags.sectionAnswers as Record<string, unknown>;
            const answeredCount = Object.values(answers).filter(
              (v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
            ).length;
            if (answeredCount > 0) setSfProgress({ total: 30, answered: answeredCount });
          }
        }
      })
      .catch(() => {});
  }, [profileData?.gender]);

  // Questionnaire synced fields
  const questionnaireSyncedFields = useMemo<QuestionnaireSyncedFields>(() => {
    if (!questionnaireResponse) return {};

    const hasAnswer = (worldAnswers: unknown, questionId: string): boolean => {
      if (!Array.isArray(worldAnswers)) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return worldAnswers.some((a: any) => a.questionId === questionId && a.value !== undefined && a.value !== null);
    };

    return {
      smokingStatus: hasAnswer(questionnaireResponse.personalityAnswers, 'personality_smoking_status'),
      shomerNegiah: hasAnswer(questionnaireResponse.religionAnswers, 'religion_shomer_negiah_approach'),
      profileCharacterTraits: hasAnswer(questionnaireResponse.personalityAnswers, 'personality_core_trait_selection_revised'),
      about: hasAnswer(questionnaireResponse.personalityAnswers, 'personality_self_portrayal_revised'),
    };
  }, [questionnaireResponse]);

  // Tab change handler
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    router.push(`/${locale}/profile?tab=${newTab}`, { scroll: false });
    setTimeout(() => {
      const element = document.getElementById(`${newTab}-content`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        document.getElementById('profile-tabs-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }, [locale, router]);

  const handleNavigateToQuestionnaire = useCallback(() => {
    handleTabChange('questionnaire');
  }, [handleTabChange]);

  // Data loading with retry
  const loadData = useCallback(async (retryCount = 0) => {
    setIsLoading(true);
    if (retryCount === 0) setError('');

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1500;
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const profileUrl = userId ? `/api/profile?userId=${userId}` : '/api/profile';
      const profileResponse = await fetch(profileUrl);

      if (profileResponse.status === 401 && retryCount < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return loadData(retryCount + 1);
      }

      const profileJson = await profileResponse.json();
      if (!profileResponse.ok || !profileJson.success) {
        throw new Error(profileJson.message || 'Failed to load profile');
      }

      setProfileData(profileJson.profile);
      setImages(profileJson.images || []);
      if (profileJson.sfAnswers) setSfAnswers(profileJson.sfAnswers);
      if (profileJson.profile?.hasViewedProfilePreview) setHasSeenPreview(true);

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('locale', locale);

      const questionnaireFetchResponse = await fetch(`/api/profile/questionnaire?${params.toString()}`);
      if (questionnaireFetchResponse.status === 404) {
        setQuestionnaireResponse(null);
      } else if (questionnaireFetchResponse.ok) {
        const questionnaireJson = await questionnaireFetchResponse.json();
        setQuestionnaireResponse(questionnaireJson.success ? questionnaireJson.questionnaireResponse : null);
      } else {
        setQuestionnaireResponse(null);
      }
    } catch (err: unknown) {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return loadData(retryCount + 1);
      }
      let errorMessage = 'An unexpected error occurred.';
      if (err instanceof Error) errorMessage = err.message || errorMessage;
      const translatedError = dict.dashboard.loadError.replace('{{error}}', errorMessage);
      setError(translatedError);
      toast.error(translatedError);
    } finally {
      await minDelayPromise;
      setIsLoading(false);
    }
  }, [userId, dict, locale]);

  // CV handlers
  const handleCvUpload = async (file: File) => {
    setIsCvUploading(true);
    const cvToasts = dict.profileSection.cards.education.cvSection.toasts;
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/profile/cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to upload CV');
      if (data.profile) { setProfileData(data.profile); toast.success(cvToasts.uploadSuccess); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cvToasts.uploadError);
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
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to delete CV');
      if (data.profile) { setProfileData(data.profile); toast.success(cvToasts.deleteSuccess); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cvToasts.deleteError);
    } finally {
      setIsCvUploading(false);
    }
  };

  // Auto-load on auth
  useEffect(() => {
    if (sessionStatus === 'authenticated') loadData();
  }, [sessionStatus, loadData]);

  // Reload on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionStatus === 'authenticated') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData, sessionStatus]);

  // Preview handler
  const handlePreviewClick = async () => {
    setPreviewOpen(true);
    if (!hasSeenPreview) {
      try {
        const response = await fetch('/api/profile/viewed-preview', { method: 'POST' });
        if (!response.ok) throw new Error('Failed');
        setHasSeenPreview(true);
        toast.success(dict.dashboard.viewedPreviewSuccess);
        await updateSession();
      } catch {
        toast.error(dict.dashboard.viewedPreviewError);
      }
    }
  };

  // Save handler
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
        const translatedError = dict.dashboard.updateError.replace('{{error}}', data.message || 'Error');
        setError(translatedError);
        toast.error(translatedError);
      }
    } catch {
      const translatedError = dict.dashboard.updateError.replace('{{error}}', 'Unknown Error');
      setError(translatedError);
      toast.error(translatedError);
    } finally {
      setIsLoading(false);
    }
  };

  // Image handlers
  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    const uploadedImages: UserImage[] = [];
    const failedUploads: string[] = [];
    const toastsDict = dict.photosSection.toasts;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const toastId = `upload-${i}`;
      const loadingMsg = dict.photosSection.uploadingMultiple.replace('{{count}}', `${i + 1}/${files.length}`);
      try {
        toast.loading(loadingMsg, { id: toastId });
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/profile/images', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok && data.success && data.image) {
          uploadedImages.push(data.image);
          toast.success(`${file.name}`, { id: toastId });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : toastsDict.uploadError;
        failedUploads.push(`${file.name}: ${errorMessage}`);
        toast.error(`${file.name}: ${errorMessage}`, { id: toastId });
      }
    }

    if (uploadedImages.length > 0) {
      setImages((prev) => [...prev, ...uploadedImages].slice(0, 10));
      await updateSession();
      toast.success(toastsDict.uploadSuccess.replace('{{count}}', String(uploadedImages.length)));
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
    } catch {
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
        const successMsg = imageIds.length > 1
          ? dict.photosSection.toasts.bulkDeleteSuccess.replace('{{count}}', String(imageIds.length))
          : dict.photosSection.toasts.singleDeleteSuccess;
        toast.success(successMsg);
        setError('');
      } else {
        const errorMsg = data.message || dict.photosSection.toasts.bulkDeleteError;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      setError(dict.photosSection.toasts.bulkDeleteError);
      toast.error(dict.photosSection.toasts.bulkDeleteError);
    } finally {
      setIsLoading(false);
    }
  };

  // Questionnaire update
  const handleQuestionnaireUpdate = async (world: string, questionId: string, value: UpdateValue) => {
    try {
      const response = await fetch('/api/profile/questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldKey: world, questionId, value }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(dict.dashboard.tabContent.questionnaireUpdateSuccess);
        setError('');
        await loadData();
      } else {
        const errorMsg = data.message || dict.dashboard.tabContent.questionnaireUpdateError;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    } catch {
      setError(dict.dashboard.tabContent.questionnaireUpdateError);
      toast.error(dict.dashboard.tabContent.questionnaireUpdateError);
      setIsLoading(false);
    }
  };

  return {
    // State
    session,
    sessionStatus,
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

    // Handlers
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
  };
}
