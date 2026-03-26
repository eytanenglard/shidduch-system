'use client';

import React from 'react';
import {
  Bot,
  Wand2,
  TrendingUp,
  Network,
  Compass,
} from 'lucide-react';
import { UserAiAnalysisDialog } from '../../dialogs/UserAiAnalysisDialog';
import type { CompatibilityTabProps } from '../types/modal.types';

const CompatibilityTab: React.FC<CompatibilityTabProps> = ({
  targetPartyId,
  isDemo,
  demoAnalysisData,
  currentUserName,
  suggestedUserName,
  locale,
  dict,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6 p-6">
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mx-auto shadow-xl">
          <Bot className="w-14 h-14 text-teal-600" />
        </div>
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="space-y-3 max-w-xl">
        <h3 className="text-2xl font-bold text-gray-800">
          {dict.aiAnalysisCta.title}
        </h3>
        <p className="text-base text-gray-600 leading-relaxed">
          {dict.aiAnalysisCta.description}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{dict.aiAnalysisCta.feature1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Network className="w-4 h-4 text-teal-500" />
            <span>{dict.aiAnalysisCta.feature2}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-500" />
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
  );
};

export default CompatibilityTab;
