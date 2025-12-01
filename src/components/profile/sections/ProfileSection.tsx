// src/app/components/profile/sections/ProfileSection.tsx
'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import CvUploadSection from './CvUploadSection'; // Adjust the path if necessary

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Gender,
  AvailabilityStatus,
  ServiceType,
  HeadCoveringType,
  KippahType,
  ReligiousJourney,
} from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pencil,
  Save,
  X,
  Award,
  Send,
  Copy,
  Users,
  BookOpen,
  Loader2,
  Trash2,
  Briefcase,
  Shield,
  Heart,
  MapPin,
  Languages,
  Palette,
  Smile,
  UserCircle,
  Info,
  HeartPulse,
  Lock,
  Eye,
} from 'lucide-react';
import { UserProfile, FriendTestimonial } from '@/types/next-auth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { languageOptions } from '@/lib/languageOptions';
import { toast } from 'sonner';
import Autocomplete from 'react-google-autocomplete';
import { Switch } from '@/components/ui/switch';
import { ProfileSectionDict, FriendTestimonialsDict } from '@/types/dictionary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface ProfileSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  viewOnly?: boolean;
  onSave: (data: Partial<UserProfile>) => void;
  dict: ProfileSectionDict;
  locale: string;
  onCvUpload?: (file: File) => Promise<void>; // ✨ Add this
  onCvDelete?: () => Promise<void>; // ✨ Add this
  isCvUploading?: boolean; // ✨ Add this
}

const ensureDateObject = (
  value: string | number | Date | null | undefined
): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
};

// ========================================================================
// ✨ Helper Functions
// ========================================================================

const renderDisplayValue = (
  value: unknown,
  dict: ProfileSectionDict,
  placeholder?: string
): React.ReactNode => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Intl.DateTimeFormat('he-IL').format(value);
  }
  return String(value);
};

const renderSelectDisplayValue = (
  value: string | undefined | null,
  options: { value: string; label: string }[],
  dict: ProfileSectionDict,
  placeholder?: string
) => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  if (!value) {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  const option = options.find((opt) => opt.value === value);
  return option ? (
    option.label
  ) : (
    <span className="italic text-gray-500">{finalPlaceholder}</span>
  );
};

const renderBooleanDisplayValue = (
  value: boolean | undefined | null,
  dict: ProfileSectionDict,
  trueLabel?: string,
  falseLabel?: string,
  placeholder?: string
) => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  const finalTrueLabel = trueLabel || dict.cards.family.hasChildrenYes;
  const finalFalseLabel = falseLabel || dict.cards.medical.display.no;

  if (value === undefined || value === null) {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  return value ? finalTrueLabel : finalFalseLabel;
};

// ========================================================================
// ✨ Sub-Components
// ========================================================================

