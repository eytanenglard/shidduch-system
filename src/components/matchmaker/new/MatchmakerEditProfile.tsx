// src/components/matchmaker/new/MatchmakerEditProfile.tsx
'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProfileSection } from '@/components/profile';
import { PhotosSection } from '@/components/profile';
import { PreferencesSection } from '@/components/profile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
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
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  Heart,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { AvailabilityStatus } from '@prisma/client';
import type { UserProfile, UserImage } from '@/types/next-auth';
import type { Candidate } from './types/candidates';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
// PROFILE COMPLETION SCORE COMPONENT
// =============================================================================
interface ProfileCompletionProps {
  profile: UserProfile | null;
  images: UserImage[];
  locale: string;
  names: { firstName: string; lastName: string }; // הוסף שורה זו
}


const ProfileCompletionScore: React.FC<ProfileCompletionProps> = ({
  profile,
  images,
  locale,
    names, // הוסף כאן

}) => {
  const score = useMemo(() => {
    if (!profile) return { percentage: 0, details: [] };

   const checks = [
  { 
    key: 'basicInfo', 
    label: locale === 'he' ? 'פרטים בסיסיים' : 'Basic Info',
    completed: !!(names.firstName && names.lastName && profile.birthDate), // שנה לזה
    weight: 15 
  },
      { 
        key: 'location', 
        label: locale === 'he' ? 'מיקום' : 'Location',
        completed: !!(profile.city),
        weight: 10 
      },
      { 
        key: 'education', 
        label: locale === 'he' ? 'השכלה' : 'Education',
        completed: !!(profile.educationLevel),
        weight: 10 
      },
      { 
        key: 'occupation', 
        label: locale === 'he' ? 'תעסוקה' : 'Occupation',
        completed: !!(profile.occupation),
        weight: 10 
      },
      { 
        key: 'religion', 
        label: locale === 'he' ? 'רמה דתית' : 'Religious Level',
        completed: !!(profile.religiousLevel),
        weight: 15 
      },
      { 
        key: 'about', 
        label: locale === 'he' ? 'אודות' : 'About',
        completed: !!(profile.about && profile.about.length > 50),
        weight: 15 
      },
      { 
        key: 'photos', 
        label: locale === 'he' ? 'תמונות' : 'Photos',
        completed: images.length >= 2,
        weight: 15 
      },
      { 
        key: 'summary', 
        label: locale === 'he' ? 'תקציר שדכן' : 'Matchmaker Summary',
        completed: !!(profile.manualEntryText && profile.manualEntryText.length > 20),
        weight: 10 
      },
    ];

    const completedWeight = checks
      .filter((c) => c.completed)
      .reduce((sum, c) => sum + c.weight, 0);

    return {
      percentage: completedWeight,
      details: checks,
    };
  }, [profile, images, locale]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          {locale === 'he' ? 'שלמות הפרופיל' : 'Profile Completion'}
        </span>
        <span className={cn('text-lg font-bold', getScoreColor(score.percentage))}>
          {score.percentage}%
        </span>
      </div>
      
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score.percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('absolute h-full rounded-full', getProgressColor(score.percentage))}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {score.details.map((item) => (
          <TooltipProvider key={item.key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors',
                    item.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-current" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {item.completed
                    ? locale === 'he' ? '✓ הושלם' : '✓ Completed'
                    : locale === 'he' ? '○ חסר' : '○ Missing'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// TAB CONTENT COMPONENTS
// =============================================================================

// Basic Info Tab
interface BasicInfoTabProps {
  names: { firstName: string; lastName: string };
  setNames: React.Dispatch<React.SetStateAction<{ firstName: string; lastName: string }>>;
  statusState: { status: AvailabilityStatus; note: string };
  setStatusState: React.Dispatch<React.SetStateAction<{ status: AvailabilityStatus; note: string }>>;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onSave: (data: any, fieldName?: string) => Promise<void>;
  isSaving: boolean;
  recentlySaved: string | null;
  dict: MatchmakerPageDictionary['candidatesManager']['editProfile'];
  locale: string;
  direction: 'rtl' | 'ltr';
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  names,
  setNames,
  statusState,
  setStatusState,
  profile,
  setProfile,
  onSave,
  isSaving,
  recentlySaved,
  dict,
  locale,
  direction,
}) => {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-6">
      {/* Names & Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-2 text-blue-700 mb-4">
            <User className="w-5 h-5" />
            <h3 className="font-semibold">
              {locale === 'he' ? 'פרטים אישיים' : 'Personal Details'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {locale === 'he' ? 'שם פרטי' : 'First Name'}
              </Label>
              <Input
                value={names.firstName}
                onChange={(e) => {
                  setNames((prev) => ({ ...prev, firstName: e.target.value }));
                  setHasChanges(true);
                }}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {locale === 'he' ? 'שם משפחה' : 'Last Name'}
              </Label>
              <Input
                value={names.lastName}
                onChange={(e) => {
                  setNames((prev) => ({ ...prev, lastName: e.target.value }));
                  setHasChanges(true);
                }}
                className="h-10"
              />
            </div>
          </div>

          {/* Additional fields in grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                {locale === 'he' ? 'תאריך לידה' : 'Birth Date'}
              </Label>
              <Input
                type="date"
                value={profile?.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  setProfile((p) => p ? { ...p, birthDate: new Date(e.target.value) } : null);
                  setHasChanges(true);
                }}
                className="h-10"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                {locale === 'he' ? 'עיר מגורים' : 'City'}
              </Label>
              <Input
                value={profile?.city || ''}
                onChange={(e) => {
                  setProfile((p) => p ? { ...p, city: e.target.value } : null);
                  setHasChanges(true);
                }}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-gray-500" />
                {locale === 'he' ? 'מצב משפחתי' : 'Marital Status'}
              </Label>
              <Select
                value={profile?.maritalStatus || ''}
                onValueChange={(value) => {
                  setProfile((p) => p ? { ...p, maritalStatus: value } : null);
                  setHasChanges(true);
                }}
                dir={direction}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={locale === 'he' ? 'בחר...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">{locale === 'he' ? 'רווק/ה' : 'Single'}</SelectItem>
                  <SelectItem value="DIVORCED">{locale === 'he' ? 'גרוש/ה' : 'Divorced'}</SelectItem>
                  <SelectItem value="WIDOWED">{locale === 'he' ? 'אלמן/ה' : 'Widowed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-2 text-teal-700 mb-4">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">
              {locale === 'he' ? 'סטטוס וזמינות' : 'Status & Availability'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
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
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AvailabilityStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {dict.statusSection?.statuses?.[status] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {dict.statusSection?.noteLabel || 'הערה לסטטוס'}
              </Label>
              <Input
                value={statusState.note}
                onChange={(e) => {
                  setStatusState((prev) => ({ ...prev, note: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder={dict.statusSection?.notePlaceholder || ''}
                className="h-10"
              />
            </div>
          </div>

          {/* Education & Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                {locale === 'he' ? 'השכלה' : 'Education'}
              </Label>
              <Input
                value={profile?.educationLevel || ''}
                onChange={(e) => {
                  setProfile((p) => p ? { ...p, educationLevel: e.target.value } : null);
                  setHasChanges(true);
                }}
                className="h-10"
                placeholder={locale === 'he' ? 'לדוגמה: תואר ראשון' : 'e.g., Bachelor\'s Degree'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                {locale === 'he' ? 'תעסוקה' : 'Occupation'}
              </Label>
              <Input
                value={profile?.occupation || ''}
                onChange={(e) => {
                  setProfile((p) => p ? { ...p, occupation: e.target.value } : null);
                  setHasChanges(true);
                }}
                className="h-10"
                placeholder={locale === 'he' ? 'לדוגמה: מהנדס תוכנה' : 'e.g., Software Engineer'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() =>
            onSave(
              {
                firstName: names.firstName,
                lastName: names.lastName,
                availabilityStatus: statusState.status,
                availabilityNote: statusState.note,
                birthDate: profile?.birthDate,
                city: profile?.city,
                maritalStatus: profile?.maritalStatus,
                educationLevel: profile?.educationLevel,
                occupation: profile?.occupation,
              },
              'basicInfo'
            )
          }
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : recentlySaved === 'basicInfo' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {recentlySaved === 'basicInfo'
            ? locale === 'he' ? 'נשמר בהצלחה!' : 'Saved!'
            : locale === 'he' ? 'שמור שינויים' : 'Save Changes'}
        </Button>
      </div>
    </div>
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
const direction: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';  const scrollRef = useRef<HTMLDivElement>(null);

  // --- States ---
  const [activeTab, setActiveTab] = useState('basic');
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
  const [isDeleteCandidateDialogOpen, setIsDeleteCandidateDialogOpen] = useState(false);
  const [deleteCandidateConfirmText, setDeleteCandidateConfirmText] = useState('');
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
            status: data.profile.availabilityStatus || AvailabilityStatus.AVAILABLE,
            note: data.profile.availabilityNote || '',
          });
        }

        if (candidate.email && !candidate.email.endsWith('@shidduch.placeholder.com')) {
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
      setActiveTab('basic');
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
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile((prevProfile) => ({ ...prevProfile, ...updatedData }) as UserProfile);

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
          note: updatedData.availabilityNote !== undefined ? updatedData.availabilityNote : prev.note,
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
      toast.error(locale === 'he' ? 'שגיאה ביצירת הדוח' : 'Error generating report');
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
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(`שגיאה בהעלאת הקובץ ${file.name}: ${data.error || 'שגיאת שרת'}`);
      }
      return data.image;
    });
    try {
      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newImages]);
      toast.success(
        newImages.length > 1
          ? dict.toasts.uploadSuccessMultiple.replace('{{count}}', String(newImages.length))
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
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to set main image');
      setImages((prev) => prev.map((img) => ({ ...img, isMain: img.id === imageId })));
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
      const isMainImageBeingDeleted = currentMainImage ? imageIds.includes(currentMainImage.id) : false;
      const deletePromises = imageIds.map((id) =>
        fetch(`/api/matchmaker/candidates/${candidate.id}/images/${id}`, { method: 'DELETE' })
      );
      const responses = await Promise.all(deletePromises);
      for (const response of responses) {
        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Error deleting one of the images (status: ${response.status})`
          );
        }
      }
      const remainingImages = images.filter((img) => !imageIds.includes(img.id));
      if (isMainImageBeingDeleted && remainingImages.length > 0) {
        setImages(remainingImages);
        await handleSetMainImage(remainingImages[0].id);
      } else {
        setImages(remainingImages);
      }
      toast.success(
        imageIds.length > 1
          ? dict.toasts.deleteImageSuccessMultiple.replace('{{count}}', String(imageIds.length))
          : dict.toasts.deleteImageSuccessSingle,
        { position: 'top-center' }
      );
    } catch (error) {
      console.error('Error deleting image(s):', error);
      toast.error(error instanceof Error ? error.message : dict.toasts.deleteImageError);
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
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete candidate profile');
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
      const response = await fetch(`/api/matchmaker/candidates/${candidate.id}/invite-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || dict.toasts.sendInviteErrorGeneral);
      toast.success(dict.toasts.sendInviteSuccess);
      setIsSetupInviteOpen(false);
    } catch (error) {
      console.error('Error sending setup invite:', error);
      toast.error(error instanceof Error ? error.message : dict.toasts.sendInviteErrorGeneral);
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!candidate && isOpen) return null;
  if (!candidate) return null;

  // Get status badge color
  const getStatusBadge = (status: AvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { color: 'bg-green-100 text-green-700 border-green-200', label: 'זמין/ה' };
      case 'UNAVAILABLE':
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'עסוק/ה' };
      case 'DATING':
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'בתהליך' };
      case 'PAUSED':
        return { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'מושהה' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  const statusBadgeInfo = getStatusBadge(statusState.status);

  // Tab definitions
  const tabs = [
    { id: 'basic', label: locale === 'he' ? 'פרטים בסיסיים' : 'Basic Info', icon: UserCog },
    { id: 'summary', label: locale === 'he' ? 'תקצירים' : 'Summaries', icon: Award },
    { id: 'profile', label: locale === 'he' ? 'פרופיל מלא' : 'Full Profile', icon: FileText },
    { id: 'photos', label: locale === 'he' ? 'תמונות' : 'Photos', icon: ImageIcon },
    { id: 'preferences', label: locale === 'he' ? 'העדפות' : 'Preferences', icon: Sliders },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent
          side={locale === 'he' ? 'right' : 'left'}
          className="w-full sm:max-w-[95vw] lg:max-w-[85vw] xl:max-w-[1400px] p-0 flex flex-col"
          dir={direction}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if ((e.target as HTMLElement)?.closest('[role="dialog"]')) {
              e.preventDefault();
            }
          }}
        >
          {/* Sticky Header */}
          <div className="flex-shrink-0 border-b bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-4 sticky top-0 z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Name & Status */}
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-3 flex-wrap">
                  {names.firstName || candidate.firstName} {names.lastName || candidate.lastName}
                  <Badge className={cn('text-xs', statusBadgeInfo.color)}>
                    {dict.statusSection?.statuses?.[statusState.status] || statusBadgeInfo.label}
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

              {/* Right: Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSetupInviteOpen(true)}
                  disabled={isSaving || isDeletingCandidate || isSendingInvite}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{dict.footer.buttons.sendInvite}</span>
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
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {locale === 'he' ? 'ניתוח עומק' : 'Deep Analysis'}
                  </span>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteCandidateDialogOpen(true)}
                    disabled={isSaving || isDeletingCandidate}
                    className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{dict.footer.buttons.deleteCandidate}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">{locale === 'he' ? 'טוען נתונים...' : 'Loading data...'}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Sidebar - Tabs (Desktop) */}
              <div className="hidden lg:flex flex-col w-64 border-l bg-gray-50/50 p-4 space-y-3">
                {/* Profile Completion */}
<ProfileCompletionScore profile={profile} images={images} locale={locale} names={names} />

                {/* Vertical Tabs */}
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-white shadow-sm border border-gray-200 text-primary'
                          : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {tab.id === 'photos' && images.length > 0 && (
                        <Badge variant="secondary" className="mr-auto text-xs">
                          {images.length}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile Tabs */}
              <div className="lg:hidden border-b bg-white px-4 py-2 overflow-x-auto flex-shrink-0">
                <div className="flex gap-1 min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="p-6 max-w-5xl mx-auto">
                  {/* Mobile Profile Completion */}
                  <div className="lg:hidden mb-6">
<ProfileCompletionScore profile={profile} images={images} locale={locale} names={names} />
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 'basic' && (
                        <BasicInfoTab
                          names={names}
                          setNames={setNames}
                          statusState={statusState}
                          setStatusState={setStatusState}
                          profile={profile}
                          setProfile={setProfile}
                          onSave={handleProfileUpdate}
                          isSaving={isSaving}
                          recentlySaved={recentlySaved}
                          dict={dict}
                          locale={locale}
                          direction={direction}
                        />
                      )}

                      {activeTab === 'summary' && (
                        <div className="space-y-6">
                          {/* NeshamaTech Summary */}
                          <div className="bg-white rounded-xl border p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2 text-indigo-700">
                                <Award className="w-5 h-5" />
                                <h3 className="font-semibold">{dict.neshamaTechSummary.title}</h3>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateSummary}
                                disabled={isGeneratingSummary || isSaving}
                                className="gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              >
                                {isGeneratingSummary ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                {locale === 'he' ? 'צור עם AI' : 'Generate with AI'}
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">
                              {dict.neshamaTechSummary.description}
                            </p>
                            <Textarea
                              value={profile?.manualEntryText || ''}
                              onChange={(e) => {
                                setProfile((p) => (p ? { ...p, manualEntryText: e.target.value } : null));
                                setHasChanges(true);
                              }}
                              placeholder={dict.neshamaTechSummary.placeholder}
                              rows={6}
                              className="text-sm"
                            />
                            <div className="flex justify-end mt-4">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleProfileUpdate(
                                    { manualEntryText: profile?.manualEntryText || null },
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
                                  ? locale === 'he' ? 'נשמר!' : 'Saved!'
                                  : dict.neshamaTechSummary.saveButton || 'שמור תקציר'}
                              </Button>
                            </div>
                          </div>

                          {/* Conversation Summary */}
                          <div className="bg-white rounded-xl border p-5">
                            <div className="flex items-center gap-2 text-teal-700 mb-4">
                              <MessageSquare className="w-5 h-5" />
                              <h3 className="font-semibold">
                                {dict.conversationSummary?.title || 'סיכום שיחה עם שדכן'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">
                              {dict.conversationSummary?.description || 'הערות פנימיות וסיכומים'}
                            </p>
                            <Textarea
                              value={profile?.conversationSummary || ''}
                              onChange={(e) => {
                                setProfile((p) => (p ? { ...p, conversationSummary: e.target.value } : null));
                                setHasChanges(true);
                              }}
                              placeholder={dict.conversationSummary?.placeholder || 'הקלד/י כאן את סיכום השיחה...'}
                              rows={5}
                              className="text-sm"
                            />
                            <div className="flex justify-end mt-4">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleProfileUpdate(
                                    { conversationSummary: profile?.conversationSummary || null },
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
                                  ? locale === 'he' ? 'נשמר!' : 'Saved!'
                                  : dict.conversationSummary?.saveButton || 'שמור סיכום'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'profile' && profile && (
                        <div className="bg-white rounded-xl border p-5">
                          <ProfileSection
                            profile={profile}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onSave={handleProfileUpdate}
                            dict={profileDict.profileSection}
                            locale={locale}
                          />
                        </div>
                      )}

                      {activeTab === 'photos' && (
                        <div className="bg-white rounded-xl border p-5">
                          <div className="flex items-center gap-2 text-purple-700 mb-4">
                            <ImageIcon className="w-5 h-5" />
                            <h3 className="font-semibold">{dict.tabs.photos}</h3>
                            <Badge variant="secondary" className="mr-2">
                              {images.length} / 10
                            </Badge>
                          </div>
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
                      )}

                      {activeTab === 'preferences' && profile && (
                        <div className="bg-white rounded-xl border p-5">
                          <PreferencesSection
                            profile={profile}
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onChange={handleProfileUpdate}
                            dictionary={profileDict.preferencesSection}
                            locale={locale}
                          />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom padding */}
                <div className="h-8" />
              </ScrollArea>
            </div>
          )}

          {/* Sticky Footer */}
          <div className="flex-shrink-0 border-t bg-white px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {hasChanges && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  {locale === 'he' ? 'יש שינויים שלא נשמרו' : 'Unsaved changes'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                {locale === 'he' ? 'סגור' : 'Close'}
              </Button>
            </div>
          </div>
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
            <Button variant="outline" onClick={copyInsightToClipboard} className="gap-2">
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
                <Button type="button" variant="secondary" disabled={isSendingInvite}>
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
                  <Send className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')} />
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
          onOpenChange={(open) => !isDeletingCandidate && setIsDeleteCandidateDialogOpen(open)}
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
                deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE && (
                  <p className="text-xs text-red-600">{dict.deleteDialog.mismatchError}</p>
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
                  deleteCandidateConfirmText !== DELETE_CANDIDATE_CONFIRMATION_PHRASE
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