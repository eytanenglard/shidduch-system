'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LANGUAGE_OPTIONS } from './filterConstants';

interface LanguageMultiSelectProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  dict: any;
}

const LanguageMultiSelect: React.FC<LanguageMultiSelectProps> = ({
  selectedValues = [],
  onChange,
  dict,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleValue = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const filteredOptions = LANGUAGE_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50 space-y-2">
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder={dict.placeholders?.searchLanguage || 'חפש שפה...'}
          className="pr-9 bg-white border-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="h-48 rounded-md border border-gray-100 bg-white p-2">
        <div className="space-y-1">
          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleValue(option.value)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm',
                  isSelected
                    ? 'bg-teal-50 text-teal-900'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleValue(option.value)}
                  className="data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <span className="flex-1">{option.label}</span>
              </div>
            );
          })}
          {filteredOptions.length === 0 && (
            <p className="text-center text-xs text-gray-500 py-4">
              לא נמצאו תוצאות
            </p>
          )}
        </div>
      </ScrollArea>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedValues.map((val) => {
            const label = LANGUAGE_OPTIONS.find((o) => o.value === val)?.label;
            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-xs bg-teal-100 text-teal-800 hover:bg-teal-200"
              >
                {label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(val);
                  }}
                  className="mr-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            );
          })}
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-500 underline mr-auto hover:text-gray-800"
          >
            נקה הכל
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageMultiSelect;
