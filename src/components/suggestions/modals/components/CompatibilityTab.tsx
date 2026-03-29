'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import MatchCompatibilityView from '../../compatibility/MatchCompatibilityView';
import AiInsightSummaryCard from '../../compatibility/AiInsightSummaryCard';
import type { CompatibilityTabProps } from '../types/modal.types';

const CompatibilityTab: React.FC<CompatibilityTabProps> = ({
  firstParty,
  secondParty,
  matchingReason,
  targetPartyId,
  isDemo,
  demoAnalysisData,
  currentUserName,
  suggestedUserName,
  locale,
  enumLabels,
  dict,
}) => {
  const isHe = locale === 'he';

  return (
    <div className="space-y-4 p-1">
      {/* AI Insight — Smart Summary Card (Layer 1) */}
      <AiInsightSummaryCard
        suggestedUserId={targetPartyId}
        dict={dict.aiInsight}
        isDemo={isDemo}
        demoAnalysisData={demoAnalysisData}
        currentUserName={currentUserName}
        suggestedUserName={suggestedUserName}
        locale={locale}
      />

      {/* Matchmaker reason — compact callout */}
      {matchingReason && (
        <div
          className="flex items-start gap-2.5 px-3.5 py-2.5 bg-orange-50/70 rounded-lg border border-orange-100"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          <Brain className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-orange-700 mb-0.5">
              {dict.compatibility.matchmakerRationaleTitle}
            </p>
            <p className="text-sm text-orange-900/80 leading-relaxed">
              {matchingReason}
            </p>
          </div>
        </div>
      )}

      {/* Compact compatibility data */}
      <MatchCompatibilityView
        firstParty={firstParty}
        secondParty={secondParty}
        dict={dict.compatibility}
        enumLabels={enumLabels}
      />
    </div>
  );
};

export default CompatibilityTab;
