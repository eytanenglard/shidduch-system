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
import { XCircle, Users } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { cn } from '@/lib/utils';
import { PreferenceCardProps } from './types';
import { generateOptions, renderMultiSelectBadges, getSelectDisplayValue } from './helpers';

const PersonalBackgroundCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleSelectChange,
  handleMultiSelectChange,
  handleAddItemToArray,
  handleRemoveItemFromArray,
  t,
}) => {
  const [originInputValue, setOriginInputValue] = useState('');

  const maritalStatusOptions = useMemo(() => generateOptions(t.options.maritalStatus), [t.options.maritalStatus]);
  const preferredPartnerHasChildrenOptions = useMemo(() => generateOptions(t.options.partnerHasChildren), [t.options.partnerHasChildren]);
  const preferredOriginOptions = useMemo(() => generateOptions(t.options.origins), [t.options.origins]);
  const preferredAliyaStatusOptions = useMemo(() => generateOptions(t.options.aliyaStatus), [t.options.aliyaStatus]);

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-rose-50/60 to-fuchsia-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center space-x-2 rtl:space-x-reverse">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-600/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-rose-700" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-700">
          {t.cards.personalBackground.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 space-y-4">
        {/* Marital Status */}
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

        {/* Partner Has Children */}
        <div>
          <Label
            htmlFor="preferredPartnerHasChildren"
            className="block mb-1 text-xs font-medium text-gray-600"
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
                className="h-9 text-sm focus:ring-teal-500"
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
            <p className="text-sm text-gray-800 font-medium mt-0.5">
              {getSelectDisplayValue(
                formData.preferredPartnerHasChildren,
                preferredPartnerHasChildrenOptions,
                ''
              )}
            </p>
          )}
        </div>

        {/* Origins */}
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
                          className="ltr:mr-1.5 rtl:ml-1.5 text-fuchsia-600 hover:text-fuchsia-900"
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
                  className="w-full h-9 text-sm p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
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
                      className="ltr:mr-1 rtl:ml-1 mb-1 bg-fuchsia-100 text-fuchsia-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {label}
                    </Badge>
                  );
                })
              )}
            </div>
          )}
        </fieldset>

        {/* Aliya Status */}
        <div>
          <Label
            htmlFor="preferredAliyaStatus"
            className="block mb-1 text-xs font-medium text-gray-600"
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
                className="h-9 text-sm focus:ring-teal-500"
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
            <p className="text-sm text-gray-800 font-medium mt-0.5">
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
  );
};

export default React.memo(PersonalBackgroundCard);
