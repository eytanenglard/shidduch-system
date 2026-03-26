'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableCard } from '@/components/profile/fields';
import { PreferenceCardProps } from './types';
import { generateOptions, renderMultiSelectBadges } from './helpers';

const CharacterInterestsCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleMultiSelectChange,
  t,
}) => {
  const characterTraitsOptions = useMemo(() => generateOptions(t.options.traits, true), [t.options.traits]);
  const hobbiesOptions = useMemo(() => generateOptions(t.options.hobbies, true), [t.options.hobbies]);

  return (
    <EditableCard
      icon={<Sparkles className="w-4 h-4 text-amber-700" />}
      title={t.cards.characterAndInterests.title}
      gradientFrom="from-amber-50/60 to-yellow-50/60"
      iconGradient="from-amber-500/10 to-amber-600/10"
    >
        {/* Character Traits */}
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
                    <opt.icon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" />
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

        {/* Hobbies */}
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
                    <opt.icon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" />
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
    </EditableCard>
  );
};

export default React.memo(CharacterInterestsCard);
