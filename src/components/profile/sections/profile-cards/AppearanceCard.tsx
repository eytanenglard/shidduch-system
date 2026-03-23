'use client';

import React, { useMemo } from 'react';
import { BodyType, AppearanceTone, GroomingStyle } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { Palette } from 'lucide-react';
import { ProfileCardProps } from './types';
import { SelectField } from '@/components/profile/fields';

const AppearanceCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  direction,
}) => {
  const editing = isEditing && !viewOnly;

  const bodyTypeOptions = useMemo(
    () => [
      { value: 'NONE', label: dict.cards.appearance.bodyTypePlaceholder },
      ...Object.entries(dict.options.bodyType).map(([value, label]) => ({ value, label })),
    ],
    [dict.options.bodyType, dict.cards.appearance.bodyTypePlaceholder]
  );
  const appearanceToneOptions = useMemo(
    () => [
      { value: 'NONE', label: dict.cards.appearance.appearanceTonePlaceholder },
      ...Object.entries(dict.options.appearanceTone).map(([value, label]) => ({ value, label })),
    ],
    [dict.options.appearanceTone, dict.cards.appearance.appearanceTonePlaceholder]
  );
  const groomingStyleOptions = useMemo(
    () => [
      { value: 'NONE', label: dict.cards.appearance.groomingStylePlaceholder },
      ...Object.entries(dict.options.groomingStyle).map(([value, label]) => ({ value, label })),
    ],
    [dict.options.groomingStyle, dict.cards.appearance.groomingStylePlaceholder]
  );

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <ProfileCardHeader
        icon={<Palette className="w-4 h-4 text-purple-600" />}
        title={dict.cards.appearance.title}
        gradientFrom="from-purple-50/60 to-pink-50/60"
        iconGradient="from-purple-500/10 to-purple-600/10"
      />
      <CardContent className="p-3 md:p-4 space-y-4">
        <SelectField
          id="bodyType"
          label={dict.cards.appearance.bodyTypeLabel}
          value={formData.bodyType || 'NONE'}
          options={bodyTypeOptions}
          placeholder={dict.cards.appearance.bodyTypePlaceholder}
          isEditing={editing}
          onChange={(value) => handleChange('bodyType', value === 'NONE' ? undefined : value as BodyType)}
          direction={direction}
          emptyText={dict.cards.appearance.bodyTypeEmpty}
          labelClassName="text-sm font-medium text-gray-700 block mb-1"
        />

        <SelectField
          id="appearanceTone"
          label={dict.cards.appearance.appearanceToneLabel}
          value={formData.appearanceTone || 'NONE'}
          options={appearanceToneOptions}
          placeholder={dict.cards.appearance.appearanceTonePlaceholder}
          isEditing={editing}
          onChange={(value) => handleChange('appearanceTone', value === 'NONE' ? undefined : value as AppearanceTone)}
          direction={direction}
          emptyText={dict.cards.appearance.appearanceToneEmpty}
          labelClassName="text-sm font-medium text-gray-700 block mb-1"
        />

        <SelectField
          id="groomingStyle"
          label={dict.cards.appearance.groomingStyleLabel}
          value={formData.groomingStyle || 'NONE'}
          options={groomingStyleOptions}
          placeholder={dict.cards.appearance.groomingStylePlaceholder}
          isEditing={editing}
          onChange={(value) => handleChange('groomingStyle', value === 'NONE' ? undefined : value as GroomingStyle)}
          direction={direction}
          emptyText={dict.cards.appearance.groomingStyleEmpty}
          labelClassName="text-sm font-medium text-gray-700 block mb-1"
        />
      </CardContent>
    </Card>
  );
};

export default React.memo(AppearanceCard);
