'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, SlidersHorizontal } from 'lucide-react';
import { PreferenceCardProps } from './types';

const AgeHeightCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleInputChange,
  t,
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center space-x-2 rtl:space-x-reverse">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 flex items-center justify-center flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-700">
          {t.cards.ageAndHeight.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
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
      </CardContent>
    </Card>
  );
};

export default React.memo(AgeHeightCard);
