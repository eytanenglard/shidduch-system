"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Eye, User, MapPin, Scroll, Clock } from "lucide-react";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic Imports
const DynamicTabs = dynamic(
  () => import('@/components/ui/tabs').then((mod) => ({
    default: mod.Tabs,
  })),
  { ssr: false }
);

const DynamicTabsContent = dynamic(
  () => import('@/components/ui/tabs').then((mod) => ({
    default: mod.TabsContent,
  })),
  { ssr: false }
);

const DynamicTabsList = dynamic(
  () => import('@/components/ui/tabs').then((mod) => ({
    default: mod.TabsList,
  })),
  { ssr: false }
);

const DynamicTabsTrigger = dynamic(
  () => import('@/components/ui/tabs').then((mod) => ({
    default: mod.TabsTrigger,
  })),
  { ssr: false }
);

const DynamicDialog = dynamic(
  () => import('@/components/ui/dialog').then((mod) => ({
    default: mod.Dialog,
  })),
  { ssr: false }
);

const DynamicDialogContent = dynamic(
  () => import('@/components/ui/dialog').then((mod) => ({
    default: mod.DialogContent,
  })),
  { ssr: false }
);

const DynamicDialogHeader = dynamic(
  () => import('@/components/ui/dialog').then((mod) => ({
    default: mod.DialogHeader,
  })),
  { ssr: false }
);

const DynamicDialogTrigger = dynamic(
  () => import('@/components/ui/dialog').then((mod) => ({
    default: mod.DialogTrigger,
  })),
  { ssr: false }
);

const DynamicDialogTitle = dynamic(
  () => import('@/components/ui/dialog').then((mod) => ({
    default: mod.DialogTitle,
  })),
  { ssr: false }
);

// Shared Profile Components
import {
  ProfileCard,
  PhotosSection,
  ExtendedProfileSection,
  PreferencesSection,
  ProfileSection,
  QuestionnaireResponsesSection,
  StatsCard,
} from "@/app/components/shared/shared/profile";

// Types
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from "@/types/next-auth";

const QUICK_STATS = [
  {
    key: "maritalStatus",
    title: "מצב משפחתי",
    icon: User,
    getValue: (profile: UserProfile) => profile.maritalStatus || "לא צוין",
  },
  {
    key: "location",
    title: "מיקום",
    icon: MapPin,
    getValue: (profile: UserProfile) => profile.city || "לא צוין",
  },
  {
    key: "religiousLevel",
    title: "רמת דתיות",
    icon: Scroll,
    getValue: (profile: UserProfile) => profile.religiousLevel || "לא צוין",
  },
  {
    key: "availability",
    title: "סטטוס פניות",
    icon: Clock,
    getValue: (profile: UserProfile) => profile.availabilityStatus || "לא צוין",
  },
];

