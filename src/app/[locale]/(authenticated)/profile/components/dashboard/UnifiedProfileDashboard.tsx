'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User as SessionUserType } from '@/types/next-auth';

import { ProfileChecklist } from './ProfileChecklist';
import { AIProfileAdvisorDialog } from '../advisor/AIProfileAdvisorDialog';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'; // *** הוספתי DialogClose ***
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
import { Eye, Loader2, Sparkles, X } from 'lucide-react'; // *** הוספתי X ***

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue,
} from '@/types/next-auth';

interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
  initialTab?: string;
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
  initialTab = 'overview',
}) => {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const router = useRouter();

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
      let errorMessage = 'שגיאה בטעינת הנתונים';
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

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
        toast.success("תודה! שלב 'הצפייה בתצוגה' הושלם.");
        await updateSession();
      } catch (error) {
        console.error('Error in handlePreviewClick:', error);
        toast.error('שגיאה בעדכון סטטוס הצפייה בתצוגה המקדימה.');
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
        toast.success('הפרופיל עודכן בהצלחה');
        setError('');
      } else {
        setError(data.message || 'שגיאה בעדכון הפרופיל');
        toast.error(data.message || 'שגיאה בעדכון הפרופיל');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('שגיאה בעדכון הפרופיל');
      toast.error('שגיאה בעדכון הפרופיל');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const uploadedImages: UserImage[] = [];
    const failedUploads: string[] = [];

    const uploadWithRetry = async (
      file: File,
      retries = 1
    ): Promise<UserImage | null> => {
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          const response = await fetch('/api/profile/images', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const data = await response.json();
          if (data.success && data.image) {
            return data.image;
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (err) {
          console.error(
            `[Upload] Attempt ${attempt} failed for ${file.name}:`,
            err
          );

          if (attempt === retries + 1) {
            if (err instanceof Error && err.name === 'AbortError') {
              throw new Error('Upload timed out - server might be slow');
            }
            throw err;
          }

          if (!(err instanceof Error && err.name === 'AbortError')) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          }
        }
      }
      return null;
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          toast.loading(`מעלה ${file.name}... (${i + 1}/${files.length})`, {
            id: `upload-${i}`,
          });

          const uploadedImage = await uploadWithRetry(file);

          if (uploadedImage) {
            uploadedImages.push(uploadedImage);
            toast.success(`${file.name} הועלה בהצלחה!`, {
              id: `upload-${i}`,
            });
          }
        } catch (err) {
          console.error(`[Upload] Final error for ${file.name}:`, err);
          const errorMessage =
            err instanceof Error ? err.message : 'שגיאה לא ידועה';
          failedUploads.push(`${file.name}: ${errorMessage}`);
          toast.error(`נכשל: ${file.name} - ${errorMessage}`, {
            id: `upload-${i}`,
          });
        }
      }

      if (uploadedImages.length > 0) {
        setImages((prev) => [...prev, ...uploadedImages]);
        await updateSession();

        const successCount = uploadedImages.length;
        const totalCount = files.length;

        if (successCount === totalCount) {
          toast.success(`כל ${successCount} התמונות הועלו בהצלחה!`);
        } else {
          toast.success(
            `${successCount} מתוך ${totalCount} תמונות הועלו בהצלחה.`
          );
        }

        setError('');
      }

      if (failedUploads.length > 0 && uploadedImages.length === 0) {
        setError('כל ההעלאות נכשלו - בדוק חיבור אינטרנט ונסה שוב');
        toast.error('כל ההעלאות נכשלו - נסה שוב');
      }
    } catch (err) {
      console.error('[Upload] General error:', err);
      setError('שגיאה כללית בהעלאת התמונות');
      toast.error('שגיאה כללית בהעלאת התמונות');
    } finally {
      setIsLoading(false);
    }
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
        toast.success('התמונה הראשית עודכנה בהצלחה');
        setError('');
      } else {
        setError(data.message || 'שגיאה בעדכון התמונה הראשית');
        toast.error(data.message || 'שגיאה בעדכון התמונה הראשית');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // החלף את הפונקציה הקיימת בזו:
  const handleDeleteImage = async (imageIds: string[]) => {
    if (!imageIds || imageIds.length === 0) {
      toast.info('לא נבחרו תמונות למחיקה.');
      return;
    }

    setIsLoading(true);
    try {
      // אנחנו משתמשים בנקודת קצה חדשה שמטפלת במחיקה מרובה
      const response = await fetch(`/api/profile/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }), // שלח מערך של מזהים
      });

      const data = await response.json();
      if (data.success) {
        // השרת מחזיר את רשימת התמונות המעודכנת
        setImages(data.images);
        await updateSession();
        toast.success(
          `${imageIds.length} תמונ${imageIds.length > 1 ? 'ות' : 'ה'} נמחקו בהצלחה`
        );
        setError('');
      } else {
        setError(data.message || 'שגיאה במחיקת התמונה');
        toast.error(data.message || 'שגיאה במחיקת התמונה');
      }
    } catch (err) {
      console.error('Delete image error:', err);
      setError('שגיאה במחיקת התמונה');
      toast.error('שגיאה במחיקת התמונה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: UpdateValue
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
        toast.success('השאלון עודכן בהצלחה');
        setError('');
      } else {
        setError(data.message || 'שגיאה בעדכון השאלון');
        toast.error(data.message || 'שגיאה בעדכון השאלון');
      }
    } catch (err) {
      console.error('Failed to update questionnaire:', err);
      setError('שגיאה בעדכון השאלון');
      toast.error('שגיאה בעדכון השאלון');
    } finally {
      setIsLoading(false);
    }
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
          <span>טוען נתונים...</span>
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
                  ...user, // לוקח את הבסיס מהסשן (id, name, role וכו')
                  profile: profileData, // <-- כאן התיקון! דורסים את הפרופיל בפרופיל המעודכן מה-API
                  images: images, // מוסיפים את התמונות שנטענו
                }}
                hasSeenPreview={hasSeenPreview}
                onPreviewClick={handlePreviewClick}
                questionnaireResponse={questionnaireResponse}
              />
              <div className="my-6 md:my-8 text-center">
                <AIProfileAdvisorDialog userId={user.id} />
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
                      תצוגה מקדימה של הפרופיל{' '}
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </DialogTrigger>
                  {/*
                    ---
                    שינוי לפתרון נקודה 1: הוספת כפתור סגירה ייעודי
                    - DialogContent: הוספתי `overflow-hidden` כדי למנוע מהגלילה של התוכן להסתיר את כפתור הסגירה.
                    - DialogClose: הוספתי כפתור סגירה (X) שיהיה תמיד נגיש בפינה השמאלית העליונה (ימין ב-RTL), גם במובייל וגם בדסקטופ.
                    - ProfileCard: מקבל כעת `className="h-full"` כדי לאפשר גלילה פנימית בתוך הכרטיס עצמו.
                    ---
                  */}
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
                      />
                    ) : (
                      <p className="text-center text-gray-500 py-10">
                        טוען תצוגה מקדימה...
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
                  <TabsTrigger
                    value="overview"
                    className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300 whitespace-nowrap"
                  >
                    פרטים כלליים
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300 whitespace-nowrap"
                  >
                    תמונות
                  </TabsTrigger>
                  <TabsTrigger
                    value="preferences"
                    className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300 whitespace-nowrap"
                  >
                    העדפות
                  </TabsTrigger>
                  <TabsTrigger
                    value="questionnaire"
                    className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300 whitespace-nowrap"
                  >
                    שאלון
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" className="mt-1" />
              </ScrollArea>
            </div>
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 transition-all duration-300 ease-in-out">
              <TabsContent
                value="overview"
                id="onboarding-target-edit-profile"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {profileData ? (
                  <ProfileSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    טוען סקירה כללית...
                  </p>
                )}
              </TabsContent>
              <TabsContent
                value="photos"
                id="onboarding-target-photos"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <PhotosSection
                  images={images}
                  isUploading={isLoading}
                  disabled={viewOnly || !isOwnProfile}
                  onUpload={handleImageUpload}
                  onSetMain={handleSetMainImage}
                  onDelete={handleDeleteImage}
                />
              </TabsContent>
              <TabsContent
                value="preferences"
                id="onboarding-target-preferences"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {profileData ? (
                  <PreferencesSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onChange={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    טוען העדפות...
                  </p>
                )}
              </TabsContent>
              <TabsContent
                value="questionnaire"
                id="onboarding-target-questionnaire-tab"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {questionnaireResponse ? (
                  <QuestionnaireResponsesSection
                    questionnaire={questionnaireResponse}
                    onUpdate={handleQuestionnaireUpdate}
                    isEditable={!viewOnly && isOwnProfile}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {isLoading ? 'טוען שאלון...' : 'לא מולאו תשובות לשאלון.'}
                    {!isLoading && isOwnProfile && (
                      <Button
                        asChild
                        variant="link"
                        className="mt-2 text-cyan-600"
                      >
                        <Link href="/questionnaire"> למילוי השאלון</Link>
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
