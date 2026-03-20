'use client';

import type { SFQuestion } from '../types';

interface Props {
  question: SFQuestion;
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function OpenTextQuestion({ question, value, onChange, t, isRTL }: Props) {
  const maxLen = question.maxCustomLength || 200;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLen) onChange(e.target.value);
        }}
        placeholder={question.placeholderKey ? t(question.placeholderKey) : ''}
        rows={4}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400"
      />
      <div className={`flex justify-end text-xs text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span>
          {value.length}/{maxLen} {t('labels.characters')}
        </span>
      </div>
    </div>
  );
}
