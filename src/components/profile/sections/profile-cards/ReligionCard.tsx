'use client';

import React, { useMemo } from 'react';
import { Gender, ReligiousJourney, HeadCoveringType, KippahType } from '@prisma/client';
import { BookOpen } from 'lucide-react';
import { ProfileCardProps } from './types';
import { renderBooleanDisplayValue, QuestionnaireSyncBadge } from './helpers';
import { SelectField, TextareaField, EditableCard } from '@/components/profile/fields';

const ReligionCard: React.FC<ProfileCardProps> = ({
  isEditing,
  viewOnly = false,
  formData,
  handleChange,
  dict,
  locale,
  direction,
  questionnaireSyncedFields,
  onNavigateToQuestionnaire,
}) => {
  const editing = isEditing && !viewOnly;

  const religiousLevelOptions = useMemo(
    () => Object.entries(dict.options.religiousLevel).map(([value, label]) => ({ value, label })),
    [dict.options.religiousLevel]
  );
  const religiousJourneyOptions = useMemo(
    () => Object.entries(dict.options.religiousJourney).map(([value, label]) => ({ value, label })),
    [dict.options.religiousJourney]
  );
  const headCoveringOptions = useMemo(
    () => [
      ...Object.entries(dict.options.headCovering).map(([value, label]) => ({ value, label })),
      { value: 'WIG', label: locale === 'he' ? 'פאה' : 'Wig' },
      { value: 'UNDECIDED', label: dict.options.headCovering.UNDECIDED || "לא הוחלט / לא יודעת" },
    ],
    [dict.options.headCovering, locale]
  );
  const kippahTypeOptions = useMemo(
    () => Object.entries(dict.options.kippahType).map(([value, label]) => ({ value, label })),
    [dict.options.kippahType]
  );
  const preferredMatchmakerGenderOptions = useMemo(
    () => Object.entries(dict.options.matchmakerGender).map(([value, label]) => ({ value, label })),
    [dict.options.matchmakerGender]
  );
  const smokingStatusOptions = useMemo(
    () => [
      { value: 'NONE', label: dict.cards.religion.smokingStatusPlaceholder },
      ...Object.entries(dict.options.smokingStatus).map(([value, label]) => ({ value, label })),
    ],
    [dict.options.smokingStatus, dict.cards.religion.smokingStatusPlaceholder]
  );
  const shomerNegiahOptions = useMemo(
    () => [
      { value: 'YES', label: dict.cards.religion.shomerNegiahYes },
      { value: 'NO', label: dict.cards.religion.shomerNegiahNo || 'לא' },
      { value: '', label: dict.placeholders.notSpecified },
    ],
    [dict.cards.religion.shomerNegiahYes, dict.cards.religion.shomerNegiahNo, dict.placeholders.notSpecified]
  );

  return (
    <EditableCard
      icon={<BookOpen className="w-4 h-4 text-amber-700" />}
      title={dict.cards.religion.title}
      gradientFrom="from-yellow-50/60 to-amber-50/60"
      iconGradient="from-amber-500/10 to-amber-600/10"
      contentClassName="!space-y-0"
    >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3 items-start">
          <SelectField
            id="religiousLevel"
            label={dict.cards.religion.religiousLevelLabel}
            value={formData.religiousLevel}
            options={religiousLevelOptions}
            placeholder={dict.cards.religion.religiousLevelPlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('religiousLevel', value || undefined)}
            direction={direction}
          />

          <SelectField
            id="religiousJourney"
            label={dict.cards.religion.religiousJourneyLabel}
            value={formData.religiousJourney}
            options={religiousJourneyOptions}
            placeholder={dict.cards.religion.religiousJourneyPlaceholder}
            isEditing={editing}
            onChange={(value) => handleChange('religiousJourney', (value as ReligiousJourney) || undefined)}
            direction={direction}
          />

          {/* Shomer Negiah — boolean↔string conversion */}
          <div className={editing ? 'pt-1 sm:pt-0 sm:pt-5' : 'pt-1 sm:pt-0'}>
            <SelectField
              id="shomerNegiah"
              label={
                <span className="flex items-center gap-1.5 flex-wrap">
                  {dict.cards.religion.shomerNegiahLabel}
                  {questionnaireSyncedFields?.shomerNegiah && (
                    <QuestionnaireSyncBadge
                      label={dict.cards.questionnaireSyncBadge || 'מסונכרן מהשאלון'}
                      onNavigate={onNavigateToQuestionnaire}
                    />
                  )}
                </span>
              }
              value={formData.shomerNegiah === true ? 'YES' : formData.shomerNegiah === false ? 'NO' : ''}
              options={shomerNegiahOptions}
              placeholder={dict.cards.religion.shomerNegiahPlaceholder || 'בחר/י...'}
              isEditing={questionnaireSyncedFields?.shomerNegiah ? false : editing}
              onChange={(value) => {
                if (value === 'YES') handleChange('shomerNegiah', true);
                else if (value === 'NO') handleChange('shomerNegiah', false);
                else handleChange('shomerNegiah', undefined);
              }}
              direction={direction}
              emptyText={renderBooleanDisplayValue(
                formData.shomerNegiah,
                dict,
                dict.cards.religion.shomerNegiahYes,
                dict.cards.religion.shomerNegiahNo || 'לא'
              )}
            />
          </div>

          {/* Head Covering (Female) */}
          {formData.gender === Gender.FEMALE && (
            <SelectField
              id="headCovering"
              label={dict.cards.religion.headCoveringLabel}
              value={formData.headCovering}
              options={headCoveringOptions}
              placeholder={dict.cards.religion.headCoveringPlaceholder}
              isEditing={editing}
              onChange={(value) => handleChange('headCovering', (value as HeadCoveringType) || undefined)}
              direction={direction}
              emptyText={dict.cards.religion.headCoveringDefault}
            />
          )}

          {/* Kippah Type (Male) */}
          {formData.gender === Gender.MALE && (
            <SelectField
              id="kippahType"
              label={dict.cards.religion.kippahTypeLabel}
              value={formData.kippahType}
              options={kippahTypeOptions}
              placeholder={dict.cards.religion.kippahTypePlaceholder}
              isEditing={editing}
              onChange={(value) => handleChange('kippahType', (value as KippahType) || undefined)}
              direction={direction}
              maxHeight="200px"
              emptyText={dict.cards.religion.kippahTypeDefault}
            />
          )}

          <SelectField
            id="preferredMatchmakerGender"
            label={dict.cards.religion.matchmakerGenderLabel}
            value={formData.preferredMatchmakerGender || 'NONE'}
            options={preferredMatchmakerGenderOptions}
            placeholder={dict.cards.religion.matchmakerGenderPlaceholder}
            isEditing={editing}
            onChange={(value) => {
              if (value === 'MALE') handleChange('preferredMatchmakerGender', 'MALE');
              else if (value === 'FEMALE') handleChange('preferredMatchmakerGender', 'FEMALE');
              else handleChange('preferredMatchmakerGender', null);
            }}
            direction={direction}
            emptyText={dict.cards.religion.matchmakerGenderDefault}
          />
        </div>

        {/* Influential Rabbi */}
        <div className="mt-4 pt-4 border-t border-gray-200/30">
          <TextareaField
            id="influentialRabbi"
            label={dict.cards.religion.influentialRabbiLabel}
            value={formData.influentialRabbi}
            isEditing={editing}
            onChange={(value) => handleChange('influentialRabbi', value)}
            placeholder={dict.cards.religion.influentialRabbiPlaceholder}
            tooltip={dict.cards.religion.influentialRabbiPlaceholder}
            direction={direction}
            rows={3}
            emptyText={dict.cards.religion.influentialRabbiEmpty}
            labelClassName="text-sm font-medium text-gray-700"
          />
        </div>

        {/* Smoking */}
        <div className="mt-4 pt-4 border-t border-gray-200/30">
          <SelectField
            id="smokingStatus"
            label={
              <span className="flex items-center gap-1.5 flex-wrap">
                {dict.cards.religion.smokingStatusLabel}
                {questionnaireSyncedFields?.smokingStatus && (
                  <QuestionnaireSyncBadge
                    label={dict.cards.questionnaireSyncBadge || 'מסונכרן מהשאלון'}
                    onNavigate={onNavigateToQuestionnaire}
                  />
                )}
              </span>
            }
            value={formData.smokingStatus || 'NONE'}
            options={smokingStatusOptions}
            placeholder={dict.cards.religion.smokingStatusPlaceholder}
            isEditing={questionnaireSyncedFields?.smokingStatus ? false : editing}
            onChange={(value) => handleChange('smokingStatus', value === 'NONE' ? null : value)}
            direction={direction}
            emptyText={dict.cards.religion.smokingStatusEmpty}
            labelClassName="text-sm font-medium text-gray-700 block mb-1"
          />
        </div>
    </EditableCard>
  );
};

export default React.memo(ReligionCard);
