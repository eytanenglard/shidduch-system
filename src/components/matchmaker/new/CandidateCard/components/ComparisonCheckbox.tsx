// ComparisonCheckbox.tsx — Comparison checkbox with suggestion-blocked state

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';
import type { Candidate } from '../../types/candidates';

interface ComparisonCheckboxProps {
  candidate: CandidateWithAiData;
  isSelectableForComparison: boolean;
  isSelectedForComparison: boolean;
  isSuggestionBlocked: boolean;
  hasExistingSuggestion: boolean;
  suggestionOverride: boolean;
  onToggleComparison?: (candidate: Candidate, e: React.MouseEvent) => void;
  onOverride: () => void;
  dict: MinimalCardDict;
}

const ComparisonCheckboxComponent: React.FC<ComparisonCheckboxProps> = ({
  candidate,
  isSelectableForComparison,
  isSelectedForComparison,
  isSuggestionBlocked,
  hasExistingSuggestion,
  suggestionOverride,
  onToggleComparison,
  onOverride,
  dict,
}) => {
  if (!isSelectableForComparison || !onToggleComparison) return null;

  return (
    <div
      className={cn(
        'absolute top-12 end-3 z-30 transition-all duration-200',
        isSelectedForComparison || hasExistingSuggestion
          ? 'opacity-100'
          : 'opacity-100 lg:opacity-0 group-hover:opacity-100'
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isSuggestionBlocked) return;
        onToggleComparison(candidate, e as unknown as React.MouseEvent);
      }}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      {isSuggestionBlocked ? (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl shadow-lg cursor-not-allowed">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-xs font-bold text-red-600 select-none whitespace-nowrap">
              {dict.existingSuggestion?.blocked ?? 'בתהליך פעיל'}
            </span>
          </div>
          <button
            className="text-[10px] text-gray-400 hover:text-gray-600 underline px-1 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onOverride(); }}
          >
            {dict.existingSuggestion?.override ?? 'בחר בכל זאת'}
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 border',
            isSelectedForComparison
              ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 scale-105'
              : hasExistingSuggestion && suggestionOverride
                ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                : 'bg-white/95 border-white/50 hover:bg-white hover:scale-105'
          )}
        >
          <Checkbox
            id={`compare-${candidate.id}`}
            checked={isSelectedForComparison}
            onCheckedChange={() => {}}
            className="border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 w-4 h-4"
          />
          <label htmlFor={`compare-${candidate.id}`} className="text-xs font-bold text-gray-700 cursor-pointer select-none">
            {dict.compare}
          </label>
        </div>
      )}
    </div>
  );
};

export default React.memo(ComparisonCheckboxComponent);
