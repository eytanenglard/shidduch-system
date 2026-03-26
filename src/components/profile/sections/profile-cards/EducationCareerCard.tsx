'use client';

import React, { useMemo } from 'react';
import { ServiceType } from '@prisma/client';
import { Briefcase } from 'lucide-react';
import CvUploadSection from '../CvUploadSection';
import { ProfileCardProps } from './types';
import { SelectField, InputField, EditableCard } from '@/components/profile/fields';

interface EducationCareerCardProps extends ProfileCardProps {
  onCvUpload?: (file: File) => Promise<void>;
  onCvDelete?: () => Promise<void>;
  isCvUploading?: boolean;
}

const EducationCareerCard: React.FC<EducationCareerCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  direction,
  onCvUpload,
  onCvDelete,
  isCvUploading,
}) => {
  const editing = isEditing && !viewOnly;

  const educationLevelOptions = useMemo(
    () => Object.entries(dict.options.educationLevel).map(([value, label]) => ({ value, label })),
    [dict.options.educationLevel]
  );
  const serviceTypeOptions = useMemo(
    () => Object.entries(dict.options.serviceType).map(([value, label]) => ({ value, label })),
    [dict.options.serviceType]
  );

  return (
    <EditableCard
      icon={<Briefcase className="w-4 h-4 text-teal-700" />}
      title={dict.cards.education.title}
      gradientFrom="from-teal-50/60 to-green-50/60"
      iconGradient="from-teal-500/10 to-teal-600/10"
    >
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <SelectField
            id="educationLevel"
            label={dict.cards.education.levelLabel}
            value={formData.educationLevel}
            options={educationLevelOptions}
            placeholder={dict.cards.education.levelPlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('educationLevel', value || undefined)}
            direction={direction}
          />

          <div className="sm:col-span-2">
            <InputField
              id="education"
              label={dict.cards.education.detailsLabel}
              value={formData.education}
              isEditing={editing}
              onChange={(value) => handleChange('education', value)}
              placeholder={dict.cards.education.detailsPlaceholder}
            />
          </div>

          <div className="sm:col-span-2">
            <InputField
              id="occupation"
              label={dict.cards.education.occupationLabel}
              value={formData.occupation}
              isEditing={editing}
              onChange={(value) => handleChange('occupation', value)}
              placeholder={dict.cards.education.occupationPlaceholder}
              maxLength={20}
            />
          </div>

          <SelectField
            id="serviceType"
            label={dict.cards.education.serviceTypeLabel}
            value={formData.serviceType}
            options={serviceTypeOptions}
            placeholder={dict.cards.education.serviceTypePlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('serviceType', (value as ServiceType) || undefined)}
            direction={direction}
          />

          <div className="sm:col-span-2">
            <InputField
              id="serviceDetails"
              label={dict.cards.education.serviceDetailsLabel}
              value={formData.serviceDetails}
              isEditing={editing}
              onChange={(value) => handleChange('serviceDetails', value)}
              placeholder={dict.cards.education.serviceDetailsPlaceholder}
            />
          </div>
        </div>
      <CvUploadSection
        cvUrl={formData.cvUrl}
        isUploading={isCvUploading ?? false}
        onUpload={onCvUpload || (async () => {})}
        onDelete={onCvDelete || (async () => {})}
        disabled={viewOnly || !isEditing}
        dict={dict.cards.education.cvSection}
      />
    </EditableCard>
  );
};

export default React.memo(EducationCareerCard);
