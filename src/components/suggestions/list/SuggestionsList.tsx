// src/components/suggestions/list/SuggestionsList.tsx

'use client';
import React, { useState, useMemo } from 'react';
import { Search, XCircle, Clock, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SuggestionRow from '../cards/SuggestionRow';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsDictionary } from '@/types/dictionary';

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  isHistory?: boolean;
  isLoading?: boolean;
  className?: string;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline' | 'interested'
  ) => void;
  onOpenDetails: (suggestion: ExtendedMatchSuggestion) => void;
  isUserInActiveProcess?: boolean;
  suggestionsDict: SuggestionsDictionary;
}

// --- Clean Empty State ---
const EmptyState: React.FC<{
  isFiltered: boolean;
  isHistory: boolean;
  onClearFilters: () => void;
  dict: SuggestionsDictionary['list']['emptyState'];
  locale: 'he' | 'en';
}> = ({ isFiltered, isHistory, onClearFilters, dict, locale }) => {
  const isRtl = locale === 'he';

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {isFiltered ? (
          <Search className="w-8 h-8 text-gray-400" />
        ) : isHistory ? (
          <Clock className="w-8 h-8 text-gray-400" />
        ) : (
          <Heart className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {isFiltered
          ? dict.noResultsTitle
          : isHistory
            ? dict.noHistoryTitle
            : dict.noActiveTitle}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">
        {isFiltered
          ? dict.noResultsDescription
          : isHistory
            ? dict.noHistoryDescription
            : dict.noActiveDescription}
      </p>

      {/* Working indicator for non-history empty state */}
      {!isFiltered && !isHistory && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 rounded-lg border border-teal-100">
          <div className="flex gap-1">
            {[0, 0.3, 0.6].map((delay, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-teal-700 font-medium">
            {isRtl
              ? 'השדכן/ית שלך עובד/ת על הצעות חדשות'
              : 'Your matchmaker is working on new suggestions'}
          </span>
        </div>
      )}

      {isFiltered && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="rounded-lg border-gray-200"
        >
          <XCircle className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
          {dict.clearFilters}
        </Button>
      )}
    </div>
  );
};

// --- Main Component ---
const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions: initialSuggestions,
  isHistory = false,
  isLoading = false,
  userId,
  locale,
  className,
  onActionRequest,
  onOpenDetails,
  isUserInActiveProcess,
  suggestionsDict,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isRtl = locale === 'he';

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return initialSuggestions;

    const query = searchQuery.toLowerCase();
    return initialSuggestions.filter((suggestion) => {
      const targetParty =
        suggestion.firstPartyId === userId
          ? suggestion.secondParty
          : suggestion.firstParty;
      return (
        targetParty.firstName.toLowerCase().includes(query) ||
        targetParty.lastName.toLowerCase().includes(query) ||
        targetParty.profile?.city?.toLowerCase().includes(query) ||
        targetParty.profile?.occupation?.toLowerCase().includes(query)
      );
    });
  }, [initialSuggestions, searchQuery, userId]);

  const handleStatusAction = (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline' | 'interested'
  ) => {
    onActionRequest(suggestion, action);
  };

  const clearFilters = () => setSearchQuery('');

  // Loading skeleton
  if (isLoading && initialSuggestions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search - only show when 4+ suggestions */}
      {initialSuggestions.length > 3 && (
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4',
              isRtl ? 'right-3' : 'left-3'
            )}
          />
          <Input
            type="text"
            placeholder={suggestionsDict.list.controls.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'h-10 rounded-lg border-gray-200 focus:border-teal-300 focus:ring-teal-200 text-sm',
              isRtl ? 'pr-10 text-right' : 'pl-10'
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-6 w-6',
                isRtl ? 'left-2' : 'right-2'
              )}
              onClick={clearFilters}
            >
              <XCircle className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          )}
        </div>
      )}

      {/* Results count when filtering */}
      {searchQuery && filteredSuggestions.length > 0 && (
        <p className="text-xs text-gray-500">
          {filteredSuggestions.length} / {initialSuggestions.length}
        </p>
      )}

      {filteredSuggestions.length === 0 ? (
        <EmptyState
          isFiltered={searchQuery !== ''}
          isHistory={isHistory}
          onClearFilters={clearFilters}
          dict={suggestionsDict.list.emptyState}
          locale={locale}
        />
      ) : (
        <div className="space-y-2">
          {filteredSuggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.id}
              suggestion={suggestion}
              userId={userId}
              locale={locale}
              onClick={onOpenDetails}
              onApprove={(s) => handleStatusAction(s, 'approve')}
              onInterested={(s) => handleStatusAction(s, 'interested')}
              onDecline={(s) => handleStatusAction(s, 'decline')}
              isHistory={isHistory}
              isUserInActiveProcess={isUserInActiveProcess}
              dict={suggestionsDict.card}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;
