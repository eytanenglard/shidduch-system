'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { BodyType, AppearanceTone, GroomingStyle, EthnicBackground } from '@prisma/client';
import { EditableCard } from '@/components/profile/fields';
import { PreferenceCardProps } from './types';

const AppearancePreferencesCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleMultiSelectChange,
  t,
}) => {
  return (
    <EditableCard
      icon={<Palette className="w-4 h-4 text-purple-600" />}
      title={t.cards.appearancePreferences.title}
      gradientFrom="from-purple-50/60 to-pink-50/60"
      iconGradient="from-purple-500/10 to-purple-600/10"
    >

        {/* Body Type */}
        <fieldset>
          <legend className="block mb-2 text-xs font-medium text-gray-600">
            {t.cards.appearancePreferences.bodyTypeLegend}
          </legend>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.options.bodyType).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={(formData.preferredBodyTypes || []).includes(value as BodyType) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMultiSelectChange('preferredBodyTypes', value)}
                  className="text-xs rounded-full"
                >
                  {label as string}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(formData.preferredBodyTypes || []).length > 0 ? (
                (formData.preferredBodyTypes || []).map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs shadow-sm">
                    {(t.options.bodyType as Record<string, string>)[v] || v}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t.cards.appearancePreferences.bodyTypeEmpty}</p>
              )}
            </div>
          )}
        </fieldset>

        {/* Appearance Tone */}
        <fieldset>
          <legend className="block mb-2 text-xs font-medium text-gray-600">
            {t.cards.appearancePreferences.appearanceToneLegend}
          </legend>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.options.appearanceTone).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={(formData.preferredAppearanceTones || []).includes(value as AppearanceTone) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMultiSelectChange('preferredAppearanceTones', value)}
                  className="text-xs rounded-full"
                >
                  {label as string}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(formData.preferredAppearanceTones || []).length > 0 ? (
                (formData.preferredAppearanceTones || []).map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs shadow-sm">
                    {(t.options.appearanceTone as Record<string, string>)[v] || v}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t.cards.appearancePreferences.appearanceToneEmpty}</p>
              )}
            </div>
          )}
        </fieldset>

        {/* Grooming Style */}
        <fieldset>
          <legend className="block mb-2 text-xs font-medium text-gray-600">
            {t.cards.appearancePreferences.groomingStyleLegend}
          </legend>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.options.groomingStyle).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={(formData.preferredGroomingStyles || []).includes(value as GroomingStyle) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMultiSelectChange('preferredGroomingStyles', value)}
                  className="text-xs rounded-full"
                >
                  {label as string}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(formData.preferredGroomingStyles || []).length > 0 ? (
                (formData.preferredGroomingStyles || []).map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs shadow-sm">
                    {(t.options.groomingStyle as Record<string, string>)[v] || v}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t.cards.appearancePreferences.groomingStyleEmpty}</p>
              )}
            </div>
          )}
        </fieldset>

        {/* Ethnic Background */}
        <fieldset>
          <legend className="block mb-2 text-xs font-medium text-gray-600">
            {t.cards.appearancePreferences.ethnicBackgroundLegend}
          </legend>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.options.ethnicBackground).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={(formData.preferredEthnicBackgrounds || []).includes(value as EthnicBackground) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMultiSelectChange('preferredEthnicBackgrounds', value)}
                  className="text-xs rounded-full"
                >
                  {label as string}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(formData.preferredEthnicBackgrounds || []).length > 0 ? (
                (formData.preferredEthnicBackgrounds || []).map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs shadow-sm">
                    {(t.options.ethnicBackground as Record<string, string>)[v] || v}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t.cards.appearancePreferences.ethnicBackgroundEmpty}</p>
              )}
            </div>
          )}
        </fieldset>

    </EditableCard>
  );
};

export default React.memo(AppearancePreferencesCard);
