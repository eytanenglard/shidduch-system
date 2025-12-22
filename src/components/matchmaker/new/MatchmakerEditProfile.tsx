// src/components/matchmaker/new/MatchmakerEditProfile.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProfileSection } from '@/components/profile';
import { PhotosSection } from '@/components/profile';
import { PreferencesSection } from '@/components/profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  X,
  UserCog,
  Sparkles,
  Award,
  Image as ImageIcon,
  Sliders,
  Trash2,
  AlertCircle,
  Send,
  Save,
  MessageSquare, // אייקון לסיכום שיחה
  Phone, // אייקון לטלפון
  Mail,
} from 'lucide-react';
import type { UserProfile, UserImage } from '@/types/next-auth';
import type { Candidate } from './types/candidates';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface MatchmakerEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onCandidateDeleted?: (candidateId: string) => void;
  dict: MatchmakerPageDictionary['candidatesManager']['editProfile'];
  profileDict: ProfilePageDictionary;
  locale: string;
}

const MatchmakerEditProfile: React.FC<MatchmakerEditProfileProps> = ({
  isOpen,
  onClose,
  candidate,
  onCandidateDeleted,
  dict,
  profileDict,
  locale,
}) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // הוספנו סטייט למספר טלפון למקרה שהוא מגיע מהפרופיל המלא ולא מהקנדידט ברשימה
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const [isDeleteCandidateDialogOpen, setIsDeleteCandidateDialogOpen] =
    useState(false);
  const [deleteCandidateConfirmText, setDeleteCandidateConfirmText] =
    useState('');
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  const [isSetupInviteOpen, setIsSetupInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const DELETE_CANDIDATE_CONFIRMATION_PHRASE = dict.deleteConfirmationPhrase;

  const handleGenerateSummary = async () => {
    if (!candidate) return;
    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/ai/matchmaker/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: candidate.id, locale: locale }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to generate summary');
      }

      setProfile((prevProfile) => {
        if (!prevProfile) return null;
        return { ...prevProfile, manualEntryText: result.summary };
      });

      toast.success(dict.toasts.aiSummarySuccess);
    } catch (error) {
      toast.error(
        `${dict.toasts.aiSummaryError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const fetchProfileData = useCallback(async () => {
    if (!candidate) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}?locale=${locale}`
      );
      if (!response.ok) throw new Error('Failed to fetch candidate profile');
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setImages(data.images || []);

        // נסיון לשלוף את הטלפון מהפרופיל (דרך היוזר המשוייך)
        // הערה: זה מניח שה-API מחזיר את המידע הזה תחת profile.user.phone
        // אם לא, צריך לוודא שה-API מעודכן להחזיר את זה.
 // נסיון לשלוף את הטלפון מהפרופיל (דרך היוזר המשוייך) או מהמועמד עצמו
        if (data.profile?.user?.phone) {
          setUserPhone(data.profile.user.phone);
        } else if (candidate.phone) {
           setUserPhone(candidate.phone);
        }

        if (
          candidate.email &&
          !candidate.email.endsWith('@shidduch.placeholder.com')
        ) {
          setInviteEmail(candidate.email);
        } else {
          setInviteEmail('');
        }
      } else {
        throw new Error(data.error || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(dict.toasts.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [candidate, dict.toasts.loadError, locale]);

  useEffect(() => {
    if (isOpen && candidate) {
      fetchProfileData();
    } else if (!isOpen) {
      setProfile(null);
      setImages([]);
      setUserPhone(null);
      setActiveTab('profile');
      setIsLoading(true);
      setDeleteCandidateConfirmText('');
      setIsDeleteCandidateDialogOpen(false);
      setIsSetupInviteOpen(false);
      setInviteEmail('');
      setIsSendingInvite(false);
    }
  }, [isOpen, candidate, fetchProfileData]);

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    if (!candidate || !profile) return;
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setProfile(
        (prevProfile) => ({ ...prevProfile, ...updatedProfile }) as UserProfile
      );
      toast.success(dict.toasts.updateSuccess, {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        `${dict.toasts.updateError}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { duration: 5000 }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (!candidate) return;
    setIsUploading(true);
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', candidate.id);
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          `שגיאה בהעלאת הקובץ ${file.name}: ${data.error || 'שגיאת שרת'}`
        );
      }
      return data.image;
    });
    try {
      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newImages]);
      toast.success(
        newImages.length > 1
          ? dict.toasts.uploadSuccessMultiple.replace(
              '{{count}}',
              String(newImages.length)
            )
          : dict.toasts.uploadSuccessSingle
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(
        `${dict.toasts.uploadError}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (!candidate) return;
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/images/${imageId}/main`,
        { method: 'PATCH' }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || 'Failed to set main image');
      setImages((prev) =>
        prev.map((img) => ({ ...img, isMain: img.id === imageId }))
      );
      toast.success(dict.toasts.setMainSuccess);
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error(dict.toasts.setMainError);
    }
  };

  const handleDeleteImage = async (imageIds: string[]) => {
    if (!candidate || imageIds.length === 0) return;
    setIsUploading(true);
    try {
      const currentMainImage = images.find((img) => img.isMain);
      const isMainImageBeingDeleted = currentMainImage
        ? imageIds.includes(currentMainImage.id)
        : false;
      const deletePromises = imageIds.map((id) =>
        fetch(`/api/matchmaker/candidates/${candidate.id}/images/${id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      for (const response of responses) {
        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Error deleting one of the images (status: ${response.status})`
          );
        }
      }
      const remainingImages = images.filter(
        (img) => !imageIds.includes(img.id)
      );
      if (isMainImageBeingDeleted && remainingImages.length > 0) {
        setImages(remainingImages);
        await handleSetMainImage(remainingImages[0].id);
      } else {
        setImages(remainingImages);
      }
      toast.success(
        imageIds.length > 1
          ? dict.toasts.deleteImageSuccessMultiple.replace(
              '{{count}}',
              String(imageIds.length)
            )
          : dict.toasts.deleteImageSuccessSingle,
        { position: 'top-center' }
      );
    } catch (error) {
      console.error('Error deleting image(s):', error);
      toast.error(
        error instanceof Error ? error.message : dict.toasts.deleteImageError
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCandidateRequest = async () => {
    if (!candidate) return;
    if (deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE) {
      toast.error(dict.toasts.deleteCandidateErrorConfirmation, {
        description: dict.toasts.deleteCandidateErrorDescription.replace(
          '{{phrase}}',
          DELETE_CANDIDATE_CONFIRMATION_PHRASE
        ),
      });
      return;
    }
    setIsDeletingCandidate(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || 'Failed to delete candidate profile');
      toast.success(dict.toasts.deleteCandidateSuccess, {
        position: 'top-center',
        duration: 3000,
      });
      if (onCandidateDeleted) onCandidateDeleted(candidate.id);
      setIsDeleteCandidateDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error(
        `${dict.toasts.deleteCandidateError}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { duration: 5000 }
      );
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  const handleSendSetupInvite = async () => {
    if (!candidate || !inviteEmail) {
      toast.error(dict.toasts.sendInviteErrorEmail);
      return;
    }
    setIsSendingInvite(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/invite-setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || dict.toasts.sendInviteErrorGeneral);
      toast.success(dict.toasts.sendInviteSuccess);
      setIsSetupInviteOpen(false);
    } catch (error) {
      console.error('Error sending setup invite:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.sendInviteErrorGeneral
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (!candidate && isOpen) return null;
  if (!candidate) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] p-0 overflow-hidden"
          dir={direction}
        >
          {isLoading && !profile ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[90vh]"
            >
              {/* --- HEADER --- */}
              <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle
                      className={cn(
                        'text-2xl font-bold text-primary/90 flex items-center gap-3',
                        locale === 'he' ? 'text-right' : 'text-left'
                      )}
                    >
                      {dict.header.title
                        .replace('{{firstName}}', candidate.firstName)
                        .replace('{{lastName}}', candidate.lastName)}
                    </DialogTitle>
                    <DialogDescription
                      className={cn(
                        'text-gray-500 mt-2 flex flex-col gap-1',
                        locale === 'he' ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {candidate.email}
                      </span>
                      {userPhone && (
                        <span className="flex items-center gap-2 text-gray-700 font-medium">
                          <Phone className="w-4 h-4 text-green-600" />
                          <span dir="ltr">{userPhone}</span>
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                  {isSaving && (
                    <div className="flex items-center bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-sm border border-blue-100 shadow-sm">
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      {dict.header.saving}
                    </div>
                  )}
                </div>
              </DialogHeader>

              {/* --- TABS --- */}
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
                      {dict.tabs.profile}
                    </TabsTrigger>
                    <TabsTrigger
                      value="photos"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {dict.tabs.photos}
                    </TabsTrigger>
                    <TabsTrigger
                      value="preferences"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <Sliders className="w-4 h-4" />
                      {dict.tabs.preferences}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <TabsContent
                    value="profile"
                    className="flex-1 overflow-auto p-4 m-0 pb-16"
                  >
                    {profile ? (
                      <div className="space-y-6">
                        {/* --- NeshamaTech Summary Card --- */}
                        <Card className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <Award className="w-5 h-5 text-indigo-600" />
                                  {dict.neshamaTechSummary.title}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {dict.neshamaTechSummary.description}
                                </CardDescription>
                              </div>
                              <Button
                                size="sm"
                                onClick={handleGenerateSummary}
                                disabled={isGeneratingSummary || isSaving}
                                className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 shadow-sm hover:shadow transition-all"
                              >
                                {isGeneratingSummary ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                {isGeneratingSummary
                                  ? dict.neshamaTechSummary.aiButtonLoading
                                  : dict.neshamaTechSummary.aiButton}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <Textarea
                              value={profile.manualEntryText || ''}
                              onChange={(e) =>
                                setProfile((p) =>
                                  p
                                    ? { ...p, manualEntryText: e.target.value }
                                    : null
                                )
                              }
                              placeholder={dict.neshamaTechSummary.placeholder}
                              rows={6}
                              className="min-h-[120px] focus-visible:ring-indigo-500"
                            />
                          </CardContent>
                          <CardFooter className="flex justify-end pt-2 pb-4 bg-slate-50/30">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleProfileUpdate({
                                  manualEntryText:
                                    profile.manualEntryText || null,
                                })
                              }
                              disabled={isSaving || isGeneratingSummary}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 ml-2" />
                              )}
                              {isSaving
                                ? dict.neshamaTechSummary.saveButtonLoading ||
                                  'שומר...'
                                : dict.neshamaTechSummary.saveButton ||
                                  'שמור תקציר'}
                            </Button>
                          </CardFooter>
                        </Card>

                        {/* --- NEW: Conversation Summary Card --- */}
                        <Card className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                          <CardHeader className="bg-blue-50/30 pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                                  <MessageSquare className="w-5 h-5 text-blue-600" />
                                  {dict.conversationSummary?.title ||
                                    'סיכום שיחה עם שדכן'}
                                </CardTitle>
                                <CardDescription className="mt-1 text-blue-800/70">
                                  {dict.conversationSummary?.description ||
                                    'כאן ניתן לתעד הערות פנימיות וסיכומים משיחותיך עם המועמד/ת.'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <Textarea
                              value={profile.conversationSummary || ''}
                              onChange={(e) =>
                                setProfile((p) =>
                                  p
                                    ? {
                                        ...p,
                                        conversationSummary: e.target.value,
                                      }
                                    : null
                                )
                              }
                              placeholder={
                                dict.conversationSummary?.placeholder ||
                                'הקלד/י כאן את סיכום השיחה...'
                              }
                              rows={5}
                              className="min-h-[100px] border-blue-200 focus-visible:ring-blue-500 bg-blue-50/10"
                            />
                          </CardContent>
                          <CardFooter className="flex justify-end pt-2 pb-4 bg-blue-50/20">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleProfileUpdate({
                                  conversationSummary:
                                    profile.conversationSummary || null,
                                })
                              }
                              disabled={isSaving || isGeneratingSummary}
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform active:scale-95"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 ml-2" />
                              )}
                              {isSaving
                                ? dict.conversationSummary?.saveButtonLoading ||
                                  'שומר...'
                                : dict.conversationSummary?.saveButton ||
                                  'שמור סיכום שיחה'}
                            </Button>
                          </CardFooter>
                        </Card>

                        {/* --- Main Profile Section --- */}
                        <div className="bg-white rounded-xl shadow-sm border p-1">
                          <ProfileSection
                            profile={profile}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onSave={handleProfileUpdate}
                            dict={profileDict.profileSection}
                            locale={locale}
                          />
                        </div>
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
                        disabled={isSaving || isDeletingCandidate}
                        onUpload={handleImageUpload}
                        onSetMain={handleSetMainImage}
                        onDelete={handleDeleteImage}
                        maxImages={10}
                        dict={profileDict.photosSection}
                        locale={locale}
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
                          dictionary={profileDict.preferencesSection}
                          locale={locale}
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

              {/* --- FOOTER --- */}
              <div className="p-4 border-t flex justify-between items-center mt-auto bg-white/95 backdrop-blur-sm sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    {activeTab === 'profile'
                      ? dict.footer.tabInfo.profile
                      : activeTab === 'photos'
                        ? dict.footer.tabInfo.photos
                        : dict.footer.tabInfo.preferences}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsSetupInviteOpen(true)}
                    disabled={
                      isSaving || isDeletingCandidate || isSendingInvite
                    }
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Send
                      className={cn(
                        'w-4 h-4',
                        locale === 'he' ? 'ml-2' : 'mr-2'
                      )}
                    />
                    {dict.footer.buttons.sendInvite}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteCandidateDialogOpen(true)}
                      disabled={isSaving || isUploading || isDeletingCandidate}
                      size="sm"
                    >
                      <Trash2
                        className={cn(
                          'w-4 h-4',
                          locale === 'he' ? 'ml-2' : 'mr-2'
                        )}
                      />
                      {dict.footer.buttons.deleteCandidate}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving || isDeletingCandidate}
                    className="bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm text-gray-700"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {dict.footer.buttons.close}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Invite Dialog --- */}
      {candidate && (
        <Dialog open={isSetupInviteOpen} onOpenChange={setIsSetupInviteOpen}>
          <DialogContent className="sm:max-w-md" dir={direction}>
            <DialogHeader>
              <DialogTitle>{dict.inviteDialog.title}</DialogTitle>
              <DialogDescription>
                {dict.inviteDialog.description.replace(
                  '{{fullName}}',
                  `${candidate.firstName} ${candidate.lastName}`
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label
                htmlFor="inviteEmail"
                className={cn(locale === 'he' ? 'text-right' : 'text-left')}
              >
                {dict.inviteDialog.emailLabel}
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={dict.inviteDialog.emailPlaceholder}
                className="col-span-3"
                dir="ltr"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSendingInvite}
                >
                  {dict.inviteDialog.buttons.cancel}
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleSendSetupInvite}
                disabled={isSendingInvite || !inviteEmail}
              >
                {isSendingInvite ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send
                    className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                  />
                )}
                {isSendingInvite
                  ? dict.inviteDialog.buttons.sending
                  : dict.inviteDialog.buttons.send}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {candidate && (
        <Dialog
          open={isDeleteCandidateDialogOpen}
          onOpenChange={(open) =>
            !isDeletingCandidate && setIsDeleteCandidateDialogOpen(open)
          }
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                {dict.deleteDialog.title}
              </DialogTitle>
              <DialogDescription>
                {dict.deleteDialog.description.replace(
                  '{{fullName}}',
                  `${candidate.firstName} ${candidate.lastName}`
                )}{' '}
                {dict.deleteDialog.irreversible}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="deleteCandidateConfirm" className="text-gray-700">
                {dict.deleteDialog.confirmationLabel.replace(
                  '{{phrase}}',
                  DELETE_CANDIDATE_CONFIRMATION_PHRASE
                )}
              </Label>
              <Input
                id="deleteCandidateConfirm"
                value={deleteCandidateConfirmText}
                onChange={(e) => setDeleteCandidateConfirmText(e.target.value)}
                disabled={isDeletingCandidate}
                className="border-gray-300 focus:border-red-500"
                placeholder={dict.deleteDialog.inputPlaceholder}
                dir="rtl"
              />
              {deleteCandidateConfirmText &&
                deleteCandidateConfirmText !==
                  DELETE_CANDIDATE_CONFIRMATION_PHRASE && (
                  <p className="text-xs text-red-600">
                    {dict.deleteDialog.mismatchError}
                  </p>
                )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteCandidateDialogOpen(false);
                  setDeleteCandidateConfirmText('');
                }}
                disabled={isDeletingCandidate}
                className="border-gray-300"
              >
                {dict.deleteDialog.buttons.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCandidateRequest}
                disabled={
                  isDeletingCandidate ||
                  deleteCandidateConfirmText !==
                    DELETE_CANDIDATE_CONFIRMATION_PHRASE
                }
              >
                {isDeletingCandidate ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {dict.deleteDialog.buttons.deleting}
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {dict.deleteDialog.buttons.delete}
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
