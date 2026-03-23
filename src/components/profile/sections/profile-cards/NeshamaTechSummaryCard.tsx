'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Award } from 'lucide-react';
import { ProfileCardProps } from './types';

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
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center flex-shrink-0">
            <Award className="w-4 h-4 text-purple-700" />
          </div>
          <CardTitle className="text-base font-semibold text-gray-700">
            {t.cardTitle}
          </CardTitle>
        </div>
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
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]">
          {profile.manualEntryText || (
            <span className="italic text-gray-500">{t.emptyState}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default React.memo(NeshamaTechSummaryCard);
