import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

import type { Suggestion, SuggestionFilters } from "@/types/suggestions";
import SuggestionDetailsDialog from "../details/SuggestionDetailsDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManagerSuggestionsListProps {
  suggestions: Suggestion[];
  filters: SuggestionFilters;
  searchQuery: string;
  type: "active" | "pending" | "history";
  onSuggestionDeleted?: (id: string) => void;
}

const ManagerSuggestionsList: React.FC<ManagerSuggestionsListProps> = ({
  suggestions,
  filters,
  searchQuery,
  type,
  onSuggestionDeleted,
}) => {
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
        type === "active" &&
        ["CLOSED", "CANCELLED", "EXPIRED"].includes(suggestion.status)
      ) {
        return false;
      }
      if (type === "pending" && !suggestion.status.includes("PENDING")) {
        return false;
      }
      if (
        type === "history" &&
        !["CLOSED", "CANCELLED", "EXPIRED"].includes(suggestion.status)
      ) {
        return false;
      }

      // Search query
      if (searchQuery && suggestion.firstParty && suggestion.secondParty) {
        const searchTerm = searchQuery.toLowerCase();
        const searchableText = `
          ${suggestion.firstParty.firstName} 
          ${suggestion.firstParty.lastName}
          ${suggestion.secondParty.firstName}
          ${suggestion.secondParty.lastName}
          ${suggestion.matchingReason || ""}
        `.toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
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
          createdAt > filters.dateRange.end
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
        `/api/suggestions/${suggestionToDelete}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete suggestion");
      }

      toast.success("ההצעה נמחקה בהצלחה");
      if (onSuggestionDeleted) {
        onSuggestionDeleted(suggestionToDelete);
      }
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      toast.error("שגיאה במחיקת ההצעה");
    } finally {
      setShowDeleteDialog(false);
      setSuggestionToDelete(null);
    }
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} for suggestion ${selectedSuggestion?.id}`);
  };

  if (filteredSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="w-12 h-12 mb-4" />
        <p>לא נמצאו הצעות</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
        <div className="p-4 space-y-4">
          {filteredSuggestions.map((suggestion) => {
            if (!suggestion.firstParty || !suggestion.secondParty) {
              return null;
            }

            return (
              <Card
                key={suggestion.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                {/* Rest of the JSX remains the same */}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleAction}
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
