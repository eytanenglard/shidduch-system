import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProfileSection } from "@/app/components/shared/shared/profile";
import { PhotosSection } from "@/app/components/shared/shared/profile";
import { PreferencesSection } from "@/app/components/shared/shared/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, UserCog, Image as ImageIcon, Sliders } from "lucide-react";
import type { UserProfile, UserImage } from "@/types/next-auth";
import type { Candidate } from "./types/candidates";
import { motion } from "framer-motion";

interface MatchmakerEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const MatchmakerEditProfile: React.FC<MatchmakerEditProfileProps> = ({
  isOpen,
  onClose,
  candidate,
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!candidate) return;

    try {
      // Fetch complete profile data
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch candidate profile");
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setImages(data.images || []);
      } else {
        throw new Error(data.error || "Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("שגיאה בטעינת נתוני המועמד");
    }
  }, [candidate]);
  // Fetch full profile data when component opens
  useEffect(() => {
    if (isOpen && candidate) {
      setIsLoading(true);
      fetchProfileData().finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, candidate, fetchProfileData]);

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    if (!candidate) return;

    try {
      setIsSaving(true);

      // Clean up empty enum fields to prevent validation errors
      const cleanedProfile = { ...updatedProfile };

      // Convert empty strings to null for enum fields
      if (cleanedProfile.gender === "") cleanedProfile.gender = null;
      if (cleanedProfile.preferredMatchmakerGender === "")
        cleanedProfile.preferredMatchmakerGender = null;

      console.log("Sending profile update:", cleanedProfile);

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanedProfile),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const data = await response.json();

      if (data.success) {
        setProfile(
          (prevProfile) =>
            ({
              ...prevProfile,
              ...cleanedProfile,
            } as UserProfile)
        );

        toast.success("פרופיל המועמד עודכן בהצלחה", {
          position: "top-center",
          duration: 3000,
        });
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        "שגיאה בעדכון פרופיל המועמד: " +
          (error instanceof Error ? error.message : "שגיאה לא ידועה"),
        {
          duration: 5000,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!candidate) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("userId", candidate.id);

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      if (data.success) {
        setImages((prev) => [...prev, data.image]);
        toast.success("התמונה הועלתה בהצלחה");
      } else {
        throw new Error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (!candidate) return;

    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images/${imageId}/main`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set main image");
      }

      const data = await response.json();

      if (data.success) {
        // Update local state - set the selected image as main and others as not main
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            isMain: img.id === imageId,
          }))
        );

        toast.success("התמונה הראשית עודכנה בהצלחה");
      } else {
        throw new Error(data.error || "Failed to set main image");
      }
    } catch (error) {
      console.error("Error setting main image:", error);
      toast.error("שגיאה בעדכון התמונה הראשית");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!candidate) return;

    try {
      setIsUploading(true);

      console.log(`Deleting image ${imageId} for candidate ${candidate.id}`);

      // Check if this is the main image
      const isMainImage = images.find((img) => img.id === imageId)?.isMain;

      // Find another image that could become the main one if this is the main image
      let nextMainImage: UserImage | undefined;
      if (isMainImage) {
        nextMainImage = images.find((img) => img.id !== imageId);
        console.log("Next main image candidate:", nextMainImage);
      }

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images/${imageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete image response:", response.status, errorText);
        throw new Error(`שגיאה במחיקת התמונה: ${response.status} ${errorText}`);
      }

      try {
        const data = await response.json();

        if (data.success) {
          setImages((prev) => prev.filter((img) => img.id !== imageId));

          // If this was the main image and there's another image, make it the main one
          if (isMainImage && nextMainImage) {
            await handleSetMainImage(nextMainImage.id);
          }

          toast.success("התמונה נמחקה בהצלחה", {
            position: "top-center",
          });
        } else {
          throw new Error(data.error || "Failed to delete image");
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        // If response was successful but JSON parsing failed, still consider it a success
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("התמונה נמחקה בהצלחה", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        error instanceof Error ? error.message : "שגיאה במחיקת התמונה"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full max-h-[90vh]"
          >
            <DialogHeader className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-primary/90">
                    עריכת פרופיל - {candidate.firstName} {candidate.lastName}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-1">
                    עריכת פרטי המועמד והעדפותיו במערכת
                  </DialogDescription>
                </div>
                {isSaving && (
                  <div className="flex items-center bg-blue-50 text-blue-700 py-1 px-2 rounded-full text-sm">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    שומר שינויים...
                  </div>
                )}
              </div>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-6 pt-4">
                <TabsList className="w-full bg-muted/30 p-1 rounded-xl shadow-sm">
                  <TabsTrigger
                    value="profile"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <UserCog className="w-4 h-4" />
                    פרטים אישיים
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    תמונות
                  </TabsTrigger>
                  <TabsTrigger
                    value="preferences"
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4" />
                    העדפות
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <TabsContent
                  value="profile"
                  className="flex-1 overflow-auto p-4 m-0 pb-16"
                >
                  {profile ? (
                    <div className="bg-white rounded-xl shadow-sm border">
                      <ProfileSection
                        profile={profile}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        onSave={handleProfileUpdate}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="photos"
                  className="flex-1 overflow-auto p-4 m-0 pb-16"
                >
                  <div className="bg-white rounded-xl shadow-sm border">
                    <PhotosSection
                      images={images}
                      isUploading={isUploading}
                      disabled={false}
                      onUpload={handleImageUpload}
                      onSetMain={handleSetMainImage}
                      onDelete={handleDeleteImage}
                      maxImages={10}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="preferences"
                  className="flex-1 overflow-auto p-4 m-0 pb-16"
                >
                  {profile ? (
                    <div className="bg-white rounded-xl shadow-sm border">
                      <PreferencesSection
                        profile={profile}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        onChange={handleProfileUpdate}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-4 border-t flex justify-between mt-auto bg-white/80 backdrop-blur-sm sticky bottom-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {activeTab === "profile"
                    ? "עריכת פרטים אישיים"
                    : activeTab === "photos"
                    ? "ניהול תמונות"
                    : "עריכת העדפות"}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="bg-white hover:bg-gray-100 transition-colors shadow-sm"
              >
                <X className="w-4 h-4 ml-2" />
                סגור
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MatchmakerEditProfile;
