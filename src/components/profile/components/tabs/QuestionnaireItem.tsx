'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Quote, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import BudgetDisplay from '../../sections/BudgetDisplay';
import type { FormattedAnswer } from '@/types/next-auth';
import type {
  ProfileCardDisplayDict,
  BudgetDisplayDict,
} from '@/types/dictionary';

interface QuestionnaireItemProps {
  answer: FormattedAnswer;
  worldName: string;
  worldColor?: string;
  worldGradient?: string;
  compact?: boolean;
  direction: 'ltr' | 'rtl';
  displayDict: ProfileCardDisplayDict;
  budgetDisplayDict: BudgetDisplayDict;
  locale: string;
}

const QuestionnaireItem: React.FC<QuestionnaireItemProps> = ({
  answer,
  worldName,
  worldColor = 'rose',
  worldGradient,
  compact = false,
  direction,
  displayDict,
  budgetDisplayDict,
  locale,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300 hover:shadow-lg overflow-hidden',
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5',
        'bg-gradient-to-br from-white to-gray-50/30 max-w-full min-w-0',
        `border-${worldColor}-200 hover:border-${worldColor}-300`
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        <div
          className={cn(
            'flex-shrink-0 rounded-lg text-white shadow-md',
            compact ? 'p-2' : 'p-2 sm:p-3',
            worldGradient
              ? `bg-gradient-to-r ${worldGradient}`
              : `bg-gradient-to-r from-${worldColor}-400 to-${worldColor}-500`
          )}
        >
          <Quote
            className={cn(compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5')}
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4
            dir="auto"
            className={cn(
              'font-bold mb-2 sm:mb-3 text-gray-800 leading-relaxed',
              'flex items-center justify-between gap-2 text-start',
              compact ? 'text-sm' : 'text-sm sm:text-base'
            )}
          >
            <span className="flex-1 break-words hyphens-auto word-break-break-word min-w-0">
              {' '}
              {/* <-- min-w-0 הוא קריטי לפלקס */}
              <span className="sr-only">
                {displayDict.content.questionnaire.questionFromCategory.replace(
                  '{{worldName}}',
                  worldName
                )}{' '}
              </span>
              {answer.question}
            </span>
            {answer.isVisible === false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs cursor-default">
                      <Lock className="w-3 h-3" />
                      <span>
                        {displayDict.content.questionnaire.confidential}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      {displayDict.content.questionnaire.confidentialTooltip}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h4>
          <div
            className={cn(
              'rounded-lg bg-white/60 overflow-hidden',
              compact ? 'p-3' : 'p-3 sm:p-4',
              direction === 'rtl'
                ? `border-r-4 border-${worldColor}-400`
                : `border-l-4 border-${worldColor}-400`
            )}
          >
            {answer.questionType === 'budgetAllocation' &&
            typeof answer.rawValue === 'object' &&
            answer.rawValue &&
            !Array.isArray(answer.rawValue) ? (
              // --- START: התיקון ---
              (() => {
                // השרת מספק מחרוזת מתורגמת מראש ב-displayText.
                // אנו מפרקים אותה בחזרה לאובייקט שהמפתחות שלו כבר מתורגמים.
                const translatedData = answer.displayText.split(' | ').reduce(
                  (acc, item) => {
                    const parts = item.split(': ');
                    if (parts.length === 2) {
                      const label = parts[0].trim();
                      const value = parseInt(
                        parts[1].replace(/[^0-9]/g, ''),
                        10
                      );
                      if (label && !isNaN(value)) {
                        acc[label] = value;
                      }
                    }
                    return acc;
                  },
                  {} as Record<string, number>
                );

                return (
                  <BudgetDisplay
                    data={translatedData}
                    dict={budgetDisplayDict}
                    locale={locale}
                  />
                );
              })()
            ) : (
              // --- END: התיקון ---
              <p
                className={cn(
                  'text-gray-700 leading-relaxed italic break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
                  compact ? 'text-sm' : 'text-sm sm:text-base'
                )}
              >
                <Quote
                  className={cn(
                    'w-3 h-3 sm:w-4 sm:h-4 inline text-gray-400 flex-shrink-0',
                    direction === 'rtl' ? 'ml-1' : 'mr-1'
                  )}
                />
                {answer.displayText}
                <Quote
                  className={cn(
                    'w-3 h-3 sm:w-4 sm:h-4 inline text-gray-400 transform rotate-180 flex-shrink-0',
                    direction === 'rtl' ? 'mr-1' : 'ml-1'
                  )}
                />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireItem;
