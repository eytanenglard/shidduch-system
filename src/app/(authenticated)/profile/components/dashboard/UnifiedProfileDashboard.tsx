// src/app/(authenticated)/profile/components/dashboard/UnifiedProfileDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User as SessionUserType } from '@/types/next-auth';

// --- Import a ProfileChecklist component that will be created next ---
import { ProfileChecklist } from "./ProfileChecklist";

// UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Shared Profile Components
import {
  ProfileCard,
  PhotosSection,
  PreferencesSection,
  ProfileSection,
  QuestionnaireResponsesSection,
} from "@/app/components/profile";

// Icons
import { Eye, Edit, Pencil, Save, X, Loader2 } from "lucide-react";

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue,
} from "@/types/next-auth";

interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
}) => {
  const { data: session, status: sessionStatus } = useSession();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<QuestionnaireResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const { update: updateSession } = useSession();

  // Determine if the user is viewing their own profile
  const isOwnProfile = !userId || (session?.user?.id === userId);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const profileUrl = userId ? `/api/profile?userId=${userId}` : "/api/profile";
      const profileResponse = await fetch(profileUrl);
      const profileJson = await profileResponse.json();

      if (!profileResponse.ok || !profileJson.success) {
        throw new Error(profileJson.message || "Failed to load profile");
      }
      setProfileData(profileJson.profile);
      setImages(profileJson.images || []);

      const questionnaireUrl = userId ? `/api/profile/questionnaire?userId=${userId}` : "/api/profile/questionnaire";
      const questionnaireResponse = await fetch(questionnaireUrl);
      const questionnaireJson = await questionnaireResponse.json();

      if (!questionnaireResponse.ok || !questionnaireJson.success) {
        console.warn("Could not load questionnaire:", questionnaireJson.message);
        setQuestionnaireResponse(null);
      } else {
        setQuestionnaireResponse(questionnaireJson.questionnaireResponse);
      }
    } catch (err: unknown) {
      console.error("Failed to load profile data:", err);
      let errorMessage = "שגיאה בטעינת הנתונים";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ensureDateObject = (value: string | number | Date | null | undefined): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }
    return undefined;
  };

  const handleSave = async (formData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success && data.profile) {
        await updateSession();
        const serverProfile = data.profile as UserProfile;
        const processedProfile: UserProfile = {
          ...serverProfile,
          birthDate: ensureDateObject(serverProfile.birthDate)!,
          createdAt: ensureDateObject(serverProfile.createdAt)!,
          updatedAt: ensureDateObject(serverProfile.updatedAt)!,
          lastActive: ensureDateObject(serverProfile.lastActive),
          availabilityUpdatedAt: ensureDateObject(serverProfile.availabilityUpdatedAt),
        };
        setProfileData(processedProfile);
        setIsEditing(false);
        toast.success("הפרופיל עודכן בהצלחה");
        setError("");
      } else {
        setError(data.message || "שגיאה בעדכון הפרופיל");
        toast.error(data.message || "שגיאה בעדכון הפרופיל");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("שגיאה בעדכון הפרופיל");
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setImages((prev) => [...prev, data.image]);
        await updateSession();
        toast.success("התמונה הועלתה בהצלחה");
        setError("");
      } else {
        setError(data.message || "שגיאה בהעלאת התמונה");
        toast.error(data.message || "שגיאה בהעלאת התמונה");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("שגיאה בהעלאת התמונה");
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/images/${imageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMain: true }),
      });
      const data = await response.json();
      if (data.success) {
        setImages(data.images);
        await updateSession();
        toast.success("התמונה הראשית עודכנה בהצלחה");
        setError("");
      } else {
        setError(data.message || "שגיאה בעדכון התמונה הראשית");
        toast.error(data.message || "שגיאה בעדכון התמונה הראשית");
      }
    } catch (err) {
      console.error("Set main image error:", err);
      setError("שגיאה בעדכון התמונה הראשית");
      toast.error("שגיאה בעדכון התמונה הראשית");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        await updateSession();
        toast.success("התמונה נמחקה בהצלחה");
        setError("");
      } else {
        setError(data.message || "שגיאה במחיקת התמונה");
        toast.error(data.message || "שגיאה במחיקת התמונה");
      }
    } catch (err) {
      console.error("Delete image error:", err);
      setError("שגיאה במחיקת התמונה");
      toast.error("שגיאה במחיקת התמונה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireUpdate = async (world: string, questionId: string, value: UpdateValue) => {
    setIsLoading(true);
    try {
      const payload = { worldKey: world, questionId: questionId, value };
      const response = await fetch("/api/profile/questionnaire", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setQuestionnaireResponse(data.data);
        toast.success("השאלון עודכן בהצלחה");
        setError("");
      } else {
        setError(data.message || "שגיאה בעדכון השאלון");
        toast.error(data.message || "שגיאה בעדכון השאלון");
      }
    } catch (err) {
      console.error("Failed to update questionnaire:", err);
      setError("שגיאה בעדכון השאלון");
      toast.error("שגיאה בעדכון השאלון");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50" dir="rtl">
        <div className="flex items-center gap-2 text-lg text-cyan-600">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4" dir="rtl">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription className="text-center">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const user = session?.user as SessionUserType | undefined;
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden" dir="rtl">
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-pink-50 animate-gradient-slow -z-10"
        style={{ backgroundSize: "400% 400%" }}
      />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:30px_30px] -z-10"></div>

      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="space-y-6 md:space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* --- Conditionally render ProfileChecklist --- */}
        {isOwnProfile && user && (
  <ProfileChecklist 
    user={user} 
    onPreviewClick={() => setPreviewOpen(true)} 
  />
)}


          {!viewOnly && isOwnProfile && (
            <div className="flex justify-center my-6 md:my-8">
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    תצוגה מקדימה של הפרופיל{" "}
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-none"
                  dir="rtl"
                >
                  {profileData ? (
                    <ProfileCard
                      profile={profileData}
                      images={images}
                      questionnaire={questionnaireResponse}
                      viewMode="candidate"
                    />
                  ) : (
                    <p className="text-center text-gray-500 py-10">
                      טוען תצוגה מקדימה...
                    </p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
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

            <div
              key={activeTab}
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 transition-all duration-300 ease-in-out"
            >
              <TabsContent value="overview" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {profileData ? (
                  <ProfileSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">טוען סקירה כללית...</p>
                )}
              </TabsContent>

              <TabsContent value="photos" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                <PhotosSection
                  images={images}
                  isUploading={isLoading}
                  disabled={viewOnly || !isOwnProfile}
                  onUpload={handleImageUpload}
                  onSetMain={handleSetMainImage}
                  onDelete={handleDeleteImage}
                />
              </TabsContent>

              <TabsContent value="preferences" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {profileData ? (
                  <PreferencesSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onChange={handleSave}
                    viewOnly={viewOnly || !isOwnProfile}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">טוען העדפות...</p>
                )}
              </TabsContent>

              <TabsContent value="questionnaire" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                {questionnaireResponse ? (
                  <QuestionnaireResponsesSection
                    questionnaire={questionnaireResponse}
                    onUpdate={handleQuestionnaireUpdate}
                    isEditable={!viewOnly && isOwnProfile}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {isLoading ? "טוען שאלון..." : "לא מולאו תשובות לשאלון."}
                    {!isLoading && isOwnProfile && (
                      <Button asChild variant="link" className="mt-2 text-cyan-600">
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