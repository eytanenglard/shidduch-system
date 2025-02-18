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

// Dynamic Imports for Radix UI Components
const TabsRoot = dynamic(
  () => import('@radix-ui/react-tabs').then((mod) => mod.Root),
  { ssr: false }
);

const TabsList = dynamic(
  () => import('@radix-ui/react-tabs').then((mod) => mod.List),
  { ssr: false }
);

const TabsTrigger = dynamic(
  () => import('@radix-ui/react-tabs').then((mod) => mod.Trigger),
  { ssr: false }
);

const TabsContent = dynamic(
  () => import('@radix-ui/react-tabs').then((mod) => mod.Content),
  { ssr: false }
);

const DialogRoot = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Root),
  { ssr: false }
);

const DialogTrigger = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Trigger),
  { ssr: false }
);

const DialogContent = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Content),
  { ssr: false }
);

const DialogOverlay = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Overlay),
  { ssr: false }
);

const DialogPortal = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Portal),
  { ssr: false }
);

const DialogTitle = dynamic(
  () => import('@radix-ui/react-dialog').then((mod) => mod.Title),
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

  // Handlers (כל ה-handlers נשארים זהים)
  const handleSave = async (formData: Partial<UserProfile>) => {
    // ... (זהה לקוד הקודם)
  };

  const handleImageUpload = async (file: File) => {
    // ... (זהה לקוד הקודם)
  };

  const handleSetMainImage = async (imageId: string) => {
    // ... (זהה לקוד הקודם)
  };

  const handleDeleteImage = async (imageId: string) => {
    // ... (זהה לקוד הקודם)
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    update:
      | { type: "answer"; value: string }
      | { type: "visibility"; isVisible: boolean }
  ) => {
    // ... (זהה לקוד הקודם)
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
          <DialogRoot open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="px-6 py-2 text-lg gap-2">
                <Eye className="w-5 h-5" />
                תצוגה מקדימה
              </Button>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay className="bg-black/50 fixed inset-0" />
              <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg p-6 w-[90vw] max-w-7xl max-h-[85vh] overflow-y-auto">
                <DialogTitle>תצוגה מקדימה של הפרופיל</DialogTitle>
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
                {profileData && (
                  <ProfileCard
                    profile={profileData}
                    images={images}
                    questionnaire={questionnaireResponse}
                    viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                  />
                )}
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </div>

        {/* Main Tabs */}
        <TabsRoot value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-center gap-2" dir="rtl">
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="extended">פרופיל מורחב</TabsTrigger>
            <TabsTrigger value="photos">תמונות</TabsTrigger>
            <TabsTrigger value="preferences">העדפות</TabsTrigger>
            <TabsTrigger value="questionnaire">תשובות לשאלון</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <ProfileSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSave}
                viewOnly={viewOnly}
              />
            </TabsContent>

            <TabsContent value="extended">
              <ExtendedProfileSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSave={handleSave}
                viewOnly={viewOnly}
              />
            </TabsContent>

            <TabsContent value="photos">
              <PhotosSection
                images={images}
                isUploading={isLoading}
                disabled={viewOnly}
                onUpload={handleImageUpload}
                onSetMain={handleSetMainImage}
                onDelete={handleDeleteImage}
              />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesSection
                profile={profileData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onChange={handleSave}
                viewOnly={viewOnly}
              />
            </TabsContent>

            <TabsContent value="questionnaire">
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
            </TabsContent>
          </div>
        </TabsRoot>
      </div>
    </div>
  );
};

export default UnifiedProfileDashboard;