// FILENAME: src/app/components/matchmaker/suggestions/list/ManagerSuggestionsList.tsx

import React, { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import type {
  Suggestion,
  SuggestionFilters,
  ActionAdditionalData,
} from '@/types/suggestions';
import SuggestionDetailsDialog from '../details/SuggestionDetailsDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SuggestionCard from '../cards/SuggestionCard'; // Make sure this is imported

// Define a more specific action type to avoid 'any'
type SuggestionActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder'
  | 'sendReminder'
  | 'shareContacts'
  | 'scheduleMeeting'
  | 'viewMeetings'
  | 'exportHistory'
  | 'export'
  | 'resendToAll';

interface ManagerSuggestionsListProps {
  suggestions: Suggestion[];
  filters: SuggestionFilters;
  searchQuery: string;
  type: 'active' | 'pending' | 'history';
  onSuggestionDeleted?: (id: string) => void;
}

const ManagerSuggestionsList: React.FC<ManagerSuggestionsListProps> = ({
  suggestions,
  filters,
  searchQuery,
  type,
  onSuggestionDeleted,
}) => {
  const { data: session } = useSession();
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<string | null>(
    null
  );

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

  const confirmDelete = async () => {
    if (!suggestionToDelete) return;
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionToDelete}/delete`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete suggestion');
      toast.success('ההצעה נמחקה בהצלחה');
      if (onSuggestionDeleted) onSuggestionDeleted(suggestionToDelete);
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('שגיאה במחיקת ההצעה');
    } finally {
      setShowDeleteDialog(false);
      setSuggestionToDelete(null);
    }
  };

  const handleAction = (
    actionType: SuggestionActionType,
    data?: { suggestion: Suggestion } & ActionAdditionalData
  ) => {
    console.log(
      `Action '${actionType}' triggered for suggestion`,
      data?.suggestion?.id
    );
    if (actionType === 'view' && data?.suggestion) {
      setSelectedSuggestion(data.suggestion);
    }
    // Implement other actions like edit, message etc. here by setting state for their respective dialogs
  };

  if (filteredSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="w-12 h-12 mb-4" />
        <p>לא נמצאו הצעות התואמות את הסינון</p>
      </div>
    );
  }

  return (
    <>
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
                onAction={(type, suggestionData, additionalData) => {
                  if (type === 'view') {
                    setSelectedSuggestion(suggestionData);
                  } else if (type === 'delete') {
                    setSuggestionToDelete(suggestionData.id);
                    setShowDeleteDialog(true);
                  } else {
                    handleAction(type, {
                      suggestion: suggestionData,
                      ...additionalData,
                    });
                  }
                }}
              />
            );
          })}
        </div>
      </ScrollArea>

      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={(type, additionalData) =>
          handleAction(type, {
            suggestion: selectedSuggestion!,
            ...additionalData,
          })
        }
        userId={session?.user?.id || ''}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם את/ה בטוח/ה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את ההצעה לצמיתות ולא ניתן יהיה לשחזר אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManagerSuggestionsList;
