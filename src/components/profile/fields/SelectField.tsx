'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectFieldProps {
  id: string;
  label: React.ReactNode;
  value: string | undefined | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  direction?: 'rtl' | 'ltr';
  emptyText?: React.ReactNode;
  maxHeight?: string;
  labelClassName?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  options,
  placeholder,
  isEditing,
  onChange,
  direction,
  emptyText,
  maxHeight = '250px',
  labelClassName = 'block mb-1 text-xs font-medium text-gray-600',
}) => {
  const displayValue = () => {
    if (!value) {
      return emptyText || <span className="italic text-gray-500">{placeholder}</span>;
    }
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : <span className="italic text-gray-500">{value}</span>;
  };

  return (
    <div>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {isEditing ? (
        <Select
          dir={direction}
          value={value || ''}
          onValueChange={onChange}
        >
          <SelectTrigger id={id} className="h-9 text-sm focus:ring-cyan-500 text-start">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={`max-h-[${maxHeight}]`}>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-gray-800 font-medium mt-0.5">{displayValue()}</p>
      )}
    </div>
  );
};

export default SelectField;
