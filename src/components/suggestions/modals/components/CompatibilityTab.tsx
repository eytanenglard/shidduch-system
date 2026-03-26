'use client';

import React from 'react';
import {
  Bot,
  Wand2,
  TrendingUp,
  Network,
  Compass,
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
  return (
    <div className="space-y-8 p-2">
      {/* Matching reason preview */}
      {matchingReason && (
        <div className="flex items-start gap-3 p-4 bg-teal-50/60 rounded-xl border border-teal-100">
          <Sparkles className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
          <p className="text-sm text-teal-700 leading-relaxed italic">
            &quot;{matchingReason}&quot;
          </p>
        </div>
      )}

      {/* Real compatibility data from profiles */}
      <MatchCompatibilityView
        firstParty={firstParty}
        secondParty={secondParty}
        matchingReason={matchingReason}
        dict={dict.compatibility}
      />

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm text-gray-500 font-medium">
            {locale === 'he' ? 'רוצה לצלול עמוק יותר?' : 'Want to dive deeper?'}
          </span>
        </div>
      </div>

      {/* AI Analysis CTA */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mx-auto shadow-sm">
            <Bot className="w-12 h-12 text-teal-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
            <Wand2 className="w-4.5 h-4.5 text-white" />
          </div>
        </div>
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-bold text-gray-800">
            {dict.aiAnalysisCta.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {dict.aiAnalysisCta.description}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{dict.aiAnalysisCta.feature1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-teal-500" />
              <span>{dict.aiAnalysisCta.feature2}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-orange-500" />
              <span>{dict.aiAnalysisCta.feature3}</span>
            </div>
          </div>
        </div>
        <UserAiAnalysisDialog
          suggestedUserId={targetPartyId}
          dict={dict.aiAnalysis}
          isDemo={isDemo}
          demoAnalysisData={demoAnalysisData}
          currentUserName={currentUserName}
          suggestedUserName={suggestedUserName}
          locale={locale}
        />
      </div>
    </div>
  );
};

export default CompatibilityTab;
