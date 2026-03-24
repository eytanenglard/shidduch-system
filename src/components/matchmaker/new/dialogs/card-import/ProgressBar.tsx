'use client';

import React from 'react';

interface ProgressBarProps {
  filled: number;
  analyzed: number;
  saved: number;
  total: number;
  errors: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  filled,
  analyzed,
  saved,
  total,
  errors,
}) => {
  const pctFilled = total > 0 ? (filled / total) * 100 : 0;
  const pctAnalyzed = total > 0 ? (analyzed / total) * 100 : 0;
  const pctSaved = total > 0 ? (saved / total) * 100 : 0;

  if (filled === 0 && analyzed === 0 && saved === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 px-0.5">
        <div className="flex items-center gap-3">
          {filled > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {filled} תוכן
            </span>
          )}
          {analyzed > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              {analyzed} נותחו
            </span>
          )}
          {saved > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {saved} נשמרו
            </span>
          )}
          {errors > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              {errors} שגיאות
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className="bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${pctSaved}%` }}
        />
        <div
          className="bg-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, pctAnalyzed - pctSaved)}%` }}
        />
        <div
          className="bg-blue-300 transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, pctFilled - pctAnalyzed)}%` }}
        />
      </div>
    </div>
  );
};
