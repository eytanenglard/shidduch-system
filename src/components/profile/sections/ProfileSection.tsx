// src/app/components/profile/sections/ProfileSection.tsx
'use client';

import React, { useCallback } from 'react';
import { AvailabilityStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X } from 'lucide-react';
import { UserProfile } from '@/types/next-auth';
import { toast } from 'sonner';
import { ProfileSectionDict } from '@/types/dictionary';
import { useProfileForm } from '../hooks/useProfileForm';
import DraftBanner from '../DraftBanner';
import FloatingActionButton from '../FloatingActionButton';
import StickyActionFooter from '../StickyActionFooter';
import {
  PersonalInfoCard,
  FamilyCard,
  ReligionCard,
  AppearanceCard,
  MedicalCard,
  EducationCareerCard,
  CharacterCard,
  StoryAndMoreCard,
  NeshamaTechSummaryCard,
  FriendTestimonialsManager,
  QuestionnaireInsightsCard,
  ensureDateObject,
} from './profile-cards';
import { QuestionnaireSyncedFields } from './profile-cards/types';

interface ProfileSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  viewOnly?: boolean;
  onSave: (data: Partial<UserProfile>) => void;
  dict: ProfileSectionDict;
  locale: string;
  onCvUpload?: (file: File) => Promise<void>;
  onCvDelete?: () => Promise<void>;
  isCvUploading?: boolean;
  /** Fields that are auto-synced from the questionnaire */
  questionnaireSyncedFields?: QuestionnaireSyncedFields;
  /** Navigate user to the questionnaire tab to edit synced fields */
  onNavigateToQuestionnaire?: () => void;
  /** Questionnaire answers for the insights card */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questionnaireAnswers?: Record<string, any[]> | null;
}

