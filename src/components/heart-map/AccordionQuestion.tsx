'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, SkipForward } from 'lucide-react';
import type { SFQuestion, SFAnswers } from '@/components/soul-fingerprint/types';
import QuestionRenderer from '@/components/soul-fingerprint/components/QuestionRenderer';

interface Props {
  question: SFQuestion;
  answers: SFAnswers;
  onAnswer: (questionId: string, value: string | string[] | number | null) => void;
  t: (key: string) => string;
  translateTag?: (tag: string) => string;
  isRTL: boolean;
  isActive: boolean;
  isAnswered: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onAutoAdvance: () => void;
  questionNumber: number;
  totalQuestions: number;
  highlightUnanswered?: boolean;
}

export default function AccordionQuestion({
  question,
  answers,
  onAnswer,
  t,
  translateTag,
  isRTL,
  isActive,
  isAnswered,
  onActivate,
  onDeactivate,
  onAutoAdvance,
  questionNumber,
  totalQuestions,
  highlightUnanswered = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance after answer selection (type-specific)
  const handleAnswer = useCallback(
    (questionId: string, value: string | string[] | number | null) => {
      onAnswer(questionId, value);

      // Clear any pending auto-advance
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }

      // singleChoice: auto-advance after 500ms (unless custom input)
      if (question.type === 'singleChoice' && value && !questionId.endsWith('_custom')) {
        const selectedOption = question.options?.find(opt => opt.value === value);
        if (!selectedOption?.isCustomInput) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            onAutoAdvance();
          }, 500);
        }
      }

      // multiSelect: auto-advance only when maxSelections reached
      if (question.type === 'multiSelect' && Array.isArray(value)) {
        if (question.maxSelections && value.length >= question.maxSelections) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            onAutoAdvance();
          }, 800);
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

  // Translate a raw value — try t(labelKey) first, then translateTag fallback
  const translateValue = (v: string): string => {
    if (translateTag) return translateTag(v);
    return v;
  };

  // Get answer chips/summary for collapsed state
  const getAnswerChips = (): { type: 'chips'; labels: string[] } | { type: 'text'; text: string } | null => {
    const val = answers[question.id];
    if (val === null || val === undefined || val === '') return null;

    switch (question.type) {
      case 'singleChoice': {
        const opt = question.options?.find(o => o.value === val);
        if (opt) {
          const label = t(opt.labelKey);
          const customKey = `${question.id}_custom`;
          const customVal = answers[customKey] as string;
          if (opt.isCustomInput && customVal) {
            return { type: 'chips', labels: [`${label}: ${customVal}`] };
          }
          return { type: 'chips', labels: [label] };
        }
        return { type: 'chips', labels: [translateValue(String(val))] };
      }
      case 'multiSelect': {
        if (!Array.isArray(val) || val.length === 0) return null;
        const labels = val.map(v => {
          const opt = question.options?.find(o => o.value === v);
          return opt ? t(opt.labelKey) : translateValue(v);
        });
        return { type: 'chips', labels };
      }
      case 'openText': {
        const text = String(val);
        return { type: 'text', text: text.length > 40 ? text.slice(0, 40) + '...' : text };
      }
      case 'slider': {
        const leftLabel = question.sliderLeftKey ? t(question.sliderLeftKey) : '';
        const rightLabel = question.sliderRightKey ? t(question.sliderRightKey) : '';
        if (leftLabel && rightLabel) {
          return { type: 'text', text: `${val} — ${leftLabel} ↔ ${rightLabel}` };
        }
        return { type: 'text', text: String(val) };
      }
      default:
        return { type: 'text', text: String(val) };
    }
  };

  const answerDisplay = getAnswerChips();

  // Determine if this unanswered required question should be highlighted
  const showValidationHighlight = highlightUnanswered && !isAnswered && !question.isOptional;

  // Keyboard handler for the accordion
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isActive) onDeactivate();
          else onActivate();
          break;
        case 'Escape':
          if (isActive) {
            e.preventDefault();
            onDeactivate();
          }
          break;
      }
    },
    [isActive, onActivate, onDeactivate]
  );

  return (
    <div
      ref={containerRef}
      id={`sf-question-${question.id}`}
      className={`
        rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${isActive
          ? 'border-teal-200 bg-white shadow-md'
          : showValidationHighlight
            ? 'border-red-300 bg-red-50/30 animate-[shake_0.4s_ease-in-out] cursor-pointer'
            : isAnswered
              ? 'border-gray-100 bg-gray-50/80 hover:border-teal-100 cursor-pointer'
              : 'border-gray-200 bg-white hover:border-teal-100 cursor-pointer'
        }
      `}
    >
      {/* Header - always visible */}
      <button
        onClick={() => {
          if (isActive) onDeactivate();
          else onActivate();
        }}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center gap-3 p-4 transition-colors
          ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
          hover:bg-gray-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset rounded-2xl
        `}
        type="button"
        aria-expanded={isActive}
        aria-controls={`sf-content-${question.id}`}
      >
        {/* Question number / check indicator */}
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300
            ${isAnswered && !isActive
              ? 'bg-teal-500 text-white'
              : isActive
                ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-300'
                : showValidationHighlight
                  ? 'bg-red-100 text-red-500 ring-2 ring-red-300'
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
              ${isActive ? 'text-gray-800' : showValidationHighlight ? 'text-red-600' : isAnswered ? 'text-gray-600' : 'text-gray-700'}
            `}
          >
            {t(question.textKey)}
            {question.isOptional && !isActive && (
              <span className="text-xs font-normal text-gray-400 mx-1">({t('labels.optional')})</span>
            )}
          </h3>
          {/* Show answer chips/summary when collapsed and answered */}
          {!isActive && isAnswered && answerDisplay && (
            answerDisplay.type === 'chips' ? (
              <div className={`flex flex-wrap gap-1 mt-1 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {answerDisplay.labels.slice(0, 3).map((label, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 max-w-[140px] truncate"
                  >
                    {label}
                  </span>
                ))}
                {answerDisplay.labels.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-600">
                    +{answerDisplay.labels.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-teal-600 mt-0.5 truncate">{answerDisplay.text}</p>
            )
          )}
          {/* Validation hint when highlighted */}
          {showValidationHighlight && !isActive && (
            <p className="text-[11px] text-red-500 mt-0.5">{t('labels.requiredQuestion')}</p>
          )}
        </div>

        {/* Expand/collapse chevron */}
        <ChevronDown
          className={`
            w-5 h-5 flex-shrink-0 transition-transform duration-300
            ${isActive ? 'rotate-180 text-teal-500' : showValidationHighlight ? 'text-red-400' : 'text-gray-400'}
          `}
        />
      </button>

      {/* Collapsible content - CSS grid animation for smooth expand/collapse */}
      <div
        id={`sf-content-${question.id}`}
        role="region"
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
        style={{
          gridTemplateRows: isActive ? '1fr' : '0fr',
          opacity: isActive ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
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

            {/* Action buttons row */}
            <div className="flex gap-2 mt-3">
              {/* Skip button for optional questions */}
              {question.isOptional && (
                <button
                  onClick={onAutoAdvance}
                  className={`
                    flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-medium
                    bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200
                    transition-all duration-200
                    ${isRTL ? 'flex-row-reverse' : ''}
                  `}
                  type="button"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  {t('labels.skip')}
                </button>
              )}

              {/* "Done" button for multiSelect */}
              {question.type === 'multiSelect' && showDoneButton && (
                <button
                  onClick={onAutoAdvance}
                  className={`
                    flex-1 py-2 rounded-xl text-sm font-medium
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
                    flex-1 py-2 rounded-xl text-sm font-medium
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
                    flex-1 py-2 rounded-xl text-sm font-medium
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
      </div>
    </div>
  );
}
