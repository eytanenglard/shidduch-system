'use client';

import React from 'react';
import { Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiInsightBarProps {
  targetName: string;
  onRequestAiSummary: () => void;
  onNavigateToCompatibility: () => void;
  locale: 'he' | 'en';
  dict: {
    aiSummaryButton: string;
    compatibilityButton: string;
  };
}

const AiInsightBar: React.FC<AiInsightBarProps> = ({
  targetName,
  onRequestAiSummary,
  onNavigateToCompatibility,
  locale,
  dict,
}) => {
  const isHe = locale === 'he';

  return (
    <div
      className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-violet-50 via-white to-teal-50 rounded-xl border border-violet-200/60"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRequestAiSummary}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            'bg-violet-100 text-violet-700 border border-violet-200',
            'hover:bg-violet-200 hover:border-violet-300 hover:shadow-sm',
            'active:scale-[0.97]'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {dict.aiSummaryButton.replace('{{name}}', targetName)}
        </button>

        <button
          type="button"
          onClick={onNavigateToCompatibility}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            'bg-teal-100 text-teal-700 border border-teal-200',
            'hover:bg-teal-200 hover:border-teal-300 hover:shadow-sm',
            'active:scale-[0.97]'
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {dict.compatibilityButton}
        </button>
      </div>
    </div>
  );
};

export default AiInsightBar;
