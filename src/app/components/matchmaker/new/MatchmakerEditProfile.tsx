import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Added for delete confirmation dialog
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added for delete confirmation dialog
import { Label } from "@/components/ui/label"; // Added for delete confirmation dialog
import { toast } from "sonner";
import { ProfileSection } from "@/app/components/profile";
import { PhotosSection } from "@/app/components/profile";
import { PreferencesSection } from "@/app/components/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, UserCog, Image as ImageIcon, Sliders, Trash2, AlertCircle } from "lucide-react"; // Added Trash2, AlertCircle
import type { UserProfile, UserImage } from "@/types/next-auth";
import type { Candidate } from "./types/candidates";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react"; // Added for checking admin role

interface MatchmakerEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  // Optional: callback to refresh candidate list after deletion
  onCandidateDeleted?: (candidateId: string) => void; 
}

const DELETE_CANDIDATE_CONFIRMATION_PHRASE = "אני מאשר מחיקה";

const MatchmakerEditProfile: React.FC<MatchmakerEditProfileProps> = ({
  isOpen,
  onClose,
  candidate,
  onCandidateDeleted,
}) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN"; // Adjust if role name is different or it's an enum

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(true); // For ProfileSection & PreferencesSection
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for delete candidate confirmation
  const [isDeleteCandidateDialogOpen, setIsDeleteCandidateDialogOpen] = useState(false);
  const [deleteCandidateConfirmText, setDeleteCandidateConfirmText] = useState("");
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!candidate) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`
      );
      if (!response.ok) throw new Error("Failed to fetch candidate profile");
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
      // Optionally close dialog if candidate data cannot be loaded
      // onClose(); 
    } finally {
      setIsLoading(false);
    }
  }, [candidate/*, onClose (if used in catch) */]);

  useEffect(() => {
    if (isOpen && candidate) {
      fetchProfileData();
    } else if (!isOpen) {
      // Reset states when dialog closes
      setProfile(null);
      setImages([]);
      setActiveTab("profile");
      setIsLoading(true);
      setDeleteCandidateConfirmText("");
      setIsDeleteCandidateDialogOpen(false);
    }
  }, [isOpen, candidate, fetchProfileData]);

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    if (!candidate || !profile) return;
    setIsSaving(true);
    try {
      const cleanedProfile = { ...updatedProfile };
      if (cleanedProfile.gender === undefined) { /* Keep undefined */ }
      if (cleanedProfile.preferredMatchmakerGender === undefined) { /* Keep undefined */ }

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedProfile),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }
      setProfile(prevProfile => ({ ...prevProfile, ...cleanedProfile } as UserProfile));
      toast.success("פרופיל המועמד עודכן בהצלחה", { position: "top-center", duration: 3000 });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        "שגיאה בעדכון פרופיל המועמד: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"),
        { duration: 5000 }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!candidate) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("userId", candidate.id); // The API might not need userId in body if it's in path

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }
      setImages((prev) => [...prev, data.image]);
      toast.success("התמונה הועלתה בהצלחה");
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
        { method: "PATCH" }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to set main image");
      }
      setImages((prev) => prev.map((img) => ({ ...img, isMain: img.id === imageId })));
      toast.success("התמונה הראשית עודכנה בהצלחה");
    } catch (error) {
      console.error("Error setting main image:", error);
      toast.error("שגיאה בעדכון התמונה הראשית");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!candidate) return;
    setIsUploading(true); // Using isUploading for general image operations loading state
    try {
      const isMainImage = images.find((img) => img.id === imageId)?.isMain;
      let nextMainImageId: string | undefined;
      if (isMainImage) {
        nextMainImageId = images.find((img) => img.id !== imageId)?.id;
      }

      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images/${imageId}`,
        { method: "DELETE" }
      );

      // Handle cases where response might not be JSON (e.g., 204 No Content)
      if (response.status === 204) { // Successfully deleted, no content
         setImages((prev) => prev.filter((img) => img.id !== imageId));
         if (isMainImage && nextMainImageId) {
           await handleSetMainImage(nextMainImageId);
         }
         toast.success("התמונה נמחקה בהצלחה", { position: "top-center" });
         return; // Exit early
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorText = data.error || await response.text();
        throw new Error(`שגיאה במחיקת התמונה: ${errorText}`);
      }
      
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (isMainImage && nextMainImageId) {
        await handleSetMainImage(nextMainImageId);
      }
      toast.success("התמונה נמחקה בהצלחה", { position: "top-center" });

    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(error instanceof Error ? error.message : "שגיאה במחיקת התמונה");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCandidateRequest = async () => {
    if (!candidate) return;
    if (deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE) {
      toast.error("אישור לא תקין", {
        description: `נא להקליד "${DELETE_CANDIDATE_CONFIRMATION_PHRASE}" בדיוק כדי לאשר מחיקה.`,
      });
      return;
    }

    setIsDeletingCandidate(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`, // API endpoint for DELETE
        { method: "DELETE" }
      );

      const data = await response.json(); // Assuming API always returns JSON

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete candidate profile");
      }

      toast.success("המועמד נמחק בהצלחה", {
        position: "top-center",
        duration: 3000,
      });
      if (onCandidateDeleted) {
        onCandidateDeleted(candidate.id);
      }
      setIsDeleteCandidateDialogOpen(false); // Close confirmation dialog
      onClose(); // Close main edit dialog
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error(
        "שגיאה במחיקת המועמד: " +
          (error instanceof Error ? error.message : "שגיאה לא ידועה"),
        { duration: 5000 }
      );
    } finally {
      setIsDeletingCandidate(false);
    }
  };


  if (!candidate && isOpen) { // Handle case where dialog is open but candidate is null (e.g. after deletion and onClose)
    return null; // Or a specific message/loader if preferred, but onClose should handle it
  }
  if (!candidate) return null; // General guard


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          {isLoading && !profile ? ( // Show main loader only if profile is not yet loaded
            <div className="flex items-center justify-center h-64"> {/* Adjusted height */}
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
                        disabled={false} // Or handle based on isSaving/isDeletingCandidate
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
                          onChange={handleProfileUpdate} // Assuming PreferencesSection uses 'onChange' for save
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

              <div className="p-4 border-t flex justify-between items-center mt-auto bg-white/80 backdrop-blur-sm sticky bottom-0">
                <div>
                  <span className="text-sm text-muted-foreground">
                    {activeTab === "profile"
                      ? "עריכת פרטים אישיים"
                      : activeTab === "photos"
                      ? "ניהול תמונות"
                      : "עריכת העדפות"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteCandidateDialogOpen(true)}
                      disabled={isSaving || isUploading || isDeletingCandidate}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> {/* Icon before text for RTL */}
                      מחק מועמד
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving || isDeletingCandidate}
                    className="bg-white hover:bg-gray-100 transition-colors shadow-sm"
                    size="sm"
                  >
                     <X className="w-4 h-4 mr-2" /> {/* Icon before text for RTL */}
                    סגור
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Candidate Confirmation Dialog */}
      {candidate && (
        <Dialog
          open={isDeleteCandidateDialogOpen}
          onOpenChange={(open) => {
            if (isDeletingCandidate) return; // Prevent closing while delete is in progress
            if (!open) {
              setIsDeleteCandidateDialogOpen(false);
              setDeleteCandidateConfirmText("");
            } else {
              setIsDeleteCandidateDialogOpen(true);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                אישור מחיקת מועמד
              </DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך למחוק את המועמד{" "}
                <strong>
                  {candidate.firstName} {candidate.lastName}
                </strong>
                ? פעולה זו הינה בלתי הפיכה ותסיר את כל נתוני המועמד מהמערכת.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Label htmlFor="deleteCandidateConfirm" className="text-gray-700">
                לאישור המחיקה, אנא הקלד:{" "}
                <strong className="text-red-700">
                  {DELETE_CANDIDATE_CONFIRMATION_PHRASE}
                </strong>
              </Label>
              <Input
                id="deleteCandidateConfirm"
                value={deleteCandidateConfirmText}
                onChange={(e) => setDeleteCandidateConfirmText(e.target.value)}
                disabled={isDeletingCandidate}
                className="border-gray-300 focus:border-red-500"
                placeholder={DELETE_CANDIDATE_CONFIRMATION_PHRASE}
                dir="rtl"
              />
              {deleteCandidateConfirmText &&
                deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE && (
                  <p className="text-xs text-red-600">הטקסט שהוקלד אינו תואם.</p>
                )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteCandidateDialogOpen(false);
                  setDeleteCandidateConfirmText("");
                }}
                disabled={isDeletingCandidate}
                className="border-gray-300"
              >
                ביטול
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCandidateRequest}
                disabled={
                  isDeletingCandidate ||
                  deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE
                }
              >
                {isDeletingCandidate ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מוחק...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" /> {/* Icon before text for RTL */}
                     מחק מועמד לצמיתות
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MatchmakerEditProfile;

