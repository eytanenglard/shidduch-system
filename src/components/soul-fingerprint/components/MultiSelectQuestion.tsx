'use client';

import { useCallback } from 'react';
import type { SFQuestion } from '../types';

interface Props {
  question: SFQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function MultiSelectQuestion({ question, value, onChange, t, isRTL }: Props) {
  const maxSelections = question.maxSelections || 99;

  const handleToggle = useCallback(
    (optValue: string) => {
      // "doesnt_matter" clears everything else
      if (optValue === 'doesnt_matter') {
        onChange(['doesnt_matter']);
        return;
      }
      // If selecting something else while doesnt_matter is selected, remove it
      const current = value.filter((v) => v !== 'doesnt_matter');
      if (current.includes(optValue)) {
        onChange(current.filter((v) => v !== optValue));
      } else if (current.length < maxSelections) {
        onChange([...current, optValue]);
      }
    },
    [value, onChange, maxSelections]
  );

  return (
    <div className="space-y-2">
      {question.maxSelections && (
        <p className="text-xs text-gray-500 mb-2">
          {t('labels.selectUpTo').replace('{{count}}', String(question.maxSelections))}
          {' '} ({value.length}/{question.maxSelections})
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options?.map((opt) => {
          const isSelected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              disabled={!isSelected && value.length >= maxSelections && !value.includes('doesnt_matter')}
              className={`
                flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
                ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                }
              `}
            >
              {opt.icon && <span className="text-lg flex-shrink-0">{opt.icon}</span>}
              <span className={`flex-1 text-sm ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
                {t(opt.labelKey)}
              </span>
              <div
                className={`
                  w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2
                  ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}
                `}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
