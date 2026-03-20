'use client';

import type { SFQuestion, SFAnswers } from '../types';

interface Props {
  question: SFQuestion;
  value: string | null;
  onChange: (value: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function SingleChoiceQuestion({ question, value, onChange, t, isRTL }: Props) {
  return (
    <div className="space-y-2">
      {question.options?.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200
              ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
              ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50'
              }
            `}
          >
            {opt.icon && <span className="text-xl flex-shrink-0">{opt.icon}</span>}
            <div className="flex-1 min-w-0">
              <span className={`block text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}>
                {t(opt.labelKey)}
              </span>
              {opt.subtitleKey && (
                <span className="block text-xs text-gray-500 mt-0.5">{t(opt.subtitleKey)}</span>
              )}
            </div>
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}
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
  );
}
