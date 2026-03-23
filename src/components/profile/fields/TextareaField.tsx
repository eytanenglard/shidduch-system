'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextareaFieldProps {
  id: string;
  label: string;
  value: string | undefined | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: React.ReactNode;
  tooltip?: string;
  direction?: 'rtl' | 'ltr';
  rows?: number;
  minLength?: number;
  charCountTemplate?: string;
  labelClassName?: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  id,
  label,
  value,
  isEditing,
  onChange,
  placeholder,
  emptyText,
  tooltip,
  direction,
  rows = 3,
  minLength,
  charCountTemplate,
  labelClassName = 'text-sm font-medium text-gray-700',
}) => {
  const currentLength = (value || '').trim().length;
  const isBelowMinLength = minLength && currentLength > 0 && currentLength < minLength;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs text-center"
                dir={direction}
                sideOffset={5}
                collisionPadding={10}
              >
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {isEditing ? (
        <div>
          <Textarea
            id={id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'text-sm focus:ring-cyan-500 rounded-lg',
              `min-h-[${rows * 30}px]`,
              isBelowMinLength ? 'border-red-400 focus:ring-red-300' : ''
            )}
            placeholder={placeholder}
            rows={rows}
          />
          {minLength && value && charCountTemplate && (
            <div
              className={cn(
                'text-xs mt-1 text-end',
                isBelowMinLength ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {currentLength}
              {charCountTemplate.replace('{{count}}', String(minLength))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap min-h-[50px] bg-gradient-to-br from-slate-50/70 to-gray-50/40 p-3 rounded-xl border border-slate-200/30">
          {value || emptyText || (
            <span className="text-gray-500 italic">{placeholder}</span>
          )}
        </p>
      )}
    </div>
  );
};

export default TextareaField;
