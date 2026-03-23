'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Info, XCircle, MapPin } from 'lucide-react';
import { Gender, HeadCoveringType, KippahType, ReligiousJourney } from '@prisma/client';
import Autocomplete from 'react-google-autocomplete';
import { cn } from '@/lib/utils';
import { PreferenceCardProps } from './types';
import { generateOptions, renderMultiSelectBadges, getSelectDisplayValue } from './helpers';

const LocationReligionCard: React.FC<PreferenceCardProps> = ({
  profile,
  isEditing,
  formData,
  handleSelectChange,
  handleMultiSelectChange,
  handleAddItemToArray,
  handleRemoveItemFromArray,
  t,
  direction,
}) => {
  const [locationInputValue, setLocationInputValue] = useState('');

  const religiousLevelOptions = useMemo(() => generateOptions(t.options.religiousLevels), [t.options.religiousLevels]);
  const preferredReligiousJourneyOptions = useMemo(() => generateOptions(t.options.religiousJourneys), [t.options.religiousJourneys]);
  const preferredShomerNegiahOptions = useMemo(() => generateOptions(t.options.shomerNegiah), [t.options.shomerNegiah]);
  const preferredSmokingStatusOptions = useMemo(() => generateOptions(t.options.preferredSmokingStatus), [t.options.preferredSmokingStatus]);
  const headCoveringOptions = useMemo(() => generateOptions(t.options.headCovering), [t.options.headCovering]);
  const kippahTypeOptions = useMemo(() => generateOptions(t.options.kippahType), [t.options.kippahType]);

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-teal-50/60 to-orange-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center space-x-2 rtl:space-x-reverse">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-teal-600/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-teal-700" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-700">
          {t.cards.locationAndReligion.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 space-y-4">
        {/* Preferred Locations */}
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
                    className="bg-teal-100 text-teal-800 rounded-full px-2 py-1 text-sm font-normal"
                  >
                    <span>{loc}</span>
                    <button
                      type="button"
                      className="ltr:mr-1.5 rtl:ml-1.5 text-teal-600 hover:text-teal-900"
                      onClick={() =>
                        handleRemoveItemFromArray('preferredLocations', loc)
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
                  handleAddItemToArray('preferredLocations', selectedCity);
                  setLocationInputValue('');
                }}
                options={{
                  types: ['(cities)'],
                  componentRestrictions: { country: 'il' },
                }}
                className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                placeholder={t.cards.locationAndReligion.locationsPlaceholder}
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
                    className="ltr:mr-1 rtl:ml-1 mb-1 bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {loc}
                  </Badge>
                ))
              )}
            </div>
          )}
        </div>

        {/* Religious Levels */}
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

        {/* Religious Journeys */}
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
                      ? 'bg-teal-500 hover:bg-teal-600 text-white border-teal-500'
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
                'bg-teal-100 text-teal-700',
                t.cards.locationAndReligion.religiousJourneysEmpty
              )}
            </div>
          )}
        </fieldset>

        {/* Shomer Negiah */}
        <div>
          <Label
            htmlFor="preferredShomerNegiah"
            className="block mb-1 text-xs font-medium text-gray-600"
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
                className="h-9 text-sm focus:ring-teal-500"
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
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {getSelectDisplayValue(
                formData.preferredShomerNegiah,
                preferredShomerNegiahOptions,
                ''
              )}
            </p>
          )}
        </div>

        {/* Smoking Preference */}
        <div>
          <Label
            htmlFor="preferredSmokingStatus"
            className="block mb-1 text-xs font-medium text-gray-600"
          >
            {t.cards.locationAndReligion.smokingPreferenceLabel}
          </Label>
          {isEditing ? (
            <Select
              name="preferredSmokingStatus"
              value={formData.preferredSmokingStatus || ''}
              onValueChange={(value) =>
                handleSelectChange('preferredSmokingStatus', value)
              }
            >
              <SelectTrigger
                id="preferredSmokingStatus"
                className="h-9 text-sm focus:ring-teal-500"
              >
                <SelectValue
                  placeholder={
                    t.cards.locationAndReligion.smokingPreferencePlaceholder
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {preferredSmokingStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {getSelectDisplayValue(
                formData.preferredSmokingStatus,
                preferredSmokingStatusOptions,
                t.cards.locationAndReligion.smokingPreferenceEmpty
              )}
            </p>
          )}
        </div>

        {/* Head Covering (shown for MALE users) */}
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

        {/* Kippah Type (shown for FEMALE users) */}
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
  );
};

export default React.memo(LocationReligionCard);
