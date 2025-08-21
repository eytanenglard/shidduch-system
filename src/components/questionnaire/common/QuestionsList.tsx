// src/components/questionnaire/common/QuestionsList.tsx
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Question,
  QuestionnaireAnswer,
  AnswerValue,
} from '../types/types';
import { Badge } from '@/components/ui/badge';
import type { QuestionsListDict } from '@/types/dictionary'; // Import dictionary type

interface QuestionsListProps {
  allQuestions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: QuestionnaireAnswer[];
  language?: string;
  className?: string;
  onClose?: () => void;
  themeColor?: 'sky' | 'rose' | 'purple' | 'teal' | 'amber';
  dict: QuestionsListDict; // Use the specific dictionary type
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  allQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  language = 'he',
  className = '',
  onClose,
  themeColor = 'sky',
  dict,
}) => {
  const isRTL = language === 'he';

  const findAnswer = (questionId: string): AnswerValue | undefined => {
    return answers.find((a) => a.questionId === questionId)?.value;
  };

  const isAnswerNotEmpty = (answer: AnswerValue | undefined): boolean => {
    if (answer === undefined || answer === null) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (
      typeof answer === 'object' &&
      !Array.isArray(answer) &&
      Object.keys(answer).length === 0
    )
      return false;
    return true;
  };

  const handleItemClick = (index: number) => {
    setCurrentQuestionIndex(index);
    onClose?.();
  };

  const themeClasses = {
    text: `text-${themeColor}-700`,
    bgSoft: `bg-${themeColor}-50`,
    border: `border-${themeColor}-300`,
    ring: `ring-${themeColor}-400`,
    icon: `text-${themeColor}-600`,
  };

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="relative space-y-2 p-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-200"
          style={isRTL ? { right: '1.625rem' } : { left: '1.625rem' }}
        ></div>

        {allQuestions.map((q, index) => {
          const answer = findAnswer(q.id);
          const isAnswered = isAnswerNotEmpty(answer);
          const isCurrent = index === currentQuestionIndex;

          let StatusIcon;
          let itemClasses = 'bg-white hover:bg-slate-50 border-slate-200';
          let textClasses = 'text-slate-700';

          if (isAnswered) {
            StatusIcon = (
              <CheckCircle className={cn('h-5 w-5', themeClasses.icon)} />
            );
          } else if (q.isRequired) {
            StatusIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
          } else {
            StatusIcon = <Circle className="h-5 w-5 text-slate-300" />;
          }

          if (isCurrent) {
            StatusIcon = (
              <Sparkles className={cn('h-5 w-5', themeClasses.icon)} />
            );
            itemClasses = `${themeClasses.bgSoft} ${themeClasses.border} ring-2 ${themeClasses.ring}`;
            textClasses = `${themeClasses.text} font-semibold`;
          }

          return (
            <button
              key={q.id}
              type="button"
              className={cn(
                'relative w-full flex items-start text-start p-3 rounded-lg transition-all duration-200 border shadow-sm group',
                itemClasses
              )}
              onClick={() => handleItemClick(index)}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex-shrink-0 z-10 bg-white rounded-full p-1">
                {StatusIcon}
              </div>

              <div className={cn('flex-1 min-w-0 ml-3', textClasses)}>
                <p
                  className="text-sm leading-relaxed"
                  style={{ whiteSpace: 'normal' }}
                >
                  <span className="font-medium">{index + 1}. </span>
                  {q.question}
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-normal bg-white"
                  >
                    {dict.depthLabels[q.depth]}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default QuestionsList;
