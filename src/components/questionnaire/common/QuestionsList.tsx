// src/components/questionnaire/common/QuestionsList.tsx
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, CircleDot, ChevronLeft } from 'lucide-react'; // הוספנו חץ שמאלה
import { cn } from '@/lib/utils';
import type {
  Question,
  QuestionnaireAnswer,
  AnswerValue,
} from '../types/types';
import { Badge } from '@/components/ui/badge'; // נוסיף Badge לרמת הקושי

interface QuestionsListProps {
  allQuestions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: QuestionnaireAnswer[];
  language?: string;
  className?: string;
  onClose?: () => void; // פונקציה לסגירת הרשימה (שימושי במובייל)
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  allQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  language = 'he',
  className = '',
  onClose, // קבלת הפונקציה
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

  // פונקציה לטיפול בלחיצה על פריט ברשימה
  const handleItemClick = (index: number) => {
    setCurrentQuestionIndex(index);
    onClose?.(); // קורא לפונקציית הסגירה אם היא קיימת (רלוונטי בעיקר למובייל)
  };

  // הגדרת צבעים ותוויות לרמות קושי
  const depthBadgeColors = {
    BASIC: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    ADVANCED: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    EXPERT: 'bg-green-100 text-green-700 hover:bg-green-200',
  };
  const depthLabels = { BASIC: 'בסיסי', ADVANCED: 'מתקדם', EXPERT: 'מעמיק' };

  return (
    // התיקון כאן: הסרנו את הגובה הקבוע והשארנו רק h-full
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-2 p-1" dir={isRTL ? 'rtl' : 'ltr'}>
        {' '}
        {/* הוספנו dir */}
        {allQuestions.map((q, index) => {
          const answer = findAnswer(q.id);
          const isAnswered = isAnswerNotEmpty(answer);
          const isCurrent = index === currentQuestionIndex;

          let StatusIcon = <CircleDot className="h-4 w-4 text-gray-400" />; // אייקון ברירת מחדל
          let statusColorClass =
            'border-gray-200 hover:bg-gray-100 hover:border-gray-300'; // ברירת מחדל
          let textColorClass = 'text-gray-700';

          if (isAnswered) {
            StatusIcon = <CheckCircle className="h-4 w-4 text-green-600" />;
            statusColorClass =
              'border-green-300 bg-green-50/60 hover:bg-green-100 hover:border-green-400';
            textColorClass = 'text-gray-800'; // טקסט רגיל, לא ירוק
          } else if (q.isRequired) {
            StatusIcon = <AlertCircle className="h-4 w-4 text-red-600" />;
            statusColorClass =
              'border-red-300 bg-red-50/60 hover:bg-red-100 hover:border-red-400';
            textColorClass = 'text-gray-800'; // טקסט רגיל, לא אדום
          }

          if (isCurrent) {
            statusColorClass =
              'bg-blue-100 border-blue-400 ring-2 ring-blue-500 ring-offset-1'; // טבעת בולטת
            textColorClass = 'text-blue-900 font-semibold'; // טקסט כחול כהה ומודגש
          }

          return (
            <button
              key={q.id}
              type="button"
              className={cn(
                'w-full flex items-center justify-between text-start p-3 rounded-lg transition-all duration-150 border shadow-sm group', // שימוש ב-flex ו-justify-between
                statusColorClass
              )}
              onClick={() => handleItemClick(index)}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* תוכן ראשי - אייקון סטטוס, מספר וטקסט שאלה */}
              <div
                className={cn(
                  'flex items-start gap-3 flex-1 min-w-0',
                  textColorClass
                )}
              >
                {' '}
                {/* שימוש ב-gap */}
                <div className="flex-shrink-0 pt-0.5">{StatusIcon}</div>
                <div className="flex-1">
                  <span
                    className={cn('font-medium', isCurrent ? 'font-bold' : '')}
                  >
                    {index + 1}.
                  </span>
                  <span
                    className="ms-1.5 text-sm leading-relaxed"
                    style={{ whiteSpace: 'normal' }}
                  >
                    {' '}
                    {/* שימוש ב-ms (margin-start) שמתאים ל-RTL/LTR */}
                    {q.question}
                  </span>
                  {/* הצגת תגית רמת קושי מתחת לשאלה */}
                  <div className="mt-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full font-normal border', // גבול דק
                        depthBadgeColors[q.depth]
                      )}
                    >
                      {depthLabels[q.depth]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* חץ המצביע על הפריט הנוכחי (מופיע רק בפריט הנוכחי) */}
              {isCurrent && (
                <ChevronLeft
                  className={cn(
                    'h-5 w-5 text-blue-600 flex-shrink-0 transform transition-transform',
                    isRTL ? 'rotate-180' : '' // היפוך החץ ב-RTL
                  )}
                />
              )}
              {/* אייקון חץ כללי להצביע על אפשרות לחיצה (אופציונלי) */}
              {!isCurrent && (
                <ChevronLeft
                  className={cn(
                    'h-5 w-5 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', // מופיע ב-hover
                    isRTL ? 'rotate-180' : ''
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default QuestionsList;
