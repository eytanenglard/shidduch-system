// src/components/matchmaker/new/MatchmakerEditProfile.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProfileSection } from '@/components/profile';
import { PhotosSection } from '@/components/profile';
import { PreferencesSection } from '@/components/profile';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Copy,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { AvailabilityStatus } from '@prisma/client';
import type { UserProfile, UserImage } from '@/types/next-auth';
import type { Candidate } from './types/candidates';
import { motion, AnimatePresence } from 'framer-motion';
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
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MatchmakerEditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onCandidateDeleted?: (candidateId: string) => void;
  dict: MatchmakerPageDictionary['candidatesManager']['editProfile'];
  profileDict: ProfilePageDictionary;
  locale: string;
}

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  colorScheme?: 'blue' | 'indigo' | 'teal' | 'purple' | 'gray';
  children: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  icon,
  defaultOpen = false,
  colorScheme = 'gray',
  children,
  badge,
  actions,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colors = {
    blue: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      line: 'from-blue-500 to-cyan-500',
    },
    indigo: {
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-100',
      text: 'text-indigo-900',
      icon: 'text-indigo-600',
      line: 'from-indigo-500 to-purple-500',
    },
    teal: {
      bg: 'bg-teal-50/50',
      border: 'border-teal-100',
      text: 'text-teal-900',
      icon: 'text-teal-600',
      line: 'from-teal-500 to-emerald-500',
    },
    purple: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-100',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      line: 'from-purple-500 to-pink-500',
    },
    gray: {
      bg: 'bg-gray-50/50',
      border: 'border-gray-100',
      text: 'text-gray-900',
      icon: 'text-gray-600',
      line: 'from-gray-400 to-gray-500',
    },
  };

  const scheme = colors[colorScheme];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('rounded-xl border overflow-hidden', scheme.border)}>
        {/* Color line at top */}
        <div className={cn('h-1 bg-gradient-to-r', scheme.line)} />

        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full px-4 py-3 flex items-center justify-between cursor-pointer transition-colors',
              scheme.bg,
              'hover:bg-opacity-70'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={scheme.icon}>{icon}</div>
              <div className="text-right">
                <div className={cn('font-semibold text-sm', scheme.text)}>
                  {title}
                </div>
                {description && (
                  <div className="text-xs text-gray-500">{description}</div>
                )}
              </div>
              {badge}
            </div>
            <div className="flex items-center gap-2">
              {actions && (
                <div onClick={(e) => e.stopPropagation()}>{actions}</div>
              )}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-4 bg-white"
          >
            {children}
          </motion.div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Names
  const [names, setNames] = useState({ firstName: '', lastName: '' });

  // Phone
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Status
  const [statusState, setStatusState] = useState<{
    status: AvailabilityStatus;
    note: string;
  }>({ status: AvailabilityStatus.AVAILABLE, note: '' });

  // Delete candidate
  const [isDeleteCandidateDialogOpen, setIsDeleteCandidateDialogOpen] =
    useState(false);
  const [deleteCandidateConfirmText, setDeleteCandidateConfirmText] =
    useState('');
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Invite user
  const [isSetupInviteOpen, setIsSetupInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // AI Summary
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Insight Text
  const [insightText, setInsightText] = useState<string | null>(null);
  const [isInsightDialogOpen, setIsInsightDialogOpen] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Recently saved indicator
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null);

  const DELETE_CANDIDATE_CONFIRMATION_PHRASE = dict.deleteConfirmationPhrase;

  // --- Handlers ---
  const showSaveSuccess = (field: string) => {
    setRecentlySaved(field);
    setTimeout(() => setRecentlySaved(null), 2000);
  };

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

        setNames({
          firstName: data.user?.firstName || candidate.firstName,
          lastName: data.user?.lastName || candidate.lastName,
        });

        if (data.profile?.user?.phone) {
          setUserPhone(data.profile.user.phone);
        } else if (candidate.phone) {
          setUserPhone(candidate.phone);
        }

        if (data.profile) {
          setStatusState({
            status:
              data.profile.availabilityStatus || AvailabilityStatus.AVAILABLE,
            note: data.profile.availabilityNote || '',
          });
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
      // Reset states on close
      setProfile(null);
      setImages([]);
      setNames({ firstName: '', lastName: '' });
      setUserPhone(null);
      setStatusState({ status: AvailabilityStatus.AVAILABLE, note: '' });
      setIsLoading(true);
      setDeleteCandidateConfirmText('');
      setIsDeleteCandidateDialogOpen(false);
      setIsSetupInviteOpen(false);
      setInviteEmail('');
      setIsSendingInvite(false);
      setInsightText(null);
      setIsInsightDialogOpen(false);
      setIsGeneratingInsight(false);
      setHasChanges(false);
    }
  }, [isOpen, candidate, fetchProfileData]);

  const handleProfileUpdate = async (updatedData: any, fieldName?: string) => {
    if (!candidate || !profile) return;
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(
        (prevProfile) => ({ ...prevProfile, ...updatedData }) as UserProfile
      );

      if (updatedData.firstName || updatedData.lastName) {
        setNames((prev) => ({
          firstName: updatedData.firstName || prev.firstName,
          lastName: updatedData.lastName || prev.lastName,
        }));
      }

      if (updatedData.availabilityStatus) {
        setStatusState((prev) => ({
          ...prev,
          status: updatedData.availabilityStatus,
          note:
            updatedData.availabilityNote !== undefined
              ? updatedData.availabilityNote
              : prev.note,
        }));
      }

      if (fieldName) {
        showSaveSuccess(fieldName);
      }

      toast.success(dict.toasts.updateSuccess, {
        position: 'top-center',
        duration: 2000,
      });
      setHasChanges(false);
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

  const handleGenerateInsightText = async () => {
    if (!candidate) return;
    setIsGeneratingInsight(true);
    try {
      const response = await fetch('/api/profile/neshama-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: candidate.id, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate insight');
      }

      const data = await response.json();
      setInsightText(data.insight);
      setIsInsightDialogOpen(true);
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast.error(
        locale === 'he' ? 'שגיאה ביצירת הדוח' : 'Error generating report'
      );
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const copyInsightToClipboard = () => {
    if (!insightText) return;
    navigator.clipboard.writeText(insightText);
    toast.success(locale === 'he' ? 'הועתק ללוח' : 'Copied to clipboard');
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
        {
          method: 'DELETE',
        }
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

  // Handle close - prevent scroll jump
  const handleClose = () => {
    onClose();
  };

  if (!candidate && isOpen) return null;
  if (!candidate) return null;

  // Get status badge color
  const getStatusBadge = (status: AvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'זמין/ה',
        };
      case 'UNAVAILABLE':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          label: 'עסוק/ה',
        };
      case 'DATING':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'בתהליך',
        };
      case 'PAUSED':
        return {
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          label: 'מושהה',
        };
   
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: status,
        };
    }
  };

  const statusBadgeInfo = getStatusBadge(statusState.status);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent
          side={locale === 'he' ? 'right' : 'left'}
          className="w-full sm:w-[650px] md:w-[750px] lg:w-[850px] xl:w-[900px] p-0 flex flex-col max-w-full"
          dir={direction}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking on dialogs
            if ((e.target as HTMLElement)?.closest('[role="dialog"]')) {
              e.preventDefault();
            }
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b bg-gradient-to-r from-slate-50 to-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {names.firstName || candidate.firstName}{' '}
                  {names.lastName || candidate.lastName}
                  <Badge className={cn('text-xs', statusBadgeInfo.color)}>
                    {dict.statusSection?.statuses?.[statusState.status] ||
                      statusBadgeInfo.label}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Mail className="w-3.5 h-3.5" />
                    {candidate.email}
                  </span>
                  {userPhone && (
                    <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                      <span dir="ltr">{userPhone}</span>
                    </span>
                  )}
                </SheetDescription>
              </div>

              {/* Saving indicator */}
              <AnimatePresence>
                {isSaving && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm border border-blue-100"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {dict.header.saving}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="p-4 space-y-3">
                {/* Quick Actions Bar */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSetupInviteOpen(true)}
                    disabled={
                      isSaving || isDeletingCandidate || isSendingInvite
                    }
                    className="gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {dict.footer.buttons.sendInvite}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInsightText}
                    disabled={isGeneratingInsight}
                    className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    {isGeneratingInsight ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    {locale === 'he' ? 'ניתוח עומק' : 'Deep Analysis'}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeleteCandidateDialogOpen(true)}
                      disabled={isSaving || isDeletingCandidate}
                      className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 mr-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {dict.footer.buttons.deleteCandidate}
                    </Button>
                  )}
                </div>

                {/* 1. Basic Info & Status Section */}
                <CollapsibleSection
                  title={
                    locale === 'he'
                      ? 'פרטים בסיסיים וסטטוס'
                      : 'Basic Info & Status'
                  }
                  description={
                    locale === 'he'
                      ? 'שם, סטטוס זמינות והערות'
                      : 'Name, availability status and notes'
                  }
                  icon={<UserCog className="w-5 h-5" />}
                  colorScheme="blue"
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    {/* Names */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          {locale === 'he' ? 'שם פרטי' : 'First Name'}
                        </Label>
                        <Input
                          value={names.firstName}
                          onChange={(e) => {
                            setNames((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }));
                            setHasChanges(true);
                          }}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          {locale === 'he' ? 'שם משפחה' : 'Last Name'}
                        </Label>
                        <Input
                          value={names.lastName}
                          onChange={(e) => {
                            setNames((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }));
                            setHasChanges(true);
                          }}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          {dict.statusSection?.statusLabel || 'סטטוס נוכחי'}
                        </Label>
                        <Select
                          value={statusState.status}
                          onValueChange={(value) => {
                            setStatusState((prev) => ({
                              ...prev,
                              status: value as AvailabilityStatus,
                            }));
                            setHasChanges(true);
                          }}
                          dir={direction}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(AvailabilityStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {dict.statusSection?.statuses?.[status] ||
                                  status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          {dict.statusSection?.noteLabel || 'הערה לסטטוס'}
                        </Label>
                        <Input
                          value={statusState.note}
                          onChange={(e) => {
                            setStatusState((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }));
                            setHasChanges(true);
                          }}
                          placeholder={
                            dict.statusSection?.notePlaceholder || ''
                          }
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleProfileUpdate(
                            {
                              firstName: names.firstName,
                              lastName: names.lastName,
                              availabilityStatus: statusState.status,
                              availabilityNote: statusState.note,
                            },
                            'basicInfo'
                          )
                        }
                        disabled={isSaving}
                        className="gap-1.5"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : recentlySaved === 'basicInfo' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {recentlySaved === 'basicInfo'
                          ? locale === 'he'
                            ? 'נשמר!'
                            : 'Saved!'
                          : locale === 'he'
                            ? 'שמור'
                            : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 2. NeshamaTech Summary */}
                <CollapsibleSection
                  title={dict.neshamaTechSummary.title}
                  description={dict.neshamaTechSummary.description}
                  icon={<Award className="w-5 h-5" />}
                  colorScheme="indigo"
                  defaultOpen={false}
                  actions={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary || isSaving}
                      className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    <Textarea
                      value={profile?.manualEntryText || ''}
                      onChange={(e) => {
                        setProfile((p) =>
                          p ? { ...p, manualEntryText: e.target.value } : null
                        );
                        setHasChanges(true);
                      }}
                      placeholder={dict.neshamaTechSummary.placeholder}
                      rows={5}
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleProfileUpdate(
                            {
                              manualEntryText: profile?.manualEntryText || null,
                            },
                            'summary'
                          )
                        }
                        disabled={isSaving || isGeneratingSummary}
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : recentlySaved === 'summary' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {recentlySaved === 'summary'
                          ? locale === 'he'
                            ? 'נשמר!'
                            : 'Saved!'
                          : dict.neshamaTechSummary.saveButton || 'שמור תקציר'}
                      </Button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 3. Conversation Summary */}
                <CollapsibleSection
                  title={
                    dict.conversationSummary?.title || 'סיכום שיחה עם שדכן'
                  }
                  description={
                    dict.conversationSummary?.description ||
                    'הערות פנימיות וסיכומים'
                  }
                  icon={<MessageSquare className="w-5 h-5" />}
                  colorScheme="teal"
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    <Textarea
                      value={profile?.conversationSummary || ''}
                      onChange={(e) => {
                        setProfile((p) =>
                          p
                            ? { ...p, conversationSummary: e.target.value }
                            : null
                        );
                        setHasChanges(true);
                      }}
                      placeholder={
                        dict.conversationSummary?.placeholder ||
                        'הקלד/י כאן את סיכום השיחה...'
                      }
                      rows={4}
                      className="text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleProfileUpdate(
                            {
                              conversationSummary:
                                profile?.conversationSummary || null,
                            },
                            'conversation'
                          )
                        }
                        disabled={isSaving}
                        className="gap-1.5 bg-teal-600 hover:bg-teal-700"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : recentlySaved === 'conversation' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        {recentlySaved === 'conversation'
                          ? locale === 'he'
                            ? 'נשמר!'
                            : 'Saved!'
                          : dict.conversationSummary?.saveButton ||
                            'שמור סיכום'}
                      </Button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 4. Full Profile Section */}
                <CollapsibleSection
                  title={dict.tabs.profile}
                  description={
                    locale === 'he'
                      ? 'כל הפרטים האישיים'
                      : 'All personal details'
                  }
                  icon={<UserCog className="w-5 h-5" />}
                  colorScheme="gray"
                  defaultOpen={false}
                >
                  {profile && (
                    <ProfileSection
                      profile={profile}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      onSave={handleProfileUpdate}
                      dict={profileDict.profileSection}
                      locale={locale}
                    />
                  )}
                </CollapsibleSection>

                {/* 5. Photos Section */}
                <CollapsibleSection
                  title={dict.tabs.photos}
                  description={`${images.length} ${locale === 'he' ? 'תמונות' : 'photos'}`}
                  icon={<ImageIcon className="w-5 h-5" />}
                  colorScheme="purple"
                  defaultOpen={false}
                  badge={
                    images.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {images.length}
                      </Badge>
                    )
                  }
                >
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
                </CollapsibleSection>

                {/* 6. Preferences Section */}
                <CollapsibleSection
                  title={dict.tabs.preferences}
                  description={
                    locale === 'he'
                      ? 'העדפות לחיפוש בן/בת זוג'
                      : 'Partner search preferences'
                  }
                  icon={<Sliders className="w-5 h-5" />}
                  colorScheme="blue"
                  defaultOpen={false}
                >
                  {profile && (
                    <PreferencesSection
                      profile={profile}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      onChange={handleProfileUpdate}
                      dictionary={profileDict.preferencesSection}
                      locale={locale}
                    />
                  )}
                </CollapsibleSection>
              </div>

              {/* Bottom padding for scrolling */}
              <div className="h-6" />
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* --- Insight Dialog --- */}
      <Dialog open={isInsightDialogOpen} onOpenChange={setIsInsightDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden"
          dir={direction}
        >
          <DialogHeader className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <DialogTitle className="flex items-center gap-2 text-xl text-indigo-800">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              {locale === 'he'
                ? `ניתוח עומק אישי - ${candidate?.firstName}`
                : `Deep Personal Analysis - ${candidate?.firstName}`}
            </DialogTitle>
            <DialogDescription className="text-indigo-600/80">
              {locale === 'he'
                ? 'דוח תובנות מעמיק המבוסס על נתוני הפרופיל והשאלון'
                : 'Deep insight report based on profile and questionnaire data'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="bg-white p-6 rounded-lg border shadow-sm text-gray-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-base font-sans">
              {insightText}
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={copyInsightToClipboard}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {locale === 'he' ? 'העתק טקסט' : 'Copy Text'}
            </Button>
            <Button
              onClick={() => setIsInsightDialogOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {locale === 'he' ? 'סגור' : 'Close'}
            </Button>
          </DialogFooter>
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

      {/* --- Delete Dialog --- */}
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
