// src/components/matchmaker/suggestions/list/ManagerSuggestionsList.tsx

import React, { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import type {
  Suggestion,
  SuggestionFilters,
  ActionAdditionalData,
} from '@/types/suggestions';
import SuggestionCard from '../cards/SuggestionCard';
import type { MatchmakerPageDictionary } from '@/types/dictionary';

type SuggestionActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder';

interface ManagerSuggestionsListProps {
  suggestions: Suggestion[];
  filters: SuggestionFilters;
  searchQuery: string;
  type: 'active' | 'pending' | 'history';
  onAction: (
    actionType: SuggestionActionType,
    data: { suggestion: Suggestion } & ActionAdditionalData
  ) => void;
  dict: MatchmakerPageDictionary['suggestionsDashboard'];
}

const ManagerSuggestionsList: React.FC<ManagerSuggestionsListProps> = ({
  suggestions,
  filters,
  searchQuery,
  type,
  onAction,
  dict,
}) => {
  const listDict = dict.managerSuggestionsList;

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((suggestion) => {
      // Base status filter
      if (
        type === 'active' &&
        [
          'CLOSED',
          'CANCELLED',
          'EXPIRED',
          'FIRST_PARTY_DECLINED',
          'SECOND_PARTY_DECLINED',
        ].includes(suggestion.status)
      ) {
        return false;
      }
      if (type === 'pending' && !suggestion.status.includes('PENDING')) {
        return false;
      }
      if (
        type === 'history' &&
        ![
          'CLOSED',
          'CANCELLED',
          'EXPIRED',
          'FIRST_PARTY_DECLINED',
          'SECOND_PARTY_DECLINED',
          'MARRIED',
          'ENGAGED',
        ].includes(suggestion.status)
      ) {
        return false;
      }

      // Search query
      if (searchQuery && suggestion.firstParty && suggestion.secondParty) {
        const searchTerm = searchQuery.toLowerCase();
        const searchableText =
          `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} ${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} ${suggestion.matchingReason || ''}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Priority filter
      if (
        filters.priority?.length &&
        !filters.priority.includes(suggestion.priority)
      ) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const createdAt = new Date(suggestion.createdAt);
        if (
          createdAt < filters.dateRange.start ||
          (filters.dateRange.end && createdAt > filters.dateRange.end)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [suggestions, filters, searchQuery, type]);

  if (filteredSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
        <Users className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">
          {listDict.emptyState.title}
        </h3>
        <p>{listDict.emptyState.description}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] rounded-md border p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredSuggestions.map((suggestion) => {
          if (!suggestion.firstParty || !suggestion.secondParty) {
            return null; // Safety check for corrupted data
          }
          return (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={(type, suggestionData, additionalData) =>
                onAction(type, {
                  suggestion: suggestionData,
                  ...additionalData,
                })
              }
              dict={dict.suggestionCard}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ManagerSuggestionsList;
