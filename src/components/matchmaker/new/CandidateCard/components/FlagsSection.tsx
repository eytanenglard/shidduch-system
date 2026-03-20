// FlagsSection.tsx — Green/red flags with show more/less

import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const MAX_FLAGS_VISIBLE = 3;

interface FlagsSectionProps {
  greenFlags: string[];
  redFlags: string[];
  showAllFlags: boolean;
  onToggleShowAll: () => void;
}

const FlagsSection: React.FC<FlagsSectionProps> = ({
  greenFlags,
  redFlags,
  showAllFlags,
  onToggleShowAll,
}) => {
  const totalFlags = greenFlags.length + redFlags.length;
  if (totalFlags === 0) return null;

  return (
    <div className="pt-2 border-t border-gray-100">
      <div className="flex flex-wrap gap-1 justify-end">
        {/* Green flags */}
        {greenFlags
          .slice(0, showAllFlags ? undefined : MAX_FLAGS_VISIBLE)
          .map((flag, i) => (
            <span
              key={`g-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-medium"
            >
              <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
              {flag}
            </span>
          ))}

        {/* Red flags */}
        {redFlags
          .slice(0, showAllFlags ? undefined : Math.max(0, MAX_FLAGS_VISIBLE - greenFlags.length))
          .map((flag, i) => (
            <span
              key={`r-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200/60 text-red-700 text-[11px] font-medium"
            >
              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
              {flag}
            </span>
          ))}

        {/* Show more / less */}
        {totalFlags > MAX_FLAGS_VISIBLE && (
          <button
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100"
            onClick={(e) => { e.stopPropagation(); onToggleShowAll(); }}
          >
            {showAllFlags ? '−' : `+${totalFlags - MAX_FLAGS_VISIBLE}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(FlagsSection);
