'use client';

import type { SFQuestion } from '../types';

interface Props {
  question: SFQuestion;
  value: number;
  onChange: (value: number) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function SliderQuestion({ question, value, onChange, t, isRTL }: Props) {
  const min = question.sliderMin ?? 0;
  const max = question.sliderMax ?? 100;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4 px-2">
      <div className="relative pt-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
          style={{
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        />
        <div
          className="absolute -top-6 transform -translate-x-1/2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full"
          style={{ left: isRTL ? `${100 - pct}%` : `${pct}%` }}
        >
          {value}
        </div>
      </div>
      <div className={`flex justify-between text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span>{question.sliderLeftKey && t(question.sliderLeftKey)}</span>
        <span>{question.sliderRightKey && t(question.sliderRightKey)}</span>
      </div>
    </div>
  );
}
