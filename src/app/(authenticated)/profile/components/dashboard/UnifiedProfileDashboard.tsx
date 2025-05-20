"use client";

import React, { useState, useEffect } from "react"; // Added Dispatch, SetStateAction for clarity
import { useSession } from "next-auth/react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Shared Profile Components (Assuming these exist and are styled appropriately or accept props for styling)
import {
  ProfileCard,
  PhotosSection,
  PreferencesSection,
  ProfileSection,
  QuestionnaireResponsesSection,
} from "@/app/components/profile"; // Assuming correct path

// Types from next-auth.ts
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue,
} from "@/types/next-auth"; // Assuming correct path

interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
}

const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
}) => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false); // Global editing state - consider per-section if needed
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { update: updateSession } = useSession();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";
        const profileResponse = await fetch(profileUrl);
        const profileJson = await profileResponse.json();

        if (!profileResponse.ok || !profileJson.success) {
          throw new Error(profileJson.message || "Failed to load profile");
        }
        setProfileData(profileJson.profile);
        setImages(profileJson.images || []);

        const questionnaireUrl = userId
          ? `/api/profile/${userId}/questionnaire`
          : "/api/profile/questionnaire";
        const questionnaireResponse = await fetch(questionnaireUrl);
        const questionnaireJson = await questionnaireResponse.json();

        if (!questionnaireResponse.ok || !questionnaireJson.success) {
          console.warn(
            "Could not load questionnaire:",
            questionnaireJson.message
          );
          setQuestionnaireResponse(null);
        } else {
          setQuestionnaireResponse(questionnaireJson.questionnaireResponse);
        }
      } catch (err: unknown) {
        // שנה את any ל- unknown
        console.error("Failed to load profile data:", err);
        let errorMessage = "שגיאה בטעינת הנתונים"; // הגדר הודעת ברירת מחדל
        // בדוק אם השגיאה היא אובייקט Error סטנדרטי
        if (err instanceof Error) {
          errorMessage = err.message || errorMessage; // השתמש בהודעה שלו אם קיימת
        } else if (typeof err === "string") {
          // אפשר גם לטפל במקרה שזרקו מחרוזת כשגיאה
          errorMessage = err;
        }
        // רק עכשיו בטוח להשתמש ב-errorMessage
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // --- Handlers (Keep existing logic) ---
  const handleSave = async (formData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await updateSession();
        setProfileData((prev) => ({ ...prev, ...formData } as UserProfile));
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

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => {
    setIsLoading(true);
    try {
      const payload =
        value.type === "answer"
          ? { worldKey: world, questionId, value: value.value }
          : { worldKey: world, questionId, isVisible: value.isVisible };

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

  // --- Render Logic ---
  if (isLoading && !profileData) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50"
        dir="rtl"
      >
        <p className="text-lg text-cyan-600 animate-pulse">טוען נתונים...</p>
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

          <div className="flex justify-center my-6 md:my-8">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 text-base sm:text-lg gap-2 rounded-full border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  תצוגה מקדימה של הפרופיל{" "}
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-none"
                dir="rtl"
              >
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                    תצוגה מקדימה של הפרופיל
                  </DialogTitle>
                  <div className="pt-4">
                    <Select
                      value={isMatchmaker ? "matchmaker" : "candidate"}
                      onValueChange={(value) =>
                        setIsMatchmaker(value === "matchmaker")
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[200px] rounded-full border-gray-300 focus:border-cyan-500 focus:ring-cyan-500">
                        <SelectValue placeholder="בחר תצוגה..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem
                          value="candidate"
                          className="cursor-pointer"
                        >
                          תצוגת מועמד
                        </SelectItem>
                        <SelectItem
                          value="matchmaker"
                          className="cursor-pointer"
                        >
                          תצוגת שדכן
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogHeader>
                {profileData ? (
                  <ProfileCard
                    profile={profileData}
                    images={images}
                    questionnaire={questionnaireResponse}
                    viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    טוען תצוגה מקדימה...
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-6 md:mb-8">
              <TabsList className="h-auto p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow-md gap-1">
                <TabsTrigger
                  value="overview"
                  className="px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300"
                >
                  פרטים כלליים
                </TabsTrigger>

                <TabsTrigger
                  value="photos"
                  className="px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300"
                >
                  תמונות
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300"
                >
                  העדפות
                </TabsTrigger>
                <TabsTrigger
                  value="questionnaire"
                  className="px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium text-gray-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-100 data-[state=active]:to-pink-100 data-[state=active]:text-cyan-700 data-[state=active]:shadow-inner transition-all duration-300"
                >
                  שאלון
                </TabsTrigger>
              </TabsList>
            </div>

            <div
              key={activeTab}
              className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 transition-all duration-300 ease-in-out"
            >
              <TabsContent
                value="overview"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {profileData ? (
                  <ProfileSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSave}
                    viewOnly={viewOnly}
                    // **** FIX: Removed style props not defined in ProfileSectionProps ****
                    // saveButtonStyle="text-sm sm:text-base md:text-lg px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-white group relative overflow-hidden"
                    // editButtonStyle="text-sm sm:text-base px-6 py-3 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full transition-all duration-300"
                    // **** END FIX ****
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    טוען סקירה כללית...
                  </p>
                )}
              </TabsContent>

              <TabsContent
                value="photos"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <PhotosSection
                  images={images}
                  isUploading={isLoading}
                  disabled={viewOnly || isLoading}
                  onUpload={handleImageUpload}
                  onSetMain={handleSetMainImage}
                  onDelete={handleDeleteImage}
                  // **** FIX: Removed style props if not defined in PhotosSectionProps ****
                  // (You already fixed this part by asking how to add them to PhotosSectionProps,
                  // so assuming they are now defined there, keep them. If not, remove them.)
                  // uploadAreaStyle="border-dashed border-2 border-cyan-300 rounded-2xl p-8 text-center bg-cyan-50/50 hover:bg-cyan-50 transition-colors"
                  // imageCardStyle="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  // **** END FIX ****
                />
              </TabsContent>

              <TabsContent
                value="preferences"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {profileData ? (
                  <PreferencesSection
                    profile={profileData}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onChange={handleSave}
                    viewOnly={viewOnly}
                    // **** FIX: Removed style props if not defined in PreferencesSectionProps ****
                    // saveButtonStyle="..."
                    // editButtonStyle="..."
                    // **** END FIX ****
                  />
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    טוען העדפות...
                  </p>
                )}
              </TabsContent>

              <TabsContent
                value="questionnaire"
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                {questionnaireResponse ? (
                  <QuestionnaireResponsesSection
                    questionnaire={questionnaireResponse}
                    onUpdate={handleQuestionnaireUpdate}
                    isEditable={!viewOnly}
                    viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                    // **** FIX: Removed style prop not defined in QuestionnaireResponsesSectionProps ****
                    // questionContainerStyle="mb-4 p-4 bg-white/50 rounded-xl shadow-sm"
                    // **** END FIX ****
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {isLoading ? "טוען שאלון..." : "לא מולאו תשובות לשאלון."}
                    {!isLoading && !viewOnly && (
                      <Button
                        asChild
                        variant="link"
                        className="mt-2 text-cyan-600"
                      >
                        {/* TODO: Add Link component here pointing to questionnaire form */}
                        <a href="/questionnaire"> למילוי השאלון</a>
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

// Ensure necessary CSS for animations like animate-gradient-slow is in global CSS:
// .animate-gradient-slow { animation: gradient-anim 15s ease infinite; }
// @keyframes gradient-anim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

export default UnifiedProfileDashboard;
