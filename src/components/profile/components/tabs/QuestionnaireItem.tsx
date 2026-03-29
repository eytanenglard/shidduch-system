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
import { WORLD_COLORS } from '../../constants/theme';
import type { FormattedAnswer } from '@/types/next-auth';
import type {
  ProfileCardDisplayDict,
  BudgetDisplayDict,
} from '@/types/dictionary';

interface QuestionnaireItemProps {
  answer: FormattedAnswer;
  worldName: string;
  worldColor?: string;
  worldGradient?: string; // Legacy, ignored
  compact?: boolean;
  direction: 'ltr' | 'rtl';
  displayDict: ProfileCardDisplayDict;
  budgetDisplayDict: BudgetDisplayDict;
  locale: string;
}

const QuestionnaireItem: React.FC<QuestionnaireItemProps> = ({
  answer,
  worldName,
  worldColor = 'gray',
  direction,
  displayDict,
  budgetDisplayDict,
  locale,
}) => {
  const colors = WORLD_COLORS[worldColor] || WORLD_COLORS.gray;

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className={cn('flex-shrink-0 rounded-lg p-2', colors.bg)}>
          <Quote className={cn('w-4 h-4', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          {/* World badge + questionnaire source indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
              {worldName}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
              {locale === 'he' ? 'מהשאלון' : 'Questionnaire'}
            </span>
          </div>
          <h4
            dir="auto"
            className="font-semibold text-sm text-gray-800 mb-2 flex items-center justify-between gap-2 text-start"
          >
            <span className="flex-1 break-words hyphens-auto overflow-wrap-anywhere min-w-0">
              {answer.question}
            </span>
            {answer.isVisible === false && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs cursor-default">
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
              'rounded-lg bg-gray-50 p-3 sm:p-4',
              direction === 'rtl'
                ? `border-r-2 ${colors.borderSide}`
                : `border-l-2 ${colors.borderSide}`
            )}
          >
            {answer.questionType === 'budgetAllocation' &&
            typeof answer.rawValue === 'object' &&
            answer.rawValue &&
            !Array.isArray(answer.rawValue) ? (
              (() => {
                const translatedData = answer.displayText
                  .split(' | ')
                  .reduce(
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
              <p className="text-sm text-gray-700 leading-relaxed italic break-words overflow-wrap-anywhere">
                {answer.displayText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireItem;
