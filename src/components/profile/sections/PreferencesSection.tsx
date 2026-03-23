// src/app/components/profile/sections/PreferencesSection.tsx
'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X } from 'lucide-react';
import { UserProfile } from '@/types/next-auth';
import { PreferencesSectionDict } from '@/types/dictionary';
import { useProfileForm } from '../hooks/useProfileForm';
import DraftBanner from '../DraftBanner';
import FloatingActionButton from '../FloatingActionButton';
import StickyActionFooter from '../StickyActionFooter';

import {
  GeneralCard,
  AgeHeightCard,
  LocationReligionCard,
  EducationCareerCard,
  PersonalBackgroundCard,
  CharacterInterestsCard,
  AppearancePreferencesCard,
} from './preference-cards';

interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
  dictionary: PreferencesSectionDict;
  locale: string;
}

const nullToUndefined = <T,>(value: T | null): T | undefined =>
  value === null ? undefined : value;

const initializePreferencesData = (profile: UserProfile): Partial<UserProfile> => ({
  ...profile,
  preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
  preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
  preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
  preferredHeightMax: nullToUndefined(profile.preferredHeightMax),
  matchingNotes: profile.matchingNotes ?? '',
  preferredShomerNegiah: nullToUndefined(profile.preferredShomerNegiah),
  preferredSmokingStatus: nullToUndefined(profile.preferredSmokingStatus),
  preferredPartnerHasChildren: nullToUndefined(profile.preferredPartnerHasChildren),
  preferredAliyaStatus: nullToUndefined(profile.preferredAliyaStatus),
  preferredLocations: profile.preferredLocations ?? [],
  preferredReligiousLevels: profile.preferredReligiousLevels ?? [],
  preferredEducation: profile.preferredEducation ?? [],
  preferredOccupations: profile.preferredOccupations ?? [],
  preferredMaritalStatuses: profile.preferredMaritalStatuses ?? [],
  preferredOrigins: profile.preferredOrigins ?? [],
  preferredServiceTypes: profile.preferredServiceTypes ?? [],
  preferredHeadCoverings: profile.preferredHeadCoverings ?? [],
  preferredKippahTypes: profile.preferredKippahTypes ?? [],
  preferredCharacterTraits: profile.preferredCharacterTraits ?? [],
  preferredHobbies: profile.preferredHobbies ?? [],
  preferredReligiousJourneys: profile.preferredReligiousJourneys ?? [],
  preferredBodyTypes: profile.preferredBodyTypes ?? [],
  preferredAppearanceTones: profile.preferredAppearanceTones ?? [],
  preferredGroomingStyles: profile.preferredGroomingStyles ?? [],
});

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  profile,
  isEditing,
  viewOnly = false,
  setIsEditing,
  onChange,
  dictionary: t,
  locale,
}) => {
  const {
    formData,
    setFormData,
    direction,
    showFloatingBtn,
    mounted,
    handleSave,
    handleCancel,
    hasDraft,
    restoreDraft,
    dismissDraft,
  } = useProfileForm({
    profile,
    initializeData: initializePreferencesData,
    onSave: onChange,
    isEditing,
    setIsEditing,
    locale,
    draftKey: 'preferences',
  });

  // --- Handlers ---
  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const field = name as keyof UserProfile;

    setFormData((prev) => {
      let processedValue: string | number | undefined;
      if (type === 'number') {
        const num = parseInt(value, 10);
        processedValue = isNaN(num) ? undefined : num;
      } else {
        processedValue = value === '' ? undefined : value;
      }
      return { ...prev, [field]: processedValue };
    });
  }, [setFormData]);

  const handleSelectChange = useCallback((field: keyof UserProfile, value: string) => {
    const resetValues = [''];
    setFormData((prev) => ({
      ...prev,
      [field]: resetValues.includes(value)
        ? null
        : (value as UserProfile[typeof field]),
    }));
  }, [setFormData]);

  const handleMultiSelectChange = useCallback((field: keyof UserProfile, value: string) => {
    setFormData((prev) => {
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      let newValues;
      const resetValues = [
        'any',
        'no_preference',
        'לא_משנה',
        'no_strong_preference',
      ];

      if (resetValues.includes(value)) {
        newValues = currentValues.includes(value) ? [] : [value];
      } else {
        const filteredValues = currentValues.filter(
          (v) => !resetValues.includes(v)
        );
        newValues = filteredValues.includes(value)
          ? filteredValues.filter((v) => v !== value)
          : [...filteredValues, value];
      }
      return { ...prev, [field]: newValues };
    });
  }, [setFormData]);

  const handleAddItemToArray = useCallback((field: keyof UserProfile, value: string) => {
    if (!value) return;
    setFormData((prev) => {
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      if (currentValues.includes(value)) {
        return prev;
      }
      return { ...prev, [field]: [...currentValues, value] };
    });
  }, [setFormData]);

  const handleRemoveItemFromArray = useCallback((
    field: keyof UserProfile,
    value: string
  ) => {
    setFormData((prev) => {
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      return {
        ...prev,
        [field]: currentValues.filter((item) => item !== value),
      };
    });
  }, [setFormData]);

  // --- Shared props for all card components ---
  const cardProps = {
    profile,
    isEditing,
    viewOnly,
    formData,
    handleInputChange,
    handleSelectChange,
    handleMultiSelectChange,
    handleAddItemToArray,
    handleRemoveItemFromArray,
    t,
    locale,
    direction,
  };

  return (
    <div className="relative" dir={direction}>
      {/* ======================= STICKY HEADER ======================= */}
      <div className="sticky top-4 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
        <div className="container mx-auto max-w-screen-xl px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {t.header.title}
              </h1>
              <p className="text-sm text-slate-500">
                {isEditing && !viewOnly
                  ? t.header.subtitleEdit
                  : t.header.subtitleView}
              </p>
            </div>
            {!viewOnly && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-teal-400 text-teal-700 hover:bg-teal-50"
                  >
                    <Pencil className="w-3.5 h-3.5 ltr:ml-1.5 rtl:mr-1.5" />
                    {t.buttons.edit}
                  </Button>
                ) : (
                  <>
                    {/* ======================= DESKTOP BUTTONS ======================= */}
                    <div className="hidden sm:flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="w-3.5 h-3.5 ltr:ml-1.5 rtl:mr-1.5" />
                        {t.buttons.cancel}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white"
                      >
                        <Save className="w-3.5 h-3.5 ltr:ml-1.5 rtl:mr-1.5" />
                        {t.buttons.save}
                      </Button>
                    </div>
                  </>
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

      {/* ======================= CARD GRID ======================= */}
      <div className="container mx-auto max-w-screen-xl py-4 px-4 relative">
        <div className="absolute top-0 end-0 w-72 h-72 bg-teal-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-64 h-64 bg-orange-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* --- Column 1 --- */}
          <div className="space-y-4">
            <GeneralCard {...cardProps} />
            <AgeHeightCard {...cardProps} />
          </div>

          {/* --- Column 2 --- */}
          <div className="space-y-4">
            <LocationReligionCard {...cardProps} />
            <EducationCareerCard {...cardProps} />
          </div>

          {/* --- Column 3 --- */}
          <div className="space-y-4">
            <PersonalBackgroundCard {...cardProps} />
            <CharacterInterestsCard {...cardProps} />
            <AppearancePreferencesCard {...cardProps} />
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
          saveLabel={t.buttons.save}
          editLabel={t.buttons.edit}
        />
      )}

      {/* Sticky Footer */}
      {!viewOnly && (
        <StickyActionFooter
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          onEdit={() => setIsEditing(true)}
          buttons={t.buttons}
          saveClassName="bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white"
          editClassName="border-teal-400 text-teal-700 hover:bg-teal-50"
        />
      )}
    </div>
  );
};

export default PreferencesSection;
