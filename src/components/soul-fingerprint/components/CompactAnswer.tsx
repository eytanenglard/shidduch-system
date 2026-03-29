'use client';

import { motion } from 'framer-motion';
import type { SFQuestion } from '../types';

interface CompactAnswerProps {
  question: SFQuestion;
  answer: string | string[] | number | null;
  onExpand: () => void;
  t: (key: string) => string;
  translateTag?: (tag: string) => string;
  isRTL: boolean;
}

function getAnswerPreview(
  question: SFQuestion,
  answer: string | string[] | number | null,
  t: (key: string) => string,
  translateTag?: (tag: string) => string
): string {
  if (answer === null || answer === undefined || answer === '') return '';

  const fallback = (v: string) => translateTag ? translateTag(v) : v;

  switch (question.type) {
    case 'singleChoice': {
      const opt = question.options?.find((o) => o.value === answer);
      return opt ? t(opt.labelKey) : fallback(String(answer));
    }
    case 'multiSelect': {
      if (!Array.isArray(answer)) return fallback(String(answer));
      return answer
        .map((v) => {
          const opt = question.options?.find((o) => o.value === v);
          return opt ? t(opt.labelKey) : fallback(v);
        })
        .join(', ');
    }
    case 'slider': {
      const min = question.sliderMin ?? 0;
      const max = question.sliderMax ?? 100;
      const leftLabel = question.sliderLeftKey ? t(question.sliderLeftKey) : '';
      const rightLabel = question.sliderRightKey ? t(question.sliderRightKey) : '';
      if (leftLabel && rightLabel) {
        const ratio = ((answer as number) - min) / (max - min);
        if (ratio <= 0.33) return leftLabel;
        if (ratio >= 0.67) return rightLabel;
        return `${leftLabel} ↔ ${rightLabel}`;
      }
      return `${answer}/${max}`;
    }
    case 'openText': {
      const text = String(answer);
      return text.length > 60 ? text.slice(0, 57) + '...' : text;
    }
    default:
      return String(answer);
  }
}

export default function CompactAnswer({
  question,
  answer,
  onExpand,
  t,
  translateTag,
  isRTL,
}: CompactAnswerProps) {
  const preview = getAnswerPreview(question, answer, t, translateTag);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onExpand}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border-2 border-teal-100 hover:border-teal-300 transition-all duration-200 group text-right"
    >
      {/* Checkmark */}
      <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Question + Answer */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate">{t(question.textKey)}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{preview}</p>
      </div>

      {/* Edit icon */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>
    </motion.button>
  );
}
