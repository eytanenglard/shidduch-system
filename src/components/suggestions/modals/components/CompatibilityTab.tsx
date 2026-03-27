'use client';

import React from 'react';
import {
  Bot,
  Brain,
  Sparkles,
} from 'lucide-react';
import MatchCompatibilityView from '../../compatibility/MatchCompatibilityView';
import { UserAiAnalysisDialog } from '../../dialogs/UserAiAnalysisDialog';
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
  dict,
}) => {
  const isHe = locale === 'he';

  return (
    <div className="space-y-4 p-1">
      {/* AI Analysis — compact bar at top */}
      <div
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 via-white to-orange-50 rounded-xl border border-teal-200/60"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {dict.aiAnalysisCta.title.replace('🔮 ', '')}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {dict.aiAnalysisCta.feature1} · {dict.aiAnalysisCta.feature2} · {dict.aiAnalysisCta.feature3}
          </p>
        </div>
        <UserAiAnalysisDialog
          suggestedUserId={targetPartyId}
          dict={dict.aiAnalysis}
          isDemo={isDemo}
          demoAnalysisData={demoAnalysisData}
          currentUserName={currentUserName}
          suggestedUserName={suggestedUserName}
          locale={locale}
          compact
        />
      </div>

      {/* Matchmaker reason — compact callout (single instance, not duplicated) */}
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
      />
    </div>
  );
};

export default CompatibilityTab;