interface UnifiedProfileDashboardProps {
  viewOnly?: boolean;
  userId?: string;
}
const UnifiedProfileDashboard: React.FC<UnifiedProfileDashboardProps> = ({
  viewOnly = false,
  userId,
}) => {
  // State
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { update: updateSession } = useSession();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load profile data
        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        if (profileData.success) {
          setProfileData(profileData.profile);
          setImages(profileData.images || []);
        }

        // Load questionnaire data
        const questionnaireUrl = userId
          ? `/api/profile/${userId}/questionnaire`
          : "/api/profile/questionnaire";
        const questionnaireResponse = await fetch(questionnaireUrl);
        const questionnaireData = await questionnaireResponse.json();

        if (
          questionnaireData.success &&
          questionnaireData.questionnaireResponse
        ) {
          setQuestionnaireResponse(questionnaireData.questionnaireResponse);
        }
      } catch (error) {
        console.error("Failed to load profile data:", error);
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Handlers
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
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("שגיאה בעדכון הפרופיל");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

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
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("שגיאה בהעלאת התמונה");
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/profile/images/${imageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const data = await response.json();
      if (data.success) {
        setImages(data.images);
        await updateSession();
        toast.success("התמונה הראשית עודכנה בהצלחה");
      }
    } catch (error) {
      console.error("Failed to set main image:", error);
      toast.error("שגיאה בעדכון התמונה הראשית");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/profile/images/${imageId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        await updateSession();
        toast.success("התמונה נמחקה בהצלחה");
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("שגיאה במחיקת התמונה");
    }
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    update:
      | { type: "answer"; value: string }
      | { type: "visibility"; isVisible: boolean }
  ) => {
    try {
      const response = await fetch("/api/profile/questionnaire", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldKey: world,
          questionId,
          value: update.type === "answer" ? update.value : undefined,
          isVisible:
            update.type === "visibility" ? update.isVisible : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setQuestionnaireResponse(data.data);
        toast.success("השאלון עודכן בהצלחה");
      }
    } catch (error) {
      console.error("Failed to update questionnaire:", error);
      toast.error("שגיאה בעדכון השאלון");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <p className="text-lg text-muted-foreground">טוען...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4" dir="rtl">
      <div className="space-y-6">
        {/* Quick Stats */}
        {profileData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {QUICK_STATS.map((stat) => (
              <StatsCard
                key={stat.key}
                icon={stat.icon}
                title={stat.title}
                value={stat.getValue(profileData)}
              />
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <div className="flex justify-center my-6">
          <DynamicDialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DynamicDialogTrigger asChild>
              <Button variant="outline" className="px-6 py-2 text-lg gap-2">
                <Eye className="w-5 h-5" />
                תצוגה מקדימה
              </Button>
            </DynamicDialogTrigger>
            <DynamicDialogContent
              className="w-[90vw] max-w-7xl max-h-[85vh] overflow-y-auto p-6"
              dir="rtl"
            >
              <DynamicDialogHeader>
                <DynamicDialogTitle>תצוגה מקדימה של הפרופיל</DynamicDialogTitle>
                <Select
                  value={isMatchmaker ? "matchmaker" : "candidate"}
                  onValueChange={(value) =>
                    setIsMatchmaker(value === "matchmaker")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidate">תצוגת מועמד</SelectItem>
                    <SelectItem value="matchmaker">תצוגת שדכן</SelectItem>
                  </SelectContent>
                </Select>
              </DynamicDialogHeader>
              {profileData && (
                <ProfileCard
                  profile={profileData}
                  images={images}
                  questionnaire={questionnaireResponse}
                  viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                />
              )}
            </DynamicDialogContent>
          </DynamicDialog>
        </div>

        {/* Main Tabs */}
        <DynamicTabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <DynamicTabsList className="w-full justify-center gap-2" dir="rtl">
            <DynamicTabsTrigger value="overview">סקירה כללית</DynamicTabsTrigger>
            <DynamicTabsTrigger value="extended">פרופיל מורחב</DynamicTabsTrigger>
            <DynamicTabsTrigger value="photos">תמונות</DynamicTabsTrigger>
            <DynamicTabsTrigger value="preferences">העדפות</DynamicTabsTrigger>
            <DynamicTabsTrigger value="questionnaire">תשובות לשאלון</DynamicTabsTrigger>
          </DynamicTabsList>

          <div className="mt-6">
            <DynamicTabsContent value="overview">
              <ProfileSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSave}
                viewOnly={viewOnly}
              />
            </DynamicTabsContent>

            <DynamicTabsContent value="extended">
              <ExtendedProfileSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSave}
                viewOnly={viewOnly}
              />
            </DynamicTabsContent>

            <DynamicTabsContent value="photos">
              <PhotosSection
                images={images}
                isUploading={isLoading}
                disabled={viewOnly}
                onUpload={handleImageUpload}
                onSetMain={handleSetMainImage}
                onDelete={handleDeleteImage}
              />
            </DynamicTabsContent>

            <DynamicTabsContent value="preferences">
              <PreferencesSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onChange={handleSave}
                viewOnly={viewOnly}
              />
            </DynamicTabsContent>

            <DynamicTabsContent value="questionnaire">
              {questionnaireResponse ? (
                <QuestionnaireResponsesSection
                  questionnaire={questionnaireResponse}
                  onUpdate={handleQuestionnaireUpdate}
                  isEditable={!viewOnly}
                  viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  לא נמצאו תשובות לשאלון
                </div>
              )}
            </DynamicTabsContent>
          </div>
        </DynamicTabs>
      </div>
    </div>
  );
};

export default UnifiedProfileDashboard;