'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MultiSelectToggleProps {
  legend: string;
  options: { value: string; label: string; icon?: React.ElementType }[];
  selectedValues: string[];
  isEditing: boolean;
  onChange: (value: string) => void;
  maxSelection?: number;
  activeColor?: string;
  badgeColor?: string;
  emptyText: string;
  noPreferenceValues?: string[];
  tooltip?: React.ReactNode;
}

const MultiSelectToggle: React.FC<MultiSelectToggleProps> = ({
  legend,
  options,
  selectedValues,
  isEditing,
  onChange,
  maxSelection,
  activeColor = 'bg-teal-500 hover:bg-teal-600 text-white border-teal-500',
  badgeColor = 'bg-teal-100 text-teal-700',
  emptyText,
  noPreferenceValues = [],
  tooltip,
}) => {
  const isDisabled = (value: string) => {
    if (!maxSelection) return false;
    if (noPreferenceValues.includes(value)) return false;
    return selectedValues.length >= maxSelection && !selectedValues.includes(value);
  };

  return (
    <fieldset>
      <legend className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
        {legend}
        {tooltip}
      </legend>
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <Button
                key={opt.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(opt.value)}
                disabled={isDisabled(opt.value)}
                className={cn(
                  'rounded-full text-xs px-3 py-1.5 transition-all flex items-center',
                  isSelected
                    ? activeColor
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                )}
              >
                {opt.icon && <opt.icon className="w-3.5 h-3.5 ltr:mr-1.5 rtl:ml-1.5" />}
                {opt.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {selectedValues.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{emptyText}</p>
          ) : (
            selectedValues.map((value) => {
              const option = options.find((opt) => opt.value === value);
              const label = option ? option.label : value;
              const Icon = option?.icon;
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className={cn(
                    'ltr:mr-1 rtl:ml-1 mb-1 text-xs px-2 py-0.5 rounded-full flex items-center',
                    badgeColor
                  )}
                >
                  {Icon && <Icon className="w-3 h-3 ltr:mr-1 rtl:ml-1" />}
                  {label}
                </Badge>
              );
            })
          )}
        </div>
      )}
    </fieldset>
  );
};

export default MultiSelectToggle;
