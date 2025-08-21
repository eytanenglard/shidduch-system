// src/app/(authenticated)/profile/components/dashboard/PreferencesSection.tsx
'use client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, XCircle } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Save,
  X,
  FileText,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Users,
  Sparkles,
  Heart,
  Briefcase,
  Shield,
  Palette,
  Smile,
} from 'lucide-react';
import { UserProfile } from '@/types/next-auth';
import { cn } from '@/lib/utils';
import {
  Gender,
  ServiceType,
  HeadCoveringType,
  KippahType,
  ReligiousJourney,
} from '@prisma/client';
import Autocomplete from 'react-google-autocomplete';
import { PreferencesSectionDict } from '@/types/dictionary'; // Assuming this is the correct path

// This would typically come from a context or a hook like `useI18n()`
// For this example, we'll pass it as a prop.
interface PreferencesSectionProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  setIsEditing: (value: boolean) => void;
  onChange: (data: Partial<UserProfile>) => void;
  dictionary: PreferencesSectionDict; // Passing the dictionary as a prop
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  profile,
  isEditing,
  viewOnly = false,
  setIsEditing,
  onChange,
  dictionary: t, // Using 't' as a shorthand for the dictionary
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [initialData, setInitialData] = useState<Partial<UserProfile>>({});
  const [locationInputValue, setLocationInputValue] = useState('');
  const [originInputValue, setOriginInputValue] = useState('');

  // --- Map icons to values for dynamic options ---
  const iconMap: { [key: string]: React.ElementType } = {
    empathetic: Heart,
    driven: Briefcase,
    optimistic: Smile,
    family_oriented: Users,
    intellectual: GraduationCap,
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
    no_strong_preference: Sparkles,
    travel: MapPin,
    sports: Briefcase,
    reading: GraduationCap,
    cooking_baking: Palette,
    music_playing_instrument: Palette,
    art_crafts: Palette,
    volunteering: Heart,
    learning_courses: GraduationCap,
    board_games_puzzles: Smile,
    movies_theater: Smile,
    dancing: Users,
    writing: GraduationCap,
    nature_hiking: MapPin,
    photography: Palette,
  };

  // --- Generate options from dictionary ---
  const useGenerateOptions = (
    optionsDict: { [key: string]: string },
    withIcon?: boolean
  ) => {
    return useMemo(
      () =>
        Object.entries(optionsDict).map(([value, label]) => ({
          value,
          label,
          ...(withIcon && { icon: iconMap[value] }),
        })),
      [optionsDict, withIcon]
    );
  };

  const religiousLevelOptions = useGenerateOptions(t.options.religiousLevels);
  const preferredReligiousJourneyOptions = useGenerateOptions(
    t.options.religiousJourneys
  );
  const educationPreferenceOptions = useGenerateOptions(t.options.education);
  const occupationPreferenceOptions = useGenerateOptions(t.options.occupation);
  const preferredShomerNegiahOptions = useGenerateOptions(
    t.options.shomerNegiah
  );
  const preferredPartnerHasChildrenOptions = useGenerateOptions(
    t.options.partnerHasChildren
  );
  const preferredOriginOptions = useGenerateOptions(t.options.origins);
  const preferredAliyaStatusOptions = useGenerateOptions(t.options.aliyaStatus);
  const maritalStatusOptions = useGenerateOptions(t.options.maritalStatus);
  const serviceTypeOptions = useGenerateOptions(t.options.serviceTypes);
  const headCoveringOptions = useGenerateOptions(t.options.headCovering);
  const kippahTypeOptions = useGenerateOptions(t.options.kippahType);
  const characterTraitsOptions = useGenerateOptions(t.options.traits, true);
  const hobbiesOptions = useGenerateOptions(t.options.hobbies, true);
  const contactPreferenceOptions = Object.entries(
    t.options.contactPreference
  ).map(([value, label]) => ({ value, label }));

  useEffect(() => {
    if (profile) {
      const nullToUndefined = <T,>(value: T | null): T | undefined =>
        value === null ? undefined : value;

      const newFormData: Partial<UserProfile> = {
        ...profile,
        preferredAgeMin: nullToUndefined(profile.preferredAgeMin),
        preferredAgeMax: nullToUndefined(profile.preferredAgeMax),
        preferredHeightMin: nullToUndefined(profile.preferredHeightMin),
        preferredHeightMax: nullToUndefined(profile.preferredHeightMax),
        matchingNotes: profile.matchingNotes ?? '',
        contactPreference: nullToUndefined(profile.contactPreference),
        preferredShomerNegiah: nullToUndefined(profile.preferredShomerNegiah),
        preferredPartnerHasChildren: nullToUndefined(
          profile.preferredPartnerHasChildren
        ),
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
      };
      setFormData(newFormData);
      setInitialData(newFormData);
    }
  }, [profile]);

  useEffect(() => {
    if (!isEditing && initialData) {
      setFormData(initialData);
    }
  }, [isEditing, initialData]);

  const handleInputChange = (
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
  };

  const handleSelectChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        value === '' ||
        value === 'לא_משנה' || // Keep legacy values just in case
        value === 'any' ||
        value === 'no_preference'
          ? undefined
          : (value as UserProfile[typeof field]),
    }));
  };

  const handleMultiSelectChange = (field: keyof UserProfile, value: string) => {
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
  };

  const handleAddItemToArray = (field: keyof UserProfile, value: string) => {
    if (!value) return;
    setFormData((prev) => {
      const currentValues =
        (Array.isArray(prev[field]) ? (prev[field] as string[]) : []) ?? [];
      if (currentValues.includes(value)) {
        return prev;
      }
      return { ...prev, [field]: [...currentValues, value] };
    });
  };

  const handleRemoveItemFromArray = (
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
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    onChange(dataToSave);
    setIsEditing(false);
    setInitialData(dataToSave);
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  const renderMultiSelectBadges = (
    fieldValues: string[] | undefined | null,
    options: { value: string; label: string; icon?: React.ElementType }[],
    badgeClass: string = 'bg-sky-100 text-sky-700',
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
          className={cn(
            'mr-1 mb-1 text-xs px-2 py-0.5 rounded-full flex items-center',
            badgeClass
          )}
        >
          {option.icon && <option.icon className="w-3 h-3 rtl:ml-1 mr-1" />}
          {option.label}
        </Badge>
      ) : null;
    });
  };

  const getSelectDisplayValue = (
    value: string | undefined | null,
    options: { value: string; label: string }[],
    placeholder: string
  ) => {
    if (!value)
      return <span className="text-gray-500 italic">{placeholder}</span>;
    const option = options.find((opt) => opt.value === value);
    return option ? (
      option.label
    ) : (
      <span className="text-gray-500 italic">{placeholder}</span>
    );
  };

  return (
    <div className="relative" dir="rtl">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/0 pt-4 pb-3 backdrop-blur-sm">
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
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-cyan-400 text-cyan-700 hover:bg-cyan-50"
                  >
                    <Pencil className="w-3.5 h-3.5 ml-1.5" />
                    {t.buttons.edit}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="w-3.5 h-3.5 ml-1.5" />
                      {t.buttons.cancel}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Save className="w-3.5 h-3.5 ml-1.5" />
                      {t.buttons.save}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-xl py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- Column 1 --- */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50/40 to-gray-100/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <FileText className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.general.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Label
                      htmlFor="matchingNotes"
                      className="text-sm font-medium text-gray-700"
                    >
                      {t.cards.general.notesLabel}
                    </Label>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-describedby="matchingNotes-tooltip"
                          >
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          id="matchingNotes-tooltip"
                          side="top"
                          className="max-w-xs text-center"
                        >
                          <p>{t.cards.general.notesTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {isEditing ? (
                    <Textarea
                      id="matchingNotes"
                      name="matchingNotes"
                      value={formData.matchingNotes || ''}
                      onChange={handleInputChange}
                      placeholder={t.cards.general.notesPlaceholder}
                      className="text-sm focus:ring-cyan-500 min-h-[100px] rounded-lg"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-slate-50/70 p-3 rounded-lg border border-slate-200/50">
                      {formData.matchingNotes || (
                        <span className="text-gray-500 italic">
                          {t.cards.general.notesEmpty}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="contactPreference"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    {t.cards.general.contactPreferenceLabel}
                  </Label>
                  {isEditing ? (
                    <Select
                      name="contactPreference"
                      value={formData.contactPreference || ''}
                      onValueChange={(value: string) =>
                        handleSelectChange('contactPreference', value)
                      }
                    >
                      <SelectTrigger
                        id="contactPreference"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue
                          placeholder={
                            t.cards.general.contactPreferencePlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {contactPreferenceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.contactPreference,
                        contactPreferenceOptions,
                        t.cards.general.contactPreferenceEmpty
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50/40 to-purple-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <SlidersHorizontal className="w-5 h-5 text-indigo-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.ageAndHeight.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <fieldset>
                    <legend className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                      {t.cards.ageAndHeight.ageLegend}
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-describedby="age-range-tooltip"
                            >
                              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent id="age-range-tooltip" side="top">
                            <p>{t.cards.ageAndHeight.ageTooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </legend>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="preferredAgeMin" className="sr-only">
                        {t.cards.ageAndHeight.ageMinPlaceholder}
                      </Label>
                      <Input
                        id="preferredAgeMin"
                        type="number"
                        name="preferredAgeMin"
                        placeholder={t.cards.ageAndHeight.ageMinPlaceholder}
                        value={formData.preferredAgeMin ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                      <span aria-hidden="true" className="text-gray-500">
                        -
                      </span>
                      <Label htmlFor="preferredAgeMax" className="sr-only">
                        {t.cards.ageAndHeight.ageMaxPlaceholder}
                      </Label>
                      <Input
                        id="preferredAgeMax"
                        type="number"
                        name="preferredAgeMax"
                        placeholder={t.cards.ageAndHeight.ageMaxPlaceholder}
                        value={formData.preferredAgeMax ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                    </div>
                    {!isEditing &&
                      !formData.preferredAgeMin &&
                      !formData.preferredAgeMax && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {t.cards.ageAndHeight.ageEmpty}
                        </p>
                      )}
                  </fieldset>
                  <fieldset>
                    <legend className="block mb-1.5 text-xs font-medium text-gray-600">
                      {t.cards.ageAndHeight.heightLegend}
                    </legend>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="preferredHeightMin" className="sr-only">
                        {t.cards.ageAndHeight.heightMinPlaceholder}
                      </Label>
                      <Input
                        id="preferredHeightMin"
                        type="number"
                        name="preferredHeightMin"
                        placeholder={t.cards.ageAndHeight.heightMinPlaceholder}
                        value={formData.preferredHeightMin ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                      <span aria-hidden="true" className="text-gray-500">
                        -
                      </span>
                      <Label htmlFor="preferredHeightMax" className="sr-only">
                        {t.cards.ageAndHeight.heightMaxPlaceholder}
                      </Label>
                      <Input
                        id="preferredHeightMax"
                        type="number"
                        name="preferredHeightMax"
                        placeholder={t.cards.ageAndHeight.heightMaxPlaceholder}
                        value={formData.preferredHeightMax ?? ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="h-9 text-sm focus:ring-cyan-500 disabled:bg-gray-100/70"
                      />
                    </div>
                    {!isEditing &&
                      !formData.preferredHeightMin &&
                      !formData.preferredHeightMax && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {t.cards.ageAndHeight.heightEmpty}
                        </p>
                      )}
                  </fieldset>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Column 2 --- */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-sky-50/40 to-blue-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-5 h-5 text-sky-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.locationAndReligion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <div>
                  <Label
                    htmlFor="preferred-locations-input"
                    className="block mb-2 text-xs font-medium text-gray-600"
                  >
                    {t.cards.locationAndReligion.locationsLabel}
                  </Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(formData.preferredLocations || []).map((loc) => (
                          <Badge
                            key={loc}
                            variant="secondary"
                            className="bg-sky-100 text-sky-800 rounded-full px-2 py-1 text-sm font-normal"
                          >
                            <span>{loc}</span>
                            <button
                              type="button"
                              className="mr-1.5 rtl:mr-0 rtl:ml-1.5 text-sky-600 hover:text-sky-900"
                              onClick={() =>
                                handleRemoveItemFromArray(
                                  'preferredLocations',
                                  loc
                                )
                              }
                              aria-label={t.cards.locationAndReligion.locationsRemoveLabel.replace(
                                '{{loc}}',
                                loc
                              )}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Autocomplete
                        id="preferred-locations-input"
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                        value={locationInputValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLocationInputValue(e.target.value)
                        }
                        onPlaceSelected={(place) => {
                          const cityComponent = place.address_components?.find(
                            (component) => component.types.includes('locality')
                          );
                          const selectedCity =
                            cityComponent?.long_name ||
                            place.formatted_address ||
                            '';
                          handleAddItemToArray(
                            'preferredLocations',
                            selectedCity
                          );
                          setLocationInputValue('');
                        }}
                        options={{
                          types: ['(cities)'],
                          componentRestrictions: { country: 'il' },
                        }}
                        className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder={
                          t.cards.locationAndReligion.locationsPlaceholder
                        }
                      />
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!formData.preferredLocations ||
                      formData.preferredLocations.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          {t.cards.locationAndReligion.locationsEmpty}
                        </p>
                      ) : (
                        formData.preferredLocations.map((loc) => (
                          <Badge
                            key={loc}
                            variant="secondary"
                            className="mr-1 mb-1 bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {loc}
                          </Badge>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <fieldset>
                  <legend className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
                    {t.cards.locationAndReligion.religiousLevelsLegend}
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-describedby="religious-level-tooltip"
                          >
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          id="religious-level-tooltip"
                          side="top"
                          className="max-w-xs text-center"
                        >
                          <p>
                            {t.cards.locationAndReligion.religiousLevelsTooltip}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {religiousLevelOptions.map((level) => (
                        <Button
                          key={level.value}
                          type="button"
                          variant={
                            (formData.preferredReligiousLevels || []).includes(
                              level.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredReligiousLevels',
                              level.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.preferredReligiousLevels || []).includes(
                              level.value
                            )
                              ? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredReligiousLevels,
                        religiousLevelOptions,
                        'bg-pink-100 text-pink-700',
                        t.cards.locationAndReligion.religiousLevelsEmpty
                      )}
                    </div>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.locationAndReligion.religiousJourneysLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {preferredReligiousJourneyOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (
                              formData.preferredReligiousJourneys || []
                            ).includes(opt.value as ReligiousJourney)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredReligiousJourneys',
                              opt.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (
                              formData.preferredReligiousJourneys || []
                            ).includes(opt.value as ReligiousJourney)
                              ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredReligiousJourneys as string[],
                        preferredReligiousJourneyOptions,
                        'bg-cyan-100 text-cyan-700',
                        t.cards.locationAndReligion.religiousJourneysEmpty
                      )}
                    </div>
                  )}
                </fieldset>

                <div>
                  <Label
                    htmlFor="preferredShomerNegiah"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    {t.cards.locationAndReligion.shomerNegiahLabel}
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredShomerNegiah"
                      value={formData.preferredShomerNegiah || ''}
                      onValueChange={(value) =>
                        handleSelectChange('preferredShomerNegiah', value)
                      }
                    >
                      <SelectTrigger
                        id="preferredShomerNegiah"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue
                          placeholder={
                            t.cards.locationAndReligion.shomerNegiahPlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredShomerNegiahOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredShomerNegiah,
                        preferredShomerNegiahOptions,
                        ''
                      )}
                    </p>
                  )}
                </div>
                {profile?.gender === Gender.MALE && (
                  <fieldset>
                    <legend className="block mb-2 text-xs font-medium text-gray-600">
                      {t.cards.locationAndReligion.headCoveringLegend}
                    </legend>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {headCoveringOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={
                              (formData.preferredHeadCoverings || []).includes(
                                opt.value as HeadCoveringType
                              )
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              handleMultiSelectChange(
                                'preferredHeadCoverings',
                                opt.value as HeadCoveringType
                              )
                            }
                            className={cn(
                              'rounded-full text-xs px-3 py-1.5 transition-all',
                              (formData.preferredHeadCoverings || []).includes(
                                opt.value as HeadCoveringType
                              )
                                ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {renderMultiSelectBadges(
                          formData.preferredHeadCoverings as string[],
                          headCoveringOptions,
                          'bg-purple-100 text-purple-700',
                          t.cards.locationAndReligion.headCoveringEmpty
                        )}
                      </div>
                    )}
                  </fieldset>
                )}
                {profile?.gender === Gender.FEMALE && (
                  <fieldset>
                    <legend className="block mb-2 text-xs font-medium text-gray-600">
                      {t.cards.locationAndReligion.kippahTypeLegend}
                    </legend>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {kippahTypeOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={
                              (formData.preferredKippahTypes || []).includes(
                                opt.value as KippahType
                              )
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              handleMultiSelectChange(
                                'preferredKippahTypes',
                                opt.value as KippahType
                              )
                            }
                            className={cn(
                              'rounded-full text-xs px-3 py-1.5 transition-all',
                              (formData.preferredKippahTypes || []).includes(
                                opt.value as KippahType
                              )
                                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {renderMultiSelectBadges(
                          formData.preferredKippahTypes as string[],
                          kippahTypeOptions,
                          'bg-orange-100 text-orange-700',
                          t.cards.locationAndReligion.kippahTypeEmpty
                        )}
                      </div>
                    )}
                  </fieldset>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50/40 to-green-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <GraduationCap className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.educationAndCareer.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.educationAndCareer.educationLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {educationPreferenceOptions.map((edu) => (
                        <Button
                          key={edu.value}
                          type="button"
                          variant={
                            (formData.preferredEducation || []).includes(
                              edu.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredEducation',
                              edu.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.preferredEducation || []).includes(
                              edu.value
                            )
                              ? 'bg-teal-500 hover:bg-teal-600 text-white border-teal-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {edu.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredEducation,
                        educationPreferenceOptions,
                        'bg-teal-100 text-teal-700',
                        t.cards.educationAndCareer.educationEmpty
                      )}
                    </div>
                  )}
                </fieldset>
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.educationAndCareer.occupationLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {occupationPreferenceOptions.map((occ) => (
                        <Button
                          key={occ.value}
                          type="button"
                          variant={
                            (formData.preferredOccupations || []).includes(
                              occ.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredOccupations',
                              occ.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.preferredOccupations || []).includes(
                              occ.value
                            )
                              ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {occ.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredOccupations,
                        occupationPreferenceOptions,
                        'bg-green-100 text-green-700',
                        t.cards.educationAndCareer.occupationEmpty
                      )}
                    </div>
                  )}
                </fieldset>
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.educationAndCareer.serviceTypeLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {serviceTypeOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredServiceTypes || []).includes(
                              opt.value as ServiceType
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredServiceTypes',
                              opt.value as ServiceType
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.preferredServiceTypes || []).includes(
                              opt.value as ServiceType
                            )
                              ? 'bg-lime-500 hover:bg-lime-600 text-white border-lime-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredServiceTypes as string[],
                        serviceTypeOptions,
                        'bg-lime-100 text-lime-700',
                        t.cards.educationAndCareer.serviceTypeEmpty
                      )}
                    </div>
                  )}
                </fieldset>
              </CardContent>
            </Card>
          </div>

          {/* --- Column 3 --- */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-50/40 to-fuchsia-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="w-5 h-5 text-rose-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.personalBackground.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.personalBackground.maritalStatusLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {maritalStatusOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredMaritalStatuses || []).includes(
                              opt.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredMaritalStatuses',
                              opt.value
                            )
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all',
                            (formData.preferredMaritalStatuses || []).includes(
                              opt.value
                            )
                              ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredMaritalStatuses,
                        maritalStatusOptions,
                        'bg-rose-100 text-rose-700',
                        t.cards.personalBackground.maritalStatusEmpty
                      )}
                    </div>
                  )}
                </fieldset>
                <div>
                  <Label
                    htmlFor="preferredPartnerHasChildren"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    {t.cards.personalBackground.partnerHasChildrenLabel}
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredPartnerHasChildren"
                      value={formData.preferredPartnerHasChildren || ''}
                      onValueChange={(value) =>
                        handleSelectChange('preferredPartnerHasChildren', value)
                      }
                    >
                      <SelectTrigger
                        id="preferredPartnerHasChildren"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue
                          placeholder={
                            t.cards.personalBackground
                              .partnerHasChildrenPlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredPartnerHasChildrenOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredPartnerHasChildren,
                        preferredPartnerHasChildrenOptions,
                        ''
                      )}
                    </p>
                  )}
                </div>
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.personalBackground.originLegend}
                  </legend>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {preferredOriginOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={
                              (formData.preferredOrigins || []).includes(
                                opt.value
                              )
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() =>
                              handleMultiSelectChange(
                                'preferredOrigins',
                                opt.value
                              )
                            }
                            className={cn(
                              'rounded-full text-xs px-3 py-1.5 transition-all',
                              (formData.preferredOrigins || []).includes(
                                opt.value
                              )
                                ? 'bg-fuchsia-500 hover:bg-fuchsia-600 text-white border-fuchsia-500'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(formData.preferredOrigins || [])
                            .filter(
                              (origin) =>
                                !preferredOriginOptions.some(
                                  (opt) => opt.value === origin
                                )
                            )
                            .map((origin) => (
                              <Badge
                                key={origin}
                                variant="secondary"
                                className="bg-fuchsia-100 text-fuchsia-800 rounded-full px-2 py-1 text-sm font-normal"
                              >
                                <span>{origin}</span>
                                <button
                                  type="button"
                                  className="mr-1.5 rtl:mr-0 rtl:ml-1.5 text-fuchsia-600 hover:text-fuchsia-900"
                                  onClick={() =>
                                    handleRemoveItemFromArray(
                                      'preferredOrigins',
                                      origin
                                    )
                                  }
                                  aria-label={t.cards.personalBackground.originRemoveLabel.replace(
                                    '{{origin}}',
                                    origin
                                  )}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </Badge>
                            ))}
                        </div>
                        <Label
                          htmlFor="preferred-origins-input"
                          className="sr-only"
                        >
                          {t.cards.personalBackground.originPlaceholder}
                        </Label>
                        <Autocomplete
                          id="preferred-origins-input"
                          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                          value={originInputValue}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setOriginInputValue(e.target.value)
                          }
                          onPlaceSelected={(place) => {
                            const countryComponent =
                              place.address_components?.find((component) =>
                                component.types.includes('country')
                              );
                            const selectedCountry =
                              countryComponent?.long_name ||
                              place.formatted_address ||
                              '';
                            handleAddItemToArray(
                              'preferredOrigins',
                              selectedCountry
                            );
                            setOriginInputValue('');
                          }}
                          options={{ types: ['country'] }}
                          className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                          placeholder={
                            t.cards.personalBackground.originPlaceholder
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!formData.preferredOrigins ||
                      formData.preferredOrigins.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          {t.cards.personalBackground.originEmpty}
                        </p>
                      ) : (
                        formData.preferredOrigins.map((originValue) => {
                          const option = preferredOriginOptions.find(
                            (opt) => opt.value === originValue
                          );
                          const label = option ? option.label : originValue;
                          return (
                            <Badge
                              key={originValue}
                              variant="secondary"
                              className="mr-1 mb-1 bg-fuchsia-100 text-fuchsia-700 text-xs px-2 py-0.5 rounded-full"
                            >
                              {label}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  )}
                </fieldset>
                <div>
                  <Label
                    htmlFor="preferredAliyaStatus"
                    className="block mb-1.5 text-xs font-medium text-gray-600"
                  >
                    {t.cards.personalBackground.aliyaStatusLabel}
                  </Label>
                  {isEditing ? (
                    <Select
                      name="preferredAliyaStatus"
                      value={formData.preferredAliyaStatus || ''}
                      onValueChange={(value) =>
                        handleSelectChange('preferredAliyaStatus', value)
                      }
                    >
                      <SelectTrigger
                        id="preferredAliyaStatus"
                        className="h-9 text-sm focus:ring-cyan-500"
                      >
                        <SelectValue
                          placeholder={
                            t.cards.personalBackground.aliyaStatusPlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {preferredAliyaStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium mt-1">
                      {getSelectDisplayValue(
                        formData.preferredAliyaStatus,
                        preferredAliyaStatusOptions,
                        ''
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50/40 to-yellow-50/40 border-b border-gray-200/50 p-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-semibold text-gray-700">
                  {t.cards.characterAndInterests.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.characterAndInterests.traitsLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {characterTraitsOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredCharacterTraits || []).includes(
                              opt.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredCharacterTraits',
                              opt.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.preferredCharacterTraits || []).length >=
                              3 &&
                            !(formData.preferredCharacterTraits || []).includes(
                              opt.value
                            ) &&
                            opt.value !== 'no_strong_preference'
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all flex items-center',
                            (formData.preferredCharacterTraits || []).includes(
                              opt.value
                            )
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {opt.icon && (
                            <opt.icon className="w-3.5 h-3.5 rtl:ml-1.5 mr-1.5" />
                          )}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredCharacterTraits,
                        characterTraitsOptions,
                        'bg-yellow-100 text-yellow-700',
                        t.cards.characterAndInterests.traitsEmpty
                      )}
                    </div>
                  )}
                </fieldset>
                <fieldset>
                  <legend className="block mb-2 text-xs font-medium text-gray-600">
                    {t.cards.characterAndInterests.hobbiesLegend}
                  </legend>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {hobbiesOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={
                            (formData.preferredHobbies || []).includes(
                              opt.value
                            )
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            handleMultiSelectChange(
                              'preferredHobbies',
                              opt.value
                            )
                          }
                          disabled={
                            !viewOnly &&
                            (formData.preferredHobbies || []).length >= 3 &&
                            !(formData.preferredHobbies || []).includes(
                              opt.value
                            ) &&
                            opt.value !== 'no_strong_preference'
                          }
                          className={cn(
                            'rounded-full text-xs px-3 py-1.5 transition-all flex items-center',
                            (formData.preferredHobbies || []).includes(
                              opt.value
                            )
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          )}
                        >
                          {opt.icon && (
                            <opt.icon className="w-3.5 h-3.5 rtl:ml-1.5 mr-1.5" />
                          )}
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {renderMultiSelectBadges(
                        formData.preferredHobbies,
                        hobbiesOptions,
                        'bg-amber-100 text-amber-700',
                        t.cards.characterAndInterests.hobbiesEmpty
                      )}
                    </div>
                  )}
                </fieldset>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;