const StoryAndMoreCard: React.FC<{
  profile: UserProfile | null;
  isEditing: boolean;
  dict: ProfileSectionDict;
  handleChange: (field: keyof UserProfile, value: any) => void;
  formData: Partial<UserProfile>;
  direction: string; // Added direction prop
}> = ({ profile, isEditing, dict, handleChange, formData, direction }) => {
  if (!profile) return null;
  const tAboutCard = dict.cards.about;
  const tAboutMe = dict.aboutMe;

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50/40 to-gray-100/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
        <Info className="w-5 h-5 text-slate-600" />
        <CardTitle className="text-base font-semibold text-gray-700">
          {tAboutCard.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Profile Headline Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label
                htmlFor="profileHeadline"
                className="text-sm font-medium text-gray-700"
              >
                {tAboutCard.headlineLabel}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-describedby="headline-tooltip">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    id="headline-tooltip"
                    side="top"
                    className="max-w-xs text-center"
                    dir={direction}
                    sideOffset={5}
                    collisionPadding={10}
                  >
                    {/* UPDATED: Use placeholder text */}
                    <p>{tAboutCard.headlinePlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Input
                id="profileHeadline"
                value={formData.profileHeadline || ''}
                onChange={(e) =>
                  handleChange('profileHeadline', e.target.value)
                }
                className="text-sm focus:ring-cyan-500 rounded-lg"
                placeholder={tAboutCard.headlinePlaceholder}
                maxLength={80}
              />
            ) : (
              <div className="mt-1">
                {formData.profileHeadline &&
                typeof formData.profileHeadline === 'string' &&
                formData.profileHeadline.trim() ? (
                  <p className="text-lg font-semibold text-cyan-700 italic">
                    {`"${formData.profileHeadline}"`}
                  </p>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3 text-base italic border border-slate-200/80">
                    <p className="font-medium not-italic text-slate-600">
                      {tAboutCard.headlineEmpty.title}
                    </p>
                    <p className="mt-1.5 text-slate-500">
                      {tAboutCard.headlineEmpty.subtitle}
                      <span className="block mt-1 font-semibold text-slate-700">
                        {tAboutCard.headlineEmpty.example}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Story Section (formerly AboutMeCard) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="about"
                  className="text-sm font-medium text-gray-700"
                >
                  {tAboutMe.cardTitle}
                </Label>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-describedby="about-tooltip"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      id="about-tooltip"
                      side="top"
                      className="max-w-xs text-center"
                      dir={direction}
                      sideOffset={5}
                      collisionPadding={10}
                    >
                      {/* UPDATED: Use placeholder text */}
                      <p>{tAboutMe.placeholder}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {/*    <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isAboutVisible ?? true}
                        onCheckedChange={(checked) =>
                          handleChange('isAboutVisible', checked)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    dir={direction}
                    sideOffset={5}
                    collisionPadding={10}
                  >
                    <p>{tAboutMe.visibilityTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider> */}
            </div>
            {isEditing ? (
              <div>
                <Textarea
                  id="about"
                  value={formData.about || ''}
                  onChange={(e) => handleChange('about', e.target.value)}
                  className={cn(
                    'text-sm focus:ring-cyan-500 min-h-[120px] rounded-lg',
                    formData.about && formData.about.trim().length < 100
                      ? 'border-red-400 focus:ring-red-300'
                      : ''
                  )}
                  placeholder={tAboutMe.placeholder}
                  rows={5}
                  aria-describedby="about-char-count"
                />
                {formData.about && (
                  <div
                    id="about-char-count"
                    className={cn(
                      'text-xs mt-1 text-end',
                      formData.about.trim().length < 100
                        ? 'text-red-600'
                        : 'text-gray-500'
                    )}
                  >
                    {formData.about.trim().length}
                    {dict.charCount.replace('{{count}}', '100')}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                {formData.about || (
                  <span className="text-gray-500 italic">
                    {tAboutCard.aboutEmpty}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Inspiring Couple Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label
                htmlFor="inspiringCoupleStory"
                className="text-sm font-medium text-gray-700"
              >
                {tAboutCard.inspiringCoupleLabel}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-describedby="couple-tooltip">
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    id="couple-tooltip"
                    side="top"
                    className="max-w-xs text-center"
                    dir={direction}
                    sideOffset={5}
                    collisionPadding={10}
                  >
                    {/* UPDATED: Use placeholder text */}
                    <p>{tAboutCard.inspiringCouplePlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Textarea
                id="inspiringCoupleStory"
                value={formData.inspiringCoupleStory || ''}
                onChange={(e) =>
                  handleChange('inspiringCoupleStory', e.target.value)
                }
                className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                placeholder={tAboutCard.inspiringCouplePlaceholder}
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                {renderDisplayValue(
                  formData.inspiringCoupleStory,
                  dict,
                  tAboutCard.inspiringCoupleEmpty
                )}
              </p>
            )}
          </div>

          {/* Private Notes Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label
                htmlFor="matchingNotes-private"
                className="text-sm font-medium text-gray-700"
              >
                {tAboutCard.privateNotesLabel}
              </Label>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-describedby="private-notes-tooltip"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    id="private-notes-tooltip"
                    side="top"
                    className="max-w-xs text-center"
                    dir={direction}
                    sideOffset={5}
                    collisionPadding={10}
                  >
                    {/* UPDATED: Use placeholder text */}
                    <p>{tAboutCard.privateNotesPlaceholder}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Textarea
                id="matchingNotes-private"
                value={formData.matchingNotes || ''}
                onChange={(e) => handleChange('matchingNotes', e.target.value)}
                className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                placeholder={tAboutCard.privateNotesPlaceholder}
                rows={3}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                {formData.matchingNotes || (
                  <span className="text-gray-500 italic">
                    {tAboutCard.privateNotesEmpty}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NeshamaTechSummaryCard: React.FC<{
  profile: UserProfile | null;
  isEditing: boolean;
  dict: ProfileSectionDict;
  handleChange: (field: keyof UserProfile, value: any) => void;
  formData: Partial<UserProfile>;
  direction: string; // Added direction prop
}> = ({ profile, isEditing, dict, handleChange, formData, direction }) => {
  if (!profile) return null;
  const t = dict.neshamaTechSummary;
  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50/40 to-indigo-50/40 border-b border-gray-200/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-700" />
          <CardTitle className="text-base font-semibold text-gray-700">
            {t.cardTitle}
          </CardTitle>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch
                checked={formData.isNeshamaTechSummaryVisible ?? true}
                onCheckedChange={(checked) =>
                  handleChange('isNeshamaTechSummaryVisible', checked)
                }
                disabled={!isEditing}
              />
            </TooltipTrigger>
            <TooltipContent
              dir={direction}
              sideOffset={5}
              collisionPadding={10}
            >
              <p>{t.visibilityTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]">
          {profile.manualEntryText || (
            <span className="italic text-gray-500">{t.emptyState}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

const FriendTestimonialsManager: React.FC<{
  profile: UserProfile | null;
  isEditing: boolean;
  dict: ProfileSectionDict;
  handleChange: (field: keyof UserProfile, value: any) => void;
  formData: Partial<UserProfile>;
  direction: string; // Added direction prop
}> = ({ profile, isEditing, dict, handleChange, formData, direction }) => {
  const [testimonials, setTestimonials] = useState<FriendTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [requestLink, setRequestLink] = useState('');

  const t = dict.friendTestimonials;

  const fetchTestimonials = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/testimonials');
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.testimonials);
      } else {
        throw new Error(data.message || 'Failed to fetch');
      }
    } catch (error) {
      toast.error('Failed to load testimonials.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleStatusChange = async (
    id: string,
    status: 'APPROVED' | 'HIDDEN'
  ) => {
    try {
      const response = await fetch(`/api/profile/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      toast.success('סטטוס ההמלצה עודכן!');
      fetchTestimonials(); // Refresh list
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס ההמלצה.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      try {
        const response = await fetch(`/api/profile/testimonials/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete');
        toast.success('ההמלצה נמחקה.');
        fetchTestimonials(); // Refresh list
      } catch (error) {
        toast.error('שגיאה במחיקת ההמלצה.');
      }
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await fetch('/api/profile/testimonials/request-link', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setRequestLink(data.link);
        setIsLinkModalOpen(true);
      } else {
        throw new Error(data.message || 'Failed to generate link');
      }
    } catch (error) {
      toast.error('שגיאה ביצירת קישור לבקשת המלצה.');
    }
  };

  const getStatusBadge = (status: 'PENDING' | 'APPROVED' | 'HIDDEN') => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">{t.pendingApproval}</Badge>;
      case 'APPROVED':
        return <Badge variant="success">{t.approvedAndVisible}</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary">{t.hidden}</Badge>;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-teal-50/40 to-green-50/40 border-b border-gray-200/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-700" />
          <CardTitle className="text-base font-semibold text-gray-700">
            {t.cardTitle}
          </CardTitle>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch
                checked={formData.isFriendsSectionVisible ?? true}
                onCheckedChange={(checked) =>
                  handleChange('isFriendsSectionVisible', checked)
                }
                disabled={!isEditing}
              />
            </TooltipTrigger>
            <TooltipContent
              dir={direction}
              sideOffset={5}
              collisionPadding={10}
            >
              <p>{t.visibilityTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4 p-4 bg-slate-50 rounded-lg border">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsAddModalOpen(true)}
            >
              {t.addManualButton}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleGenerateLink}
            >
              <Send className="w-4 h-4 mr-2" />
              {t.requestLinkButton}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <p className="text-sm text-center text-gray-500 py-4">
                {t.emptyState}
              </p>
            ) : (
              testimonials.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-3 bg-white/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="italic text-sm text-gray-600">
                        &quot;{item.content}&quot;
                      </p>
                      <p className="text-xs font-semibold mt-2">
                        - {item.authorName}, {item.relationship}
                      </p>
                    </div>
                    {isEditing && getStatusBadge(item.status)}
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      {item.status !== 'APPROVED' && (
                        <Button
                          size="xs"
                          onClick={() =>
                            handleStatusChange(item.id, 'APPROVED')
                          }
                        >
                          {t.approveButton}
                        </Button>
                      )}
                      {item.status === 'APPROVED' && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleStatusChange(item.id, 'HIDDEN')}
                        >
                          {t.hideButton}
                        </Button>
                      )}
                      {item.status === 'HIDDEN' && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(item.id, 'APPROVED')
                          }
                        >
                          {t.showButton}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t.deleteButton}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      <AddTestimonialModal
        isOpen={isAddModalOpen}
        setIsOpen={setIsAddModalOpen}
        dict={t.addModal}
        onSuccess={fetchTestimonials}
      />

      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.linkModal.title}</DialogTitle>
            <DialogDescription>{t.linkModal.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Input value={requestLink} readOnly />
            <Button
              onClick={() =>
                navigator.clipboard
                  .writeText(requestLink)
                  .then(() => toast.success(t.linkModal.copiedTooltip))
              }
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLinkModalOpen(false)}>
              {t.linkModal.closeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const AddTestimonialModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dict: FriendTestimonialsDict['addModal'];
  onSuccess: () => void;
}> = ({ isOpen, setIsOpen, dict, onSuccess }) => {
  const [formData, setFormData] = useState({
    authorName: '',
    relationship: '',
    content: '',
    authorPhone: '',
    isPhoneVisibleToMatch: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to add testimonial');
      toast.success('Testimonial added!');
      onSuccess();
      setIsOpen(false);
      setFormData({
        authorName: '',
        relationship: '',
        content: '',
        authorPhone: '',
        isPhoneVisibleToMatch: false,
      });
    } catch (error) {
      toast.error('Error adding testimonial.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{dict.authorNameLabel}</Label>
            <Input
              name="authorName"
              value={formData.authorName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, authorName: e.target.value }))
              }
              required
              placeholder={dict.authorNamePlaceholder}
            />
          </div>
          <div>
            <Label>{dict.relationshipLabel}</Label>
            <Input
              name="relationship"
              value={formData.relationship}
              onChange={(e) =>
                setFormData((p) => ({ ...p, relationship: e.target.value }))
              }
              required
              placeholder={dict.relationshipPlaceholder}
            />
          </div>
          <div>
            <Label>{dict.contentLabel}</Label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((p) => ({ ...p, content: e.target.value }))
              }
              required
              placeholder={dict.contentPlaceholder}
            />
          </div>
          <div>
            <Label>{dict.phoneLabel}</Label>
            <Input
              name="authorPhone"
              type="tel"
              value={formData.authorPhone}
              onChange={(e) =>
                setFormData((p) => ({ ...p, authorPhone: e.target.value }))
              }
              placeholder={dict.phonePlaceholder}
            />
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="consent"
              checked={formData.isPhoneVisibleToMatch}
              onCheckedChange={(c) =>
                setFormData((p) => ({ ...p, isPhoneVisibleToMatch: !!c }))
              }
              disabled={!formData.authorPhone}
            />
            <Label htmlFor="consent">{dict.consentLabel}</Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              {dict.cancelButton}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                dict.saveButton
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ========================================================================
// ✨ Main Component: ProfileSection
// ========================================================================

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile: profileProp,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
  onCvUpload, // ✨ Add this
  onCvDelete, // ✨ Add this
  isCvUploading, // ✨ Add this
  dict,
  locale,
}) => {
  console.log('✅ ProfileSection component has successfully loaded!');

  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});

  const [cityInputValue, setCityInputValue] = useState('');
  const [aliyaCountryInputValue, setAliyaCountryInputValue] = useState('');

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  const characterTraitsOptions = useMemo(
    () =>
      Object.entries(dict.options.traits).map(([value, label]) => ({
        value,
        label,
        icon:
          {
            empathetic: Heart,
            driven: Briefcase,
            optimistic: Smile,
            family_oriented: Users,
            intellectual: BookOpen,
            organized: Palette,
            calm: Heart,
            humorous: Smile,
            sociable: Users,
            sensitive: Heart,
            independent: MapPin,
            creative: Palette,
            honest: Shield,
            responsible: Shield,
            easy_going: Smile,
          }[value] || Smile,
      })),
    [dict.options.traits]
  );

  const hobbiesOptions = useMemo(
    () =>
      Object.entries(dict.options.hobbies).map(([value, label]) => ({
        value,
        label,
        icon:
          {
            travel: MapPin,
            sports: Briefcase,
            reading: BookOpen,
            cooking_baking: Palette,
            music_playing_instrument: Languages,
            art_crafts: Palette,
            volunteering: Heart,
            learning_courses: BookOpen,
            board_games_puzzles: Smile,
            movies_theater: Smile,
            dancing: Users,
            writing: BookOpen,
            nature_hiking: MapPin,
            photography: Palette,
          }[value] || Smile,
      })),
    [dict.options.hobbies]
  );

  const maritalStatusOptions = useMemo(
    () =>
      Object.entries(dict.options.maritalStatus).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.maritalStatus]
  );
  const religiousLevelOptions = useMemo(
    () =>
      Object.entries(dict.options.religiousLevel).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.religiousLevel]
  );
  const religiousJourneyOptions = useMemo(
    () =>
      Object.entries(dict.options.religiousJourney).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.religiousJourney]
  );
  const educationLevelOptions = useMemo(
    () =>
      Object.entries(dict.options.educationLevel).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.educationLevel]
  );
  const serviceTypeOptions = useMemo(
    () =>
      Object.entries(dict.options.serviceType).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.serviceType]
  );
  const headCoveringOptions = useMemo(
    () =>
      Object.entries(dict.options.headCovering).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.headCovering]
  );
  const kippahTypeOptions = useMemo(
    () =>
      Object.entries(dict.options.kippahType).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.kippahType]
  );
  const preferredMatchmakerGenderOptions = useMemo(
    () =>
      Object.entries(dict.options.matchmakerGender).map(([value, label]) => ({
        value,
        label,
      })),
    [dict.options.matchmakerGender]
  );

  const initializeFormData = useCallback((profileData: UserProfile | null) => {
    let headline = profileData?.profileHeadline || '';
    if (typeof headline === 'object' && headline !== null) {
      headline = '';
    }

    const dataToSet: Partial<UserProfile> = {
      gender: profileData?.gender || undefined,
      birthDate: ensureDateObject(profileData?.birthDate),
      nativeLanguage: profileData?.nativeLanguage || undefined,
      additionalLanguages: profileData?.additionalLanguages || [],
      height: profileData?.height ?? undefined,
      maritalStatus: profileData?.maritalStatus || undefined,
      occupation: profileData?.occupation || '',
      education: profileData?.education || '',
      educationLevel: profileData?.educationLevel || undefined,
      city: profileData?.city || '',
      origin: profileData?.origin || '',
      religiousJourney: profileData?.religiousJourney || undefined,
      religiousLevel: profileData?.religiousLevel || undefined,
      about: profileData?.about || '',
      parentStatus: profileData?.parentStatus || undefined,
      fatherOccupation: profileData?.fatherOccupation || '',
      motherOccupation: profileData?.motherOccupation || '',
      siblings: profileData?.siblings ?? undefined,
      position: profileData?.position ?? undefined,
      isProfileVisible: profileData?.isProfileVisible ?? true,
      preferredMatchmakerGender:
        profileData?.preferredMatchmakerGender || undefined,
      availabilityStatus:
        profileData?.availabilityStatus || AvailabilityStatus.AVAILABLE,
      availabilityNote: profileData?.availabilityNote || '',
      availabilityUpdatedAt: ensureDateObject(
        profileData?.availabilityUpdatedAt
      ),
      matchingNotes: profileData?.matchingNotes || '',
      shomerNegiah: profileData?.shomerNegiah ?? undefined,
      serviceType: profileData?.serviceType || undefined,
      serviceDetails: profileData?.serviceDetails || '',
      headCovering: profileData?.headCovering || undefined,
      kippahType: profileData?.kippahType || undefined,
      hasChildrenFromPrevious:
        profileData?.hasChildrenFromPrevious ?? undefined,
      profileCharacterTraits: profileData?.profileCharacterTraits || [],
      profileHobbies: profileData?.profileHobbies || [],
      aliyaCountry: profileData?.aliyaCountry || '',
      aliyaYear: profileData?.aliyaYear ?? undefined,
      id: profileData?.id,
      userId: profileData?.userId,
      createdAt: ensureDateObject(profileData?.createdAt),
      updatedAt: ensureDateObject(profileData?.updatedAt),
      lastActive: ensureDateObject(profileData?.lastActive),
      hasMedicalInfo: profileData?.hasMedicalInfo ?? false,
      medicalInfoDetails: profileData?.medicalInfoDetails || '',
      medicalInfoDisclosureTiming:
        profileData?.medicalInfoDisclosureTiming || undefined,
      isMedicalInfoVisible: profileData?.isMedicalInfoVisible ?? false,
      profileHeadline: headline,
      inspiringCoupleStory: profileData?.inspiringCoupleStory || '',
      influentialRabbi: profileData?.influentialRabbi || '',
      isAboutVisible: profileData?.isAboutVisible ?? true,
      isFriendsSectionVisible: profileData?.isFriendsSectionVisible ?? true,
      isNeshamaTechSummaryVisible:
        profileData?.isNeshamaTechSummaryVisible ?? true,
      cvUrl: profileData?.cvUrl,
      cvSummary: profileData?.cvSummary,
    };
    setFormData(dataToSet);
    setInitialData(dataToSet);

    setCityInputValue(dataToSet.city || '');
    setAliyaCountryInputValue(dataToSet.aliyaCountry || '');
  }, []);

  useEffect(() => {
    setLoading(true);
    if (profileProp) {
      initializeFormData(profileProp);
      setLoading(false);
    }
  }, [profileProp, initializeFormData]);

  const handleChange = (
    field: keyof UserProfile,
    value:
      | UserProfile[keyof UserProfile]
      | string
      | number
      | boolean
      | Date
      | string[]
      | null
  ) => {
    setFormData((prev) => {
      let finalValue: UserProfile[keyof UserProfile] | undefined = undefined;

      if (['height', 'siblings', 'position', 'aliyaYear'].includes(field)) {
        const rawValue = value as string | number;
        if (rawValue === '' || rawValue === null || rawValue === undefined) {
          finalValue = undefined;
        } else {
          const parsed = parseInt(String(rawValue), 10);
          finalValue = !isNaN(parsed)
            ? (parsed as UserProfile[typeof field])
            : undefined;
        }
      } else if (field === 'birthDate') {
        finalValue = ensureDateObject(
          value as string | Date | null | undefined
        ) as UserProfile[typeof field];
      } else {
        finalValue = (
          value === '' || value === null ? undefined : value
        ) as UserProfile[typeof field];
      }

      return {
        ...prev,
        [field]: finalValue,
      };
    });
  };

  const handleMultiSelectToggle = (
    field: keyof UserProfile,
    optionValue: string
  ) => {
    setFormData((prev) => {
      const currentValues = (prev[field] as string[]) || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      return { ...prev, [field]: newValues };
    });
  };

  const handleSave = () => {
    if (formData.about && formData.about.trim().length < 100) {
      toast.error(dict.toasts.validationErrorTitle, {
        description: dict.toasts.aboutMinLength.replace('{{count}}', '100'),
        duration: 5000,
      });
      return;
    }

    const dataToSave = { ...formData };
    onSave(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setCityInputValue(initialData.city || '');
    setAliyaCountryInputValue(initialData.aliyaCountry || '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="text-center p-4">
        {dict.loading}
      </div>
    );
  }

  const renderMultiSelectBadges = (
    fieldValues: string[] | undefined,
    options: { value: string; label: string; icon?: React.ElementType }[],
    emptyPlaceholder: string
  ) => {
    if (!fieldValues || fieldValues.length === 0) {
      return <p className="text-sm text-gray-500 italic">{emptyPlaceholder}</p>;
    }
    return fieldValues.map((value) => {
      const option = options.find((opt) => opt.value === value);
      return option ? (
        <Badge
          key={value}
          variant="secondary"
          className="me-1 mb-1 bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full"
        >
          {option.icon && <option.icon className="w-3 h-3 me-1" />}
          {option.label}
        </Badge>
      ) : null;
    });
  };

  return (
    <div className="relative" dir={direction}>
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex items-center justify-between">
            <div className="text-start">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {dict.header.title}
              </h1>
              <p className="text-sm text-slate-500">
                {isEditing && !viewOnly
                  ? dict.header.subtitleEdit
                  : dict.header.subtitleView}
              </p>
            </div>
            {!viewOnly && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-cyan-400 text-cyan-700 hover:bg-cyan-50"
                  >
                    <Pencil className="w-3.5 h-3.5 ms-1.5" />
                    {dict.buttons.edit}
                  </Button>
                ) : (
                  <>
                    {/* ======================= START: DESKTOP BUTTONS ======================= */}
                    <div className="hidden sm:flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="w-3.5 h-3.5 ms-1.5" />
                        {dict.buttons.cancel}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Save className="w-3.5 h-3.5 ms-1.5" />
                        {dict.buttons.save}
                      </Button>
                    </div>
                    {/* ======================= END: DESKTOP BUTTONS ======================= */}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-xl py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50/40 to-pink-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <UserCircle className="w-5 h-5 text-cyan-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {dict.cards.personal.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label
                      htmlFor="gender"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.genderLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.gender || ''}
                        onValueChange={(value) =>
                          handleChange('gender', value as Gender)
                        }
                      >
                        <SelectTrigger
                          id="gender"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={dict.cards.personal.genderPlaceholder}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">
                            {dict.options.gender.MALE}
                          </SelectItem>
                          <SelectItem value="FEMALE">
                            {dict.options.gender.FEMALE}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.gender
                            ? dict.options.gender[formData.gender]
                            : undefined,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="birthDate"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.birthDateLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="birthDate"
                        type="date"
                        value={
                          formData.birthDate instanceof Date &&
                          !isNaN(formData.birthDate.getTime())
                            ? formData.birthDate.toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleChange('birthDate', e.target.value || undefined)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.birthDate, dict)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="height"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.heightLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="height"
                        type="number"
                        value={formData.height ?? ''}
                        onChange={(e) => handleChange('height', e.target.value)}
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder={dict.cards.personal.heightPlaceholder}
                        min="100"
                        max="250"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.height
                            ? `${formData.height} ${dict.cards.personal.heightUnit}`
                            : undefined,
                          dict
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="city-autocomplete"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.cityLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Autocomplete
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        id="city-autocomplete"
                        value={cityInputValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setCityInputValue(e.target.value);
                        }}
                        // =========================== START: הקוד המתוקן ===========================
                        onPlaceSelected={(place) => {
                          // 1. הוספנו בדיקה קריטית: ודא שהאובייקט 'place' קיים ויש לו את המידע שאנו צריכים.
                          if (!place || !place.address_components) {
                            console.error(
                              "Google Autocomplete error: 'place' object or 'address_components' is undefined.",
                              place
                            );

                            // במקרה של שגיאה, אנו יכולים להשתמש בערך שהוקלד כברירת מחדל,
                            // או להציג שגיאה למשתמש. כאן נשתמש בערך שהוקלד.
                            handleChange('city', cityInputValue);
                            return;
                          }

                          const cityComponent = place.address_components.find(
                            (component) => component.types.includes('locality')
                          );

                          // 2. חיזוק לוגיקת החילוץ של שם העיר
                          const selectedCity =
                            cityComponent?.long_name || // העדפה לשם העיר הנקי
                            place.formatted_address || // אם אין, השתמש בכתובת המלאה
                            cityInputValue; // אם הכל נכשל, השתמש במה שהמשתמש הקליד

                          handleChange('city', selectedCity);
                          setCityInputValue(selectedCity);
                        }}
                        // ============================ END: הקוד המתוקן ============================
                        onBlur={() => {
                          if (cityInputValue !== formData.city) {
                            setCityInputValue(formData.city || '');
                          }
                        }}
                        // =========================== START: שינוי חשוב נוסף ===========================
                        options={{
                          types: ['(cities)'],
                          componentRestrictions: { country: 'il' },
                          // 3. הוספנו בקשה מפורשת לקבל את השדה 'address_components'
                          fields: [
                            'address_components',
                            'formatted_address',
                            'geometry',
                          ],
                        }}
                        // ============================ END: שינוי חשוב נוסף ============================
                        className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder={dict.cards.personal.cityPlaceholder}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.city, dict)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="origin"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.originLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="origin"
                        value={formData.origin || ''}
                        onChange={(e) => handleChange('origin', e.target.value)}
                        placeholder={dict.cards.personal.originPlaceholder}
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.origin, dict)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="aliyaCountry-autocomplete"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.aliyaCountryLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Autocomplete
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        id="aliyaCountry-autocomplete"
                        value={aliyaCountryInputValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setAliyaCountryInputValue(e.target.value);
                        }}
                        onPlaceSelected={(place) => {
                          const countryComponent =
                            place.address_components?.find((component) =>
                              component.types.includes('country')
                            );
                          const selectedCountry =
                            countryComponent?.long_name ||
                            place.formatted_address ||
                            '';
                          handleChange('aliyaCountry', selectedCountry);
                          setAliyaCountryInputValue(selectedCountry);
                        }}
                        onBlur={() => {
                          if (
                            aliyaCountryInputValue !== formData.aliyaCountry
                          ) {
                            setAliyaCountryInputValue(
                              formData.aliyaCountry || ''
                            );
                          }
                        }}
                        options={{
                          types: ['country'],
                        }}
                        className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder={
                          dict.cards.personal.aliyaCountryPlaceholder
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.aliyaCountry,
                          dict,
                          dict.placeholders.notRelevant
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="aliyaYear"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.aliyaYearLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="aliyaYear"
                        type="number"
                        value={formData.aliyaYear ?? ''}
                        onChange={(e) =>
                          handleChange('aliyaYear', e.target.value)
                        }
                        disabled={!formData.aliyaCountry}
                        placeholder={dict.cards.personal.aliyaYearPlaceholder}
                        className="h-9 text-sm focus:ring-cyan-500"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(
                          formData.aliyaYear,
                          dict,
                          formData.aliyaCountry
                            ? dict.placeholders.noYear
                            : dict.placeholders.notRelevant
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="nativeLanguage"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.nativeLanguageLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.nativeLanguage || ''}
                        onValueChange={(value) =>
                          handleChange('nativeLanguage', value || undefined)
                        }
                      >
                        <SelectTrigger
                          id="nativeLanguage"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.personal.nativeLanguagePlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {languageOptions.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label[locale] || lang.label.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.nativeLanguage,
                          languageOptions.map((opt) => ({
                            value: opt.value,
                            label: opt.label[locale] || opt.label.en,
                          })),
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="additionalLanguages"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.personal.additionalLanguagesLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        onValueChange={(value) => {
                          const currentLanguages =
                            formData.additionalLanguages || [];
                          if (!currentLanguages.includes(value)) {
                            handleChange('additionalLanguages', [
                              ...currentLanguages,
                              value,
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger
                          id="additionalLanguages"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.personal.additionalLanguagesPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-[200px]"
                          position="item-aligned"
                        >
                          {languageOptions
                            .filter(
                              (lang) =>
                                !(formData.additionalLanguages || []).includes(
                                  lang.value
                                ) && lang.value !== formData.nativeLanguage
                            )
                            .map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label[locale] || lang.label['en']}{' '}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(formData.additionalLanguages || []).map((langValue) => {
                        const lang = languageOptions.find(
                          (l) => l.value === langValue
                        );
                        return lang ? (
                          <Badge
                            key={lang.value}
                            variant="secondary"
                            className="bg-cyan-100/70 text-cyan-800 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center"
                          >
                            {lang.label[locale] || lang.label['en']}{' '}
                            {isEditing && !viewOnly && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChange(
                                    'additionalLanguages',
                                    (formData.additionalLanguages || []).filter(
                                      (l) => l !== langValue
                                    )
                                  )
                                }
                                className="ms-1.5 text-cyan-600 hover:text-cyan-800 text-xs"
                                aria-label={dict.cards.personal.removeLanguageLabel.replace(
                                  '{{lang}}',
                                  lang.label[locale] || lang.label['en']
                                )}
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ) : null;
                      })}
                      {(!isEditing || viewOnly) &&
                        (!formData.additionalLanguages ||
                          formData.additionalLanguages.length === 0) && (
                          <p className="text-sm text-gray-500 italic">
                            {dict.cards.personal.noAdditionalLanguages}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50/40 to-indigo-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-purple-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {dict.cards.family.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 items-start">
                  <div>
                    <Label
                      htmlFor="maritalStatus"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.maritalStatusLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.maritalStatus || ''}
                        onValueChange={(value) =>
                          handleChange('maritalStatus', value || undefined)
                        }
                      >
                        <SelectTrigger
                          id="maritalStatus"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.family.maritalStatusPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.maritalStatus,
                          maritalStatusOptions,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  {(formData.maritalStatus === 'divorced' ||
                    formData.maritalStatus === 'widowed' ||
                    formData.maritalStatus === 'annulled') && (
                    <div
                      className={cn(
                        'pt-1 sm:pt-0',
                        isEditing && !viewOnly ? 'sm:pt-5' : 'sm:pt-0'
                      )}
                    >
                      <Label
                        htmlFor="hasChildrenFromPrevious"
                        className="block mb-1.5 text-xs font-medium text-gray-600"
                      >
                        {dict.cards.family.hasChildrenLabel}
                      </Label>
                      {isEditing && !viewOnly ? (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                          <Checkbox
                            id="hasChildrenFromPrevious"
                            checked={formData.hasChildrenFromPrevious || false}
                            onCheckedChange={(checked) =>
                              handleChange(
                                'hasChildrenFromPrevious',
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="hasChildrenFromPrevious"
                            className="text-sm font-normal text-gray-700"
                          >
                            {dict.cards.family.hasChildrenYes}
                          </Label>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderBooleanDisplayValue(
                            formData.hasChildrenFromPrevious,
                            dict
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label
                      htmlFor="parentStatus"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.parentStatusLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="parentStatus"
                        value={formData.parentStatus || ''}
                        onChange={(e) =>
                          handleChange('parentStatus', e.target.value)
                        }
                        placeholder={dict.cards.family.parentStatusPlaceholder}
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.parentStatus, dict)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="fatherOccupation"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.fatherOccupationLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="fatherOccupation"
                        value={formData.fatherOccupation || ''}
                        onChange={(e) =>
                          handleChange('fatherOccupation', e.target.value)
                        }
                        placeholder={
                          dict.cards.family.fatherOccupationPlaceholder
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.fatherOccupation, dict)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="motherOccupation"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.motherOccupationLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="motherOccupation"
                        value={formData.motherOccupation || ''}
                        onChange={(e) =>
                          handleChange('motherOccupation', e.target.value)
                        }
                        placeholder={
                          dict.cards.family.motherOccupationPlaceholder
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.motherOccupation, dict)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="siblings"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.siblingsLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="siblings"
                        type="number"
                        value={formData.siblings ?? ''}
                        onChange={(e) =>
                          handleChange('siblings', e.target.value)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder={dict.cards.family.siblingsPlaceholder}
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.siblings, dict)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="position"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.family.positionLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="position"
                        type="number"
                        value={formData.position ?? ''}
                        onChange={(e) =>
                          handleChange('position', e.target.value)
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                        placeholder={dict.cards.family.positionPlaceholder}
                        min="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.position, dict)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-50/40 to-amber-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {dict.cards.religion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 items-start">
                  <div>
                    <Label
                      htmlFor="religiousLevel"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.religion.religiousLevelLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.religiousLevel || ''}
                        onValueChange={(value) =>
                          handleChange('religiousLevel', value || undefined)
                        }
                      >
                        <SelectTrigger
                          id="religiousLevel"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.religion.religiousLevelPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {religiousLevelOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.religiousLevel,
                          religiousLevelOptions,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="religiousJourney"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.religion.religiousJourneyLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.religiousJourney || ''}
                        onValueChange={(value) =>
                          handleChange(
                            'religiousJourney',
                            (value as ReligiousJourney) || undefined
                          )
                        }
                      >
                        <SelectTrigger
                          id="religiousJourney"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.religion.religiousJourneyPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {religiousJourneyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.religiousJourney,
                          religiousJourneyOptions,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'pt-1 sm:pt-0',
                      isEditing && !viewOnly ? 'sm:pt-5' : 'sm:pt-0'
                    )}
                  >
                    <Label className="block mb-1.5 text-xs font-medium text-gray-600">
                      {dict.cards.religion.shomerNegiahLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                        <Checkbox
                          id="shomerNegiah"
                          checked={formData.shomerNegiah || false}
                          onCheckedChange={(checked) =>
                            handleChange('shomerNegiah', checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="shomerNegiah"
                          className="text-sm font-normal text-gray-700"
                        >
                          {dict.cards.religion.shomerNegiahYes}
                        </Label>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderBooleanDisplayValue(
                          formData.shomerNegiah,
                          dict,
                          dict.cards.religion.shomerNegiahYes
                        )}
                      </p>
                    )}
                  </div>
                  {formData.gender === Gender.FEMALE && (
                    <div>
                      <Label
                        htmlFor="headCovering"
                        className="block mb-1.5 text-xs font-medium text-gray-600"
                      >
                        {dict.cards.religion.headCoveringLabel}
                      </Label>
                      {isEditing && !viewOnly ? (
                        <Select
                          dir={direction}
                          value={formData.headCovering || ''}
                          onValueChange={(value) =>
                            handleChange(
                              'headCovering',
                              (value as HeadCoveringType) || undefined
                            )
                          }
                        >
                          <SelectTrigger
                            id="headCovering"
                            className="h-9 text-sm focus:ring-cyan-500 text-start"
                          >
                            <SelectValue
                              placeholder={
                                dict.cards.religion.headCoveringPlaceholder
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {headCoveringOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderSelectDisplayValue(
                            formData.headCovering,
                            headCoveringOptions,
                            dict,
                            dict.cards.religion.headCoveringDefault
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  {formData.gender === Gender.MALE && (
                    <div>
                      <Label
                        htmlFor="kippahType"
                        className="block mb-1.5 text-xs font-medium text-gray-600"
                      >
                        {dict.cards.religion.kippahTypeLabel}
                      </Label>
                      {isEditing && !viewOnly ? (
                        <Select
                          dir={direction}
                          value={formData.kippahType || ''}
                          onValueChange={(value) =>
                            handleChange(
                              'kippahType',
                              (value as KippahType) || undefined
                            )
                          }
                        >
                          <SelectTrigger
                            id="kippahType"
                            className="h-9 text-sm focus:ring-cyan-500 text-start"
                          >
                            <SelectValue
                              placeholder={
                                dict.cards.religion.kippahTypePlaceholder
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {kippahTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium mt-1">
                          {renderSelectDisplayValue(
                            formData.kippahType,
                            kippahTypeOptions,
                            dict,
                            dict.cards.religion.kippahTypeDefault
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label
                      htmlFor="preferredMatchmakerGender"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.religion.matchmakerGenderLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.preferredMatchmakerGender || ''}
                        onValueChange={(value) =>
                          handleChange(
                            'preferredMatchmakerGender',
                            (value as Gender) || undefined
                          )
                        }
                      >
                        <SelectTrigger
                          id="preferredMatchmakerGender"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.religion.matchmakerGenderPlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {preferredMatchmakerGenderOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.preferredMatchmakerGender,
                          preferredMatchmakerGenderOptions,
                          dict,
                          dict.cards.religion.matchmakerGenderDefault
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200/70">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label
                      htmlFor="influentialRabbi"
                      className="text-sm font-medium text-gray-700"
                    >
                      {dict.cards.religion.influentialRabbiLabel}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-describedby="rabbi-tooltip"
                          >
                            <Info className="w-4 h-4 text-gray-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          id="rabbi-tooltip"
                          side="top"
                          className="max-w-xs text-center"
                          dir={direction}
                          sideOffset={5}
                          collisionPadding={10}
                        >
                          {/* UPDATED: Use placeholder text */}
                          <p>
                            {dict.cards.religion.influentialRabbiPlaceholder}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {isEditing && !viewOnly ? (
                    <Textarea
                      id="influentialRabbi"
                      value={formData.influentialRabbi || ''}
                      onChange={(e) =>
                        handleChange('influentialRabbi', e.target.value)
                      }
                      className="text-sm focus:ring-cyan-500 min-h-[90px] rounded-lg"
                      placeholder={
                        dict.cards.religion.influentialRabbiPlaceholder
                      }
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                      {renderDisplayValue(
                        formData.influentialRabbi,
                        dict,
                        dict.cards.religion.influentialRabbiEmpty
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-50/40 to-pink-50/40 border-b border-gray-200/50 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  <CardTitle className="text-base font-semibold text-gray-700">
                    {dict.cards.medical.title}
                  </CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full cursor-help">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span className="text-xs text-emerald-600">מוגן</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs"
                      dir={direction}
                    >
                      <p>
                        {dict.cards.medical.privacyNote ||
                          'מידע זה מוצפן. רק השדכן רואה אותו, ואת/ה בוחר/ת מתי לחשוף'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200/80">
                  {dict.cards.medical.description}
                </div>

                {isEditing && !viewOnly ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="hasMedicalInfo"
                        checked={formData.hasMedicalInfo || false}
                        onCheckedChange={(checked) =>
                          handleChange('hasMedicalInfo', checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="hasMedicalInfo"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        {dict.cards.medical.hasInfoLabel}
                      </Label>
                    </div>

                    {formData.hasMedicalInfo && (
                      <div className="space-y-4 border-t pt-4 animate-in fade-in-50">
                        <div>
                          <Label
                            htmlFor="medicalInfoDetails"
                            className="block mb-1.5 text-xs font-medium text-gray-600"
                          >
                            {dict.cards.medical.detailsLabel}
                          </Label>
                          <Textarea
                            id="medicalInfoDetails"
                            value={formData.medicalInfoDetails || ''}
                            onChange={(e) =>
                              handleChange('medicalInfoDetails', e.target.value)
                            }
                            className="text-sm focus:ring-cyan-500 min-h-[100px] rounded-lg"
                            placeholder={dict.cards.medical.detailsPlaceholder}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="medicalInfoDisclosureTiming"
                            className="block mb-1.5 text-xs font-medium text-gray-600"
                          >
                            {dict.cards.medical.timingLabel}
                          </Label>
                          <Select
                            dir={direction}
                            value={formData.medicalInfoDisclosureTiming || ''}
                            onValueChange={(value) =>
                              handleChange(
                                'medicalInfoDisclosureTiming',
                                value || undefined
                              )
                            }
                          >
                            <SelectTrigger
                              id="medicalInfoDisclosureTiming"
                              className="h-9 text-sm focus:ring-cyan-500 text-start"
                            >
                              <SelectValue
                                placeholder={
                                  dict.cards.medical.timingPlaceholder
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(dict.options.medicalTiming).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border-t pt-4">
                          <Label className="block mb-2 text-xs font-medium text-gray-600">
                            {dict.cards.medical.visibilityLabel}
                          </Label>
                          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <Switch
                              id="isMedicalInfoVisible"
                              checked={!!formData.isMedicalInfoVisible}
                              onCheckedChange={(checked) =>
                                handleChange('isMedicalInfoVisible', checked)
                              }
                              className="data-[state=checked]:bg-green-500"
                            />
                            <div className="flex flex-col">
                              <Label
                                htmlFor="isMedicalInfoVisible"
                                className="text-sm font-medium text-gray-800 cursor-pointer"
                              >
                                {formData.isMedicalInfoVisible
                                  ? dict.cards.medical.visibilityToggle.visible
                                  : dict.cards.medical.visibilityToggle.hidden}
                              </Label>
                              <p className="text-xs text-gray-500">
                                {formData.isMedicalInfoVisible
                                  ? dict.cards.medical.visibilityDescription
                                      .visible
                                  : dict.cards.medical.visibilityDescription
                                      .hidden}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="block text-xs font-medium text-gray-500">
                        {dict.cards.medical.display.sharedInfo}
                      </p>
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderBooleanDisplayValue(
                          formData.hasMedicalInfo,
                          dict,
                          dict.cards.medical.display.yes,
                          dict.cards.medical.display.no
                        )}
                      </p>
                    </div>
                    {formData.hasMedicalInfo && (
                      <>
                        <div>
                          <p className="block text-xs font-medium text-gray-500">
                            {dict.cards.medical.display.details}
                          </p>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[40px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                            {formData.medicalInfoDetails || (
                              <span className="text-gray-500 italic">
                                {dict.cards.medical.display.noDetails}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="block text-xs font-medium text-gray-500">
                            {dict.cards.medical.display.timing}
                          </p>
                          <p className="text-sm text-gray-800 font-medium mt-1">
                            {renderSelectDisplayValue(
                              formData.medicalInfoDisclosureTiming,
                              Object.entries(dict.options.medicalTiming).map(
                                ([value, label]) => ({ value, label })
                              ),
                              dict
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="block text-xs font-medium text-gray-500">
                            {dict.cards.medical.display.visibility}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {formData.isMedicalInfoVisible ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                <Eye className="w-3.5 h-3.5 ms-1.5" />
                                {dict.cards.medical.display.visibleBadge}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-700"
                              >
                                <Lock className="w-3.5 h-3.5 ms-1.5" />
                                {dict.cards.medical.display.hiddenBadge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <FriendTestimonialsManager
              profile={profileProp}
              isEditing={isEditing}
              dict={dict}
              handleChange={handleChange}
              formData={formData}
              direction={direction} // Pass direction
            />
          </div>

          <div className="space-y-6">
            <StoryAndMoreCard
              profile={profileProp}
              isEditing={isEditing}
              dict={dict}
              handleChange={handleChange}
              formData={formData}
              direction={direction} // Pass direction
            />

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50/40 to-green-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Briefcase className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {dict.cards.education.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <Label
                      htmlFor="educationLevel"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.education.levelLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.educationLevel || ''}
                        onValueChange={(value) =>
                          handleChange('educationLevel', value || undefined)
                        }
                      >
                        <SelectTrigger
                          id="educationLevel"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={dict.cards.education.levelPlaceholder}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevelOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.educationLevel,
                          educationLevelOptions,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="education"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.education.detailsLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="education"
                        value={formData.education || ''}
                        onChange={(e) =>
                          handleChange('education', e.target.value)
                        }
                        placeholder={dict.cards.education.detailsPlaceholder}
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.education, dict)}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="occupation"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.education.occupationLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="occupation"
                        value={formData.occupation || ''}
                        onChange={(e) =>
                          handleChange('occupation', e.target.value)
                        }
                        placeholder={dict.cards.education.occupationPlaceholder}
                        className="h-9 text-sm focus:ring-cyan-500"
                        maxLength={20}
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.occupation, dict)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="serviceType"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.education.serviceTypeLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Select
                        dir={direction}
                        value={formData.serviceType || ''}
                        onValueChange={(value) =>
                          handleChange(
                            'serviceType',
                            (value as ServiceType) || undefined
                          )
                        }
                      >
                        <SelectTrigger
                          id="serviceType"
                          className="h-9 text-sm focus:ring-cyan-500 text-start"
                        >
                          <SelectValue
                            placeholder={
                              dict.cards.education.serviceTypePlaceholder
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {serviceTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderSelectDisplayValue(
                          formData.serviceType,
                          serviceTypeOptions,
                          dict
                        )}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label
                      htmlFor="serviceDetails"
                      className="block mb-1.5 text-xs font-medium text-gray-600"
                    >
                      {dict.cards.education.serviceDetailsLabel}
                    </Label>
                    {isEditing && !viewOnly ? (
                      <Input
                        id="serviceDetails"
                        value={formData.serviceDetails || ''}
                        onChange={(e) =>
                          handleChange('serviceDetails', e.target.value)
                        }
                        placeholder={
                          dict.cards.education.serviceDetailsPlaceholder
                        }
                        className="h-9 text-sm focus:ring-cyan-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-medium mt-1">
                        {renderDisplayValue(formData.serviceDetails, dict)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* --- ✨ START: CV SECTION INTEGRATION ✨ --- */}
              {/* This section is added after CardContent to appear at the bottom of the card */}
              <CvUploadSection
                cvUrl={formData.cvUrl}
                isUploading={isCvUploading ?? false}
                onUpload={onCvUpload || (async () => {})}
                onDelete={onCvDelete || (async () => {})}
                disabled={viewOnly || !isEditing}
                dict={dict.cards.education.cvSection}
              />
              {/* --- ✨ END: CV SECTION INTEGRATION ✨ --- */}
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50/40 to-yellow-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Smile className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {dict.cards.character.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <fieldset>
                  <legend className="block mb-2 text-sm font-medium text-gray-700">
                    {dict.cards.character.traitsLabel}
                  </legend>
                  {isEditing && !viewOnly ? (
                    <div className="flex flex-wrap gap-2">
                      {characterTraitsOptions.map((trait) => (
                        <Button
                          key={trait.value}
                          type="button"
                          variant={
                            (formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectToggle(
                              'profileCharacterTraits',
                              trait.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.profileCharacterTraits || []).length >=
                              3 &&
                            !(formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.profileCharacterTraits || []).includes(
                              trait.value
                            )
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {trait.icon && (
                            <trait.icon className="w-3.5 h-3.5 ms-1.5" />
                          )}
                          {trait.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.profileCharacterTraits,
                        characterTraitsOptions,
                        dict.cards.character.traitsEmpty
                      )}
                    </div>
                  )}
                </fieldset>
                <fieldset>
                  <legend className="block mb-2 text-sm font-medium text-gray-700">
                    {dict.cards.character.hobbiesLabel}
                  </legend>
                  {isEditing && !viewOnly ? (
                    <div className="flex flex-wrap gap-2">
                      {hobbiesOptions.map((hobby) => (
                        <Button
                          key={hobby.value}
                          type="button"
                          variant={
                            (formData.profileHobbies || []).includes(
                              hobby.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectToggle(
                              'profileHobbies',
                              hobby.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.profileHobbies || []).length >= 3 &&
                            !(formData.profileHobbies || []).includes(
                              hobby.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.profileHobbies || []).includes(
                              hobby.value
                            )
                              ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {hobby.icon && (
                            <hobby.icon className="w-3.5 h-3.5 ms-1.5" />
                          )}
                          {hobby.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.profileHobbies,
                        hobbiesOptions,
                        dict.cards.character.hobbiesEmpty
                      )}
                    </div>
                  )}
                </fieldset>
              </CardContent>
            </Card>
            <NeshamaTechSummaryCard
              profile={profileProp}
              isEditing={isEditing}
              dict={dict}
              handleChange={handleChange}
              formData={formData}
              direction={direction} // Pass direction
            />
          </div>
        </div>
      </div>

      {/* ======================= START: MOBILE STICKY FOOTER ======================= */}
      {isEditing && !viewOnly && (
        <div className="sticky bottom-0 z-20 mt-4 border-t border-gray-200 bg-white/90 p-4 backdrop-blur-md shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.15)] sm:hidden">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              <X className="w-4 h-4 ms-1.5" />
              {dict.buttons.cancel}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2"
            >
              <Save className="w-4 h-4 ms-1.5" />
              {dict.buttons.saveChanges}
            </Button>
          </div>
        </div>
      )}
      {/* ======================= END: MOBILE STICKY FOOTER ======================= */}
    </div>
  );
};

export default ProfileSection;
