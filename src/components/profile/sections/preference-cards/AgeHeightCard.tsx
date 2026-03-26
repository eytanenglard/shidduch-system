'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, SlidersHorizontal } from 'lucide-react';
import { EditableCard } from '@/components/profile/fields';
import { PreferenceCardProps } from './types';

const AgeHeightCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleInputChange,
  t,
}) => {
  return (
    <EditableCard
      icon={<SlidersHorizontal className="w-4 h-4 text-indigo-700" />}
      title={t.cards.ageAndHeight.title}
      gradientFrom="from-indigo-50/60 to-purple-50/60"
      iconGradient="from-indigo-500/10 to-indigo-600/10"
      contentClassName="space-y-0"
    >
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
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
                className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
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
                className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
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
            <legend className="block mb-1 text-xs font-medium text-gray-600">
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
                className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
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
                className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
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
    </EditableCard>
  );
};

export default React.memo(AgeHeightCard);
