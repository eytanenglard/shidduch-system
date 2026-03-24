'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SFQuestion, SFAnswers } from '@/components/soul-fingerprint/types';
import QuestionRenderer from '@/components/soul-fingerprint/components/QuestionRenderer';

interface Props {
  question: SFQuestion;
  answers: SFAnswers;
  onAnswer: (questionId: string, value: string | string[] | number | null) => void;
  t: (key: string) => string;
  isRTL: boolean;
  isActive: boolean;
  isAnswered: boolean;
  onActivate: () => void;
  onAutoAdvance: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function AccordionQuestion({
  question,
  answers,
  onAnswer,
  t,
  isRTL,
  isActive,
  isAnswered,
  onActivate,
  onAutoAdvance,
  questionNumber,
  totalQuestions,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isActive, answers[question.id]]);

  // Auto-advance for singleChoice after selection
  const handleAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      onAnswer(questionId, value);

      // Clear any pending auto-advance
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }

      // Auto-advance only for singleChoice (not custom input)
      if (question.type === 'singleChoice' && value && !questionId.endsWith('_custom')) {
        const selectedOption = question.options?.find(opt => opt.value === value);
        // Don't auto-advance if the option has a custom input field
        if (!selectedOption?.isCustomInput) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            onAutoAdvance();
          }, 500);
        }
      }
    },
    [onAnswer, onAutoAdvance, question]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Show done button for multiSelect when at least one option is selected
  useEffect(() => {
    if (question.type === 'multiSelect' && isActive) {
      const val = answers[question.id];
      setShowDoneButton(Array.isArray(val) && val.length > 0);
    }
  }, [question.type, question.id, answers, isActive]);

  // Get answer summary for collapsed state
  const getAnswerSummary = (): string => {
    const val = answers[question.id];
    if (val === null || val === undefined || val === '') return '';

    switch (question.type) {
      case 'singleChoice': {
        const opt = question.options?.find(o => o.value === val);
        if (opt) {
          const label = t(opt.labelKey);
          const customKey = `${question.id}_custom`;
          const customVal = answers[customKey] as string;
          if (opt.isCustomInput && customVal) {
            return `${label}: ${customVal}`;
          }
          return label;
        }
        return String(val);
      }
      case 'multiSelect': {
        if (!Array.isArray(val) || val.length === 0) return '';
        if (val.length <= 2) {
          return val
            .map(v => {
              const opt = question.options?.find(o => o.value === v);
              return opt ? t(opt.labelKey) : v;
            })
            .join(', ');
        }
        const firstTwo = val.slice(0, 2).map(v => {
          const opt = question.options?.find(o => o.value === v);
          return opt ? t(opt.labelKey) : v;
        });
        return `${firstTwo.join(', ')} +${val.length - 2}`;
      }
      case 'openText': {
        const text = String(val);
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
      }
      case 'slider': {
        const leftLabel = question.sliderLeftKey ? t(question.sliderLeftKey) : '';
        const rightLabel = question.sliderRightKey ? t(question.sliderRightKey) : '';
        if (leftLabel && rightLabel) {
          return `${val} — ${leftLabel} ↔ ${rightLabel}`;
        }
        return String(val);
      }
      default:
        return String(val);
    }
  };

  const summary = getAnswerSummary();

  return (
    <div
      ref={containerRef}
      id={`sf-question-${question.id}`}
      className={`
        rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${isActive
          ? 'border-teal-200 bg-white shadow-md'
          : isAnswered
            ? 'border-gray-100 bg-gray-50/80 hover:border-teal-100 cursor-pointer'
            : 'border-gray-200 bg-white hover:border-teal-100 cursor-pointer'
        }
      `}
    >
      {/* Header - always visible */}
      <button
        onClick={() => {
          if (!isActive) onActivate();
        }}
        className={`
          w-full flex items-center gap-3 p-4 transition-colors
          ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
          ${!isActive ? 'hover:bg-gray-50/50' : ''}
        `}
        disabled={isActive}
        type="button"
      >
        {/* Question number / check indicator */}
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300
            ${isAnswered && !isActive
              ? 'bg-teal-500 text-white'
              : isActive
                ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-300'
                : 'bg-gray-100 text-gray-400'
            }
          `}
        >
          {isAnswered && !isActive ? (
            <Check className="w-4 h-4" />
          ) : (
            questionNumber
          )}
        </div>

        {/* Question text + summary */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              text-sm font-semibold transition-colors duration-200 leading-snug
              ${isActive ? 'text-gray-800' : isAnswered ? 'text-gray-600' : 'text-gray-700'}
            `}
          >
            {t(question.textKey)}
            {question.isOptional && !isActive && (
              <span className="text-xs font-normal text-gray-400 mx-1">({t('labels.optional')})</span>
            )}
          </h3>
          {/* Show answer summary when collapsed and answered */}
          {!isActive && isAnswered && summary && (
            <p className="text-xs text-teal-600 mt-0.5 truncate">{summary}</p>
          )}
        </div>

        {/* Expand/collapse chevron */}
        <ChevronDown
          className={`
            w-5 h-5 flex-shrink-0 transition-transform duration-300
            ${isActive ? 'rotate-180 text-teal-500' : 'text-gray-400'}
          `}
        />
      </button>

      {/* Collapsible content */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isActive ? `${contentHeight + 80}px` : '0px',
          opacity: isActive ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {/* Subtitle */}
          {question.subtitleKey && (
            <p className={`text-xs text-gray-500 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t(question.subtitleKey)}
            </p>
          )}

          {/* Question body */}
          <QuestionRenderer
            question={{ ...question, subtitleKey: undefined }}
            answers={answers}
            onAnswer={handleAnswer}
            t={t}
            isRTL={isRTL}
          />

          {/* "Done" button for multiSelect */}
          {question.type === 'multiSelect' && showDoneButton && (
            <button
              onClick={onAutoAdvance}
              className={`
                mt-3 w-full py-2 rounded-xl text-sm font-medium
                bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200
                transition-all duration-200
              `}
              type="button"
            >
              {t('labels.done')}
            </button>
          )}

          {/* "Done" button for openText when has content */}
          {question.type === 'openText' && answers[question.id] && String(answers[question.id]).length > 0 && (
            <button
              onClick={onAutoAdvance}
              className={`
                mt-3 w-full py-2 rounded-xl text-sm font-medium
                bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200
                transition-all duration-200
              `}
              type="button"
            >
              {t('labels.done')}
            </button>
          )}

          {/* "Done" button for slider */}
          {question.type === 'slider' && (
            <button
              onClick={onAutoAdvance}
              className={`
                mt-3 w-full py-2 rounded-xl text-sm font-medium
                bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200
                transition-all duration-200
              `}
              type="button"
            >
              {t('labels.done')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
