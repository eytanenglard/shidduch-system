'use client';

import { useCallback, useId } from 'react';
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
  const step = question.sliderStep ?? 1;
  const pct = ((value - min) / (max - min)) * 100;
  const sliderId = useId();

  const leftLabel = question.sliderLeftKey ? t(question.sliderLeftKey) : '';
  const rightLabel = question.sliderRightKey ? t(question.sliderRightKey) : '';

  // Build descriptive aria-valuetext
  const getValueText = useCallback(() => {
    if (!leftLabel || !rightLabel) return String(value);
    if (pct <= 25) return `${value} — ${isRTL ? rightLabel : leftLabel}`;
    if (pct >= 75) return `${value} — ${isRTL ? leftLabel : rightLabel}`;
    return `${value}`;
  }, [value, pct, leftLabel, rightLabel, isRTL]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  return (
    <div className="space-y-3 px-1">
      {/* Floating value badge */}
      <div className="relative h-8">
        <div
          className="absolute transform -translate-x-1/2 transition-all duration-150 ease-out"
          style={{ [isRTL ? 'right' : 'left']: `${pct}%` }}
        >
          <div className="bg-teal-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md min-w-[2.5rem] text-center">
            {value}
          </div>
          {/* Arrow pointing down */}
          <div className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-teal-500" />
        </div>
      </div>

      {/* Custom slider track */}
      <div className="relative h-10 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2.5 bg-gray-200 rounded-full" />
        {/* Track filled portion */}
        <div
          className="absolute h-2.5 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-150 ease-out"
          style={{
            [isRTL ? 'right' : 'left']: '0%',
            width: `${pct}%`,
          }}
        />
        {/* Native range input — invisible but interactive */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-valuetext={getValueText()}
          aria-label={question.textKey ? t(question.textKey) : undefined}
          className="relative w-full h-10 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-teal-500
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-125
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-teal-500
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-solid
            [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-moz-range-track]:bg-transparent
            focus:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-teal-300"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        />
      </div>

      {/* Labels */}
      <div className={`flex justify-between text-xs font-medium text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className={pct <= 25 ? 'text-teal-600 font-semibold' : ''}>{leftLabel}</span>
        <span className={pct >= 75 ? 'text-teal-600 font-semibold' : ''}>{rightLabel}</span>
      </div>
    </div>
  );
}
