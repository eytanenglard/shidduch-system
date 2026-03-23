'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface InputFieldProps {
  id: string;
  label: string;
  value: string | number | undefined | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  emptyText?: React.ReactNode;
  displayValue?: React.ReactNode;
  min?: string | number;
  max?: string | number;
  maxLength?: number;
  disabled?: boolean;
  labelClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  isEditing,
  onChange,
  type = 'text',
  placeholder,
  emptyText,
  displayValue: customDisplayValue,
  min,
  max,
  maxLength,
  disabled,
  labelClassName = 'block mb-1 text-xs font-medium text-gray-600',
}) => {
  const displayValue = () => {
    if (customDisplayValue !== undefined) return customDisplayValue;
    if (value === null || value === undefined || value === '') {
      return emptyText || <span className="italic text-gray-500">{placeholder}</span>;
    }
    return String(value);
  };

  return (
    <div>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {isEditing ? (
        <Input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-sm focus:ring-cyan-500"
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
          disabled={disabled}
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium mt-0.5">{displayValue()}</p>
      )}
    </div>
  );
};

export default InputField;
