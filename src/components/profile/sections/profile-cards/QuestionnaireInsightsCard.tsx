'use client';

import React from 'react';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { EditableCard } from '@/components/profile/fields';
import { ProfileSectionDict } from '@/types/dictionary';

interface QuestionnaireInsightsCardProps {
  neshamaInsightTldr?: string | null;
  dict: ProfileSectionDict;
  direction: 'rtl' | 'ltr';
  onScrollToInsight?: () => void;
  viewOnly?: boolean;
}

const QuestionnaireInsightsCard: React.FC<QuestionnaireInsightsCardProps> = ({
  neshamaInsightTldr,
  dict,
  direction,
  onScrollToInsight,
  viewOnly = false,
}) => {
  const soulMapDict = dict.cards.soulMapSummary;
  if (!soulMapDict) return null;

  // In viewOnly mode (matchmaker), only show if there's a tldr — no CTA
  if (viewOnly && !neshamaInsightTldr) return null;

  const isRTL = direction === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // State: Has AI report with tldr
  if (neshamaInsightTldr) {
    return (
      <EditableCard
        icon={<Sparkles className="w-4 h-4 text-teal-600" />}
        title={soulMapDict.title}
        gradientFrom="from-teal-50/60 to-cyan-50/60"
        iconGradient="from-teal-500/10 to-teal-600/10"
        className="border-teal-200/40 hover:border-teal-300/50"
        contentClassName="!p-4 md:!p-5"
      >
          <p className="text-gray-700 leading-relaxed text-sm">
            {neshamaInsightTldr}
          </p>
          {onScrollToInsight && (
            <button
              type="button"
              onClick={onScrollToInsight}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              {soulMapDict.viewFullReport}
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          )}
      </EditableCard>
    );
  }

  // State: No report yet — CTA
  return (
    <EditableCard
      icon={<Sparkles className="w-4 h-4 text-teal-600" />}
      title={soulMapDict.title}
      gradientFrom="from-teal-50/60 to-cyan-50/60"
      iconGradient="from-teal-500/10 to-teal-600/10"
      className="border-teal-200/40 hover:border-teal-300/50"
      contentClassName="!p-4 md:!p-5 text-center"
    >
        <p className="text-sm font-medium text-gray-700 mb-1">
          {soulMapDict.noReportTitle}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {soulMapDict.noReportDescription}
        </p>
        {onScrollToInsight && (
          <button
            type="button"
            onClick={onScrollToInsight}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 px-4 py-2 rounded-full transition-all"
          >
            {soulMapDict.generateButton}
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        )}
    </EditableCard>
  );
};

export default React.memo(QuestionnaireInsightsCard);
