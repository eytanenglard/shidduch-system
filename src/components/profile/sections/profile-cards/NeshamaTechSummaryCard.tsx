'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Award } from 'lucide-react';
import { ProfileCardProps } from './types';
import { EditableCard } from '@/components/profile/fields';

const NeshamaTechSummaryCard: React.FC<ProfileCardProps> = ({
  profile,
  isEditing,
  formData,
  handleChange,
  dict,
  direction,
}) => {
  if (!profile) return null;
  const t = dict.neshamaTechSummary;

  return (
    <EditableCard
      icon={<Award className="w-4 h-4 text-purple-700" />}
      title={t.cardTitle}
      gradientFrom="from-purple-50/60 to-indigo-50/60"
      iconGradient="from-purple-500/10 to-purple-600/10"
      headerChildren={
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch
                checked={formData.isNeshamaTechSummaryVisible ?? true}
                onCheckedChange={(checked) => handleChange('isNeshamaTechSummaryVisible', checked)}
                disabled={!isEditing}
              />
            </TooltipTrigger>
            <TooltipContent dir={direction} sideOffset={5} collisionPadding={10}>
              <p>{t.visibilityTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]">
        {profile.manualEntryText || (
          <span className="italic text-gray-500">{t.emptyState}</span>
        )}
      </p>
    </EditableCard>
  );
};

export default React.memo(NeshamaTechSummaryCard);