const initializeProfileData = (profileData: UserProfile): Partial<UserProfile> => {
  let headline = profileData?.profileHeadline || '';
  if (typeof headline === 'object' && headline !== null) {
    headline = '';
  }

  return {
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
    preferredMatchmakerGender: profileData?.preferredMatchmakerGender || undefined,
    availabilityStatus: profileData?.availabilityStatus || AvailabilityStatus.AVAILABLE,
    availabilityNote: profileData?.availabilityNote || '',
    availabilityUpdatedAt: ensureDateObject(profileData?.availabilityUpdatedAt),
    matchingNotes: profileData?.matchingNotes || '',
    internalMatchmakerNotes: profileData?.internalMatchmakerNotes || '',
    shomerNegiah: profileData?.shomerNegiah ?? undefined,
    smokingStatus: profileData?.smokingStatus || undefined,
    serviceType: profileData?.serviceType || undefined,
    serviceDetails: profileData?.serviceDetails || '',
    headCovering: profileData?.headCovering || undefined,
    kippahType: profileData?.kippahType || undefined,
    hasChildrenFromPrevious: profileData?.hasChildrenFromPrevious ?? undefined,
    profileCharacterTraits: profileData?.profileCharacterTraits || [],
    profileHobbies: profileData?.profileHobbies || [],
    aliyaCountry: profileData?.aliyaCountry || '',
    aliyaYear: profileData?.aliyaYear ?? undefined,
    id: profileData?.id,
    userId: profileData?.userId,
    createdAt: ensureDateObject(profileData?.createdAt),
    updatedAt: ensureDateObject(profileData?.updatedAt),
    lastActive: ensureDateObject(profileData?.lastActive),
    bodyType: profileData?.bodyType || undefined,
    appearanceTone: profileData?.appearanceTone || undefined,
    groomingStyle: profileData?.groomingStyle || undefined,
    hasMedicalInfo: profileData?.hasMedicalInfo ?? false,
    medicalInfoDetails: profileData?.medicalInfoDetails || '',
    medicalInfoDisclosureTiming: profileData?.medicalInfoDisclosureTiming || undefined,
    isMedicalInfoVisible: profileData?.isMedicalInfoVisible ?? false,
    profileHeadline: headline,
    inspiringCoupleStory: profileData?.inspiringCoupleStory || '',
    influentialRabbi: profileData?.influentialRabbi || '',
    isAboutVisible: profileData?.isAboutVisible ?? true,
    isFriendsSectionVisible: profileData?.isFriendsSectionVisible ?? true,
    isNeshamaTechSummaryVisible: profileData?.isNeshamaTechSummaryVisible ?? true,
    cvUrl: profileData?.cvUrl,
    cvSummary: profileData?.cvSummary,
  };
};

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile: profileProp,
  isEditing,
  setIsEditing,
  viewOnly = false,
  onSave,
  onCvUpload,
  onCvDelete,
  isCvUploading,
  dict,
  locale,
  questionnaireSyncedFields,
  onNavigateToQuestionnaire,
  questionnaireAnswers,
}) => {
  const {
    formData,
    setFormData,
    loading,
    direction,
    showFloatingBtn,
    mounted,
    handleSave: baseSave,
    handleCancel,
    hasDraft,
    restoreDraft,
    dismissDraft,
  } = useProfileForm({
    profile: profileProp,
    initializeData: initializeProfileData,
    onSave,
    isEditing,
    setIsEditing,
    locale,
    draftKey: 'profile',
    validate: (data) => {
      if (data.about && data.about.trim().length < 100) {
        toast.error(dict.toasts.validationErrorTitle, {
          description: dict.toasts.aboutMinLength.replace('{{count}}', '100'),
          duration: 5000,
        });
        return 'validation_error';
      }
      return null;
    },
    beforeSave: (data) => {
      if (!data.hasMedicalInfo) {
        data.medicalInfoDetails = undefined;
        data.medicalInfoDisclosureTiming = undefined;
        data.isMedicalInfoVisible = false;
      }
      return data;
    },
  });

  const handleChange = useCallback((
    field: keyof UserProfile,
    value: UserProfile[keyof UserProfile] | string | number | boolean | Date | string[] | null
  ) => {
    if (field === 'hasMedicalInfo') {
      if (!value) {
        setFormData((prev) => ({
          ...prev,
          hasMedicalInfo: false,
          medicalInfoDetails: null,
          medicalInfoDisclosureTiming: null,
          isMedicalInfoVisible: false,
        }));
        return;
      } else {
        setFormData((prev) => ({ ...prev, hasMedicalInfo: true }));
        return;
      }
    }

    setFormData((prev) => {
      let finalValue: any = value;

      if (['height', 'siblings', 'position', 'aliyaYear', 'preferredAgeMin', 'preferredAgeMax', 'preferredHeightMin', 'preferredHeightMax'].includes(field)) {
        if (value === '' || value === null || value === undefined) {
          finalValue = null;
        } else {
          const parsed = Number(value);
          finalValue = isNaN(parsed) ? null : parsed;
        }
      } else if (field === 'birthDate' || field === 'availabilityUpdatedAt') {
        const dateVal = ensureDateObject(value as any);
        finalValue = dateVal || null;
      } else if (typeof value === 'boolean') {
        finalValue = value;
      } else if (Array.isArray(value)) {
        finalValue = value;
      } else {
        if (value === '' || value === null || value === undefined) {
          finalValue = null;
        }
      }

      return { ...prev, [field]: finalValue };
    });
  }, [setFormData]);

  const handleMultiSelectToggle = useCallback((field: keyof UserProfile, optionValue: string) => {
    setFormData((prev) => {
      const currentValues = (prev[field] as string[]) || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      return { ...prev, [field]: newValues };
    });
  }, [setFormData]);

  const handleSave = useCallback(() => {
    baseSave();
  }, [baseSave]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="text-center p-4">
        {dict.loading}
      </div>
    );
  }

  const cardProps = {
    profile: profileProp,
    isEditing,
    viewOnly,
    formData,
    handleChange,
    handleMultiSelectToggle,
    dict,
    locale,
    direction,
    questionnaireSyncedFields,
    onNavigateToQuestionnaire,
  };

  return (
    <div className="relative" dir={direction}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex items-center justify-between">
            <div className="text-start">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {dict.header.title}
              </h1>
              <p className="text-sm text-slate-500">
                {isEditing && !viewOnly ? dict.header.subtitleEdit : dict.header.subtitleView}
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draft Restoration Banner */}
      <DraftBanner
        visible={hasDraft && !isEditing}
        onRestore={restoreDraft}
        onDismiss={dismissDraft}
      />

      {/* Main Content */}
      <div className="container mx-auto max-w-screen-xl py-4 px-4 relative">
        <div className="absolute top-0 end-0 w-72 h-72 bg-teal-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-64 h-64 bg-orange-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <PersonalInfoCard {...cardProps} />
            <FamilyCard {...cardProps} />
            <ReligionCard {...cardProps} />
            <AppearanceCard {...cardProps} />
            <MedicalCard {...cardProps} />
            <FriendTestimonialsManager
              profile={profileProp}
              isEditing={isEditing}
              dict={dict}
              handleChange={handleChange}
              formData={formData}
              direction={direction}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <StoryAndMoreCard {...cardProps} />
            <QuestionnaireInsightsCard
              questionnaireAnswers={questionnaireAnswers}
              dict={dict}
              direction={direction}
              onNavigateToQuestionnaire={onNavigateToQuestionnaire}
            />
            <EducationCareerCard
              {...cardProps}
              onCvUpload={onCvUpload}
              onCvDelete={onCvDelete}
              isCvUploading={isCvUploading}
            />
            <CharacterCard {...cardProps} />
            <NeshamaTechSummaryCard {...cardProps} />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {!viewOnly && (
        <FloatingActionButton
          isEditing={isEditing}
          onSave={handleSave}
          onEdit={() => setIsEditing(true)}
          mounted={mounted}
          visible={showFloatingBtn}
          saveLabel={dict.buttons.saveChanges}
          editLabel={dict.buttons.edit}
        />
      )}

      {/* Sticky Footer */}
      {!viewOnly && (
        <StickyActionFooter
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={() => setIsEditing(true)}
          buttons={dict.buttons}
        />
      )}
    </div>
  );
};

export default ProfileSection;
