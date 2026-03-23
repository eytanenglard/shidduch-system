'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { cn } from '@/lib/utils';
import { ProfileCardProps } from './types';
import { renderBooleanDisplayValue } from './helpers';
import { SelectField, InputField } from '@/components/profile/fields';

const FamilyCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  direction,
}) => {
  const editing = isEditing && !viewOnly;

  const maritalStatusOptions = useMemo(
    () => Object.entries(dict.options.maritalStatus).map(([value, label]) => ({ value, label })),
    [dict.options.maritalStatus]
  );

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <ProfileCardHeader
        icon={<Users className="w-4 h-4 text-purple-700" />}
        title={dict.cards.family.title}
        gradientFrom="from-purple-50/60 to-indigo-50/60"
        iconGradient="from-purple-500/10 to-purple-600/10"
      />
      <CardContent className="p-3 md:p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3 items-start">
          <SelectField
            id="maritalStatus"
            label={dict.cards.family.maritalStatusLabel}
            value={formData.maritalStatus}
            options={maritalStatusOptions}
            placeholder={dict.cards.family.maritalStatusPlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('maritalStatus', value || undefined)}
            direction={direction}
          />

          {/* Has Children */}
          {(formData.maritalStatus === 'divorced' ||
            formData.maritalStatus === 'widowed' ||
            formData.maritalStatus === 'annulled') && (
            <div className={cn('pt-1 sm:pt-0', editing ? 'sm:pt-5' : 'sm:pt-0')}>
              <Label htmlFor="hasChildrenFromPrevious" className="block mb-1 text-xs font-medium text-gray-600">
                {dict.cards.family.hasChildrenLabel}
              </Label>
              {editing ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                  <Checkbox
                    id="hasChildrenFromPrevious"
                    checked={formData.hasChildrenFromPrevious || false}
                    onCheckedChange={(checked) => handleChange('hasChildrenFromPrevious', checked as boolean)}
                  />
                  <Label htmlFor="hasChildrenFromPrevious" className="text-sm font-normal text-gray-700">
                    {dict.cards.family.hasChildrenYes}
                  </Label>
                </div>
              ) : (
                <p className="text-sm text-gray-800 font-medium mt-0.5">
                  {renderBooleanDisplayValue(formData.hasChildrenFromPrevious, dict)}
                </p>
              )}
            </div>
          )}

          <InputField
            id="parentStatus"
            label={dict.cards.family.parentStatusLabel}
            value={formData.parentStatus}
            isEditing={editing}
            onChange={(value) => handleChange('parentStatus', value)}
            placeholder={dict.cards.family.parentStatusPlaceholder}
          />

          <InputField
            id="fatherOccupation"
            label={dict.cards.family.fatherOccupationLabel}
            value={formData.fatherOccupation}
            isEditing={editing}
            onChange={(value) => handleChange('fatherOccupation', value)}
            placeholder={dict.cards.family.fatherOccupationPlaceholder}
          />

          <InputField
            id="motherOccupation"
            label={dict.cards.family.motherOccupationLabel}
            value={formData.motherOccupation}
            isEditing={editing}
            onChange={(value) => handleChange('motherOccupation', value)}
            placeholder={dict.cards.family.motherOccupationPlaceholder}
          />

          <InputField
            id="siblings"
            label={dict.cards.family.siblingsLabel}
            value={formData.siblings}
            isEditing={editing}
            onChange={(value) => handleChange('siblings', value)}
            type="number"
            placeholder={dict.cards.family.siblingsPlaceholder}
            min={0}
          />

          <InputField
            id="position"
            label={dict.cards.family.positionLabel}
            value={formData.position}
            isEditing={editing}
            onChange={(value) => handleChange('position', value)}
            type="number"
            placeholder={dict.cards.family.positionPlaceholder}
            min={0}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FamilyCard);
