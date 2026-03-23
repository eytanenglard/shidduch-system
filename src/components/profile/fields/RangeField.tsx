'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface RangeFieldProps {
  legend: string;
  minId: string;
  maxId: string;
  minName: string;
  maxName: string;
  minValue: number | undefined | null;
  maxValue: number | undefined | null;
  minPlaceholder: string;
  maxPlaceholder: string;
  isEditing: boolean;
  onMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emptyText?: string;
  tooltip?: string;
}

const RangeField: React.FC<RangeFieldProps> = ({
  legend,
  minId,
  maxId,
  minName,
  maxName,
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  isEditing,
  onMinChange,
  onMaxChange,
  emptyText,
  tooltip,
}) => {
  return (
    <fieldset>
      <legend className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
        {legend}
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button">
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </legend>
      <div className="flex items-center gap-2">
        <Label htmlFor={minId} className="sr-only">
          {minPlaceholder}
        </Label>
        <Input
          id={minId}
          type="number"
          name={minName}
          placeholder={minPlaceholder}
          value={minValue ?? ''}
          onChange={onMinChange}
          disabled={!isEditing}
          className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
        />
        <span aria-hidden="true" className="text-gray-500">
          -
        </span>
        <Label htmlFor={maxId} className="sr-only">
          {maxPlaceholder}
        </Label>
        <Input
          id={maxId}
          type="number"
          name={maxName}
          placeholder={maxPlaceholder}
          value={maxValue ?? ''}
          onChange={onMaxChange}
          disabled={!isEditing}
          className="h-9 text-sm focus:ring-teal-500 disabled:bg-gray-100/70"
        />
      </div>
      {!isEditing && !minValue && !maxValue && emptyText && (
        <p className="text-xs text-gray-500 italic mt-1">{emptyText}</p>
      )}
    </fieldset>
  );
};

export default RangeField;
