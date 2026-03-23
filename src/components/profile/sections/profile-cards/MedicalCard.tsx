'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HeartPulse, Lock, Eye } from 'lucide-react';
import { ProfileCardProps } from './types';
import { renderBooleanDisplayValue } from './helpers';
import { SelectField } from '@/components/profile/fields';

const MedicalCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  direction,
}) => {
  const editing = isEditing && !viewOnly;

  const medicalTimingOptions = useMemo(
    () => Object.entries(dict.options.medicalTiming).map(([value, label]) => ({ value, label })),
    [dict.options.medicalTiming]
  );
  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-rose-50/60 to-pink-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-600/10 flex items-center justify-center flex-shrink-0">
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <CardTitle className="text-base font-semibold text-gray-700">
            {dict.cards.medical.title}
          </CardTitle>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full cursor-help">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span className="text-xs text-emerald-600">{dict.cards.medical.protectedBadge || 'Protected'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs" dir={direction}>
              <p>{dict.cards.medical.privacyNote || 'מידע זה מוצפן. רק השדכן רואה אותו, ואת/ה בוחר/ת מתי לחשוף'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200/80">
          {dict.cards.medical.description}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="hasMedicalInfo"
                checked={formData.hasMedicalInfo || false}
                onCheckedChange={(checked) => handleChange('hasMedicalInfo', checked as boolean)}
              />
              <Label htmlFor="hasMedicalInfo" className="text-sm font-medium text-gray-700 cursor-pointer">
                {dict.cards.medical.hasInfoLabel}
              </Label>
            </div>

            {formData.hasMedicalInfo && (
              <div className="space-y-4 border-t pt-4 animate-in fade-in-50">
                <div>
                  <Label htmlFor="medicalInfoDetails" className="block mb-1 text-xs font-medium text-gray-600">
                    {dict.cards.medical.detailsLabel}
                  </Label>
                  <Textarea
                    id="medicalInfoDetails"
                    value={formData.medicalInfoDetails || ''}
                    onChange={(e) => handleChange('medicalInfoDetails', e.target.value)}
                    className="text-sm focus:ring-cyan-500 min-h-[80px] rounded-lg"
                    placeholder={dict.cards.medical.detailsPlaceholder}
                  />
                </div>
                <SelectField
                  id="medicalInfoDisclosureTiming"
                  label={dict.cards.medical.timingLabel}
                  value={formData.medicalInfoDisclosureTiming}
                  options={medicalTimingOptions}
                  placeholder={dict.cards.medical.timingPlaceholder}
                  isEditing={true}
                  onChange={(value) => handleChange('medicalInfoDisclosureTiming', value || undefined)}
                  direction={direction}
                />
                <div className="border-t pt-4">
                  <Label className="block mb-2 text-xs font-medium text-gray-600">
                    {dict.cards.medical.visibilityLabel}
                  </Label>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <Switch
                      id="isMedicalInfoVisible"
                      checked={!!formData.isMedicalInfoVisible}
                      onCheckedChange={(checked) => handleChange('isMedicalInfoVisible', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <div className="flex flex-col">
                      <Label htmlFor="isMedicalInfoVisible" className="text-sm font-medium text-gray-800 cursor-pointer">
                        {formData.isMedicalInfoVisible
                          ? dict.cards.medical.visibilityToggle.visible
                          : dict.cards.medical.visibilityToggle.hidden}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {formData.isMedicalInfoVisible
                          ? dict.cards.medical.visibilityDescription.visible
                          : dict.cards.medical.visibilityDescription.hidden}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="block text-xs font-medium text-gray-500">{dict.cards.medical.display.sharedInfo}</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5">
                {renderBooleanDisplayValue(formData.hasMedicalInfo, dict, dict.cards.medical.display.yes, dict.cards.medical.display.no)}
              </p>
            </div>
            {formData.hasMedicalInfo && (
              <>
                <div>
                  <p className="block text-xs font-medium text-gray-500">{dict.cards.medical.display.details}</p>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[40px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
                    {formData.medicalInfoDetails || (
                      <span className="text-gray-500 italic">{dict.cards.medical.display.noDetails}</span>
                    )}
                  </p>
                </div>
                <SelectField
                  id="medicalInfoDisclosureTiming-view"
                  label={dict.cards.medical.display.timing}
                  value={formData.medicalInfoDisclosureTiming}
                  options={medicalTimingOptions}
                  placeholder={dict.cards.medical.timingPlaceholder}
                  isEditing={false}
                  onChange={() => {}}
                  labelClassName="block text-xs font-medium text-gray-500"
                />
                <div>
                  <p className="block text-xs font-medium text-gray-500">{dict.cards.medical.display.visibility}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {formData.isMedicalInfoVisible ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Eye className="w-3.5 h-3.5 ms-1.5" />
                        {dict.cards.medical.display.visibleBadge}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        <Lock className="w-3.5 h-3.5 ms-1.5" />
                        {dict.cards.medical.display.hiddenBadge}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(MedicalCard);
