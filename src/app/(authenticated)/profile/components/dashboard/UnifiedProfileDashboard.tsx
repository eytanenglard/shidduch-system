"use client";

import React, { useState, useEffect } from "react";
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

// Types from next-auth.ts
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
  UpdateValue, // ייבוא UpdateValue מ-next-auth.ts
} from "@/types/next-auth";

// Stats configuration
import { User, MapPin, Scroll, Clock } from "lucide-react";

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
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { update: updateSession } = useSession();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const profileUrl = userId
          ? `/api/profile?userId=${userId}`
          : "/api/profile";
        const profileResponse = await fetch(profileUrl);
        const profileData = await profileResponse.json();

        if (profileData.success) {
          setProfileData(profileData.profile);
          setImages(profileData.images || []);
        }

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
      } catch (err) {
        console.error("Failed to load profile data:", err);
        setError("שגיאה בטעינת הנתונים");
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

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
      } else {
        setError("שגיאה בעדכון הפרופיל");
      }
    } catch {
      setError("שגיאה בעדכון הפרופיל");
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
      } else {
        setError("שגיאה בהעלאת התמונה");
      }
    } catch {
      setError("שגיאה בהעלאת התמונה");
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
      } else {
        setError("שגיאה בעדכון התמונה הראשית");
      }
    } catch {
      setError("שגיאה בעדכון התמונה הראשית");
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
      } else {
        setError("שגיאה במחיקת התמונה");
      }
    } catch {
      setError("שגיאה במחיקת התמונה");
      toast.error("שגיאה במחיקת התמונה");
    }
  };

  const handleQuestionnaireUpdate = async (
    world: string,
    questionId: string,
    value: UpdateValue
  ) => {
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
      } else {
        setError("שגיאה בעדכון השאלון");
      }
    } catch (err) {
      console.error("Failed to update questionnaire:", err);
      setError("שגיאה בעדכון השאלון");
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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

        <div className="flex justify-center my-6">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="px-6 py-2 text-lg gap-2">
                <Eye className="w-5 h-5" />
                תצוגה מקדימה
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-[90vw] max-w-7xl max-h-[85vh] overflow-y-auto p-6"
              dir="rtl"
            >
              <DialogHeader>
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
              </DialogHeader>
              {profileData && (
                <ProfileCard
                  profile={profileData}
                  images={images}
                  questionnaire={questionnaireResponse}
                  viewMode={isMatchmaker ? "matchmaker" : "candidate"}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
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
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedProfileDashboard;
