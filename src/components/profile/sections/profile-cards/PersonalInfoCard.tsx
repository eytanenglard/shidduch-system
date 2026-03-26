'use client';

import React, { useMemo } from 'react';
import { Gender } from '@prisma/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCircle } from 'lucide-react';
import { languageOptions } from '@/lib/languageOptions';
import { ProfileCardProps } from './types';
import { renderDisplayValue, getLanguageLabel } from './helpers';
import { SelectField, InputField, GooglePlacesField, EditableCard } from '@/components/profile/fields';

const PersonalInfoCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  locale,
  direction,
}) => {
  const editing = isEditing && !viewOnly;

  const genderOptions = useMemo(
    () => Object.entries(dict.options.gender).map(([value, label]) => ({ value, label })),
    [dict.options.gender]
  );

  const nativeLanguageOptions = useMemo(
    () => languageOptions.map((lang) => ({ value: lang.value, label: getLanguageLabel(lang, locale) })),
    [locale]
  );

  const birthDateValue =
    formData.birthDate instanceof Date && !isNaN(formData.birthDate.getTime())
      ? formData.birthDate.toISOString().split('T')[0]
      : '';

  return (
    <EditableCard
      icon={<UserCircle className="w-4 h-4 text-cyan-700" />}
      title={dict.cards.personal.title}
      gradientFrom="from-cyan-50/60 to-pink-50/60"
      iconGradient="from-cyan-500/10 to-cyan-600/10"
      contentClassName="!space-y-0"
    >
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <SelectField
            id="gender"
            label={dict.cards.personal.genderLabel}
            value={formData.gender}
            options={genderOptions}
            placeholder={dict.cards.personal.genderPlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('gender', value as Gender)}
            direction={direction}
          />

          <InputField
            id="birthDate"
            label={dict.cards.personal.birthDateLabel}
            value={birthDateValue}
            type="date"
            isEditing={editing}
            onChange={(value) => handleChange('birthDate', value || undefined)}
            max={new Date().toISOString().split('T')[0]}
            displayValue={!editing ? renderDisplayValue(formData.birthDate, dict) : undefined}
          />

          <InputField
            id="height"
            label={dict.cards.personal.heightLabel}
            value={formData.height}
            type="number"
            isEditing={editing}
            onChange={(value) => handleChange('height', value)}
            placeholder={dict.cards.personal.heightPlaceholder}
            min={100}
            max={250}
            displayValue={formData.height ? `${formData.height} ${dict.cards.personal.heightUnit}` : undefined}
          />

          <GooglePlacesField
            id="city-autocomplete"
            label={dict.cards.personal.cityLabel}
            value={formData.city}
            isEditing={editing}
            onChange={(value) => handleChange('city', value)}
            placeholder={dict.cards.personal.cityPlaceholder}
            placeTypes={['(cities)']}
            extractType="locality"
            componentRestrictions={{ country: 'il' }}
            fields={['address_components', 'formatted_address', 'geometry']}
          />

          <InputField
            id="origin"
            label={dict.cards.personal.originLabel}
            value={formData.origin}
            isEditing={editing}
            onChange={(value) => handleChange('origin', value)}
            placeholder={dict.cards.personal.originPlaceholder}
          />

          <GooglePlacesField
            id="aliyaCountry-autocomplete"
            label={dict.cards.personal.aliyaCountryLabel}
            value={formData.aliyaCountry}
            isEditing={editing}
            onChange={(value) => handleChange('aliyaCountry', value)}
            placeholder={dict.cards.personal.aliyaCountryPlaceholder}
            placeTypes={['country']}
            extractType="country"
            emptyText={<span className="italic text-gray-500">{dict.placeholders.notRelevant}</span>}
          />

          <InputField
            id="aliyaYear"
            label={dict.cards.personal.aliyaYearLabel}
            value={formData.aliyaYear}
            type="number"
            isEditing={editing}
            onChange={(value) => handleChange('aliyaYear', value)}
            disabled={!formData.aliyaCountry}
            placeholder={dict.cards.personal.aliyaYearPlaceholder}
            min={1900}
            max={new Date().getFullYear()}
            emptyText={
              <span className="italic text-gray-500">
                {formData.aliyaCountry ? dict.placeholders.noYear : dict.placeholders.notRelevant}
              </span>
            }
          />

          <SelectField
            id="nativeLanguage"
            label={dict.cards.personal.nativeLanguageLabel}
            value={formData.nativeLanguage}
            options={nativeLanguageOptions}
            placeholder={dict.cards.personal.nativeLanguagePlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('nativeLanguage', value || undefined)}
            direction={direction}
          />

          {/* Additional Languages */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor="additionalLanguages" className="block mb-1 text-xs font-medium text-gray-600">
              {dict.cards.personal.additionalLanguagesLabel}
            </Label>
            {editing ? (
              <Select
                dir={direction}
                onValueChange={(value) => {
                  const current = formData.additionalLanguages || [];
                  if (!current.includes(value)) {
                    handleChange('additionalLanguages', [...current, value]);
                  }
                }}
              >
                <SelectTrigger id="additionalLanguages" className="h-9 text-sm focus:ring-cyan-500 text-start">
                  <SelectValue placeholder={dict.cards.personal.additionalLanguagesPlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]" position="item-aligned">
                  {languageOptions
                    .filter(
                      (lang) =>
                        !(formData.additionalLanguages || []).includes(lang.value) &&
                        lang.value !== formData.nativeLanguage
                    )
                    .map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {getLanguageLabel(lang, locale)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(formData.additionalLanguages || []).map((langValue) => {
                const lang = languageOptions.find((l) => l.value === langValue);
                return lang ? (
                  <Badge
                    key={lang.value}
                    variant="secondary"
                    className="bg-cyan-100/70 text-cyan-800 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center"
                  >
                    {getLanguageLabel(lang, locale)}
                    {editing && (
                      <button
                        type="button"
                        onClick={() =>
                          handleChange(
                            'additionalLanguages',
                            (formData.additionalLanguages || []).filter((l) => l !== langValue)
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
              {!editing &&
                (!formData.additionalLanguages || formData.additionalLanguages.length === 0) && (
                  <p className="text-sm text-gray-500 italic">
                    {dict.cards.personal.noAdditionalLanguages}
                  </p>
                )}
            </div>
          </div>
        </div>
    </EditableCard>
  );
};

export default React.memo(PersonalInfoCard);
