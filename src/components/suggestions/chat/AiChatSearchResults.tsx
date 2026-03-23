// src/components/suggestions/chat/AiChatSearchResults.tsx
// =============================================================================
// Anonymized match results display within chat
// =============================================================================

'use client';

import React from 'react';
import { MapPin, Briefcase, GraduationCap, Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  ageRange: string;
  generalArea: string;
  religiousLevel: string;
  educationLevel: string;
  careerField: string;
  matchScore: number;
  matchReason: string;
}

interface AiChatSearchResultsProps {
  results: SearchResult[];
  locale: 'he' | 'en';
}

export default function AiChatSearchResults({
  results,
  locale,
}: AiChatSearchResultsProps) {
  const isHebrew = locale === 'he';

  if (results.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="text-xs font-medium text-violet-600 flex items-center gap-1">
        <Star className="w-3.5 h-3.5" />
        {isHebrew
          ? `נמצאו ${results.length} התאמות פוטנציאליות`
          : `Found ${results.length} potential matches`}
      </div>

      {results.slice(0, 5).map((result, index) => (
        <div
          key={result.id}
          className={cn(
            'rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-1.5',
            'hover:border-violet-200 transition-colors'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-700">
              {isHebrew ? `התאמה ${index + 1}` : `Match ${index + 1}`}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
              {result.matchScore}%
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
            {result.ageRange && (
              <span>{result.ageRange}</span>
            )}
            {result.generalArea && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                {result.generalArea}
              </span>
            )}
            {result.careerField && (
              <span className="flex items-center gap-0.5">
                <Briefcase className="w-3 h-3 text-gray-400" />
                {result.careerField}
              </span>
            )}
            {result.educationLevel && (
              <span className="flex items-center gap-0.5">
                <GraduationCap className="w-3 h-3 text-gray-400" />
                {result.educationLevel}
              </span>
            )}
            {result.religiousLevel && (
              <span className="flex items-center gap-0.5">
                <Heart className="w-3 h-3 text-gray-400" />
                {result.religiousLevel}
              </span>
            )}
          </div>

          {/* Match reason */}
          {result.matchReason && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {result.matchReason}
            </p>
          )}
        </div>
      ))}

      {results.length > 5 && (
        <p className="text-xs text-gray-400 text-center">
          {isHebrew
            ? `ו-${results.length - 5} התאמות נוספות...`
            : `and ${results.length - 5} more matches...`}
        </p>
      )}

      <p className="text-[10px] text-gray-400 text-center mt-1">
        {isHebrew
          ? 'ההצעות יישלחו ביום ראשון או רביעי הקרוב'
          : 'Suggestions will be sent on the next Sunday or Wednesday'}
      </p>
    </div>
  );
}
