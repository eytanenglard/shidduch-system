// DealBreakersBadges.tsx — Red lines & strong preferences display

import React from 'react';
import { ShieldX, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DealBreaker {
  type: string;
  description?: string;
  operator?: string;
  value?: any;
  values?: any[];
  penalty?: number;
}

interface DealBreakersBadgesProps {
  hard: DealBreaker[];
  soft: DealBreaker[];
}

const DEAL_BREAKER_TYPE_LABELS: Record<string, string> = {
  RELIGIOUS_LEVEL: 'רמת דתיות',
  HAS_CHILDREN: 'ילדים',
  HEAD_COVERING: 'כיסוי ראש',
  KIPPAH_TYPE: 'כיפה',
  HEIGHT_MIN: 'גובה מינ.',
  HEIGHT_MAX: 'גובה מקס.',
  AGE_OUTSIDE_RANGE: 'טווח גילאים',
  ETHNIC_PREFERENCE: 'מוצא',
  LANGUAGE: 'שפה',
  SMOKING: 'עישון',
  MARITAL_STATUS: 'מצב משפחתי',
  EDUCATION_LEVEL: 'השכלה',
  BODY_TYPE: 'מבנה גוף',
  LOCATION: 'מיקום',
};

function getDealBreakerLabel(db: DealBreaker): string {
  return db.description || DEAL_BREAKER_TYPE_LABELS[db.type] || db.type;
}

const MAX_VISIBLE = 3;

const DealBreakersBadges: React.FC<DealBreakersBadgesProps> = ({ hard, soft }) => {
  if (hard.length === 0 && soft.length === 0) return null;

  const visibleHard = hard.slice(0, MAX_VISIBLE);
  const visibleSoft = soft.slice(0, Math.max(0, MAX_VISIBLE - visibleHard.length));
  const overflowCount = (hard.length + soft.length) - (visibleHard.length + visibleSoft.length);

  return (
    <div className="flex items-center gap-1 flex-wrap pt-1">
      {visibleHard.map((db, i) => (
        <span
          key={`h-${i}`}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 border border-red-200 text-red-700"
        >
          <ShieldX className="w-2.5 h-2.5" />
          {getDealBreakerLabel(db)}
        </span>
      ))}
      {visibleSoft.map((db, i) => (
        <span
          key={`s-${i}`}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 border border-orange-200 text-orange-700"
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          {getDealBreakerLabel(db)}
        </span>
      ))}
      {overflowCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 border border-gray-200 text-gray-600 cursor-default">
                +{overflowCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px]">
              <div className="space-y-1 text-xs">
                {hard.slice(MAX_VISIBLE).map((db, i) => (
                  <div key={`th-${i}`} className="flex items-center gap-1 text-red-600">
                    <ShieldX className="w-3 h-3 shrink-0" />
                    {getDealBreakerLabel(db)}
                  </div>
                ))}
                {soft.slice(Math.max(0, MAX_VISIBLE - visibleHard.length)).map((db, i) => (
                  <div key={`ts-${i}`} className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {getDealBreakerLabel(db)}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default React.memo(DealBreakersBadges);
