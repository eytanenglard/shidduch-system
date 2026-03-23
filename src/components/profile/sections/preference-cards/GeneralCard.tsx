'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, FileText } from 'lucide-react';
import { PreferenceCardProps } from './types';

const GeneralCard: React.FC<PreferenceCardProps> = ({
  isEditing,
  formData,
  handleInputChange,
  t,
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-slate-50/60 to-gray-100/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center space-x-2 rtl:space-x-reverse">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500/10 to-slate-600/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-slate-600" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-700">
          {t.cards.general.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Label
              htmlFor="matchingNotes"
              className="text-sm font-medium text-gray-700"
            >
              {t.cards.general.notesLabel}
            </Label>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-describedby="matchingNotes-tooltip"
                  >
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  id="matchingNotes-tooltip"
                  side="top"
                  className="max-w-xs text-center"
                >
                  <p>{t.cards.general.notesTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {isEditing ? (
            <Textarea
              id="matchingNotes"
              name="matchingNotes"
              value={formData.matchingNotes || ''}
              onChange={handleInputChange}
              placeholder={t.cards.general.notesPlaceholder}
              className="text-sm focus:ring-teal-500 min-h-[80px] rounded-lg"
              rows={4}
            />
          ) : (
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
              {formData.matchingNotes || (
                <span className="text-gray-500 italic">
                  {t.cards.general.notesEmpty}
                </span>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(GeneralCard);
