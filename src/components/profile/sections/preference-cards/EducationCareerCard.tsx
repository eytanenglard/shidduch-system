'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { ServiceType } from '@prisma/client';
import { cn } from '@/lib/utils';
import { EditableCard } from '@/components/profile/fields';
import { PreferenceCardProps } from './types';
import { generateOptions, renderMultiSelectBadges } from './helpers';

const EducationCareerCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleMultiSelectChange,
  t,
}) => {
  const educationPreferenceOptions = useMemo(() => generateOptions(t.options.education), [t.options.education]);
  const occupationPreferenceOptions = useMemo(() => generateOptions(t.options.occupation), [t.options.occupation]);
  const serviceTypeOptions = useMemo(() => generateOptions(t.options.serviceTypes), [t.options.serviceTypes]);

  return (
    <EditableCard
      icon={<GraduationCap className="w-4 h-4 text-teal-700" />}
      title={t.cards.educationAndCareer.title}
      gradientFrom="from-teal-50/60 to-green-50/60"
      iconGradient="from-teal-500/10 to-teal-600/10"
    >
        {/* Education */}
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
                    (formData.preferredEducation || []).includes(edu.value)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleMultiSelectChange('preferredEducation', edu.value)
                  }
                  className={cn(
                    'rounded-full text-xs px-3 py-1.5 transition-all',
                    (formData.preferredEducation || []).includes(edu.value)
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

        {/* Occupation */}
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
                    (formData.preferredOccupations || []).includes(occ.value)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    handleMultiSelectChange('preferredOccupations', occ.value)
                  }
                  className={cn(
                    'rounded-full text-xs px-3 py-1.5 transition-all',
                    (formData.preferredOccupations || []).includes(occ.value)
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

        {/* Service Type */}
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
    </EditableCard>
  );
};

export default React.memo(EducationCareerCard);
