// src/app/components/matchmaker/new/MatchmakerEditProfile.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProfileSection } from "@/app/components/profile";
import { PhotosSection } from "@/app/components/profile";
import { PreferencesSection } from "@/app/components/profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, X, UserCog, Image as ImageIcon, Sliders, Trash2, AlertCircle, Send } from "lucide-react";
import type { UserProfile, UserImage } from "@/types/next-auth";
import type { Candidate } from "./types/candidates";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

interface MatchmakerEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
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
  const isAdmin = session?.user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for delete candidate confirmation
  const [isDeleteCandidateDialogOpen, setIsDeleteCandidateDialogOpen] = useState(false);
  const [deleteCandidateConfirmText, setDeleteCandidateConfirmText] = useState("");
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // --- NEW: States for Account Setup Invite ---
  const [isSetupInviteOpen, setIsSetupInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  // --- END NEW ---

  const fetchProfileData = useCallback(async () => {
    if (!candidate) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}`);
      if (!response.ok) throw new Error("Failed to fetch candidate profile");
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setImages(data.images || []);
        // --- NEW: Populate email for invite dialog ---
        // Check if the email is a real one, not a placeholder
        if (candidate.email && !candidate.email.endsWith('@shidduch.placeholder.com')) {
          setInviteEmail(candidate.email);
        } else {
          setInviteEmail(""); // Clear if it's a placeholder
        }
        // --- END NEW ---
      } else {
        throw new Error(data.error || "Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("שגיאה בטעינת נתוני המועמד");
    } finally {
      setIsLoading(false);
    }
  }, [candidate]);

  useEffect(() => {
    if (isOpen && candidate) {
      fetchProfileData();
    } else if (!isOpen) {
      setProfile(null);
      setImages([]);
      setActiveTab("profile");
      setIsLoading(true);
      setDeleteCandidateConfirmText("");
      setIsDeleteCandidateDialogOpen(false);
      // --- NEW: Reset invite state on close ---
      setIsSetupInviteOpen(false);
      setInviteEmail("");
      setIsSendingInvite(false);
      // --- END NEW ---
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
      formData.append("userId", candidate.id);

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
    setIsUploading(true);
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

      if (response.status === 204) {
         setImages((prev) => prev.filter((img) => img.id !== imageId));
         if (isMainImage && nextMainImageId) {
           await handleSetMainImage(nextMainImageId);
         }
         toast.success("התמונה נמחקה בהצלחה", { position: "top-center" });
         return;
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
      toast.error("אישור לא תקין", { description: `נא להקליד "${DELETE_CANDIDATE_CONFIRMATION_PHRASE}" בדיוק כדי לאשר מחיקה.` });
      return;
    }
    setIsDeletingCandidate(true);
    try {
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete candidate profile");
      }

      toast.success("המועמד נמחק בהצלחה", { position: "top-center", duration: 3000 });
      if (onCandidateDeleted) {
        onCandidateDeleted(candidate.id);
      }
      setIsDeleteCandidateDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error("שגיאה במחיקת המועמד: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"), { duration: 5000 });
    } finally {
      setIsDeletingCandidate(false);
    }
  };
  
  // --- NEW: Handler for sending setup invite ---
  const handleSendSetupInvite = async () => {
    if (!candidate || !inviteEmail) {
      toast.error("נא להזין כתובת אימייל תקינה.");
      return;
    }
    setIsSendingInvite(true);
    try {
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}/invite-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'שגיאה בשליחת ההזמנה.');
      }
      toast.success("הזמנה להגדרת חשבון נשלחה בהצלחה!");
      setIsSetupInviteOpen(false);
    } catch (error) {
      console.error("Error sending setup invite:", error);
      toast.error(error instanceof Error ? error.message : "שגיאה בשליחת ההזמנה.");
    } finally {
      setIsSendingInvite(false);
    }
  };
  // --- END NEW ---

  if (!candidate && isOpen) return null;
  if (!candidate) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          {isLoading && !profile ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold text-primary/90">עריכת פרופיל - {candidate.firstName} {candidate.lastName}</DialogTitle>
                    <DialogDescription className="text-gray-500 mt-1">עריכת פרטי המועמד והעדפותיו במערכת</DialogDescription>
                  </div>
                  {isSaving && <div className="flex items-center bg-blue-50 text-blue-700 py-1 px-2 rounded-full text-sm"><Loader2 className="w-3 h-3 animate-spin mr-1" />שומר שינויים...</div>}
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 pt-4">
                  <TabsList className="w-full bg-muted/30 p-1 rounded-xl shadow-sm">
                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2">
                      <UserCog className="w-4 h-4" />פרטים אישיים
                    </TabsTrigger>
                    <TabsTrigger value="photos" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />תמונות
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4" />העדפות
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <TabsContent value="profile" className="flex-1 overflow-auto p-4 m-0 pb-16">
                    {profile ? <div className="bg-white rounded-xl shadow-sm border"><ProfileSection profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} onSave={handleProfileUpdate} /></div> : <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}
                  </TabsContent>
                  <TabsContent value="photos" className="flex-1 overflow-auto p-4 m-0 pb-16">
                    <div className="bg-white rounded-xl shadow-sm border"><PhotosSection images={images} isUploading={isUploading} disabled={isSaving || isDeletingCandidate} onUpload={handleImageUpload} onSetMain={handleSetMainImage} onDelete={handleDeleteImage} maxImages={10} /></div>
                  </TabsContent>
                  <TabsContent value="preferences" className="flex-1 overflow-auto p-4 m-0 pb-16">
                    {profile ? <div className="bg-white rounded-xl shadow-sm border"><PreferencesSection profile={profile} isEditing={isEditing} setIsEditing={setIsEditing} onChange={handleProfileUpdate} /></div> : <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}
                  </TabsContent>
                </div>
              </Tabs>

              <div className="p-4 border-t flex justify-between items-center mt-auto bg-white/80 backdrop-blur-sm sticky bottom-0">
                <div>
                  <span className="text-sm text-muted-foreground">{activeTab === "profile" ? "עריכת פרטים אישיים" : activeTab === "photos" ? "ניהול תמונות" : "עריכת העדפות"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setIsSetupInviteOpen(true)} disabled={isSaving || isDeletingCandidate || isSendingInvite}>
                    <Send className="w-4 h-4 ml-2" />
                    שלח הזמנה לניהול החשבון
                  </Button>
                  {isAdmin && <Button variant="destructive" onClick={() => setIsDeleteCandidateDialogOpen(true)} disabled={isSaving || isUploading || isDeletingCandidate} size="sm"><Trash2 className="w-4 h-4 mr-2" />מחק מועמד</Button>}
                  <Button variant="outline" onClick={onClose} disabled={isSaving || isDeletingCandidate} className="bg-white hover:bg-gray-100 transition-colors shadow-sm" size="sm"><X className="w-4 h-4 mr-2" />סגור</Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* --- NEW: Invite Setup Dialog --- */}
      {candidate && (
        <Dialog open={isSetupInviteOpen} onOpenChange={setIsSetupInviteOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>הזמנת מועמד לניהול החשבון</DialogTitle>
                    <DialogDescription>
                        שלח הזמנה ל<strong>{candidate.firstName} {candidate.lastName}</strong> להגדיר סיסמה ולקחת שליטה על הפרופיל.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="inviteEmail" className="text-right">
                        כתובת אימייל
                    </Label>
                    <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="col-span-3"
                        dir="ltr"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isSendingInvite}>ביטול</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSendSetupInvite} disabled={isSendingInvite || !inviteEmail}>
                        {isSendingInvite ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                        {isSendingInvite ? "שולח..." : "שלח הזמנה"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      {/* --- END NEW --- */}

      {/* Delete Candidate Confirmation Dialog */}
      {candidate && (
        <Dialog open={isDeleteCandidateDialogOpen} onOpenChange={(open) => !isDeletingCandidate && setIsDeleteCandidateDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" />אישור מחיקת מועמד</DialogTitle>
              <DialogDescription>האם אתה בטוח שברצונך למחוק את המועמד <strong>{candidate.firstName} {candidate.lastName}</strong>? פעולה זו הינה בלתי הפיכה ותסיר את כל נתוני המועמד מהמערכת.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="deleteCandidateConfirm" className="text-gray-700">לאישור המחיקה, אנא הקלד: <strong className="text-red-700">{DELETE_CANDIDATE_CONFIRMATION_PHRASE}</strong></Label>
              <Input id="deleteCandidateConfirm" value={deleteCandidateConfirmText} onChange={(e) => setDeleteCandidateConfirmText(e.target.value)} disabled={isDeletingCandidate} className="border-gray-300 focus:border-red-500" placeholder={DELETE_CANDIDATE_CONFIRMATION_PHRASE} dir="rtl" />
              {deleteCandidateConfirmText && deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE && (<p className="text-xs text-red-600">הטקסט שהוקלד אינו תואם.</p>)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDeleteCandidateDialogOpen(false); setDeleteCandidateConfirmText(""); }} disabled={isDeletingCandidate} className="border-gray-300">ביטול</Button>
              <Button variant="destructive" onClick={handleDeleteCandidateRequest} disabled={isDeletingCandidate || deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE}>
                {isDeletingCandidate ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />מוחק...</span>) : (<><Trash2 className="w-4 h-4 mr-2" />מחק מועמד לצמיתות</>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MatchmakerEditProfile;