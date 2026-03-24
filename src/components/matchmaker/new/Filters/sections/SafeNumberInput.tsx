'use client';

import React, { useState, useEffect } from 'react';

export interface SafeNumberInputProps {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  className?: string;
}

const SafeNumberInput: React.FC<SafeNumberInputProps> = ({
  value,
  min,
  max,
  onCommit,
  className,
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleCommit = () => {
    let num = parseInt(localValue);

    // Validation
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;

    setLocalValue(num.toString());
    onCommit(num);
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
};

export default SafeNumberInput;
