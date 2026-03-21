'use client';

import type { SFQuestion, SFAnswers } from '../types';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import SliderQuestion from './SliderQuestion';
import OpenTextQuestion from './OpenTextQuestion';

interface Props {
  question: SFQuestion;
  answers: SFAnswers;
  onAnswer: (questionId: string, value: string | string[] | number | null) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function QuestionRenderer({ question, answers, onAnswer, t, isRTL }: Props) {
  const currentValue = answers[question.id];
  const customKey = `${question.id}_custom`;
  const customValue = (answers[customKey] as string) || '';
  const isUnanswered = !question.isOptional && (currentValue === null || currentValue === undefined || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0));

  return (
    <div className="space-y-4">
      {/* Question header */}
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-lg font-semibold text-gray-800">
          {t(question.textKey)}
          {question.isOptional && (
            <span className="text-xs font-normal text-gray-400 mx-2">({t('labels.optional')})</span>
          )}
          {isUnanswered && !question.isOptional && (
            <span className="text-red-400 mx-1">*</span>
          )}
        </h3>
        {question.subtitleKey && (
          <p className="text-sm text-gray-500 mt-1">{t(question.subtitleKey)}</p>
        )}
      </div>

      {/* Question body */}
      {question.type === 'singleChoice' && (
        <SingleChoiceQuestion
          question={question}
          value={(currentValue as string) || null}
          onChange={(val) => onAnswer(question.id, val)}
          customValue={customValue}
          onCustomChange={(val) => onAnswer(customKey, val)}
          t={t}
          isRTL={isRTL}
        />
      )}
      {question.type === 'multiSelect' && (
        <MultiSelectQuestion
          question={question}
          value={(currentValue as string[]) || []}
          onChange={(val) => onAnswer(question.id, val)}
          customValue={customValue}
          onCustomChange={(val) => onAnswer(customKey, val)}
          t={t}
          isRTL={isRTL}
        />
      )}
      {question.type === 'slider' && (
        <SliderQuestion
          question={question}
          value={(currentValue as number) ?? 50}
          onChange={(val) => onAnswer(question.id, val)}
          t={t}
          isRTL={isRTL}
        />
      )}
      {question.type === 'openText' && (
        <OpenTextQuestion
          question={question}
          value={(currentValue as string) || ''}
          onChange={(val) => onAnswer(question.id, val)}
          t={t}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}
