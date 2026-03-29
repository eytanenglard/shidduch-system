'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only sync from parent if input is not focused (avoid overriding user typing)
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value?.toString() || '');
    }
  }, [value]);

  const handleCommit = () => {
    let num = parseInt(localValue);

    if (isNaN(num)) num = value;
    if (num < min) num = min;
    if (num > max) num = max;

    setLocalValue(num.toString());
    onCommit(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length <= 3) {
      setLocalValue(raw);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
      return;
    }

    // Allow: backspace, delete, tab, arrows, home, end
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;

    // Allow select all (Ctrl+A / Cmd+A)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') return;

    // Block non-digit keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={handleChange}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      onFocus={(e) => e.target.select()}
      className={className}
    />
  );
};

export default SafeNumberInput;
